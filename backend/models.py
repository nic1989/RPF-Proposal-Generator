"""Pydantic models for MongoDB documents and API requests/responses."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional, List, Literal
import uuid
from pydantic import BaseModel, EmailStr, Field, ConfigDict


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _uid() -> str:
    return str(uuid.uuid4())


# ============ Auth ============
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    company: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    company: Optional[str] = None
    created_at: str


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


# ============ RFP ============
class RFPRequirement(BaseModel):
    id: str = Field(default_factory=_uid)
    text: str
    category: str = "General"
    priority: Literal["must", "should", "nice"] = "should"


class RFPCreate(BaseModel):
    title: str
    client: Optional[str] = None
    deadline: Optional[str] = None
    content: str = ""


class RFP(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uid)
    user_id: str
    title: str
    client: Optional[str] = None
    deadline: Optional[str] = None
    content: str = ""
    filename: Optional[str] = None
    requirements: List[RFPRequirement] = []
    status: Literal["draft", "in_progress", "submitted", "won", "lost"] = "draft"
    created_at: str = Field(default_factory=_now)
    updated_at: str = Field(default_factory=_now)


# ============ Proposal ============
class ProposalSection(BaseModel):
    id: str = Field(default_factory=_uid)
    heading: str
    content: str = ""
    requirement_ids: List[str] = []


class ComplianceItem(BaseModel):
    requirement_id: str
    requirement_text: str
    covered: bool
    confidence: int  # 0-100
    evidence: str = ""


class Proposal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uid)
    user_id: str
    rfp_id: str
    title: str
    executive_summary: str = ""
    sections: List[ProposalSection] = []
    compliance_items: List[ComplianceItem] = []
    compliance_score: int = 0
    model_used: Optional[str] = None
    created_at: str = Field(default_factory=_now)
    updated_at: str = Field(default_factory=_now)


class ProposalCreate(BaseModel):
    rfp_id: str
    title: str


class GenerateDraftRequest(BaseModel):
    provider: Literal["openai", "anthropic"] = "anthropic"
    model: str = "claude-sonnet-4-5-20250929"
    tone: str = "professional"
    company_context: Optional[str] = None


class SectionUpdate(BaseModel):
    heading: Optional[str] = None
    content: Optional[str] = None


# ============ Content Library ============
class LibraryItemCreate(BaseModel):
    title: str
    category: str = "General"
    content: str
    tags: List[str] = []


class LibraryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uid)
    user_id: str
    title: str
    category: str = "General"
    content: str
    tags: List[str] = []
    usage_count: int = 0
    created_at: str = Field(default_factory=_now)
