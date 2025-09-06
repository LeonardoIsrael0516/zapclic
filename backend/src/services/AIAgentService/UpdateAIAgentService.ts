import * as Yup from "yup";
import AppError from "../../errors/AppError";
import AIAgent from "../../models/AIAgent";
import ShowAIAgentService from "./ShowAIAgentService";

interface AIAgentData {
  name?: string;
  provider?: string;
  model?: string;
  apiKey?: string;
  prompt?: string;
  responseInterval?: number;
  functions?: object;
  activeFunctions?: string[];
  isActive?: boolean;
  queueId?: number;
}

interface Request {
  agentData: AIAgentData;
  agentId: string | number;
  companyId: number;
}

const UpdateAIAgentService = async ({
  agentData,
  agentId,
  companyId
}: Request): Promise<AIAgent> => {
  const agentSchema = Yup.object().shape({
    name: Yup.string(),
    provider: Yup.string(),
    model: Yup.string(),
    apiKey: Yup.string(),
    prompt: Yup.string(),
    responseInterval: Yup.number().min(100).max(10000),
    isActive: Yup.boolean()
  });

  const {
    name,
    provider,
    model,
    apiKey,
    prompt,
    responseInterval,
    functions,
    activeFunctions,
    isActive,
    queueId
  } = agentData;

  try {
    await agentSchema.validate({
      name,
      provider,
      model,
      apiKey,
      prompt,
      responseInterval,
      isActive
    });
  } catch (err) {
    throw new AppError(`${JSON.stringify(err, undefined, 2)}`);
  }

  const aiAgent = await ShowAIAgentService({ agentId, companyId });

  await aiAgent.update({
    name,
    provider,
    model,
    apiKey,
    prompt,
    responseInterval,
    functions,
    activeFunctions,
    isActive,
    queueId
  });

  await aiAgent.reload({
    include: [
      {
        model: require("../../models/Company").default,
        as: "company",
        attributes: ["id", "name"]
      },
      {
        model: require("../../models/Queue").default,
        as: "queue",
        attributes: ["id", "name", "color"]
      }
    ]
  });

  return aiAgent;
};

export default UpdateAIAgentService;