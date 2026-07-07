"""LLM helpers for RFP requirements extraction, proposal draft and compliance scoring."""
from __future__ import annotations
import json
import os
import re
import uuid
from typing import List, Dict, Any

from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

DEFAULT_PROVIDER = "anthropic"
DEFAULT_MODEL = "claude-sonnet-4-5-20250929"


def _make_chat(provider: str, model: str, system_message: str) -> LlmChat:
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"rfp-{uuid.uuid4()}",
        system_message=system_message,
    ).with_model(provider, model)


def _extract_json_block(text: str) -> str:
    """Extract the first {...} or [...] JSON block from an LLM response."""
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fence:
        return fence.group(1).strip()
    m = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
    return m.group(1) if m else text


async def extract_requirements(rfp_text: str, provider: str = DEFAULT_PROVIDER, model: str = DEFAULT_MODEL) -> List[Dict[str, Any]]:
    system = (
        "You are an expert RFP analyst. Extract compliance requirements from tender/RFP documents. "
        "Return ONLY valid JSON, no prose."
    )
    prompt = (
        "Extract the compliance requirements from the following RFP text. "
        "Return a JSON array where each item has: text (string, the requirement), "
        "category (one of: 'Technical', 'Commercial', 'Legal', 'Experience', 'Delivery', 'General'), "
        "priority ('must' for mandatory, 'should' for expected, 'nice' for optional/desirable). "
        "Extract 8-20 concrete, atomic requirements. Do NOT invent details.\n\n"
        f"RFP TEXT:\n{rfp_text[:12000]}\n\n"
        'Return ONLY JSON like: [{"text": "...", "category": "Technical", "priority": "must"}]'
    )
    chat = _make_chat(provider, model, system)
    resp = await chat.send_message(UserMessage(text=prompt))
    raw = str(resp)
    try:
        data = json.loads(_extract_json_block(raw))
        if not isinstance(data, list):
            return []
        clean = []
        for r in data[:30]:
            if isinstance(r, dict) and r.get("text"):
                clean.append({
                    "text": str(r["text"])[:500],
                    "category": r.get("category", "General"),
                    "priority": r.get("priority", "should") if r.get("priority") in ("must", "should", "nice") else "should",
                })
        return clean
    except Exception:
        return []


async def generate_proposal_draft(
    rfp_title: str,
    rfp_content: str,
    requirements: List[Dict[str, Any]],
    library_snippets: List[Dict[str, Any]],
    company_context: str | None,
    tone: str,
    provider: str,
    model: str,
) -> Dict[str, Any]:
    system = (
        "You are a senior proposal writer for a B2B services company. Produce clear, persuasive, "
        "and structured proposal drafts that directly map to RFP requirements. Return ONLY valid JSON."
    )
    req_list = "\n".join(f"- [{r.get('priority','should').upper()}] ({r.get('category','General')}) {r['text']}" for r in requirements)
    lib_txt = "\n\n".join(f"### {s['title']}\n{s['content']}" for s in library_snippets[:6]) or "None"

    prompt = f"""Draft a full proposal responding to the RFP below.

RFP TITLE: {rfp_title}

RFP EXTRACTED REQUIREMENTS:
{req_list or 'None supplied — infer from the content.'}

COMPANY CONTEXT (reuse if useful):
{company_context or 'A B2B services company delivering high-quality solutions.'}

REUSABLE CONTENT LIBRARY:
{lib_txt}

TONE: {tone}

Return a JSON object with EXACTLY this shape:
{{
  "executive_summary": "3-5 sentence executive summary tailored to this RFP",
  "sections": [
    {{"heading": "Understanding of Requirements", "content": "..."}},
    {{"heading": "Proposed Solution", "content": "..."}},
    {{"heading": "Delivery Approach & Timeline", "content": "..."}},
    {{"heading": "Team & Experience", "content": "..."}},
    {{"heading": "Commercial Overview", "content": "..."}},
    {{"heading": "Compliance Statement", "content": "..."}}
  ]
}}

Each section's content should be 2-4 substantive paragraphs. Explicitly address the requirements above.
RFP EXCERPT:
{rfp_content[:6000]}
"""
    chat = _make_chat(provider, model, system)
    resp = await chat.send_message(UserMessage(text=prompt))
    raw = str(resp)
    try:
        data = json.loads(_extract_json_block(raw))
        if not isinstance(data, dict):
            raise ValueError("bad shape")
        exec_sum = str(data.get("executive_summary", ""))[:4000]
        sections = []
        for s in data.get("sections", [])[:12]:
            if isinstance(s, dict) and s.get("heading"):
                sections.append({"heading": str(s["heading"])[:200], "content": str(s.get("content", ""))[:12000]})
        return {"executive_summary": exec_sum, "sections": sections}
    except Exception:
        return {
            "executive_summary": raw[:800],
            "sections": [{"heading": "Draft", "content": raw}],
        }


async def compute_compliance(
    requirements: List[Dict[str, Any]],
    proposal_text: str,
    provider: str = DEFAULT_PROVIDER,
    model: str = DEFAULT_MODEL,
) -> Dict[str, Any]:
    if not requirements:
        return {"items": [], "score": 0}
    system = (
        "You audit proposals against RFP requirements. For each requirement, judge whether the proposal covers it, "
        "give a confidence 0-100, and quote a short evidence excerpt (<=200 chars) from the proposal. Return ONLY JSON."
    )
    req_json = json.dumps([{"id": r["id"], "text": r["text"]} for r in requirements])
    prompt = f"""REQUIREMENTS: {req_json}

PROPOSAL:
{proposal_text[:14000]}

Return JSON: {{"items": [{{"requirement_id": "...", "covered": true|false, "confidence": 0-100, "evidence": "short excerpt or empty"}}]}}
"""
    chat = _make_chat(provider, model, system)
    resp = await chat.send_message(UserMessage(text=prompt))
    raw = str(resp)
    try:
        data = json.loads(_extract_json_block(raw))
        items = []
        by_id = {r["id"]: r for r in requirements}
        for it in data.get("items", []):
            rid = it.get("requirement_id")
            if rid not in by_id:
                continue
            items.append({
                "requirement_id": rid,
                "requirement_text": by_id[rid]["text"],
                "covered": bool(it.get("covered")),
                "confidence": max(0, min(100, int(it.get("confidence", 0)))),
                "evidence": str(it.get("evidence", ""))[:400],
            })
        # Weighted score: must=3, should=2, nice=1
        weights = {"must": 3, "should": 2, "nice": 1}
        total = 0
        earned = 0
        for r in requirements:
            w = weights.get(r.get("priority", "should"), 2)
            total += w
            match = next((i for i in items if i["requirement_id"] == r["id"]), None)
            if match and match["covered"]:
                earned += w * (match["confidence"] / 100.0)
        score = round((earned / total) * 100) if total else 0
        return {"items": items, "score": score}
    except Exception:
        return {"items": [], "score": 0}
