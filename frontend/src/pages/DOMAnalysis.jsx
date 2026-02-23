import React, { useState, useRef, useCallback } from 'react';
import { useTargetUrl } from '../context/UrlContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GitBranch, Globe, Loader, ChevronRight, ChevronDown,
    Copy, CheckCircle, XCircle, Code2, X, Search
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const stabColor = (s) => s >= 70 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444';
const stabBg = (s) => s >= 70 ? '#d1fae5' : s >= 40 ? '#fef3c7' : '#fee2e2';
const stabLabel = (s) => s >= 70 ? 'Stable' : s >= 40 ? 'Fragile' : 'Risky';

const SEL_COLOR = { Excellent: '#10b981', Good: '#0ea5e9', Moderate: '#f59e0b', Fragile: '#ef4444' };
const SEL_BG = { Excellent: '#d1fae5', Good: '#e0f2fe', Moderate: '#fef3c7', Fragile: '#fee2e2' };

const TAG_COLORS = {
    button: '#6366f1', a: '#0ea5e9', input: '#ef4444', form: '#f59e0b',
    select: '#8b5cf6', textarea: '#ec4899', nav: '#10b981', header: '#0ea5e9',
    main: '#6366f1', footer: '#94a3b8', h1: '#f43f5e', h2: '#e879f9', h3: '#c026d3',
};
const tagColor = (t) => TAG_COLORS[t] || '#94a3b8';

function StabilityGauge({ score }) {
    const r = 38; const circ = 2 * Math.PI * r;
    const color = stabColor(score);
    return (
        <div className="relative w-[88px] h-[88px] flex items-center justify-center">
            <svg className="absolute" width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <motion.circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="6"
                    strokeLinecap="round" strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ - (score / 100) * circ }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    transform="rotate(-90 44 44)" />
            </svg>
            <div className="z-10 text-center">
                <p className="text-xl font-black" style={{ color }}>{score}</p>
                <p className="text-[9px] font-bold" style={{ color }}>{stabLabel(score)}</p>
            </div>
        </div>
    );
}

function TreeNode({ node, depth = 0, onSelect, elements }) {
    const [open, setOpen] = useState(depth < 2);
    const hasChildren = node.children && node.children.length > 0;
    const match = elements?.find(e => node.id && e.id === node.id);
    const stability = match?.stabilityScore;
    return (
        <div>
            <div onClick={() => { if (hasChildren) setOpen(v => !v); if (match) onSelect(match); }}
                className="flex items-center gap-1.5 py-[3px] rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                style={{ paddingLeft: `${depth * 13 + 4}px` }}>
                <span className="shrink-0 w-3">
                    {hasChildren ? (open ? <ChevronDown size={10} className="text-slate-400" /> : <ChevronRight size={10} className="text-slate-400" />) : null}
                </span>
                {stability !== undefined && (
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: stabColor(stability) }} />
                )}
                <span className="text-[11px] font-mono font-bold" style={{ color: tagColor(node.tag) }}>
                    &lt;{node.tag}
                </span>
                {node.attrs && (
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">{node.attrs}</span>
                )}
                <span className="text-[11px] font-mono font-bold" style={{ color: tagColor(node.tag) }}>&gt;</span>
                {node.childCount > 0 && !open && (
                    <span className="text-[9px] text-slate-400">+{node.childCount}</span>
                )}
            </div>
            {open && hasChildren && node.children.map((c, i) => (
                <TreeNode key={i} node={c} depth={depth + 1} onSelect={onSelect} elements={elements} />
            ))}
        </div>
    );
}

function ElementDetail({ element, onClose }) {
    const [copiedIdx, setCopiedIdx] = useState(null);
    const copy = (sel, i) => { navigator.clipboard.writeText(sel); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 1500); };

    if (!element) return (
        <div className="flex flex-col items-center justify-center h-full text-slate-300 p-6 text-center">
            <GitBranch size={28} className="mb-2 text-slate-200" />
            <p className="text-xs font-semibold text-slate-400">Click any element to inspect</p>
        </div>
    );

    const s = element.stabilityScore || 0;
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0">
                <code className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: stabBg(s), color: stabColor(s) }}>
                    &lt;{element.tag}&gt;
                </code>
                <span className="text-[10px] text-slate-400 font-mono truncate flex-1">{element.id ? `#${element.id}` : ''}</span>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={12} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Gauge + signals */}
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3">
                    <StabilityGauge score={s} />
                    <div className="flex-1 space-y-2">
                        <p className="text-xs font-black text-slate-700">Selector Strength</p>
                        <div className="flex flex-wrap gap-1">
                            {element.testid && <span className="text-[9px] font-bold bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">✓ testid</span>}
                            {element.ariaLabel && <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">✓ aria</span>}
                            {element.id && !element.hasDynamicId && <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">✓ id</span>}
                            {element.role && <span className="text-[9px] font-bold bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full">✓ role</span>}
                            {element.hasDynamicId && <span className="text-[9px] font-bold bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">⚠ dyn-id</span>}
                            {element.hasDynamicClasses && <span className="text-[9px] font-bold bg-amber-50 text-amber-500 px-1.5 py-0.5 rounded-full">⚠ hash-cls</span>}
                        </div>
                        <div>
                            <div className="flex justify-between mb-0.5">
                                <span className="text-[9px] text-slate-400 font-bold uppercase">Change Probability</span>
                                <span className="text-[9px] font-black" style={{ color: element.changeProbability > 50 ? '#ef4444' : '#10b981' }}>
                                    {element.changeProbability || 0}%
                                </span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <motion.div className="h-1.5 rounded-full"
                                    style={{ background: (element.changeProbability || 0) > 60 ? '#ef4444' : '#10b981' }}
                                    initial={{ width: 0 }} animate={{ width: `${element.changeProbability || 0}%` }}
                                    transition={{ duration: 0.6 }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score breakdown */}
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Score Breakdown</p>
                    <div className="space-y-1">
                        {(element.flags || []).map((f, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-[10px] font-mono w-24 text-slate-500 shrink-0 truncate">{f.attr}</span>
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-1.5 rounded-full" style={{ width: `${Math.abs(f.weight) * 2.5}%`, background: f.weight > 0 ? '#10b981' : '#ef4444' }} />
                                </div>
                                <span className={`text-[9px] font-black w-7 text-right ${f.weight > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {f.weight > 0 ? '+' : ''}{f.weight}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recommended selectors */}
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Recommended Selectors</p>
                    <div className="space-y-1.5">
                        {(element.selectors || []).map((sel, i) => (
                            <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl border ${i === 0 ? 'border-green-200 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                        {i === 0 && <span className="text-[9px] font-black text-green-600">★ Best</span>}
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: SEL_BG[sel.strength], color: SEL_COLOR[sel.strength] }}>{sel.strength}</span>
                                        <span className="text-[9px] text-slate-400">{sel.label}</span>
                                    </div>
                                    <code className="text-[10px] font-mono text-slate-700 break-all block">{sel.selector}</code>
                                </div>
                                <button onClick={() => copy(sel.selector, i)} className="p-1 rounded-lg hover:bg-white shrink-0">
                                    {copiedIdx === i ? <CheckCircle size={10} className="text-green-500" /> : <Copy size={10} className="text-slate-400" />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Attrs */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    {[{ l: 'Type', v: element.type || '—' }, { l: 'Name', v: element.name || '—' },
                    { l: 'Role', v: element.role || '—' }, { l: 'ARIA', v: element.ariaLabel || '—' },
                    { l: 'testid', v: element.testid || '—' }, { l: 'Text', v: (element.text || '—').slice(0, 25) }].map(m => (
                        <div key={m.l} className="bg-slate-50 rounded-xl p-2">
                            <p className="text-slate-400 font-semibold">{m.l}</p>
                            <p className="font-mono font-bold text-slate-700 truncate">{m.v}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function DOMAnalysis() {
    const { targetUrl: url } = useTargetUrl();
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);
    const [searchQ, setSearchQ] = useState('');
    const [sortKey, setSortKey] = useState('stability');

    const handleAnalyze = async () => {
        if (!url) return;
        setAnalyzing(true); setResult(null); setError(null); setSelected(null);
        try {
            const res = await fetch(`${API_BASE}/api/dom/analyze`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            setResult(data);
        } catch (err) { setError(err.message); }
        finally { setAnalyzing(false); }
    };

    const filtered = result?.elements?.filter(e =>
        !searchQ || e.tag.includes(searchQ) || e.id?.includes(searchQ) ||
        e.text?.toLowerCase().includes(searchQ.toLowerCase()) || e.testid?.includes(searchQ)
    ).sort((a, b) => {
        if (sortKey === 'stability') return (a.stabilityScore || 0) - (b.stabilityScore || 0);
        if (sortKey === 'stability_desc') return (b.stabilityScore || 0) - (a.stabilityScore || 0);
        return a.tag.localeCompare(b.tag);
    }) || [];

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 shadow-sm flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200">
                        <GitBranch size={17} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">DOM Analysis</p>
                        <p className="text-[10px] text-slate-400 font-semibold">Selector intelligence · Stability scoring</p>
                    </div>
                </div>
                <div className="w-px h-7 bg-slate-100 mx-1 hidden md:block" />
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex-1 min-w-[200px]">
                    <Globe size={13} className="text-blue-400 shrink-0" />
                    <span className="text-sm font-mono text-slate-700 truncate">{url || <span className="text-slate-400 italic">Set a URL in the top bar…</span>}</span>
                </div>
                <button onClick={handleAnalyze} disabled={!url || analyzing}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-teal-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap">
                    {analyzing ? <><Loader size={13} className="animate-spin" />Analyzing…</> : <><Code2 size={13} />Analyze DOM</>}
                </button>
                {error && <div className="bg-red-50 text-red-500 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"><XCircle size={11} />{error.slice(0, 55)}</div>}
                {result && (
                    <div className="flex items-center gap-4">
                        {[{ l: 'Elements', v: result.stats.total, c: '#6366f1' },
                        { l: 'Avg Stability', v: result.stats.avgStability + '%', c: stabColor(result.stats.avgStability) },
                        { l: 'High Risk', v: result.stats.highRisk, c: '#ef4444' }].map(m => (
                            <div key={m.l} className="text-center">
                                <p className="text-base font-black" style={{ color: m.c }}>{m.v}</p>
                                <p className="text-[9px] text-slate-400 font-semibold">{m.l}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Loading */}
            {analyzing && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                            className="w-14 h-14 rounded-full border-4 border-teal-100 border-t-teal-500" />
                        <p className="text-slate-500 font-bold text-sm">Scanning DOM structure…</p>
                        <p className="text-slate-400 text-xs">Computing selector stability scores</p>
                    </div>
                </div>
            )}

            {/* Empty */}
            {!analyzing && !result && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center max-w-md text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl flex items-center justify-center mb-5">
                            <GitBranch size={38} className="text-teal-300" />
                        </div>
                        <h3 className="text-base font-black text-slate-700 mb-2">DOM Element Intelligence</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Enter a URL to extract and score every interactive element. Inspectra detects dynamic IDs, hash classes, nth-child selectors, and recommends the most stable automation selector.</p>
                        <div className="mt-6 flex gap-2 flex-wrap justify-center">
                            {['data-testid', 'aria-label', '#stable-id', 'role', 'text', 'xpath'].map((s, i) => (
                                <span key={i} className="text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-500 px-2.5 py-1 rounded-lg shadow-sm">{s}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Split View */}
            {!analyzing && result && (
                <div className="flex-1 flex min-h-0 overflow-hidden">
                    {/* Left: Tree */}
                    <div className="w-[270px] shrink-0 border-r border-slate-100 flex flex-col bg-white overflow-hidden">
                        <div className="px-3 py-2.5 border-b border-slate-100 shrink-0">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">DOM Tree</p>
                            <p className="text-[9px] text-slate-400">Click nodes to inspect</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {result.tree && <TreeNode node={result.tree} depth={0} onSelect={setSelected} elements={result.elements} />}
                        </div>
                        <div className="border-t border-slate-100 px-3 py-2 flex gap-3 shrink-0">
                            {[{ l: 'Stable', c: '#10b981' }, { l: 'Fragile', c: '#f59e0b' }, { l: 'Risky', c: '#ef4444' }].map(l => (
                                <div key={l.l} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ background: l.c }} />
                                    <span className="text-[9px] font-semibold text-slate-400">{l.l}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Middle: Table */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                        <div className="bg-white border-b border-slate-100 px-4 py-2 flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                                <Search size={11} className="text-slate-400" />
                                <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                                    placeholder="Search…" className="text-xs bg-transparent outline-none w-32 text-slate-700" />
                            </div>
                            <select value={sortKey} onChange={e => setSortKey(e.target.value)}
                                className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none ml-auto">
                                <option value="stability">Risky first</option>
                                <option value="stability_desc">Stable first</option>
                                <option value="tag">By tag</option>
                            </select>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                                    <tr>
                                        {['Tag', 'Score', 'CSS Path', 'Dynamic', 'Recommended', 'Risk'].map(h => (
                                            <th key={h} className="px-3 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((el, i) => (
                                        <tr key={i} onClick={() => setSelected(el)}
                                            className={`border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${selected?.idx === el.idx ? 'bg-teal-50' : ''}`}>
                                            <td className="px-3 py-2">
                                                <code className="text-[11px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: tagColor(el.tag) + '22', color: tagColor(el.tag) }}>&lt;{el.tag}&gt;</code>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-1.5 rounded-full" style={{ width: `${el.stabilityScore}%`, background: stabColor(el.stabilityScore) }} />
                                                    </div>
                                                    <span className="font-black text-[11px]" style={{ color: stabColor(el.stabilityScore) }}>{el.stabilityScore}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 max-w-[140px]">
                                                <code className="text-[10px] text-slate-500 truncate block">{el.cssPath || '—'}</code>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex gap-1">
                                                    {el.hasDynamicId && <span className="text-[9px] bg-red-50 text-red-500 font-bold px-1.5 py-0.5 rounded-full">id</span>}
                                                    {el.hasDynamicClasses && <span className="text-[9px] bg-amber-50 text-amber-500 font-bold px-1.5 py-0.5 rounded-full">cls</span>}
                                                    {!el.hasDynamicId && !el.hasDynamicClasses && <span className="text-[9px] text-slate-300">—</span>}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 max-w-[160px]">
                                                {el.recommendedSelector ? (
                                                    <div>
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: SEL_BG[el.recommendedSelector.strength], color: SEL_COLOR[el.recommendedSelector.strength] }}>{el.recommendedSelector.label}</span>
                                                        <code className="block text-[10px] text-slate-600 truncate mt-0.5">{el.recommendedSelector.selector}</code>
                                                    </div>
                                                ) : <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: stabBg(el.stabilityScore), color: stabColor(el.stabilityScore) }}>{stabLabel(el.stabilityScore)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: Detail */}
                    <div className="w-[310px] shrink-0 border-l border-slate-100 bg-white overflow-hidden flex flex-col">
                        <ElementDetail element={selected} onClose={() => setSelected(null)} />
                    </div>
                </div>
            )}
        </div>
    );
}
