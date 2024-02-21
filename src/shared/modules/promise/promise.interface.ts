/* eslint-disable @typescript-eslint/no-explicit-any */
export type PromiseResolveParams<I, O> = {
  limit: number
  data: I[]
  promise(d: I): Promise<O>
}

export type PromiseRetryParams<T> = {
  name?: string
  retries?: number
  timeout?: number
  delay?: number
  breakIf?(e: any): boolean
  promise(): Promise<T>
}
