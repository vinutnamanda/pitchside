# Pitchside — Stadium Companion

**PromptWars Virtual — Challenge 4: Smart Stadiums & Tournament Operations**

## Problem Statement

FIFA World Cup 2026 stadiums will host massive, multilingual crowds of fans, volunteers, and staff. Existing wayfinding and operations tools are static and single-language, leaving fans lost, accessibility needs unmet, and organizers blind to real-time conditions across a venue.

## Solution

Pitchside is a GenAI-powered stadium companion with two connected parts:

1. **Multilingual assistant** — fans and staff ask questions in plain language (any language) about navigation, accessible routes, transport, restrooms, and lost-and-found. A generative model answers conversationally, adapting tone for accessibility needs or staff/volunteer context.
2. **Live Ops Radar** — volunteers and staff log short free-text reports ("Gate 4 is congested"). These are visualized as a live hotspot map, giving organizers a real-time, transparent view of conditions across the stadium.

## How GenAI is used

- The `/api/chat` endpoint sends each user question to **Groq's Llama 3.3 70B** with a system prompt that defines Pitchside's role, current mode (fan / staff / accessibility), and target language.
- The model generates the actual answer — translation, tone adaptation, and wayfinding logic are all handled by the GenAI call, not hardcoded rules.
- This is a genuine runtime dependency: without a valid `GROQ_API_KEY`, the assistant does not function.

## Tech Stack

- **Frontend**: HTML, CSS, vanilla JavaScript — semantic landmarks, ARIA labels/roles, keyboard-operable controls, visible focus states, skip link
- **Backend**: Node.js, Express — Helmet security headers, rate limiting (20 req/min per client), gzip compression, strict input validation
- **GenAI**: Groq API running Llama 3.3 70B — free developer tier, no credit card required
- **Testing**: Jest + Supertest — automated tests for input validation, rate limiting, and route availability

## Setup & Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Add your Groq API key
cp .env.example .env
# then edit .env and paste your key from https://console.groq.com/keys

# 3. Start the server
npm start

# 4. Open the app
# http://localhost:3000
```

## Running Tests

```bash
npm test
```

## Project Structure

```
pitchside/
├── public/
│   └── index.html      # Frontend UI (chat assistant + live ops radar)
├── server.js            # Express backend, proxies GenAI calls
├── package.json
├── .env.example
└── README.md
```

## Notes for Judges

- The crowd hotspots and scoreboard values shown on load are illustrative demo data; the chat responses are live GenAI output.
- Try switching the language dropdown or toggling Accessibility / Staff mode before asking a question — the assistant's tone and language change accordingly.
