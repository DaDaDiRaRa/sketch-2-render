import { apiPost } from './client';

export interface InpaintResponse {
  image_base64: string;
  mime_type: string;
}

export async function applyInpaintingApi(
  resultImageBase64: string,
  maskBase64: string,
  editPrompt: string,
): Promise<InpaintResponse> {
  return apiPost<InpaintResponse>('/api/inpaint', {
    result_image_base64: resultImageBase64,
    mask_base64: maskBase64,
    edit_prompt: editPrompt,
  });
}
