import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { SharedProps } from '../types';

/** Notifikasi singkat dari session flash (success / error). */
export function Flash() {
    const { flash } = usePage<SharedProps>().props;
    const [visible, setVisible] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (flash.success) setVisible({ type: 'success', text: flash.success });
        else if (flash.error) setVisible({ type: 'error', text: flash.error });
        else return;
        const t = window.setTimeout(() => setVisible(null), 6000);
        return () => window.clearTimeout(t);
    }, [flash.success, flash.error]);

    if (!visible) return null;

    return (
        <div className="fixed right-4 top-20 z-[80] w-[min(420px,calc(100vw-2rem))]" role="status">
            <div className={`at-alert at-alert--${visible.type === 'success' ? 'success' : 'danger'} shadow-md`}>
                <div className="at-alert__body flex items-start justify-between gap-3">
                    <span>{visible.text}</span>
                    <button type="button" className="font-bold" onClick={() => setVisible(null)} aria-label="Tutup">
                        ×
                    </button>
                </div>
            </div>
        </div>
    );
}
