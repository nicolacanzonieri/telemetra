import { useLiveQuery } from "dexie-react-hooks";
import HeaderButton from "../components/HeaderButton";
import { db } from "../db/database.ts";

interface DataViewerPageProps {
    onCloseDataViewerPage: () => void;
}

interface SessionButtonProps {
    sessionId: number;
    trackName: string;
    date: number;
    onExport: (id: number, tName: string) => void;
}

function SessionButton({sessionId, trackName, date, onExport}: SessionButtonProps) {
    const dateStr = new Date(date).toLocaleString();

    return (
        <div className="w-80 h-24 shrink-0 mb-5 p-p-md border border-border-1 flex flex-col items-center justify-center hover:bg-bg-hover-1 active:border-border-hover-1 active:bg-bg-active-1 relative group">
            <button onClick={() => onExport(sessionId, trackName)} className="w-full h-full flex flex-col items-center justify-center">
                <span className="text-sm font-mono tracking-widest uppercase text-text-1">
                    {trackName}
                </span>
                <span className="text-xs font-mono tracking-widest uppercase text-text-2 mt-1">
                    {dateStr}
                </span>
                <span className="text-[10px] font-mono uppercase text-text-1 opacity-50 mt-1">
                    ID: {sessionId}
                </span>
            </button>
            
            {/* Visual download indicator */}
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-icon-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </div>
        </div>
    );
}

export default function DataViewerPage({onCloseDataViewerPage}: DataViewerPageProps) {
    const sessions = useLiveQuery(
        () => db.sessions.orderBy('date').reverse().toArray()
    );

    const handleExportSession = async (sessionId: number, trackName: string) => {
        try {
            const sessionData = await db.sessions.get(sessionId);
            if (!sessionData) {
                alert("Errore: Sessione non trovata");
                return;
            }

            let trackData = await db.tracks
                .where('name')
                .equals(trackName.toUpperCase())
                .first();

            if (!trackData) {
                trackData = await db.tracks
                    .where('name')
                    .equals(sessionData.trackName)
                    .first();
            }

            const lapsData = await db.laps
                .where('sessionId')
                .equals(sessionId)
                .toArray();

            const samplesData = await db.samples
                .where('sessionId')
                .equals(sessionId)
                .toArray();

            const exportObject = {
                sessions: [sessionData],
                tracks: trackData ? [trackData] : [],
                laps: lapsData,
                samples: samplesData
            };

            const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date(sessionData.date).toISOString().replace(/[:.]/g, '-');
            a.download = `telemetra_${trackName.replace(/\s+/g, '_')}_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (e) {
            console.error("Export failed:", e);
            alert("Error during the export of files");
        }
    };
    
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
                <span className="text-xs font-mono uppercase text-text-2 mb-4">
                    Tap to export JSON
                </span>

                <div className="w-full min-h-0 overflow-y-auto flex flex-col flex-1 items-center justify-start no-scrollbar pb-10">
                    { sessions?.map((session) => (
                        <SessionButton 
                            key={session.id} 
                            sessionId={session.id!} 
                            trackName={session.trackName} 
                            date={session.date}
                            onExport={handleExportSession}
                        />
                    )) }
                    {(!sessions || sessions.length === 0) && (
                        <span className="text-text-1 font-mono opacity-50">NO SESSIONS FOUND</span>
                    )}
                </div>
            </div>
        </div>
    );
}