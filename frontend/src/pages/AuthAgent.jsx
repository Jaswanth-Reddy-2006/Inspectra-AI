import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTargetUrl } from '../context/UrlContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock, Unlock, Eye, EyeOff, Play, RefreshCw, Shield,
    AlertTriangle, CheckCircle, XCircle, Loader, Globe,
    Key, User, Mail, Smartphone, Hash, Database, FileText,
    Copy, Download, Trash2, Plus, ChevronDown, ChevronRight,
    Zap, Clock, Cookie, Terminal, Save, Search,
    Radio, Activity, BarChart2
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIELD_ICONS = { email: Mail, username: User, password: Lock, otp: Hash, phone: Smartphone, unknown: Key };
const FIELD_COLORS = { email: '#0ea5e9', username: '#6366f1', password: '#ef4444', otp: '#f59e0b', phone: '#10b981', unknown: '#94a3b8' };
const FIELD_BG = { email: '#e0f2fe', username: '#eef2ff', password: '#fee2e2', otp: '#fef3c7', phone: '#d1fae5', unknown: '#f1f5f9' };

const confColor = (c) => c >= 75 ? '#10b981' : c >= 45 ? '#f59e0b' : '#ef4444';
const confBg = (c) => c >= 75 ? '#d1fae5' : c >= 45 ? '#fef3c7' : '#fee2e2';

const LOG_STYLES = {
    info: { color: '#6366f1', chr: '●' },
    ok: { color: '#10b981', chr: '✓' },
    warn: { color: '#f59e0b', chr: '⚠' },
    error: { color: '#ef4444', chr: '✗' },
    success: { color: '#22c55e', chr: '★' },
};

function ScoreDial({ score }) {
    const r = 44;
    const circ = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, score));
    const dash = (pct / 100) * circ;
    const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="absolute" width="112" height="112" viewBox="0 0 112 112">
                <circle cx="56" cy="56" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <motion.circle
                    cx="56" cy="56" r={r} fill="none"
                    stroke={color} strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${circ}`}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ - dash }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    transform="rotate(-90 56 56)"
                />
            </svg>
            <div className="text-center z-10">
                <p className="text-2xl font-black" style={{ color }}>{pct}</p>
                <p className="text-[10px] font-bold text-slate-400">/ 100</p>
            </div>
        </div>
    );
}

// ─── Credential Vault Card ────────────────────────────────────────────────────

function CredentialVault({ credentials, onChange, onAdd, onRemove }) {
    const [showPw, setShowPw] = useState({});
    const toggle = (i) => setShowPw(s => ({ ...s, [i]: !s[i] }));

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <Key size={13} className="text-indigo-500" />
                    </div>
                    <span className="font-black text-slate-800 text-sm">Credential Vault</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{credentials.length}</span>
                </div>
                <button onClick={onAdd}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus size={12} /> Add
                </button>
            </div>
            <div className="divide-y divide-slate-50">
                {credentials.length === 0 && (
                    <div className="py-6 text-center text-slate-300 text-xs font-semibold">
                        <Key size={20} className="mx-auto mb-2 text-slate-200" />
                        No credentials stored
                    </div>
                )}
                {credentials.map((cred, i) => (
                    <div key={i} className="px-4 py-3 space-y-2 hover:bg-slate-50 group transition-colors">
                        <div className="flex items-center gap-2">
                            <input
                                value={cred.label}
                                onChange={e => onChange(i, 'label', e.target.value)}
                                placeholder="Label (e.g. Admin)"
                                className="flex-1 text-xs font-bold text-slate-700 bg-slate-100 border border-transparent rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-300 focus:bg-white transition-colors"
                            />
                            <button onClick={() => onRemove(i)}
                                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all p-1 rounded-lg hover:bg-red-50">
                                <Trash2 size={13} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-indigo-300 focus-within:bg-white transition-colors">
                            <User size={11} className="text-slate-400 shrink-0" />
                            <input
                                value={cred.username}
                                onChange={e => onChange(i, 'username', e.target.value)}
                                placeholder="Username or email"
                                className="flex-1 text-xs font-mono text-slate-700 bg-transparent outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-indigo-300 focus-within:bg-white transition-colors">
                            <Lock size={11} className="text-slate-400 shrink-0" />
                            <input
                                type={showPw[i] ? 'text' : 'password'}
                                value={cred.password}
                                onChange={e => onChange(i, 'password', e.target.value)}
                                placeholder="Password"
                                className="flex-1 text-xs font-mono text-slate-700 bg-transparent outline-none"
                            />
                            <button onClick={() => toggle(i)} className="text-slate-300 hover:text-slate-500">
                                {showPw[i] ? <EyeOff size={11} /> : <Eye size={11} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Form Preview ─────────────────────────────────────────────────────────────

function FormPreview({ form, selectedFormIdx, forms, onSelectForm }) {
    if (!form) return (
        <div className="flex flex-col items-center justify-center h-40 text-slate-300">
            <Search size={24} className="mb-2" />
            <p className="text-xs font-semibold">Run detection to see form preview</p>
        </div>
    );

    return (
        <div className="space-y-3">
            {forms.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                    {forms.map((f, i) => (
                        <button key={i}
                            onClick={() => onSelectForm(i)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${selectedFormIdx === i ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            Form {i + 1}
                            <span className="ml-1 opacity-70">({f.loginScore}%)</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Auth Form Confidence</span>
                        <span className="text-xs font-black" style={{ color: confColor(form.loginScore) }}>{form.loginScore}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                            className="h-1.5 rounded-full"
                            style={{ background: confColor(form.loginScore) }}
                            initial={{ width: 0 }}
                            animate={{ width: `${form.loginScore}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </div>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold shrink-0">{form.fields.length} fields</div>
            </div>

            <div className="grid gap-2">
                {form.fields.map((f, i) => {
                    const Icon = FIELD_ICONS[f.classification] || FIELD_ICONS.unknown;
                    const color = FIELD_COLORS[f.classification] || FIELD_COLORS.unknown;
                    const bg = FIELD_BG[f.classification] || FIELD_BG.unknown;
                    return (
                        <motion.div key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-3 hover:shadow-sm transition-shadow">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                                <Icon size={14} style={{ color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black text-slate-700 capitalize">{f.classification}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                                        style={{ background: confBg(f.confidence), color: confColor(f.confidence) }}>
                                        {f.confidence}% conf.
                                    </span>
                                    {f.required && <span className="text-[9px] text-red-400 font-black">REQUIRED</span>}
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                                    {f.selector} · type="{f.type}"
                                    {f.placeholder && ` · "${f.placeholder}"`}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-slate-400 font-semibold">Action</p>
                    <p className="font-mono text-slate-700 truncate">{form.action || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-slate-400 font-semibold">Method</p>
                    <p className="font-mono text-slate-700 uppercase">{form.method || 'post'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-slate-400 font-semibold">Form ID</p>
                    <p className="font-mono text-slate-700 truncate">{form.formId || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-slate-400 font-semibold">Submit</p>
                    <p className="font-mono text-slate-700 truncate">{form.submitButton || '—'}</p>
                </div>
            </div>
        </div>
    );
}

// ─── Script Viewer ────────────────────────────────────────────────────────────

function ScriptViewer({ script }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(script);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };
    const download = () => {
        const blob = new Blob([script], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'auth_script.js'; a.click();
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                    <FileText size={13} className="text-indigo-400" />
                    <span className="text-xs font-black text-slate-700">Generated Playwright Script</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={copy}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors">
                        <Copy size={11} />{copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={download}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-green-600 px-2.5 py-1 rounded-lg hover:bg-green-50 transition-colors">
                        <Download size={11} /> .js
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#0f172a] p-4">
                <pre className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-all">
                    {script
                        ? script.split('\n').map((line, i) => {
                            const isComment = line.trim().startsWith('//');
                            const isKeyword = /\b(await|async|const|let|function|return|if|for|true|false)\b/.test(line);
                            return (
                                <span key={i} className={`block ${isComment ? 'text-slate-500' : 'text-slate-300'}`}>
                                    {line.split(/(\bawait\b|\basync\b|\bconst\b|\blet\b|\bfunction\b|\breturn\b|\bif\b|\bfor\b)/g).map((part, j) => (
                                        /\bawait\b|\basync\b|\bconst\b|\blet\b|\bfunction\b|\breturn\b|\bif\b|\bfor\b/.test(part)
                                            ? <span key={j} className="text-violet-400">{part}</span>
                                            : <span key={j}>{part}</span>
                                    ))}
                                </span>
                            );
                        })
                        : <span className="text-slate-600">{'// No script generated yet\n// Detect a form first, then click "Generate Script"'}</span>
                    }
                </pre>
            </div>
        </div>
    );
}

// ─── Replay Log Console ───────────────────────────────────────────────────────

function ReplayLog({ logs, replaying }) {
    const ref = useRef(null);
    useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs.length]);

    return (
        <div ref={ref} className="flex-1 overflow-y-auto bg-[#0f172a] p-3 space-y-0.5 font-mono">
            {logs.length === 0 && !replaying && (
                <div className="flex flex-col items-center justify-center h-28 text-slate-600">
                    <Terminal size={18} className="mb-2" />
                    <p className="text-xs">Replay log appears here</p>
                </div>
            )}
            {logs.map((l, i) => {
                const s = LOG_STYLES[l.level] || LOG_STYLES.info;
                return (
                    <div key={i} className="flex items-start gap-2 py-0.5">
                        <span className="text-[11px] font-black mt-0.5 shrink-0" style={{ color: s.color }}>{s.chr}</span>
                        <span className={`text-[11px] leading-relaxed break-all ${l.level === 'error' ? 'text-red-300' : l.level === 'success' ? 'text-green-300' : l.level === 'ok' ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {l.text}
                        </span>
                    </div>
                );
            })}
            {replaying && (
                <div className="flex items-center gap-2 py-0.5">
                    <Loader size={10} className="text-indigo-400 animate-spin shrink-0" />
                    <span className="text-[11px] text-slate-500 animate-pulse">Running authentication…</span>
                </div>
            )}
        </div>
    );
}

// ─── Sessions Panel ───────────────────────────────────────────────────────────

function SessionsPanel({ sessions, onDelete, onRefresh }) {
    const list = Object.values(sessions);
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Cookie size={14} className="text-green-500" />
                    <span className="font-black text-slate-800 text-sm">Persisted Sessions</span>
                    <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">{list.length}</span>
                </div>
                <button onClick={onRefresh}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">
                    <RefreshCw size={12} /> Refresh
                </button>
            </div>

            {list.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-300">
                    <Cookie size={32} className="mb-3 text-slate-200" />
                    <p className="text-sm font-semibold text-slate-400">No sessions saved yet</p>
                    <p className="text-xs text-slate-300 mt-1">Run a successful replay to persist a session</p>
                </div>
            ) : (
                <div className="grid gap-2">
                    {list.map((s, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-3.5 hover:shadow-sm group transition-all">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.success ? 'bg-green-400' : 'bg-red-300'}`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-mono font-bold text-slate-700 truncate">{s.url}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    <span className="font-semibold">{s.credentials?.username}</span>
                                    {' · '}
                                    {new Date(s.capturedAt).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                    {s.success ? '✓ Active' : '✗ Failed'}
                                </span>
                                <button onClick={() => onDelete(s.url)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 p-1 rounded-lg hover:bg-red-50 transition-all">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Auth Agent Page ─────────────────────────────────────────────────────

export default function AuthAgent() {
    const { targetUrl: url } = useTargetUrl();
    const [detecting, setDetecting] = useState(false);
    const [detection, setDetection] = useState(null);
    const [selectedFormIdx, setSelectedFormIdx] = useState(0);
    const [script, setScript] = useState('');
    const [generating, setGenerating] = useState(false);
    const [credentials, setCredentials] = useState([
        { label: 'Admin', username: '', password: '' },
    ]);
    const [activeCredIdx, setActiveCredIdx] = useState(0);
    const [replaying, setReplaying] = useState(false);
    const [replayResult, setReplayResult] = useState(null);
    const [replayLogs, setReplayLogs] = useState([]);
    const [sessions, setSessions] = useState({});
    const [activeTab, setActiveTab] = useState('detect');
    const [detError, setDetError] = useState(null);

    const selectedForm = detection?.forms?.[selectedFormIdx] || null;

    useEffect(() => { fetchSessions(); }, []);

    async function fetchSessions() {
        try {
            const r = await fetch(`${API_BASE}/api/auth/sessions`);
            const d = await r.json();
            if (d.success) setSessions(d.sessions);
        } catch (_) { }
    }

    const handleDetect = async () => {
        if (!url) return;
        setDetecting(true);
        setDetection(null);
        setScript('');
        setReplayResult(null);
        setReplayLogs([]);
        setDetError(null);
        setSelectedFormIdx(0);
        try {
            const res = await fetch(`${API_BASE}/api/auth/detect`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Detection failed');
            setDetection(data);
        } catch (err) {
            setDetError(err.message);
        } finally {
            setDetecting(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedForm || !url) return;
        setGenerating(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/generate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, form: selectedForm, credentialKey: credentials[activeCredIdx]?.label || 'default' }),
            });
            const data = await res.json();
            if (data.success) { setScript(data.script); setActiveTab('script'); }
        } catch (_) { }
        setGenerating(false);
    };

    const handleReplay = async () => {
        if (!selectedForm || !url) return;
        const cred = credentials[activeCredIdx];
        if (!cred?.username || !cred?.password) {
            alert('Fill in the active credential username & password first');
            return;
        }
        setReplaying(true);
        setReplayResult(null);
        setReplayLogs([]);
        try {
            const res = await fetch(`${API_BASE}/api/auth/replay`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, form: selectedForm, credentials: { username: cred.username, password: cred.password } }),
            });
            const data = await res.json();
            if (data.success) {
                setReplayResult(data);
                setReplayLogs(data.log || []);
                fetchSessions();
            } else {
                setReplayLogs([{ level: 'error', text: data.error || 'Replay failed' }]);
            }
        } catch (err) {
            setReplayLogs([{ level: 'error', text: err.message }]);
        }
        setReplaying(false);
    };

    const addCred = () => setCredentials(c => [...c, { label: `Set ${c.length + 1}`, username: '', password: '' }]);
    const removeCred = (i) => { setCredentials(c => c.filter((_, idx) => idx !== i)); if (activeCredIdx >= credentials.length - 1) setActiveCredIdx(0); };
    const changeCred = (i, key, val) => setCredentials(c => c.map((cr, idx) => idx === i ? { ...cr, [key]: val } : cr));

    const deleteSession = async (key) => {
        try {
            await fetch(`${API_BASE}/api/auth/sessions/${encodeURIComponent(key)}`, { method: 'DELETE' });
            fetchSessions();
        } catch (_) { }
    };

    const tabs = [
        { id: 'detect', icon: Search, label: 'Form Detection' },
        { id: 'script', icon: FileText, label: 'Script' },
        { id: 'sessions', icon: Cookie, label: 'Sessions' },
    ];

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] bg-[#f8fafc]">

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3 shadow-sm flex-wrap">
                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Shield size={16} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">Auth Agent</p>
                        <p className="text-[10px] text-slate-400 font-semibold">AI-powered authentication</p>
                    </div>
                </div>

                <div className="w-px h-8 bg-slate-100 mx-2 hidden md:block" />

                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
                    <Globe size={14} className="text-blue-400 shrink-0" />
                    <span className="flex-1 text-sm font-mono text-slate-700 truncate">{url || <span className="text-slate-400 italic">Set a URL in the top bar…</span>}</span>
                </div>

                <button onClick={handleDetect} disabled={!url || detecting}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-5 py-2.5
                        rounded-xl text-sm font-black transition-all shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap">
                    {detecting ? <><Loader size={14} className="animate-spin" /> Detecting…</> : <><Search size={14} /> Detect Forms</>}
                </button>

                {detection && selectedForm && (
                    <>
                        <button onClick={handleGenerate} disabled={generating}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-4 py-2.5
                                rounded-xl text-sm font-black transition-all whitespace-nowrap">
                            {generating ? <Loader size={13} className="animate-spin" /> : <FileText size={13} />}
                            Generate Script
                        </button>
                        <button onClick={handleReplay} disabled={replaying}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-5 py-2.5
                                rounded-xl text-sm font-black transition-all shadow-lg shadow-green-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap">
                            {replaying
                                ? <><Loader size={13} className="animate-spin" /> Replaying…</>
                                : <><Play size={13} strokeWidth={3} /> Replay Test</>}
                        </button>
                    </>
                )}

                {detError && (
                    <div className="flex items-center gap-2 bg-red-50 text-red-500 px-3 py-2 rounded-xl text-xs font-bold">
                        <XCircle size={12} /> {detError.slice(0, 55)}
                    </div>
                )}
                {detection && !detError && (
                    <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-2 rounded-xl text-xs font-bold">
                        <CheckCircle size={12} /> {detection.forms.length} form{detection.forms.length !== 1 ? 's' : ''} detected
                    </div>
                )}
            </div>

            {/* ── Body ────────────────────────────────────────────────── */}
            <div className="flex-1 flex gap-4 px-6 py-4 min-h-0 overflow-hidden">

                {/* Left: Credential Vault */}
                <div className="w-[300px] shrink-0 flex flex-col gap-3 overflow-y-auto">
                    <CredentialVault credentials={credentials} onChange={changeCred} onAdd={addCred} onRemove={removeCred} />

                    {credentials.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5">Active Credential</p>
                            <div className="flex flex-wrap gap-1.5">
                                {credentials.map((c, i) => (
                                    <button key={i} onClick={() => setActiveCredIdx(i)}
                                        className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-colors ${activeCredIdx === i ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                        {c.label || `Set ${i + 1}`}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-[11px] font-mono text-slate-600 space-y-1">
                                <div className="flex items-center gap-2">
                                    <User size={10} className="text-indigo-400 shrink-0" />
                                    <span className="truncate">{credentials[activeCredIdx]?.username || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Lock size={10} className="text-indigo-400 shrink-0" />
                                    <span>{credentials[activeCredIdx]?.password ? '••••••••' : '—'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {detection?.screenshot && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
                                <Eye size={12} className="text-slate-400" />
                                <span className="text-xs font-black text-slate-700">Page Screenshot</span>
                                <span className="text-[10px] text-slate-400 ml-auto">{detection.statusCode}</span>
                            </div>
                            <div className="p-2">
                                <img src={detection.screenshot} alt="Detected page" className="w-full rounded-xl border border-slate-100" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Middle: Tabs */}
                <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
                    <div className="flex gap-2">
                        {tabs.map(t => {
                            const Icon = t.icon;
                            return (
                                <button key={t.id} onClick={() => setActiveTab(t.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                    <Icon size={12} /> {t.label}
                                    {t.id === 'sessions' && Object.keys(sessions).length > 0 && (
                                        <span className="bg-green-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                            {Object.keys(sessions).length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <AnimatePresence mode="wait">
                            {activeTab === 'detect' && (
                                <motion.div key="detect"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="h-full overflow-y-auto p-5">
                                    {!detection && !detecting && !detError && (
                                        <div className="flex flex-col items-center justify-center min-h-[320px]">
                                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
                                                <Shield size={38} className="text-indigo-300" />
                                            </div>
                                            <h3 className="font-black text-slate-700 text-base mb-2">AI Form Detector</h3>
                                            <p className="text-slate-400 text-sm text-center max-w-sm leading-relaxed">
                                                Enter a URL and click <strong className="text-slate-600">Detect Forms</strong>. Inspectra will launch a headless browser, discover all input forms, and classify each field using ML heuristics.
                                            </p>
                                            <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-sm">
                                                {[
                                                    { icon: Search, label: 'Detects forms', color: '#6366f1' },
                                                    { icon: Key, label: 'Classifies fields', color: '#0ea5e9' },
                                                    { icon: FileText, label: 'Generates script', color: '#10b981' },
                                                ].map(item => (
                                                    <div key={item.label} className="flex flex-col items-center gap-1.5 p-3 bg-slate-50 rounded-xl text-center">
                                                        <item.icon size={16} style={{ color: item.color }} />
                                                        <span className="text-[10px] font-bold text-slate-500">{item.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {detecting && (
                                        <div className="flex flex-col items-center justify-center min-h-[320px]">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                                className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 mb-4"
                                            />
                                            <p className="text-slate-600 font-bold text-sm">Scanning with headless browser…</p>
                                            <p className="text-slate-400 text-xs mt-1">Extracting forms · Classifying fields · Scoring confidence</p>
                                        </div>
                                    )}
                                    {detError && !detecting && (
                                        <div className="flex flex-col items-center justify-center min-h-[320px]">
                                            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mb-4">
                                                <XCircle size={28} className="text-red-400" />
                                            </div>
                                            <p className="text-slate-700 font-bold text-sm mb-1">Detection Failed</p>
                                            <p className="text-red-500 text-xs text-center max-w-sm font-mono">{detError}</p>
                                        </div>
                                    )}
                                    {detection && !detecting && (
                                        <FormPreview
                                            form={selectedForm}
                                            forms={detection.forms}
                                            selectedFormIdx={selectedFormIdx}
                                            onSelectForm={setSelectedFormIdx}
                                        />
                                    )}
                                </motion.div>
                            )}
                            {activeTab === 'script' && (
                                <motion.div key="script"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="h-full flex flex-col overflow-hidden">
                                    <ScriptViewer script={script} />
                                </motion.div>
                            )}
                            {activeTab === 'sessions' && (
                                <motion.div key="sessions"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="h-full overflow-y-auto p-5">
                                    <SessionsPanel sessions={sessions} onDelete={deleteSession} onRefresh={fetchSessions} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right: Score dial + Replay log */}
                <div className="w-[260px] shrink-0 flex flex-col gap-3">

                    {/* Success probability + result */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Success Probability</p>
                        <ScoreDial score={replayResult?.probScore ?? 0} />
                        {replayResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`mt-3 flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl ${replayResult.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                {replayResult.success ? <><CheckCircle size={13} /> Login Succeeded</> : <><XCircle size={13} /> Login Failed</>}
                            </motion.div>
                        )}
                        {replayResult && (
                            <div className="mt-3 w-full space-y-1.5">
                                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5">
                                    <Cookie size={12} className="text-green-500 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Cookies Captured</p>
                                        <p className="text-sm font-black text-slate-700">{replayResult.sessionCookies ?? 0}</p>
                                    </div>
                                </div>
                                {replayResult.urlAfter && (
                                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5">
                                        <Activity size={12} className="text-indigo-500 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Redirected To</p>
                                            <p className="text-[11px] font-mono font-bold text-slate-700 truncate">{replayResult.urlAfter}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {!replayResult && !replaying && (
                            <p className="text-[11px] text-slate-400 font-semibold text-center mt-3 leading-relaxed">
                                Run <strong>Replay Test</strong> to measure auth success probability
                            </p>
                        )}
                    </div>

                    {/* Replay log console */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1">
                        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 shrink-0">
                            <Terminal size={12} className="text-slate-400" />
                            <span className="text-xs font-black text-slate-700">Replay Console</span>
                            {replaying && <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                        </div>
                        <ReplayLog logs={replayLogs} replaying={replaying} />
                    </div>
                </div>
            </div>
        </div>
    );
}
