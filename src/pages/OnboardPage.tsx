import { useState, useEffect} from "react";

export default function OnBoardPage() {
    const [gForce, setGForce] = useState({ x: 0, y: 0 });

    useEffect(() => {
        let frameId: number;

        const animate = () => {
            // Telemetry simulation: smooth oscillation between -1 and 1 G
            // In a real case, you would map data coming from sensors/API here
            const x = Math.sin(Date.now() / 400) * 40;
            const y = Math.cos(Date.now() / 600) * 40;
            
            setGForce({ x, y });
            frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, []);

    return (
        <div className="w-screen h-screen absolute flex flex-col z-40 bg-bg-1">
            <div className="w-full h-25 bg-red-500">

            </div>
            <div className="w-full flex-1">
                <div className="w-full h-[50%] flex flex-col items-start justify-start p-p-s">
                    <span className="text-2xl font-bold font-mono tracking-widest uppercase text-text-1">
                        LIVE
                    </span>
                    <span className="mb-[5px] text-[53px] font-bold font-mono tracking-widest uppercase text-text-1">
                        1:27:38
                    </span>
                    <span className="text-2xl font-bold font-mono tracking-widest uppercase text-text-1">
                        LAST LAP
                    </span>
                    <span className="mb-[5px] text-[53px] font-bold font-mono tracking-widest uppercase text-text-1">
                        1:27:38
                    </span>
                    <span className="text-2xl font-bold font-mono tracking-widest uppercase text-text-1">
                        BEST LAP
                    </span>
                    <span className="text-[53px] font-bold font-mono tracking-widest uppercase text-text-1">
                        1:27:38
                    </span>
                </div>

                <div className="w-full h-[50%] flex items-center justify-center bg-zinc-900/20 border-l border-zinc-900">
                    <div className="relative w-64 h-64 flex items-center justify-center">
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