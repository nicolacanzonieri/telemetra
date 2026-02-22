import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";
import HeaderButton from "../components/HeaderButton";

interface DatabaseBrowserPageProps {
    onClose: () => void;
}

export default function DatabaseBrowserPage({ onClose }: DatabaseBrowserPageProps) {
    const [inspectedSessionId, setInspectedSessionId] = useState<number | null>(null);

    const tracks = useLiveQuery(() => db.tracks.toArray());
    const sessions = useLiveQuery(() => db.sessions.orderBy('date').reverse().toArray());
    const samplesCount = useLiveQuery(() => db.samples.count());
    
    const selectedSamples = useLiveQuery(
        () => inspectedSessionId 
            ? db.samples.where('sessionId').equals(inspectedSessionId).toArray() 
            : [],
        [inspectedSessionId]
    );

    const formatTime = (ms: number | null) => {
        if (!ms) return "--:--:---";
        const min = Math.floor(ms / 60000);
        const sec = Math.floor((ms % 60000) / 1000);
        const m = Math.floor(ms % 1000);
        return `${min}:${sec.toString().padStart(2, '0')}:${m.toString().padStart(3, '0')}`;
    };

    return (
        <div className="w-screen h-screen absolute flex flex-col z-50 bg-bg-1 overflow-hidden">
            {/* HEADER */}
            <div className="h-header-h flex flex-row items-center justify-between px-p-md bg-bg-1 border-b border-border-1">
                <div className="flex items-center gap-4">
                    {inspectedSessionId && (
                        <button onClick={() => setInspectedSessionId(null)} className="text-text-2 uppercase font-mono text-xs border border-border-1 px-2 py-1">
                            Back
                        </button>
                    )}
                    <span className="text-text-1 font-mono font-bold tracking-widest uppercase">
                        {inspectedSessionId ? `Session ${inspectedSessionId}` : "Inspect DB"}
                    </span>
                </div>
                <HeaderButton onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-icon-1"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </HeaderButton>
            </div>

            <div className="flex-1 overflow-y-auto p-p-md no-scrollbar">
                
                {/* VISTA LISTA (Default) */}
                {!inspectedSessionId && (
                    <div className="space-y-10">
                        <section>
                            <h2 className="text-text-2 font-mono text-xs mb-4 tracking-widest uppercase opacity-60">Tracks</h2>
                            <div className="grid grid-cols-1 gap-2">
                                {tracks?.map(t => (
                                    <div key={t.id} className="border border-border-1/30 p-3 font-mono text-[10px] text-text-1 flex justify-between">
                                        <span>{t.name}</span>
                                        <span className="opacity-50 uppercase">{t.type}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-text-2 font-mono text-xs mb-4 tracking-widest uppercase opacity-60">Sessions (Tap to view samples)</h2>
                            <div className="space-y-2">
                                {sessions?.map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => setInspectedSessionId(s.id!)}
                                        className="border border-border-1 p-3 font-mono text-xs text-text-1 active:bg-bg-active-1 cursor-pointer transition-colors"
                                    >
                                        <div className="flex justify-between font-bold mb-1">
                                            <span>{s.trackName}</span>
                                            <span className="text-text-2">{formatTime(s.bestLapTime)}</span>
                                        </div>
                                        <div className="flex justify-between opacity-50 text-[10px]">
                                            <span>{new Date(s.date).toLocaleTimeString()} - {new Date(s.date).toLocaleDateString()}</span>
                                            <span>ID: {s.id}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="pb-10">
                            <h2 className="text-text-2 font-mono text-xs mb-4 tracking-widest uppercase opacity-60">System</h2>
                            <div className="border border-border-1/20 p-4 font-mono text-center">
                                <div className="text-2xl text-text-1">{samplesCount?.toLocaleString() || 0}</div>
                                <div className="text-[9px] text-text-2 tracking-[0.3em] uppercase mt-1">Total Samples</div>
                            </div>
                        </section>
                    </div>
                )}

                {/* VISTA SAMPLES (Drill-down) */}
                {inspectedSessionId && (
                    <div className="w-full">
                        <div className="mb-4 flex justify-between items-end">
                            <h2 className="text-text-2 font-mono text-xs tracking-widest uppercase">Telemetry Stream</h2>
                            <span className="text-[10px] font-mono text-text-1 opacity-50">{selectedSamples?.length} Points</span>
                        </div>
                        
                        <div className="w-full overflow-x-auto">
                            <table className="w-full font-mono text-[9px] text-text-1 border-collapse">
                                <thead>
                                    <tr className="border-b border-border-1 text-text-2 text-left">
                                        <th className="p-1 uppercase">Time</th>
                                        <th className="p-1 uppercase">Lat</th>
                                        <th className="p-1 uppercase">Lng</th>
                                        <th className="p-1 uppercase text-right">km/h</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSamples?.map((sample, idx) => (
                                        <tr key={idx} className="border-b border-border-1/10">
                                            <td className="p-1">{new Date(sample.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                                            <td className="p-1">{sample.lat.toFixed(6)}</td>
                                            <td className="p-1">{sample.lng.toFixed(6)}</td>
                                            <td className="p-1 text-right text-text-2">{(sample.speed * 3.6).toFixed(1)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {selectedSamples?.length === 0 && (
                            <div className="text-center py-20 font-mono text-xs opacity-30 uppercase">No samples for this session</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}