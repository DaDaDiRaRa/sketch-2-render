from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services import gemini

router = APIRouter()


class InpaintRequest(BaseModel):
    result_image_base64: str
    mask_base64: str
    edit_prompt: str = ""


class InpaintResponse(BaseModel):
    image_base64: str
    mime_type: str


@router.post("/inpaint", response_model=InpaintResponse)
async def inpaint(req: InpaintRequest):
    try:
        image_b64, mime = gemini.inpaint(
            result_image_base64=req.result_image_base64,
            mask_base64=req.mask_base64,
            edit_prompt=req.edit_prompt,
        )
        return InpaintResponse(image_base64=image_b64, mime_type=mime)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
