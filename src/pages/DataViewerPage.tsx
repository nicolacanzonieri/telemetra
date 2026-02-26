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

function SessionButton({ sessionId, trackName, date, onExport }: SessionButtonProps) {
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-icon-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
            </div>
        </div>
    );
}

export default function DataViewerPage({ onCloseDataViewerPage }: DataViewerPageProps) {
    const sessions = useLiveQuery(
        () => db.sessions.orderBy('date').reverse().toArray()
    );

    const handleExportSession = async (sessionId: number, trackName: string) => {
        try {
            const sessionData = await db.sessions.get(sessionId);
            const samplesData = await db.samples
                .where('sessionId')
                .equals(sessionId)
                .sortBy('timestamp');

            if (!samplesData || samplesData.length === 0) {
                alert("No data found for this session.");
                return;
            }

            const headers = [
                "Timestamp", "Lap", "Lat", "Lng",
                "Speed_MS", "Speed_GPS_Raw", "Distance_M",
                "Accel_X", "Accel_Y",
                "G_Lat", "G_Long", "G_Sum",
                "Kalman_Variance", "Kalman_Gain", "Delta_S"
            ];

            const rows = samplesData.map(s => [
                s.timestamp,
                s.lapNumber,
                s.lat.toFixed(8),
                s.lng.toFixed(8),
                s.speed.toFixed(3),
                s.rawSpeed.toFixed(3),
                s.distance.toFixed(2),
                s.accelX.toFixed(4),
                s.accelY.toFixed(4),
                s.gLat.toFixed(3),
                s.gLong.toFixed(3),
                s.gSum.toFixed(3),
                s.variance.toFixed(6),
                s.kalmanGain.toFixed(6),
                s.delta.toFixed(3)
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map(r => r.join(","))
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const dateStr = new Date(sessionData!.date).toISOString().split('T')[0];

            a.href = url;
            a.download = `telemetra_${trackName.replace(/\s+/g, '_')}_${dateStr}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (e) {
            console.error("Export failed:", e);
            alert("Error during CSV export");
        }
    };

    return (
        <div className='w-screen h-screen absolute flex flex-col z-10 overflow-hidden bg-bg-1'>
            <div className='h-header-h flex flex-row items-center justify-end'>
                <HeaderButton onClick={onCloseDataViewerPage}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-icon-lg h-icon-lg lucide lucide-x-icon lucide-x text-icon-1 active:text-icon-active-1"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
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
                    {sessions?.map((session) => (
                        <SessionButton
                            key={session.id}
                            sessionId={session.id!}
                            trackName={session.trackName}
                            date={session.date}
                            onExport={handleExportSession}
                        />
                    ))}
                    {(!sessions || sessions.length === 0) && (
                        <span className="text-text-1 font-mono opacity-50">NO SESSIONS FOUND</span>
                    )}
                </div>
            </div>
        </div>
    );
}