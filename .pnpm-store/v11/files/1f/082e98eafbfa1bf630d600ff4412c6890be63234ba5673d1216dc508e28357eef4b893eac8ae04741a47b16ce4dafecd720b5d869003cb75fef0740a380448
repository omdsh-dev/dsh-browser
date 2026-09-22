import type { IAnyValue, IInstrumentationScope, IKeyValue, Resource } from './internal-types';
import type { InstrumentationScope } from '@opentelemetry/core';
import type { Resource as ISdkResource } from '@opentelemetry/resources';
import type { Encoder } from './utils';
import type { LogAttributes } from '@opentelemetry/api-logs';
export declare function createResource(resource: ISdkResource, encoder: Encoder): Resource;
export declare function createInstrumentationScope(scope: InstrumentationScope & {
    attributes?: LogAttributes;
    droppedAttributesCount?: number;
}, encoder: Encoder): IInstrumentationScope;
export declare function toAttributes(attributes: LogAttributes, encoder: Encoder): IKeyValue[];
export declare function toKeyValue(key: string, value: unknown, encoder: Encoder): IKeyValue;
export declare function toAnyValue(value: unknown, encoder: Encoder): IAnyValue;
//# sourceMappingURL=internal.d.ts.map