import AppError from "../../errors/AppError";
import AIAgent from "../../models/AIAgent";
import Company from "../../models/Company";
import Queue from "../../models/Queue";

interface Request {
  agentId: string | number;
  companyId: number;
}

const ShowAIAgentService = async ({ agentId, companyId }: Request): Promise<AIAgent> => {
  const aiAgent = await AIAgent.findOne({
    where: {
      id: agentId,
      companyId
    },
    include: [
      {
        model: Company,
        as: "company",
        attributes: ["id", "name"]
      },
      {
        model: Queue,
        as: "queue",
        attributes: ["id", "name", "color"]
      }
    ]
  });

  if (!aiAgent) {
    throw new AppError("ERR_NO_AI_AGENT_FOUND", 404);
  }

  return aiAgent;
};

export default ShowAIAgentService;