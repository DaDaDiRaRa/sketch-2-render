import random
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services import gemini

router = APIRouter()


class RenderRequest(BaseModel):
    control_net_base64: str
    control_net_mime: str = "image/jpeg"
    control_net_width: int
    control_net_height: int
    ip_adapter_base64: Optional[str] = None
    ip_adapter_mime: Optional[str] = None
    florence_base64: Optional[str] = None
    florence_mime: Optional[str] = None
    positive_prompt: str = ""
    negative_prompt: str = ""
    seed_mode: str = "random"
    seed_value: int = 42
    temperature: float = 0.7


class RenderResponse(BaseModel):
    image_base64: str
    mime_type: str
    used_seed: int


@router.post("/render", response_model=RenderResponse)
async def render(req: RenderRequest):
    seed = req.seed_value if req.seed_mode == "fixed" else random.randint(0, 2_147_483_647)
    try:
        image_b64, mime = gemini.generate_render(
            control_net_base64=req.control_net_base64,
            control_net_mime=req.control_net_mime,
            control_net_width=req.control_net_width,
            control_net_height=req.control_net_height,
            ip_adapter_base64=req.ip_adapter_base64,
            ip_adapter_mime=req.ip_adapter_mime,
            florence_base64=req.florence_base64,
            florence_mime=req.florence_mime,
            positive_prompt=req.positive_prompt,
            negative_prompt=req.negative_prompt,
            seed=seed,
            temperature=req.temperature,
        )
        return RenderResponse(image_base64=image_b64, mime_type=mime, used_seed=seed)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
