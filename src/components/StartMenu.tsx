import { useState } from 'react';
// import { db } from '../db/database';

interface MenuButtonProps {
    label: string;
    onClick?: () => void;
}

function SettingsButton() {
    return (
        <button className='w-20 h-20 flex flex-row items-center justify-center'>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-cog-icon lucide-cog"><path d="M11 10.27 7 3.34"/><path d="m11 13.73-4 6.93"/><path d="M12 22v-2"/><path d="M12 2v2"/><path d="M14 12h8"/><path d="m17 20.66-1-1.73"/><path d="m17 3.34-1 1.73"/><path d="M2 12h2"/><path d="m20.66 17-1.73-1"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/><path d="m3.34 7 1.73 1"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="8"/></svg>
        </button>
    );
}

function MenuButton({label, onClick}: MenuButtonProps) {
    return(
        <button onClick={onClick} className='w-75 h-15 flex flex-row items-center justify-center bg-[rgb(0, 0, 0)] border border-emerald-500 font-mono tracking-widest uppercase text-white hover:bg-white/15 active:border-white active:bg-white/35'>
            {label}
        </button>
    );
}

export default function StartMenu() {
    const [trackName, setTrackName] = useState('');

    const handleStartSession = async () => {
        // const id = await db.sessions.add({
        //     date: new Date(),
        //     trackName: trackName,
        //     bestLapTime: 0
        // });
    };

    return(
        <div className='w-screen h-screen flex flex-col'>
            <div className='h-20 flex flex-row items-center justify-end'>
                <SettingsButton/>
            </div>
            <div className='flex flex-col flex-1 items-center justify-center gap-3'>
                <span className='text-white text-5xl font-bold italic'>TELEMETRA</span>
                <span className='mb-20 text-sm font-mono tracking-widest uppercase text-emerald-500'>Telemetry for racing enthusiasts</span>
                <MenuButton label="Start session" onClick={handleStartSession}/>
                <MenuButton label="View sessions data"/>
            </div>
        </div>
    );
}