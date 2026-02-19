import { useTheme } from '../hooks/useTheme';
import HeaderButton from '../components/HeaderButton';

interface StartMenuPageProps {
    onOpenSettings: () => void;
    onOpenSession: () => void;
}

interface MenuButtonProps {
    label: string;
    onClick?: () => void;
}

function MenuButton({label, onClick}: MenuButtonProps) {
    return(
        <button onClick={onClick} className='w-80 h-20 flex flex-row items-center justify-center bg-[rgb(0, 0, 0)] border border-border-1 text-md font-mono tracking-widest uppercase text-text-1 hover:bg-bg-hover-1 active:border-border-active-1 active:bg-bg-active-1'>
            {label}
        </button>
    );
}

export default function StartMenuPage({ onOpenSettings, onOpenSession }: StartMenuPageProps) {
    // Load user theme preferences
    useTheme();

    return(
        <div className='w-screen h-screen absolute flex flex-col z-0'>
            <div className='h-header-h flex flex-row items-center justify-end bg-bg-1'>
                <HeaderButton onClick={onOpenSettings}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-icon-lg h-icon-lg lucide lucide-cog-icon lucide-cog text-icon-1 active:text-icon-active-1"><path d="M11 10.27 7 3.34"/><path d="m11 13.73-4 6.93"/><path d="M12 22v-2"/><path d="M12 2v2"/><path d="M14 12h8"/><path d="m17 20.66-1-1.73"/><path d="m17 3.34-1 1.73"/><path d="M2 12h2"/><path d="m20.66 17-1.73-1"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/><path d="m3.34 7 1.73 1"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="8"/></svg>
                </HeaderButton>
            </div>
            <div className='flex flex-col flex-1 items-center justify-center gap-gap-md bg-bg-1'>
                <span className='text-text-1 text-5xl font-bold font-mono tracking-widest uppercase'>
                    TELEMETRA
                </span>
                <span className='mb-20 text-sm font-mono tracking-widest uppercase text-text-2'>
                    Telemetry for racing enthusiasts
                </span>
                
                <MenuButton label="Start session" onClick={onOpenSession}/>
                <MenuButton label="View sessions data"/>
            </div>
        </div>
    );
}