import { useState, useEffect, useRef, useCallback } from "react";
import TelemetryWorker from '../workers/telemetryWorker?worker';
import type { WorkerResponse } from '../workers/telemetryWorker';

interface OnBoardPageProps {
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

export default function OnBoardPage({ onCloseOnboardPage }: OnBoardPageProps) {
    const workerRef = useRef<Worker | null>(null);
    const [gForce, setGForce] = useState({ x: 0, y: 0 });
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isPressing, setIsPressing] = useState(false);
    const [needsPermission, setNeedsPermission] = useState(false);
    
    const [isCalibrated, setIsCalibrated] = useState(false);
    let base_x: number;
    let base_y: number;

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
        const worker = new TelemetryWorker();
        workerRef.current = worker;

        worker.postMessage({ 
            type: 'START_SESSION', 
            payload: { trackType: 'Circuit' } 
        });

        worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
            const message = e.data;
            if (message.type === 'UPDATE_STATS' && isCalibrated) {
                const { currentG } = message.payload;
                setGForce({
                    x: currentG.x * 20 - base_x,
                    y: currentG.y * 20 - base_y
                });
            } else if (message.type === 'UPDATE_STATS' && !isCalibrated) {
                const { currentG } = message.payload;
                base_x = currentG.x * 20;
                base_y = currentG.y * 20;
                setIsCalibrated(true);
            }
        };

        const explicitEvent = DeviceMotionEvent as unknown as DeviceMotionEventiOS;
        if (typeof explicitEvent.requestPermission === 'function') {
            setNeedsPermission(true);
        } else {
            window.addEventListener('devicemotion', handleMotion);
        }

        return () => {
            window.removeEventListener('devicemotion', handleMotion);
            worker.terminate();
            handleEndPress();
        };
    }, [handleMotion]);
    
    return (
        <div className='w-screen h-screen absolute flex flex-col z-40 bg-bg-1 cursor-pointer select-none transition-opacity duration-3000 ease-linear'
            style={{
                opacity: isPressing ? 0 : 1
            }}
            onMouseDown={handleStartPress}
            onMouseUp={handleEndPress}
            onMouseLeave={handleEndPress}
            onTouchStart={handleStartPress}
            onTouchEnd={handleEndPress}
        >
            {needsPermission && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-1/90 backdrop-blur-sm">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            requestPermission();
                        }}
                        className="px-8 py-4 border border-text-1 text-text-1 font-mono font-bold uppercase tracking-widest hover:bg-bg-hover-1 active:bg-bg-active-1"
                    >
                        Enable Sensors
                    </button>
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
                    <Timer value={"1:27:38"}/>
                    <TimerLabel label={"LAST LAP"}/>
                    <Timer value={"1:27:38"}/>
                    <TimerLabel label={"BEST LAP"}/>
                    <Timer value={"1:27:38"}/>
                </div>

                <div className="w-full h-[50%] flex items-center justify-center">
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