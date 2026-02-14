import { useState } from 'react';
import HeaderButton from '../components/HeaderButton';

interface StartMenuPageProps {
    onOpenSettings: () => void;
}

interface MenuButtonProps {
    label: string;
    onClick?: () => void;
}

function MenuButton({label, onClick}: MenuButtonProps) {
    return(
        <button onClick={onClick} className='w-menu-btn-w h-menu-btn-h flex flex-row items-center justify-center bg-[rgb(0, 0, 0)] border border-border-1-dark text-md font-mono tracking-widest uppercase text-text-1-dark hover:bg-bg-hover-1-dark active:border-white active:bg-bg-active-1-dark'>
            {label}
        </button>
    );
}

export default function StartMenuPage({ onOpenSettings }: StartMenuPageProps) {
    const [trackName, setTrackName] = useState('');

    const handleStartSession = async () => {
        // const id = await db.sessions.add({
        //     date: new Date(),
        //     trackName: trackName,
        //     bestLapTime: 0
        // });
    };

    return(
        <div className='w-screen h-screen absolute flex flex-col z-0'>
            <div className='h-header-h flex flex-row items-center justify-end bg-bg-1-dark'>
                <HeaderButton onClick={onOpenSettings}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-icon-lg h-icon-lg lucide lucide-cog-icon lucide-cog text-icon-1-dark active:text-icon-active-1-dark"><path d="M11 10.27 7 3.34"/><path d="m11 13.73-4 6.93"/><path d="M12 22v-2"/><path d="M12 2v2"/><path d="M14 12h8"/><path d="m17 20.66-1-1.73"/><path d="m17 3.34-1 1.73"/><path d="M2 12h2"/><path d="m20.66 17-1.73-1"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/><path d="m3.34 7 1.73 1"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="8"/></svg>
                </HeaderButton>
            </div>
            <div className='flex flex-col flex-1 items-center justify-center gap-gap-md bg-bg-1-dark'>
                <span className='text-text-1-dark text-5xl font-bold font-mono tracking-widest uppercase'>TELEMETRA</span>
                <span className='mb-20 text-sm font-mono tracking-widest uppercase text-text-2-dark'>Telemetry for racing enthusiasts</span>
                
                <MenuButton label="Start session" onClick={handleStartSession}/>
                <MenuButton label="View sessions data"/>
            </div>
        </div>
    );
}