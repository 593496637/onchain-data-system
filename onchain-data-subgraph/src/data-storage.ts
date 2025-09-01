// src/data-storage.ts
import { DataWritten as DataWrittenEvent } from "../generated/DataStorage/DataStorage";
import { DataWrittenEvent as DataWrittenEntity } from "../generated/schema";

export function handleDataWritten(event: DataWrittenEvent): void {
  let entity = new DataWrittenEntity(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.eventId = event.params.eventId;
  entity.from = event.params.from;
  entity.message = event.params.message;
  entity.timestamp = event.block.timestamp;
  entity.blockNumber = event.block.number;
  entity.transactionHash = event.transaction.hash;
  entity.save();
}

