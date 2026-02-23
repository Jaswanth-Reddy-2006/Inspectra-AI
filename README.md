# 🔍 Inspectra AI — Autonomous Web Quality Intelligence Platform

> **Inspectra AI** is an autonomous multi-agent platform that crawls, audits, and scores web applications for quality issues — covering functional errors, JavaScript exceptions, network failures, performance bottlenecks, and accessibility violations — all without manual intervention.

---

## 🧠 What is Inspectra AI?

Inspectra AI is a full-stack AI-powered QA (Quality Assurance) platform built to replace the tedious, manual process of testing and auditing web applications. You give it a URL, and its intelligent agent pipeline takes over — automatically discovering every page of your site, analysing it across multiple quality dimensions, and returning a structured, scored report with actionable insights.

Think of it as a **smart QA engineer** that never sleeps: it crawls your entire web application, runs deep diagnostic checks on every page it finds, and presents the results through a clean, modern dashboard.

---

## 🤖 AI Agents & How They Work

Inspectra AI is powered by a pipeline of **four specialised agents**, each responsible for a distinct phase of the audit process. They work sequentially, passing enriched data from one to the next.

### 1. 🕷️ Crawler Agent — `crawler.js`

The Crawler Agent is the entry point of every scan. It takes the starting URL provided by the user and autonomously discovers all pages within the same origin.

**What it does:**
- Uses a headless Chromium browser (via **Playwright**) to navigate the target web app like a real user.
- Maintains a **queue-based crawl loop** — visiting each page, extracting internal links, and adding unvisited ones to the queue (up to a configurable `maxPages` limit, default: 10).
- On every page it visits, it **hooks into real-time browser events** to capture:
  - **Console Errors** — JavaScript errors logged to the browser console (severity: `HIGH`)
  - **JS Exceptions** — Uncaught JavaScript runtime exceptions (severity: `CRITICAL`)
  - **Network Failures** — Failed asset loads, broken API calls, missing resources (severity: `MEDIUM`)
- Tracks **load time** for each page to enable performance analysis.
- Returns a flat array of page results, each containing the URL, load time, and all detected issues.

### 2. ♿ Accessibility Audit Agent — `accessibility.js`

After the Crawler Agent discovers all pages, the Accessibility Audit Agent runs a dedicated audit on every single page.

**What it does:**
- Injects **axe-core** (the industry-standard accessibility engine) directly into the live page DOM via Playwright's `addScriptTag`.
- Executes `axe.run()` inside the page's browser context to perform a full WCAG compliance check.
- Maps axe-core's impact levels (`critical`, `serious`, `moderate`, `minor`) to Inspectra's internal severity scale (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- Each violation is recorded with a human-readable description and its rule ID (e.g., `color-contrast`, `aria-label`, `button-name`).
- The resulting accessibility issues are **merged into each page's issue list**, ensuring a single holistic view per page.

**Why this matters:** Accessibility issues affect real users with disabilities and can also have legal implications (ADA, WCAG compliance). Inspectra treats them as first-class quality concerns.

### 3. 📊 Scorer Agent — `scorer.js`

The Scorer Agent transforms raw issue lists into quantifiable quality scores using a **penalty-based scoring model**.

**What it does:**
- Starts every page with a perfect score of **100**.
- Applies penalty deductions per issue, weighted by severity:
  | Severity | Penalty |
  |----------|---------|
  | 🔴 Critical | −20 pts |
  | 🟠 High | −10 pts |
  | 🟡 Medium | −5 pts  |
  | 🟢 Low | −2 pts  |
- Clamps scores at a minimum of **0** (no negative scores).
- Calculates an **overall site score** by averaging individual page scores.
- Produces an **issues summary** — a breakdown of issue counts by severity across the entire site (`critical`, `high`, `medium`, `low`).

### 4. 🚦 Scan Orchestration Agent — `scan.js` (Route Handler)

This is the brain that coordinates all three agents above. It is exposed as a REST API endpoint and orchestrates the full scan pipeline.

**What it does:**
- Receives the target URL from the frontend via a `POST /api/scan` request.
- Invokes the Crawler Agent to discover and analyse all pages.
- For each discovered page, invokes the Accessibility Audit Agent to layer in WCAG results.
- Sends all enriched page data through the Scorer Agent to compute scores.
- Returns a complete, structured JSON report to the frontend containing:
  - `overallScore` — the site-wide quality score (0–100)
  - `totalPagesScanned` — total number of pages discovered and audited
  - `issuesSummary` — severity breakdown counts
  - `pages` — per-page details with URL, load time, score, and per-issue descriptions

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     USER BROWSER                        │
│                                                         │
│   Landing Page → Enter URL → Trigger Scan               │
│   Loading Screen (animated step sequence)               │
│   Dashboard → View Results, Scores, Issues Per Page     │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP POST /api/scan
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND SERVER (Node/Express)         │
│                                                         │
│   ┌──────────────┐    ┌──────────────────────────┐     │
│   │ Crawler Agent│───▶│ Accessibility Audit Agent │     │
│   │  (Playwright)│    │       (axe-core)          │     │
│   └──────────────┘    └──────────────────────────┘     │
│          │                         │                    │
│          └────────────┬────────────┘                    │
│                       ▼                                 │
│              ┌────────────────┐                         │
│              │  Scorer Agent  │                         │
│              │ (penalty model)│                         │
│              └───────┬────────┘                         │
│                      │ JSON Report                      │
└──────────────────────┼──────────────────────────────────┘
                       │
                       ▼
              Frontend Dashboard
              (React + Recharts)
```

---

## ✨ Key Features

- **Autonomous Multi-Page Crawling** — Discovers and audits every page of a site automatically, not just the one URL you enter.
- **Multi-Dimensional Quality Analysis** — Covers JavaScript errors, runtime exceptions, broken network requests, and WCAG accessibility violations in a single scan.
- **Real-Time Animated Scan Experience** — A beautiful, animated loading screen walks users through each agent's progress step-by-step.
- **Quantified Quality Scores** — Every page and the entire site gets a numeric score (0–100), making quality tangible and comparable across scans.
- **Severity-Weighted Reporting** — Issues are classified into Critical, High, Medium, and Low tiers with meaningful penalty weights.
- **Per-Page Drill-Down** — The dashboard shows broken-out results per page so teams can prioritise the worst-performing areas first.
- **Projects & Scan History** — Track multiple web apps and maintain a history of past scans over time.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Charts & Visualisation | Recharts |
| Backend | Node.js, Express 5 |
| Browser Automation | Playwright (Chromium) |
| Accessibility Engine | axe-core |
| HTTP Client | Axios |
| Routing | React Router DOM v7 |
| Icons | Lucide React |

---

## 📁 Project Structure

```
Inspectra AI/
├── frontend/                    # React + Vite frontend application
│   ├── src/
│   │   ├── pages/               # Full page views (Landing, Dashboard, Scans, etc.)
│   │   ├── components/          # Reusable UI components (Sidebar, TopBar, Charts)
│   │   └── services/            # API layer (axios client)
│   └── vite.config.js
│
└── backend/                     # Node.js + Express API server
    └── src/
        ├── routes/
        │   └── scan.js          # POST /api/scan — orchestration agent
        ├── services/
        │   ├── crawler.js       # Crawler Agent
        │   ├── accessibility.js # Accessibility Audit Agent
        │   └── scorer.js        # Scorer Agent
        └── utils/
            └── severity.js      # Severity levels & penalty weights
```

---

## 🔐 Environment Variables

**Backend** — create `backend/.env`:
```env
PORT=5000
```

**Frontend** — create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

For production, set `VITE_API_URL` to your deployed backend URL.

---

## 📄 License

MIT © 2025 Inspectra AI
