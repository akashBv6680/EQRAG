import React, { useState, useEffect, useMemo } from 'react';
import { Search, Sliders, CheckCircle2, Plus, Sparkles, ChevronLeft, ChevronRight, BookOpen, X } from 'lucide-react';
import { SearchResultItem, SearchMode, DocumentChunk } from '../types/index.ts';
import { SearchEngine } from '../utils/searchEngine.ts';

interface SearchViewProps {
  searchEngine: SearchEngine;
  onSelectForSummary: (chunks: DocumentChunk[]) => void;
  selectedChunkIds: Set<string>;
  onToggleChunkSelection: (chunk: DocumentChunk) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  searchEngine,
  onSelectForSummary,
  selectedChunkIds,
  onToggleChunkSelection,
}) => {
  const [query, setQuery] = useState('How does FlashAttention optimize GPU memory and SRAM tiling?');
  const [mode, setMode] = useState<SearchMode>('hybrid');
  const [alpha, setAlpha] = useState(0.5);
  const [topN, setTopN] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [previewChunk, setPreviewChunk] = useState<DocumentChunk | null>(null);

  // Execute search
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchEngine.search(query, mode, alpha, topN);
  }, [query, mode, alpha, topN, searchEngine]);

  // Update suggestions on query change
  useEffect(() => {
    if (query.trim().length > 1) {
      setSuggestions(searchEngine.getSuggestions(query, 5));
    } else {
      setSuggestions(searchEngine.getSuggestions('', 5));
    }
  }, [query, searchEngine]);

  // Reset page when query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, mode, alpha, topN]);

  // Pagination calculation
  const totalPages = Math.ceil(searchResults.length / pageSize) || 1;
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchResults.slice(start, start + pageSize);
  }, [searchResults, currentPage, pageSize]);

  const quickQueries = [
    'How does FlashAttention optimize GPU memory and SRAM tiling?',
    'What is the difference between RAG-Sequence and RAG-Token models?',
    'How does LoRA freeze base weights and avoid inference latency?',
    'Direct Preference Optimization vs RLHF and PPO loss',
    'Scaled dot-product attention formula and multi-head projections'
  ];

  // Highlight matched terms in text
  const highlightMatches = (text: string, matchedTerms: string[]) => {
    if (!matchedTerms.length) return text;
    const regex = new RegExp(`\\b(${matchedTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => {
      const isMatch = matchedTerms.some(t => t.toLowerCase() === part.toLowerCase());
      return isMatch ? (
        <mark key={i} className="bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 px-0.5 rounded font-medium">
          {part}
        </mark>
      ) : (
        part
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Hybrid Document Search
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Traditional BM25 keyword matching fused with dense vector semantic embeddings via Reciprocal Rank Fusion.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const chunksToSelect = searchResults.map(r => r.chunk);
                onSelectForSummary(chunksToSelect);
              }}
              disabled={searchResults.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Send Top {searchResults.length} to Summarizer</span>
            </button>
          </div>
        </div>

        {/* Query Input with Auto-Suggest */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search across AI research papers (e.g. attention, RAG, LoRA, FlashAttention)..."
              className="w-full pl-11 pr-10 py-3 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Auto-suggest dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-30 overflow-hidden">
              <div className="px-3 py-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                Suggested Queries & Topics
              </div>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(s);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800/90 transition-colors flex items-center justify-between"
                >
                  <span>{s}</span>
                  <span className="text-slate-400 text-xs">Search</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick query chips */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Benchmarks:</span>
          {quickQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(q);
                setShowSuggestions(false);
              }}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline px-1 py-0.5 transition-colors text-left"
            >
              {q.length > 38 ? q.slice(0, 38) + '...' : q}
            </button>
          ))}
        </div>
      </div>

      {/* Search Configuration & Tuning Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Information Retrieval Method
            </label>
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => setMode('hybrid')}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'hybrid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Hybrid (RRF)
              </button>
              <button
                onClick={() => setMode('bm25')}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'bm25'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pure BM25
              </button>
              <button
                onClick={() => setMode('dense')}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'dense'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Dense Vector
              </button>
            </div>
          </div>

          {/* Interactive Alpha Slider */}
          <div className={mode !== 'hybrid' ? 'opacity-40 pointer-events-none' : ''}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Hybrid Balance (Alpha): {alpha.toFixed(2)}
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                {Math.round(alpha * 100)}% BM25 / {Math.round((1 - alpha) * 100)}% Vector
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>0.0 (Pure Semantic)</span>
              <span>0.5 (Balanced RRF)</span>
              <span>1.0 (Pure Lexical)</span>
            </div>
          </div>

          {/* Top-N & Results Info */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Top N Documents: {topN}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-xs">
                {searchResults.length} excerpts retrieved
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[3, 5, 6, 8, 12].map((num) => (
                <button
                  key={num}
                  onClick={() => setTopN(num)}
                  className={`flex-1 py-1 text-xs font-mono rounded border transition-colors ${
                    topN === num
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <div>
          Showing {paginatedResults.length} of {searchResults.length} ranked excerpts
        </div>
        <div>
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Results List */}
      {paginatedResults.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            No matching documents found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, selecting a different retrieval method, or tuning the BM25/Vector alpha balance.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {paginatedResults.map((item, index) => {
            const globalIndex = (currentPage - 1) * pageSize + index + 1;
            const isSelected = selectedChunkIds.has(item.chunk.id);

            return (
              <div
                key={item.chunk.id}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-5 transition-all ${
                  isSelected
                    ? 'border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                        #{globalIndex}
                      </span>
                      <span>{item.doc.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>Published {item.doc.year}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.chunk.tokenCount} tokens</span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {item.doc.title}
                    </h3>

                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Section: <span className="font-medium text-slate-800 dark:text-slate-200">{item.chunk.sectionTitle}</span>
                    </div>
                  </div>

                  {/* Score & Selection controls */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                        {mode === 'hybrid' ? `RRF: ${item.rrfScore.toFixed(4)}` : `Score: ${item.finalScore.toFixed(3)}`}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        BM25: {item.bm25Score.toFixed(1)} · Vector: {item.vectorScore.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewChunk(item.chunk)}
                        className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Preview
                      </button>

                      <button
                        onClick={() => onToggleChunkSelection(item.chunk)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Select</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Excerpt Body with highlights */}
                <div className="mt-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300 line-clamp-3 bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  {highlightMatches(item.snippet, item.matchedTerms)}
                </div>

                {/* Footer metadata */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <div className="truncate max-w-md">
                    Authors: {item.doc.authors.slice(0, 3).join(', ')}{item.doc.authors.length > 3 ? ' et al.' : ''}
                  </div>
                  {item.matchedTerms.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span>Matches:</span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        {item.matchedTerms.slice(0, 4).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 shadow-xs">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 text-xs font-mono rounded-md transition-colors ${
                  currentPage === i + 1
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Chunk Detail Preview Modal */}
      {previewChunk && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {previewChunk.docTitle}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Section: {previewChunk.sectionTitle}
                </h3>
              </div>
              <button
                onClick={() => setPreviewChunk(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Full Passage Content
                </h4>
                <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                  {previewChunk.content}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Passage Token Count: {previewChunk.tokenCount}</span>
                <button
                  onClick={() => {
                    onToggleChunkSelection(previewChunk);
                    setPreviewChunk(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  {selectedChunkIds.has(previewChunk.id) ? 'Remove Selection' : 'Add to Summarizer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
