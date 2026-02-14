interface SettingsPageProps {
    onCloseSettings: () => void;
}

interface CloseButtonProps {
    onClick?: () => void;
}

function CloseButton({onClick}: CloseButtonProps) {
    return (
        <button onClick={onClick} className='w-20 h-20 flex flex-row items-center justify-center'>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-x-icon lucide-x text-white active:text-neutral-400"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>            
        </button>
    );
}

export default function SettingsPage({onCloseSettings}: SettingsPageProps) {
    return(
        <div className='w-screen h-screen absolute flex flex-col z-10 bg-black'>
            <div className='h-20 flex flex-row items-center justify-end'>
                <CloseButton onClick={onCloseSettings}/>
            </div>
            <div className='flex flex-col flex-1 items-center justify-start p-5 gap-3 bg-black'>
                <span className="text-white text-4xl font-bold italic uppercase">Settings</span>
            </div>
        </div>
    );
}