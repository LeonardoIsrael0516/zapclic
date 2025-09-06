import express from "express";
import isAuth from "../middleware/isAuth";
import * as FlowExecutionController from "../controllers/FlowExecutionController";

const flowExecutionRoutes = express.Router();

flowExecutionRoutes.post(
  "/flow/execute",
  isAuth,
  FlowExecutionController.executeFlowManually
);

export default flowExecutionRoutes;