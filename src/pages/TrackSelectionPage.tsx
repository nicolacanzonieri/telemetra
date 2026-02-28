import { useLiveQuery } from "dexie-react-hooks";
import { useState, type ReactNode } from "react";
import { db, type Track } from "../db/database";
import HeaderButton from "../components/HeaderButton";

interface TrackSelectionPageProps {
    onCloseTrackSelection: () => void;
    onClickTrackType: (type: 'Circuit' | 'Sprint') => void;
    onSelectSavedTrack: (track: Track) => void;
}

interface TrackButtonProps {
    label: string;
    onClick: () => void;
}

interface TrackTypeButtonProps {
    label: string;
    children: ReactNode;
    onClick: () => void;
}

function TrackButton({label, onClick}: TrackButtonProps) {
    return (
        <button onClick={onClick} className="w-80 h-20 flex flex-row items-center justify-center shrink-0 mb-5 p-p-md border border-border-1 hover:bg-bg-hover-1 active:border-border-hover-1 active:bg-bg-active-1">
            <span className="text-sm font-mono tracking-widest uppercase text-text-1">
                {label}
            </span>
        </button>
    );
}

function TrackTypeButton({label, children, onClick}: TrackTypeButtonProps) {
    return (
        <div onClick={onClick} className="w-80 h-32 flex flex-col items-center justify-center border border-border-1 hover:bg-bg-hover-1 active:border-border-hover-1 active:bg-bg-active-1">
            {children}
            <span className="text-sm font-mono tracking-widest uppercase text-text-1">
                {label}
            </span>
        </div>
    );
}

export default function TrackSelectionPage({onCloseTrackSelection, onClickTrackType, onSelectSavedTrack}: TrackSelectionPageProps) {
    const [isTrackMenuOpen, setIsTrackMenuOpen] = useState(true);
    const [isTrackTypeMenuOpen, setIsTrackTypeMenuOpen] = useState(false);
    const [isTrackCoordinatesOpen, setIsTrackCoordinatesOpen] = useState(false);

    // Get saved tracks
    const savedTracks = useLiveQuery(
        () => db.tracks.orderBy('name').toArray()
    );

    return(
        <div className='w-screen h-screen absolute flex flex-col z-20 overflow-hidden bg-bg-1'>
            <div className='h-header-h flex flex-row items-center justify-end'>
                {isTrackMenuOpen && (
                    <HeaderButton onClick={onCloseTrackSelection}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-icon-lg h-icon-lg lucide lucide-x-icon lucide-x text-icon-1 active:text-icon-active-1"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </HeaderButton>
                )}

                {isTrackTypeMenuOpen && (
                    <HeaderButton onClick={() => {
                        setIsTrackMenuOpen(true);
                        setIsTrackTypeMenuOpen(false);
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-left-icon lucide-arrow-left text-icon-1 active:text-icon-active-1"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                    </HeaderButton>
                )}

                {isTrackCoordinatesOpen && (
                    <HeaderButton onClick={() => {
                        setIsTrackTypeMenuOpen(true);
                        setIsTrackCoordinatesOpen(false);
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-left-icon lucide-arrow-left text-icon-1 active:text-icon-active-1"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                    </HeaderButton>
                )}
            </div>
    
            {/* TRACK SELECTION MENU */}
            {isTrackMenuOpen && (
                <div id="track-list-menu" className='min-h-0 flex flex-col flex-1 items-center justify-start gap-gap-md bg-bg-1'>
                    <span className="mb-10 text-text-1 text-3xl font-mono tracking-widest uppercase">
                        Track Selection
                    </span>
                    
                    <button onClick={() => {
                            setIsTrackTypeMenuOpen(true);
                            setIsTrackMenuOpen(false);
                        }} 
                        className="w-80 h-20 flex flex-row items-center justify-center mb-5 p-p-md border border-border-1 text-sm font-mono tracking-widest uppercase text-text-1 hover:bg-bg-hover-1 active:border-border-hover-1 active:bg-bg-active-1"
                    >
                        Add track
                    </button>
                    
                    <span className="mb-5 text-text-1 text-xl font-mono tracking-widest uppercase">
                        Saved tracks
                    </span>
                    
                    {/* Saved tracks */}
                    <div className="w-full min-h-0 overflow-y-auto flex flex-col flex-1 items-center justify-start no-scrollbar">
                        {savedTracks?.map((track) => (
                            <TrackButton key={track.id} label={track.name} onClick={() => onSelectSavedTrack(track)}/>
                        ))}
                    </div>
                </div>
            )}
            
            {/* TRACK TYPE SELECTION MENU */}
            {isTrackTypeMenuOpen && (
                <div id="track-type-menu" className='min-h-0 flex flex-col flex-1 items-center justify-start gap-gap-md bg-bg-1'>
                    <span className="mb-10 text-text-1 text-3xl font-mono tracking-widest uppercase">Track Type</span>
                    
                    {/* Sprint type track button */}
                    <TrackTypeButton onClick={() => onClickTrackType("Sprint")} label={"Sprint"} children={<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-timer-icon lucide-timer m-5 text-icon-1 active:text-icon-active-1"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>}/>
                    
                    {/* Circuit type track button */}
                    <TrackTypeButton onClick={() => onClickTrackType("Circuit")} label={"Circuit"} children={<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-flag-icon lucide-flag m-5 text-icon-1 active:text-icon-active-1"><path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/></svg>}/>

                    {/* Precise track creation button */}
                    <TrackTypeButton onClick={() => {
                            setIsTrackCoordinatesOpen(true);
                            setIsTrackTypeMenuOpen(false);
                        }} 
                        label={"Coordinates"} children={<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-locate-fixed-icon lucide-locate-fixed m-5 text-icon-1 active:text-icon-active-1"><line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg>}
                    />
                </div>
            )}

            {/* TRACK CREATION WITH COORDINATES */}
            {isTrackCoordinatesOpen && (
                <div id="track-type-menu" className='min-h-0 overflow-y-auto flex flex-col flex-1 items-center justify-start p-p-md bg-bg-1'>
                    <span className="shrink-0 mb-10 text-text-1 text-3xl font-mono tracking-widest uppercase">Coordinates</span>

                    <span className="shrink-0 mb-5 text-text-2 text-2xl font-mono tracking-widest uppercase">Starting point</span>
                    <input 
                        type="number" 
                        placeholder="SP1 LONGITUDE" 
                        className="shrink-0 w-full bg-transparent border-b border-border-1 py-2 text-text-1 font-mono outline-none placeholder:opacity-30"
                    />
                    <input 
                        type="number" 
                        placeholder="SP1 LATITUDE" 
                        className="shrink-0 w-full bg-transparent border-b border-border-1 py-2 text-text-1 font-mono outline-none placeholder:opacity-30"
                    />
                    
                    <div className="h-5 shrink-0"/>

                    <input 
                        type="number" 
                        placeholder="SP2 LONGITUDE" 
                        className="shrink-0 w-full bg-transparent border-b border-border-1 py-2 text-text-1 font-mono outline-none placeholder:opacity-30"
                    />
                    <input 
                        type="number" 
                        placeholder="SP2 LATITUDE" 
                        className="shrink-0 w-full bg-transparent border-b border-border-1 py-2 text-text-1 font-mono outline-none placeholder:opacity-30"
                    />
                    
                    <div className="h-10 shrink-0"/>

                    <span className="mb-5 text-text-2 text-2xl font-mono tracking-widest uppercase">Finish point</span>
                    <input 
                        type="number" 
                        placeholder="FP1 LONGITUDE" 
                        className="shrink-0 w-full bg-transparent border-b border-border-1 py-2 text-text-1 font-mono outline-none placeholder:opacity-30"
                    />
                    <input 
                        type="number" 
                        placeholder="FP1 LATITUDE" 
                        className="shrink-0 w-full bg-transparent border-b border-border-1 py-2 text-text-1 font-mono outline-none placeholder:opacity-30"
                    />
                    
                    <div className="h-5 shrink-0"/>

                    <input 
                        type="number" 
                        placeholder="FP2 LONGITUDE" 
                        className="shrink-0 w-full bg-transparent border-b border-border-1 py-2 text-text-1 font-mono outline-none placeholder:opacity-30"
                    />
                    <input 
                        type="number" 
                        placeholder="FP2 LATITUDE" 
                        className="shrink-0 w-full bg-transparent border-b border-border-1 py-2 text-text-1 font-mono outline-none placeholder:opacity-30"
                    />
                    
                    <div className="shrink-0 h-10"/>
                    
                    <TrackButton label="Confirm" onClick={() => null}/>
                </div>
            )}

        </div>
    );
}