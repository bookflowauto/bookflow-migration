# External Workflows

This directory contains n8n workflows that are **not part of the Bookflow application**. These are standalone tools or utilities used for business operations outside the core clinical practice management system.

## Workflows

### Lead Scraper - Psychologists (Email Harvester)
**Path:** `lead-scraper-psychologists/workflow.json`

**Purpose:** Harvests contact information (email addresses) for psychologists from their websites.

**How it works:**
1. Reads a list of psychologist websites from Google Sheets
2. Scrapes each website using ScrapeNinja API
3. Validates website content with GPT-4o (checks if real practitioner info exists)
4. Extracts email address using GPT-4o
5. Sends validated leads to Instantly.ai for cold outreach campaigns

**Trigger:** Manual (click to run)

**Dependencies:**
- Google Sheets (read-only)
- ScrapeNinja API (third-party web scraper)
- OpenAI API (GPT-4o for validation + email extraction)
- Instantly.ai (lead management platform)

**Status:** Inactive (manual trigger only)

---

## Why This Folder Exists

Bookflow's core application focuses on **clinical practice management** (appointments, transcriptions, SOAP notes, tax e-receipts, billing). Workflows in this external directory serve entirely different purposes and are kept separate for:

1. **Clarity** — distinguish app-critical workflows from auxiliary business tools
2. **Maintenance** — external workflows use different credentials, APIs, and approval workflows
3. **Deployment** — keep n8n-workflows directory clean (only import Bookflow workflows into app instances)

---

## Adding New External Workflows

When creating new workflows unrelated to Bookflow's core application:
1. Create a new subfolder in `external-workflows/` with a descriptive name
2. Add `workflow.json` (exported from n8n)
3. Document purpose, triggers, and dependencies in this README

Example:
```
external-workflows/
├── lead-scraper-psychologists/
│   └── workflow.json
├── invoice-archiver/
│   └── workflow.json
└── README.md (this file)
```
