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
exports.startQueueProcess = exports.randomValue = exports.parseToMilliseconds = exports.campaignQueue = exports.sendScheduledMessages = exports.scheduleMonitor = exports.messageQueue = exports.queueMonitor = exports.userMonitor = void 0;
const Sentry = __importStar(require("@sentry/node"));
const bull_1 = __importDefault(require("bull"));
const SendMessage_1 = require("./helpers/SendMessage");
const Whatsapp_1 = __importDefault(require("./models/Whatsapp"));
const logger_1 = require("./utils/logger");
const moment_1 = __importDefault(require("moment"));
const Schedule_1 = __importDefault(require("./models/Schedule"));
const Contact_1 = __importDefault(require("./models/Contact"));
const sequelize_1 = require("sequelize");
const GetDefaultWhatsApp_1 = __importDefault(require("./helpers/GetDefaultWhatsApp"));
const Campaign_1 = __importDefault(require("./models/Campaign"));
const ContactList_1 = __importDefault(require("./models/ContactList"));
const ContactListItem_1 = __importDefault(require("./models/ContactListItem"));
const lodash_1 = require("lodash");
const CampaignSetting_1 = __importDefault(require("./models/CampaignSetting"));
const CampaignShipping_1 = __importDefault(require("./models/CampaignShipping"));
const GetWhatsappWbot_1 = __importDefault(require("./helpers/GetWhatsappWbot"));
const database_1 = __importDefault(require("./database"));
const SendWhatsAppMedia_1 = require("./services/WbotServices/SendWhatsAppMedia");
const socket_1 = require("./libs/socket");
const path_1 = __importDefault(require("path"));
const User_1 = __importDefault(require("./models/User"));
const Company_1 = __importDefault(require("./models/Company"));
const Plan_1 = __importDefault(require("./models/Plan"));
const ShowService_1 = __importDefault(require("./services/FileServices/ShowService"));
const date_fns_1 = require("date-fns");
const Mustache_1 = __importDefault(require("./helpers/Mustache"));
const wbotClosedTickets_1 = require("./services/WbotServices/wbotClosedTickets");
const nodemailer = require('nodemailer');
const CronJob = require('cron').CronJob;
const connection = process.env.REDIS_URI || "";
const limiterMax = process.env.REDIS_OPT_LIMITER_MAX || 1;
const limiterDuration = process.env.REDIS_OPT_LIMITER_DURATION || 3000;
exports.userMonitor = new bull_1.default("UserMonitor", connection);
exports.queueMonitor = new bull_1.default("QueueMonitor", connection);
exports.messageQueue = new bull_1.default("MessageQueue", connection, {
    limiter: {
        max: limiterMax,
        duration: limiterDuration
    }
});
exports.scheduleMonitor = new bull_1.default("ScheduleMonitor", connection);
exports.sendScheduledMessages = new bull_1.default("SendScheduledMessages", connection);
exports.campaignQueue = new bull_1.default("CampaignQueue", connection);
async function handleSendMessage(job) {
    try {
        const { data } = job;
        const whatsapp = await Whatsapp_1.default.findByPk(data.whatsappId);
        if (whatsapp == null) {
            throw Error("Whatsapp não identificado");
        }
        const messageData = data.data;
        await (0, SendMessage_1.SendMessage)(whatsapp, messageData);
    }
    catch (e) {
        Sentry.captureException(e);
        logger_1.logger.error("MessageQueue -> SendMessage: error", e.message);
        throw e;
    }
}
{ /*async function handleVerifyQueue(job) {
  logger.info("Buscando atendimentos perdidos nas filas");
  try {
    const companies = await Company.findAll({
      attributes: ['id', 'name'],
      where: {
        status: true,
        dueDate: {
          [Op.gt]: Sequelize.literal('CURRENT_DATE')
        }
      },
      include: [
        {
          model: Whatsapp, attributes: ["id", "name", "status", "timeSendQueue", "sendIdQueue"], where: {
            timeSendQueue: {
              [Op.gt]: 0
            }
          }
        },
      ]
    }); */
}
{ /*    companies.map(async c => {
      c.whatsapps.map(async w => {

        if (w.status === "CONNECTED") {

          var companyId = c.id;

          const moveQueue = w.timeSendQueue ? w.timeSendQueue : 0;
          const moveQueueId = w.sendIdQueue;
          const moveQueueTime = moveQueue;
          const idQueue = moveQueueId;
          const timeQueue = moveQueueTime;

          if (moveQueue > 0) {

            if (!isNaN(idQueue) && Number.isInteger(idQueue) && !isNaN(timeQueue) && Number.isInteger(timeQueue)) {

              const tempoPassado = moment().subtract(timeQueue, "minutes").utc().format();
              // const tempoAgora = moment().utc().format();

              const { count, rows: tickets } = await Ticket.findAndCountAll({
                where: {
                  status: "pending",
                  queueId: null,
                  companyId: companyId,
                  whatsappId: w.id,
                  updatedAt: {
                    [Op.lt]: tempoPassado
                  }
                },
                include: [
                  {
                    model: Contact,
                    as: "contact",
                    attributes: ["id", "name", "number", "email", "profilePicUrl"],
                    include: ["extraInfo"]
                  }
                ]
              });

              if (count > 0) {
                tickets.map(async ticket => {
                  await ticket.update({
                    queueId: idQueue
                  });

                  await ticket.reload();

                  const io = getIO();
                  io.to(ticket.status)
                    .to("notification")
                    .to(ticket.id.toString())
                    .emit(`company-${companyId}-ticket`, {
                      action: "update",
                      ticket,
                      ticketId: ticket.id
                    });

                  // io.to("pending").emit(`company-${companyId}-ticket`, {
                  //   action: "update",
                  //   ticket,
                  // });

                  logger.info(`Atendimento Perdido: ${ticket.id} - Empresa: ${companyId}`);
                });
              } else {
                logger.info(`Nenhum atendimento perdido encontrado - Empresa: ${companyId}`);
              }
            } else {
              logger.info(`Condição não respeitada - Empresa: ${companyId}`);
            }
          }
        }
      });
    });
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("SearchForQueue -> VerifyQueue: error", e.message);
    throw e;
  }
}; */
}
async function handleCloseTicketsAutomatic() {
    const job = new CronJob('*/1 * * * *', async () => {
        const companies = await Company_1.default.findAll();
        companies.map(async (c) => {
            try {
                const companyId = c.id;
                await (0, wbotClosedTickets_1.ClosedAllOpenTickets)(companyId);
            }
            catch (e) {
                Sentry.captureException(e);
                logger_1.logger.error("ClosedAllOpenTickets -> Verify: error", e.message);
                throw e;
            }
        });
    });
    job.start();
}
async function handleVerifySchedules(job) {
    try {
        const { count, rows: schedules } = await Schedule_1.default.findAndCountAll({
            where: {
                status: "PENDENTE",
                sentAt: null,
                sendAt: {
                    [sequelize_1.Op.gte]: (0, moment_1.default)().format("YYYY-MM-DD HH:mm:ss"),
                    [sequelize_1.Op.lte]: (0, moment_1.default)().add("300", "seconds").format("YYYY-MM-DD HH:mm:ss")
                }
            },
            include: [{ model: Contact_1.default, as: "contact" }]
        });
        if (count > 0) {
            schedules.map(async (schedule) => {
                await schedule.update({
                    status: "AGENDADA"
                });
                exports.sendScheduledMessages.add("SendMessage", { schedule }, { delay: 40000 });
                logger_1.logger.info(`[🧵] Disparo agendado para: ${schedule.contact.name}`);
            });
        }
    }
    catch (e) {
        Sentry.captureException(e);
        logger_1.logger.error("SendScheduledMessage -> Verify: error", e.message);
        throw e;
    }
}
async function handleSendScheduledMessage(job) {
    const { data: { schedule } } = job;
    let scheduleRecord = null;
    try {
        scheduleRecord = await Schedule_1.default.findByPk(schedule.id);
    }
    catch (e) {
        Sentry.captureException(e);
        logger_1.logger.info(`Erro ao tentar consultar agendamento: ${schedule.id}`);
    }
    try {
        const whatsapp = await (0, GetDefaultWhatsApp_1.default)(schedule.companyId);
        let filePath = null;
        if (schedule.mediaPath) {
            filePath = path_1.default.resolve("public", schedule.mediaPath);
        }
        await (0, SendMessage_1.SendMessage)(whatsapp, {
            number: schedule.contact.number,
            body: (0, Mustache_1.default)(schedule.body, schedule.contact),
            mediaPath: filePath
        });
        await scheduleRecord?.update({
            sentAt: (0, moment_1.default)().format("YYYY-MM-DD HH:mm"),
            status: "ENVIADA"
        });
        logger_1.logger.info(`[🧵] Mensagem agendada enviada para: ${schedule.contact.name}`);
        exports.sendScheduledMessages.clean(15000, "completed");
    }
    catch (e) {
        Sentry.captureException(e);
        await scheduleRecord?.update({
            status: "ERRO"
        });
        logger_1.logger.error("SendScheduledMessage -> SendMessage: error", e.message);
        throw e;
    }
}
async function handleVerifyCampaigns(job) {
    /**
     * @todo
     * Implementar filtro de campanhas
     */
    logger_1.logger.info("[🏁] - Verificando campanhas...");
    const campaigns = await database_1.default.query(`select id, "scheduledAt" from "Campaigns" c
    where "scheduledAt" between now() and now() + '1 hour'::interval and status = 'PROGRAMADA'`, { type: sequelize_1.QueryTypes.SELECT });
    if (campaigns.length > 0)
        logger_1.logger.info(`[🚩] - Campanhas encontradas: ${campaigns.length}`);
    for (let campaign of campaigns) {
        try {
            const now = (0, moment_1.default)();
            const scheduledAt = (0, moment_1.default)(campaign.scheduledAt);
            const delay = scheduledAt.diff(now, "milliseconds");
            logger_1.logger.info(`[📌] - Campanha enviada para a queue de processamento: Campanha=${campaign.id}, Delay Inicial=${delay}`);
            exports.campaignQueue.add("ProcessCampaign", {
                id: campaign.id,
                delay
            }, {
                removeOnComplete: true
            });
        }
        catch (err) {
            Sentry.captureException(err);
        }
    }
    logger_1.logger.info("[🏁] - Finalizando verificação de campanhas programadas...");
}
async function getCampaign(id) {
    return await Campaign_1.default.findByPk(id, {
        include: [
            {
                model: ContactList_1.default,
                as: "contactList",
                attributes: ["id", "name"],
                include: [
                    {
                        model: ContactListItem_1.default,
                        as: "contacts",
                        attributes: ["id", "name", "number", "email", "isWhatsappValid"],
                        where: { isWhatsappValid: true }
                    }
                ]
            },
            {
                model: Whatsapp_1.default,
                as: "whatsapp",
                attributes: ["id", "name"]
            },
            {
                model: CampaignShipping_1.default,
                as: "shipping",
                include: [{ model: ContactListItem_1.default, as: "contact" }]
            }
        ]
    });
}
async function getContact(id) {
    return await ContactListItem_1.default.findByPk(id, {
        attributes: ["id", "name", "number", "email"]
    });
}
async function getSettings(campaign) {
    const settings = await CampaignSetting_1.default.findAll({
        where: { companyId: campaign.companyId },
        attributes: ["key", "value"]
    });
    let messageInterval = 20;
    let longerIntervalAfter = 20;
    let greaterInterval = 60;
    let variables = [];
    settings.forEach(setting => {
        if (setting.key === "messageInterval") {
            messageInterval = JSON.parse(setting.value);
        }
        if (setting.key === "longerIntervalAfter") {
            longerIntervalAfter = JSON.parse(setting.value);
        }
        if (setting.key === "greaterInterval") {
            greaterInterval = JSON.parse(setting.value);
        }
        if (setting.key === "variables") {
            variables = JSON.parse(setting.value);
        }
    });
    return {
        messageInterval,
        longerIntervalAfter,
        greaterInterval,
        variables
    };
}
function parseToMilliseconds(seconds) {
    return seconds * 1000;
}
exports.parseToMilliseconds = parseToMilliseconds;
async function sleep(seconds) {
    logger_1.logger.info(`Sleep de ${seconds} segundos iniciado: ${(0, moment_1.default)().format("HH:mm:ss")}`);
    return new Promise(resolve => {
        setTimeout(() => {
            logger_1.logger.info(`Sleep de ${seconds} segundos finalizado: ${(0, moment_1.default)().format("HH:mm:ss")}`);
            resolve(true);
        }, parseToMilliseconds(seconds));
    });
}
function getCampaignValidMessages(campaign) {
    const messages = [];
    if (!(0, lodash_1.isEmpty)(campaign.message1) && !(0, lodash_1.isNil)(campaign.message1)) {
        messages.push(campaign.message1);
    }
    if (!(0, lodash_1.isEmpty)(campaign.message2) && !(0, lodash_1.isNil)(campaign.message2)) {
        messages.push(campaign.message2);
    }
    if (!(0, lodash_1.isEmpty)(campaign.message3) && !(0, lodash_1.isNil)(campaign.message3)) {
        messages.push(campaign.message3);
    }
    if (!(0, lodash_1.isEmpty)(campaign.message4) && !(0, lodash_1.isNil)(campaign.message4)) {
        messages.push(campaign.message4);
    }
    if (!(0, lodash_1.isEmpty)(campaign.message5) && !(0, lodash_1.isNil)(campaign.message5)) {
        messages.push(campaign.message5);
    }
    return messages;
}
function getProcessedMessage(msg, variables, contact) {
    let finalMessage = msg;
    if (finalMessage.includes("{nome}")) {
        finalMessage = finalMessage.replace(/{nome}/g, contact.name);
    }
    if (finalMessage.includes("{email}")) {
        finalMessage = finalMessage.replace(/{email}/g, contact.email);
    }
    if (finalMessage.includes("{numero}")) {
        finalMessage = finalMessage.replace(/{numero}/g, contact.number);
    }
    variables.forEach(variable => {
        if (finalMessage.includes(`{${variable.key}}`)) {
            const regex = new RegExp(`{${variable.key}}`, "g");
            finalMessage = finalMessage.replace(regex, variable.value);
        }
    });
    return finalMessage;
}
function randomValue(min, max) {
    return Math.floor(Math.random() * max) + min;
}
exports.randomValue = randomValue;
async function verifyAndFinalizeCampaign(campaign) {
    logger_1.logger.info("[🚨] - Verificando se o envio de campanhas finalizou");
    const { contacts } = campaign.contactList;
    const count1 = contacts.length;
    const count2 = await CampaignShipping_1.default.count({
        where: {
            campaignId: campaign.id,
            deliveredAt: {
                [sequelize_1.Op.not]: null
            }
        }
    });
    if (count1 === count2) {
        await campaign.update({ status: "FINALIZADA", completedAt: (0, moment_1.default)() });
    }
    const io = (0, socket_1.getIO)();
    io.to(`company-${campaign.companyId}-mainchannel`).emit(`company-${campaign.companyId}-campaign`, {
        action: "update",
        record: campaign
    });
    logger_1.logger.info("[🚨] - Fim da verificação de finalização de campanhas");
}
function calculateDelay(index, baseDelay, longerIntervalAfter, greaterInterval, messageInterval) {
    const diffSeconds = (0, date_fns_1.differenceInSeconds)(baseDelay, new Date());
    if (index > longerIntervalAfter) {
        return diffSeconds * 1000 + greaterInterval;
    }
    else {
        return diffSeconds * 1000 + messageInterval;
    }
}
async function getCampaignContacts(campaignId, batchSize = 100, offset = 0) {
    // Primeiro, busca a campanha para obter o contactListId
    const campaign = await Campaign_1.default.findByPk(campaignId, {
        attributes: ['contactListId']
    });
    if (!campaign || !campaign.contactListId) {
        return [];
    }
    // Busca contatos da lista de contatos com paginação
    return await ContactListItem_1.default.findAll({
        attributes: ['id', 'name', 'number', 'email'],
        where: {
            contactListId: campaign.contactListId,
            isWhatsappValid: true
        },
        limit: batchSize,
        offset: offset
    });
}
async function handleProcessCampaign(job) {
    const startTime = Date.now();
    logger_1.logger.info("[🏁] - Iniciou o processamento da campanha de ID: " + job.data.id);
    try {
        const { id } = job.data;
        // Carrega apenas dados essenciais da campanha
        const campaign = await Campaign_1.default.findByPk(id, {
            attributes: ['id', 'companyId', 'scheduledAt', 'status', 'contactListId'],
            include: [{
                    model: Whatsapp_1.default,
                    as: 'whatsapp',
                    attributes: ['id', 'name']
                }]
        });
        if (!campaign) {
            logger_1.logger.error(`[🚨] - Campanha não encontrada: ${id}`);
            return;
        }
        if (!campaign.contactListId) {
            logger_1.logger.error(`[🚨] - Campanha ${id} não possui lista de contatos associada`);
            return;
        }
        const settings = await getSettings(campaign);
        const batchSize = process.env.CAMPAIGN_BATCH_SIZE ? parseInt(process.env.CAMPAIGN_BATCH_SIZE) : 30;
        const rateLimit = process.env.CAMPAIGN_RATE_LIMIT ? parseInt(process.env.CAMPAIGN_RATE_LIMIT) : 5000;
        let offset = 0;
        let hasMoreContacts = true;
        let totalProcessed = 0;
        logger_1.logger.info(`[📊] - Iniciando processamento da campanha ${id} com batchSize: ${batchSize}`);
        while (hasMoreContacts) {
            const contacts = await getCampaignContacts(id, batchSize, offset);
            if (contacts.length === 0) {
                logger_1.logger.info(`[📊] - Nenhum contato encontrado para a campanha ${id}`);
                hasMoreContacts = false;
                continue;
            }
            logger_1.logger.info(`[📊] - Processando lote de ${contacts.length} contatos para campanha ${id} (offset: ${offset})`);
            const baseDelay = campaign.scheduledAt;
            const longerIntervalAfter = parseToMilliseconds(settings.longerIntervalAfter);
            const greaterInterval = parseToMilliseconds(settings.greaterInterval);
            const messageInterval = settings.messageInterval;
            const queuePromises = contacts.map((contact, index) => {
                const delay = calculateDelay(offset + index, baseDelay, longerIntervalAfter, greaterInterval, messageInterval);
                return exports.campaignQueue.add("PrepareContact", {
                    contactId: contact.id,
                    campaignId: campaign.id,
                    variables: settings.variables,
                    delay
                }, {
                    removeOnComplete: true,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000
                    }
                });
            });
            await Promise.all(queuePromises);
            totalProcessed += contacts.length;
            offset += contacts.length;
            // Se o número de contatos retornados é menor que o batchSize, significa que chegamos ao fim
            if (contacts.length < batchSize) {
                hasMoreContacts = false;
                logger_1.logger.info(`[📊] - Último lote processado para campanha ${id}. Total de contatos: ${totalProcessed}`);
            }
            // Log do progresso
            logger_1.logger.info(`[📊] - Progresso da campanha ${id}:`, {
                processed: totalProcessed,
                currentBatch: contacts.length,
                offset: offset,
                memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
            });
            // Pausa entre batches para não sobrecarregar o sistema
            await new Promise(resolve => setTimeout(resolve, rateLimit));
        }
        await campaign.update({ status: "EM_ANDAMENTO" });
        const duration = Date.now() - startTime;
        logger_1.logger.info(`[✅] - Campanha ${id} processada com sucesso:`, {
            totalContacts: totalProcessed,
            duration: `${Math.round(duration / 1000)}s`,
            memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
        });
    }
    catch (err) {
        Sentry.captureException(err);
        logger_1.logger.error(`[🚨] - Erro ao processar campanha ${job.data.id}:`, {
            error: err.message,
            stack: err.stack,
            memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
        });
        // Tenta reprocessar o job em caso de erro
        if (job.attemptsMade < 3) {
            logger_1.logger.info(`[🔄] - Tentativa ${job.attemptsMade + 1} de 3 para campanha ${job.data.id}`);
            await job.retry();
        }
        else {
            logger_1.logger.error(`[🚨] - Job falhou após 3 tentativas: ${job.data.id}`);
        }
    }
}
async function handlePrepareContact(job) {
    logger_1.logger.info("Preparando contatos");
    try {
        const { contactId, campaignId, delay, variables } = job.data;
        logger_1.logger.info(`[🏁] - Iniciou a preparação do contato | contatoId: ${contactId} CampanhaID: ${campaignId}`);
        const campaign = await getCampaign(campaignId);
        if (!campaign) {
            logger_1.logger.error(`[🚨] - Campanha ${campaignId} não encontrada`);
            return;
        }
        const contact = await getContact(contactId);
        if (!contact) {
            logger_1.logger.error(`[🚨] - Contato ${contactId} não encontrado`);
            return;
        }
        // Verifica se já existe um registro de envio para este contato nesta campanha
        const existingShipping = await CampaignShipping_1.default.findOne({
            where: {
                campaignId: campaignId,
                contactId: contactId
            }
        });
        if (existingShipping && existingShipping.deliveredAt) {
            logger_1.logger.info(`[📊] - Contato ${contactId} já foi enviado na campanha ${campaignId}`);
            return;
        }
        const campaignShipping = {};
        campaignShipping.number = contact.number;
        campaignShipping.contactId = contactId;
        campaignShipping.campaignId = campaignId;
        const messages = getCampaignValidMessages(campaign);
        if (messages.length) {
            const radomIndex = randomValue(0, messages.length);
            const message = getProcessedMessage(messages[radomIndex], variables, contact);
            campaignShipping.message = `\u200c ${message}`;
        }
        const [record, created] = await CampaignShipping_1.default.findOrCreate({
            where: {
                campaignId: campaignShipping.campaignId,
                contactId: campaignShipping.contactId
            },
            defaults: campaignShipping
        });
        logger_1.logger.info(`[🚩] - Registro de envio de campanha para contato criado | contatoId: ${contactId} CampanhaID: ${campaignId}`);
        if (!created &&
            record.deliveredAt === null) {
            record.set(campaignShipping);
            await record.save();
        }
        if (record.deliveredAt === null) {
            const nextJob = await exports.campaignQueue.add("DispatchCampaign", {
                campaignId: campaign.id,
                campaignShippingId: record.id,
                contactListItemId: contactId
            }, {
                delay
            });
            await record.update({ jobId: nextJob.id });
        }
        await verifyAndFinalizeCampaign(campaign);
        logger_1.logger.info(`[🏁] - Finalizado a preparação do contato | contatoId: ${contactId} CampanhaID: ${campaignId}`);
    }
    catch (err) {
        Sentry.captureException(err);
        logger_1.logger.error(`[🚨] - campaignQueue -> PrepareContact -> error: ${err.message}`, {
            contactId: job.data.contactId,
            campaignId: job.data.campaignId,
            error: err.message,
            stack: err.stack
        });
    }
}
async function handleDispatchCampaign(job) {
    try {
        const { data } = job;
        const { campaignShippingId, campaignId } = data;
        logger_1.logger.info(`[🏁] - Disparando campanha | CampaignShippingId: ${campaignShippingId} CampanhaID: ${campaignId}`);
        const campaign = await getCampaign(campaignId);
        if (!campaign) {
            logger_1.logger.error(`[🚨] - Campanha ${campaignId} não encontrada`);
            return;
        }
        const wbot = await (0, GetWhatsappWbot_1.default)(campaign.whatsapp);
        if (!wbot) {
            logger_1.logger.error(`[🚨] - Wbot não encontrado para campanha ${campaignId}`);
            return;
        }
        if (!campaign.whatsapp) {
            logger_1.logger.error(`[🚨] - WhatsApp não encontrado para campanha ${campaignId}`);
            return;
        }
        if (!wbot?.user?.id) {
            logger_1.logger.error(`[🚨] - Usuário do wbot não encontrado para campanha ${campaignId}`);
            return;
        }
        logger_1.logger.info(`[🚩] - Disparando campanha | CampaignShippingId: ${campaignShippingId} CampanhaID: ${campaignId}`);
        const campaignShipping = await CampaignShipping_1.default.findByPk(campaignShippingId, {
            include: [{ model: ContactListItem_1.default, as: "contact" }]
        });
        if (!campaignShipping) {
            logger_1.logger.error(`[🚨] - CampaignShipping ${campaignShippingId} não encontrado`);
            return;
        }
        const chatId = `${campaignShipping.number}@s.whatsapp.net`;
        let body = campaignShipping.message;
        if (!(0, lodash_1.isNil)(campaign.fileListId)) {
            logger_1.logger.info(`[🚩] - Recuperando a lista de arquivos | CampaignShippingId: ${campaignShippingId} CampanhaID: ${campaignId}`);
            try {
                const publicFolder = path_1.default.resolve(__dirname, "..", "public");
                const files = await (0, ShowService_1.default)(campaign.fileListId, campaign.companyId);
                const folder = path_1.default.resolve(publicFolder, "fileList", String(files.id));
                for (const [index, file] of files.options.entries()) {
                    const options = await (0, SendWhatsAppMedia_1.getMessageOptions)(file.path, path_1.default.resolve(folder, file.path), file.name);
                    await wbot.sendMessage(chatId, { ...options });
                    logger_1.logger.info(`[🚩] - Enviou arquivo: ${file.name} | CampaignShippingId: ${campaignShippingId} CampanhaID: ${campaignId}`);
                }
                ;
            }
            catch (error) {
                logger_1.logger.error(`[🚨] - Erro ao enviar arquivos: ${error.message}`);
            }
        }
        if (campaign.mediaPath) {
            logger_1.logger.info(`[🚩] - Preparando mídia da campanha: ${campaign.mediaPath} | CampaignShippingId: ${campaignShippingId} CampanhaID: ${campaignId}`);
            const publicFolder = path_1.default.resolve(__dirname, "..", "public");
            const filePath = path_1.default.join(publicFolder, campaign.mediaPath);
            const options = await (0, SendWhatsAppMedia_1.getMessageOptions)(campaign.mediaName, filePath, body);
            if (Object.keys(options).length) {
                await wbot.sendMessage(chatId, { ...options });
            }
        }
        else {
            logger_1.logger.info(`[🚩] - Enviando mensagem de texto da campanha | CampaignShippingId: ${campaignShippingId} CampanhaID: ${campaignId}`);
            await wbot.sendMessage(chatId, {
                text: body
            });
        }
        logger_1.logger.info(`[🚩] - Atualizando campanha para enviada... | CampaignShippingId: ${campaignShippingId} CampanhaID: ${campaignId}`);
        await campaignShipping.update({ deliveredAt: (0, moment_1.default)() });
        await verifyAndFinalizeCampaign(campaign);
        const io = (0, socket_1.getIO)();
        io.to(`company-${campaign.companyId}-mainchannel`).emit(`company-${campaign.companyId}-campaign`, {
            action: "update",
            record: campaign
        });
        logger_1.logger.info(`[🏁] - Campanha enviada para: Campanha=${campaignId};Contato=${campaignShipping.contact.name}`);
    }
    catch (err) {
        Sentry.captureException(err);
        logger_1.logger.error(`[🚨] - Erro ao disparar campanha: ${err.message}`, {
            campaignShippingId: job.data.campaignShippingId,
            campaignId: job.data.campaignId,
            error: err.message,
            stack: err.stack
        });
    }
}
async function handleLoginStatus(job) {
    const users = await database_1.default.query(`select id from "Users" where "updatedAt" < now() - '5 minutes'::interval and online = true`, { type: sequelize_1.QueryTypes.SELECT });
    for (let item of users) {
        try {
            const user = await User_1.default.findByPk(item.id);
            await user.update({ online: false });
            logger_1.logger.info(`Usuário passado para offline: ${item.id}`);
        }
        catch (e) {
            Sentry.captureException(e);
        }
    }
}
async function handleInvoiceCreate() {
    logger_1.logger.info("Iniciando geração de boletos");
    const job = new CronJob('*/5 * * * * *', async () => {
        const companies = await Company_1.default.findAll();
        companies.map(async (c) => {
            var dueDate = c.dueDate;
            const date = (0, moment_1.default)(dueDate).format();
            const timestamp = (0, moment_1.default)().format();
            const hoje = (0, moment_1.default)((0, moment_1.default)()).format("DD/MM/yyyy");
            var vencimento = (0, moment_1.default)(dueDate).format("DD/MM/yyyy");
            var diff = (0, moment_1.default)(vencimento, "DD/MM/yyyy").diff((0, moment_1.default)(hoje, "DD/MM/yyyy"));
            var dias = moment_1.default.duration(diff).asDays();
            if (dias < 20) {
                const plan = await Plan_1.default.findByPk(c.planId);
                const sql = `SELECT COUNT(*) mycount FROM "Invoices" WHERE "companyId" = ${c.id} AND "dueDate"::text LIKE '${(0, moment_1.default)(dueDate).format("yyyy-MM-DD")}%';`;
                const invoice = await database_1.default.query(sql, { type: sequelize_1.QueryTypes.SELECT });
                if (invoice[0]['mycount'] > 0) {
                }
                else {
                    const sql = `INSERT INTO "Invoices" (detail, status, value, "updatedAt", "createdAt", "dueDate", "companyId")
          VALUES ('${plan.name}', 'open', '${plan.value}', '${timestamp}', '${timestamp}', '${date}', ${c.id});`;
                    const invoiceInsert = await database_1.default.query(sql, { type: sequelize_1.QueryTypes.INSERT });
                    /*           let transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                  user: 'email@gmail.com',
                                  pass: 'senha'
                                }
                              });
          
                              const mailOptions = {
                                from: 'heenriquega@gmail.com', // sender address
                                to: `${c.email}`, // receiver (use array of string for a list)
                                subject: 'Fatura gerada - Sistema', // Subject line
                                html: `Olá ${c.name} esté é um email sobre sua fatura!<br>
                    <br>
                    Vencimento: ${vencimento}<br>
                    Valor: ${plan.value}<br>
                    Link: ${process.env.FRONTEND_URL}/financeiro<br>
                    <br>
                    Qualquer duvida estamos a disposição!
                                `// plain text body
                              };
          
                              transporter.sendMail(mailOptions, (err, info) => {
                                if (err)
                                  console.log(err)
                                else
                                  console.log(info);
                              }); */
                }
            }
        });
    });
    job.start();
}
handleCloseTicketsAutomatic();
handleInvoiceCreate();
async function startQueueProcess() {
    logger_1.logger.info("[🏁] - Iniciando processamento de filas");
    exports.messageQueue.process("SendMessage", handleSendMessage);
    exports.scheduleMonitor.process("Verify", handleVerifySchedules);
    exports.sendScheduledMessages.process("SendMessage", handleSendScheduledMessage);
    exports.userMonitor.process("VerifyLoginStatus", handleLoginStatus);
    exports.campaignQueue.process("VerifyCampaigns", 1, handleVerifyCampaigns);
    exports.campaignQueue.process("ProcessCampaign", 1, handleProcessCampaign);
    exports.campaignQueue.process("PrepareContact", 1, handlePrepareContact);
    exports.campaignQueue.process("DispatchCampaign", 1, handleDispatchCampaign);
    //queueMonitor.process("VerifyQueueStatus", handleVerifyQueue);
    async function cleanupCampaignQueue() {
        try {
            await exports.campaignQueue.clean(12 * 3600 * 1000, 'completed');
            await exports.campaignQueue.clean(24 * 3600 * 1000, 'failed');
            const jobs = await exports.campaignQueue.getJobs(['waiting', 'active']);
            for (const job of jobs) {
                if (Date.now() - job.timestamp > 24 * 3600 * 1000) {
                    await job.remove();
                }
            }
        }
        catch (error) {
            logger_1.logger.error('[🚨] - Erro na limpeza da queue de campanhas:', error);
        }
    }
    setInterval(cleanupCampaignQueue, 6 * 3600 * 1000);
    setInterval(async () => {
        const jobCounts = await exports.campaignQueue.getJobCounts();
        const memoryUsage = process.memoryUsage();
        logger_1.logger.info('[📌] - Status da queue de campanhas:', {
            jobs: jobCounts,
            memory: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
            }
        });
    }, 5 * 60 * 1000);
    exports.campaignQueue.on('completed', (job) => {
        logger_1.logger.info(`[📌] -   Campanha ${job.id} completada em ${Date.now() - job.timestamp}ms`);
    });
    exports.scheduleMonitor.add("Verify", {}, {
        repeat: { cron: "*/5 * * * * *", key: "verify" },
        removeOnComplete: true
    });
    exports.campaignQueue.add("VerifyCampaigns", {}, {
        repeat: { cron: "*/20 * * * * *", key: "verify-campaing" },
        removeOnComplete: true
    });
    exports.userMonitor.add("VerifyLoginStatus", {}, {
        repeat: { cron: "* * * * *", key: "verify-login" },
        removeOnComplete: true
    });
    exports.queueMonitor.add("VerifyQueueStatus", {}, {
        repeat: { cron: "*/20 * * * * *" },
        removeOnComplete: true
    });
}
exports.startQueueProcess = startQueueProcess;
