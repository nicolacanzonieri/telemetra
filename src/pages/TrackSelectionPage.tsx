import { useState } from "react";
import HeaderButton from "../components/HeaderButton";

interface TrackSelectionPageProps {
    onCloseTrackSelection: () => void;
}

interface TrackButtonProps {
    trackName: string;
}

function TrackButton({trackName}: TrackButtonProps) {
    return (
        <button className="w-80 h-20 flex flex-row items-center justify-center shrink-0 mb-5 p-p-md border border-border-1 hover:bg-bg-hover-1 active:border-border-hover-1 active:bg-bg-active-1">
            <span className="text-sm font-mono tracking-widest uppercase text-text-1">{trackName}</span>
        </button>
    );
}

export default function TrackSelectionPage({onCloseTrackSelection}: TrackSelectionPageProps) {
    const [isTrackTypeMenuOpen, setIsTrackTypeMenuOpen] = useState(false);

    return(
        <div className='w-screen h-screen absolute flex flex-col z-20 overflow-hidden bg-bg-1'>
            <div className='h-header-h flex flex-row items-center justify-end'>
                {!isTrackTypeMenuOpen && (
                    <HeaderButton onClick={onCloseTrackSelection}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-icon-lg h-icon-lg lucide lucide-x-icon lucide-x text-icon-1 active:text-icon-active-1"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </HeaderButton>
                )}

                {isTrackTypeMenuOpen && (
                    <HeaderButton onClick={() => setIsTrackTypeMenuOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-left-icon lucide-arrow-left text-icon-1 active:text-icon-active-1"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                    </HeaderButton>
                )}
            </div>
    
            {!isTrackTypeMenuOpen && (
                <div id="track-list-menu" className='min-h-0 flex flex-col flex-1 items-center justify-start gap-gap-md bg-bg-1'>
                    <span className="mb-10 text-text-1 text-3xl font-mono tracking-widest uppercase">Track Selection</span>
                    
                    {/* Add track button */}
                    <button onClick={() => setIsTrackTypeMenuOpen(true)} className="w-80 h-20 flex flex-row items-center justify-center mb-5 p-p-md border border-border-1 hover:bg-bg-hover-1 active:border-border-hover-1 active:bg-bg-active-1">
                        <span className="text-sm font-mono tracking-widest uppercase text-text-1">Add track</span>
                    </button>
                    
                    <span className="mb-5 text-text-1 text-xl font-mono tracking-widest uppercase">Saved tracks</span>
                    
                    <div className="w-full min-h-0 overflow-y-auto flex flex-col flex-1 items-center justify-start no-scrollbar">
                        <TrackButton trackName={"Monza"}/>
                        <TrackButton trackName={"Mugello"}/>
                        <TrackButton trackName={"Imola"}/>
                        <TrackButton trackName={"Misano"}/>
                        <TrackButton trackName={"Spa"}/>
                        <TrackButton trackName={"Nürburgring"}/>
                        <TrackButton trackName={"Hockenheimring"}/>
                    </div>
                </div>
            )}
            
            {isTrackTypeMenuOpen && (
                <div id="track-type-menu" className='min-h-0 flex flex-col flex-1 items-center justify-start gap-gap-md bg-bg-1'>
                    <span className="mb-10 text-text-1 text-3xl font-mono tracking-widest uppercase">Track Type</span>
                    
                    <div className="w-80 h-40 flex flex-col items-center justify-center p-p-md border border-border-1 hover:bg-bg-hover-1 active:border-border-hover-1 active:bg-bg-active-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-timer-icon lucide-timer m-5 text-icon-1 active:text-icon-active-1"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>
                        <span className="text-sm font-mono tracking-widest uppercase text-text-1">Sprint track</span>
                    </div>
                    <div className="w-80 h-40 flex flex-col items-center justify-center p-p-md border border-border-1 hover:bg-bg-hover-1 active:border-border-hover-1 active:bg-bg-active-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-flag-icon lucide-flag m-5 text-icon-1 active:text-icon-active-1"><path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/></svg>
                        <span className="text-sm font-mono tracking-widest uppercase text-text-1">Circuit</span>
                    </div>
                </div>
            )}
        </div>
    );
}