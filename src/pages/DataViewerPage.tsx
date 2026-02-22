import { useLiveQuery } from "dexie-react-hooks";
import HeaderButton from "../components/HeaderButton";
import { db } from "../db/database.ts";

interface DataViewerPageProps {
    onCloseDataViewerPage: () => void;
}

interface SessionButtonProps {
    sessionId: string;
    trackName: string;
}

function SessionButton({sessionId, trackName}: SessionButtonProps) {
    return (
        <button className="w-80 h-20 flex flex-col items-center justify-center shrink-0 mb-5 p-p-md border border-border-1 hover:bg-bg-hover-1 active:border-border-hover-1 active:bg-bg-active-1">
            <span className="text-sm font-mono tracking-widest uppercase text-text-1">
                {trackName}
            </span>
            <span className="text-xs font-mono tracking-widest uppercase text-text-2">
                {sessionId}
            </span>
        </button>
    );
}

export default function DataViewerPage({onCloseDataViewerPage}: DataViewerPageProps) {
    const sessions = useLiveQuery(
        () => db.sessions.orderBy('date').toArray()
    );
    
    return (
        <div className='w-screen h-screen absolute flex flex-col z-10 overflow-hidden bg-bg-1'>
            <div className='h-header-h flex flex-row items-center justify-end'>
                <HeaderButton onClick={onCloseDataViewerPage}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-icon-lg h-icon-lg lucide lucide-x-icon lucide-x text-icon-1 active:text-icon-active-1"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </HeaderButton>
            </div>

            <div className='min-h-0 flex flex-col flex-1 items-center justify-start p-p-md gap-gap-md bg-bg-1'>
                <span className="mb-10 text-text-1 text-4xl font-mono tracking-widest uppercase">
                    Data Viewer
                </span>

                {/* Saved tracks */}
                    <div className="w-full min-h-0 overflow-y-auto flex flex-col flex-1 items-center justify-start no-scrollbar">
                        {/* {savedTracks?.map((track) => (
                            <SessionButton trackName="Monza" sessionId="198291028329"/>
                        ))} */}
                        { sessions?.map((session) => (
                            <SessionButton trackName={session.trackName} sessionId={session.id ? session.id.toString() : "no id"}/>
                        )) }
                    </div>
            </div>
        </div>
    );
}