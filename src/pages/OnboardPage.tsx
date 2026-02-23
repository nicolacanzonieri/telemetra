import { useState, useEffect, useRef, useCallback } from "react";
import TelemetryWorker from '../workers/telemetryWorker?worker';
import { db, type Gate } from "../db/database.ts";

/**
 * ONBOARD PAGE (DASHBOARD)
 * Responsibilities:
 * 1. Orchestrates the Telemetry Web Worker lifecycle.
 * 2. Manages high-frequency UI updates (G-Force, Delta, Timers).
 * 3. Handles hardware permissions and sensor calibration.
 * 4. Persists lap timing data to IndexedDB.
 */

interface OnBoardPageProps {
    trackName: string;
    startGate: Gate | null;
    finishGate: Gate | null;
    onCloseOnboardPage: () => void;
}

interface DeviceMotionEventiOS extends DeviceMotionEvent {
    requestPermission?: () => Promise<'granted' | 'denied'>;
}

// --- SUB-COMPONENTS ---

const TimerLabel = ({ label }: { label: string }) => (
    <span className="text-xl font-bold font-mono tracking-widest uppercase text-text-1">
        {label}
    </span>
);

const Timer = ({ value }: { value: string }) => (
    <span className="text-[45px] font-bold font-mono tracking-widest uppercase text-text-1">
        {value}
    </span>
);

/**
 * Visual Delta Bar: Green (left) for gain, Red (right) for loss.
 * Normalizes a +/- 2.0s range for the visualization.
 */
function DeltaBar({ delta }: { delta: number }) {
    const clampedDelta = Math.max(-2, Math.min(2, delta));
    const percentage = Math.abs(clampedDelta) / 2 * 100;
    const isFaster = delta <= 0;

    return (
        <div className="w-full h-12 bg-neutral-900 relative overflow-hidden border-y border-border-1/20">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white z-10"></div>
            <div 
                className={`absolute top-0 bottom-0 transition-all duration-100 ${isFaster ? 'bg-green-500' : 'bg-red-500'}`}
                style={{
                    left: isFaster ? `${50 - percentage / 2}%` : '50%',
                    right: isFaster ? '50%' : `${50 - percentage / 2}%`,
                    width: `${percentage / 2}%`
                }}
            />
            <div className="absolute inset-0 flex items-center justify-center mix-blend-difference font-mono font-bold text-2xl text-white">
                {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
            </div>
        </div>
    );
}

// --- UTILS ---

function formatMs(ms: number) {
    if (ms === 0) return "00:00:000";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milli = Math.floor(ms % 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milli.toString().padStart(3, '0')}`;
}

export default function OnBoardPage({ trackName, startGate, finishGate, onCloseOnboardPage }: OnBoardPageProps) {
    // --- STATE & REFS ---
    const [needsPermission, setNeedsPermission] = useState(false);
    const [calibrateState, setCalibrateState] = useState(false);
    const [isPressing, setIsPressing] = useState(false);
    const [gForce, setGForce] = useState({ x: 0, y: 0 });
    const [liveLapMs, setLiveLapMs] = useState(0);
    const [lastLapTime, setLastLapTime] = useState(0);
    const [bestLapTime, setBestLapTime] = useState(0);
    const [delta, setDelta] = useState(0);
    const [_sampleCount, setSampleCount] = useState(0);

    const workerRef = useRef<Worker | null>(null);
    const isCalibratedRef = useRef(false);
    const calibratedRef = useRef({ x: 0, y: 0 });
    const lapStartTimeRef = useRef<number | null>(null);
    const requestRef = useRef<number>(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lapCounter = useRef(1); 
    const sessionId = useRef(Date.now()).current;
    const bestLapTimeRef = useRef<number>(0); 

    // --- LOGIC: DATA PREPARATION ---

    /**
     * Searches for the best lap in history for this track to provide Delta comparison.
     */
    const prepareReferenceLap = async (tName: string) => {
        const bestSession = await db.sessions
            .where('trackName').equals(tName)
            .filter(s => s.bestLapTime !== null && s.bestLapTime > 0) // Ensure valid time
            .sortBy('bestLapTime');

        if (bestSession.length === 0) return null;
        const session = bestSession[0];
        
        const sessionBestTime = session.bestLapTime || 0;
        setBestLapTime(sessionBestTime);
        bestLapTimeRef.current = sessionBestTime; // Sync ref

        const bestLapRecord = await db.laps
            .where({ sessionId: session.id, isBest: true })
            .first();

        if (!bestLapRecord) return null;

        const allSamples = await db.samples.where('sessionId').equals(session.id!).toArray();
        if (allSamples.length === 0) return null;

        const targetLapSamples = [];
        let currentLapIdx = 1;
        
        for (let i = 1; i < allSamples.length; i++) {
            const prev = allSamples[i-1];
            const curr = allSamples[i];

            if (curr.distance < prev.distance && prev.distance > 100) {
                currentLapIdx++;
            }

            if (currentLapIdx === bestLapRecord.lapNumber) {
                targetLapSamples.push(curr);
            }
        }

        if (targetLapSamples.length === 0) return null;

        const startT = targetLapSamples[0].timestamp;
        return targetLapSamples.map(s => ({
            distance: s.distance,
            time: s.timestamp - startT
        }));
    };

    // --- LOGIC: SENSORS & ANIMATION ---

    const animate = useCallback(() => {
        if (lapStartTimeRef.current !== null) {
            setLiveLapMs(Date.now() - lapStartTimeRef.current);
        }
        requestRef.current = requestAnimationFrame(animate);
    }, []);

    const handleMotion = useCallback((event: DeviceMotionEvent) => {
        if (event.accelerationIncludingGravity && workerRef.current) {
            workerRef.current.postMessage({
                type: 'SENSOR_DATA',
                payload: {
                    accel: {
                        x: event.accelerationIncludingGravity.x,
                        y: event.accelerationIncludingGravity.y,
                        z: event.accelerationIncludingGravity.z
                    },
                    timestamp: Date.now()
                }
            });
        }
    }, []);

    const requestPermission = async () => {
        const explicitEvent = DeviceMotionEvent as unknown as DeviceMotionEventiOS;
        if (typeof explicitEvent.requestPermission === 'function') {
            const state = await explicitEvent.requestPermission();
            if (state === 'granted') {
                setNeedsPermission(false);
                window.addEventListener('devicemotion', handleMotion);
            }
        }
    };

    // --- LIFECYCLE: WORKER & SESSION INITIALIZATION ---

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);

        const init = async () => {
            // 1. Create session entry
            await db.sessions.add({ 
                id: sessionId, 
                date: Date.now(), 
                trackName, 
                trackType: 'Circuit', 
                bestLapTime: null 
            });

            // 2. Spawn Telemetry Worker
            const worker = new TelemetryWorker();
            workerRef.current = worker;

            // 3. Load Reference Data for Delta Bar
            const refSamples = await prepareReferenceLap(trackName);
            
            if (refSamples && refSamples.length > 0) {
                console.log("Reference Lap Loaded:", refSamples.length, "samples");
                worker.postMessage({ type: 'SET_REFERENCE_LAP', payload: { samples: refSamples } });
            } else {
                console.log("No Reference Lap found (First run or logic error)");
            }

            // 4. Start Session
            worker.postMessage({ 
                type: 'START_SESSION', 
                payload: { sessionId, trackName, trackType: 'Circuit', startGate, finishGate } 
            });

            // 5. Worker Message Routing
            worker.onmessage = async (e: MessageEvent<any>) => {
                const { type, payload } = e.data;

                switch (type) {
                    case 'UPDATE_STATS':
                        // G-Force Coordinate Mapping (Inverted Y for "pull" effect)
                        if (isCalibratedRef.current) {
                            setGForce({
                                x: (payload.currentG.x - calibratedRef.current.x) * 20,
                                y: (payload.currentG.y - calibratedRef.current.y) * -20
                            });
                        } else {
                            calibratedRef.current = { x: payload.currentG.x, y: payload.currentG.y };
                        }
                        setDelta(payload.delta || 0);
                        break;

                    case 'SAVE_BATCH':
                        await db.samples.bulkAdd(payload);
                        setSampleCount(prev => prev + payload.length);
                        break;

                    case 'STARTING_LAP':
                        lapStartTimeRef.current = payload.startTime;
                        break;
                    case 'LAP_COMPLETED':
                        const time = payload.lapTime;
                        setLastLapTime(time);
                        lapStartTimeRef.current = Date.now();
                        
                        const currentBest = bestLapTimeRef.current;
                        const isNewBest = currentBest === 0 || time < currentBest;
                        
                        console.log(`Lap ${lapCounter.current} Done: ${time}ms. Best was: ${currentBest}. Is New Best? ${isNewBest}`);

                        // Persistent Lap Storage
                        await db.laps.add({ sessionId, lapNumber: lapCounter.current++, timeMs: time, isBest: isNewBest });

                        if (isNewBest) {
                            setBestLapTime(time);
                            bestLapTimeRef.current = time; // Aggiorna il ref immediatamente
                            await db.sessions.update(sessionId, { bestLapTime: time });
                        }
                        break;
                }
            };
        };

        init();

        // 6. Sensor Authorization Handling
        const explicitEvent = DeviceMotionEvent as unknown as DeviceMotionEventiOS;
        if (typeof explicitEvent.requestPermission === 'function') {
            setNeedsPermission(true);
        } else {
            window.addEventListener('devicemotion', handleMotion);
        }

        // 7. GPS Stream
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                workerRef.current?.postMessage({ 
                    type: 'GPS_DATA', 
                    payload: { 
                        lat: pos.coords.latitude, 
                        lng: pos.coords.longitude, 
                        speed: pos.coords.speed || 0, 
                        timestamp: pos.timestamp 
                    } 
                });
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 0, timeout: 1000 } // FIX: Timeout ridotto per più reattività
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
            window.removeEventListener('devicemotion', handleMotion);
            cancelAnimationFrame(requestRef.current);
            workerRef.current?.terminate();
        };
    }, [handleMotion, trackName]); // Dependencies

    // --- UI INTERACTION ---

    const handleExitPressStart = () => {
        setIsPressing(true);
        timerRef.current = setTimeout(onCloseOnboardPage, 2500);
    };

    const handleExitPressEnd = () => {
        setIsPressing(false);
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    return (
        <div 
            className="w-screen h-screen absolute bg-bg-1 z-40 cursor-pointer select-none transition-opacity duration-1000" 
            style={{ opacity: isPressing ? 0.3 : 1 }}
            onMouseDown={handleExitPressStart}
            onMouseUp={handleExitPressEnd}
            onTouchStart={handleExitPressStart}
            onTouchEnd={handleExitPressEnd}
        >
            {/* OVERLAYS */}
            {needsPermission && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-bg-1">
                    <button onClick={requestPermission} className="px-8 py-4 border border-border-1 text-text-1 font-mono uppercase tracking-widest">Enable Sensors</button>
                </div>
            )}

            {!calibrateState && (
                <div className="fixed inset-0 flex items-center justify-center z-40 bg-bg-1">
                    <button 
                        onClick={() => { 
                            setCalibrateState(true); 
                            isCalibratedRef.current = true;
                            // SYNC BIAS WITH WORKER
                            workerRef.current?.postMessage({ type: 'SET_CALIBRATION', payload: { biasY: calibratedRef.current.y } });
                        }} 
                        className="px-8 py-4 border border-border-1 text-text-1 font-mono uppercase tracking-widest"
                    >
                        Calibrate Bias
                    </button>
                </div>
            )}

            <DeltaBar delta={delta} />
            
            <div className="w-full flex-1 flex flex-col p-p-md overflow-hidden">
                <div className="flex flex-col flex-1 gap-4">
                    <div className="flex flex-col"><TimerLabel label="Live" /><Timer value={formatMs(liveLapMs)} /></div>
                    <div className="flex flex-col opacity-60"><TimerLabel label="Last Lap" /><Timer value={formatMs(lastLapTime)} /></div>
                    <div className="flex flex-col text-text-2"><TimerLabel label="Best Lap" /><Timer value={formatMs(bestLapTime)} /></div>
                </div>

                <div className="w-full h-[35%] flex items-center justify-center relative">
                    <div className="relative w-56 h-56 flex items-center justify-center">
                        <div className="absolute w-full h-px bg-neutral-800" /><div className="absolute h-full w-px bg-neutral-800" />
                        <div className="absolute w-32 h-32 border border-neutral-700 rounded-full" /><div className="absolute w-full h-full border border-neutral-600 rounded-full" />
                        <div className="w-6 h-6 bg-white rounded-full shadow-[0_0_20px_white] transition-transform duration-75 ease-out z-10" style={{ transform: `translate(${gForce.x}px, ${gForce.y}px)` }} />
                    </div>
                </div>
            </div>
        </div>
    );
}