import { tokenize } from './preprocessor.ts';

export interface BM25IndexEntry {
  id: string;
  tokens: string[];
  tokenCounts: Map<string, number>;
  length: number;
}

export class BM25Engine {
  private k1: number;
  private b: number;
  private documents: Map<string, BM25IndexEntry> = new Map();
  private docFrequencies: Map<string, number> = new Map();
  private avgDocLength = 0;
  private totalDocs = 0;

  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
  }

  /**
   * Builds the inverted index from chunks/documents.
   */
  public indexDocuments(docs: { id: string; content: string }[]) {
    this.documents.clear();
    this.docFrequencies.clear();

    let totalLength = 0;
    this.totalDocs = docs.length;

    for (const doc of docs) {
      const tokens = tokenize(doc.content, true);
      const tokenCounts = new Map<string, number>();

      for (const token of tokens) {
        tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
      }

      // Update document frequency
      for (const token of tokenCounts.keys()) {
        this.docFrequencies.set(token, (this.docFrequencies.get(token) || 0) + 1);
      }

      const length = tokens.length;
      totalLength += length;

      this.documents.set(doc.id, {
        id: doc.id,
        tokens,
        tokenCounts,
        length
      });
    }

    this.avgDocLength = this.totalDocs > 0 ? totalLength / this.totalDocs : 0;
  }

  /**
   * Calculates Inverse Document Frequency (IDF) with standard Robertson-Spärck Jones smoothing.
   */
  private getIdf(term: string): number {
    const df = this.docFrequencies.get(term) || 0;
    const numerator = this.totalDocs - df + 0.5;
    const denominator = df + 0.5;
    return Math.max(0.01, Math.log((numerator / denominator) + 1));
  }

  /**
   * Scores all indexed documents against a search query.
   * Returns a map of docId -> { score, matchedTerms }.
   */
  public search(query: string): Map<string, { score: number; matchedTerms: string[] }> {
    const queryTokens = tokenize(query, true);
    const results = new Map<string, { score: number; matchedTerms: string[] }>();

    if (queryTokens.length === 0 || this.totalDocs === 0) {
      return results;
    }

    for (const [id, doc] of this.documents.entries()) {
      let score = 0;
      const matchedTerms: string[] = [];

      for (const term of queryTokens) {
        const tf = doc.tokenCounts.get(term) || 0;
        if (tf > 0) {
          matchedTerms.push(term);
          const idf = this.getIdf(term);
          const lengthNorm = 1 - this.b + this.b * (doc.length / (this.avgDocLength || 1));
          const tfComponent = (tf * (this.k1 + 1)) / (tf + this.k1 * lengthNorm);
          score += idf * tfComponent;
        }
      }

      if (score > 0) {
        results.set(id, { score, matchedTerms });
      }
    }

    return results;
  }
}
