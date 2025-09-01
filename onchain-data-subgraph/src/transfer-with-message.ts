// src/transfer-with-message.ts
import { TransferExecuted as TransferExecutedEvent } from "../generated/TransferWithMessage/TransferWithMessage";
import { TransferWithMessageEvent as TransferWithMessageEntity } from "../generated/schema";

export function handleTransferWithMessage(event: TransferExecutedEvent): void {
  let entity = new TransferWithMessageEntity(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  
  entity.transferId = event.params.transferId;
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.amount = event.params.amount;
  entity.message = event.params.message;
  entity.timestamp = event.params.timestamp;
  entity.blockNumber = event.block.number;
  entity.transactionHash = event.transaction.hash;
  
  entity.save();
}