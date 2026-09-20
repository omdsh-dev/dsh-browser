import type { Attributes, HrTime } from '@opentelemetry/api';
import type { AnyValue, LogAttributes } from '@opentelemetry/api-logs';
import type { InstrumentationScope } from '@opentelemetry/core';
import type { Resource } from '@opentelemetry/resources';
import type { IProtobufWriter } from './i-protobuf-writer';
/**
 * Write HrTime [seconds, nanoseconds] directly as fixed64 to the serializer.
 * Converts to nanoseconds and writes as 64-bit little-endian integer without allocations.
 *
 * HrTime represents: total_nanos = seconds * 1_000_000_000 + nanoseconds
 * We need to split this into low (bits 0-31) and high (bits 32-63).
 *
 * @param serializer - The protobuf writer
 * @param hrTime - HrTime tuple [seconds, nanoseconds]
 */
export declare function writeHrTimeAsFixed64(serializer: IProtobufWriter, hrTime: HrTime): void;
/**
 * Write Attributes directly to protobuf as repeated KeyValue
 */
export declare function writeAttributes(writer: IProtobufWriter, attributes: Attributes | LogAttributes, fieldNumber: number): void;
/**
 * Write a KeyValue pair directly to protobuf
 */
export declare function writeKeyValue(writer: IProtobufWriter, key: string, value: AnyValue): void;
/**
 * Write an AnyValue directly from raw attribute value to protobuf
 */
export declare function writeAnyValue(writer: IProtobufWriter, value: AnyValue): void;
/**
 * Write an InstrumentationScope message.
 *
 * Proto fields (InstrumentationScope):
 *   1  name     string  (wire type 2)
 *   2  version  string  (wire type 2)
 */
export declare function writeInstrumentationScope(writer: IProtobufWriter, scope: InstrumentationScope & 
/**
 * Additional properties that are currently only part of the logs-specific type.
 * Once InstrumentationScope also includes `attributes` and `droppedAttributesCount`,
 * we should remove these extensions.
 */
{
    attributes?: LogAttributes;
    droppedAttributesCount?: number;
}, fieldNumber: number): void;
/**
 * Write a Resource message and its enclosing tag.
 *
 * Proto fields (Resource):
 *   1  attributes                repeated KeyValue  (wire type 2)
 *   2  dropped_attributes_count  uint32             (wire type 0)
 */
export declare function writeResource(writer: IProtobufWriter, resource: Resource, fieldNumber: number): void;
//# sourceMappingURL=common-serializer.d.ts.map