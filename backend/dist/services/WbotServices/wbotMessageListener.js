"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessage = exports.wbotMessageListener = exports.handleMessageIntegration = exports.handleRating = exports.verifyRating = exports.verifyMessage = exports.verifyMediaMessage = exports.transferQueue = exports.keepOnlySpecifiedChars = exports.convertTextToSpeechAndSaveToFile = exports.getQuotedMessageId = exports.getQuotedMessage = exports.getBodyMessage = exports.makeid = exports.sendMessageLink = exports.sendMessageImage = exports.sleep = exports.validaCpfCnpj = exports.isNumeric = void 0;
const path_1 = __importStar(require("path"));
const util_1 = require("util");
const fs_1 = require("fs");
const Sentry = __importStar(require("@sentry/node"));
const lodash_1 = require("lodash");
const mime_types_1 = require("mime-types");
const baileys_1 = require("baileys");
const Contact_1 = __importDefault(require("../../models/Contact"));
const Ticket_1 = __importDefault(require("../../models/Ticket"));
const Message_1 = __importDefault(require("../../models/Message"));
const socket_1 = require("../../libs/socket");
const CreateMessageService_1 = __importDefault(require("../MessageServices/CreateMessageService"));
const logger_1 = require("../../utils/logger");
const CreateOrUpdateContactService_1 = __importDefault(require("../ContactServices/CreateOrUpdateContactService"));
const FindOrCreateTicketService_1 = __importDefault(require("../TicketServices/FindOrCreateTicketService"));
const ShowWhatsAppService_1 = __importDefault(require("../WhatsappService/ShowWhatsAppService"));
const UpdateTicketService_1 = __importDefault(require("../TicketServices/UpdateTicketService"));
const Mustache_1 = __importDefault(require("../../helpers/Mustache"));
const UserRating_1 = __importDefault(require("../../models/UserRating"));
const SendWhatsAppMessage_1 = __importDefault(require("./SendWhatsAppMessage"));
const moment_1 = __importDefault(require("moment"));
const Queue_1 = __importDefault(require("../../models/Queue"));
const QueueOption_1 = __importDefault(require("../../models/QueueOption"));
const FindOrCreateATicketTrakingService_1 = __importDefault(require("../TicketServices/FindOrCreateATicketTrakingService"));
const VerifyCurrentSchedule_1 = __importDefault(require("../CompanyService/VerifyCurrentSchedule"));
const User_1 = __importDefault(require("../../models/User"));
const Setting_1 = __importDefault(require("../../models/Setting"));
const cache_1 = require("../../libs/cache");
const providers_1 = require("./providers");
const Debounce_1 = require("../../helpers/Debounce");
const openai_1 = require("openai");
const FlowKeywordService_1 = __importDefault(require("../FlowBuilderService/FlowKeywordService"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const microsoft_cognitiveservices_speech_sdk_1 = require("microsoft-cognitiveservices-speech-sdk");
const typebotListener_1 = __importDefault(require("../TypebotServices/typebotListener"));
const ShowQueueIntegrationService_1 = __importDefault(require("../QueueIntegrationServices/ShowQueueIntegrationService"));
const FlowBuilder_1 = require("../../models/FlowBuilder");
const ActionsWebhookService_1 = require("../WebhookService/ActionsWebhookService");
const Webhook_1 = require("../../models/Webhook");
const date_fns_1 = require("date-fns");
const request = require("request");
const fs = require("fs");
const sessionsOpenAi = [];
const isNumeric = (value) => /^-?\d+$/.test(value);
exports.isNumeric = isNumeric;
const writeFileAsync = (0, util_1.promisify)(fs_1.writeFile);
const getTypeMessage = (msg) => {
    return (0, baileys_1.getContentType)(msg.message);
};
function hasCaption(title, fileName) {
    if (!title || !fileName)
        return false;
    const fileNameExtension = fileName.substring(fileName.lastIndexOf('.') + 1);
    return !fileName.includes(`${title}.${fileNameExtension}`);
}
function validaCpfCnpj(val) {
    if (val.length == 11) {
        var cpf = val.trim();
        cpf = cpf.replace(/\./g, "");
        cpf = cpf.replace("-", "");
        cpf = cpf.split("");
        var v1 = 0;
        var v2 = 0;
        var aux = false;
        for (var i = 1; cpf.length > i; i++) {
            if (cpf[i - 1] != cpf[i]) {
                aux = true;
            }
        }
        if (aux == false) {
            return false;
        }
        for (var i = 0, p = 10; cpf.length - 2 > i; i++, p--) {
            v1 += cpf[i] * p;
        }
        v1 = (v1 * 10) % 11;
        if (v1 == 10) {
            v1 = 0;
        }
        if (v1 != cpf[9]) {
            return false;
        }
        for (var i = 0, p = 11; cpf.length - 1 > i; i++, p--) {
            v2 += cpf[i] * p;
        }
        v2 = (v2 * 10) % 11;
        if (v2 == 10) {
            v2 = 0;
        }
        if (v2 != cpf[10]) {
            return false;
        }
        else {
            return true;
        }
    }
    else if (val.length == 14) {
        var cnpj = val.trim();
        cnpj = cnpj.replace(/\./g, "");
        cnpj = cnpj.replace("-", "");
        cnpj = cnpj.replace("/", "");
        cnpj = cnpj.split("");
        var v1 = 0;
        var v2 = 0;
        var aux = false;
        for (var i = 1; cnpj.length > i; i++) {
            if (cnpj[i - 1] != cnpj[i]) {
                aux = true;
            }
        }
        if (aux == false) {
            return false;
        }
        for (var i = 0, p1 = 5, p2 = 13; cnpj.length - 2 > i; i++, p1--, p2--) {
            if (p1 >= 2) {
                v1 += cnpj[i] * p1;
            }
            else {
                v1 += cnpj[i] * p2;
            }
        }
        v1 = v1 % 11;
        if (v1 < 2) {
            v1 = 0;
        }
        else {
            v1 = 11 - v1;
        }
        if (v1 != cnpj[12]) {
            return false;
        }
        for (var i = 0, p1 = 6, p2 = 14; cnpj.length - 1 > i; i++, p1--, p2--) {
            if (p1 >= 2) {
                v2 += cnpj[i] * p1;
            }
            else {
                v2 += cnpj[i] * p2;
            }
        }
        v2 = v2 % 11;
        if (v2 < 2) {
            v2 = 0;
        }
        else {
            v2 = 11 - v2;
        }
        if (v2 != cnpj[13]) {
            return false;
        }
        else {
            return true;
        }
    }
    else {
        return false;
    }
}
exports.validaCpfCnpj = validaCpfCnpj;
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function sleep(time) {
    await timeout(time);
}
exports.sleep = sleep;
const sendMessageImage = async (wbot, contact, ticket, url, caption) => {
    let sentMessage;
    try {
        sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
            image: url
                ? { url }
                : fs.readFileSync(`public/temp/${caption}-${makeid(10)}`),
            fileName: caption,
            caption: caption,
            mimetype: "image/jpeg"
        });
    }
    catch (error) {
        sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
            text: (0, Mustache_1.default)("Não consegui enviar a imagem, tente novamente!", contact)
        });
    }
    (0, exports.verifyMessage)(sentMessage, ticket, contact);
};
exports.sendMessageImage = sendMessageImage;
const sendMessageLink = async (wbot, contact, ticket, url, caption) => {
    let sentMessage;
    try {
        sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
            document: url
                ? { url }
                : fs.readFileSync(`public/temp/${caption}-${makeid(10)}`),
            fileName: caption,
            caption: caption,
            mimetype: "application/pdf"
        });
    }
    catch (error) {
        sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
            text: (0, Mustache_1.default)("Não consegui enviar o PDF, tente novamente!", contact)
        });
    }
    (0, exports.verifyMessage)(sentMessage, ticket, contact);
};
exports.sendMessageLink = sendMessageLink;
function makeid(length) {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
exports.makeid = makeid;
const getBodyButton = (msg) => {
    if (msg.key.fromMe &&
        msg?.message?.viewOnceMessage?.message?.buttonsMessage?.contentText) {
        let bodyMessage = `*${msg?.message?.viewOnceMessage?.message?.buttonsMessage?.contentText}*`;
        for (const buton of msg.message?.viewOnceMessage?.message?.buttonsMessage
            ?.buttons) {
            bodyMessage += `\n\n${buton.buttonText?.displayText}`;
        }
        return bodyMessage;
    }
    if (msg.key.fromMe && msg?.message?.viewOnceMessage?.message?.listMessage) {
        let bodyMessage = `*${msg?.message?.viewOnceMessage?.message?.listMessage?.description}*`;
        for (const buton of msg.message?.viewOnceMessage?.message?.listMessage
            ?.sections) {
            for (const rows of buton.rows) {
                bodyMessage += `\n\n${rows.title}`;
            }
        }
        return bodyMessage;
    }
};
const msgLocation = (image, latitude, longitude) => {
    if (image) {
        var b64 = Buffer.from(image).toString("base64");
        let data = `data:image/png;base64, ${b64} | https://maps.google.com/maps?q=${latitude}%2C${longitude}&z=17&hl=pt-BR|${latitude}, ${longitude} `;
        return data;
    }
};
const getBodyMessage = (msg) => {
    try {
        let type = getTypeMessage(msg);
        const types = {
            conversation: msg?.message?.conversation,
            editedMessage: msg?.message?.editedMessage?.message?.protocolMessage?.editedMessage
                ?.conversation,
            imageMessage: msg.message?.imageMessage?.caption,
            videoMessage: msg.message?.videoMessage?.caption,
            extendedTextMessage: msg.message?.extendedTextMessage?.text,
            buttonsResponseMessage: msg.message?.buttonsResponseMessage?.selectedButtonId,
            templateButtonReplyMessage: msg.message?.templateButtonReplyMessage?.selectedId,
            messageContextInfo: msg.message?.buttonsResponseMessage?.selectedButtonId ||
                msg.message?.listResponseMessage?.title,
            buttonsMessage: getBodyButton(msg) ||
                msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
            viewOnceMessage: getBodyButton(msg) ||
                msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
            stickerMessage: "sticker",
            contactMessage: msg.message?.contactMessage?.vcard,
            contactsArrayMessage: "varios contatos",
            //locationMessage: `Latitude: ${msg.message.locationMessage?.degreesLatitude} - Longitude: ${msg.message.locationMessage?.degreesLongitude}`,
            locationMessage: msgLocation(msg.message?.locationMessage?.jpegThumbnail, msg.message?.locationMessage?.degreesLatitude, msg.message?.locationMessage?.degreesLongitude),
            liveLocationMessage: `Latitude: ${msg.message?.liveLocationMessage?.degreesLatitude} - Longitude: ${msg.message?.liveLocationMessage?.degreesLongitude}`,
            documentMessage: msg.message?.documentMessage?.caption,
            documentWithCaptionMessage: msg.message?.documentWithCaptionMessage?.message?.documentMessage
                ?.caption,
            audioMessage: "Áudio",
            listMessage: getBodyButton(msg) || msg.message?.listResponseMessage?.title,
            listResponseMessage: msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
            reactionMessage: msg.message?.reactionMessage?.text || "reaction"
        };
        const objKey = Object.keys(types).find(key => key === type);
        if (!objKey) {
            logger_1.logger.warn(`#### Nao achou o type 152: ${type}
${JSON.stringify(msg)}`);
            Sentry.setExtra("Mensagem", { BodyMsg: msg.message, msg, type });
            Sentry.captureException(new Error("Novo Tipo de Mensagem em getTypeMessage"));
        }
        return types[type];
    }
    catch (error) {
        Sentry.setExtra("Error getTypeMessage", { msg, BodyMsg: msg.message });
        Sentry.captureException(error);
        console.log(error);
    }
};
exports.getBodyMessage = getBodyMessage;
const getQuotedMessage = (msg) => {
    const body = msg.message.imageMessage.contextInfo ||
        msg.message.videoMessage.contextInfo ||
        msg.message?.documentMessage ||
        msg.message.extendedTextMessage.contextInfo ||
        msg.message.buttonsResponseMessage.contextInfo ||
        msg.message.listResponseMessage.contextInfo ||
        msg.message.templateButtonReplyMessage.contextInfo ||
        msg.message.buttonsResponseMessage?.contextInfo ||
        msg?.message?.buttonsResponseMessage?.selectedButtonId ||
        msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        msg?.message?.listResponseMessage?.singleSelectReply.selectedRowId ||
        msg.message.listResponseMessage?.contextInfo;
    msg.message.senderKeyDistributionMessage;
    // testar isso
    return (0, baileys_1.extractMessageContent)(body[Object.keys(body).values().next().value]);
};
exports.getQuotedMessage = getQuotedMessage;
const getQuotedMessageId = (msg) => {
    const body = (0, baileys_1.extractMessageContent)(msg.message)[Object.keys(msg?.message).values().next().value];
    return body?.contextInfo?.stanzaId;
};
exports.getQuotedMessageId = getQuotedMessageId;
const getMeSocket = (wbot) => {
    return {
        id: (0, baileys_1.jidNormalizedUser)(wbot.user.id),
        name: wbot.user.name
    };
};
const getSenderMessage = (msg, wbot) => {
    const me = getMeSocket(wbot);
    if (msg.key.fromMe)
        return me.id;
    const senderId = msg.participant || msg.key.participant || msg.key.remoteJid || undefined;
    return senderId && (0, baileys_1.jidNormalizedUser)(senderId);
};
const getContactMessage = async (msg, wbot) => {
    const isGroup = msg.key.remoteJid.includes("g.us");
    const rawNumber = msg.key.remoteJid.replace(/\D/g, "");
    return isGroup
        ? {
            id: getSenderMessage(msg, wbot),
            name: msg.pushName
        }
        : {
            id: msg.key.remoteJid,
            name: msg.key.fromMe ? rawNumber : msg.pushName
        };
};
const downloadMedia = async (msg) => {
    let buffer;
    try {
        buffer = await (0, baileys_1.downloadMediaMessage)(msg, "buffer", {});
    }
    catch (err) {
        console.error("Erro ao baixar mídia:", err);
        // Trate o erro de acordo com as suas necessidades
    }
    let filename = msg.message?.documentMessage?.fileName || "";
    const mineType = msg.message?.imageMessage ||
        msg.message?.audioMessage ||
        msg.message?.videoMessage ||
        msg.message?.stickerMessage ||
        msg.message?.documentMessage ||
        msg.message?.documentWithCaptionMessage?.message?.documentMessage ||
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
            ?.imageMessage ||
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
    if (!mineType)
        console.log(msg);
    if (!filename) {
        const ext = (0, mime_types_1.extension)(mineType.mimetype);
        filename = `${new Date().getTime()}.${ext}`;
    }
    else {
        filename = `${new Date().getTime()}_${filename}`;
    }
    const media = {
        data: buffer,
        mimetype: mineType.mimetype,
        filename
    };
    return media;
};
const verifyContact = async (msgContact, wbot, companyId) => {
    let profilePicUrl;
    try {
        profilePicUrl = await wbot.profilePictureUrl(msgContact.id);
    }
    catch (e) {
        Sentry.captureException(e);
        profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
    }
    const contactData = {
        name: msgContact?.name || msgContact.id.replace(/\D/g, ""),
        number: msgContact.id.replace(/\D/g, ""),
        profilePicUrl,
        isGroup: msgContact.id.includes("g.us"),
        companyId,
        whatsappId: wbot.id
    };
    const contact = (0, CreateOrUpdateContactService_1.default)(contactData);
    return contact;
};
const verifyQuotedMessage = async (msg) => {
    if (!msg)
        return null;
    const quoted = (0, exports.getQuotedMessageId)(msg);
    if (!quoted)
        return null;
    const quotedMsg = await Message_1.default.findOne({
        where: { id: quoted }
    });
    if (!quotedMsg)
        return null;
    return quotedMsg;
};
const sanitizeName = (name) => {
    let sanitized = name.split(" ")[0];
    sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, "");
    return sanitized.substring(0, 60);
};
const convertTextToSpeechAndSaveToFile = (text, filename, subscriptionKey, serviceRegion, voice = "pt-BR-FabioNeural", audioToFormat = "mp3") => {
    return new Promise((resolve, reject) => {
        const speechConfig = microsoft_cognitiveservices_speech_sdk_1.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
        speechConfig.speechSynthesisVoiceName = voice;
        const audioConfig = microsoft_cognitiveservices_speech_sdk_1.AudioConfig.fromAudioFileOutput(`${filename}.wav`);
        const synthesizer = new microsoft_cognitiveservices_speech_sdk_1.SpeechSynthesizer(speechConfig, audioConfig);
        synthesizer.speakTextAsync(text, result => {
            if (result) {
                convertWavToAnotherFormat(`${filename}.wav`, `${filename}.${audioToFormat}`, audioToFormat)
                    .then(output => {
                    resolve();
                })
                    .catch(error => {
                    console.error(error);
                    reject(error);
                });
            }
            else {
                reject(new Error("No result from synthesizer"));
            }
            synthesizer.close();
        }, error => {
            console.error(`Error: ${error}`);
            synthesizer.close();
            reject(error);
        });
    });
};
exports.convertTextToSpeechAndSaveToFile = convertTextToSpeechAndSaveToFile;
const convertWavToAnotherFormat = (inputPath, outputPath, toFormat) => {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)()
            .input(inputPath)
            .toFormat(toFormat)
            .on("end", () => resolve(outputPath))
            .on("error", (err) => reject(new Error(`Error converting file: ${err.message}`)))
            .save(outputPath);
    });
};
const deleteFileSync = (path) => {
    try {
        fs.unlinkSync(path);
    }
    catch (error) {
        console.error("Erro ao deletar o arquivo:", error);
    }
};
const keepOnlySpecifiedChars = (str) => {
    return str.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚâêîôûÂÊÎÔÛãõÃÕçÇ!?.,;:\s]/g, "");
};
exports.keepOnlySpecifiedChars = keepOnlySpecifiedChars;
const handleOpenAi = async (msg, wbot, ticket, contact, mediaSent, ticketTraking = null, openAiSettings = null) => {
    // REGRA PARA DESABILITAR O BOT PARA ALGUM CONTATO
    if (contact.disableBot) {
        return;
    }
    const bodyMessage = (0, exports.getBodyMessage)(msg);
    if (!bodyMessage)
        return;
    let { prompt } = await (0, ShowWhatsAppService_1.default)(wbot.id, ticket.companyId);
    if (openAiSettings)
        prompt = openAiSettings;
    if (!prompt && !(0, lodash_1.isNil)(ticket?.queue?.prompt)) {
        prompt = ticket.queue.prompt;
    }
    if (!prompt)
        return;
    if (msg.messageStubType)
        return;
    const publicFolder = path_1.default.resolve(__dirname, "..", "..", "..", "public");
    let openai;
    const openAiIndex = sessionsOpenAi.findIndex(s => s.id === wbot.id);
    if (openAiIndex === -1) {
        const configuration = new openai_1.Configuration({
            apiKey: prompt.apiKey
        });
        openai = new openai_1.OpenAIApi(configuration);
        openai.id = wbot.id;
        sessionsOpenAi.push(openai);
    }
    else {
        openai = sessionsOpenAi[openAiIndex];
    }
    let maxMessages = prompt.maxMessages;
    const messages = await Message_1.default.findAll({
        where: { ticketId: ticket.id },
        order: [["createdAt", "DESC"]],
        limit: maxMessages
    });
    const promptSystem = `Nas respostas utilize o nome ${sanitizeName(contact.name || "Amigo(a)")} para identificar o cliente.\nSua resposta deve usar no máximo ${prompt.maxTokens} tokens e cuide para não truncar o final.\nSempre que possível, mencione o nome dele para ser mais personalizado o atendimento e mais educado. Quando a resposta requer uma transferência para o setor de atendimento, comece sua resposta com 'Ação: Transferir para o setor de atendimento'.\n
  ${prompt.prompt}\n`;
    let messagesOpenAi = [];
    if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
        messagesOpenAi = [];
        messagesOpenAi.push({ role: "system", content: promptSystem });
        for (let i = 0; i < Math.min(maxMessages, messages.length); i++) {
            const message = messages[i];
            if (message.mediaType === "conversation" ||
                message.mediaType === "extendedTextMessage") {
                if (message.fromMe) {
                    messagesOpenAi.push({ role: "assistant", content: message.body });
                }
                else {
                    messagesOpenAi.push({ role: "user", content: message.body });
                }
            }
        }
        messagesOpenAi.push({ role: "user", content: bodyMessage });
        const chat = await openai.createChatCompletion({
            model: prompt.model,
            messages: messagesOpenAi,
            max_tokens: prompt.maxTokens,
            temperature: prompt.temperature
        });
        let response = chat.data.choices[0].message?.content;
        if (response?.includes("Ação: Transferir para o setor de atendimento")) {
            await (0, exports.transferQueue)(prompt.queueId, ticket, contact);
            response = response
                .replace("Ação: Transferir para o setor de atendimento", "")
                .trim();
        }
        const sentMessage = await wbot.sendMessage(msg.key.remoteJid, {
            text: response
        });
        await (0, exports.verifyMessage)(sentMessage, ticket, contact);
        /*
        if (prompt.voice === "texto") {
          const sentMessage = await wbot.sendMessage(msg.key.remoteJid!, {
            text: response!
          });
          await verifyMessage(sentMessage!, ticket, contact);
        } else {
          const fileNameWithOutExtension = `${ticket.id}_${Date.now()}`;
          convertTextToSpeechAndSaveToFile(
            keepOnlySpecifiedChars(response!),
            `${publicFolder}/${fileNameWithOutExtension}`,
            prompt.voiceKey,
            prompt.voiceRegion,
            prompt.voice,
            "mp3"
          ).then(async () => {
            try {
              const sendMessage = await wbot.sendMessage(msg.key.remoteJid!, {
                audio: { url: `${publicFolder}/${fileNameWithOutExtension}.mp3` },
                mimetype: "audio/mpeg",
                ptt: true
              });
              await verifyMediaMessage(sendMessage!, ticket, contact);
              deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
              deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.wav`);
            } catch (error) {
              console.log(`Erro para responder com audio: ${error}`);
            }
          });
        }*/
    }
    else if (msg.message?.audioMessage) {
        const mediaUrl = mediaSent.mediaUrl.split("/").pop();
        const file = fs.createReadStream(`${publicFolder}/${mediaUrl}`);
        const transcription = await openai.createTranscription(file, "whisper-1");
        messagesOpenAi = [];
        messagesOpenAi.push({ role: "system", content: promptSystem });
        for (let i = 0; i < Math.min(maxMessages, messages.length); i++) {
            const message = messages[i];
            if (message.mediaType === "conversation" ||
                message.mediaType === "extendedTextMessage") {
                if (message.fromMe) {
                    messagesOpenAi.push({ role: "assistant", content: message.body });
                }
                else {
                    messagesOpenAi.push({ role: "user", content: message.body });
                }
            }
        }
        messagesOpenAi.push({ role: "user", content: transcription.data.text });
        const chat = await openai.createChatCompletion({
            model: prompt.model,
            messages: messagesOpenAi,
            max_tokens: prompt.maxTokens,
            temperature: prompt.temperature
        });
        let response = chat.data.choices[0].message?.content;
        if (response?.includes("Ação: Transferir para o setor de atendimento")) {
            await (0, exports.transferQueue)(prompt.queueId, ticket, contact);
            response = response
                .replace("Ação: Transferir para o setor de atendimento", "")
                .trim();
        }
        /*if (prompt.voice === "texto") {
          const sentMessage = await wbot.sendMessage(msg.key.remoteJid!, {
            text: response!
          });
          await verifyMessage(sentMessage!, ticket, contact);
        } else {
          const fileNameWithOutExtension = `${ticket.id}_${Date.now()}`;
          convertTextToSpeechAndSaveToFile(
            keepOnlySpecifiedChars(response!),
            `${publicFolder}/${fileNameWithOutExtension}`,
            prompt.voiceKey,
            prompt.voiceRegion,
            prompt.voice,
            "mp3"
          ).then(async () => {
            try {
              const sendMessage = await wbot.sendMessage(msg.key.remoteJid!, {
                audio: { url: `${publicFolder}/${fileNameWithOutExtension}.mp3` },
                mimetype: "audio/mpeg",
                ptt: true
              });
              await verifyMediaMessage(sendMessage!, ticket, contact);
              deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
              deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.wav`);
            } catch (error) {
              console.log(`Erro para responder com audio: ${error}`);
            }
          });
        }*/
    }
    messagesOpenAi = [];
};
const transferQueue = async (queueId, ticket, contact) => {
    await (0, UpdateTicketService_1.default)({
        ticketData: { queueId: queueId },
        ticketId: ticket.id,
        companyId: ticket.companyId
    });
};
exports.transferQueue = transferQueue;
const verifyMediaMessage = async (msg, ticket, contact, ticketTraking = null, isForwarded = false, isPrivate = false, wbot = null) => {
    const io = (0, socket_1.getIO)();
    const quotedMsg = await verifyQuotedMessage(msg);
    const media = await downloadMedia(msg);
    if (!media) {
        throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
    }
    if (!media.filename) {
        const ext = (0, mime_types_1.extension)(media.mimetype);
        media.filename = `${new Date().getTime()}.${ext}`;
    }
    try {
        await writeFileAsync((0, path_1.join)(__dirname, "..", "..", "..", "public", media.filename), Buffer.from(media.data, 'base64'));
    }
    catch (err) {
        Sentry.captureException(err);
        logger_1.logger.error(err);
    }
    const body = (0, exports.getBodyMessage)(msg);
    const hasCap = hasCaption(body, media.filename);
    const bodyMessage = body ? hasCap ? (0, Mustache_1.default)(body, ticket.contact) : "-" : "-";
    const messageData = {
        id: msg.key.id,
        ticketId: ticket.id,
        contactId: msg.key.fromMe ? undefined : contact.id,
        body: bodyMessage,
        fromMe: msg.key.fromMe,
        read: msg.key.fromMe,
        mediaUrl: media.filename,
        mediaType: media.mimetype.split("/")[0],
        quotedMsgId: quotedMsg?.id,
        ack: msg.status,
        remoteJid: msg.key.remoteJid,
        participant: msg.key.participant,
        dataJson: JSON.stringify(msg),
        ticketTrakingId: ticketTraking?.id,
    };
    await ticket.update({
        lastMessage: body || "Arquivo de mídia"
    });
    const newMessage = await (0, CreateMessageService_1.default)({
        messageData,
        companyId: ticket.companyId
    });
    if (!msg.key.fromMe && ticket.status === "closed") {
        await ticket.update({ status: "pending" });
        await ticket.reload({
            include: [
                { model: Queue_1.default, as: "queue" },
                { model: User_1.default, as: "user" },
                { model: Contact_1.default, as: "contact" }
            ]
        });
        io.to(`company-${ticket.companyId}-closed`)
            .to(`queue-${ticket.queueId}-closed`)
            .emit(`company-${ticket.companyId}-ticket`, {
            action: "delete",
            ticket,
            ticketId: ticket.id
        });
        io.to(`company-${ticket.companyId}-${ticket.status}`)
            .to(`queue-${ticket.queueId}-${ticket.status}`)
            .to(ticket.id.toString())
            .emit(`company-${ticket.companyId}-ticket`, {
            action: "update",
            ticket,
            ticketId: ticket.id
        });
    }
    return newMessage;
};
exports.verifyMediaMessage = verifyMediaMessage;
const verifyMessage = async (msg, ticket, contact) => {
    const io = (0, socket_1.getIO)();
    const quotedMsg = await verifyQuotedMessage(msg);
    const body = (0, exports.getBodyMessage)(msg);
    const isEdited = getTypeMessage(msg) == "editedMessage";
    const messageData = {
        id: isEdited
            ? msg?.message?.editedMessage?.message?.protocolMessage?.key?.id
            : msg.key.id,
        ticketId: ticket.id,
        contactId: msg.key.fromMe ? undefined : contact.id,
        body,
        fromMe: msg.key.fromMe,
        mediaType: getTypeMessage(msg),
        read: msg.key.fromMe,
        quotedMsgId: quotedMsg?.id,
        ack: msg.status,
        remoteJid: msg.key.remoteJid,
        participant: msg.key.participant,
        dataJson: JSON.stringify(msg),
        isEdited: isEdited
    };
    await ticket.update({
        lastMessage: body
    });
    await (0, CreateMessageService_1.default)({ messageData, companyId: ticket.companyId });
    if (!msg.key.fromMe && ticket.status === "closed") {
        await ticket.update({ status: "pending" });
        await ticket.reload({
            include: [
                { model: Queue_1.default, as: "queue" },
                { model: User_1.default, as: "user" },
                { model: Contact_1.default, as: "contact" }
            ]
        });
        io.to(`company-${ticket.companyId}-closed`)
            .to(`queue-${ticket.queueId}-closed`)
            .emit(`company-${ticket.companyId}-ticket`, {
            action: "delete",
            ticket,
            ticketId: ticket.id
        });
        io.to(`company-${ticket.companyId}-${ticket.status}`)
            .to(`queue-${ticket.queueId}-${ticket.status}`)
            .emit(`company-${ticket.companyId}-ticket`, {
            action: "update",
            ticket,
            ticketId: ticket.id
        });
    }
    // Não alterar status se o ticket estiver em chatbot (preservar fluxo)
    if (!msg.key.fromMe && ticket.status === "chatbot") {
        // Apenas atualizar lastMessage, não alterar status
        return;
    }
};
exports.verifyMessage = verifyMessage;
const isValidMsg = (msg) => {
    if (msg.key.remoteJid === "status@broadcast")
        return false;
    try {
        const msgType = getTypeMessage(msg);
        if (!msgType) {
            return;
        }
        const ifType = msgType === "conversation" ||
            msgType === "extendedTextMessage" ||
            msgType === "editedMessage" ||
            msgType === "audioMessage" ||
            msgType === "videoMessage" ||
            msgType === "imageMessage" ||
            msgType === "documentMessage" ||
            msgType === "documentWithCaptionMessage" ||
            msgType === "stickerMessage" ||
            msgType === "buttonsResponseMessage" ||
            msgType === "buttonsMessage" ||
            msgType === "messageContextInfo" ||
            msgType === "locationMessage" ||
            msgType === "liveLocationMessage" ||
            msgType === "contactMessage" ||
            msgType === "voiceMessage" ||
            msgType === "mediaMessage" ||
            msgType === "contactsArrayMessage" ||
            msgType === "reactionMessage" ||
            msgType === "ephemeralMessage" ||
            msgType === "protocolMessage" ||
            msgType === "listResponseMessage" ||
            msgType === "listMessage" ||
            msgType === "viewOnceMessage";
        if (!ifType) {
            logger_1.logger.warn(`#### Nao achou o type em isValidMsg: ${msgType}
${JSON.stringify(msg?.message)}`);
            Sentry.setExtra("Mensagem", { BodyMsg: msg.message, msg, msgType });
            Sentry.captureException(new Error("Novo Tipo de Mensagem em isValidMsg"));
        }
        return !!ifType;
    }
    catch (error) {
        Sentry.setExtra("Error isValidMsg", { msg });
        Sentry.captureException(error);
    }
};
const Push = (msg) => {
    return msg.pushName;
};
const verifyQueue = async (wbot, msg, ticket, contact, mediaSent) => {
    const companyId = ticket.companyId;
    const { queues, greetingMessage, maxUseBotQueues, timeUseBotQueues } = await (0, ShowWhatsAppService_1.default)(wbot.id, ticket.companyId);
    if (queues.length === 1) {
        const sendGreetingMessageOneQueues = await Setting_1.default.findOne({
            where: {
                key: "sendGreetingMessageOneQueues",
                companyId: ticket.companyId
            }
        });
        if (greetingMessage.length > 1 &&
            sendGreetingMessageOneQueues?.value === "enabled") {
            const body = (0, Mustache_1.default)(`${greetingMessage}`, contact);
            await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                text: body
            });
        }
        const firstQueue = (0, lodash_1.head)(queues);
        let chatbot = false;
        if (firstQueue?.options) {
            chatbot = firstQueue.options.length > 0;
        }
        //inicia integração dialogflow/n8n
        if (!msg.key.fromMe &&
            !ticket.isGroup &&
            !(0, lodash_1.isNil)(queues[0]?.integrationId)) {
            const integrations = await (0, ShowQueueIntegrationService_1.default)(queues[0].integrationId, companyId);
            await (0, exports.handleMessageIntegration)(msg, wbot, integrations, ticket, companyId);
            await ticket.update({
                useIntegration: true,
                integrationId: integrations.id
            });
            // return;
        }
        //inicia integração openai
        if (!msg.key.fromMe && !ticket.isGroup && !(0, lodash_1.isNil)(queues[0]?.promptId)) {
            await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
            await ticket.update({
                useIntegration: true,
                promptId: queues[0]?.promptId
            });
            // return;
        }
        // Preservar status 'chatbot' se já estiver definido, caso contrário usar 'pending'
        const statusToSet = ticket.status === "chatbot" ? "chatbot" : "pending";
        await (0, UpdateTicketService_1.default)({
            ticketData: { queueId: firstQueue.id, chatbot, status: statusToSet },
            ticketId: ticket.id,
            companyId: ticket.companyId
        });
        return;
    }
    const selectedOption = (0, exports.getBodyMessage)(msg);
    const choosenQueue = queues[+selectedOption - 1];
    const buttonActive = await Setting_1.default.findOne({
        where: {
            key: "chatBotType",
            companyId
        }
    });
    const botText = async () => {
        let options = "";
        queues.forEach((queue, index) => {
            options += `*[ ${index + 1} ]* - ${queue.name}\n`;
        });
        const textMessage = {
            text: (0, Mustache_1.default)(`\u200e${greetingMessage}\n\n${options}`, contact)
        };
        const sendMsg = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, textMessage);
        await (0, exports.verifyMessage)(sendMsg, ticket, ticket.contact);
    };
    if (choosenQueue) {
        let chatbot = false;
        if (choosenQueue?.options) {
            chatbot = choosenQueue.options.length > 0;
        }
        // Preservar status 'chatbot' se já estiver definido
        const statusToSet = ticket.status === "chatbot" ? "chatbot" : undefined;
        const ticketData = statusToSet
            ? { queueId: choosenQueue.id, chatbot, status: statusToSet }
            : { queueId: choosenQueue.id, chatbot };
        await (0, UpdateTicketService_1.default)({
            ticketData,
            ticketId: ticket.id,
            companyId: ticket.companyId
        });
        /* Tratamento para envio de mensagem quando o setor está fora do expediente */
        if (choosenQueue.options.length === 0) {
            const queue = await Queue_1.default.findByPk(choosenQueue.id);
            const { schedules } = queue;
            const now = (0, moment_1.default)();
            const weekday = now.format("dddd").toLowerCase();
            let schedule;
            if (Array.isArray(schedules) && schedules.length > 0) {
                schedule = schedules.find(s => s.weekdayEn === weekday &&
                    s.startTime !== "" &&
                    s.startTime !== null &&
                    s.endTime !== "" &&
                    s.endTime !== null);
            }
            if (queue.outOfHoursMessage !== null &&
                queue.outOfHoursMessage !== "" &&
                !(0, lodash_1.isNil)(schedule)) {
                const startTime = (0, moment_1.default)(schedule.startTime, "HH:mm");
                const endTime = (0, moment_1.default)(schedule.endTime, "HH:mm");
                if (now.isBefore(startTime) || now.isAfter(endTime)) {
                    const body = (0, Mustache_1.default)(`\u200e ${queue.outOfHoursMessage}\n\n*[ # ]* - Voltar ao Menu Principal`, ticket.contact);
                    const sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                        text: body
                    });
                    await (0, exports.verifyMessage)(sentMessage, ticket, contact);
                    // Preservar status 'chatbot' se já estiver definido
                    const statusToSet = ticket.status === "chatbot" ? "chatbot" : undefined;
                    const ticketData = statusToSet
                        ? { queueId: null, chatbot, status: statusToSet }
                        : { queueId: null, chatbot };
                    await (0, UpdateTicketService_1.default)({
                        ticketData,
                        ticketId: ticket.id,
                        companyId: ticket.companyId
                    });
                    return;
                }
            }
            //inicia integração dialogflow/n8n
            if (!msg.key.fromMe && !ticket.isGroup && choosenQueue.integrationId) {
                const integrations = await (0, ShowQueueIntegrationService_1.default)(choosenQueue.integrationId, companyId);
                await (0, exports.handleMessageIntegration)(msg, wbot, integrations, ticket, companyId);
                await ticket.update({
                    useIntegration: true,
                    integrationId: integrations.id
                });
                // return;
            }
            // Sempre verificar se há fluxo flowbuilder configurado
            // independente da configuração da integração na queue
            if (!msg.key.fromMe && !ticket.isGroup) {
                const whatsapp = await (0, ShowWhatsAppService_1.default)(wbot.id, companyId);
                const body = (0, exports.getBodyMessage)(msg);
                console.log('🔍 [DEBUG] Verificando fluxo flowbuilder:', {
                    whatsappId: whatsapp.id,
                    ticketId: ticket.id,
                    body: body
                });
                // Primeiro tentar processar palavras-chave
                const keywordFlowTriggered = await FlowKeywordService_1.default.processMessage(body, contact, ticket, companyId, false, whatsapp.id);
                if (keywordFlowTriggered) {
                    console.log('🔍 [DEBUG] Fluxo flowbuilder disparado por palavra-chave');
                    return;
                }
                // Se não houver palavra-chave e há flowIdWelcome, executar welcome flow
                if (whatsapp.flowIdWelcome) {
                    console.log('🔍 [DEBUG] Executando fluxo flowbuilder welcome:', {
                        flowIdWelcome: whatsapp.flowIdWelcome
                    });
                    const welcomeFlowTriggered = await FlowKeywordService_1.default.processWelcomeFlow(contact, ticket, companyId, whatsapp.id, whatsapp.flowIdWelcome);
                    if (welcomeFlowTriggered) {
                        console.log('🔍 [DEBUG] Fluxo flowbuilder welcome executado com sucesso');
                        return;
                    }
                }
            }
            //inicia integração openai
            if (!msg.key.fromMe &&
                !ticket.isGroup &&
                !(0, lodash_1.isNil)(choosenQueue?.promptId)) {
                await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
                await ticket.update({
                    useIntegration: true,
                    promptId: choosenQueue?.promptId
                });
                // return;
            }
            const body = (0, Mustache_1.default)(`\u200e${choosenQueue.greetingMessage}`, ticket.contact);
            if (choosenQueue.greetingMessage) {
                const sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                    text: body
                });
                await (0, exports.verifyMessage)(sentMessage, ticket, contact);
            }
        }
    }
    else {
        if (maxUseBotQueues &&
            maxUseBotQueues !== 0 &&
            ticket.amountUsedBotQueues >= maxUseBotQueues) {
            // await UpdateTicketService({
            //   ticketData: { queueId: queues[0].id },
            //   ticketId: ticket.id
            // });
            return;
        }
        //Regra para desabilitar o chatbot por x minutos/horas após o primeiro envio
        const ticketTraking = await (0, FindOrCreateATicketTrakingService_1.default)({
            ticketId: ticket.id,
            companyId
        });
        let dataLimite = new Date();
        let Agora = new Date();
        if (ticketTraking.chatbotAt !== null) {
            dataLimite.setMinutes(ticketTraking.chatbotAt.getMinutes() + Number(timeUseBotQueues));
            if (ticketTraking.chatbotAt !== null &&
                Agora < dataLimite &&
                timeUseBotQueues !== "0" &&
                ticket.amountUsedBotQueues !== 0) {
                return;
            }
        }
        await ticketTraking.update({
            chatbotAt: null
        });
        if (buttonActive.value === "text") {
            return botText();
        }
    }
};
const verifyRating = (ticketTraking) => {
    if (ticketTraking &&
        ticketTraking.finishedAt === null &&
        ticketTraking.userId !== null &&
        ticketTraking.ratingAt !== null) {
        return true;
    }
    return false;
};
exports.verifyRating = verifyRating;
const handleRating = async (rate, ticket, ticketTraking) => {
    const io = (0, socket_1.getIO)();
    const { complationMessage } = await (0, ShowWhatsAppService_1.default)(ticket.whatsappId, ticket.companyId);
    let finalRate = rate;
    if (rate < 1) {
        finalRate = 1;
    }
    if (rate > 5) {
        finalRate = 5;
    }
    await UserRating_1.default.create({
        ticketId: ticketTraking.ticketId,
        companyId: ticketTraking.companyId,
        userId: ticketTraking.userId,
        rate: finalRate
    });
    if (complationMessage) {
        const body = (0, Mustache_1.default)(`\u200e${complationMessage}`, ticket.contact);
        await (0, SendWhatsAppMessage_1.default)({ body, ticket });
    }
    await ticketTraking.update({
        finishedAt: (0, moment_1.default)().toDate(),
        rated: true
    });
    await ticket.update({
        queueId: null,
        chatbot: null,
        queueOptionId: null,
        userId: null,
        status: "closed"
    });
    io.to(`company-${ticket.companyId}-open`)
        .to(`queue-${ticket.queueId}-open`)
        .emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id
    });
    io.to(`company-${ticket.companyId}-${ticket.status}`)
        .to(`queue-${ticket.queueId}-${ticket.status}`)
        .to(ticket.id.toString())
        .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id
    });
};
exports.handleRating = handleRating;
const handleChartbot = async (ticket, msg, wbot, dontReadTheFirstQuestion = false) => {
    const queue = await Queue_1.default.findByPk(ticket.queueId, {
        include: [
            {
                model: QueueOption_1.default,
                as: "options",
                where: { parentId: null },
                order: [
                    ["option", "ASC"],
                    ["createdAt", "ASC"]
                ]
            }
        ]
    });
    const messageBody = (0, exports.getBodyMessage)(msg);
    if (messageBody == "#") {
        // voltar para o menu inicial
        await ticket.update({ queueOptionId: null, chatbot: false, queueId: null });
        await verifyQueue(wbot, msg, ticket, ticket.contact);
        return;
    }
    // voltar para o menu anterior
    if (!(0, lodash_1.isNil)(queue) && !(0, lodash_1.isNil)(ticket.queueOptionId) && messageBody == "0") {
        const option = await QueueOption_1.default.findByPk(ticket.queueOptionId);
        await ticket.update({ queueOptionId: option?.parentId });
        // escolheu uma opção
    }
    else if (!(0, lodash_1.isNil)(queue) && !(0, lodash_1.isNil)(ticket.queueOptionId)) {
        const count = await QueueOption_1.default.count({
            where: { parentId: ticket.queueOptionId }
        });
        let option = {};
        if (count == 1) {
            option = await QueueOption_1.default.findOne({
                where: { parentId: ticket.queueOptionId }
            });
        }
        else {
            option = await QueueOption_1.default.findOne({
                where: {
                    option: messageBody || "",
                    parentId: ticket.queueOptionId
                }
            });
        }
        if (option) {
            await ticket.update({ queueOptionId: option?.id });
        }
        // não linha a primeira pergunta
    }
    else if (!(0, lodash_1.isNil)(queue) &&
        (0, lodash_1.isNil)(ticket.queueOptionId) &&
        !dontReadTheFirstQuestion) {
        const option = queue?.options.find(o => o.option == messageBody);
        if (option) {
            await ticket.update({ queueOptionId: option?.id });
        }
    }
    await ticket.reload();
    if (!(0, lodash_1.isNil)(queue) && (0, lodash_1.isNil)(ticket.queueOptionId)) {
        const queueOptions = await QueueOption_1.default.findAll({
            where: { queueId: ticket.queueId, parentId: null },
            order: [
                ["option", "ASC"],
                ["createdAt", "ASC"]
            ]
        });
        const companyId = ticket.companyId;
        const buttonActive = await Setting_1.default.findOne({
            where: {
                key: "chatBotType",
                companyId
            }
        });
        // const botList = async () => {
        // const sectionsRows = [];
        // queues.forEach((queue, index) => {
        //   sectionsRows.push({
        //     title: queue.name,
        //     rowId: `${index + 1}`
        //   });
        // });
        // const sections = [
        //   {
        //     rows: sectionsRows
        //   }
        // ];
        //   const listMessage = {
        //     text: formatBody(`\u200e${queue.greetingMessage}`, ticket.contact),
        //     buttonText: "Escolha uma opção",
        //     sections
        //   };
        //   const sendMsg = await wbot.sendMessage(
        //     `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        //     listMessage
        //   );
        //   await verifyMessage(sendMsg, ticket, ticket.contact);
        // }
        const botButton = async () => {
            const buttons = [];
            queueOptions.forEach((option, i) => {
                buttons.push({
                    buttonId: `${option.option}`,
                    buttonText: { displayText: option.title },
                    type: 4
                });
            });
            buttons.push({
                buttonId: `#`,
                buttonText: { displayText: "Menu inicial *[ 0 ]* Menu anterior" },
                type: 4
            });
            const buttonMessage = {
                text: (0, Mustache_1.default)(`\u200e${queue.greetingMessage}`, ticket.contact),
                buttons,
                headerType: 4
            };
            const sendMsg = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, buttonMessage);
            await (0, exports.verifyMessage)(sendMsg, ticket, ticket.contact);
        };
        const botText = async () => {
            let options = "";
            queueOptions.forEach((option, i) => {
                options += `*[ ${option.option} ]* - ${option.title}\n`;
            });
            //options += `\n*[ 0 ]* - Menu anterior`;
            options += `\n*[ # ]* - Menu inicial`;
            const textMessage = {
                text: (0, Mustache_1.default)(`\u200e${queue.greetingMessage}\n\n${options}`, ticket.contact)
            };
            const sendMsg = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, textMessage);
            await (0, exports.verifyMessage)(sendMsg, ticket, ticket.contact);
        };
        // if (buttonActive.value === "list") {
        //   return botList();
        // };
        if (buttonActive.value === "button" && QueueOption_1.default.length <= 4) {
            return botButton();
        }
        if (buttonActive.value === "text") {
            return botText();
        }
        if (buttonActive.value === "button" && QueueOption_1.default.length > 4) {
            return botText();
        }
    }
    else if (!(0, lodash_1.isNil)(queue) && !(0, lodash_1.isNil)(ticket.queueOptionId)) {
        const currentOption = await QueueOption_1.default.findByPk(ticket.queueOptionId);
        const queueOptions = await QueueOption_1.default.findAll({
            where: { parentId: ticket.queueOptionId },
            order: [
                ["option", "ASC"],
                ["createdAt", "ASC"]
            ]
        });
        if (queueOptions.length > -1) {
            const companyId = ticket.companyId;
            const buttonActive = await Setting_1.default.findOne({
                where: {
                    key: "chatBotType",
                    companyId
                }
            });
            const botList = async () => {
                const sectionsRows = [];
                queueOptions.forEach((option, i) => {
                    sectionsRows.push({
                        title: option.title,
                        rowId: `${option.option}`
                    });
                });
                sectionsRows.push({
                    title: "Menu inicial *[ 0 ]* Menu anterior",
                    rowId: `#`
                });
                const sections = [
                    {
                        rows: sectionsRows
                    }
                ];
                const listMessage = {
                    text: (0, Mustache_1.default)(`\u200e${currentOption.message}`, ticket.contact),
                    buttonText: "Escolha uma opção",
                    sections
                };
                const sendMsg = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, listMessage);
                await (0, exports.verifyMessage)(sendMsg, ticket, ticket.contact);
            };
            const botButton = async () => {
                const buttons = [];
                queueOptions.forEach((option, i) => {
                    buttons.push({
                        buttonId: `${option.option}`,
                        buttonText: { displayText: option.title },
                        type: 4
                    });
                });
                buttons.push({
                    buttonId: `#`,
                    buttonText: { displayText: "Menu inicial *[ 0 ]* Menu anterior" },
                    type: 4
                });
                const buttonMessage = {
                    text: (0, Mustache_1.default)(`\u200e${currentOption.message}`, ticket.contact),
                    buttons,
                    headerType: 4
                };
                const sendMsg = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, buttonMessage);
                await (0, exports.verifyMessage)(sendMsg, ticket, ticket.contact);
            };
            const botText = async () => {
                let options = "";
                queueOptions.forEach((option, i) => {
                    options += `*[ ${option.option} ]* - ${option.title}\n`;
                });
                options += `\n*[ 0 ]* - Menu anterior`;
                options += `\n*[ # ]* - Menu inicial`;
                const textMessage = {
                    text: (0, Mustache_1.default)(`\u200e${currentOption.message}\n\n${options}`, ticket.contact)
                };
                const sendMsg = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, textMessage);
                await (0, exports.verifyMessage)(sendMsg, ticket, ticket.contact);
            };
            if (buttonActive.value === "list") {
                return botList();
            }
            if (buttonActive.value === "button" && QueueOption_1.default.length <= 4) {
                return botButton();
            }
            if (buttonActive.value === "text") {
                return botText();
            }
            if (buttonActive.value === "button" && QueueOption_1.default.length > 4) {
                return botText();
            }
        }
    }
};
const flowbuilderIntegration = async (msg, wbot, companyId, queueIntegration, ticket, contact, isFirstMsg, isTranfered) => {
    console.log('🔍 [DEBUG] flowbuilderIntegration chamada:', {
        ticketId: ticket.id,
        contactNumber: contact.number,
        isFirstMsg: !!isFirstMsg,
        body: (0, exports.getBodyMessage)(msg)
    });
    const io = (0, socket_1.getIO)();
    const quotedMsg = await verifyQuotedMessage(msg);
    const body = (0, exports.getBodyMessage)(msg);
    // Processar mensagem com o novo serviço de palavras-chave
    console.log('🔍 [DEBUG] Chamando FlowKeywordService.processMessage:', {
        body,
        contactId: contact.id,
        ticketId: ticket.id,
        companyId,
        whatsappId: ticket.whatsappId,
        isFirstMsg: isFirstMsg ? true : false
    });
    const flowTriggered = await FlowKeywordService_1.default.processMessage(body, contact, ticket, companyId, isFirstMsg ? true : false, ticket.whatsappId);
    console.log('🔍 [DEBUG] FlowKeywordService.processMessage resultado:', flowTriggered);
    // Se um fluxo foi disparado pelo serviço, retornar
    if (flowTriggered) {
        console.log('🔍 [DEBUG] Fluxo foi disparado, retornando...');
        return;
    }
    /*
    const messageData = {
      wid: msg.key.id,
      ticketId: ticket.id,
      contactId: msg.key.fromMe ? undefined : contact.id,
      body: body,
      fromMe: msg.key.fromMe,
      read: msg.key.fromMe,
      quotedMsgId: quotedMsg?.id,
      ack: Number(String(msg.status).replace('PENDING', '2').replace('NaN', '1')) || 2,
      remoteJid: msg.key.remoteJid,
      participant: msg.key.participant,
      dataJson: JSON.stringify(msg),
      createdAt: new Date(
        Math.floor(getTimestampMessage(msg.messageTimestamp) * 1000)
      ).toISOString(),
      ticketImported: ticket.imported,
    };
  
  
    await CreateMessageService({ messageData, companyId: ticket.companyId });
  
    */
    if (!msg.key.fromMe && ticket.status === "closed") {
        console.log("===== CHANGE =====");
        await ticket.update({ status: "pending" });
        await ticket.reload({
            include: [
                { model: Queue_1.default, as: "queue" },
                { model: User_1.default, as: "user" },
                { model: Contact_1.default, as: "contact" }
            ]
        });
        await (0, UpdateTicketService_1.default)({
            ticketData: { status: "pending", integrationId: ticket.integrationId },
            ticketId: ticket.id,
            companyId
        });
        io.of(String(companyId)).emit(`company-${companyId}-ticket`, {
            action: "delete",
            ticket,
            ticketId: ticket.id
        });
        io.to(ticket.status).emit(`company-${companyId}-ticket`, {
            action: "update",
            ticket,
            ticketId: ticket.id
        });
    }
    if (msg.key.fromMe) {
        return;
    }
    const whatsapp = await (0, ShowWhatsAppService_1.default)(wbot.id, companyId);
    // Welcome flow - usando FlowKeywordService para consistência
    if (!isFirstMsg) {
        console.log('🔍 [DEBUG] Tentando disparar Welcome flow via FlowKeywordService:', {
            whatsappId: whatsapp.id,
            flowIdWelcome: whatsapp.flowIdWelcome,
            companyId
        });
        const welcomeFlowTriggered = await FlowKeywordService_1.default.processWelcomeFlow(contact, ticket, companyId, whatsapp.id, whatsapp.flowIdWelcome);
        console.log('🔍 [DEBUG] Welcome flow resultado:', welcomeFlowTriggered);
        if (welcomeFlowTriggered) {
            console.log('🔍 [DEBUG] Welcome flow foi disparado, retornando...');
            return;
        }
    }
    const dateTicket = new Date(isFirstMsg?.updatedAt ? isFirstMsg.updatedAt : "");
    const dateNow = new Date();
    const diferencaEmMilissegundos = Math.abs((0, date_fns_1.differenceInMilliseconds)(dateTicket, dateNow));
    //const seisHorasEmMilissegundos = 21600000;
    const seisHorasEmMilissegundos = 0;
    logger_1.logger.info(isFirstMsg);
    // Flow with not found phrase - removido filtro de listPhrase
    if (diferencaEmMilissegundos >= seisHorasEmMilissegundos &&
        isFirstMsg) {
        console.log("2427", "handleMessageIntegration");
        const flow = await FlowBuilder_1.FlowBuilderModel.findOne({
            where: {
                id: whatsapp.flowIdNotPhrase
            }
        });
        if (flow) {
            console.log('🔍 [DEBUG] Executando flowIdNotPhrase sem integração:', {
                whatsappId: whatsapp.id,
                flowIdNotPhrase: whatsapp.flowIdNotPhrase,
                ticketId: ticket.id
            });
            const nodes = flow.flow["nodes"];
            const connections = flow.flow["connections"];
            const mountDataContact = {
                number: contact.number,
                name: contact.name,
                email: contact.email
            };
            // Primeiro atualizar o ticket para marcar como chatbot
            await (0, UpdateTicketService_1.default)({
                ticketData: {
                    status: "chatbot",
                    flowWebhook: true
                },
                ticketId: ticket.id,
                companyId: ticket.companyId
            });
            await (0, ActionsWebhookService_1.ActionsWebhookService)(whatsapp.id, whatsapp.flowIdNotPhrase, ticket.companyId, nodes, connections, flow.flow["nodes"][0].id, null, "", "", null, ticket.id, mountDataContact, msg);
        }
    }
    // Campaign flow removido - funcionalidade migrada para FlowKeywordService
    // O FlowKeywordService já processa palavras-chave configuradas nos fluxos
    if (ticket.flowWebhook) {
        const webhook = await Webhook_1.WebhookModel.findOne({
            where: {
                company_id: ticket.companyId,
                hash_id: ticket.hashFlowId
            }
        });
        if (webhook && webhook.config["details"]) {
            const flow = await FlowBuilder_1.FlowBuilderModel.findOne({
                where: {
                    id: webhook.config["details"].idFlow
                }
            });
            const nodes = flow.flow["nodes"];
            const connections = flow.flow["connections"];
            // const worker = new Worker("./src/services/WebhookService/WorkerAction.ts");
            // console.log('DISPARO4')
            // // Enviar as variáveis como parte da mensagem para o Worker
            // const data = {
            //   idFlowDb: webhook.config["details"].idFlow,
            //   companyId: ticketUpdate.companyId,
            //   nodes: nodes,
            //   connects: connections,
            //   nextStage: ticketUpdate.lastFlowId,
            //   dataWebhook: ticketUpdate.dataWebhook,
            //   details: webhook.config["details"],
            //   hashWebhookId: ticketUpdate.hashFlowId,
            //   pressKey: body,
            //   idTicket: ticketUpdate.id,
            //   numberPhrase: ""
            // };
            // worker.postMessage(data);
            // worker.on("message", message => {
            //   console.log(`Mensagem do worker: ${message}`);
            // });
            // Primeiro atualizar o ticket para marcar como chatbot
            await (0, UpdateTicketService_1.default)({
                ticketData: {
                    status: "chatbot",
                    flowWebhook: true
                },
                ticketId: ticket.id,
                companyId: ticket.companyId
            });
            await (0, ActionsWebhookService_1.ActionsWebhookService)(whatsapp.id, webhook.config["details"].idFlow, ticket.companyId, nodes, connections, ticket.lastFlowId, ticket.dataWebhook, webhook.config["details"], ticket.hashFlowId, body, ticket.id);
        }
        else {
            const flow = await FlowBuilder_1.FlowBuilderModel.findOne({
                where: {
                    id: ticket.flowStopped
                }
            });
            const nodes = flow.flow["nodes"];
            const connections = flow.flow["connections"];
            if (!ticket.lastFlowId) {
                return;
            }
            const mountDataContact = {
                number: contact.number,
                name: contact.name,
                email: contact.email
            };
            // const worker = new Worker("./src/services/WebhookService/WorkerAction.ts");
            // console.log('DISPARO5')
            // // Enviar as variáveis como parte da mensagem para o Worker
            // const data = {
            //   idFlowDb: parseInt(ticketUpdate.flowStopped),
            //   companyId: ticketUpdate.companyId,
            //   nodes: nodes,
            //   connects: connections,
            //   nextStage: ticketUpdate.lastFlowId,
            //   dataWebhook: null,
            //   details: "",
            //   hashWebhookId: "",
            //   pressKey: body,
            //   idTicket: ticketUpdate.id,
            //   numberPhrase: mountDataContact
            // };
            // worker.postMessage(data);
            // worker.on("message", message => {
            //   console.log(`Mensagem do worker: ${message}`);
            // });
            // Primeiro atualizar o ticket para marcar como chatbot
            await (0, UpdateTicketService_1.default)({
                ticketData: {
                    status: "chatbot",
                    flowWebhook: true
                },
                ticketId: ticket.id,
                companyId: ticket.companyId
            });
            await (0, ActionsWebhookService_1.ActionsWebhookService)(whatsapp.id, parseInt(ticket.flowStopped), ticket.companyId, nodes, connections, ticket.lastFlowId, null, "", "", body, ticket.id, mountDataContact, msg);
        }
    }
};
const handleMessageIntegration = async (msg, wbot, queueIntegration, ticket, companyId, isMenu = null, whatsapp = null, contact = null, isFirstMsg = null) => {
    console.log('🔍 [DEBUG] handleMessageIntegration chamada:', {
        ticketId: ticket.id,
        integrationType: queueIntegration.type,
        isMenu,
        msgType: getTypeMessage(msg)
    });
    const msgType = getTypeMessage(msg);
    if (queueIntegration.type === "n8n" || queueIntegration.type === "webhook") {
        if (queueIntegration?.urlN8N) {
            const options = {
                method: "POST",
                url: queueIntegration?.urlN8N,
                headers: {
                    "Content-Type": "application/json"
                },
                json: msg
            };
            try {
                request(options, function (error, response) {
                    if (error) {
                        throw new Error(error);
                    }
                    else {
                        console.log(response.body);
                    }
                });
            }
            catch (error) {
                throw new Error(error);
            }
        }
    }
    else if (queueIntegration.type === "typebot") {
        console.log("entrou no typebot");
        // await typebots(ticket, msg, wbot, queueIntegration);
        await (0, typebotListener_1.default)({ ticket, msg, wbot, typebot: queueIntegration });
    }
};
exports.handleMessageIntegration = handleMessageIntegration;
const flowBuilderQueue = async (ticket, msg, wbot, whatsapp, companyId, contact, isFirstMsg) => {
    const body = (0, exports.getBodyMessage)(msg);
    const flow = await FlowBuilder_1.FlowBuilderModel.findOne({
        where: {
            id: ticket.flowStopped
        }
    });
    const mountDataContact = {
        number: contact.number,
        name: contact.name,
        email: contact.email
    };
    const nodes = flow.flow["nodes"];
    const connections = flow.flow["connections"];
    if (!ticket.lastFlowId) {
        return;
    }
    if (ticket.status === "closed" ||
        ticket.status === "interrupted" ||
        ticket.status === "open") {
        return;
    }
    // Primeiro atualizar o ticket para marcar como chatbot
    await (0, UpdateTicketService_1.default)({
        ticketData: {
            status: "chatbot",
            flowWebhook: true
        },
        ticketId: ticket.id,
        companyId: ticket.companyId
    });
    await (0, ActionsWebhookService_1.ActionsWebhookService)(whatsapp.id, parseInt(ticket.flowStopped), ticket.companyId, nodes, connections, ticket.lastFlowId, null, "", "", body, ticket.id, mountDataContact, msg);
    //const integrations = await ShowQueueIntegrationService(whatsapp.integrationId, companyId);
    //await handleMessageIntegration(msg, wbot, integrations, ticket, companyId, true, whatsapp);
};
const handleMessage = async (msg, wbot, companyId) => {
    let mediaSent;
    if (!isValidMsg(msg))
        return;
    try {
        let msgContact;
        let groupContact;
        const isGroup = msg.key.remoteJid?.endsWith("@g.us");
        const msgIsGroupBlock = await Setting_1.default.findOne({
            where: {
                companyId,
                key: "CheckMsgIsGroup"
            }
        });
        const bodyMessage = (0, exports.getBodyMessage)(msg);
        const msgType = getTypeMessage(msg);
        const hasMedia = msg.message?.audioMessage ||
            msg.message?.imageMessage ||
            msg.message?.videoMessage ||
            msg.message?.documentMessage ||
            msg.message?.documentWithCaptionMessage ||
            msg.message.stickerMessage;
        if (msg.key.fromMe) {
            if (/\u200e/.test(bodyMessage))
                return;
            if (!hasMedia &&
                msgType !== "conversation" &&
                msgType !== "extendedTextMessage" &&
                msgType !== "vcard")
                return;
            msgContact = await getContactMessage(msg, wbot);
        }
        else {
            msgContact = await getContactMessage(msg, wbot);
        }
        if (msgIsGroupBlock?.value === "enabled" && isGroup)
            return;
        if (isGroup) {
            const grupoMeta = await wbot.groupMetadata(msg.key.remoteJid);
            const msgGroupContact = {
                id: grupoMeta.id,
                name: grupoMeta.subject
            };
            groupContact = await verifyContact(msgGroupContact, wbot, companyId);
        }
        const whatsapp = await (0, ShowWhatsAppService_1.default)(wbot.id, companyId);
        const contact = await verifyContact(msgContact, wbot, companyId);
        let unreadMessages = 0;
        if (msg.key.fromMe) {
            await cache_1.cacheLayer.set(`contacts:${contact.id}:unreads`, "0");
        }
        else {
            const unreads = await cache_1.cacheLayer.get(`contacts:${contact.id}:unreads`);
            unreadMessages = +unreads + 1;
            await cache_1.cacheLayer.set(`contacts:${contact.id}:unreads`, `${unreadMessages}`);
        }
        const lastMessage = await Message_1.default.findOne({
            where: {
                contactId: contact.id,
                companyId
            },
            order: [["createdAt", "DESC"]]
        });
        if (unreadMessages === 0 &&
            whatsapp.complationMessage &&
            (0, Mustache_1.default)(whatsapp.complationMessage, contact).trim().toLowerCase() ===
                lastMessage?.body.trim().toLowerCase()) {
            return;
        }
        const ticket = await (0, FindOrCreateTicketService_1.default)(contact, wbot.id, unreadMessages, companyId, groupContact);
        await (0, providers_1.provider)(ticket, msg, companyId, contact, wbot);
        // voltar para o menu inicial
        if (bodyMessage == "#") {
            await ticket.update({
                queueOptionId: null,
                chatbot: false,
                queueId: null
            });
            await verifyQueue(wbot, msg, ticket, ticket.contact);
            return;
        }
        const ticketTraking = await (0, FindOrCreateATicketTrakingService_1.default)({
            ticketId: ticket.id,
            companyId,
            whatsappId: whatsapp?.id
        });
        try {
            if (!msg.key.fromMe) {
                if (ticketTraking !== null && (0, exports.verifyRating)(ticketTraking)) {
                    (0, exports.handleRating)(parseFloat(bodyMessage), ticket, ticketTraking);
                    return;
                }
            }
        }
        catch (e) {
            Sentry.captureException(e);
            console.log(e);
        }
        // Atualiza o ticket se a ultima mensagem foi enviada por mim, para que possa ser finalizado.
        try {
            await ticket.update({
                fromMe: msg.key.fromMe
            });
        }
        catch (e) {
            Sentry.captureException(e);
            console.log(e);
        }
        if (hasMedia) {
            mediaSent = await (0, exports.verifyMediaMessage)(msg, ticket, contact);
        }
        else {
            await (0, exports.verifyMessage)(msg, ticket, contact);
        }
        // Verificar palavras-chave do FlowBuilder sempre que uma mensagem for recebida
        if (!msg.key.fromMe && bodyMessage && bodyMessage.trim() !== "") {
            console.log('🔍 [DEBUG] Verificando palavras-chave na função handleMessage:', {
                body: bodyMessage,
                contactId: contact.id,
                ticketId: ticket.id,
                companyId: companyId,
                whatsappId: whatsapp.id
            });
            try {
                const flowTriggered = await FlowKeywordService_1.default.processMessage(bodyMessage, contact, ticket, companyId, false, // isFirstMsg
                whatsapp.id);
                console.log('🔍 [DEBUG] FlowKeywordService resultado na handleMessage:', flowTriggered);
                if (flowTriggered) {
                    console.log('✅ [DEBUG] Fluxo disparado com sucesso na handleMessage');
                    return; // Se o fluxo foi disparado, não continuar processamento
                }
            }
            catch (error) {
                console.error('❌ [ERROR] Erro ao processar FlowKeywordService na handleMessage:', error);
            }
        }
        const currentSchedule = await (0, VerifyCurrentSchedule_1.default)(companyId);
        const scheduleType = await Setting_1.default.findOne({
            where: {
                companyId,
                key: "scheduleType"
            }
        });
        try {
            if (!msg.key.fromMe && scheduleType) {
                /**
                 * Tratamento para envio de mensagem quando a empresa está fora do expediente
                 */
                if (scheduleType.value === "company" &&
                    !(0, lodash_1.isNil)(currentSchedule) &&
                    (!currentSchedule || currentSchedule.inActivity === false)) {
                    const body = `\u200e ${whatsapp.outOfHoursMessage}`;
                    const debouncedSentMessage = (0, Debounce_1.debounce)(async () => {
                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                            text: body
                        });
                    }, 3000, ticket.id);
                    debouncedSentMessage();
                    return;
                }
                if (scheduleType.value === "queue" && ticket.queueId !== null) {
                    /**
                     * Tratamento para envio de mensagem quando o setor está fora do expediente
                     */
                    const queue = await Queue_1.default.findByPk(ticket.queueId);
                    const { schedules } = queue;
                    const now = (0, moment_1.default)();
                    const weekday = now.format("dddd").toLowerCase();
                    let schedule = null;
                    if (Array.isArray(schedules) && schedules.length > 0) {
                        schedule = schedules.find(s => s.weekdayEn === weekday &&
                            s.startTime !== "" &&
                            s.startTime !== null &&
                            s.endTime !== "" &&
                            s.endTime !== null);
                    }
                    if (scheduleType.value === "queue" &&
                        queue.outOfHoursMessage !== null &&
                        queue.outOfHoursMessage !== "" &&
                        !(0, lodash_1.isNil)(schedule)) {
                        const startTime = (0, moment_1.default)(schedule.startTime, "HH:mm");
                        const endTime = (0, moment_1.default)(schedule.endTime, "HH:mm");
                        if (now.isBefore(startTime) || now.isAfter(endTime)) {
                            const body = `${queue.outOfHoursMessage}`;
                            const debouncedSentMessage = (0, Debounce_1.debounce)(async () => {
                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                                    text: body
                                });
                            }, 3000, ticket.id);
                            debouncedSentMessage();
                            return;
                        }
                    }
                }
            }
        }
        catch (e) {
            Sentry.captureException(e);
            console.log(e);
        }
        const flow = await FlowBuilder_1.FlowBuilderModel.findOne({
            where: {
                id: ticket.flowStopped
            }
        });
        let isMenu = false;
        let isOpenai = false;
        let isQuestion = false;
        if (flow) {
            isMenu =
                flow.flow["nodes"].find((node) => node.id === ticket.lastFlowId)
                    ?.type === "menu";
            isOpenai =
                flow.flow["nodes"].find((node) => node.id === ticket.lastFlowId)
                    ?.type === "openai";
            isQuestion =
                flow.flow["nodes"].find((node) => node.id === ticket.lastFlowId)
                    ?.type === "question";
        }
        if (!(0, lodash_1.isNil)(flow) && isQuestion && !msg.key.fromMe) {
            console.log("|============= QUESTION =============|", JSON.stringify(flow, null, 4));
            const body = (0, exports.getBodyMessage)(msg);
            if (body) {
                const nodes = flow.flow["nodes"];
                const nodeSelected = flow.flow["nodes"].find((node) => node.id === ticket.lastFlowId);
                const connections = flow.flow["connections"];
                const { message, answerKey } = nodeSelected.data.typebotIntegration;
                const oldDataWebhook = ticket.dataWebhook;
                const nodeIndex = nodes.findIndex(node => node.id === nodeSelected.id);
                const lastFlowId = nodes[nodeIndex + 1].id;
                await ticket.update({
                    lastFlowId: lastFlowId,
                    dataWebhook: {
                        variables: {
                            [answerKey]: body
                        }
                    }
                });
                await ticket.save();
                const mountDataContact = {
                    number: contact.number,
                    name: contact.name,
                    email: contact.email
                };
                // Primeiro atualizar o ticket para marcar como chatbot
                await (0, UpdateTicketService_1.default)({
                    ticketData: {
                        status: "chatbot",
                        flowWebhook: true
                    },
                    ticketId: ticket.id,
                    companyId: ticket.companyId
                });
                await (0, ActionsWebhookService_1.ActionsWebhookService)(whatsapp.id, parseInt(ticket.flowStopped), ticket.companyId, nodes, connections, lastFlowId, null, "", "", "", ticket.id, mountDataContact, msg);
            }
            return;
        }
        if (isOpenai && !(0, lodash_1.isNil)(flow) && !ticket.queue) {
            const nodeSelected = flow.flow["nodes"].find((node) => node.id === ticket.lastFlowId);
            let { name, prompt, voice, voiceKey, voiceRegion, maxTokens, temperature, apiKey, queueId, maxMessages } = nodeSelected.data.typebotIntegration;
            let openAiSettings = {
                name,
                prompt,
                voice,
                voiceKey,
                voiceRegion,
                maxTokens: parseInt(maxTokens),
                temperature: parseInt(temperature),
                apiKey,
                queueId: parseInt(queueId),
                maxMessages: parseInt(maxMessages)
            };
            await handleOpenAi(msg, wbot, ticket, contact, mediaSent, ticketTraking, openAiSettings);
            return;
        }
        //openai na conexao
        if (!ticket.queue &&
            !isGroup &&
            !msg.key.fromMe &&
            !ticket.userId &&
            !(0, lodash_1.isNil)(whatsapp.promptId)) {
            await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
        }
        // integração flowbuilder será movida para depois da declaração de isFirstMsg
        //openai no setor
        if (!isGroup &&
            !msg.key.fromMe &&
            !ticket.userId &&
            !(0, lodash_1.isNil)(ticket.promptId) &&
            ticket.useIntegration &&
            ticket.queueId) {
            await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
        }
        if (!msg.key.fromMe &&
            !ticket.isGroup &&
            !ticket.userId &&
            ticket.integrationId &&
            ticket.useIntegration &&
            ticket.queue) {
            console.log("entrou no type 1974");
            const integrations = await (0, ShowQueueIntegrationService_1.default)(ticket.integrationId, companyId);
            const isFirstMsg = await Ticket_1.default.findOne({
                where: {
                    contactId: groupContact ? groupContact.id : contact.id,
                    companyId,
                    whatsappId: whatsapp.id
                },
                order: [["id", "DESC"]]
            });
            await (0, exports.handleMessageIntegration)(msg, wbot, integrations, ticket, companyId, isMenu, whatsapp, contact, isFirstMsg);
        }
        if (!ticket.queue &&
            !ticket.isGroup &&
            !msg.key.fromMe &&
            !ticket.userId &&
            whatsapp.queues.length >= 1 &&
            !ticket.useIntegration) {
            await verifyQueue(wbot, msg, ticket, contact);
            if (ticketTraking && ticketTraking.chatbotAt === null) {
                await ticketTraking.update({
                    chatbotAt: (0, moment_1.default)().toDate()
                });
            }
        }
        const isFirstMsg = await Ticket_1.default.findOne({
            where: {
                contactId: groupContact ? groupContact.id : contact.id,
                companyId,
                whatsappId: whatsapp.id
            },
            order: [["id", "DESC"]]
        });
        //integraçao na conexao
        console.log('🔍 [DEBUG] Verificando condições para integração na conexão:', {
            fromMe: msg.key.fromMe,
            isGroup: ticket.isGroup,
            hasQueue: !!ticket.queue,
            hasUser: !!ticket.user,
            hasIntegrationId: !(0, lodash_1.isNil)(whatsapp.integrationId),
            useIntegration: ticket.useIntegration
        });
        if (!msg.key.fromMe &&
            !ticket.isGroup &&
            !ticket.queue &&
            !ticket.user &&
            !(0, lodash_1.isNil)(whatsapp.integrationId) &&
            !ticket.useIntegration) {
            console.log('🔍 [DEBUG] Condições atendidas! Chamando handleMessageIntegration...');
            const integrations = await (0, ShowQueueIntegrationService_1.default)(whatsapp.integrationId, companyId);
            await (0, exports.handleMessageIntegration)(msg, wbot, integrations, ticket, companyId, isMenu, whatsapp, contact, isFirstMsg);
            // Não fazer return aqui para permitir que as notificações sejam processadas
            // return;
        }
        // integração flowbuilder - sempre verificar fluxos de autoSend
        if (!msg.key.fromMe &&
            !ticket.isGroup &&
            !ticket.queue &&
            !ticket.user &&
            !ticket.useIntegration) {
            // Verificar fluxos de autoSend mesmo sem integração configurada
            const flowTriggered = await FlowKeywordService_1.default.processMessage((0, exports.getBodyMessage)(msg), contact, ticket, companyId, isFirstMsg ? true : false, ticket.whatsappId);
            console.log('🔍 [DEBUG] FlowKeywordService.processMessage resultado (sem integração):', flowTriggered);
            // Se há integração configurada, processar também
            if (!(0, lodash_1.isNil)(whatsapp.integrationId)) {
                const integrations = await (0, ShowQueueIntegrationService_1.default)(whatsapp.integrationId, companyId);
                await (0, exports.handleMessageIntegration)(msg, wbot, integrations, ticket, companyId, isMenu, whatsapp, contact, isFirstMsg);
            }
        }
        const dontReadTheFirstQuestion = ticket.queue === null;
        await ticket.reload();
        try {
            //Fluxo fora do expediente
            if (!msg.key.fromMe && scheduleType && ticket.queueId !== null) {
                /**
                 * Tratamento para envio de mensagem quando o setor está fora do expediente
                 */
                const queue = await Queue_1.default.findByPk(ticket.queueId);
                const { schedules } = queue;
                const now = (0, moment_1.default)();
                const weekday = now.format("dddd").toLowerCase();
                let schedule = null;
                if (Array.isArray(schedules) && schedules.length > 0) {
                    schedule = schedules.find(s => s.weekdayEn === weekday &&
                        s.startTime !== "" &&
                        s.startTime !== null &&
                        s.endTime !== "" &&
                        s.endTime !== null);
                }
                if (scheduleType.value === "queue" &&
                    queue.outOfHoursMessage !== null &&
                    queue.outOfHoursMessage !== "" &&
                    !(0, lodash_1.isNil)(schedule)) {
                    const startTime = (0, moment_1.default)(schedule.startTime, "HH:mm");
                    const endTime = (0, moment_1.default)(schedule.endTime, "HH:mm");
                    if (now.isBefore(startTime) || now.isAfter(endTime)) {
                        const body = queue.outOfHoursMessage;
                        const debouncedSentMessage = (0, Debounce_1.debounce)(async () => {
                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                                text: body
                            });
                        }, 3000, ticket.id);
                        debouncedSentMessage();
                        return;
                    }
                }
            }
        }
        catch (e) {
            Sentry.captureException(e);
            console.log(e);
        }
        if (!whatsapp?.queues?.length &&
            !ticket.userId &&
            !isGroup &&
            !msg.key.fromMe) {
            const lastMessage = await Message_1.default.findOne({
                where: {
                    ticketId: ticket.id,
                    fromMe: true
                },
                order: [["createdAt", "DESC"]]
            });
            if (lastMessage && lastMessage.body.includes(whatsapp.greetingMessage)) {
                return;
            }
            if (whatsapp.greetingMessage) {
                const debouncedSentMessage = (0, Debounce_1.debounce)(async () => {
                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                        text: whatsapp.greetingMessage
                    });
                }, 1000, ticket.id);
                debouncedSentMessage();
                return;
            }
        }
        if (whatsapp.queues.length == 1 && ticket.queue) {
            if (ticket.chatbot && !msg.key.fromMe) {
                await handleChartbot(ticket, msg, wbot);
            }
        }
        if (whatsapp.queues.length > 1 && ticket.queue) {
            if (ticket.chatbot && !msg.key.fromMe) {
                await handleChartbot(ticket, msg, wbot, dontReadTheFirstQuestion);
            }
        }
    }
    catch (err) {
        console.log(err);
        Sentry.captureException(err);
        logger_1.logger.error(`Error handling whatsapp message: Err: ${err}`);
    }
};
exports.handleMessage = handleMessage;
const handleMsgAck = async (msg, chat) => {
    await new Promise(r => setTimeout(r, 500));
    const io = (0, socket_1.getIO)();
    try {
        const messageToUpdate = await Message_1.default.findByPk(msg.key.id, {
            include: [
                "contact",
                {
                    model: Message_1.default,
                    as: "quotedMsg",
                    include: ["contact"]
                }
            ]
        });
        if (!messageToUpdate)
            return;
        await messageToUpdate.update({ ack: chat });
        io.to(messageToUpdate.ticketId.toString()).emit(`company-${messageToUpdate.companyId}-appMessage`, {
            action: "update",
            message: messageToUpdate
        });
    }
    catch (err) {
        Sentry.captureException(err);
        logger_1.logger.error(`Error handling message ack. Err: ${err}`);
    }
};
const verifyCampaignMessageAndCloseTicket = async (message, companyId) => {
    const io = (0, socket_1.getIO)();
    const body = (0, exports.getBodyMessage)(message);
    const isCampaign = /\u200c/.test(body);
    if (message.key.fromMe && isCampaign) {
        const messageRecord = await Message_1.default.findOne({
            where: { id: message.key.id, companyId }
        });
        const ticket = await Ticket_1.default.findByPk(messageRecord.ticketId);
        await ticket.update({ status: "closed" });
        io.to(`company-${ticket.companyId}-open`)
            .to(`queue-${ticket.queueId}-open`)
            .emit(`company-${ticket.companyId}-ticket`, {
            action: "delete",
            ticket,
            ticketId: ticket.id
        });
        io.to(`company-${ticket.companyId}-${ticket.status}`)
            .to(`queue-${ticket.queueId}-${ticket.status}`)
            .to(ticket.id.toString())
            .emit(`company-${ticket.companyId}-ticket`, {
            action: "update",
            ticket,
            ticketId: ticket.id
        });
    }
};
const filterMessages = (msg) => {
    if (msg.message?.protocolMessage)
        return false;
    if ([
        baileys_1.WAMessageStubType.REVOKE,
        baileys_1.WAMessageStubType.E2E_DEVICE_CHANGED,
        baileys_1.WAMessageStubType.E2E_IDENTITY_CHANGED,
        baileys_1.WAMessageStubType.CIPHERTEXT
    ].includes(msg.messageStubType))
        return false;
    return true;
};
const wbotMessageListener = async (wbot, companyId) => {
    try {
        wbot.ev.on("messages.upsert", async (messageUpsert) => {
            const messages = messageUpsert.messages
                .filter(filterMessages)
                .map(msg => msg);
            if (!messages)
                return;
            for (const message of messages) {
                const messageExists = await Message_1.default.count({
                    where: { id: message.key.id, companyId }
                });
                if (!messageExists) {
                    await handleMessage(message, wbot, companyId);
                    await verifyCampaignMessageAndCloseTicket(message, companyId);
                }
            }
        });
        wbot.ev.on("messages.update", (messageUpdate) => {
            if (messageUpdate.length === 0)
                return;
            messageUpdate.forEach(async (message) => {
                wbot.readMessages([message.key]);
                handleMsgAck(message, message.update.status);
            });
        });
        // wbot.ev.on("messages.set", async (messageSet: IMessage) => {
        //   messageSet.messages.filter(filterMessages).map(msg => msg);
        // });
    }
    catch (error) {
        Sentry.captureException(error);
        logger_1.logger.error(`Error handling wbot message listener. Err: ${error}`);
    }
};
exports.wbotMessageListener = wbotMessageListener;
