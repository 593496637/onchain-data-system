import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import { DataWritten } from "../generated/DataStorage/DataStorage"

export function createDataWrittenEvent(
  eventId: BigInt,
  from: Address,
  message: string,
  timestamp: BigInt
): DataWritten {
  let dataWrittenEvent = changetype<DataWritten>(newMockEvent())

  dataWrittenEvent.parameters = new Array()

  dataWrittenEvent.parameters.push(
    new ethereum.EventParam(
      "eventId",
      ethereum.Value.fromUnsignedBigInt(eventId)
    )
  )
  dataWrittenEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  dataWrittenEvent.parameters.push(
    new ethereum.EventParam("message", ethereum.Value.fromString(message))
  )
  dataWrittenEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return dataWrittenEvent
}
