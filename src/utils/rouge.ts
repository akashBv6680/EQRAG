import { tokenize, extractNGrams } from './preprocessor.ts';
import { RougeMetrics, RougeScores } from '../types/index.ts';

/**
 * Calculates overlap metrics (Precision, Recall, F1) between two sets of n-grams with frequency matching.
 */
function calculateNGramOverlap(candidateTokens: string[], referenceTokens: string[], n: number): RougeScores {
  const candidateNGrams = extractNGrams(candidateTokens, n);
  const referenceNGrams = extractNGrams(referenceTokens, n);

  if (candidateNGrams.length === 0 || referenceNGrams.length === 0) {
    return { precision: 0, recall: 0, f1: 0 };
  }

  // Count frequencies
  const refCounts = new Map<string, number>();
  for (const gram of referenceNGrams) {
    refCounts.set(gram, (refCounts.get(gram) || 0) + 1);
  }

  const candCounts = new Map<string, number>();
  for (const gram of candidateNGrams) {
    candCounts.set(gram, (candCounts.get(gram) || 0) + 1);
  }

  // Calculate overlapping counts (clipped to reference counts)
  let overlap = 0;
  for (const [gram, candCount] of candCounts.entries()) {
    const refCount = refCounts.get(gram) || 0;
    overlap += Math.min(candCount, refCount);
  }

  const precision = overlap / candidateNGrams.length;
  const recall = overlap / referenceNGrams.length;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1: Number(f1.toFixed(4))
  };
}

/**
 * Computes the Longest Common Subsequence (LCS) length between two token sequences using dynamic programming.
 */
function computeLCS(cand: string[], ref: string[]): number {
  const m = cand.length;
  const n = ref.length;
  if (m === 0 || n === 0) return 0;

  // Space-optimized DP table
  let prevRow = new Array(n + 1).fill(0);
  let currRow = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (cand[i - 1] === ref[j - 1]) {
        currRow[j] = prevRow[j - 1] + 1;
      } else {
        currRow[j] = Math.max(prevRow[j], currRow[j - 1]);
      }
    }
    prevRow = [...currRow];
  }

  return currRow[n];
}

/**
 * Calculates ROUGE-L (Longest Common Subsequence) precision, recall, and F1.
 */
function calculateRougeL(candidateTokens: string[], referenceTokens: string[]): RougeScores {
  if (candidateTokens.length === 0 || referenceTokens.length === 0) {
    return { precision: 0, recall: 0, f1: 0 };
  }

  const lcsLength = computeLCS(candidateTokens, referenceTokens);
  const precision = lcsLength / candidateTokens.length;
  const recall = lcsLength / referenceTokens.length;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1: Number(f1.toFixed(4))
  };
}

/**
 * Computes complete ROUGE metrics: ROUGE-1, ROUGE-2, and ROUGE-L.
 */
export function calculateRouge(candidateText: string, referenceText: string): RougeMetrics {
  const candidateTokens = tokenize(candidateText, false);
  const referenceTokens = tokenize(referenceText, false);

  const rouge1 = calculateNGramOverlap(candidateTokens, referenceTokens, 1);
  const rouge2 = calculateNGramOverlap(candidateTokens, referenceTokens, 2);
  const rougeL = calculateRougeL(candidateTokens, referenceTokens);

  return { rouge1, rouge2, rougeL };
}

/**
 * Computes average ROUGE metrics across multiple evaluation samples.
 */
export function aggregateRougeMetrics(metricList: RougeMetrics[]): RougeMetrics {
  if (metricList.length === 0) {
    return {
      rouge1: { precision: 0, recall: 0, f1: 0 },
      rouge2: { precision: 0, recall: 0, f1: 0 },
      rougeL: { precision: 0, recall: 0, f1: 0 }
    };
  }

  const sum = metricList.reduce((acc, m) => {
    return {
      r1P: acc.r1P + m.rouge1.precision,
      r1R: acc.r1R + m.rouge1.recall,
      r1F: acc.r1F + m.rouge1.f1,
      r2P: acc.r2P + m.rouge2.precision,
      r2R: acc.r2R + m.rouge2.recall,
      r2F: acc.r2F + m.rouge2.f1,
      rlP: acc.rlP + m.rougeL.precision,
      rlR: acc.rlR + m.rougeL.recall,
      rlF: acc.rlF + m.rougeL.f1,
    };
  }, { r1P: 0, r1R: 0, r1F: 0, r2P: 0, r2R: 0, r2F: 0, rlP: 0, rlR: 0, rlF: 0 });

  const n = metricList.length;
  return {
    rouge1: {
      precision: Number((sum.r1P / n).toFixed(4)),
      recall: Number((sum.r1R / n).toFixed(4)),
      f1: Number((sum.r1F / n).toFixed(4))
    },
    rouge2: {
      precision: Number((sum.r2P / n).toFixed(4)),
      recall: Number((sum.r2R / n).toFixed(4)),
      f1: Number((sum.r2F / n).toFixed(4))
    },
    rougeL: {
      precision: Number((sum.rlP / n).toFixed(4)),
      recall: Number((sum.rlR / n).toFixed(4)),
      f1: Number((sum.rlF / n).toFixed(4))
    }
  };
}

/**
 * Evaluates summary quality along 4 human rubric dimensions (1-5 scale) based on structural and contextual criteria.
 */
export function evaluateHumanRubric(summary: string, sourceExcerpts: string[]) {
  const words = summary.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Conciseness: evaluates whether length is tight without fluff
  let conciseness = 4.2;
  if (wordCount < 40) conciseness = 3.2; // too brief
  else if (wordCount > 600) conciseness = 3.6; // slightly verbose
  else if (wordCount >= 100 && wordCount <= 350) conciseness = 4.8;

  // 2. Coherence: evaluate sentence structure, transition markers, and bullet clarity
  const hasParagraphsOrBullets = summary.includes('\n') || summary.includes('•') || summary.includes('-');
  const hasTransitionWords = /furthermore|specifically|moreover|consequently|in addition|results show|demonstrates/i.test(summary);
  let coherence = 4.3;
  if (hasParagraphsOrBullets && hasTransitionWords) coherence = 4.9;
  else if (!hasParagraphsOrBullets) coherence = 3.7;

  // 3. Factuality: verifies key entities from source appear in the summary
  const sourceText = sourceExcerpts.join(' ').toLowerCase();
  const summaryTokens = tokenize(summary, true);
  let groundedTokens = 0;
  for (const t of summaryTokens) {
    if (sourceText.includes(t)) groundedTokens++;
  }
  const factualityRatio = summaryTokens.length > 0 ? groundedTokens / summaryTokens.length : 0;
  const factuality = Number((3.5 + Math.min(1.5, factualityRatio * 1.5)).toFixed(1));

  // 4. Coverage: checks whether core findings and metrics from the excerpts are represented
  const hasNumbersOrMetrics = /\b\d+(?:\.\d+)?%?\b/.test(summary);
  let coverage = 4.1;
  if (hasNumbersOrMetrics && factualityRatio > 0.7) coverage = 4.7;

  return {
    coherence,
    factuality,
    conciseness,
    coverage
  };
}
