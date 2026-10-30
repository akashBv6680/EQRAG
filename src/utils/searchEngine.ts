import { DocumentItem, DocumentChunk, SearchResultItem, SearchMode } from '../types/index.ts';
import { BM25Engine } from './bm25.ts';
import { computeSemanticVector, cosineSimilarity, reciprocalRankFusion } from './vectorSearch.ts';
import { tokenize } from './preprocessor.ts';

export class SearchEngine {
  private corpus: DocumentItem[] = [];
  private chunksMap: Map<string, DocumentChunk> = new Map();
  private docMap: Map<string, DocumentItem> = new Map();
  private bm25: BM25Engine;

  constructor(corpus: DocumentItem[]) {
    this.bm25 = new BM25Engine(1.5, 0.75);
    this.updateCorpus(corpus);
  }

  public updateCorpus(corpus: DocumentItem[]) {
    this.corpus = corpus;
    this.chunksMap.clear();
    this.docMap.clear();

    const flatChunks: { id: string; content: string }[] = [];

    for (const doc of corpus) {
      this.docMap.set(doc.id, doc);
      for (const chunk of doc.chunks) {
        this.chunksMap.set(chunk.id, chunk);
        flatChunks.push({
          id: chunk.id,
          content: `${doc.title} ${chunk.sectionTitle} ${chunk.content}`
        });
      }
    }

    this.bm25.indexDocuments(flatChunks);
  }

  /**
   * Executes hybrid search over indexed document chunks.
   * @param query Search string
   * @param mode 'hybrid' | 'bm25' | 'dense'
   * @param alpha Weight for BM25 (0 to 1), where 0.5 = equal balance
   * @param topN Number of results to return
   */
  public search(
    query: string,
    mode: SearchMode = 'hybrid',
    alpha = 0.5,
    topN = 5
  ): SearchResultItem[] {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    const queryTokens = tokenize(trimmedQuery, true);
    const queryVector = computeSemanticVector(trimmedQuery);
    const allChunkIds = Array.from(this.chunksMap.keys());

    // 1. BM25 Search
    const bm25RawResults = this.bm25.search(trimmedQuery);
    const bm25Sorted = Array.from(bm25RawResults.entries())
      .sort((a, b) => b[1].score - a[1].score);

    const bm25Rankings = new Map<string, { rank: number; score: number }>();
    bm25Sorted.forEach(([id, res], index) => {
      bm25Rankings.set(id, { rank: index + 1, score: res.score });
    });

    // 2. Dense Semantic Vector Search
    const vectorRawResults: { id: string; score: number }[] = [];
    for (const [id, chunk] of this.chunksMap.entries()) {
      const chunkVector = chunk.embedding || computeSemanticVector(chunk.content);
      const score = cosineSimilarity(queryVector, chunkVector);
      if (score > 0.05) {
        vectorRawResults.push({ id, score });
      }
    }
    vectorRawResults.sort((a, b) => b.score - a.score);

    const vectorRankings = new Map<string, { rank: number; score: number }>();
    vectorRawResults.forEach((res, index) => {
      vectorRankings.set(res.id, { rank: index + 1, score: res.score });
    });

    // 3. Combine Rankings
    let rankedChunkIds: {
      id: string;
      finalScore: number;
      bm25Score: number;
      vectorScore: number;
      bm25Rank: number;
      vectorRank: number;
      rrfScore: number;
    }[] = [];

    if (mode === 'bm25') {
      rankedChunkIds = bm25Sorted.map(([id, res], idx) => ({
        id,
        finalScore: res.score,
        bm25Score: res.score,
        vectorScore: vectorRankings.get(id)?.score || 0,
        bm25Rank: idx + 1,
        vectorRank: vectorRankings.get(id)?.rank || 999,
        rrfScore: 1 / (60 + idx + 1)
      }));
    } else if (mode === 'dense') {
      rankedChunkIds = vectorRawResults.map((res, idx) => ({
        id: res.id,
        finalScore: res.score,
        bm25Score: bm25Rankings.get(res.id)?.score || 0,
        vectorScore: res.score,
        bm25Rank: bm25Rankings.get(res.id)?.rank || 999,
        vectorRank: idx + 1,
        rrfScore: 1 / (60 + idx + 1)
      }));
    } else {
      // Reciprocal Rank Fusion
      const effectiveAlpha = Math.max(0, Math.min(1, alpha));
      const rrfResults = reciprocalRankFusion(allChunkIds, bm25Rankings, vectorRankings, effectiveAlpha, 60);

      rankedChunkIds = rrfResults
        .filter(r => r.rrfScore > 0 && (r.bm25Rank < 999 || r.vectorRank < 999))
        .map(r => ({
          id: r.id,
          finalScore: r.rrfScore,
          bm25Score: r.bm25Score,
          vectorScore: r.vectorScore,
          bm25Rank: r.bm25Rank,
          vectorRank: r.vectorRank,
          rrfScore: r.rrfScore
        }));
    }

    // Build SearchResultItem objects
    const results: SearchResultItem[] = rankedChunkIds.slice(0, topN).map(item => {
      const chunk = this.chunksMap.get(item.id)!;
      const doc = this.docMap.get(chunk.docId)!;
      const matchedTerms = (bm25RawResults.get(item.id)?.matchedTerms || []).filter(t => queryTokens.includes(t));

      return {
        chunk,
        doc,
        bm25Score: Number(item.bm25Score.toFixed(3)),
        bm25Rank: item.bm25Rank,
        vectorScore: Number(item.vectorScore.toFixed(3)),
        vectorRank: item.vectorRank,
        rrfScore: Number(item.rrfScore.toFixed(5)),
        finalScore: Number(item.finalScore.toFixed(4)),
        matchedTerms,
        snippet: chunk.content
      };
    });

    return results;
  }

  /**
   * Returns auto-suggestions based on query prefix and corpus keywords.
   */
  public getSuggestions(query: string, maxSuggestions = 5): string[] {
    const rawSuggestions = [
      'Scaled dot-product multi-head self-attention',
      'Dense passage retrieval for open-domain QA',
      'Low-Rank Adaptation parameter efficiency',
      'IO-aware exact attention GPU memory SRAM',
      'Chain-of-thought mathematical reasoning GSM8K',
      'Direct Preference Optimization vs RLHF and PPO',
      'DSPy teleprompter compiler self-improving pipeline',
      'Self-RAG reflection tokens and citation fidelity',
      '4-bit NormalFloat quantization QLoRA',
      'Constitutional AI harmlessness from AI feedback',
      'Llama 2 grouped-query attention and ghost attention',
      'Speculative decoding draft-and-verify sampling'
    ];

    const q = query.trim().toLowerCase();
    if (!q) return rawSuggestions.slice(0, maxSuggestions);

    const matches = rawSuggestions.filter(s => s.toLowerCase().includes(q));
    if (matches.length > 0) return matches.slice(0, maxSuggestions);

    // If no direct matches, return items containing any query token
    const tokens = tokenize(q, true);
    const softMatches = rawSuggestions.filter(s => {
      const sLower = s.toLowerCase();
      return tokens.some(t => sLower.includes(t));
    });

    return (softMatches.length > 0 ? softMatches : rawSuggestions).slice(0, maxSuggestions);
  }
}
