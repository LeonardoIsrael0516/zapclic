"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AIAgent_1 = __importDefault(require("../../models/AIAgent"));
const Message_1 = __importDefault(require("../../models/Message"));
const Contact_1 = __importDefault(require("../../models/Contact"));
const Queue_1 = __importDefault(require("../../models/Queue"));
const Company_1 = __importDefault(require("../../models/Company"));
const socket_1 = require("../../libs/socket");
const CreateMessageService_1 = __importDefault(require("../MessageServices/CreateMessageService"));
const ShowTicketService_1 = __importDefault(require("../TicketServices/ShowTicketService"));
const ProcessAIAgentService = async ({ agentId, ticketId, messageBody, companyId }) => {
    try {
        // Buscar o agente de IA
        const aiAgent = await AIAgent_1.default.findOne({
            where: { id: agentId, companyId, isActive: true },
            include: [
                {
                    model: Company_1.default,
                    as: "company",
                    attributes: ["id", "name"]
                },
                {
                    model: Queue_1.default,
                    as: "queue",
                    attributes: ["id", "name", "color"]
                }
            ]
        });
        if (!aiAgent) {
            console.log(`AI Agent ${agentId} not found or inactive`);
            return;
        }
        // Buscar o ticket
        const ticket = await (0, ShowTicketService_1.default)(ticketId, companyId);
        if (!ticket) {
            console.log(`Ticket ${ticketId} not found`);
            return;
        }
        // Buscar mensagens anteriores do ticket para contexto
        const previousMessages = await Message_1.default.findAll({
            where: { ticketId },
            order: [["createdAt", "DESC"]],
            limit: 10,
            include: [
                {
                    model: Contact_1.default,
                    as: "contact",
                    attributes: ["id", "name"]
                }
            ]
        });
        // Construir contexto da conversa
        const conversationContext = previousMessages
            .reverse()
            .map(msg => `${msg.fromMe ? "Assistente" : "Cliente"}: ${msg.body}`)
            .join("\n");
        // Preparar prompt completo
        const fullPrompt = `${aiAgent.prompt}\n\nContexto da conversa:\n${conversationContext}\n\nMensagem atual do cliente: ${messageBody}\n\nResponda de forma útil e profissional:`;
        // Simular resposta da IA (aqui você integraria com OpenAI, Anthropic, etc.)
        const aiResponse = await generateAIResponse({
            prompt: fullPrompt,
            provider: aiAgent.provider,
            model: aiAgent.model,
            apiKey: aiAgent.apiKey,
            functions: aiAgent.activeFunctions
        });
        // Aguardar o intervalo configurado antes de responder
        await new Promise(resolve => setTimeout(resolve, aiAgent.responseInterval));
        // Criar mensagem de resposta
        const responseMessage = await (0, CreateMessageService_1.default)({
            messageData: {
                id: `ai-${Date.now()}-${Math.random()}`,
                ticketId: ticketId,
                body: aiResponse.message,
                fromMe: true,
                read: true
            },
            companyId
        });
        // Emitir evento via socket
        const io = (0, socket_1.getIO)();
        io.to(`company-${companyId}-mainchannel`)
            .to(`queue-${ticket.queueId}-notification`)
            .to(ticketId.toString())
            .emit(`company-${companyId}-ticket`, {
            action: "update",
            ticket,
            message: responseMessage
        });
        // Processar ações adicionais se necessário
        if (aiResponse.shouldTransfer && aiResponse.queueId) {
            // Lógica para transferir ticket
            console.log(`Transferring ticket ${ticketId} to queue ${aiResponse.queueId}`);
        }
        if (aiResponse.shouldClose) {
            // Lógica para fechar ticket
            console.log(`Closing ticket ${ticketId}`);
        }
        // Processar chamadas de função se houver
        if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
            await processFunctionCalls(aiResponse.functionCalls, ticket, companyId);
        }
    }
    catch (error) {
        console.error("Error processing AI Agent:", error);
    }
};
// Função auxiliar para gerar resposta da IA
const generateAIResponse = async ({ prompt, provider, model, apiKey, functions }) => {
    // Aqui você implementaria a integração real com os provedores de IA
    // Por enquanto, retornamos uma resposta simulada
    const responses = [
        "Olá! Como posso ajudá-lo hoje?",
        "Entendi sua solicitação. Vou verificar isso para você.",
        "Obrigado por entrar em contato. Estou aqui para ajudar.",
        "Posso esclarecer essa dúvida para você.",
        "Vou encaminhar sua solicitação para o setor responsável."
    ];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return {
        message: randomResponse,
        shouldTransfer: false,
        shouldClose: false,
        functionCalls: []
    };
};
// Função auxiliar para processar chamadas de função
const processFunctionCalls = async (functionCalls, ticket, companyId) => {
    for (const functionCall of functionCalls) {
        switch (functionCall.name) {
            case "get_calendar_events":
                // Implementar integração com Google Calendar
                console.log("Processing calendar function call");
                break;
            case "create_tag":
                // Implementar criação de tag
                console.log("Processing tag creation");
                break;
            case "transfer_to_queue":
                // Implementar transferência para fila
                console.log("Processing queue transfer");
                break;
            default:
                console.log(`Unknown function: ${functionCall.name}`);
        }
    }
};
exports.default = ProcessAIAgentService;
