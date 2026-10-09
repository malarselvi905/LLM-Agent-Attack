import React, { useState, useEffect } from 'react';
import {
  Library,
  Search,
  Filter,
  PlusCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BookOpen,
  X,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { api, TestCase } from '../api/client';

export function TestCasesPage() {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New test case modal state
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Prompt Injection');
  const [newObjective, setNewObjective] = useState('');
  const [newInput, setNewInput] = useState('');
  const [newExpected, setNewExpected] = useState('');
  const [newCriteria, setNewCriteria] = useState('');
  const [newRemediation, setNewRemediation] = useState('');
  const [newDifficulty, setNewDifficulty] = useState('Medium');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const categories = [
    'All',
    'Prompt Injection',
    'Jailbreak Resistance',
    'Sensitive Data Leakage',
    'Insecure Tool Usage',
    'System Prompt Disclosure',
    'Excessive Agency',
    'Output Validation',
    'Indirect Prompt Injection',
  ];

  const difficulties = ['All', 'Easy', 'Medium', 'Hard', 'Advanced'];

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.getTestCases({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : undefined,
        search: search.trim() || undefined,
      });
      setTestCases(res.test_cases);
    } catch (err: any) {
      console.error('Failed to load test cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [selectedCategory, selectedDifficulty, search]);

  const copyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newInput.trim() || !newExpected.trim()) {
      setModalError('Title, input payload, and expected behavior are required.');
      return;
    }
    try {
      setModalSaving(true);
      setModalError(null);
      await api.createTestCase({
        title: newTitle,
        category: newCategory,
        learning_objective: newObjective,
        input_template: newInput,
        expected_behavior: newExpected,
        detection_criteria: newCriteria,
        remediation_guidance: newRemediation,
        difficulty: newDifficulty,
      });
      setShowModal(false);
      // Reset modal inputs
      setNewTitle('');
      setNewObjective('');
      setNewInput('');
      setNewExpected('');
      setNewCriteria('');
      setNewRemediation('');
      await fetchCases();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save test case.');
    } finally {
      setModalSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-purple-900/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-1">
            <Library className="w-3.5 h-3.5" />
            <span>Vulnerability Test Library</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Security Test Case Library</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Predefined educational attack payloads & benchmarks grounded in the OWASP LLM Top 10.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Custom Test Case</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search test cases by title, learning objective, or input payload..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0e1628]/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0e1628]/80 border border-slate-800 text-xs text-slate-300 focus:outline-hidden focus:border-purple-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Difficulty Dropdown */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0e1628]/80 border border-slate-800 text-xs text-slate-300 focus:outline-hidden focus:border-purple-500"
          >
            {difficulties.map((d) => (
              <option key={d} value={d}>
                Difficulty: {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Test Cases Accordion List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading test cases...</p>
        </div>
      ) : testCases.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0e1628]/50 border border-slate-800 p-8 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No test cases match your filters</p>
          <p className="text-xs text-slate-500">Try adjusting your search criteria or create a custom test case.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {testCases.map((tc) => {
            const isExpanded = expandedId === tc.id;
            return (
              <div
                key={tc.id}
                className="rounded-xl bg-[#0e1628]/80 border border-slate-800 hover:border-purple-500/30 transition-all overflow-hidden"
              >
                {/* Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : tc.id)}
                  className="p-4 cursor-pointer hover:bg-slate-900/50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-white">{tc.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                        {tc.category}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          tc.difficulty === 'Easy'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                            : tc.difficulty === 'Medium'
                            ? 'bg-yellow-950/40 text-yellow-300 border-yellow-800/40'
                            : tc.difficulty === 'Hard'
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                            : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                        }`}
                      >
                        {tc.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{tc.learning_objective}</p>
                  </div>

                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 space-y-4 animate-in fade-in text-xs">
                    <div>
                      <span className="font-semibold text-slate-300 font-mono block mb-1">
                        LEARNING OBJECTIVE:
                      </span>
                      <p className="text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        {tc.learning_objective}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-300 font-mono">
                          SAFE SYNTHETIC INPUT PAYLOAD:
                        </span>
                        <button
                          onClick={() => copyPrompt(tc.input_template, tc.id)}
                          className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          {copiedId === tc.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === tc.id ? 'Copied' : 'Copy Payload'}</span>
                        </button>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-200 whitespace-pre-wrap">
                        {tc.input_template}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                        <span className="font-semibold text-emerald-300 font-mono block mb-1">
                          EXPECTED SECURE BEHAVIOR:
                        </span>
                        <p className="text-slate-300">{tc.expected_behavior}</p>
                      </div>

                      <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/30">
                        <span className="font-semibold text-amber-300 font-mono block mb-1">
                          DETECTION CRITERIA:
                        </span>
                        <p className="text-slate-300">{tc.detection_criteria}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-900/30">
                      <span className="font-semibold text-cyan-300 font-mono block mb-1">
                        REMEDIATION & OWASP DEFENSE GUIDANCE:
                      </span>
                      <p className="text-slate-300">{tc.remediation_guidance}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Custom Test Case */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-purple-900/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Create Custom Security Test Case</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTestCase} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1 font-mono">TITLE *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. JSON Delimiter Inversion Attack"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1 font-mono">CATEGORY *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-purple-500"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1 font-mono">DIFFICULTY</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-purple-500"
                  >
                    {difficulties.filter((d) => d !== 'All').map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 font-mono">LEARNING OBJECTIVE</label>
                <textarea
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  rows={2}
                  placeholder="What vulnerability mechanism does this test examine?"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 font-mono">INPUT TEMPLATE / PAYLOAD *</label>
                <textarea
                  value={newInput}
                  onChange={(e) => setNewInput(e.target.value)}
                  rows={3}
                  placeholder="Synthetic test prompt payload..."
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 font-mono text-slate-200 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 font-mono">EXPECTED SECURE BEHAVIOR *</label>
                <textarea
                  value={newExpected}
                  onChange={(e) => setNewExpected(e.target.value)}
                  rows={2}
                  placeholder="How should a hardened agent safely respond?"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1 font-mono">DETECTION CRITERIA</label>
                  <input
                    type="text"
                    value={newCriteria}
                    onChange={(e) => setNewCriteria(e.target.value)}
                    placeholder="Keywords or indicators"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1 font-mono">REMEDIATION GUIDANCE</label>
                  <input
                    type="text"
                    value={newRemediation}
                    onChange={(e) => setNewRemediation(e.target.value)}
                    placeholder="OWASP defense recommendation"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="px-5 py-2 rounded-lg font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {modalSaving ? 'Saving...' : 'Add to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
