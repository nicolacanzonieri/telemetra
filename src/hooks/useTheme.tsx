import { useState, useEffect } from 'react';

export function useTheme() {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('telemetra-theme');
        return savedTheme || document.documentElement.getAttribute('data-theme') || 'light';
    });

    // Updates the document's data-theme attribute and persists the 
    // selection to localStorage whenever the theme state changes.
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('telemetra-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return { theme, toggleTheme };
}