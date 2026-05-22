import base64
import os
from io import BytesIO
from typing import Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image, ImageFilter

load_dotenv()

IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation"
TEXT_MODEL  = "gemini-2.5-flash"

_ASPECT_RATIOS = [
    ("1:1",  1.0),
    ("4:3",  4 / 3),
    ("3:4",  3 / 4),
    ("16:9", 16 / 9),
    ("9:16", 9 / 16),
]


def _client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in the environment")
    return genai.Client(api_key=api_key)


def _closest_aspect_ratio(width: int, height: int) -> str:
    ratio = width / height
    return min(_ASPECT_RATIOS, key=lambda t: abs(t[1] - ratio))[0]


def _pad_image(raw: bytes, ratio_str: str) -> bytes:
    img = Image.open(BytesIO(raw)).convert("RGB")
    w, h = img.size
    tw, th = map(int, ratio_str.split(":"))
    target = tw / th
    current = w / h

    if abs(target - current) < 0.01:
        buf = BytesIO()
        img.save(buf, format="JPEG")
        return buf.getvalue()

    if current > target:
        new_w, new_h = w, int(w / target)
    else:
        new_w, new_h = int(h * target), h

    canvas = Image.new("RGB", (new_w, new_h), (255, 255, 255))
    canvas.paste(img, ((new_w - w) // 2, (new_h - h) // 2))
    buf = BytesIO()
    canvas.save(buf, format="JPEG")
    return buf.getvalue()


def _extract_lineart(raw: bytes) -> bytes:
    img = Image.open(BytesIO(raw)).convert("L")
    img = img.point(lambda p: 0 if p < 150 else 255)
    buf = BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _extract_depth(raw: bytes) -> bytes:
    img = Image.open(BytesIO(raw)).convert("L").convert("RGB")
    img = img.filter(ImageFilter.GaussianBlur(radius=2))
    buf = BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _extract_image(response) -> tuple[str, str]:
    for part in response.candidates[0].content.parts:
        if part.inline_data:
            return base64.b64encode(part.inline_data.data).decode(), part.inline_data.mime_type
    raise ValueError("Model returned no image. Check safety filters or prompt.")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_render(
    *,
    control_net_base64: str,
    control_net_mime: str,
    control_net_width: int,
    control_net_height: int,
    ip_adapter_base64: Optional[str],
    ip_adapter_mime: Optional[str],
    florence_base64: Optional[str],
    florence_mime: Optional[str],
    positive_prompt: str,
    negative_prompt: str,
    seed: int,
    temperature: float,
) -> tuple[str, str]:
    raw = base64.b64decode(control_net_base64)
    aspect_ratio = _closest_aspect_ratio(control_net_width, control_net_height)
    padded = _pad_image(raw, aspect_ratio)
    lineart = _extract_lineart(padded)
    depth   = _extract_depth(padded)

    parts = [
        types.Part.from_text(
            "SYSTEM INSTRUCTION: You are a 'High-End Architectural Visualization (Arch-Viz) Engine' "
            "and a 'Deterministic ControlNet AI'. Your goal is to translate 3D structural guides "
            "(SketchUp/CAD base) and stylistic references into professional-grade renders.\n"
            "[NODE-Based Processing Protocols]\n"
            "1. NODE 1 [Base Geometry]: Absolute source for camera angle and perspective. Locked. Outpaint padding naturally.\n"
            "2. NODE 2 [Lineart]: CAD boundaries. STRICTLY FORBIDDEN to draw outside black edges.\n"
            "3. NODE 3 [Depth]: 3D massing. Maintain volume.\n"
            "4. NODE 4 [Style]: Extract Material/Color/Lighting ONLY. Ignore building shape.\n"
            "5. NODE 5 [Context]: Extract Environment ONLY. Do not copy buildings.\n"
            "[Quality] 100% Locked perspective. Zero tolerance for distortion."
        ),
        types.Part.from_text(
            "TASK: HIGH-FIDELITY ARCHITECTURAL RENDERING. DETERMINISTIC MODE: ON. STRUCTURAL FIDELITY: 100%."
        ),
        types.Part.from_text(
            "NODE 1 [Base Geometry]: The padded original building structure. DO NOT stretch the building. "
            "Keep the white padded areas COMPLETELY PURE WHITE. ABSOLUTELY DO NOT draw any sky, ground, "
            "landscape, or building extensions into the white padding."
        ),
        types.Part(inline_data=types.Blob(data=padded,   mime_type="image/jpeg")),
        types.Part.from_text("NODE 2 [Lineart Constraint]: STRICT BOUNDARY. Every edge must be preserved."),
        types.Part(inline_data=types.Blob(data=lineart,  mime_type="image/jpeg")),
        types.Part.from_text("NODE 3 [Depth Map]: Maintain exact volume and perspective."),
        types.Part(inline_data=types.Blob(data=depth,    mime_type="image/jpeg")),
    ]

    if ip_adapter_base64 and ip_adapter_mime:
        parts.append(types.Part.from_text(
            "NODE 4 [Style Reference]: Extract ONLY Material/Color/Lighting. Ignore building structure."
        ))
        parts.append(types.Part(inline_data=types.Blob(
            data=base64.b64decode(ip_adapter_base64), mime_type=ip_adapter_mime
        )))

    if florence_base64 and florence_mime:
        parts.append(types.Part.from_text(
            "NODE 5 [Environmental Context]: Extract ONLY Sky/Weather/Landscaping."
        ))
        parts.append(types.Part(inline_data=types.Blob(
            data=base64.b64decode(florence_base64), mime_type=florence_mime
        )))

    parts.append(types.Part.from_text(
        f"USER PROMPT: {positive_prompt}\nNEGATIVE PROMPT: {negative_prompt}"
    ))

    response = _client().models.generate_content(
        model=IMAGE_MODEL,
        contents=types.Content(parts=parts, role="user"),
        config=types.GenerateContentConfig(
            seed=seed,
            temperature=temperature,
            response_modalities=["IMAGE", "TEXT"],
        ),
    )
    return _extract_image(response)


def inpaint(
    *,
    result_image_base64: str,
    mask_base64: str,
    edit_prompt: str,
) -> tuple[str, str]:
    response = _client().models.generate_content(
        model=IMAGE_MODEL,
        contents=types.Content(
            role="user",
            parts=[
                types.Part(inline_data=types.Blob(
                    data=base64.b64decode(result_image_base64), mime_type="image/png"
                )),
                types.Part(inline_data=types.Blob(
                    data=base64.b64decode(mask_base64), mime_type="image/png"
                )),
                types.Part.from_text(
                    f"STRICT SELECTIVE EDITING TASK: {edit_prompt or 'Refine the materials of the building facade.'}.\n"
                    "CRITICAL INSTRUCTION:\n"
                    "1. The second image is the EXCLUSIVE REPLACEMENT MASK.\n"
                    "2. You are STRICTLY FORBIDDEN from changing any parts not highlighted in the mask.\n"
                    "3. ONLY the exact pixels painted should be modified. Every other pixel preserved with 100% fidelity.\n"
                    "4. Treat the mask as the absolute boundary for your changes."
                ),
            ],
        ),
        config=types.GenerateContentConfig(
            seed=42,
            response_modalities=["IMAGE", "TEXT"],
        ),
    )
    return _extract_image(response)


def upscale(*, image_base64: str, resolution: str) -> tuple[str, str]:
    response = _client().models.generate_content(
        model=IMAGE_MODEL,
        contents=types.Content(
            role="user",
            parts=[
                types.Part(inline_data=types.Blob(
                    data=base64.b64decode(image_base64), mime_type="image/png"
                )),
                types.Part.from_text(
                    f"Enhance and upscale this architectural rendering to {resolution} resolution. "
                    "Maintain all details, textures, and lighting perfectly while increasing clarity and sharpness."
                ),
            ],
        ),
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )
    return _extract_image(response)


def improve_positive_prompt(prompt: str) -> str:
    response = _client().models.generate_content(
        model=TEXT_MODEL,
        contents=(
            "You are a professional Architectural Photographer and Prompt Engineer.\n"
            "Translate (if Korean) and enrich the following architectural prompt into a high-end, "
            "professional English prompt.\n\n"
            "[Guidelines]:\n"
            "1. Preserve the core architectural building form as the centerpiece.\n"
            "2. Enrich the scene with realistic atmospheric details: cinematic sky, realistic vegetation, "
            "designer furniture, and subtle people for scale.\n"
            "3. Use professional photography terms (corrected verticals, soft global illumination, HDR).\n"
            "4. Output a single, cohesive, ultra-detailed prompt block. No conversational text.\n\n"
            f"[Input Prompt]:\n{prompt}"
        ),
    )
    return response.text.strip()


def improve_negative_prompt(prompt: str) -> str:
    response = _client().models.generate_content(
        model=TEXT_MODEL,
        contents=(
            "You are a professional Architectural Quality Inspector. Expand the user's negative prompt "
            "into a comprehensive list of technical rendering artifacts to avoid.\n"
            "- Focus on: distorted perspectives, non-physical lighting, unrealistic material tiling, "
            "overexposed highlights, blurry distant buildings, warped geometry.\n"
            "- Translate Korean to English if necessary.\n"
            "- Output only the improved negative prompt string.\n\n"
            f"[Input Negative Prompt]:\n{prompt}"
        ),
    )
    return response.text.strip()
