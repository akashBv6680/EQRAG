export const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can',
  'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have',
  'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into',
  'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d',
  'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where',
  'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would',
  'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  'also', 'e.g.', 'ie', 'et', 'al', 'via', 'using', 'based', 'shown', 'table', 'figure', 'paper', 'show', 'use'
]);

/**
 * Cleans raw technical text by removing citation brackets, extra symbols, and normalizing whitespace.
 */
export function cleanText(text: string, options: { removeCitations?: boolean; lowercase?: boolean } = {}): string {
  if (!text) return '';
  let cleaned = text;

  // Remove citation markers like [1], [1, 2], [1-3], (Vaswani et al., 2017)
  if (options.removeCitations !== false) {
    cleaned = cleaned.replace(/\[\d+(?:[-,]\s*\d+)*\]/g, ' ');
    cleaned = cleaned.replace(/\([A-Z][a-zA-Z]+(?:\s+et\s+al\.)?,\s*\d{4}\)/g, ' ');
  }

  // Remove non-standard unicode artifacts while preserving math/hyphens
  cleaned = cleaned.replace(/[^\x20-\x7E\t\n\r]/g, ' ');

  // Normalize excessive whitespace
  cleaned = cleaned.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();

  if (options.lowercase) {
    cleaned = cleaned.toLowerCase();
  }

  return cleaned;
}

/**
 * Tokenizes text into lowercase words while removing punctuation.
 */
export function tokenize(text: string, removeStopwords = true): string[] {
  if (!text) return [];
  const normalized = text.toLowerCase();
  // Extract alphanumeric sequences with optional internal hyphens or periods (for technical terms like "GPT-4" or "k1=1.5")
  const matches = normalized.match(/[a-z0-9]+(?:[-_][a-z0-9]+)*/g) || [];

  if (removeStopwords) {
    return matches.filter(w => w.length > 1 && !STOP_WORDS.has(w));
  }
  return matches;
}

/**
 * Extracts N-grams from a list of tokens.
 */
export function extractNGrams(tokens: string[], n: number): string[] {
  if (tokens.length < n) return [];
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Splits document content into chunks using sentence-aware sliding window.
 */
export function chunkDocument(
  text: string,
  chunkSizeWords = 160,
  overlapWords = 35
): { content: string; tokenCount: number }[] {
  const cleaned = cleanText(text);
  if (!cleaned) return [];

  // Split into sentences
  const sentenceRegex = /[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g;
  const sentences = cleaned.match(sentenceRegex) || [cleaned];

  const chunks: { content: string; tokenCount: number }[] = [];
  let currentWords: string[] = [];
  let currentText = '';

  for (const sentence of sentences) {
    const sentenceWords = sentence.trim().split(/\s+/).filter(Boolean);
    if (!sentenceWords.length) continue;

    if (currentWords.length + sentenceWords.length > chunkSizeWords && currentWords.length > 0) {
      chunks.push({
        content: currentText.trim(),
        tokenCount: currentWords.length
      });

      // Retain overlap words from the end of the previous chunk
      const overlapStart = Math.max(0, currentWords.length - overlapWords);
      currentWords = currentWords.slice(overlapStart);
      currentText = currentWords.join(' ') + ' ' + sentence;
      currentWords.push(...sentenceWords);
    } else {
      currentWords.push(...sentenceWords);
      currentText += (currentText ? ' ' : '') + sentence.trim();
    }
  }

  if (currentWords.length > 0) {
    chunks.push({
      content: currentText.trim(),
      tokenCount: currentWords.length
    });
  }

  return chunks;
}

/**
 * Analyzes text and returns pre-processing metrics for inspection.
 */
export function inspectPreprocessing(rawText: string) {
  const rawWords = rawText.trim().split(/\s+/).filter(Boolean).length;
  const rawChars = rawText.length;
  const cleaned = cleanText(rawText);
  const cleanedWords = cleaned.trim().split(/\s+/).filter(Boolean).length;
  const cleanedChars = cleaned.length;
  const tokens = tokenize(cleaned, true);
  const uniqueTokens = new Set(tokens);
  const chunks = chunkDocument(cleaned, 150, 30);

  // Term frequency top 8
  const freq: Record<string, number> = {};
  tokens.forEach(t => {
    freq[t] = (freq[t] || 0) + 1;
  });
  const topKeywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([term, count]) => ({ term, count }));

  return {
    rawWords,
    rawChars,
    cleanedWords,
    cleanedChars,
    reductionRatioPct: rawWords > 0 ? Math.round(((rawWords - tokens.length) / rawWords) * 100) : 0,
    totalTokens: tokens.length,
    uniqueTokens: uniqueTokens.size,
    topKeywords,
    chunkCount: chunks.length,
    chunksSample: chunks.slice(0, 3)
  };
}
