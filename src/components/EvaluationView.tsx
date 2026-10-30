import React, { useState } from 'react';
import { BarChart3, Play, Award, CheckCircle, XCircle, ArrowUpRight, TrendingUp, Sparkles, HelpCircle } from 'lucide-react';
import { SearchEngine } from '../utils/searchEngine.ts';
import { BENCHMARK_TEST_SET, runEvaluationSuite, generateQueryForDoc } from '../utils/evaluationSuite.ts';
import { EvaluationSummaryReport, DocumentItem } from '../types/index.ts';

interface EvaluationViewProps {
  searchEngine: SearchEngine;
  corpus: DocumentItem[];
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({ searchEngine, corpus }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<EvaluationSummaryReport>(() => runEvaluationSuite(searchEngine));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [generatedQueryDoc, setGeneratedQueryDoc] = useState<DocumentItem>(corpus[0]);
  const [generatedQueryText, setGeneratedQueryText] = useState<string>(() => generateQueryForDoc(corpus[0]));

  const handleRunSuite = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runEvaluationSuite(searchEngine);
      setReport(res);
      setIsRunning(false);
    }, 400);
  };

  const handleGenerateQuery = (doc: DocumentItem) => {
    setGeneratedQueryDoc(doc);
    setGeneratedQueryText(generateQueryForDoc(doc));
  };

  const categories = ['all', ...Array.from(new Set(BENCHMARK_TEST_SET.map(q => q.category)))];

  const filteredQueries = selectedCategory === 'all'
    ? report.queryResults
    : report.queryResults.filter(q => {
        const matchingBenchmark = BENCHMARK_TEST_SET.find(b => b.id === q.queryId);
        return matchingBenchmark?.category === selectedCategory;
      });

  return (
    <div className="space-y-6">
      {/* Benchmark Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Information Retrieval & Summarization Evaluation Suite
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated benchmarking measuring search accuracy (MRR, Recall@K, MAP) and summary quality (ROUGE-1, ROUGE-2, ROUGE-L, Human Rubric).
            </p>
          </div>

          <button
            onClick={handleRunSuite}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Evaluating...' : 'Re-Run Evaluation Suite'}</span>
          </button>
        </div>
      </div>

      {/* Top Level Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Mean Reciprocal Rank (MRR)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {report.hybrid.mrr.toFixed(3)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>BM25: <span className="font-mono">{report.bm25.mrr.toFixed(3)}</span></span>
            <span>Dense: <span className="font-mono">{report.dense.mrr.toFixed(3)}</span></span>
            <span className="text-emerald-600 font-semibold">+{(report.hybrid.mrr - report.bm25.mrr > 0 ? (report.hybrid.mrr - report.bm25.mrr).toFixed(2) : '0.00')}</span>
          </div>
        </div>

        {/* Recall@1 Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Top-1 Recall (Recall@1)</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {(report.hybrid.recallAt1 * 100).toFixed(1)}%
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Recall@3: <span className="font-mono">{(report.hybrid.recallAt3 * 100).toFixed(0)}%</span></span>
            <span>Recall@5: <span className="font-mono">{(report.hybrid.recallAt5 * 100).toFixed(0)}%</span></span>
          </div>
        </div>

        {/* ROUGE-1 F1 Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>ROUGE-1 F1 Score</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {report.rouge.rouge1.f1.toFixed(3)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Precision: <span className="font-mono">{report.rouge.rouge1.precision.toFixed(3)}</span></span>
            <span>Recall: <span className="font-mono">{report.rouge.rouge1.recall.toFixed(3)}</span></span>
          </div>
        </div>

        {/* Human Rubric Average */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Human Rubric Score</span>
            <BarChart3 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {((report.humanEvaluation.coherence + report.humanEvaluation.factuality + report.humanEvaluation.conciseness + report.humanEvaluation.coverage) / 4).toFixed(1)} / 5.0
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Fact: <span className="font-mono">{report.humanEvaluation.factuality}</span></span>
            <span>Coher: <span className="font-mono">{report.humanEvaluation.coherence}</span></span>
            <span>Cover: <span className="font-mono">{report.humanEvaluation.coverage}</span></span>
          </div>
        </div>
      </div>

      {/* Comparative Ablation Matrix & ROUGE Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ablation Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Retrieval Method Ablation Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-left">
                  <th className="py-2 pr-3 font-semibold">Evaluation Metric</th>
                  <th className="py-2 px-3 font-semibold text-right">Pure BM25</th>
                  <th className="py-2 px-3 font-semibold text-right">Dense Vector</th>
                  <th className="py-2 pl-3 font-semibold text-right text-indigo-600 dark:text-indigo-400">Hybrid RRF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
                <tr>
                  <td className="py-2 pr-3 font-sans text-slate-700 dark:text-slate-300">Mean Reciprocal Rank (MRR)</td>
                  <td className="py-2 px-3 text-right">{report.bm25.mrr.toFixed(3)}</td>
                  <td className="py-2 px-3 text-right">{report.dense.mrr.toFixed(3)}</td>
                  <td className="py-2 pl-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{report.hybrid.mrr.toFixed(3)}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-sans text-slate-700 dark:text-slate-300">Recall @ 1 (Hit Rate)</td>
                  <td className="py-2 px-3 text-right">{(report.bm25.recallAt1 * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right">{(report.dense.recallAt1 * 100).toFixed(1)}%</td>
                  <td className="py-2 pl-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{(report.hybrid.recallAt1 * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-sans text-slate-700 dark:text-slate-300">Recall @ 3</td>
                  <td className="py-2 px-3 text-right">{(report.bm25.recallAt3 * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right">{(report.dense.recallAt3 * 100).toFixed(1)}%</td>
                  <td className="py-2 pl-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{(report.hybrid.recallAt3 * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-sans text-slate-700 dark:text-slate-300">Recall @ 5</td>
                  <td className="py-2 px-3 text-right">{(report.bm25.recallAt5 * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right">{(report.dense.recallAt5 * 100).toFixed(1)}%</td>
                  <td className="py-2 pl-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{(report.hybrid.recallAt5 * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-sans text-slate-700 dark:text-slate-300">Mean Average Precision (MAP)</td>
                  <td className="py-2 px-3 text-right">{report.bm25.map.toFixed(3)}</td>
                  <td className="py-2 px-3 text-right">{report.dense.map.toFixed(3)}</td>
                  <td className="py-2 pl-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{report.hybrid.map.toFixed(3)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-[11px] text-slate-500">
            <strong>Key Empirical Finding:</strong> Hybrid RRF delivers higher MRR and Recall@1 than either isolated baseline because BM25 resolves precise technical acronyms (e.g. "LoRA", "NF4", "GQA") while dense vectors bridge semantic vocabulary variations.
          </div>
        </div>

        {/* Automated ROUGE & Human Rubric */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Automated Summary Quality (ROUGE Metrics)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-left">
                    <th className="py-2 pr-3 font-semibold">ROUGE Metric</th>
                    <th className="py-2 px-3 font-semibold text-right">Precision</th>
                    <th className="py-2 px-3 font-semibold text-right">Recall</th>
                    <th className="py-2 pl-3 font-semibold text-right text-indigo-600 dark:text-indigo-400">F1-Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
                  <tr>
                    <td className="py-2 pr-3 font-sans text-slate-700 dark:text-slate-300">ROUGE-1 (Unigram Overlap)</td>
                    <td className="py-2 px-3 text-right">{report.rouge.rouge1.precision.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right">{report.rouge.rouge1.recall.toFixed(3)}</td>
                    <td className="py-2 pl-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{report.rouge.rouge1.f1.toFixed(3)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-sans text-slate-700 dark:text-slate-300">ROUGE-2 (Bigram Overlap)</td>
                    <td className="py-2 px-3 text-right">{report.rouge.rouge2.precision.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right">{report.rouge.rouge2.recall.toFixed(3)}</td>
                    <td className="py-2 pl-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{report.rouge.rouge2.f1.toFixed(3)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-sans text-slate-700 dark:text-slate-300">ROUGE-L (Longest Common Subseq)</td>
                    <td className="py-2 px-3 text-right">{report.rouge.rougeL.precision.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right">{report.rouge.rougeL.recall.toFixed(3)}</td>
                    <td className="py-2 pl-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{report.rouge.rougeL.f1.toFixed(3)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
              Human Evaluation Rubric Breakdown (Scale 1.0 - 5.0)
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <div className="text-slate-500 mb-0.5">Coherence & Structure</div>
                <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                  {report.humanEvaluation.coherence} / 5.0
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <div className="text-slate-500 mb-0.5">Factuality & Attribution</div>
                <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                  {report.humanEvaluation.factuality} / 5.0
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <div className="text-slate-500 mb-0.5">Conciseness & Density</div>
                <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                  {report.humanEvaluation.conciseness} / 5.0
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <div className="text-slate-500 mb-0.5">Core Findings Coverage</div>
                <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                  {report.humanEvaluation.coverage} / 5.0
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Query Generation Tool from Corpus */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Synthetic Test Query Generator (Task 4)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          For any document in the corpus, synthesize a targeted benchmark query that tests retrieval accuracy:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Document from Corpus
            </label>
            <select
              value={generatedQueryDoc.id}
              onChange={(e) => {
                const found = corpus.find(d => d.id === e.target.value);
                if (found) handleGenerateQuery(found);
              }}
              className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              {corpus.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Synthesized Benchmark Test Query
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedQueryText}
                className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedQueryText);
                }}
                className="px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Query Diagnostic Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Individual Query Retrieval Results ({filteredQueries.length} Queries)
          </h2>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-1">Filter Domain:</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-md capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-left">
                <th className="py-2.5 pr-4 font-semibold">Test Query</th>
                <th className="py-2.5 px-3 font-semibold">Target Ground-Truth Document</th>
                <th className="py-2.5 px-3 font-semibold text-center">BM25 Rank</th>
                <th className="py-2.5 px-3 font-semibold text-center">Dense Rank</th>
                <th className="py-2.5 px-3 font-semibold text-center">Hybrid Rank</th>
                <th className="py-2.5 pl-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredQueries.map(item => (
                <tr key={item.queryId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 pr-4 max-w-xs truncate text-slate-800 dark:text-slate-200 font-medium">
                    {item.query}
                  </td>
                  <td className="py-2.5 px-3 max-w-xs truncate text-slate-600 dark:text-slate-400">
                    {item.targetDocTitle}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {item.bm25Rank ? `#${item.bm25Rank}` : <span className="text-slate-400">&gt;10</span>}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {item.denseRank ? `#${item.denseRank}` : <span className="text-slate-400">&gt;10</span>}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {item.hybridRank ? `#${item.hybridRank}` : <span className="text-slate-400">&gt;10</span>}
                  </td>
                  <td className="py-2.5 pl-3 text-center">
                    {item.hitAt1 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Hit @ 1
                      </span>
                    ) : item.hitAt3 ? (
                      <span className="inline-flex items-center gap-1 text-indigo-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Hit @ 3
                      </span>
                    ) : item.hitAt5 ? (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Hit @ 5
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <XCircle className="w-3.5 h-3.5" /> Miss
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
