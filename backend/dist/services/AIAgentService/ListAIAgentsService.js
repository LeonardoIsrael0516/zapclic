"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const AIAgent_1 = __importDefault(require("../../models/AIAgent"));
const Company_1 = __importDefault(require("../../models/Company"));
const Queue_1 = __importDefault(require("../../models/Queue"));
const ListAIAgentsService = async ({ searchParam = "", pageNumber = "1", companyId }) => {
    const whereCondition = {
        companyId,
        [sequelize_1.Op.or]: [
            {
                name: sequelize_1.Sequelize.where(sequelize_1.Sequelize.fn("LOWER", sequelize_1.Sequelize.col("name")), "LIKE", `%${searchParam.toLowerCase().trim()}%`)
            }
        ]
    };
    const limit = 20;
    const offset = limit * (+pageNumber - 1);
    const { count, rows: aiAgents } = await AIAgent_1.default.findAndCountAll({
        where: whereCondition,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        include: [
            {
                model: Company_1.default,
                as: "company",
                attributes: ["id", "name"]
            },
            {
                model: Queue_1.default,
                as: "queue",
                attributes: ["id", "name", "color"]
            }
        ]
    });
    const hasMore = count > offset + aiAgents.length;
    return {
        aiAgents,
        count,
        hasMore
    };
};
exports.default = ListAIAgentsService;
