import { Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import type { Paginated } from '../types';

export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: ReactNode; children: ReactNode; htmlFor?: string }) {
    return (
        <div>
            <label className="at-form-label" htmlFor={htmlFor}>
                {label}
            </label>
            {children}
            {hint && !error && <p className="at-form-hint mt-1 text-sm text-text-muted">{hint}</p>}
            {error && <p className="at-form-error mt-1 text-sm font-semibold text-danger">{error}</p>}
        </div>
    );
}

export function Pagination<T>({ page }: { page: Paginated<T> }) {
    if (page.last_page <= 1) return null;
    return (
        <nav className="at-pagination mt-4 flex flex-wrap items-center gap-1" aria-label="Halaman">
            {page.links.map((l, i) => {
                const label = l.label.replace('&laquo; Previous', '‹').replace('Next &raquo;', '›').replace(/&[a-z]+;/g, '');
                return l.url ? (
                    <Link key={i} href={l.url} preserveScroll className={`at-pagination__btn ${l.active ? 'is-active' : ''}`}>
                        {label}
                    </Link>
                ) : (
                    <span key={i} className="at-pagination__btn opacity-40">
                        {label}
                    </span>
                );
            })}
            <span className="ml-2 text-sm text-text-muted">
                {page.from}–{page.to} dari {page.total}
            </span>
        </nav>
    );
}

export function StatusBadge({ status }: { status: string }) {
    return status === 'published' ? <span className="at-badge at-badge--success">Terbit</span> : <span className="at-badge at-badge--neutral">Draft</span>;
}

export function ReviewBadge({ verification }: { verification: string }) {
    return verification === 'needs_review' ? <span className="at-badge at-badge--warning">Perlu konfirmasi</span> : null;
}

export function Kpi({ label, value, tone = 'accent' }: { label: string; value: number | string; tone?: 'accent' | 'secondary' | 'lime' | 'tertiary' | 'warning' | 'danger' }) {
    const bg: Record<string, string> = {
        accent: 'bg-accent',
        secondary: 'bg-secondary',
        lime: 'bg-lime',
        tertiary: 'bg-tertiary text-canvas',
        warning: 'bg-warning',
        danger: 'bg-danger text-canvas',
    };
    return (
        <div className="at-card overflow-hidden">
            <div className={`h-2 border-b-2 border-ink ${bg[tone]}`} />
            <div className="p-5">
                <div className="at-eyebrow text-text-muted">{label}</div>
                <div className="mt-2 font-mono text-4xl font-bold text-text-strong">{value}</div>
            </div>
        </div>
    );
}
