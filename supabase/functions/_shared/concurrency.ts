export async function runBounded<T>(
  items: T[],
  concurrency: number,
  operation: (item: T) => Promise<void>,
) {
  for (let offset = 0; offset < items.length; offset += concurrency) {
    await Promise.all(items.slice(offset, offset + concurrency).map(operation));
  }
}
