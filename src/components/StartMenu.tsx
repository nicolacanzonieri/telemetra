import { useState } from 'react';
// import { db } from '../db/database';

interface MenuButtonProps {
    label: string;
    onClick?: () => void;
}

function MenuButton({label, onClick}: MenuButtonProps) {
    return(
        <button onClick={onClick} className='w-75 h-15 flex flex-row items-center justify-center bg-[rgb(0, 0, 0)] border border-emerald-500 font-mono tracking-widest uppercase text-white hover:bg-white/15 active:border-white active:bg-white/35'>{label}</button>
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
        <div className='w-screen h-screen flex flex-col items-center justify-center gap-3'>
            <span className='text-white text-5xl font-bold italic'>TELEMETRA</span>
            <span className='mb-20 text-sm font-mono tracking-widest uppercase text-emerald-500'>Telemetry for racing enthusiasts</span>
            <MenuButton label="Start session" onClick={handleStartSession}></MenuButton>
            <MenuButton label="View sessions data"></MenuButton>
        </div>
    );
}