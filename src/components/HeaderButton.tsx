import {type ReactNode} from 'react';

interface HeaderButtonProps {
    onClick?: () => void;
    children: ReactNode;
}

export default function HeaderButton({onClick, children}: HeaderButtonProps) {
    return (
        <button onClick={onClick} className='w-header-btn h-header-btn flex flex-row items-center justify-center'>
            {children}
        </button>
    );
}