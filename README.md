# 🛡️ Ghost-Ops: Multi-Agent Security Intelligence

> *A forensic-grade telemetry dashboard driven by a sequential AI relay. Built to execute tactical reconnaissance, calculate strategic risk, and synthesize automated hardware/software countermeasures in real time.*

Ghost-Ops replaces static threat monitoring with a dynamic, multi-agent AI pipeline. Operating from a unified Command Hub, objectives are fed into an asynchronous execution chain powered by next-generation Google Gemini models. The outcome is continuous, structured intelligence pushed to a glassmorphism UI over WebSockets.

---

## ⚡ The Agentic Relay Architecture

Ghost-Ops utilizes a strictly sequential **Agentic Relay** to break complex security directives into consumable, analytical phases. 

The pipeline guarantees context inheritance. Each node digests the preceding agent's raw payload, refining the telemetry from open-ended research down to actionable code implementation.

<details>
<summary><strong>🕵️ Agent_Alpha (The Lead Researcher)</strong></summary>

- **Phase:** Phase 1 (Reconnaissance)
- **Directive:** Scans the initial Mission Objective. Produces a cold, clinical, and rapid 2-sentence technical reconnaissance report focusing on hardware vulnerabilities or structural vectors.
</details>

<details>
<summary><strong>🧠 Agent_Beta (The Strategic Analyst)</strong></summary>

- **Phase:** Phase 2 (Threat Assessment)
- **Directive:** Ingests Agent_Alpha's forensic scan. Distills the noise into a concentrated, high-priority, 1-sentence Strategic Threat Assessment representing current orbital risk.
</details>

<details>
<summary><strong>⚙️ Agent_Gamma (The Remediation Engineer)</strong></summary>

- **Phase:** Phase 3 (Tactical Countermeasure)
- **Directive:** Triggers on Agent_Beta's assessment. Synthesizes a precise counter-protocol—outputting raw, hypothetical regex sanitization or hardcoded firewall configurations mapped to an Amber Alert UI state.
</details>

---

## 📸 Dashboard Preview
---

![Ghost Ops Telemetry Feed](<Screenshot (55).png>)

![Threat Matrix Radar](<Screenshot (56).png>)

---

## 🛠️ Stack & Telemetry Infrastructure

- **Next.js 15 (App Router):** High-performance framework utilizing Edge runtime API routes.
- **Google Generative AI SDK (`gemini-2.5-flash`):** The core intelligence engine propelling the multi-agent sequencing.
- **Supabase (PostgreSQL Auth & DB):** Acts as the primary state synchronization layer. Replicates SQL `INSERT` rows over `postgres_changes` WebSockets for zero-latency dashboard updates.
- **Tailwind CSS v4 & Framer Motion:** Fluid typography, micro-interactions, scanning overlays, and ambient glassmorphism (`backdrop-blur`).
- **Recharts (D3.js):** SVG-backed interactive canvas powering the real-time Threat Matrix.

---

## 📥 Deployment Initialization

### 1. Repository Clone & Dependency Mounting

```bash
git clone https://github.com/lakshmi-srujana/ghost-ops.git
cd ghost-ops
npm install
```

### 2. Environment Configuration

You will require valid service keys for Google Gemini API and a remote Supabase Postgres DB. Create a `.env.local` file at the repository root:

```env
# Supabase Relational Database & Realtime Channels
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Generative AI
GITHUB_TOKEN=your-github-token
```

### 3. Server Ignition

Init the dev server. Ghost-Ops local telemetry will bind to port 3000.

```bash
npm run dev
```

Target your browser at `http://localhost:3000` to establish the Command Hub uplink. Execute a directive in the Mission Control bento to trigger the relay.
