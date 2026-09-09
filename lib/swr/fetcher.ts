export async function swrFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
