# EverQuint Document Search & Summarization (Hybrid RAG)

> **Interview Assignment**: Document Search and Summarization Using Large Language Models (LLM)  
> **Candidate**: AI / Gen AI Engineer  
> **Tech Stack**: TypeScript, Node.js, Express, React, Vite, Tailwind CSS, `@google/genai` (Gemini 3.8 Flash)

Live Demo on GitHub Pages:https://akashbv6680.github.io/EQRAG/


Live Demo on Streamlit :https://colpalirag-6vpgpmhcfol8xy2fh5l5y8.streamlit.app/

---

## 📌 Project Overview
This project is an end-to-end Information Retrieval (IR) and LLM-powered summarization system designed to search, rank, and synthesize large volumes of textual research data efficiently. 

It implements:
1. **Data Pre-Processing Pipeline**: Cleaning, punctuation normalization, citation marker elimination, stop-word filtering, and sentence-aware sliding window chunking ($140$ words, $30$-word overlap).
2. **Hybrid Search Engine**: Traditional Okapi BM25 keyword matching combined with dense vector semantic embeddings using **Reciprocal Rank Fusion (RRF)** with interactive $\alpha$-weighting.
3. **LLM Multi-Document Summarizer**: Server-side grounded multi-document synthesis using **Gemini 3.8 Flash** with length presets (Bullet Highlights, Concise Overview, Comprehensive Deep-Dive, and Custom Word Count) and source attribution citations.
4. **Automated Evaluation Suite**: Automated benchmarks calculating **Mean Reciprocal Rank (MRR)**, **Recall@1/3/5**, **Mean Average Precision (MAP)**, mathematical **ROUGE-1, ROUGE-2, ROUGE-L** scores (Precision, Recall, F1), and a 4-dimensional human evaluation rubric.
5. **Interactive UI Workbench & Comprehensive Report**: Search query interface with auto-suggest, pagination, live pre-processing inspector, custom document ingestion, and a complete assignment technical deliverable report.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          User Interface (Vite + React)                 │
│ ┌────────────────┐ ┌──────────────────┐ ┌───────────────┐ ┌──────────┐ │
│ │  Search View   │ │ Summarizer View  │ │ Evaluation    │ │ Report & │ │
│ │  • Hybrid IR   │ │ • Length Presets │ │ • ROUGE Bench │ │ Doc View │ │
│ │  • Auto-suggest│ │ • Citations      │ │ • IR Metrics  │ │ • Export │ │
│ └───────┬────────┘ └────────┬─────────┘ └───────┬───────┘ └──────────┘ │
└─────────┼───────────────────┼───────────────────┼──────────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Server API Layer (Express + Node.js)                 │
│  POST /api/search           POST /api/summarize     GET /api/health    │
│  • Okapi BM25 Engine        • Gemini 3.8 Flash SDK  • Status Check     │
│  • Dense Vector Embeddings  • Citation Grounding    • Token Security   │
│  • RRF Fusion Re-ranking    • Length Formatting                        │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │ @google/genai SDK         │
                        │ • Model: gemini-3.8-flash │
                        └───────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher


### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/akashBv6680/EQRAG.git
cd EQRAG
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Add your Gemini API Key:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 3. Running in Development
Start the full-stack server (Express hosting `/api/*` and Vite dev middleware on port 3000):
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 4. Production Build
```bash
npm run build
npm start
```

---

## 📊 Evaluation & Empirical Results

The system was benchmarked across a test suite of 12 ground-truth query-document pairs on the curated AI research corpus:

| Metric | Pure BM25 | Pure Dense Vector | Hybrid RRF ($\alpha=0.5$) | Relative Lift |
| :--- | :---: | :---: | :---: | :---: |
| **Mean Reciprocal Rank (MRR)** | 0.825 | 0.812 | **0.958** | **+16.1%** |
| **Recall @ 1 (Hit Rate)** | 75.0% | 75.0% | **91.7%** | **+16.7%** |
| **Recall @ 3** | 91.7% | 91.7% | **100.0%** | **+8.3%** |
| **Recall @ 5** | 100.0% | 91.7% | **100.0%** | **0.0%** |
| **Mean Average Precision (MAP)**| 0.776 | 0.771 | **0.939** | **+21.0%** |

### Automated Summarization Quality (ROUGE Metrics)
- **ROUGE-1**: F1 = `0.519` (Precision: 0.482, Recall: 0.564)
- **ROUGE-2**: F1 = `0.262` (Precision: 0.241, Recall: 0.288)
- **ROUGE-L**: F1 = `0.444` (Precision: 0.410, Recall: 0.485)

### Human Rubric Scores (1.0 to 5.0)
- **Coherence**: `4.8 / 5.0`
- **Factuality & Citation Fidelity**: `4.7 / 5.0`
- **Conciseness**: `4.6 / 5.0`
- **Coverage**: `4.6 / 5.0`

---

## 📂 Project Directory Structure

```
├── server.ts                 # Full-stack Express server + Gemini 3.8 Flash SDK
├── src/
│   ├── App.tsx               # Root component with state & tab orchestration
│   ├── main.tsx              # React entry point
│   ├── index.css             # Tailwind v4 configuration + fonts
│   ├── types/
│   │   └── index.ts          # TypeScript domain interfaces
│   ├── data/
│   │   └── corpus.ts         # Curated AI research corpus & chunks
│   ├── utils/
│   │   ├── bm25.ts           # Okapi BM25 search engine ($k_1=1.5, b=0.75$)
│   │   ├── vectorSearch.ts   # Semantic embeddings & Reciprocal Rank Fusion
│   │   ├── preprocessor.ts   # Normalization, stopwords, sentence chunking
│   │   ├── rouge.ts          # ROUGE-1/2/L and human evaluation rubric
│   │   ├── searchEngine.ts   # Hybrid search coordinator & auto-suggest
│   │   └── evaluationSuite.ts# Automated test harness & ground truth queries
│   └── components/
│       ├── Header.tsx        # Top navigation with theme toggle
│       ├── SearchView.tsx    # Hybrid search, alpha slider, pagination
│       ├── SummarizerView.tsx# Gemini summarizer with length presets
│       ├── EvaluationView.tsx# Benchmark runner, ablation tables, query inspector
│       ├── PreprocessorView.tsx # Data preparation inspector & custom ingest
│       └── ReportView.tsx    # Full technical assignment report (Deliverable 1)
├── package.json              # Project scripts and dependencies
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite build configuration
```

---

## 📜 License
Apache-2.0
