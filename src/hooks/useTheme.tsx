import { useState, useEffect } from 'react';

export function useTheme() {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('telemetra-theme');
        return savedTheme || document.documentElement.getAttribute('data-theme') || 'dark';
    });

    // This effect ensures the document's 'data-theme' attribute and localStorage 
    // are always in sync with the 'theme' state. 
    // It runs on mount (to apply saved preferences) and whenever the theme changes, 
    // regardless of what triggered the update.
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('telemetra-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return { theme, toggleTheme };
}