import { useTheme } from "../hooks/useTheme";
import HeaderButton from "../components/HeaderButton";

interface SettingsPageProps {
    onCloseSettings: () => void;
}

interface SettingsButtonProps {
    type: 'action' | 'toggle';
    label: string;
    value?: string;
    onClick?: () => void;
}

function SettingsButton({type, label, value, onClick}: SettingsButtonProps) {
    return (
        <>
            {type == 'action' && (
                <div onClick={onClick} className="w-80 h-20 flex flex-row items-center justify-center p-p-md border border-border-1 hover:bg-bg-hover-1 active:border-border-hover-1 active:bg-bg-active-1">
                    <span className="text-sm font-mono tracking-widest uppercase text-text-1">
                        {label}
                    </span>
                </div>
            )}

            {type == 'toggle' && (
                <div onClick={onClick} className="w-80 h-20 flex flex-row items-center place-content-between p-p-md border border-border-1 hover:bg-bg-hover-1 active:border-border-active-1 active:bg-bg-active-1">
                    <span className="text-sm font-mono tracking-widest uppercase text-text-1">
                        {label}
                    </span>
                    <span className="text-sm font-mono tracking-widest uppercase text-text-1">
                        {value || 'OFF'}
                    </span>
                </div>
            )}
        </>
    );
}

export default function SettingsPage({onCloseSettings}: SettingsPageProps) {
    // Theme hook
    const { theme, toggleTheme } = useTheme();

    // App version
    const appVersion = __APP_VERSION__;

    // Update telemetra
    const handleUpdateTelemetra = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    // Check the server for updates
                    await registration.update();
                    console.log("Checking for updates on Vercel...");
                }
                
                // Force a reload to activate the new version
                // The 'true' parameter (though deprecated) tells some browsers to skip cache
                window.location.reload();
            } catch (error) {
                console.error("Update failed:", error);
                window.location.reload();
            }
        } else {
            window.location.reload();
        }
    };

    // Delete all data and update
    const handleHardReset = async () => {
        if (!confirm("WARNING: This will permanently delete all sessions and saved times. Do you want to proceed?")) {
            return;
        }

        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }

            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(
                    keys.map((key) => caches.delete(key))
                );
            }

            localStorage.clear();
            sessionStorage.clear();

            if ('indexedDB' in window) {
                const databases = await window.indexedDB.databases();
                for (const db of databases) {
                    if (db.name) {
                        window.indexedDB.deleteDatabase(db.name);
                    }
                }
            }
        } catch (e) {
            console.error("Error during hard reset:", e);
        } finally {
            window.location.href = window.location.origin; 
        }
    };


    return(
        <div className='w-screen h-screen absolute flex flex-col z-10 bg-bg-1'>
            <div className='h-header-h flex flex-row items-center justify-end'>
                <HeaderButton onClick={onCloseSettings}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-icon-lg h-icon-lg lucide lucide-x-icon lucide-x text-icon-1 active:text-icon-active-1"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </HeaderButton>
            </div>
    
            <div className='flex flex-col flex-1 items-center justify-start p-p-md gap-gap-md bg-bg-1'>
                <span className="mb-10 text-text-1 text-4xl font-mono tracking-widest uppercase">
                    Settings
                </span>

                <SettingsButton 
                    type="toggle" 
                    label={"Dark mode"} 
                    value={theme === 'dark' ? 'ON' : 'OFF'} 
                    onClick={toggleTheme}
                />
                <SettingsButton 
                    type="action" 
                    label={"Update Telemetra"} 
                    onClick={handleUpdateTelemetra}
                />
                <SettingsButton 
                    type="action" 
                    label={"Clear all data and update"} 
                    onClick={handleHardReset}
                />
            </div>

            <div className="mt-auto mb-4 flex flex-col items-center gap-1 opacity-40">
                <span className="text-[10px] font-mono tracking-tighter text-text-1 uppercase">
                    Telemetra Core
                </span>
                <span className="text-sm font-mono font-bold text-text-2">
                    v{appVersion}
                </span>
            </div>
        </div>
    );
}