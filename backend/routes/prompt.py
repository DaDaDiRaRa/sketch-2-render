from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services import gemini

router = APIRouter()


class PromptRequest(BaseModel):
    prompt: str


class PromptResponse(BaseModel):
    improved: str


@router.post("/prompt/improve-positive", response_model=PromptResponse)
async def improve_positive(req: PromptRequest):
    try:
        result = gemini.improve_positive_prompt(req.prompt)
        return PromptResponse(improved=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/prompt/improve-negative", response_model=PromptResponse)
async def improve_negative(req: PromptRequest):
    try:
        result = gemini.improve_negative_prompt(req.prompt)
        return PromptResponse(improved=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
