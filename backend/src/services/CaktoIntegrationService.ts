import moment from "moment";
import Company from "../models/Company";
import User from "../models/User";
import Plan from "../models/Plan";
import Setting from "../models/Setting";
import Queue from "../models/Queue";
import CaktoWebhookLog from "../models/CaktoWebhookLog";
import { logger } from "../utils/logger";

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  docType?: string;
  docNumber?: string;
}

interface CaktoPaymentData {
  amount: number;
  customer: CustomerData;
  paidAt: string;
  orderId: string;
  event: string;
  payload: any;
}

class CaktoIntegrationService {
  
  async logWebhook(data: CaktoPaymentData, processingStatus: string, processingMessage: string, companyId?: number): Promise<CaktoWebhookLog> {
    return await CaktoWebhookLog.create({
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

  async findPlanByValue(amount: number): Promise<Plan | null> {
    return await Plan.findOne({
      where: { value: amount }
    });
  }

  async findCompanyByEmail(email: string): Promise<Company | null> {
    return await Company.findOne({
      where: { email },
      include: [Plan]
    });
  }

  async updateExistingCompany(company: Company, plan: Plan): Promise<Company> {
    const expiresAt = moment().add(30, 'days').format('YYYY-MM-DD HH:mm:ss');
    
    await company.update({
      planId: plan.id,
      status: true,
      dueDate: expiresAt,
      recurrence: "MENSAL"
    });

    logger.info(`Empresa atualizada: ${company.name} - Plano: ${plan.name}`);
    return company;
  }

  async createNewCompany(customerData: CustomerData, plan: Plan): Promise<{ company: Company; user: User }> {
    const expiresAt = moment().add(30, 'days').format('YYYY-MM-DD HH:mm:ss');
    
    // Criar empresa
    const company = await Company.create({
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      planId: plan.id,
      status: true,
      dueDate: expiresAt,
      recurrence: "MENSAL",
      language: "pt-BR"
    });

    logger.info(`Nova empresa criada: ${company.name} (ID: ${company.id})`);

    // Criar usuário administrador
    const user = await User.create({
      name: customerData.name,
      email: customerData.email,
      password: "zapclic123", // Senha padrão - será enviada por email
      profile: "admin",
      companyId: company.id,
      super: false,
      online: false
    });

    logger.info(`Usuário administrador criado: ${user.name} (ID: ${user.id})`);

    // Criar configurações padrão da empresa
    await this.createDefaultSettings(company.id);

    // Criar setor padrão
    await this.createDefaultQueue(company.id);

    return { company, user };
  }

  private async createDefaultSettings(companyId: number): Promise<void> {
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
      await Setting.create(setting);
    }

    logger.info(`Configurações padrão criadas para empresa ${companyId}`);
  }

  private async createDefaultQueue(companyId: number): Promise<void> {
    await Queue.create({
      name: "Atendimento",
      color: "#1DCC91",
      greetingMessage: "Olá! Como posso ajudá-lo hoje?",
      companyId,
      orderQueue: 1
    });

    logger.info(`Setor padrão criado para empresa ${companyId}`);
  }

  async processPayment(paymentData: CaktoPaymentData): Promise<{
    success: boolean;
    company: Company;
    user?: User;
    plan: Plan;
    isNewCompany: boolean;
    webhookLog: CaktoWebhookLog;
  }> {
    const { amount, customer } = paymentData;
    let webhookLog: CaktoWebhookLog;

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
      let user: User | undefined;
      let isNewCompany = false;

      if (company) {
        // Atualizar empresa existente
        company = await this.updateExistingCompany(company, plan);
        const successMessage = `Empresa existente atualizada: ${company.name} - Plano: ${plan.name}`;
        webhookLog = await this.logWebhook(paymentData, 'success', successMessage, company.id);
      } else {
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

    } catch (error) {
      if (!webhookLog) {
        webhookLog = await this.logWebhook(paymentData, 'error', error.message);
      }
      throw error;
    }
  }
}

export default new CaktoIntegrationService();
