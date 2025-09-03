import { WebhookModel } from "../../models/Webhook";
import User from "../../models/User";
import { FlowBuilderModel } from "../../models/FlowBuilder";

interface Request {
  companyId: number;
  idFlow: number
}

interface Response {
  flow: FlowBuilderModel
}

const GetFlowBuilderService = async ({
  companyId,
  idFlow
}: Request): Promise<Response> => {
  
    try {
    
        // Realiza a consulta com paginação usando findAndCountAll
        const { count, rows } = await FlowBuilderModel.findAndCountAll({
          where: {
            company_id: companyId,
            id: idFlow
          }
        });
        let flow = rows[0]

        if (!flow) {
          throw new Error(`Fluxo com ID ${idFlow} não encontrado para a empresa ${companyId}`);
        }

        return {
            flow: flow
        }
      } catch (error) {
        console.error('Erro ao consultar usuários:', error);
        throw error;
      }
};

export default GetFlowBuilderService;
