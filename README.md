# Dynamic Workflow Generator

A full-stack app where you describe a business process in plain English and get back a visual, editable workflow — vertical cards connected by arrows, each showing step name, type, sequence, and dependencies.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Axios
- **Backend:** Node.js, Express
- **AI:** Any OpenAI-compatible LLM API (tested with Groq)
- No database, no authentication, no Docker — fully in-memory

## Features

- Describe a process in plain English, click **Generate Workflow**
- AI breaks it into steps: Input, Approval, Notification, Decision, Action, End
- Edit, delete, or add workflow steps — UI updates instantly
- Friendly error handling for failed or invalid AI responses

## Project Structure

```
dynamic-workflow-generator/
├── backend/     # Express server + /generate-workflow endpoint
└── frontend/    # React + Vite + Tailwind UI
```

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env    # then add your LLM_API_KEY
npm start                # runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # runs on http://localhost:5173
```

## Environment Variables (backend/.env)

```
LLM_API_URL=https://api.groq.com/openai/v1/chat/completions
LLM_API_KEY=your-key-here
LLM_MODEL=llama-3.3-70b-versatile
PORT=5000
```

Any OpenAI-compatible endpoint works here (OpenAI, Groq, OpenRouter, etc.) — just change the URL, key, and model name.

## Example

**Input:** "New employee onboarding: HR collects documents, manager approves, IT allocates a laptop, then sends a welcome email"

**Output:** A 5-step workflow — Collect Documents (Input) → Manager Approval (Approval) → Allocate Laptop (Action) → Send Welcome Email (Notification) → Onboarding Complete (End) — each showing its dependencies.
