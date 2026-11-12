import { Link, router, usePage } from '@inertiajs/react';
import { FormEvent, ReactNode, useState } from 'react';
import { ChatWidget } from '../components/ChatWidget';
import { Flash } from '../components/Flash';
import { Icon, Stamp } from '../components/Icon';
import { ThemeToggle } from '../components/ThemeToggle';
import type { Project, SharedProps } from '../types';

interface Props {
    project?: Project;
    audience?: string;
    children: ReactNode;
    /** Sembunyikan kotak cari kecil di header (mis. di beranda yang sudah punya kotak besar). */
    hideHeaderSearch?: boolean;
}

export default function PublicLayout({ project, audience, children, hideHeaderSearch }: Props) {
    const { auth, appName } = usePage<SharedProps>().props;
    const [q, setQ] = useState('');

    function search(e: FormEvent) {
        e.preventDefault();
        if (project && q.trim()) router.get(`/${project.slug}/cari`, { q });
    }

    return (
        <div className="min-h-screen bg-canvas text-text">
            <a href="#konten" className="sr-only focus:not-sr-only">
                Lewati ke konten
            </a>
            <header className="sticky top-0 z-40 border-b-2 border-ink bg-surface">
                <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
                    <Link href={project ? `/${project.slug}` : '/'} className="flex min-w-0 items-center gap-3">
                        <Stamp size={34} />
                        <span className="min-w-0">
                            <span className="block truncate font-display text-lg font-black leading-tight text-text-strong">
                                {project ? project.name : appName}
                            </span>
                            <span className="block text-[11px] font-semibold uppercase tracking-widest text-text-muted">Pusat Bantuan</span>
                        </span>
                    </Link>

                    {project && !hideHeaderSearch && (
                        <form onSubmit={search} className="ml-4 hidden max-w-md flex-1 md:block" role="search">
                            <label className="relative block">
                                <span className="sr-only">Cari artikel</span>
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                                    <Icon name="search" size={16} />
                                </span>
                                <input className="at-input !pl-9" placeholder="Cari artikel…" value={q} onChange={(e) => setQ(e.target.value)} />
                            </label>
                        </form>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                        {project && (
                            <Link href="/" className="hidden text-sm font-semibold text-text-muted hover:text-text-strong sm:inline">
                                Semua project
                            </Link>
                        )}
                        <ThemeToggle />
                        {auth.user ? (
                            <>
                                {auth.user.is_admin && (
                                    <Link href="/admin" className="at-btn at-btn--outline at-btn--sm at-press">
                                        Admin
                                    </Link>
                                )}
                                <Link href="/logout" method="post" as="button" className="at-icon-btn" aria-label="Keluar" title="Keluar">
                                    <Icon name="logout" />
                                </Link>
                            </>
                        ) : (
                            <Link href="/login" className="at-btn at-btn--dark at-btn--sm at-press">
                                Masuk
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main id="konten">{children}</main>

            <footer className="mt-16 border-t-2 border-ink bg-surface">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-text-muted">
                    <span>
                        {project ? `${project.name} · ` : ''}
                        {appName}
                    </span>
                    {project?.support_contact && <span>Butuh bantuan lain? {project.support_contact}</span>}
                </div>
            </footer>

            <Flash />
            {project && <ChatWidget project={project} audience={audience} />}
        </div>
    );
}
