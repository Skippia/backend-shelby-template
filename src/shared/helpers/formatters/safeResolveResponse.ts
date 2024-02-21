export const safeResolveResponse = async <T>(
  callback: () => Promise<T>,
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    const result = await callback()
    return { data: result, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}
