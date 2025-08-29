// src/data-storage.ts
import { DataWritten as DataWrittenEvent } from "../generated/DataStorage/DataStorage";
import { DataWrittenEvent as DataWrittenEntity } from "../generated/schema";
import { MemoizedSwap as MemoizedSwapEvent } from "../generated/SwapAndMemoV3/SwapAndMemoV3";
import { MemoizedSwapEvent as MemoizedSwapEntity } from "../generated/schema";

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

export function handleMemoizedSwap(event: MemoizedSwapEvent): void {
  let entity = new MemoizedSwapEntity(event.transaction.hash);
  entity.from = event.params.from;
  entity.recipient = event.params.recipient;
  entity.message = event.params.message;
  entity.amountIn = event.params.amountIn;
  entity.amountOut = event.params.amountOut;
  entity.timestamp = event.block.timestamp;
  entity.blockNumber = event.block.number;
  entity.transactionHash = event.transaction.hash;
  entity.save();
}
