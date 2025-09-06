"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_1 = require("../../libs/socket");
const moment_1 = __importDefault(require("moment"));
const Message_1 = __importDefault(require("../../models/Message"));
const Ticket_1 = __importDefault(require("../../models/Ticket"));
const Whatsapp_1 = __importDefault(require("../../models/Whatsapp"));
const CreateMessageService = async ({ messageData, companyId }) => {
    await Message_1.default.upsert({ ...messageData, companyId });
    const message = await Message_1.default.findByPk(messageData.id, {
        include: [
            "contact",
            {
                model: Ticket_1.default,
                as: "ticket",
                include: [
                    "contact",
                    "queue",
                    {
                        model: Whatsapp_1.default,
                        as: "whatsapp",
                        attributes: ["name"]
                    }
                ]
            },
            {
                model: Message_1.default,
                as: "quotedMsg",
                include: ["contact"]
            }
        ]
    });
    if (message.ticket.queueId !== null && message.queueId === null) {
        await message.update({ queueId: message.ticket.queueId });
    }
    if (!message) {
        throw new Error("ERR_CREATING_MESSAGE");
    }
    const io = (0, socket_1.getIO)();
    io.to(message.ticketId.toString())
        .to(`company-${companyId}-${message.ticket.status}`)
        .to(`company-${companyId}-notification`)
        .to(`company-${companyId}-mainchannel`)
        .to(`queue-${message.ticket.queueId}-${message.ticket.status}`)
        .to(`queue-${message.ticket.queueId}-notification`)
        .emit(`company-${companyId}-appMessage`, {
        action: "create",
        message,
        ticket: message.ticket,
        contact: message.ticket.contact
    });
    // Emite evento adicional para atualização imediata das abas
    io.to(`company-${companyId}-mainchannel`)
        .emit(`company-${companyId}-chat`, {
        action: "new-message",
        ticketId: message.ticketId,
        messageId: message.id,
        status: message.ticket.status,
        timestamp: (0, moment_1.default)().toISOString()
    });
    return message;
};
exports.default = CreateMessageService;
