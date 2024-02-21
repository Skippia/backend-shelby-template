/* eslint-disable @typescript-eslint/no-explicit-any */
export enum ContextStorageKey {
  CACHE_STATUS = 'CACHE_STATUS',
  //   ORM_ENTITY_MANAGER = 'ORM_ENTITY_MANAGER',
  REQUEST = 'REQUEST',
  REQUEST_METADATA = 'REQUEST_METADATA',
  REQUEST_SPAN = 'REQUEST_SPAN',
  REQUEST_TIMED_OUT = 'REQUEST_TIMED_OUT',
  RESPONSE = 'RESPONSE',
  VALIDATOR_OPTIONS = 'VALIDATOR_OPTIONS',
}

export type TManualTelemertrySpan = {
  spanContext: Record<string, any> & { traceId?: string }
  setAttributes(attributes: Record<string, any>): void
}
