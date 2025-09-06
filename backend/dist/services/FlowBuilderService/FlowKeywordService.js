"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowKeywordService = void 0;
const FlowBuilder_1 = require("../../models/FlowBuilder");
const ActionsWebhookService_1 = require("../WebhookService/ActionsWebhookService");
const ShowWhatsAppService_1 = __importDefault(require("../WhatsappService/ShowWhatsAppService"));
const sequelize_1 = require("sequelize");
class FlowKeywordService {
    /**
     * Verifica se está dentro do horário de expediente
     */
    static isWithinWorkingHours(workingHours) {
        if (!workingHours?.enabled)
            return true;
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM
        // Verifica se hoje é um dia de trabalho
        if (!workingHours.workingDays.includes(currentDay)) {
            return false;
        }
        // Verifica se está dentro do horário
        return currentTime >= workingHours.startTime && currentTime <= workingHours.endTime;
    }
    /**
     * Busca fluxos que têm palavras-chave ativadas para uma empresa
     */
    static async findFlowsByKeyword(keyword, companyId, whatsappId) {
        try {
            const flows = await FlowBuilder_1.FlowBuilderModel.findAll({
                where: {
                    company_id: companyId,
                    config: {
                        [sequelize_1.Op.ne]: null
                    }
                }
            });
            const matches = [];
            for (const flow of flows) {
                const config = flow.config;
                if (config?.keywords?.enabled && config.keywords.list?.length > 0) {
                    // Verificar se o fluxo está configurado para este WhatsApp específico
                    if (config.whatsappId && whatsappId) {
                        const configWhatsappId = typeof config.whatsappId === 'string' ?
                            parseInt(config.whatsappId) : config.whatsappId;
                        if (configWhatsappId !== whatsappId) {
                            console.log(`🔍 [DEBUG] Fluxo ${flow.id} configurado para WhatsApp ${configWhatsappId}, mas mensagem veio do WhatsApp ${whatsappId}`);
                            continue; // Pular este fluxo
                        }
                    }
                    // Verifica se a palavra-chave corresponde (case insensitive)
                    const keywordMatch = config.keywords.list.find(k => {
                        const messageText = keyword.toLowerCase().trim();
                        // Suporte para formato antigo (string)
                        if (typeof k === 'string') {
                            return k.toLowerCase() === messageText;
                        }
                        // Suporte para novo formato (objeto)
                        if (typeof k === 'object' && k.text) {
                            const keywordText = k.text.toLowerCase();
                            if (k.type === 'contains') {
                                return messageText.includes(keywordText) || keywordText.includes(messageText);
                            }
                            else {
                                // Default para 'equals'
                                return keywordText === messageText;
                            }
                        }
                        return false;
                    });
                    if (keywordMatch) {
                        console.log(`🔍 [DEBUG] Palavra-chave encontrada no fluxo ${flow.id}: ${JSON.stringify(keywordMatch)}`);
                        matches.push({
                            flowId: flow.id,
                            keyword: keywordMatch,
                            config
                        });
                    }
                }
            }
            return matches;
        }
        catch (error) {
            console.error('Erro ao buscar fluxos por palavra-chave:', error);
            return [];
        }
    }
    /**
     * Busca fluxos com envio automático ativado para uma empresa
     */
    static async findAutoStartFlows(companyId) {
        try {
            console.log(`🔍 [DEBUG] Buscando fluxos autoSend para company ${companyId}`);
            const flows = await FlowBuilder_1.FlowBuilderModel.findAll({
                where: {
                    company_id: companyId,
                    config: {
                        [sequelize_1.Op.ne]: null
                    }
                }
            });
            console.log(`🔍 [DEBUG] Encontrados ${flows.length} fluxos com config`);
            const autoSendFlows = flows.filter(flow => {
                const config = flow.config;
                const hasAutoSend = config?.autoSend?.enabled === true;
                console.log(`🔍 [DEBUG] Fluxo ${flow.id} (${flow.name}) - autoSend: ${hasAutoSend}`);
                return hasAutoSend;
            });
            console.log(`🔍 [DEBUG] Total de fluxos autoSend encontrados: ${autoSendFlows.length}`);
            return autoSendFlows;
        }
        catch (error) {
            console.error('Erro ao buscar fluxos de envio automático:', error);
            return [];
        }
    }
    /**
     * Verifica se um fluxo pode ser executado baseado no horário de expediente
     */
    static canExecuteFlow(config) {
        if (!config?.workingHours?.enabled) {
            return { canExecute: true };
        }
        const isWithinHours = this.isWithinWorkingHours(config.workingHours);
        if (!isWithinHours) {
            return {
                canExecute: false,
                outOfHoursMessage: config.workingHours.outOfHoursMessage ||
                    "Estamos fora do horário de atendimento. Retornaremos em breve."
            };
        }
        return { canExecute: true };
    }
    /**
     * Processa uma mensagem e verifica se deve disparar algum fluxo
     */
    static async processMessage(messageBody, contact, ticket, companyId, isNewContact = false, whatsappId) {
        try {
            // Verificar fluxo de início automático para novos contatos
            if (isNewContact) {
                // Verificar se o ticket já está em modo chatbot para evitar execução múltipla
                if (ticket.chatbot) {
                    console.log(`🔍 [DEBUG] Ticket ${ticket.id} já está em modo chatbot, pulando autoSend`);
                    return false;
                }
                const autoStartFlows = await this.findAutoStartFlows(companyId);
                for (const flow of autoStartFlows) {
                    const config = flow.config;
                    const executionCheck = this.canExecuteFlow(config);
                    if (executionCheck.canExecute) {
                        console.log(`🔍 [DEBUG] Executando fluxo autoSend ${flow.id} (${flow.name}) para novo contato`);
                        await this.executeFlow(flow, contact, ticket);
                        return true;
                    }
                }
            }
            // Verificar fluxos por palavra-chave
            const keywordMatches = await this.findFlowsByKeyword(messageBody, companyId, whatsappId);
            console.log(`🔍 [DEBUG] Encontrados ${keywordMatches.length} matches de palavra-chave para WhatsApp ${whatsappId}`);
            for (const match of keywordMatches) {
                const executionCheck = this.canExecuteFlow(match.config);
                if (executionCheck.canExecute) {
                    const flow = await FlowBuilder_1.FlowBuilderModel.findByPk(match.flowId);
                    if (flow) {
                        console.log(`🔍 [DEBUG] Executando fluxo ${flow.id} (${flow.name}) para palavra-chave`);
                        await this.executeFlow(flow, contact, ticket);
                        return true;
                    }
                }
                else {
                    console.log(`🔍 [DEBUG] Fluxo ${match.flowId} não pode ser executado:`, executionCheck);
                }
            }
            return false;
        }
        catch (error) {
            console.error('Erro ao processar mensagem para fluxos:', error);
            return false;
        }
    }
    /**
     * Processa Welcome flow quando não há palavra-chave específica
     */
    static async processWelcomeFlow(contact, ticket, companyId, whatsappId, flowIdWelcome) {
        try {
            if (!flowIdWelcome) {
                return false;
            }
            const flow = await FlowBuilder_1.FlowBuilderModel.findOne({
                where: {
                    id: flowIdWelcome,
                    company_id: companyId
                }
            });
            if (!flow) {
                return false;
            }
            const config = flow.config;
            const executionCheck = this.canExecuteFlow(config);
            if (executionCheck.canExecute) {
                await this.executeFlow(flow, contact, ticket);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Erro ao processar Welcome flow:', error);
            return false;
        }
    }
    /**
     * Executa um fluxo específico
     */
    static async executeFlow(flow, contact, ticket) {
        try {
            const whatsapp = await (0, ShowWhatsAppService_1.default)(ticket.whatsappId, ticket.companyId);
            const nodes = flow.flow["nodes"];
            const connections = flow.flow["connections"];
            const mountDataContact = {
                number: contact.number,
                name: contact.name,
                email: contact.email
            };
            // Marcar o ticket como chatbot quando um fluxo é disparado
            console.log(`[FlowKeywordService] Atualizando ticket ${ticket.id} para status: 'chatbot', flowWebhook: true`);
            try {
                // Atualizar diretamente o ticket
                await ticket.update({
                    status: 'chatbot',
                    chatbot: true,
                    flowWebhook: true
                });
                console.log(`[FlowKeywordService] Ticket atualizado: chatbot ${ticket.chatbot}`);
            }
            catch (error) {
                console.log(`[FlowKeywordService] Erro ao atualizar ticket (continuando execução do fluxo):`, error.message);
                // Continua a execução do fluxo mesmo se não conseguir atualizar o ticket
            }
            await (0, ActionsWebhookService_1.ActionsWebhookService)(whatsapp.id, flow.id, ticket.companyId, nodes, connections, flow.flow["nodes"][0].id, null, "", "", null, ticket.id, mountDataContact);
            console.log(`Fluxo executado com sucesso: ${flow.name}`);
        }
        catch (error) {
            console.error('Erro ao executar fluxo:', error);
            throw error;
        }
    }
}
exports.FlowKeywordService = FlowKeywordService;
exports.default = FlowKeywordService;
