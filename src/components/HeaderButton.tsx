import {type ReactNode} from 'react';

interface HeaderButtonProps {
    onClick?: () => void;
    children: ReactNode;
}

export default function HeaderButton({onClick, children}: HeaderButtonProps) {
    return (
        <button onClick={onClick} className='w-20 h-20 flex flex-row items-center justify-center'>
            {children}
            {/* <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-x-icon lucide-x text-white active:text-neutral-400"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>             */}
        </button>
    );
}