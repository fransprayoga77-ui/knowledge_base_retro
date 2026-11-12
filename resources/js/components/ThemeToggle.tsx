import { useEffect, useState } from 'react';
import { quickToggleTheme, resolvedMode } from '../atelier/theme';
import { Icon } from './Icon';

export function ThemeToggle() {
    const [mode, setMode] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        setMode(resolvedMode());
        const onChange = () => setMode(resolvedMode());
        window.addEventListener('at:change', onChange);
        return () => window.removeEventListener('at:change', onChange);
    }, []);

    return (
        <button
            type="button"
            className="at-icon-btn"
            onClick={() => setMode(quickToggleTheme())}
            aria-label={mode === 'dark' ? 'Gunakan tema terang' : 'Gunakan tema gelap'}
            title={mode === 'dark' ? 'Tema terang' : 'Tema gelap'}
        >
            <Icon name={mode === 'dark' ? 'sun' : 'moon'} />
        </button>
    );
}
