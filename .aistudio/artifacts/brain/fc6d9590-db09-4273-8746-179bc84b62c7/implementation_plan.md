# Ever Quint: Document Search & Summarization Engine (Hybrid RAG)

A high-performance Information Retrieval (IR) and LLM-powered summarization system built to search, rank, and synthesize large textual corpuses with full evaluation benchmarking and comprehensive assignment documentation.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The implementation aligns with all specifications in the Ever Quint assignment prompt and your confirmed choices:
> - **Corpus Selection**: AI Research & LLM Engineering Papers corpus pre-loaded with custom document upload support.
> - **Search Pipeline**: Hybrid Information Retrieval combining BM25 keyword ranking and Gemini vector embeddings via tunable Reciprocal Rank Fusion (RRF).
> - **Scope & Deliverables**: Full interactive search interface, adjustable summarization, automated evaluation benchmark (ROUGE-1/2/L, MRR, Recall@K), and an integrated assignment report viewer.

- **Confirmed Decision 1**: Pre-loaded corpus consists of benchmark AI & LLM engineering publications (Attention, LoRA, FlashAttention, RAG, DSPy, Chain-of-Thought, etc.) with custom upload and pre-processing pipeline inspection.
- **Confirmed Decision 2**: Search mechanism features interactive weight slider between Traditional BM25 and Dense Semantic Embeddings using Reciprocal Rank Fusion ($RRF(d) = \sum_{m \in M} \frac{w_m}{k + r_m(d)}$).
- **Confirmed Decision 3**: Deliverables include both the live interactive product (with auto-suggest, pagination, adjustable summary length) and the full assignment evaluation report with automated ROUGE metrics and architecture documentation.

---

### 1. Overview & Core Concept

- **What It Does**: Enables users to ingest queries across a sizable document corpus, retrieve top-N relevant excerpts using state-of-the-art hybrid search (BM25 + vector similarity), synthesize coherent multi-document summaries with adjustable depth, benchmark system accuracy via an automated test harness, and review the complete assignment methodology report.
- **Target Audience / Persona**: AI Engineers, researchers, and technical interviewers evaluating RAG architecture, retrieval precision, LLM generation fidelity, and quantitative metrics.
- **Key Value**: Delivers an optimal end-to-end solution exceeding all assignment requirements: clean data pre-processing, measurable retrieval gains from hybrid search, rigorous ROUGE and MRR evaluation, and an interactive interface.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Search & Ingestion**: User enters a technical query (with auto-completion hints and suggested benchmark queries). Results appear instantly with pagination, relevancy scores, matched keyword highlighting, and excerpt inspection.
2. **Hybrid Tuning**: User adjusts the IR method (BM25 vs. Semantic Embeddings vs. Tunable RRF ratio) and Top-N slider to observe search rank dynamics in real time.
3. **LLM Summarization**: User selects retrieved documents, sets target length (Concise Bullets, Medium Executive, or Comprehensive Deep Dive), and generates an LLM synthesis powered by `gemini-3.8-flash` with source citations.
4. **Evaluation Benchmark**: User switches to the Evaluation tab to run automated tests on ground-truth query-document pairs, reviewing Recall@K, Precision@K, MRR, and automated ROUGE-1/2/L summary scoring.
5. **Corpus & Data Pre-processor**: User inspects tokenization, text cleaning, chunking strategies, or uploads custom technical text/files.
6. **Executive Report & Documentation**: User reads the interactive assignment deliverable report covering data justification, algorithmic formulas, evaluation results, challenges & solutions, and README.

#### Visual Identity & Theme
- **Aesthetic Direction**: Modern technical workbench / developer analytics console (following the SaaS & Dashboard guidelines). Crisp typography, single-elevation surfaces, and tabular numbers.
- **Color Palette**:
  - Dominant Neutral: Crisp Slate (`bg-slate-50 dark:bg-slate-950`, surfaces `bg-white dark:bg-slate-900`)
  - Structural Borders: Hairline borders (`border-slate-200 dark:border-slate-800`)
  - Accent Color: Indigo / Electric Blue (`bg-indigo-600 hover:bg-indigo-700 text-white`) for primary CTAs and active tabs
  - Semantic Accents: Emerald (`text-emerald-600`) for high relevance / ROUGE F1, Amber (`text-amber-600`) for warnings, Rose (`text-rose-600`) for errors
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` font for crisp, confident headings
  - Body Prose: `DM Sans` / `Plus Jakarta Sans` for clean, readable scannability
  - Metrics & Code: Monospace with `tabular-nums` (`font-mono`) for precision alignment
- **Anti-Slop Discipline**:
  - Zero pill badges on static metadata (clean unboxed text with `·` separators).
  - No fake execution tickers, no pulsing green dots, no decorative pseudo-code comments.
  - Generous whitespace, single-elevation cards, and responsive 1440px workspace presence.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Hybrid Search Architecture (BM25 + Semantic Embeddings)**
  - *Chosen Approach*: Implement a fast, exact client/server BM25 algorithm (Okapi BM25 with $k_1=1.5, b=0.75$) coupled with dense semantic embeddings, fused via Reciprocal Rank Fusion ($k=60$).
  - *Why*: BM25 excels at specific technical terms, model names, and exact keywords where dense embeddings struggle with "vocabulary mismatch"; semantic embeddings capture conceptual intent. Hybrid RRF significantly improves MRR and Recall@5.
  - *Alternatives Considered*: Dense embeddings alone (fails on specific acronyms like "LoRA" or "KV cache") or BM25 alone (misses synonyms and paraphrased questions).
- **Decision 2: Server-Side LLM Summarization with Gemini 3.8 Flash**
  - *Chosen Approach*: Secure server-side endpoint calling `@google/genai` with `gemini-3.8-flash` using structured instructions, citation requirements, and user-specified length constraints.
  - *Why*: Fast latency, high context capacity, excellent instruction following for coherent multi-document synthesis, and zero browser API key exposure.
- **Decision 3: Automated Evaluation Suite (ROUGE & IR Metrics)**
  - *Chosen Approach*: Implement real computational evaluation algorithms for ROUGE-1, ROUGE-2, and ROUGE-L (N-gram overlap and Longest Common Subsequence) alongside standard IR metrics (Recall@K, MRR@K, MAP).
  - *Why*: Directly satisfies Task 4 and Evaluation Criteria in the Ever Quint assignment without requiring external Python environments.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          User Interface (Vite + React)                 │
│ ┌────────────────┐ ┌──────────────────┐ ┌───────────────┐ ┌──────────┐ │
│ │  Search View   │ │ Summarizer View  │ │ Evaluation    │ │ Report & │ │
│ │  • Hybrid IR   │ │ • Length Options │ │ • ROUGE Bench │ │ Doc View │ │
│ │  • Auto-suggest│ │ • Citations      │ │ • IR Metrics  │ │ • Export │ │
│ └───────┬────────┘ └────────┬─────────┘ └───────┬───────┘ └──────────┘ │
└─────────┼───────────────────┼───────────────────┼──────────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Server API Layer (Express + Node.js)                 │
│  POST /api/search           POST /api/summarize     POST /api/evaluate │
│  • BM25 Indexing Engine     • Gemini 3.8 Flash SDK  • Ground Truth Run │
│  • Vector Embeddings        • Multi-Doc Fusion      • ROUGE-1/2/L Math │
│  • RRF Fusion Re-ranking    • Length Formatting     • MRR & Recall@K   │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │ @google/genai SDK         │
                        │ • gemini-3.8-flash        │
                        │ • gemini-embedding-2-prev │
                        └───────────────────────────┘
```

#### Core Components
- **Corpus Data Store (`src/data/corpus.ts`)**: 25+ curated papers with metadata (title, author, year, category, abstract, section chunks, pre-computed keywords and embeddings).
- **Pre-processing Engine (`src/utils/preprocessor.ts`)**: Text normalization, tokenization, stop-word removal, sentence segmentation, and chunking with overlap.
- **Information Retrieval Engine (`src/utils/searchEngine.ts`)**: BM25 Okapi indexer, Cosine similarity on embeddings, and Reciprocal Rank Fusion combiner with configurable weighting.
- **LLM Summarization Service (`server.ts` & `src/services/api.ts`)**: Server routes invoking `@google/genai` `gemini-3.8-flash` with system prompt guardrails, citation mapping, and token budget management.
- **Evaluation Engine (`src/utils/evaluation.ts`)**: Ground-truth test set (15+ curated query-document pairs), ROUGE-1, ROUGE-2, ROUGE-L precision/recall/F1 calculators, and MRR / Recall@K scoring.
- **Report & Documentation Module (`src/components/ReportView.tsx`)**: High-fidelity interactive reader detailing the full interview submission report with download/copy capability.

---

### 5. Verification & Testing Plan
- Test search across various query types: exact keyword, conceptual/abstract question, acronym lookup.
- Verify hybrid slider dynamically reranks results between pure BM25, 50/50 RRF, and pure semantic search.
- Test summarization across all 3 length presets (Bullets, Concise, Comprehensive) with real API responses.
- Run the full automated evaluation suite and verify all ROUGE scores and MRR calculations render correctly with zero errors.
- Confirm full-stack build compiles cleanly (`npm run build`).
