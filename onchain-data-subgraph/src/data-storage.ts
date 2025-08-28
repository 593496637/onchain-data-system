// src/data-storage.ts
import { DataWritten as DataWrittenEvent } from "../generated/DataStorage/DataStorage";
import { DataWrittenEvent as DataWrittenEntity } from "../generated/schema";

export function handleDataWritten(event: DataWrittenEvent): void {
  // 创建一个新的实体，使用交易哈希和日志索引作为唯一ID
  let entity = new DataWrittenEntity(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  // 从事件参数中读取数据，并赋值给实体的字段
  entity.eventId = event.params.eventId;
  entity.from = event.params.from;
  entity.message = event.params.message;
  entity.timestamp = event.params.timestamp;

  // 从事件的元数据中读取区块号和交易哈希
  entity.blockNumber = event.block.number;
  entity.transactionHash = event.transaction.hash;

  // 保存实体，The Graph 会自动处理数据库的写入
  entity.save();
}
