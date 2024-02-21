import type { ILoggerService } from '@shared/modules/logger'

export class MeasurePerformance {
  private static map: Map<string, number> = new Map<string, number>()

  /**
   *
   * @param id - if id is provided, it will be used as key in map (id: start)
   * in the case if id is not provided, it will: (start: start)
   */
  public static start(id?: string): string {
    const start = performance.now()
    const _id = id ? id : String(start)

    this.map.set(_id, start)

    return _id
  }

  public static end(
    id: string,
    {
      customLogger,
      defaultConsole = true,
      customText = '',
    }: { defaultConsole?: boolean; customText?: string; customLogger?: ILoggerService } = {},
  ): string {
    const end = performance.now()

    const start = this.map.get(id) as number

    this.map.delete(id)

    const duration = `${customText ? customText : ''}: Duration: ${((end - start) / 1000).toFixed(5)} s `

    if (defaultConsole) {
      if (customLogger) {
        customLogger.debug(duration)
      } else {
        // eslint-disable-next-line no-console
        console.log(duration)
      }
    }

    return duration
  }
}
