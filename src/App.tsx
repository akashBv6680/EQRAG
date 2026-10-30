/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { SearchView } from './components/SearchView.tsx';
import { SummarizerView } from './components/SummarizerView.tsx';
import { EvaluationView } from './components/EvaluationView.tsx';
import { PreprocessorView } from './components/PreprocessorView.tsx';
import { ReportView } from './components/ReportView.tsx';
import { INITIAL_CORPUS } from './data/corpus.ts';
import { DocumentChunk, DocumentItem } from './types/index.ts';
import { SearchEngine } from './utils/searchEngine.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'summarizer' | 'evaluation' | 'preprocessor' | 'report'>('search');
  const [darkMode, setDarkMode] = useState(false);
  const [corpus, setCorpus] = useState<DocumentItem[]>(INITIAL_CORPUS);
  const [selectedChunks, setSelectedChunks] = useState<DocumentChunk[]>(() => {
    // Default to the first two chunks of the Attention paper so summarizer has immediate preview
    return INITIAL_CORPUS[0]?.chunks.slice(0, 2) || [];
  });
  const [activeQuery, setActiveQuery] = useState('How does FlashAttention optimize GPU memory and SRAM tiling?');

  // Synchronize dark mode class on document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Search engine instance
  const searchEngine = useMemo(() => {
    return new SearchEngine(corpus);
  }, [corpus]);

  const selectedChunkIds = useMemo(() => {
    return new Set(selectedChunks.map(c => c.id));
  }, [selectedChunks]);

  const handleToggleChunkSelection = (chunk: DocumentChunk) => {
    setSelectedChunks(prev => {
      const exists = prev.some(c => c.id === chunk.id);
      if (exists) {
        return prev.filter(c => c.id !== chunk.id);
      } else {
        return [...prev, chunk];
      }
    });
  };

  const handleSelectMultipleForSummary = (chunks: DocumentChunk[]) => {
    setSelectedChunks(chunks);
    setActiveTab('summarizer');
  };

  const handleRemoveChunk = (chunkId: string) => {
    setSelectedChunks(prev => prev.filter(c => c.id !== chunkId));
  };

  const handleClearSelected = () => {
    setSelectedChunks([]);
  };

  const handleAddCustomDocument = (doc: DocumentItem) => {
    setCorpus(prev => [doc, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        selectedCount={selectedChunks.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'search' && (
          <SearchView
            searchEngine={searchEngine}
            onSelectForSummary={handleSelectMultipleForSummary}
            selectedChunkIds={selectedChunkIds}
            onToggleChunkSelection={handleToggleChunkSelection}
          />
        )}

        {activeTab === 'summarizer' && (
          <SummarizerView
            selectedChunks={selectedChunks}
            onRemoveChunk={handleRemoveChunk}
            onClearSelected={handleClearSelected}
            activeQuery={activeQuery}
          />
        )}

        {activeTab === 'evaluation' && (
          <EvaluationView
            searchEngine={searchEngine}
            corpus={corpus}
          />
        )}

        {activeTab === 'preprocessor' && (
          <PreprocessorView
            corpus={corpus}
            onAddCustomDocument={handleAddCustomDocument}
          />
        )}

        {activeTab === 'report' && (
          <ReportView />
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Ever Quint Gen AI Engineering Assessment · Hybrid RAG & LLM Summarizer
          </div>
          <div className="flex items-center gap-4">
            <span>Powered by Gemini 3.8 Flash</span>
            <span aria-hidden="true">·</span>
            <span>BM25 + RRF Vector Search</span>
            <span aria-hidden="true">·</span>
            <span>Automated ROUGE Metrics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
