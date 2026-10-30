import React, { useState } from 'react';
import { Sparkles, Copy, Check, FileDown, RefreshCw, Layers, Sliders, AlertCircle, Quote } from 'lucide-react';
import { DocumentChunk, SummaryLength, SummaryResponse } from '../types/index.ts';
import { requestSummary } from '../services/api.ts';

interface SummarizerViewProps {
  selectedChunks: DocumentChunk[];
  onRemoveChunk: (chunkId: string) => void;
  onClearSelected: () => void;
  activeQuery: string;
}

export const SummarizerView: React.FC<SummarizerViewProps> = ({
  selectedChunks,
  onRemoveChunk,
  onClearSelected,
  activeQuery,
}) => {
  const [lengthPreset, setLengthPreset] = useState<SummaryLength>('concise');
  const [customWordCount, setCustomWordCount] = useState(250);
  const [focusAspect, setFocusAspect] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (selectedChunks.length === 0) {
      setError('Please select at least one document excerpt before generating a summary.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const chunksPayload = selectedChunks.map(c => ({
        docTitle: c.docTitle,
        sectionTitle: c.sectionTitle,
        content: c.content,
      }));

      const res = await requestSummary({
        query: activeQuery,
        retrievedChunks: chunksPayload,
        lengthPreset,
        customWordCount: lengthPreset === 'custom' ? customWordCount : undefined,
        focusAspect: focusAspect.trim() || undefined,
      });

      setSummaryResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate summary.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summaryResult) return;
    navigator.clipboard.writeText(summaryResult.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!summaryResult) return;
    const blob = new Blob([
      `# Multi-Document Synthesis\n\n` +
      `Query: ${activeQuery}\n` +
      `Model: ${summaryResult.modelUsed} | Word Count: ${summaryResult.wordCount} words\n\n` +
      `## Summary\n${summaryResult.summary}\n\n` +
      `## Key Points\n${summaryResult.keyPoints.map(p => `- ${p}`).join('\n')}\n\n` +
      `## Sources\n${summaryResult.citations.map(c => `- ${c}`).join('\n')}\n`
    ], { type: 'text/markdown' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              LLM Multi-Document Summarizer
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Powered by server-side Gemini 3.8 Flash for coherent synthesis, cross-document entity fusion, and grounded citations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {selectedChunks.length} passage{selectedChunks.length === 1 ? '' : 's'} staged
            </span>
            {selectedChunks.length > 0 && (
              <button
                onClick={onClearSelected}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-2 py-1"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Selected Passages Staging Pill Row */}
        {selectedChunks.length === 0 ? (
          <div className="p-4 mb-5 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center bg-slate-50/50 dark:bg-slate-800/20">
            <Layers className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              No passages selected yet
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Switch to "Search & Retrieve" and click "Select" on relevant excerpts to synthesize.
            </p>
          </div>
        ) : (
          <div className="mb-5 space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Staged Context Passages:
            </span>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
              {selectedChunks.map(chunk => (
                <div
                  key={chunk.id}
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs shadow-2xs"
                >
                  <div className="truncate max-w-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {chunk.docTitle}
                    </span>
                    <span className="text-slate-400 ml-1">({chunk.sectionTitle})</span>
                  </div>
                  <button
                    onClick={() => onRemoveChunk(chunk.id)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Length Presets */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Summary Format & Length
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setLengthPreset('bullets')}
                className={`py-1.5 px-2 text-xs font-medium rounded-md border text-center transition-colors ${
                  lengthPreset === 'bullets'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Bullet Highlights
              </button>
              <button
                onClick={() => setLengthPreset('concise')}
                className={`py-1.5 px-2 text-xs font-medium rounded-md border text-center transition-colors ${
                  lengthPreset === 'concise'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Concise (~250 words)
              </button>
              <button
                onClick={() => setLengthPreset('comprehensive')}
                className={`py-1.5 px-2 text-xs font-medium rounded-md border text-center transition-colors ${
                  lengthPreset === 'comprehensive'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Comprehensive
              </button>
              <button
                onClick={() => setLengthPreset('custom')}
                className={`py-1.5 px-2 text-xs font-medium rounded-md border text-center transition-colors ${
                  lengthPreset === 'custom'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Custom Words
              </button>
            </div>
          </div>

          {/* Custom Slider or Focus Area */}
          <div>
            {lengthPreset === 'custom' ? (
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Target Word Count:
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {customWordCount} words
                  </span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="750"
                  step="20"
                  value={customWordCount}
                  onChange={(e) => setCustomWordCount(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>60 words</span>
                  <span>400 words</span>
                  <span>750 words</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Focus Aspect (Optional)
                </label>
                <input
                  type="text"
                  value={focusAspect}
                  onChange={(e) => setFocusAspect(e.target.value)}
                  placeholder="e.g. Focus on memory bottlenecks or inference latency..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={isLoading || selectedChunks.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Coherent Summary</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Summary Output Area */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Gemini 3.8 Flash is analyzing retrieved passages and generating grounded summary...
            </span>
          </div>
          <div className="space-y-2.5">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full animate-pulse" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-4/6 animate-pulse" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full animate-pulse" />
          </div>
        </div>
      ) : summaryResult ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
          {/* Output Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Model: {summaryResult.modelUsed}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{summaryResult.wordCount} words</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{summaryResult.latencyMs} ms latency</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Multi-Document Grounded Synthesis
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export Markdown</span>
              </button>
            </div>
          </div>

          {/* Summary Text Body */}
          <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {summaryResult.summary}
          </div>

          {/* Key Insights Box */}
          {summaryResult.keyPoints.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-indigo-600" />
                <span>Key Architectural Takeaways</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {summaryResult.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sources Attribution */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Attributed Source Literature
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {summaryResult.citations.map((cite, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
                >
                  {cite}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <Sparkles className="w-8 h-8 text-indigo-500/70 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Ready to Synthesize
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Choose a summary length, customize your target word count, and click "Generate Coherent Summary" to produce a grounded LLM synthesis.
          </p>
        </div>
      )}
    </div>
  );
};
