from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services import gemini

router = APIRouter()


class UpscaleRequest(BaseModel):
    image_base64: str
    resolution: str = "2K"


class UpscaleResponse(BaseModel):
    image_base64: str
    mime_type: str


@router.post("/upscale", response_model=UpscaleResponse)
async def upscale(req: UpscaleRequest):
    try:
        image_b64, mime = gemini.upscale(
            image_base64=req.image_base64,
            resolution=req.resolution,
        )
        return UpscaleResponse(image_base64=image_b64, mime_type=mime)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
