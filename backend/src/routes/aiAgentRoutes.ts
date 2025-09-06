import express from "express";
import isAuth from "../middleware/isAuth";

import * as AIAgentController from "../controllers/AIAgentController";

const aiAgentRoutes = express.Router();

aiAgentRoutes.get("/aiagents", isAuth, AIAgentController.index);
aiAgentRoutes.post("/aiagents", isAuth, AIAgentController.store);
aiAgentRoutes.get("/aiagents/:agentId", isAuth, AIAgentController.show);
aiAgentRoutes.put("/aiagents/:agentId", isAuth, AIAgentController.update);
aiAgentRoutes.delete("/aiagents/:agentId", isAuth, AIAgentController.remove);

export default aiAgentRoutes;