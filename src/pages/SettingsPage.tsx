import HeaderButton from "../components/HeaderButton";

interface SettingsPageProps {
    onCloseSettings: () => void;
}

interface SettingsButtonProps {
    type: 'action' | 'toggle';
    label: string;
}

function SettingsButton({type, label}: SettingsButtonProps) {
    return (
        <>
            {type == 'action' && (
                <div className="w-full h-20 flex flex-row items-center justify-center p-5 border border-border-1-dark hover:bg-bg-hover-1-dark active:border-border-hover-1-dark active:bg-bg-active-1-dark">
                    <span className="text-sm font-mono tracking-widest uppercase text-neutral-200">{label}</span>
                </div>
            )}

            {type == 'toggle' && (
                <div className="w-full h-20 flex flex-row items-center place-content-between p-5 border border-border-1-dark hover:bg-bg-hover-1-dark active:border-border-active-1-dark active:bg-bg-active-1-dark">
                    <span className="text-sm font-mono tracking-widest uppercase text-neutral-200">{label}</span>
                    <span className="text-sm font-mono tracking-widest uppercase text-neutral-200">ON</span>
                </div>
            )}
        </>
    );
}

export default function SettingsPage({onCloseSettings}: SettingsPageProps) {
    return(
        <div className='w-screen h-screen absolute flex flex-col z-10 bg-black'>
            <div className='h-20 flex flex-row items-center justify-end'>
                <HeaderButton onClick={onCloseSettings} children={<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-x-icon lucide-x text-icon-1-dark active:text-icon-active-1-dark"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>}/>
            </div>
            <div className='flex flex-col flex-1 items-center justify-start p-5 gap-3 bg-bg-1-dark'>
                <span className="mb-10 text-text-1-dark text-4xl font-mono tracking-widest uppercase">Settings</span>

                <SettingsButton type="toggle" label={"Dark mode"}/>
                <SettingsButton type="action" label={"Update Telemetra"}/>
                <SettingsButton type="action" label={"Clear all data and update"}/>
            </div>
        </div>
    );
}