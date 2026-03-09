## Project info
If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS


## Can I connect a custom domain to my  project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)


🏥 AI-Powered Hospital Performance Intelligence System
📌 Overview

Hospital administrators often rely on weekly or monthly reports, which makes it difficult to detect operational issues early. Important metrics like bed occupancy, OPD wait times, billing collection rates, lab turnaround time (TAT), and patient satisfaction scores are usually stored in different systems without a unified view.

This project introduces an AI-powered hospital analytics platform that aggregates data from multiple systems, detects anomalies in real time, and generates natural language insights with actionable recommendations for hospital leadership.

🎯 Problem Statement

Hospital leadership lacks a real-time intelligent analytics system that can:

Automatically analyze operational metrics

Detect performance issues early

Explain root causes

Recommend corrective actions

Most existing dashboards only display numbers without providing context or decision support.

💡 Proposed Solution

Our system acts as an AI-driven hospital operations assistant that:

Aggregates data from multiple hospital systems.

Calculates key hospital performance KPIs automatically.

Detects anomalies when metrics deviate from normal patterns.

Generates natural language insights explaining the issue.

Suggests prioritized corrective actions.

⚙️ Core Features
📊 Multi-Source Data Aggregation

Collects and normalizes data from:

Bed management systems

OPD scheduling

Billing systems

Lab TAT monitoring

Pharmacy systems

Patient satisfaction surveys

📈 Automated KPI Calculation

The system automatically calculates key hospital metrics:

Bed Occupancy Rate

Average OPD Wait Time

Billing Collection Rate

Lab Turnaround Time Compliance

30-Day Readmission Rate

Net Promoter Score (NPS)

🚨 Anomaly Detection

The system flags performance issues when:

KPI deviates more than 15% from the 7-day baseline

A predefined threshold is exceeded.

🧠 AI-Generated Insights

Instead of just displaying numbers, the AI explains the issue:

Example:

"OPD wait time in Cardiology increased by 38% compared to last week, likely due to two unassigned doctor slots."

<img width="235" height="252" alt="image" src="https://github.com/user-attachments/assets/e90108c2-aaa5-4606-ab1b-f3bb94773ac8" />

✅ Actionable Recommendations

The system suggests actions such as:

Reassigning doctor schedules

Activating overflow OPD protocols

Adjusting staffing levels

Optimizing resource allocation

🧩 System Architecture
Hospital Systems
   │
   ├── Bed Management
   ├── OPD Scheduling
   ├── Billing
   ├── Lab TAT
   ├── Pharmacy
   └── Patient Satisfaction
        │
        ▼
Data Aggregation & Normalization
        │
        ▼
KPI Calculation Engine
        │
        ▼
Anomaly Detection Module
        │
        ▼
RAG (LlamaIndex) + LLM Insights
        │
        ▼
Dashboard & Decision Support
🛠️ Tech Stack
Component	Technology
Programming Language	Python
AI Framework	LlamaIndex
RAG Architecture	Retrieval Augmented Generation
Data Processing	Pandas / NumPy
Anomaly Detection	Statistical / ML Models
UI Dashboard	Streamlit
LLM Integration	OpenAI API
🖥️ Dashboard Features

Real-time hospital KPI monitoring

Automatic anomaly alerts

Natural language explanations

Recommended corrective actions
