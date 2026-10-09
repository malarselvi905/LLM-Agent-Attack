import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Play,
  Layers,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowRight,
  Shield,
  Sparkles,
  Info
} from 'lucide-react';
import { api, TestCase } from '../api/client';

interface NewAssessmentPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export function NewAssessmentPage({ onNavigate }: NewAssessmentPageProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetMode, setTargetMode] = useState<'mock-vulnerable' | 'mock-hardened' | 'gemini'>('mock-vulnerable');
  const [allTestCases, setAllTestCases] = useState<TestCase[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTests, setLoadingTests] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCases() {
      try {
        setLoadingTests(true);
        const res = await api.getTestCases();
        setAllTestCases(res.test_cases);
        // Default select all active test cases
        setSelectedCaseIds(res.test_cases.map((t) => t.id));
      } catch (err: any) {
        console.error('Failed to load test cases:', err);
      } finally {
        setLoadingTests(false);
      }
    }
    fetchCases();
  }, []);

  const toggleTestCase = (id: string) => {
    if (selectedCaseIds.includes(id)) {
      setSelectedCaseIds(selectedCaseIds.filter((item) => item !== id));
    } else {
      setSelectedCaseIds([...selectedCaseIds, id]);
    }
  };

  const selectAll = () => setSelectedCaseIds(allTestCases.map((t) => t.id));
  const deselectAll = () => setSelectedCaseIds([]);

  const handleSubmit = async (runNow: boolean) => {
    if (!title.trim()) {
      setError('Assessment title is required.');
      return;
    }
    if (selectedCaseIds.length === 0) {
      setError('Please select at least one test case to evaluate.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create assessment
      const res = await api.createAssessment({
        title,
        description,
        target_mode: targetMode,
        test_case_ids: selectedCaseIds,
      });

      const assessmentId = res.assessment.id;

      if (runNow) {
        // Execute immediately
        await api.runAssessment(assessmentId, selectedCaseIds);
      }

      onNavigate('assessments', assessmentId);
    } catch (err: any) {
      setError(err.message || 'Failed to create assessment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-purple-900/20">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-1">
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Security Assessment</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Configure LLM Security Audit</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Select target architecture, tune target security parameters, and select benchmark test cases.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="p-6 rounded-xl bg-[#0e1628]/80 border border-slate-800/80 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-200 font-mono mb-1.5">
            ASSESSMENT TITLE *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q4 Baseline Guardrail Audit - Customer Agent"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-200 font-mono mb-1.5">
            DESCRIPTION & OBJECTIVES
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Document scope, system version, and targeted guardrails..."
            className="w-full px-3.5 py-2 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Target Agent Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 font-mono mb-2">
            TARGET AGENT ARCHITECTURE
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTargetMode('mock-vulnerable')}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                targetMode === 'mock-vulnerable'
                  ? 'bg-rose-950/40 border-rose-500/50 shadow-xs shadow-rose-900/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-rose-300">Mock Vulnerable</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <p className="text-[11px] text-slate-400">
                Simulates unhardened LLM agent lacking boundary guardrails.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTargetMode('mock-hardened')}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                targetMode === 'mock-hardened'
                  ? 'bg-emerald-950/40 border-emerald-500/50 shadow-xs shadow-emerald-900/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-300">Mock Hardened</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-400">
                Simulates defense-in-depth with system guardrails and refusal protocols.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTargetMode('gemini')}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                targetMode === 'gemini'
                  ? 'bg-purple-950/40 border-purple-500/50 shadow-xs shadow-purple-900/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Gemini Live
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Live Google GenAI model evaluation via server proxy.
              </p>
            </button>
          </div>
        </div>

        {/* Test Case Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-200 font-mono">
              SELECT BENCHMARK TEST CASES ({selectedCaseIds.length} of {allTestCases.length} selected)
            </label>
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={selectAll}
                className="text-cyan-400 hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-600">&bull;</span>
              <button
                type="button"
                onClick={deselectAll}
                className="text-slate-400 hover:underline"
              >
                Clear All
              </button>
            </div>
          </div>

          {loadingTests ? (
            <div className="py-6 text-center text-xs text-slate-400 font-mono">
              Loading test library...
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto custom-scrollbar border border-slate-800 rounded-lg divide-y divide-slate-800/60">
              {allTestCases.map((tc) => {
                const isSelected = selectedCaseIds.includes(tc.id);
                return (
                  <div
                    key={tc.id}
                    onClick={() => toggleTestCase(tc.id)}
                    className="p-3 bg-slate-900/40 hover:bg-slate-900/80 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-purple-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{tc.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {tc.category} &bull; Difficulty: {tc.difficulty}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40 shrink-0">
                      {tc.category}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onNavigate('assessments')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(false)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            Save as Draft
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Running Benchmark...</span>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Create & Execute Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
