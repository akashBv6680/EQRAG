import React, { useState } from 'react';
import { Cpu, CheckCircle2, ArrowRight, Plus, Upload, BookOpen, Layers } from 'lucide-react';
import { DocumentItem } from '../types/index.ts';
import { inspectPreprocessing, chunkDocument, cleanText, tokenize } from '../utils/preprocessor.ts';
import { computeSemanticVector } from '../utils/vectorSearch.ts';

interface PreprocessorViewProps {
  corpus: DocumentItem[];
  onAddCustomDocument: (doc: DocumentItem) => void;
}

export const PreprocessorView: React.FC<PreprocessorViewProps> = ({
  corpus,
  onAddCustomDocument,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(corpus[0]?.id || '');
  const [customText, setCustomText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'inspector' | 'ingest'>('inspector');

  // Custom document form states
  const [newTitle, setNewTitle] = useState('');
  const [newAuthors, setNewAuthors] = useState('');
  const [newCategory, setNewCategory] = useState('AI Research');
  const [newContent, setNewContent] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedDoc = corpus.find(d => d.id === selectedDocId) || corpus[0];

  const inspectionTargetText = customText.trim()
    ? customText
    : selectedDoc ? `${selectedDoc.abstract}\n\n${selectedDoc.sections[0]?.content || ''}` : '';

  const metrics = inspectPreprocessing(inspectionTargetText);

  const handleIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const rawChunks = chunkDocument(newContent, 140, 30);
    const docId = `custom-${Date.now()}`;
    const chunks = rawChunks.map((c, idx) => ({
      id: `${docId}-c${idx}`,
      docId,
      docTitle: newTitle,
      sectionTitle: 'Custom Section',
      content: c.content,
      cleanedContent: cleanText(c.content),
      tokenCount: c.tokenCount,
      embedding: computeSemanticVector(c.content)
    }));

    const newDoc: DocumentItem = {
      id: docId,
      title: newTitle,
      authors: newAuthors.split(',').map(a => a.trim()).filter(Boolean),
      year: new Date().getFullYear(),
      category: newCategory,
      abstract: newContent.slice(0, 300) + '...',
      sections: [{ title: 'Main Body', content: newContent }],
      chunks,
      totalTokens: chunks.reduce((acc, c) => acc + c.tokenCount, 0),
      referenceSummary: newContent.slice(0, 200) + '...'
    };

    onAddCustomDocument(newDoc);
    setSuccessMessage(`Successfully ingested "${newTitle}" with ${chunks.length} indexed chunks.`);
    setNewTitle('');
    setNewAuthors('');
    setNewContent('');

    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Pre-processing Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Data Pre-processing & Ingestion Engine
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Task 1 Pipeline: Citation stripping, regex normalization, stop-word elimination, sentence-aware sliding window chunking.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('inspector')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'inspector'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Pipeline Inspector
            </button>
            <button
              onClick={() => setActiveTab('ingest')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'ingest'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Ingest Custom Document
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'inspector' ? (
        <>
          {/* Pipeline Stages Diagram */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Standard Data Preparation Architecture
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg">
                <div className="font-bold text-slate-900 dark:text-white mb-1">
                  1. Citation & Symbol Stripping
                </div>
                <div className="text-slate-500 text-[11px] leading-relaxed">
                  Removes bracketed citations (e.g. [1, 2], et al. 2021) and non-standard unicode artifacts to prevent noisy keyword collisions.
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg">
                <div className="font-bold text-slate-900 dark:text-white mb-1">
                  2. Alphanumeric Tokenization
                </div>
                <div className="text-slate-500 text-[11px] leading-relaxed">
                  Extracts words and technical hyphenated terms (e.g. "GPT-4", "k1=1.5") while normalizing to lowercase.
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg">
                <div className="font-bold text-slate-900 dark:text-white mb-1">
                  3. Stop-Word Pruning
                </div>
                <div className="text-slate-500 text-[11px] leading-relaxed">
                  Filters high-frequency non-informative English tokens to boost BM25 term discriminability and compact the index.
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg">
                <div className="font-bold text-slate-900 dark:text-white mb-1">
                  4. Sentence-Aware Chunking
                </div>
                <div className="text-slate-500 text-[11px] leading-relaxed">
                  Splits into 140-word segments with 30-word overlap along sentence boundaries to preserve local semantic context.
                </div>
              </div>
            </div>
          </div>

          {/* Source Selection & Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Document Selector & Custom Text Input */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Inspect Source Document
              </h2>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Pre-loaded Paper:
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => {
                    setSelectedDocId(e.target.value);
                    setCustomText('');
                  }}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  {corpus.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.chunks.length} chunks)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Or Paste Custom Text to Test:
                </label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Paste arbitrary research abstract or paper section here to see real-time pre-processing metrics..."
                  rows={5}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              {customText && (
                <button
                  onClick={() => setCustomText('')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Reset to selected paper
                </button>
              )}
            </div>

            {/* Preprocessing Statistics */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Pipeline Compression & Token Metrics
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <div className="text-[11px] text-slate-500">Raw Words</div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {metrics.rawWords}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <div className="text-[11px] text-slate-500">Cleaned Tokens</div>
                  <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {metrics.totalTokens}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <div className="text-[11px] text-slate-500">Noise Reduction</div>
                  <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
                    {metrics.reductionRatioPct}%
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <div className="text-[11px] text-slate-500">Chunks Created</div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {metrics.chunkCount}
                  </div>
                </div>
              </div>

              {/* Keyword distribution */}
              <div>
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Top Indexed Technical Keywords
                </h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {metrics.topKeywords.map((k, i) => (
                    <div
                      key={i}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                    >
                      <span className="font-medium">{k.term}</span>
                      <span className="text-slate-400 ml-1 font-mono">({k.count})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Chunks */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Chunk Boundary Previews (Showing {metrics.chunksSample.length} of {metrics.chunkCount})
                </h3>
                <div className="space-y-2">
                  {metrics.chunksSample.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg text-xs leading-relaxed"
                    >
                      <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                        <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                          Chunk #{idx + 1}
                        </span>
                        <span>{c.tokenCount} words</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Ingest Custom Document Form */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs max-w-3xl mx-auto">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Ingest Custom Document into Corpus
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Add your own technical paper, article, or documentation to expand the searchable corpus. It will be cleaned, chunked, and embedded instantly.
          </p>

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleIngest} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Document Title *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Authors (comma-separated)
                </label>
                <input
                  type="text"
                  value={newAuthors}
                  onChange={(e) => setNewAuthors(e.target.value)}
                  placeholder="e.g. DeepSeek-AI, A. Researcher"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Model Architecture">Model Architecture</option>
                  <option value="Information Retrieval & RAG">Information Retrieval & RAG</option>
                  <option value="Parameter-Efficient Fine-Tuning">Parameter-Efficient Fine-Tuning</option>
                  <option value="Prompt Engineering & Reasoning">Prompt Engineering & Reasoning</option>
                  <option value="Model Alignment & RLHF">Model Alignment & RLHF</option>
                  <option value="Hardware & Acceleration">Hardware & Acceleration</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Document Text Content *
              </label>
              <textarea
                required
                rows={8}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Paste the full paper text or sections here..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Clean, Chunk, and Index into Corpus</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
