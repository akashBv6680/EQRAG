import { SummaryRequest, SummaryResponse } from '../types/index.ts';

export async function requestSummary(params: SummaryRequest): Promise<SummaryResponse> {
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Summarization request failed with status ${response.status}`);
  }

  return response.json();
}

export async function checkServerHealth(): Promise<{ status: string; hasApiKey: boolean; model: string }> {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) {
      return { status: 'error', hasApiKey: false, model: 'unknown' };
    }
    return response.json();
  } catch {
    return { status: 'offline', hasApiKey: false, model: 'unknown' };
  }
}
