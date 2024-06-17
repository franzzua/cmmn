export async function toArray<T>(gen: AsyncIterable<T>): Promise<T[]>{
  const buffer = [] as T[];
  for await (let t of gen) {
    buffer.push(t);
  }
  return buffer;
}