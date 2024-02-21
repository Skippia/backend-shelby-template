// eslint-disable-next-line @typescript-eslint/ban-types
export function applyMixins(derivedCtor: Function, constructors: Array<Function>): void {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null),
      )
    })
  })
}
