import { useState, useEffect, useRef, useCallback } from "react";
import TelemetryWorker from '../workers/telemetryWorker?worker';
import type { WorkerResponse } from '../workers/telemetryWorker';
import { db, type Gate } from "../db/database.ts";

interface OnBoardPageProps {
    startGate: Gate | null;
    finishGate: Gate | null;
    onCloseOnboardPage: () => void;
}

interface TimerProps {
    value: string;
}

interface TimerLabelProps {
    label: string;
}

interface DeviceMotionEventiOS extends DeviceMotionEvent {
    requestPermission?: () => Promise<'granted' | 'denied'>;
}

function TimerLabel({label}: TimerLabelProps) {
    return (
        <span className="text-xl font-bold font-mono tracking-widest uppercase text-text-1">
            {label}
        </span>
    );
}

function Timer({value}: TimerProps) {
    return (
        <span className="text-[45px] font-bold font-mono tracking-widest uppercase text-text-1">
            {value}
        </span>
    );
}

function formatMs(ms: number) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milli = Math.floor(ms % 1000);

    return {
        // padStart aggiunge lo zero iniziale se la cifra è singola
        minStr: minutes.toString().padStart(2, '0'),
        secStr: seconds.toString().padStart(2, '0'),
        milliStr: milli.toString().padStart(3, '0'),
        total: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milli.toString().padStart(3, '0')}`
    };
}

// @ts-ignore
export default function OnBoardPage({ startGate, finishGate, onCloseOnboardPage }: OnBoardPageProps) {
    const [needsPermission, setNeedsPermission] = useState(false);
    const [calibrateState, setCalibrateState] = useState(false);
    const isCalibratedRef = useRef(false);
    const calibratedRef = useRef({x: 0, y: 0});
    const [isPressing, setIsPressing] = useState(false);
    const workerRef = useRef<Worker | null>(null);
    const [gForce, setGForce] = useState({ x: 0, y: 0 });
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    const sessionId = Date.now().toString();
    const [liveLapMs, setLiveLapMs] = useState<number>(0);
    const [lastLapTime, setLastLapTime] = useState<number>(0);
    const lapStartTimeRef = useRef<number | null>(null);
    const requestRef = useRef<number>(null);
    
    // DEBUG PURPOSE ONLY
    const [showDebug, _setShowDebug] = useState(false);
    const [posLan, setPosLan] = useState<number>();
    const [posLng, setPosLng] = useState<number>();
    const [accuracy, setAccuracy] = useState<number>();

    const animate = useCallback(() => {
        if (lapStartTimeRef.current !== null) {
            const now = Date.now();
            setLiveLapMs(now - lapStartTimeRef.current);
        }
        requestRef.current = requestAnimationFrame(animate);
    }, []);
    
    const handleStartPress = () => {
        setIsPressing(true);
        timerRef.current = window.setTimeout(() => {
            if (onCloseOnboardPage) {
                onCloseOnboardPage();
            }
        }, 3000);
    };

    const handleEndPress = () => {
        setIsPressing(false);
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

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
        
        // Check if the requestPermission method exists in the current browser
        if (typeof explicitEvent.requestPermission === 'function') {
            try {
                const permissionState = await explicitEvent.requestPermission();
                if (permissionState === 'granted') {
                    setNeedsPermission(false);
                    window.addEventListener('devicemotion', handleMotion);
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [animate]);

    useEffect(() => {
        const worker = new TelemetryWorker();
        workerRef.current = worker;

        worker.postMessage({ 
            type: 'START_SESSION', 
            payload: { 
                trackType: 'Circuit', 
                startGate: startGate,
                finishGate: finishGate
            } 
        });

        worker.onmessage = async (e: MessageEvent<WorkerResponse | {type: 'SAVE_BATCH', payload: any[]}>) => {
            const data = e.data;

            switch (data.type) {
                case 'UPDATE_STATS':
                    if (isCalibratedRef.current) {
                        const { currentG } = data.payload;
                        setGForce({
                            x: (currentG.x - calibratedRef.current.x) * 20,
                            y: (currentG.y - calibratedRef.current.y) * -20
                        });
                    } else {
                        const { currentG } = data.payload;
                        calibratedRef.current.x = currentG.x;
                        calibratedRef.current.y = currentG.y;
                    }
                    break;

                case 'SAVE_BATCH':
                    try {
                        await db.samples.bulkAdd(data.payload);
                    } catch (err) {
                        console.error("Error while saving the batch:", err);
                    }
                    break;

                case 'STARTING_LAP':
                    lapStartTimeRef.current = data.payload.startTime;
                    break;

                case 'LAP_COMPLETED':
                    const totalMs = data.payload.lapTime; 

                    setLastLapTime(totalMs);
                    lapStartTimeRef.current = Date.now(); 
                    
                    const sessionLapCompleted = await db.sessions.get(sessionId);
                    if (!sessionLapCompleted?.bestLapTime || data.payload.lapTime < sessionLapCompleted.bestLapTime) {
                        await db.sessions.update(sessionId, { bestLapTime: data.payload.lapTime });
                    }
                    break;

                default:
                    console.warn("Worker message not recognized:", data);
                    break;
            }
        };

        const explicitEvent = DeviceMotionEvent as unknown as DeviceMotionEventiOS;
        if (typeof explicitEvent.requestPermission === 'function') {
            setNeedsPermission(true);
        } else {
            window.addEventListener('devicemotion', handleMotion);
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setPosLan(position.coords.latitude);
                setPosLng(position.coords.longitude);
                setAccuracy(position.coords.accuracy);
                worker.postMessage({
                    type: 'GPS_DATA',
                    payload: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        speed: position.coords.speed || 0,
                        timestamp: position.timestamp
                    }
                });
            },
            (error) => console.error("Error GPS:", error),
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
            window.removeEventListener('devicemotion', handleMotion);
            worker.terminate();
            handleEndPress();
        };
    }, [handleMotion]);

    return (
        <div 
            className='w-screen h-screen absolute bg-bg-1 z-40 cursor-pointer select-none transition-opacity duration-3000 ease-linear' 
            style={{opacity: isPressing ? 0 : 1}}
            onMouseDown={handleStartPress}
            onMouseUp={handleEndPress}
            onMouseLeave={handleEndPress}
            onTouchStart={handleStartPress}
            onTouchEnd={handleEndPress}
        >

            {/* PERMISSION MODAL */}
            { needsPermission && (
                <div className="w-full h-full fixed flex items-center justify-center z-30 bg-bg-1">
                    <button className="px-8 py-4 border border-text-1 text-text-1 font-mono font-bold uppercase tracking-widest hover:bg-bg-hover-1 active:bg-bg-active-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            requestPermission();
                        }}
                    >
                        Enable Sensors
                    </button>
                </div>
            )}

            {/* CALIBRATE SENSORS MODAL */}
            { !calibrateState && (
                <div className="w-full h-full fixed flex items-center justify-center z-20 bg-bg-1">
                    <button className="px-8 py-4 border border-text-1 text-text-1 font-mono font-bold uppercase tracking-widest hover:bg-bg-hover-1 active:bg-bg-active-1"
                        onClick={() => {
                            setCalibrateState(true);
                            isCalibratedRef.current = true;
                        }}
                    >
                        Calibrate sensors
                    </button>
                </div>
            )}

            {/* DEBUG MODAL */}
            { showDebug && (
                <div className="w-full h-full fixed flex flex-col items-center justify-center z-10 bg-bg-1/70" onClick={() => _setShowDebug(false)}>
                    <span className="text-text-1">G-Force:</span>
                    <span className="text-text-1">{gForce.x}</span>
                    <span className="text-text-1">{gForce.y}</span>
                    <br></br>
                    <span className="text-text-1">Position:</span>
                    <span className="text-text-1">{posLan}</span>
                    <span className="text-text-1">{posLng}</span>
                    <span className="text-text-1">{accuracy}</span>
                </div>
            )}

            <div className="w-full h-22 bg-red-500 flex flex-row items-center justify-center">
                <span className="text-[50px] font-bold font-mono tracking-widest uppercase text-text-1">
                    +0.753
                </span>
            </div>
            
            <div className="w-full flex-1">
                <div className="w-full h-[50%] flex flex-col items-start justify-start p-p-s">
                    <TimerLabel label={"LIVE"}/>
                    <Timer value={formatMs(liveLapMs).total}/>
                    <TimerLabel label={"LAST LAP"}/>
                    <Timer value={formatMs(lastLapTime).total}/>
                    <TimerLabel label={"BEST LAP"}/>
                    <Timer value={"00:00:000"}/>
                </div>

                <div className="w-full h-[30%] flex items-center justify-center">
                    <div className="relative w-64 h-64 flex items-center justify-center pointer-events-none">
                        <div className="absolute w-full h border border-neutral-700"></div>
                        <div className="absolute h-full w border border-neutral-700"></div>
                        <div className="absolute w-32 h-32 border border-neutral-400 rounded-full"></div>
                        <div className="absolute w-64 h-64 border border-neutral-400 rounded-full"></div>
                        <span className="absolute top-0 text-[10px] text-text-1 font-mono">LONG</span>
                        <span className="absolute right-0 text-[10px] text-text-1 font-mono">LAT</span>
                        <div 
                            className="w-6 h-6 bg-ball rounded-full shadow-[0_0_25px_rgba(255,255,255,0.8)] z-10 transition-transform duration-75 ease-out"
                            style={{ 
                                transform: `translate(${gForce.x}px, ${gForce.y}px)` 
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}