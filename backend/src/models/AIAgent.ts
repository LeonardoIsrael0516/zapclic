import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  BeforeCreate,
  BeforeUpdate,
  PrimaryKey,
  AutoIncrement,
  Default,
  HasMany,
  BelongsTo,
  ForeignKey
} from "sequelize-typescript";
import Company from "./Company";
import Queue from "./Queue";

@Table
class AIAgent extends Model<AIAgent> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column(DataType.STRING)
  name: string;

  @Default("openai")
  @Column(DataType.STRING)
  provider: string;

  @Default("gpt-3.5-turbo")
  @Column(DataType.STRING)
  model: string;

  @Column(DataType.TEXT)
  apiKey: string;

  @Column(DataType.TEXT)
  prompt: string;

  @Default(1000)
  @Column(DataType.INTEGER)
  responseInterval: number;

  @Column(DataType.JSON)
  functions: object;

  @Column(DataType.JSON)
  activeFunctions: string[];

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive: boolean;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => Queue)
  @Column
  queueId: number;

  @BelongsTo(() => Queue)
  queue: Queue;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default AIAgent;