import { apiPost } from './client';

export interface UpscaleResponse {
  image_base64: string;
  mime_type: string;
}

export async function upscaleImageApi(
  imageBase64: string,
  resolution: string,
): Promise<UpscaleResponse> {
  return apiPost<UpscaleResponse>('/api/upscale', {
    image_base64: imageBase64,
    resolution,
  });
}
