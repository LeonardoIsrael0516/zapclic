import AppError from "../../errors/AppError";
import AIAgent from "../../models/AIAgent";
import ShowAIAgentService from "./ShowAIAgentService";

interface Request {
  agentId: string | number;
  companyId: number;
}

const DeleteAIAgentService = async ({
  agentId,
  companyId
}: Request): Promise<void> => {
  const aiAgent = await ShowAIAgentService({ agentId, companyId });

  if (!aiAgent) {
    throw new AppError("ERR_NO_AI_AGENT_FOUND", 404);
  }

  await aiAgent.destroy();
};

export default DeleteAIAgentService;