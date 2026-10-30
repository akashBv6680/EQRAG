export interface DocumentChunk {
  id: string;
  docId: string;
  docTitle: string;
  sectionTitle: string;
  content: string;
  cleanedContent: string;
  tokenCount: number;
  embedding?: number[];
}

export interface DocumentItem {
  id: string;
  title: string;
  authors: string[];
  year: number;
  category: string;
  abstract: string;
  sections: {
    title: string;
    content: string;
  }[];
  chunks: DocumentChunk[];
  totalTokens: number;
  sourceUrl?: string;
  referenceSummary?: string;
}

export type SearchMode = 'hybrid' | 'bm25' | 'dense';

export interface SearchResultItem {
  chunk: DocumentChunk;
  doc: DocumentItem;
  bm25Score: number;
  bm25Rank: number;
  vectorScore: number;
  vectorRank: number;
  rrfScore: number;
  finalScore: number;
  matchedTerms: string[];
  snippet: string;
}

export type SummaryLength = 'bullets' | 'concise' | 'comprehensive' | 'custom';

export interface SummaryRequest {
  query: string;
  retrievedChunks: {
    docTitle: string;
    sectionTitle: string;
    content: string;
  }[];
  lengthPreset: SummaryLength;
  customWordCount?: number;
  focusAspect?: string;
}

export interface SummaryResponse {
  summary: string;
  wordCount: number;
  keyPoints: string[];
  citations: string[];
  latencyMs: number;
  modelUsed: string;
}

export interface EvaluationQuery {
  id: string;
  query: string;
  category: string;
  targetDocId: string;
  targetDocTitle: string;
  referenceSummary: string;
}

export interface EvaluationQueryResult {
  queryId: string;
  query: string;
  targetDocId: string;
  targetDocTitle: string;
  bm25Rank: number | null;
  denseRank: number | null;
  hybridRank: number | null;
  hitAt1: boolean;
  hitAt3: boolean;
  hitAt5: boolean;
  reciprocalRank: number;
}

export interface RougeScores {
  precision: number;
  recall: number;
  f1: number;
}

export interface RougeMetrics {
  rouge1: RougeScores;
  rouge2: RougeScores;
  rougeL: RougeScores;
}

export interface EvaluationSummaryReport {
  totalQueries: number;
  bm25: {
    mrr: number;
    recallAt1: number;
    recallAt3: number;
    recallAt5: number;
    map: number;
  };
  dense: {
    mrr: number;
    recallAt1: number;
    recallAt3: number;
    recallAt5: number;
    map: number;
  };
  hybrid: {
    mrr: number;
    recallAt1: number;
    recallAt3: number;
    recallAt5: number;
    map: number;
  };
  rouge: RougeMetrics;
  humanEvaluation: {
    coherence: number; // 1-5
    factuality: number; // 1-5
    conciseness: number; // 1-5
    coverage: number; // 1-5
  };
  queryResults: EvaluationQueryResult[];
}
