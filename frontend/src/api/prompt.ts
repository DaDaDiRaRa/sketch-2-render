import { apiPost } from './client';

interface PromptResponse {
  improved: string;
}

export async function improvePositivePrompt(prompt: string): Promise<string> {
  const res = await apiPost<PromptResponse>('/api/prompt/improve-positive', { prompt });
  return res.improved;
}

export async function improveNegativePrompt(prompt: string): Promise<string> {
  const res = await apiPost<PromptResponse>('/api/prompt/improve-negative', { prompt });
  return res.improved;
}
