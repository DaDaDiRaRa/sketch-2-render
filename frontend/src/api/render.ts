import { apiPost } from './client';

export interface RenderRequest {
  control_net_base64: string;
  control_net_mime?: string;
  control_net_width: number;
  control_net_height: number;
  ip_adapter_base64?: string;
  ip_adapter_mime?: string;
  florence_base64?: string;
  florence_mime?: string;
  positive_prompt?: string;
  negative_prompt?: string;
  seed_mode?: 'random' | 'fixed';
  seed_value?: number;
  temperature?: number;
}

export interface RenderResponse {
  image_base64: string;
  mime_type: string;
}

export async function generateRendering(req: RenderRequest): Promise<RenderResponse> {
  return apiPost<RenderResponse>('/api/render', req);
}
