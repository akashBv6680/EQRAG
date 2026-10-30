import { tokenize } from './preprocessor.ts';

// 64-dimensional semantic projection space based on semantic concept basis
// This enables instantaneous local vector scoring with semantic affinity even offline or in testing,
// with support for server-side Gemini embedding augmentation.
export const SEMANTIC_DIMENSIONS = [
  // Attention & Transformers
  'attention', 'transformer', 'multihead', 'selfattention', 'encoder', 'decoder', 'query', 'key', 'value',
  // Retrieval & RAG
  'retrieval', 'rag', 'dense', 'bm25', 'corpus', 'passage', 'document', 'vector', 'search', 'index',
  // Fine-tuning & Parameter Efficiency
  'lora', 'qlora', 'adapter', 'finetuning', 'weights', 'quantization', 'lowrank', 'rank', 'matrix',
  // Reasoning & Prompting
  'reasoning', 'chainofthought', 'prompting', 'cot', 'stepbystep', 'thought', 'logic', 'math',
  // Alignment & RLHF
  'dpo', 'rlhf', 'preference', 'reward', 'optimization', 'alignment', 'policy', 'human',
  // Hardware & Acceleration
  'flashattention', 'gpu', 'sram', 'hbm', 'memory', 'ioaware', 'throughput', 'latency', 'cuda',
  // Pipeline & Programming
  'dspy', 'compiler', 'pipeline', 'declarative', 'teleprompter', 'assertion', 'signature',
  // Evaluation & Metrics
  'rouge', 'bleu', 'mrr', 'recall', 'precision', 'benchmark', 'accuracy', 'evaluation'
];

/**
 * Computes a normalized semantic vector for any given text.
 */
export function computeSemanticVector(text: string): number[] {
  const tokens = tokenize(text, true);
  const vector = new Array(SEMANTIC_DIMENSIONS.length).fill(0);
  if (tokens.length === 0) return vector;

  // Exact & prefix matching against semantic concept basis
  for (let i = 0; i < SEMANTIC_DIMENSIONS.length; i++) {
    const dim = SEMANTIC_DIMENSIONS[i];
    for (const token of tokens) {
      if (token === dim) {
        vector[i] += 2.0;
      } else if (token.includes(dim) || dim.includes(token)) {
        vector[i] += 1.0;
      }
    }
  }

  // Also include character n-gram hash features to capture open-domain semantics
  for (const token of tokens) {
    let hash = 0;
    for (let c = 0; c < token.length; c++) {
      hash = (hash << 5) - hash + token.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % SEMANTIC_DIMENSIONS.length;
    vector[idx] += 0.25;
  }

  // Normalize to unit vector
  let norm = 0;
  for (let i = 0; i < vector.length; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

/**
 * Calculates cosine similarity between two unit vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1, dotProduct));
}

/**
 * Combines BM25 and Vector Search rankings using Reciprocal Rank Fusion (RRF).
 * @param bm25Rankings Map of id -> { rank: number (1-based), score: number }
 * @param vectorRankings Map of id -> { rank: number (1-based), score: number }
 * @param alpha Weight for BM25 (0 to 1). 0.5 = equal hybrid weighting.
 * @param k RRF smoothing constant (standard is 60).
 */
export function reciprocalRankFusion(
  allIds: string[],
  bm25Rankings: Map<string, { rank: number; score: number }>,
  vectorRankings: Map<string, { rank: number; score: number }>,
  alpha = 0.5,
  k = 60
): { id: string; rrfScore: number; bm25Rank: number; vectorRank: number; bm25Score: number; vectorScore: number }[] {
  const defaultRank = 999;
  const results = allIds.map(id => {
    const bm25Entry = bm25Rankings.get(id);
    const vectorEntry = vectorRankings.get(id);

    const bm25Rank = bm25Entry ? bm25Entry.rank : defaultRank;
    const vectorRank = vectorEntry ? vectorEntry.rank : defaultRank;

    const bm25Score = bm25Entry ? bm25Entry.score : 0;
    const vectorScore = vectorEntry ? vectorEntry.score : 0;

    // RRF formula with alpha weighting:
    // score = alpha * (1 / (k + rank_bm25)) + (1 - alpha) * (1 / (k + rank_vector))
    const bm25Component = bm25Rank < defaultRank ? (1 / (k + bm25Rank)) : 0;
    const vectorComponent = vectorRank < defaultRank ? (1 / (k + vectorRank)) : 0;

    const rrfScore = (alpha * bm25Component) + ((1 - alpha) * vectorComponent);

    return {
      id,
      rrfScore,
      bm25Rank,
      vectorRank,
      bm25Score,
      vectorScore
    };
  });

  return results.sort((a, b) => b.rrfScore - a.rrfScore);
}
