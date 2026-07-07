# ProposalForge — AI RFP / Proposal Generator (PRD)

## Original problem statement
Build an AI RFP / Proposal Generator for B2B service companies worldwide.
The AI should:
- Read the requirements from tenders / RFPs / RFQs
- Generate draft responses
- Reuse past proposal content
- Calculate a compliance score

## User personas
- Bid manager at a B2B services company
- Solo consultant responding to public tenders
- Sales lead at IT / consulting / professional-services firm

## Core requirements (static)
1. Upload RFP (PDF/DOCX/TXT) → auto-extract text
2. AI extracts requirements (category + priority)
3. AI generates full proposal draft (executive summary + sections)
4. Reusable content library
5. Compliance scoring per requirement with weighted total
6. Export proposal to DOCX and PDF
7. JWT authentication (email/password)

## Architecture
- FastAPI backend (`/app/backend/server.py`) + MongoDB
- React 19 + Tailwind + shadcn-style components frontend
- LLM via emergentintegrations (Claude Sonnet 4.5 default, GPT-5.2 selectable)
- File parsing: pypdf, python-docx
- Export: python-docx (DOCX), reportlab (PDF)

## What's been implemented (2026-02)
- JWT auth (register / login / me)
- RFP CRUD + upload (PDF/DOCX/TXT extraction)
- AI requirement extraction endpoint
- Proposal CRUD + AI draft generation
- Compliance scoring endpoint
- DOCX/PDF export
- Content library CRUD
- Dashboard stats
- Full frontend: Landing, Login, Register, Dashboard, RFPs list/detail, Proposals list/editor, Library, Team placeholder
- Design system: Cabinet Grotesk + IBM Plex Sans, Swiss high-contrast palette

## Known blockers
- Emergent LLM key balance is $0 on this workspace → AI endpoints return
  "Budget has been exceeded". Top up at Profile → Universal Key → Add Balance,
  or replace with a personal OpenAI/Anthropic key.

## Backlog (P1 / P2)
- P1: Streaming LLM responses (SSE) for perceived speed
- P1: RFP status pipeline UI (draft → won/lost)
- P1: Team invites & collaborative editing
- P2: Version history for proposals
- P2: Multi-language RFPs
- P2: Analytics / win-rate dashboard
