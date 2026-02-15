import HeaderButton from "../components/HeaderButton";

interface TrackSelectionPageProps {
    onCloseTrackSelection: () => void;
}

interface TrackButtonProps {
    trackName: string;
}

function TrackButton({trackName}: TrackButtonProps) {
    return (
        <div className="w-80 h-20 flex flex-row items-center justify-center shrink-0 mb-5 p-p-md border border-border-1 hover:bg-bg-hover-1 active:border-border-hover-1 active:bg-bg-active-1">
            <span className="text-sm font-mono tracking-widest uppercase text-text-1">{trackName}</span>
        </div>
    );
}

export default function TrackSelectionPage({onCloseTrackSelection}: TrackSelectionPageProps) {
    return(
        <div className='w-screen h-screen absolute flex flex-col z-10 overflow-hidden bg-bg-1'>
            <div className='h-header-h flex flex-row items-center justify-end'>
                <HeaderButton onClick={onCloseTrackSelection}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-icon-lg h-icon-lg lucide lucide-x-icon lucide-x text-icon-1 active:text-icon-active-1"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </HeaderButton>
            </div>
    
            <div className='min-h-0 flex flex-col flex-1 items-center justify-start gap-gap-md bg-bg-1'>
                <span className="mb-10 text-text-1 text-3xl font-mono tracking-widest uppercase">Track Selection</span>
                
                {/* Add track button */}
                <div className="w-80 h-20 flex flex-row items-center justify-center mb-5 p-p-md border border-border-1 hover:bg-bg-hover-1 active:border-border-hover-1 active:bg-bg-active-1">
                    <span className="text-sm font-mono tracking-widest uppercase text-text-1">Add track</span>
                </div>
                
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

        </div>
    );
}