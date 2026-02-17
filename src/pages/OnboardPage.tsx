import { useState, useEffect, useRef } from "react";

interface OnBoardPageProps {
    onCloseOnboardPage: () => void;
}

interface TimerProps {
    value: string;
}

interface TimerLabelProps {
    label: string;
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
    const [gForce, setGForce] = useState({ x: 0, y: 0 });
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isPressing, setIsPressing] = useState(false);

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

    useEffect(() => {
        let frameId: number;
        const animate = () => {
            const x = Math.sin(Date.now() / 400) * 40;
            const y = Math.cos(Date.now() / 600) * 40;
            setGForce({ x, y });
            frameId = requestAnimationFrame(animate);
        };
        frameId = requestAnimationFrame(animate);
        
        return () => {
            cancelAnimationFrame(frameId);
            handleEndPress();
        };
    }, []);

    return (
        <div className='w-screen h-screen absolute flex flex-col z-40 bg-bg-1 cursor-pointer select-none transition-opacity duration-[3000ms] ease-linear'
            style={{
                opacity: isPressing ? 0 : 1
            }}
            onMouseDown={handleStartPress}
            onMouseUp={handleEndPress}
            onMouseLeave={handleEndPress}
            onTouchStart={handleStartPress}
            onTouchEnd={handleEndPress}
        >
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

                <div className="w-full h-[50%] flex items-center justify-center bg-zinc-900/20 border-l border-zinc-900">
                    <div className="relative w-64 h-64 flex items-center justify-center pointer-events-none">
                        <div className="absolute w-full h border border-neutral-700"></div>
                        <div className="absolute h-full w border border-neutral-700"></div>
                        <div className="absolute w-32 h-32 border border-neutral-400 rounded-full"></div>
                        <div className="absolute w-64 h-64 border border-neutral-400 rounded-full"></div>
                        <span className="absolute top-0 text-[10px] text-white font-mono">LONG</span>
                        <span className="absolute right-0 text-[10px] text-white font-mono">LAT</span>
                        <div 
                            className="w-6 h-6 bg-white rounded-full shadow-[0_0_25px_rgba(255,255,255,0.8)] z-10 transition-transform duration-75 ease-out"
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