"""AI RFP / Proposal Generator — FastAPI backend."""
from __future__ import annotations
import io
import logging
import os
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from auth_utils import (  # noqa: E402
    create_token,
    get_current_user_id,
    hash_password,
    verify_password,
)
from models import (  # noqa: E402
    AuthResponse,
    ComplianceItem,
    GenerateDraftRequest,
    LibraryItem,
    LibraryItemCreate,
    Proposal,
    ProposalCreate,
    ProposalSection,
    RFP,
    RFPCreate,
    RFPRequirement,
    SectionUpdate,
    UserCreate,
    UserLogin,
    UserPublic,
)
from ai_service import compute_compliance, extract_requirements, generate_proposal_draft  # noqa: E402
from document_service import (  # noqa: E402
    build_proposal_docx,
    build_proposal_pdf,
    extract_text_from_bytes,
)

# --- DB ---
client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

# --- App ---
app = FastAPI(title="RFP Generator API")
api = APIRouter(prefix="/api")


# ---------------- Auth ----------------
@api.post("/auth/register", response_model=AuthResponse)
async def register(body: UserCreate):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    import uuid as _uuid
    from datetime import datetime, timezone as _tz
    user_id = str(_uuid.uuid4())
    doc = {
        "id": user_id,
        "email": body.email.lower(),
        "name": body.name,
        "company": body.company,
        "password_hash": hash_password(body.password),
        "created_at": datetime.now(_tz.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_token(user_id)
    return AuthResponse(
        token=token,
        user=UserPublic(
            id=user_id,
            email=doc["email"],
            name=doc["name"],
            company=doc["company"],
            created_at=doc["created_at"],
        ),
    )


@api.post("/auth/login", response_model=AuthResponse)
async def login(body: UserLogin):
    u = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    if not u or not verify_password(body.password, u["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_token(u["id"])
    return AuthResponse(
        token=token,
        user=UserPublic(id=u["id"], email=u["email"], name=u["name"], company=u.get("company"), created_at=u["created_at"]),
    )


@api.get("/auth/me", response_model=UserPublic)
async def me(user_id: str = Depends(get_current_user_id)):
    u = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not u:
        raise HTTPException(404, "User not found")
    return UserPublic(id=u["id"], email=u["email"], name=u["name"], company=u.get("company"), created_at=u["created_at"])


# ---------------- RFPs ----------------
@api.post("/rfps/upload")
async def upload_rfp(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    data = await file.read()
    if len(data) > 20 * 1024 * 1024:
        raise HTTPException(413, "File too large (max 20 MB)")
    try:
        text = extract_text_from_bytes(file.filename or "file.pdf", data)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not text.strip():
        raise HTTPException(400, "Could not extract any text from this document")
    return {"filename": file.filename, "content": text, "chars": len(text)}


@api.post("/rfps", response_model=RFP)
async def create_rfp(body: RFPCreate, user_id: str = Depends(get_current_user_id)):
    rfp = RFP(user_id=user_id, **body.model_dump())
    await db.rfps.insert_one(rfp.model_dump())
    return rfp


@api.get("/rfps", response_model=List[RFP])
async def list_rfps(user_id: str = Depends(get_current_user_id)):
    docs = await db.rfps.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [RFP(**d) for d in docs]


@api.get("/rfps/{rfp_id}", response_model=RFP)
async def get_rfp(rfp_id: str, user_id: str = Depends(get_current_user_id)):
    d = await db.rfps.find_one({"id": rfp_id, "user_id": user_id}, {"_id": 0})
    if not d:
        raise HTTPException(404, "RFP not found")
    return RFP(**d)


@api.delete("/rfps/{rfp_id}")
async def delete_rfp(rfp_id: str, user_id: str = Depends(get_current_user_id)):
    r = await db.rfps.delete_one({"id": rfp_id, "user_id": user_id})
    if not r.deleted_count:
        raise HTTPException(404, "RFP not found")
    await db.proposals.delete_many({"rfp_id": rfp_id, "user_id": user_id})
    return {"ok": True}


@api.post("/rfps/{rfp_id}/extract", response_model=RFP)
async def extract_rfp_requirements(rfp_id: str, user_id: str = Depends(get_current_user_id)):
    d = await db.rfps.find_one({"id": rfp_id, "user_id": user_id}, {"_id": 0})
    if not d:
        raise HTTPException(404, "RFP not found")
    if not d.get("content"):
        raise HTTPException(400, "RFP has no content to analyse")
    reqs_raw = await extract_requirements(d["content"])
    reqs = [RFPRequirement(**r) for r in reqs_raw]
    from datetime import datetime, timezone as _tz
    await db.rfps.update_one(
        {"id": rfp_id, "user_id": user_id},
        {"$set": {"requirements": [r.model_dump() for r in reqs], "updated_at": datetime.now(_tz.utc).isoformat()}},
    )
    d["requirements"] = [r.model_dump() for r in reqs]
    return RFP(**d)


# ---------------- Proposals ----------------
@api.post("/proposals", response_model=Proposal)
async def create_proposal(body: ProposalCreate, user_id: str = Depends(get_current_user_id)):
    rfp = await db.rfps.find_one({"id": body.rfp_id, "user_id": user_id}, {"_id": 0})
    if not rfp:
        raise HTTPException(404, "RFP not found")
    p = Proposal(user_id=user_id, rfp_id=body.rfp_id, title=body.title)
    await db.proposals.insert_one(p.model_dump())
    return p


@api.get("/proposals", response_model=List[Proposal])
async def list_proposals(user_id: str = Depends(get_current_user_id), rfp_id: Optional[str] = None):
    q = {"user_id": user_id}
    if rfp_id:
        q["rfp_id"] = rfp_id
    docs = await db.proposals.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Proposal(**d) for d in docs]


@api.get("/proposals/{proposal_id}", response_model=Proposal)
async def get_proposal(proposal_id: str, user_id: str = Depends(get_current_user_id)):
    d = await db.proposals.find_one({"id": proposal_id, "user_id": user_id}, {"_id": 0})
    if not d:
        raise HTTPException(404, "Proposal not found")
    return Proposal(**d)


@api.delete("/proposals/{proposal_id}")
async def delete_proposal(proposal_id: str, user_id: str = Depends(get_current_user_id)):
    r = await db.proposals.delete_one({"id": proposal_id, "user_id": user_id})
    if not r.deleted_count:
        raise HTTPException(404, "Proposal not found")
    return {"ok": True}


@api.post("/proposals/{proposal_id}/generate", response_model=Proposal)
async def generate_draft(proposal_id: str, body: GenerateDraftRequest, user_id: str = Depends(get_current_user_id)):
    p = await db.proposals.find_one({"id": proposal_id, "user_id": user_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Proposal not found")
    rfp = await db.rfps.find_one({"id": p["rfp_id"], "user_id": user_id}, {"_id": 0})
    if not rfp:
        raise HTTPException(404, "Linked RFP not found")

    lib_docs = await db.library.find({"user_id": user_id}, {"_id": 0}).sort("usage_count", -1).to_list(20)
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    ctx = body.company_context or (user.get("company") if user else None)

    draft = await generate_proposal_draft(
        rfp_title=rfp["title"],
        rfp_content=rfp.get("content", ""),
        requirements=rfp.get("requirements", []),
        library_snippets=lib_docs,
        company_context=ctx,
        tone=body.tone,
        provider=body.provider,
        model=body.model,
    )
    sections = [ProposalSection(**s) for s in draft["sections"]]

    from datetime import datetime, timezone as _tz
    update = {
        "executive_summary": draft["executive_summary"],
        "sections": [s.model_dump() for s in sections],
        "model_used": f"{body.provider}:{body.model}",
        "updated_at": datetime.now(_tz.utc).isoformat(),
    }
    await db.proposals.update_one({"id": proposal_id, "user_id": user_id}, {"$set": update})
    p.update(update)
    return Proposal(**p)


@api.patch("/proposals/{proposal_id}", response_model=Proposal)
async def update_proposal(proposal_id: str, body: dict, user_id: str = Depends(get_current_user_id)):
    """Update executive_summary, title, or sections."""
    allowed = {}
    for k in ("title", "executive_summary"):
        if k in body:
            allowed[k] = body[k]
    if "sections" in body and isinstance(body["sections"], list):
        clean = []
        for s in body["sections"]:
            if isinstance(s, dict) and s.get("heading"):
                clean.append({
                    "id": s.get("id") or str(__import__("uuid").uuid4()),
                    "heading": s["heading"],
                    "content": s.get("content", ""),
                    "requirement_ids": s.get("requirement_ids", []),
                })
        allowed["sections"] = clean
    if not allowed:
        raise HTTPException(400, "No valid fields to update")
    from datetime import datetime, timezone as _tz
    allowed["updated_at"] = datetime.now(_tz.utc).isoformat()
    r = await db.proposals.update_one({"id": proposal_id, "user_id": user_id}, {"$set": allowed})
    if not r.matched_count:
        raise HTTPException(404, "Proposal not found")
    d = await db.proposals.find_one({"id": proposal_id, "user_id": user_id}, {"_id": 0})
    return Proposal(**d)


@api.post("/proposals/{proposal_id}/score", response_model=Proposal)
async def score_proposal(proposal_id: str, user_id: str = Depends(get_current_user_id)):
    p = await db.proposals.find_one({"id": proposal_id, "user_id": user_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Proposal not found")
    rfp = await db.rfps.find_one({"id": p["rfp_id"], "user_id": user_id}, {"_id": 0})
    if not rfp or not rfp.get("requirements"):
        raise HTTPException(400, "RFP has no extracted requirements yet")

    text = (p.get("executive_summary", "") + "\n\n" +
            "\n\n".join(f"{s['heading']}\n{s['content']}" for s in p.get("sections", [])))
    result = await compute_compliance(rfp["requirements"], text)
    items = [ComplianceItem(**i) for i in result["items"]]

    from datetime import datetime, timezone as _tz
    update = {
        "compliance_items": [i.model_dump() for i in items],
        "compliance_score": result["score"],
        "updated_at": datetime.now(_tz.utc).isoformat(),
    }
    await db.proposals.update_one({"id": proposal_id, "user_id": user_id}, {"$set": update})
    p.update(update)
    return Proposal(**p)


@api.get("/proposals/{proposal_id}/export")
async def export_proposal(proposal_id: str, format: str = "docx", user_id: str = Depends(get_current_user_id)):
    p = await db.proposals.find_one({"id": proposal_id, "user_id": user_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Proposal not found")
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    company = user.get("company") if user else None
    if format == "pdf":
        data = build_proposal_pdf(p["title"], p.get("executive_summary", ""), p.get("sections", []), company)
        media = "application/pdf"
        ext = "pdf"
    else:
        data = build_proposal_docx(p["title"], p.get("executive_summary", ""), p.get("sections", []), company)
        media = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ext = "docx"
    safe = "".join(c for c in p["title"] if c.isalnum() or c in "-_ ").strip() or "proposal"
    headers = {"Content-Disposition": f'attachment; filename="{safe}.{ext}"'}
    return StreamingResponse(io.BytesIO(data), media_type=media, headers=headers)


# ---------------- Content Library ----------------
@api.post("/library", response_model=LibraryItem)
async def create_library_item(body: LibraryItemCreate, user_id: str = Depends(get_current_user_id)):
    item = LibraryItem(user_id=user_id, **body.model_dump())
    await db.library.insert_one(item.model_dump())
    return item


@api.get("/library", response_model=List[LibraryItem])
async def list_library(user_id: str = Depends(get_current_user_id)):
    docs = await db.library.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [LibraryItem(**d) for d in docs]


@api.delete("/library/{item_id}")
async def delete_library_item(item_id: str, user_id: str = Depends(get_current_user_id)):
    r = await db.library.delete_one({"id": item_id, "user_id": user_id})
    if not r.deleted_count:
        raise HTTPException(404, "Item not found")
    return {"ok": True}


# ---------------- Dashboard ----------------
@api.get("/dashboard/stats")
async def dashboard_stats(user_id: str = Depends(get_current_user_id)):
    rfp_count = await db.rfps.count_documents({"user_id": user_id})
    prop_count = await db.proposals.count_documents({"user_id": user_id})
    lib_count = await db.library.count_documents({"user_id": user_id})
    active = await db.rfps.count_documents({"user_id": user_id, "status": {"$in": ["draft", "in_progress"]}})
    props = await db.proposals.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    scores = [p.get("compliance_score", 0) for p in props if p.get("compliance_score")]
    avg = round(sum(scores) / len(scores)) if scores else 0
    recent = props[:5]
    return {
        "rfps": rfp_count,
        "proposals": prop_count,
        "library_items": lib_count,
        "active_rfps": active,
        "avg_compliance": avg,
        "recent_proposals": [{"id": p["id"], "title": p["title"], "compliance_score": p.get("compliance_score", 0), "updated_at": p.get("updated_at")} for p in recent],
    }


@api.get("/")
async def root():
    return {"service": "rfp-generator", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def _shutdown():
    client.close()
