import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { listenSystem } from './atelier/theme';

listenSystem();

createInertiaApp({
    title: (title) => (title ? `${title} · Knowledge Base` : 'Knowledge Base'),
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx', { eager: true });
        const page = pages[`./pages/${name}.tsx`];
        if (!page) throw new Error(`Halaman tidak ditemukan: ${name}`);
        return page as never;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: { color: '#ff8f6b' },
});
