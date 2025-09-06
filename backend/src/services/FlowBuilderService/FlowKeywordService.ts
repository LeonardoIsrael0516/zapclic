import { FlowBuilderModel } from "../../models/FlowBuilder";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import { ActionsWebhookService } from "../WebhookService/ActionsWebhookService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import { Op } from "sequelize";

interface KeywordItem {
  text: string;
  type: 'equals' | 'contains';
}

interface FlowConfig {
  workingHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    workingDays: number[];
    outOfHoursMessage: string;
  };
  keywords?: {
    enabled: boolean;
    list: (string | KeywordItem)[];
    matchType?: 'equals' | 'contains';
  };
  autoSend?: {
    enabled: boolean;
  };
  autoStart?: {
    enabled: boolean;
    welcomeMessage: string;
  };
  whatsappId?: string | number;
}

interface FlowKeywordMatch {
  flowId: number;
  keyword: string | KeywordItem;
  config: FlowConfig;
}

class FlowKeywordService {
  /**
   * Verifica se está dentro do horário de expediente
   */
  private static isWithinWorkingHours(workingHours: FlowConfig['workingHours']): boolean {
    if (!workingHours?.enabled) return true;

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
  static async findFlowsByKeyword(
    keyword: string, 
    companyId: number,
    whatsappId?: number
  ): Promise<FlowKeywordMatch[]> {
    try {
      const flows = await FlowBuilderModel.findAll({
        where: {
          company_id: companyId,
          config: {
            [Op.ne]: null
          }
        }
      });

      const matches: FlowKeywordMatch[] = [];

      for (const flow of flows) {
        const config = flow.config as FlowConfig;
        
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
              } else {
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
    } catch (error) {
      console.error('Erro ao buscar fluxos por palavra-chave:', error);
      return [];
    }
  }

  /**
   * Busca fluxos com envio automático ativado para uma empresa
   */
  static async findAutoStartFlows(companyId: number): Promise<FlowBuilderModel[]> {
    try {
      console.log(`🔍 [DEBUG] Buscando fluxos autoSend para company ${companyId}`);
      const flows = await FlowBuilderModel.findAll({
        where: {
          company_id: companyId,
          config: {
            [Op.ne]: null
          }
        }
      });

      console.log(`🔍 [DEBUG] Encontrados ${flows.length} fluxos com config`);
      
      const autoSendFlows = flows.filter(flow => {
        const config = flow.config as FlowConfig;
        const hasAutoSend = config?.autoSend?.enabled === true;
        console.log(`🔍 [DEBUG] Fluxo ${flow.id} (${flow.name}) - autoSend: ${hasAutoSend}`);
        return hasAutoSend;
      });
      
      console.log(`🔍 [DEBUG] Total de fluxos autoSend encontrados: ${autoSendFlows.length}`);
      return autoSendFlows;
    } catch (error) {
      console.error('Erro ao buscar fluxos de envio automático:', error);
      return [];
    }
  }

  /**
   * Verifica se um fluxo pode ser executado baseado no horário de expediente
   */
  static canExecuteFlow(config: FlowConfig): {
    canExecute: boolean;
    outOfHoursMessage?: string;
  } {
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
  static async processMessage(
    messageBody: string,
    contact: Contact,
    ticket: Ticket,
    companyId: number,
    isNewContact: boolean = false,
    whatsappId?: number
  ): Promise<boolean> {
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
          const config = flow.config as FlowConfig;
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
          const flow = await FlowBuilderModel.findByPk(match.flowId);
          if (flow) {
            console.log(`🔍 [DEBUG] Executando fluxo ${flow.id} (${flow.name}) para palavra-chave`);
            await this.executeFlow(flow, contact, ticket);
            return true;
          }
        } else {
          console.log(`🔍 [DEBUG] Fluxo ${match.flowId} não pode ser executado:`, executionCheck);
        }
      }

      return false;
    } catch (error) {
      console.error('Erro ao processar mensagem para fluxos:', error);
      return false;
    }
  }

  /**
   * Processa Welcome flow quando não há palavra-chave específica
   */
  static async processWelcomeFlow(
    contact: Contact,
    ticket: Ticket,
    companyId: number,
    whatsappId: number,
    flowIdWelcome: number
  ): Promise<boolean> {
    try {
      if (!flowIdWelcome) {
        return false;
      }

      const flow = await FlowBuilderModel.findOne({
        where: {
          id: flowIdWelcome,
          company_id: companyId
        }
      });

      if (!flow) {
        return false;
      }

      const config = flow.config as FlowConfig;
      const executionCheck = this.canExecuteFlow(config);
      
      if (executionCheck.canExecute) {
        await this.executeFlow(flow, contact, ticket);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao processar Welcome flow:', error);
      return false;
    }
  }

  /**
   * Executa um fluxo específico
   */
  private static async executeFlow(
    flow: any,
    contact: Contact,
    ticket: Ticket
  ): Promise<void> {
    try {
      const whatsapp = await ShowWhatsAppService(ticket.whatsappId, ticket.companyId);
      
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
      } catch (error) {
        console.log(`[FlowKeywordService] Erro ao atualizar ticket (continuando execução do fluxo):`, error.message);
        // Continua a execução do fluxo mesmo se não conseguir atualizar o ticket
      }

      await ActionsWebhookService(
        whatsapp.id,
        flow.id,
        ticket.companyId,
        nodes,
        connections,
        flow.flow["nodes"][0].id,
        null,
        "",
        "",
        null,
        ticket.id,
        mountDataContact
      );

      console.log(`Fluxo executado com sucesso: ${flow.name}`);
    } catch (error) {
      console.error('Erro ao executar fluxo:', error);
      throw error;
    }
  }
}

export { FlowKeywordService };
export default FlowKeywordService;