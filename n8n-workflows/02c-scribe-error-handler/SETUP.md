# Scribe Error Handler Setup

## Overview
This workflow catches failures in Workflow #2 (Clinical Scribe) and marks the appointment as `scribe_status='failed'` instead of leaving it stuck on "transcribing".

## Prerequisites

1. **n8n API Key**
   - Log into n8n at `https://n8n.bookflow.uk`
   - Settings → Personal Settings → API Tokens
   - Create a new token (or use existing)
   - Copy the token

## Setup Steps

### Step 1: Create n8n API Credential in n8n

1. Go to n8n → Credentials
2. Click **+ New**
3. Type **HTTP Header Auth**
4. Name: `n8n API`
5. Headers:
   - Key: `X-N8N-API-KEY`
   - Value: `<paste your API token>`
6. Save

### Step 2: Import Error Handler Workflow

1. In n8n, click **+ New Workflow**
2. Open the workflow editor
3. Click menu (≡) → **Edit** → switch to JSON edit mode
4. Paste the contents of `workflow.json` from this folder
5. Save and activate

### Step 3: Link Error Handler to Workflow #2

1. Open Workflow #2 (Clinical Scribe) in n8n
2. Click workflow menu (≡) → **Settings**
3. Scroll to **Error Workflow**
4. Select the error handler workflow you just created
5. Save

## What Happens on Failure

- Any node in Workflow #2 fails → Error Trigger fires
- Error handler fetches the failed execution via n8n API
- Extracts `appointmentId` from `Parse Webhook` node output
- Patches appointment: `scribe_status='failed'`
- Dashboard no longer shows stuck "transcribing" state

## Troubleshooting

- **"401 Unauthorized"** on Fetch Failed Execution: Check n8n API key is correct
- **Could not recover appointmentId**: Check Parse Webhook ran before the failure; if it crashed at webhook parsing, no ID exists to recover
