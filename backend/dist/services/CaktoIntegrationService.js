"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const Company_1 = __importDefault(require("../models/Company"));
const User_1 = __importDefault(require("../models/User"));
const Plan_1 = __importDefault(require("../models/Plan"));
const Setting_1 = __importDefault(require("../models/Setting"));
const Queue_1 = __importDefault(require("../models/Queue"));
const CaktoWebhookLog_1 = __importDefault(require("../models/CaktoWebhookLog"));
const logger_1 = require("../utils/logger");
class CaktoIntegrationService {
    async logWebhook(data, processingStatus, processingMessage, companyId) {
        return await CaktoWebhookLog_1.default.create({
            orderId: data.orderId,
            event: data.event,
            status: data.payload.data.status,
            amount: data.amount,
            customerEmail: data.customer.email,
            customerName: data.customer.name,
            customerPhone: data.customer.phone,
            payload: data.payload,
            processed: processingStatus === 'success',
            processingStatus,
            processingMessage,
            companyId
        });
    }
    async findPlanByValue(amount) {
        return await Plan_1.default.findOne({
            where: { value: amount }
        });
    }
    async findCompanyByEmail(email) {
        return await Company_1.default.findOne({
            where: { email },
            include: [Plan_1.default]
        });
    }
    async updateExistingCompany(company, plan) {
        const expiresAt = (0, moment_1.default)().add(30, 'days').format('YYYY-MM-DD HH:mm:ss');
        await company.update({
            planId: plan.id,
            status: true,
            dueDate: expiresAt,
            recurrence: "MENSAL"
        });
        logger_1.logger.info(`Empresa atualizada: ${company.name} - Plano: ${plan.name}`);
        return company;
    }
    async createNewCompany(customerData, plan) {
        const expiresAt = (0, moment_1.default)().add(30, 'days').format('YYYY-MM-DD HH:mm:ss');
        // Criar empresa
        const company = await Company_1.default.create({
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            planId: plan.id,
            status: true,
            dueDate: expiresAt,
            recurrence: "MENSAL",
            language: "pt-BR"
        });
        logger_1.logger.info(`Nova empresa criada: ${company.name} (ID: ${company.id})`);
        // Criar usuário administrador
        const user = await User_1.default.create({
            name: customerData.name,
            email: customerData.email,
            password: "zapclic123",
            profile: "admin",
            companyId: company.id,
            super: false,
            online: false
        });
        logger_1.logger.info(`Usuário administrador criado: ${user.name} (ID: ${user.id})`);
        // Criar configurações padrão da empresa
        await this.createDefaultSettings(company.id);
        // Criar setor padrão
        await this.createDefaultQueue(company.id);
        return { company, user };
    }
    async createDefaultSettings(companyId) {
        const defaultSettings = [
            { key: "asaas", value: "", companyId },
            { key: "caktoToken", value: "", companyId },
            { key: "userCreation", value: "enabled", companyId },
            { key: "call", value: "disabled", companyId },
            { key: "sideMenu", value: "enabled", companyId },
            { key: "closeTicketApi", value: "disabled", companyId },
            { key: "darkMode", value: "disabled", companyId },
            { key: "ASC", value: "enabled", companyId },
            { key: "created", value: "enabled", companyId },
            { key: "timeCreateNewTicket", value: "10", companyId },
            { key: "chatBotType", value: "text", companyId },
            { key: "CheckMsgIsGroup", value: "enabled", companyId },
            { key: "DirectTicketsToWallets", value: "enabled", companyId }
        ];
        for (const setting of defaultSettings) {
            await Setting_1.default.create(setting);
        }
        logger_1.logger.info(`Configurações padrão criadas para empresa ${companyId}`);
    }
    async createDefaultQueue(companyId) {
        await Queue_1.default.create({
            name: "Atendimento",
            color: "#1DCC91",
            greetingMessage: "Olá! Como posso ajudá-lo hoje?",
            companyId,
            orderQueue: 1
        });
        logger_1.logger.info(`Setor padrão criado para empresa ${companyId}`);
    }
    async processPayment(paymentData) {
        const { amount, customer } = paymentData;
        let webhookLog;
        try {
            // Buscar plano pelo valor
            const plan = await this.findPlanByValue(amount);
            if (!plan) {
                const errorMessage = `Nenhum plano encontrado para o valor: R$ ${amount}`;
                webhookLog = await this.logWebhook(paymentData, 'error', errorMessage);
                throw new Error(errorMessage);
            }
            // Verificar se empresa já existe
            let company = await this.findCompanyByEmail(customer.email);
            let user;
            let isNewCompany = false;
            if (company) {
                // Atualizar empresa existente
                company = await this.updateExistingCompany(company, plan);
                const successMessage = `Empresa existente atualizada: ${company.name} - Plano: ${plan.name}`;
                webhookLog = await this.logWebhook(paymentData, 'success', successMessage, company.id);
            }
            else {
                // Criar nova empresa
                const result = await this.createNewCompany(customer, plan);
                company = result.company;
                user = result.user;
                isNewCompany = true;
                const successMessage = `Nova empresa criada: ${company.name} - Usuário: ${user.name} - Plano: ${plan.name}`;
                webhookLog = await this.logWebhook(paymentData, 'success', successMessage, company.id);
            }
            return {
                success: true,
                company,
                user,
                plan,
                isNewCompany,
                webhookLog
            };
        }
        catch (error) {
            if (!webhookLog) {
                webhookLog = await this.logWebhook(paymentData, 'error', error.message);
            }
            throw error;
        }
    }
}
exports.default = new CaktoIntegrationService();
