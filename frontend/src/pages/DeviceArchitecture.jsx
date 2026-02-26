import React from 'react';
import { useScanContext } from '../context/ScanContext';

import VulnerabilityPanel from '../components/device/VulnerabilityPanel';
import ArchitectureRadar from '../components/device/ArchitectureRadar';
import BreakpointMap from '../components/device/BreakpointMap';
import StressTimeline from '../components/device/StressTimeline';
import IntegrityMatrix from '../components/device/IntegrityMatrix';
import SimulationCanvas from '../components/device/SimulationCanvas';

const DeviceArchitecture = () => {
    const { scanResult } = useScanContext();

    // ── EXPANDED MOCK TELEMETRY (Refined for Advanced Intelligence) ──
    const mockTelemetry = {
        overallScore: 84,
        confidence: 94,
        systemStatus: 'NOMINAL',
        radar: { coverage: 92, layout: 78, touch: 85, performance: 88, breakpoints: 75 },
        breakpoints: [
            { width: 320, type: 'min-width', status: 'Redundant' },
            { width: 480, type: 'min-width', status: 'Active' },
            { width: 768, type: 'min-width', status: 'Active' },
            { width: 1024, type: 'max-width', status: 'Conflict' },
            { width: 1440, type: 'min-width', status: 'Active' }
        ],
        integrityMatrix: [
            { class: 'Small Phone', size: '360x800', score: 82, orientationScore: 80, interactionDensity: 'High', overflowSeverity: 'None', bpTriggers: 2, overflow: 0, wcag: 4, cls: 0.12, lcp: '1.2s', stability: 'Moderate' },
            { class: 'Standard Phone', size: '390x844', score: 88, orientationScore: 85, interactionDensity: 'Optimal', overflowSeverity: 'None', bpTriggers: 2, overflow: 0, wcag: 2, cls: 0.08, lcp: '1.1s', stability: 'Strong' },
            { class: 'Large Phone', size: '430x932', score: 92, orientationScore: 90, interactionDensity: 'Optimal', overflowSeverity: 'None', bpTriggers: 3, overflow: 0, wcag: 0, cls: 0.05, lcp: '1.0s', stability: 'Strong' },
            { class: 'Tablet Portrait', size: '768x1024', score: 64, orientationScore: 45, interactionDensity: 'Crowded', overflowSeverity: 'Critical', bpTriggers: 4, overflow: 45, wcag: 1, cls: 0.22, lcp: '1.8s', stability: 'Weak' },
            { class: 'Tablet Landscape', size: '1024x768', score: 71, orientationScore: 68, interactionDensity: 'Optimal', overflowSeverity: 'Minor', bpTriggers: 5, overflow: 0, wcag: 0, cls: 0.18, lcp: '1.5s', stability: 'Moderate' },
            { class: 'Laptop 13"', size: '1280x800', score: 95, orientationScore: 95, interactionDensity: 'Spacious', overflowSeverity: 'None', bpTriggers: 6, overflow: 0, wcag: 0, cls: 0.02, lcp: '0.8s', stability: 'Strong' },
            { class: 'Desktop 1080p', size: '1920x1080', score: 98, orientationScore: 98, interactionDensity: 'Spacious', overflowSeverity: 'None', bpTriggers: 7, overflow: 0, wcag: 0, cls: 0.01, lcp: '0.7s', stability: 'Strong' },
            { class: 'Ultrawide', size: '2560x1440', score: 89, orientationScore: 98, interactionDensity: 'Spacious', overflowSeverity: 'None', bpTriggers: 8, overflow: 0, wcag: 0, cls: 0.01, lcp: '0.9s', stability: 'Moderate' }
        ],
        timeline: [
            { time: '0ms', event: 'Initial Construct Render', status: 'info' },
            { time: '140ms', event: 'Orientation Switch: Portrait -> Landscape', status: 'info' },
            { time: '340ms', event: 'MQ Evaluator: Triggered min-width 768px', status: 'info' },
            { time: '820ms', event: 'Layout Shift Delta: 0.22 (Warning)', status: 'warn' },
            { time: '1.1s', event: 'Container Query "@container" not detected', status: 'warn' },
            { time: '1.4s', event: 'Interactive Target Density Collision', status: 'error' },
            { time: '1.9s', event: 'Horizontal Scroll Trap Detected (768px)', status: 'error' },
            { time: '2.1s', event: 'Main Thread Unblocked', status: 'info' }
        ],
        vulnerableViewport: '768px (Structural Threshold Conflict)',
        advanced: {
            orientationStabilityIndex: 78,
            containerQueryDetected: false,
            interactionCollisionCount: 12,
            scrollStabilityScore: 65,
            breakpointOptimizationScore: 82,
            responsiveRiskClass: 'Semi-Adaptive'
        }
    };

    const telemetry = scanResult?.pages?.[0]?.deviceReport || mockTelemetry;
    const [activeView, setActiveView] = React.useState(mockTelemetry.integrityMatrix[1]);
    const targetUrl = scanResult?.url || '';

    return (
        <div className="bg-[#0f172a] min-h-screen w-full text-slate-300 font-sans p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
            <h1 className="text-[26px] font-black tracking-tight text-white uppercase drop-shadow-md pb-4 border-b border-slate-800/80 shrink-0">
                Device Architecture Intelligence
            </h1>

            {/* ── SECTION 1: TOP INTELLIGENCE ROW (3 CARDS HORIZONTAL) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
                <VulnerabilityPanel telemetry={telemetry} />
                <ArchitectureRadar telemetry={telemetry} />

                {/* Responsive Risk Classification Card */}
                <div className="bg-[#121a2f] border border-slate-800 p-6 flex flex-col shrink-0">
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Responsive Risk Classification</h3>
                    <div className="flex items-center justify-between mb-5 pb-5 border-b border-slate-800/80">
                        <span className="text-[18px] font-bold text-amber-400 uppercase tracking-widest">{telemetry.advanced.responsiveRiskClass}</span>
                        <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-1 ml-2 whitespace-nowrap">LEGACY MQ BLOCKS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-3 font-mono text-[11px] mt-auto">
                        <div className="flex flex-col">
                            <span className="text-slate-500 uppercase mb-1 flex items-center gap-1">Orient. Stabil</span>
                            <span className="text-emerald-400 font-bold">{telemetry.advanced.orientationStabilityIndex}%</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 uppercase mb-1">Scroll Integ</span>
                            <span className="text-amber-400 font-bold">{telemetry.advanced.scrollStabilityScore}%</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 uppercase mb-1">@container</span>
                            <span className="text-red-400 font-bold">{telemetry.advanced.containerQueryDetected ? 'TRUE' : 'FALSE'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 uppercase mb-1">Collisions</span>
                            <span className="text-orange-400 font-bold">{telemetry.advanced.interactionCollisionCount} Flags</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SECTION 2: BREAKPOINT GRAPH ── */}
            <div className="shrink-0">
                <BreakpointMap telemetry={telemetry} />
            </div>

            {/* ── SECTION 3: CROSS-DEVICE INTEGRITY MATRIX ── */}
            <div className="shrink-0">
                <IntegrityMatrix telemetry={telemetry} activeView={activeView} setActiveView={setActiveView} />
            </div>

            {/* ── SECTION 4: MAIN DOM CONTEXT ── */}
            <div className="flex-1 min-h-[600px] flex flex-col">
                <SimulationCanvas telemetry={telemetry} targetUrl={targetUrl} activeView={activeView} />
            </div>

        </div>

    );
};

export default DeviceArchitecture;
