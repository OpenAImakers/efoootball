// utils/cache.ts
export async function withCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp < ttlMs) return data as T;
    }
  } catch {
    localStorage.removeItem(key);
  }

  const fresh = await fetcher();

  try {
    localStorage.setItem(key, JSON.stringify({ data: fresh, timestamp: Date.now() }));
  } catch {
    // quota exceeded — silently ignore
  }

  return fresh;
}