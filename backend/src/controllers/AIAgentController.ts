import { Request, Response } from "express";
import * as Yup from "yup";

import CreateAIAgentService from "../services/AIAgentService/CreateAIAgentService";
import DeleteAIAgentService from "../services/AIAgentService/DeleteAIAgentService";
import ListAIAgentsService from "../services/AIAgentService/ListAIAgentsService";
import ShowAIAgentService from "../services/AIAgentService/ShowAIAgentService";
import UpdateAIAgentService from "../services/AIAgentService/UpdateAIAgentService";

type IndexQuery = {
  searchParam?: string;
  pageNumber?: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { aiAgents, count, hasMore } = await ListAIAgentsService({
    searchParam,
    pageNumber,
    companyId
  });

  return res.json({ aiAgents, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const agentData = req.body;

  const aiAgent = await CreateAIAgentService({
    ...agentData,
    companyId
  });

  return res.status(200).json(aiAgent);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { agentId } = req.params;
  const { companyId } = req.user;

  const aiAgent = await ShowAIAgentService({ agentId, companyId });

  return res.status(200).json(aiAgent);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const agentData = req.body;
  const { agentId } = req.params;

  const aiAgent = await UpdateAIAgentService({
    agentData,
    agentId,
    companyId
  });

  return res.status(200).json(aiAgent);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { agentId } = req.params;
  const { companyId } = req.user;

  await DeleteAIAgentService({ agentId, companyId });

  return res.status(200).json({ message: "AI Agent deleted" });
};