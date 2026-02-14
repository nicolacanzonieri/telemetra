import { useState } from 'react';

export function useTheme() {
    const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return { theme, toggleTheme };
}