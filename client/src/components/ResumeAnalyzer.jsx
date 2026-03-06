import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

// ── helper components ──────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colour =
    score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" className="rotate-[-90deg]">
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke="var(--border)" strokeWidth="10"
        />
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke={colour} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="mt-[-88px] flex flex-col items-center z-10">
        <span className="text-3xl font-bold" style={{ color: colour }}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
      <p className="mt-12 text-sm font-medium text-foreground">Resume Score</p>
    </div>
  );
}

function SkillChip({ label, variant = 'success' }) {
  const colours = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    info:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colours[variant]}`}>
      {label}
    </span>
  );
}

function HistoryRow({ item, onClick }) {
  const colour =
    item.resumeScore >= 70 ? 'text-green-500' :
    item.resumeScore >= 40 ? 'text-yellow-500' : 'text-red-500';

  return (
    <button
      onClick={() => onClick(item)}
      className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <FileText size={16} className="text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-foreground truncate">
          {new Date(item.createdAt).toLocaleDateString('en-US', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
        </span>
      </div>
      <span className={`text-sm font-bold shrink-0 ml-2 ${colour}`}>
        {item.resumeScore}/100
      </span>
    </button>
  );
}

// ── main component ─────────────────────────────────────────────────────────

const ACCEPTED = '.pdf,.doc,.docx,.txt';

export default function ResumeAnalyzer() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('analyze'); // 'analyze' | 'history'
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      toast.error('Please upload a PDF, DOCX, DOC, or TXT file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be smaller than 5 MB.');
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const { data } = await axios.post('/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.data);
      toast.success('Resume analysed successfully!');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Analysis failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data } = await axios.get('/resume/history');
      setHistory(data.data);
    } catch {
      toast.error('Failed to load history.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'history' && history === null) loadHistory();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resume Analyzer</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload your resume to get an AI-powered skill analysis and role suggestions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {['analyze', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'history' ? 'Past Analyses' : 'Analyze'}
          </button>
        ))}
      </div>

      {/* ── ANALYZE TAB ── */}
      {activeTab === 'analyze' && (
        <>
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3
              cursor-pointer transition-colors
              ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60 bg-muted/20'}
              ${loading ? 'pointer-events-none opacity-60' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={onInputChange}
            />

            {loading ? (
              <>
                <RefreshCw size={36} className="text-primary animate-spin" />
                <p className="text-sm font-medium text-foreground">Analysing your resume…</p>
                <p className="text-xs text-muted-foreground">This may take a few seconds</p>
              </>
            ) : (
              <>
                <Upload size={36} className={dragging ? 'text-primary' : 'text-muted-foreground'} />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Drop your resume here or{' '}
                    <span className="text-primary underline">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOCX, DOC, TXT — max 5 MB
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {/* Score */}
              <div className="flex justify-center">
                <ScoreRing score={result.resumeScore} />
              </div>

              {/* Skills Detected */}
              {result.skillsDetected?.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={16} className="text-green-500" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Detected Skills ({result.skillsDetected.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.skillsDetected.map((s) => (
                      <SkillChip key={s} label={s} variant="success" />
                    ))}
                  </div>
                </section>
              )}

              {/* Skills Missing */}
              {result.skillsMissing?.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={16} className="text-yellow-500" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Suggested Skills to Add
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.skillsMissing.map((s) => (
                      <SkillChip key={s} label={s} variant="warning" />
                    ))}
                  </div>
                </section>
              )}

              {/* Suggested Roles */}
              {result.suggestedRoles?.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-blue-500" />
                    <h3 className="text-sm font-semibold text-foreground">Suggested Roles</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.suggestedRoles.map((r) => (
                      <SkillChip key={r} label={r} variant="info" />
                    ))}
                  </div>
                </section>
              )}

              {/* Metadata */}
              {result.wordCount > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                  {result.wordCount} words detected
                </p>
              )}

              {/* Re-upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full mt-2 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                Analyse another resume
              </button>
            </div>
          )}
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Past Analyses</h2>
            <button
              onClick={loadHistory}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {historyLoading ? (
            <div className="p-8 flex justify-center">
              <RefreshCw size={24} className="animate-spin text-primary" />
            </div>
          ) : history?.length === 0 ? (
            <div className="p-8 text-center">
              <Clock size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No analyses yet. Upload a resume to get started.</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {history?.map((item) => (
                <HistoryRow
                  key={item._id}
                  item={item}
                  onClick={(selected) => {
                    setResult(selected);
                    setActiveTab('analyze');
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
