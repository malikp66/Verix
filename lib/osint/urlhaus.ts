export type UrlHausResult = {
  status: 'malicious' | 'clean' | 'error';
  threat?: string;
  tags?: string[];
  url_status?: string;
  first_seen?: string;
  raw?: string;
};

export async function checkUrlHaus(url: string): Promise<UrlHausResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ url }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[URLhaus] HTTP ${res.status}`);
      return { status: 'error', raw: `HTTP ${res.status}` };
    }

    const data = await res.json();

    if (data.query_status === 'no_results') {
      return { status: 'clean' };
    }

    if (data.query_status === 'ok') {
      return {
        status: 'malicious',
        threat: data.threat || 'unknown',
        tags: Array.isArray(data.tags) ? data.tags : [],
        url_status: data.url_status || 'unknown',
        first_seen: data.date_added || undefined,
      };
    }

    return { status: 'error', raw: data.query_status };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn('[URLhaus] Timeout');
      return { status: 'error', raw: 'timeout' };
    }
    console.warn('[URLhaus] Error:', err);
    return { status: 'error', raw: err.message };
  }
}
