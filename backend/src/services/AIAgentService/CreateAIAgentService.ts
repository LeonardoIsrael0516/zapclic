import * as Yup from "yup";
import AppError from "../../errors/AppError";
import AIAgent from "../../models/AIAgent";
import ShowAIAgentService from "./ShowAIAgentService";

interface AIAgentData {
  name: string;
  provider: string;
  model: string;
  apiKey: string;
  prompt: string;
  responseInterval?: number;
  functions?: object;
  activeFunctions?: string[];
  isActive?: boolean;
  companyId: number;
  queueId?: number;
}

const CreateAIAgentService = async (agentData: AIAgentData): Promise<AIAgent> => {
  const { 
    name, 
    provider, 
    model, 
    apiKey, 
    prompt, 
    companyId,
    responseInterval = 1000,
    functions = {},
    activeFunctions = [],
    isActive = true,
    queueId
  } = agentData;

  const agentSchema = Yup.object().shape({
    name: Yup.string().required("ERR_AI_AGENT_NAME_REQUIRED"),
    provider: Yup.string().required("ERR_AI_AGENT_PROVIDER_REQUIRED"),
    model: Yup.string().required("ERR_AI_AGENT_MODEL_REQUIRED"),
    apiKey: Yup.string().required("ERR_AI_AGENT_API_KEY_REQUIRED"),
    prompt: Yup.string().required("ERR_AI_AGENT_PROMPT_REQUIRED"),
    companyId: Yup.number().required("ERR_AI_AGENT_COMPANY_ID_REQUIRED"),
    responseInterval: Yup.number().min(100).max(10000)
  });

  try {
    await agentSchema.validate({ 
      name, 
      provider, 
      model, 
      apiKey, 
      prompt, 
      companyId, 
      responseInterval 
    });
  } catch (err) {
    throw new AppError(`${JSON.stringify(err, undefined, 2)}`);
  }

  let aiAgent = await AIAgent.create({
    name,
    provider,
    model,
    apiKey,
    prompt,
    responseInterval,
    functions,
    activeFunctions,
    isActive,
    companyId,
    queueId
  });

  aiAgent = await ShowAIAgentService({ agentId: aiAgent.id, companyId });

  return aiAgent;
};

export default CreateAIAgentService;