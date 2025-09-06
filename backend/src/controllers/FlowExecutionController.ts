import { Request, Response } from "express";
import { FlowBuilderModel } from "../models/FlowBuilder";
import Ticket from "../models/Ticket";
import Contact from "../models/Contact";
import Whatsapp from "../models/Whatsapp";
import AppError from "../errors/AppError";
import { ActionsWebhookService } from "../services/WebhookService/ActionsWebhookService";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";

interface FlowExecutionRequest {
  flowId: number;
  ticketId: number;
}

export const executeFlowManually = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log("[FlowExecution] Iniciando execução manual de fluxo");
    const { flowId, ticketId }: FlowExecutionRequest = req.body;
    const { companyId } = req.user;
    
    console.log("[FlowExecution] Parâmetros recebidos:", { flowId, ticketId, companyId });

    // Validar se o fluxo existe e pertence à empresa
    console.log("[FlowExecution] Buscando fluxo...");
    const flow = await FlowBuilderModel.findOne({
      where: {
        id: flowId,
        company_id: companyId
      }
    });

    if (!flow) {
      console.log("[FlowExecution] Fluxo não encontrado");
      return res.status(404).json({ error: "Fluxo não encontrado" });
    }
    
    console.log("[FlowExecution] Fluxo encontrado:", { id: flow.id, name: flow.name });

    // Validar se o ticket existe e pertence à empresa
    console.log("[FlowExecution] Buscando ticket...");
    const ticket = await Ticket.findOne({
      where: {
        id: ticketId,
        companyId: companyId
      },
      include: [
        {
          model: Contact,
          as: "contact"
        },
        {
          model: Whatsapp,
          as: "whatsapp"
        }
      ]
    });

    if (!ticket) {
      console.log("[FlowExecution] Ticket não encontrado");
      return res.status(404).json({ error: "Ticket não encontrado" });
    }
    
    console.log("[FlowExecution] Ticket encontrado:", { id: ticket.id, status: ticket.status });

    // Verificar se o ticket está aberto
    if (ticket.status !== "open") {
      console.log("[FlowExecution] Ticket não está aberto:", ticket.status);
      return res.status(400).json({ error: "Ticket deve estar aberto para executar fluxo" });
    }

    // Executar o fluxo
    console.log("[FlowExecution] Preparando dados do fluxo...");
    const flowData = flow.flow as any;
    const nodes = flowData?.nodes;
    const connections = flowData?.connections;
    
    console.log("[FlowExecution] Dados do fluxo:", { 
      hasNodes: !!nodes, 
      nodesCount: nodes?.length || 0,
      hasConnections: !!connections 
    });

    if (!nodes || nodes.length === 0) {
      console.log("[FlowExecution] Fluxo não possui nós configurados");
      return res.status(400).json({ error: "Fluxo não possui nós configurados" });
    }

    // Atualizar o ticket para modo chatbot
    console.log("[FlowExecution] Atualizando ticket para modo chatbot...");
    await UpdateTicketService({
      ticketData: {
        status: "chatbot",
        flowWebhook: true
      },
      ticketId: ticket.id,
      companyId: companyId
    });
    
    console.log("[FlowExecution] Ticket atualizado. Iniciando execução do fluxo...");

    // Encontrar o primeiro nó (sem conexões de entrada)
    const targetIds = connections.map(conn => conn.target);
    const firstNode = nodes.find(node => !targetIds.includes(node.id));
    const startNodeId = firstNode ? firstNode.id : (nodes.length > 0 ? nodes[0].id : "start");
    
    console.log("[FlowExecution] Primeiro nó encontrado:", startNodeId);

    // Executar o fluxo
    await ActionsWebhookService(
      ticket.whatsappId,
      flow.id,
      ticket.companyId,
      nodes,
      connections,
      startNodeId,
      {},
      { inputs: [], keysFull: [] },
      `manual_${Date.now()}`,
      undefined,
      ticket.id
    );
    
    console.log("[FlowExecution] Fluxo executado com sucesso!");

    return res.status(200).json({
      success: true,
      message: "Fluxo executado com sucesso",
      flowId: flow.id,
      flowName: flow.name,
      ticketId: ticket.id
    });

  } catch (error) {
    console.error("[FlowExecution] Erro ao executar fluxo manualmente:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      details: error.message
    });
  }
};