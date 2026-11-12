import { router } from '@inertiajs/react';
import { FormEvent, ReactNode, useState } from 'react';
import { Icon } from './Icon';

export function SearchHero({ slug, title, subtitle, initial = '', children }: { slug: string; title: ReactNode; subtitle?: ReactNode; initial?: string; children?: ReactNode }) {
    const [q, setQ] = useState(initial);

    function submit(e: FormEvent) {
        e.preventDefault();
        if (q.trim()) router.get(`/${slug}/cari`, { q });
    }

    return (
        <section className="kb-grid-bg border-b-2 border-ink">
            <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
                <h1 className="font-display text-4xl font-black leading-[1.05] text-text-strong sm:text-6xl">{title}</h1>
                {subtitle && <p className="mt-4 max-w-2xl text-lg text-text">{subtitle}</p>}
                <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row" role="search">
                    <label className="relative flex-1">
                        <span className="sr-only">Cari artikel bantuan</span>
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                            <Icon name="search" size={20} />
                        </span>
                        <input
                            className="at-input !h-14 !pl-12 !text-lg shadow-md"
                            placeholder="Contoh: cara bayar pakai virtual account"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </label>
                    <button type="submit" className="at-btn at-btn--primary at-btn--lg at-press !h-14 px-8">
                        Cari
                    </button>
                </form>
                {children}
            </div>
        </section>
    );
}
