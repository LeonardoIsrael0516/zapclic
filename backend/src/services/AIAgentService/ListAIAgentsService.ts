import { Sequelize, Op } from "sequelize";
import AIAgent from "../../models/AIAgent";
import Company from "../../models/Company";
import Queue from "../../models/Queue";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  companyId: number;
}

interface Response {
  aiAgents: AIAgent[];
  count: number;
  hasMore: boolean;
}

const ListAIAgentsService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId
}: Request): Promise<Response> => {
  const whereCondition = {
    companyId,
    [Op.or]: [
      {
        name: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("name")),
          "LIKE",
          `%${searchParam.toLowerCase().trim()}%`
        )
      }
    ]
  };

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: aiAgents } = await AIAgent.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
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

  const hasMore = count > offset + aiAgents.length;

  return {
    aiAgents,
    count,
    hasMore
  };
};

export default ListAIAgentsService;