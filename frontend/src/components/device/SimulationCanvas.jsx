import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings2, SplitSquareHorizontal, Focus, Maximize2 } from 'lucide-react';
import ViewportSlider from './ViewportSlider';

const SimulationCanvas = ({ telemetry, targetUrl, activeView }) => {
    // 1. Initial Dimensions from activeView
    const parsedWidth = activeView ? parseInt(activeView.size.split('x')[0]) : 1024;
    const parsedHeight = activeView ? parseInt(activeView.size.split('x')[1]) || 800 : 800;

    // 2. Full interactive dimension state
    const [dim, setDim] = useState({ width: parsedWidth, height: parsedHeight });
    const [isDragging, setIsDragging] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);

    const iframeRef = useRef(null);

    // 3. Analytics & Telemetry Caching
    const [analysisCache, setAnalysisCache] = useState({});
    const [currentMetrics, setCurrentMetrics] = useState(activeView || telemetry.integrityMatrix[0]);

    // 4. Compare & Overlays
    const [compareMode, setCompareMode] = useState(false);
    const [compareWidth, setCompareWidth] = useState(390);
    const [overlays, setOverlays] = useState({
        overflow: false,
        touchViolations: false,
        collisions: false,
        layoutShifts: false,
        breakpoints: false
    });

    // ── SYNC ACTIVE MATRIX CLICK ──
    useEffect(() => {
        if (activeView) {
            let w = parseInt(activeView.size.split('x')[0]);
            let h = parseInt(activeView.size.split('x')[1]) || 800;
            if (isLandscape) {
                setDim({ width: h, height: w });
            } else {
                setDim({ width: w, height: h });
            }
        }
    }, [activeView, isLandscape]);

    // ── SMART RECALCULATION & DEBOUNCE ──
    useEffect(() => {
        if (isDragging) return;
        const key = `${dim.width}x${dim.height}`;
        const timeoutId = setTimeout(() => {
            if (analysisCache[key]) {
                setCurrentMetrics(analysisCache[key]);
            } else {
                // Mock heavy calculation triggering
                const newMetrics = {
                    ...currentMetrics,
                    overflow: dim.width < 768 ? Math.floor(Math.random() * 40) : 0,
                    cls: dim.width < 500 ? '0.12' : '0.00',
                    bpTriggers: dim.width < 1024 ? 4 : 2
                };
                setAnalysisCache(prev => ({ ...prev, [key]: newMetrics }));
                setCurrentMetrics(newMetrics);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [dim.width, dim.height, isDragging]);

    // ── OBSERVERS INTEGRATION ──
    const injectObservers = () => {
        try {
            const win = iframeRef.current?.contentWindow;
            if (!win) return;
            // Cross-origin safe access required, this acts as scaffolding for proxy setups
            const doc = iframeRef.current.contentDocument;

            if (win.ResizeObserver) {
                const resizeObserver = new win.ResizeObserver(() => {
                    console.log('Inner iframe layout changed - triggering analysis delta block');
                });
                resizeObserver.observe(doc.body);
            }
            if (win.MutationObserver) {
                const mutationObserver = new win.MutationObserver(() => {
                    console.log('Inner iframe DOM mutated - re-running element scan');
                });
                mutationObserver.observe(doc.body, { childList: true, subtree: true, attributes: true });
            }
        } catch (e) {
            // Silently catch cross-origin errors (CORS), expected unless proxied
        }
    };

    // ── ORIENTATION TOGGLE ──
    const toggleOrientation = () => {
        setIsLandscape(!isLandscape);
        setDim(prev => ({ width: prev.height, height: prev.width }));
    };

    // ── DRAG HANDLERS ──
    const handleResizeMouseDown = useCallback((e, direction) => {
        e.preventDefault();
        setIsDragging(true);
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = dim.width;
        const startHeight = dim.height;

        const onMouseMove = (moveEvent) => {
            let newWidth = startWidth;
            let newHeight = startHeight;
            if (direction === 'horizontal' || direction === 'both') {
                newWidth = Math.max(320, Math.min(2560, startWidth + (moveEvent.clientX - startX)));
            }
            if (direction === 'vertical' || direction === 'both') {
                newHeight = Math.max(320, Math.min(2000, startHeight + (moveEvent.clientY - startY)));
            }
            setDim({ width: newWidth, height: newHeight });
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            setIsDragging(false);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [dim]);

    const toggleOverlay = (key) => setOverlays(prev => ({ ...prev, [key]: !prev[key] }));

    return (
        <div className="bg-[#121a2f] border border-slate-800 flex flex-col relative w-full overflow-hidden flex-1 min-h-[600px]">
            {/* Header / Toolbar */}
            <div className="h-14 border-b border-slate-800 bg-[#0b101e] flex items-center justify-between px-4 shrink-0 overflow-x-auto scrollbar-none whitespace-nowrap z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <Focus size={12} /> Target Device
                        </span>
                        <span className="text-[12px] font-bold text-slate-300">{activeView?.class || 'Custom'}</span>
                    </div>

                    <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                        <span className="text-[10px] font-mono bg-slate-800/50 text-blue-400 px-2 py-0.5 rounded">
                            {dim.width}x{dim.height}
                        </span>
                        <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 border rounded ${currentMetrics?.stability === 'Weak' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                currentMetrics?.stability === 'Moderate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                            {currentMetrics?.stability || 'Strong'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                    {/* Overlays */}
                    <div className="flex items-center bg-[#1a233a] rounded border border-slate-800 p-0.5 mr-2">
                        {['overflow', 'touchViolations', 'collisions', 'layoutShifts', 'breakpoints'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => toggleOverlay(mode)}
                                className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-colors ${overlays[mode] ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                                    }`}
                                title={`Toggle ${mode} overlay`}
                            >
                                {mode.substring(0, 4)}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={toggleOrientation}
                        className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-wider transition-colors ${isLandscape ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                    >
                        {isLandscape ? 'Landscape' : 'Portrait'}
                    </button>
                    <button
                        onClick={() => setCompareMode(!compareMode)}
                        className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ml-1 ${compareMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                    >
                        <SplitSquareHorizontal size={12} /> {compareMode ? 'Exit Compare' : 'Compare'}
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-[#1a233a]/30 p-4 w-full overflow-auto relative rounded-b">
                <div className={`w-full min-h-max grid ${compareMode ? 'grid-cols-2 gap-4' : 'grid-cols-1 place-items-center'}`}>

                    {/* Primary Simulation Window */}
                    <div className="flex flex-col items-center transition-all duration-300 ease-out" style={compareMode ? { width: '100%' } : { width: `${dim.width}px` }}>
                        <div className="w-full bg-[#1e293b] border-t border-x border-slate-800 h-8 rounded-t-lg flex items-center px-4 justify-between shrink-0">
                            <div className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">Main DOM context</div>
                            <div className="text-[10px] font-mono text-blue-400 font-bold">{dim.width}x{dim.height}</div>
                        </div>

                        {/* Interactive Container bounds */}
                        <div
                            className="w-full bg-white border-x border-b border-slate-800 rounded-b-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] relative group transition-all duration-300 ease-out"
                            style={!compareMode ? { height: `${dim.height}px` } : { flex: 1, minHeight: '600px' }}
                        >
                            {/* The all-important actual interactive iframe layer */}
                            <iframe
                                ref={iframeRef}
                                src={targetUrl}
                                onLoad={injectObservers}
                                title="main-simulation"
                                className={`w-full h-full border-0 rounded-b-lg ${isDragging ? 'pointer-events-none' : ''}`}
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                            />

                            {/* Custom Resize Handles (Only show when not comparing) */}
                            {!compareMode && (
                                <>
                                    <div
                                        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-blue-500/50 z-20 group-hover:bg-blue-500/20 transition-colors"
                                        onMouseDown={(e) => handleResizeMouseDown(e, 'horizontal')}
                                    />
                                    <div
                                        className="absolute left-0 right-0 bottom-0 h-3 cursor-ns-resize hover:bg-blue-500/50 z-20 group-hover:bg-blue-500/20 transition-colors round-b-lg"
                                        onMouseDown={(e) => handleResizeMouseDown(e, 'vertical')}
                                    />
                                    <div
                                        className="absolute right-0 bottom-0 w-6 h-6 cursor-nwse-resize hover:bg-blue-500 bg-blue-500/40 z-30 flex items-center justify-center rounded-tl-lg"
                                        onMouseDown={(e) => handleResizeMouseDown(e, 'both')}
                                    >
                                        <Maximize2 size={12} className="text-white transform rotate-90" />
                                    </div>
                                </>
                            )}

                            {/* OVERLAYS (Canvas Layers logic) */}
                            {overlays.overflow && <div className="absolute inset-y-0 right-0 w-8 bg-red-500/20 border-l-2 border-red-500 animate-pulse mix-blend-multiply pointer-events-none z-10"></div>}
                            {overlays.touchViolations && <div className="absolute top-1/4 left-1/4 w-12 h-12 bg-orange-500/40 rounded-full animate-ping pointer-events-none mix-blend-multiply z-10"></div>}
                            {overlays.layoutShifts && <div className="absolute top-1/2 left-1/3 right-1/4 h-32 bg-yellow-400/20 border border-yellow-400/50 pointer-events-none mix-blend-multiply flex items-center justify-center text-yellow-600 font-bold text-2xl rotate-12 opacity-50 z-10">CLS DETECTED</div>}
                        </div>
                    </div>

                    {/* Compare Window */}
                    {compareMode && (
                        <div className="flex flex-col items-center h-full transition-all w-full duration-300 ease-out">
                            <div className="w-full bg-[#1e293b] border-t border-x border-slate-800 h-8 rounded-t-lg flex items-center px-4 justify-between shrink-0">
                                <div className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">Delta Secondary</div>
                                <select value={compareWidth} onChange={(e) => setCompareWidth(Number(e.target.value))} className="text-[10px] bg-transparent font-mono text-amber-400 font-bold outline-none cursor-pointer border px-1 py-0.5 border-slate-700 rounded hover:border-slate-500">
                                    <option value={320} className="bg-slate-800">320px</option>
                                    <option value={390} className="bg-slate-800">390px</option>
                                    <option value={768} className="bg-slate-800">768px</option>
                                    <option value={1024} className="bg-slate-800">1024px</option>
                                </select>
                            </div>
                            <div className="w-full flex-1 bg-white border-x border-b border-slate-800 rounded-b-lg overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col items-center">
                                <div style={{ width: '100%', height: '100%', maxWidth: `${compareWidth}px`, margin: '0 auto', backgroundColor: 'white' }}>
                                    <iframe src={targetUrl} title="delta-simulation" className="w-full h-full border-0 pointer-events-auto" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Live Layout Delta Inspector */}
            <div className={`absolute top-20 right-8 bg-[#0b101e]/90 backdrop-blur-sm border border-slate-700 p-4 rounded shadow-2xl z-50 pointer-events-none transition-opacity duration-300 ${isDragging ? 'opacity-50' : 'opacity-100'}`}>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Settings2 size={12} /> Live Delta Inspector
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px] font-mono">
                    <span className="text-slate-500">Target Width</span>
                    <span className="text-blue-400 font-bold text-right">{dim.width}px</span>

                    <span className="text-slate-500">Active MQ</span>
                    <span className="text-emerald-400 font-bold text-right">{dim.width > 1024 ? '1024px+' : dim.width > 768 ? '768px+' : 'Base'}</span>

                    <span className="text-slate-500">Scroll Δ px</span>
                    <span className="text-red-400 font-bold text-right">{currentMetrics?.overflow || 0}px</span>

                    <span className="text-slate-500">CLS Delta</span>
                    <span className="text-orange-400 font-bold text-right">{currentMetrics?.cls || '0.00'}</span>
                </div>
            </div>

            {/* Dynamic Viewport Slider component patching dim width strictly */}
            <ViewportSlider
                telemetry={telemetry}
                viewportWidth={dim.width}
                setViewportWidth={(w) => setDim(prev => ({ ...prev, width: w }))}
            />
        </div>
    );
};

export default SimulationCanvas;
