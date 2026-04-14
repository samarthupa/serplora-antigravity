// src/lib/api.ts
export async function syncUserHistory(url: string, title: string) {
  try {
    const res = await fetch('/api/sync-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, title })
    });
    return await res.json();
  } catch (error) {
    console.error("Failed to sync history", error);
    return null;
  }
}