import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  DataType,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Company from "./Company";

@Table({
  tableName: "CaktoWebhookLogs"
})
class CaktoWebhookLog extends Model<CaktoWebhookLog> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  orderId: string;

  @Column
  event: string;

  @Column
  status: string;

  @Column({
    type: DataType.DECIMAL(10, 2)
  })
  amount: number;

  @Column
  customerEmail: string;

  @Column
  customerName: string;

  @Column
  customerPhone: string;

  @Column({
    type: DataType.JSONB
  })
  payload: object;

  @Column
  processed: boolean;

  @Column
  processingStatus: string; // 'success', 'error', 'pending'

  @Column(DataType.TEXT)
  processingMessage: string;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default CaktoWebhookLog;
