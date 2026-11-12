import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode, useEffect } from 'react';
import { closeDrawer, toggleSidebar } from '../atelier/sidebar';
import { Flash } from '../components/Flash';
import { Icon, IconName, Stamp } from '../components/Icon';
import { ThemeToggle } from '../components/ThemeToggle';
import type { SharedProps } from '../types';

interface Props {
    title: string;
    subtitle?: ReactNode;
    actions?: ReactNode;
    breadcrumb?: { label: string; href?: string }[];
    children: ReactNode;
}

type AdminShared = SharedProps & { adminProjects: { id: number; name: string; slug: string }[] | null };

function NavLink({ href, icon, label, active }: { href: string; icon: IconName; label: string; active: boolean }) {
    return (
        <Link href={href} className={`at-nav__group-head ${active ? 'kb-nav-active' : ''}`} aria-current={active ? 'page' : undefined} title={label}>
            <Icon name={icon} size={20} className="at-nav__icon" />
            <span>{label}</span>
        </Link>
    );
}

export default function AdminLayout({ title, subtitle, actions, breadcrumb, children }: Props) {
    const { auth, adminProjects, aiEnabled } = usePage<AdminShared>().props;
    const url = usePage().url;

    useEffect(() => closeDrawer(), [url]);

    const is = (prefix: string, exact = false) => (exact ? url === prefix || url.startsWith(prefix + '?') : url.startsWith(prefix));

    return (
        <>
            <Head title={`${title} · Admin`} />
            <div className="at-layout">
                <aside className="at-sidebar" id="at-sidebar">
                    <Link href="/admin" className="at-sidebar__brand" aria-label="Dashboard admin">
                        <Stamp />
                        <span className="at-sidebar__wordmark">KB Admin</span>
                    </Link>
                    <nav className="at-sidebar__nav" aria-label="Menu admin">
                        <div className="at-sidebar__section">Utama</div>
                        <NavLink href="/admin" icon="grid" label="Dashboard" active={is('/admin', true)} />
                        <NavLink href="/admin/projects" icon="layers" label="Project" active={url === '/admin/projects' || is('/admin/projects/create') || /\/admin\/projects\/[^/]+\/edit/.test(url)} />
                        <NavLink href="/admin/chats" icon="chat" label="Log Chat AI" active={is('/admin/chats')} />
                        <NavLink href="/admin/users" icon="users" label="Pengguna" active={is('/admin/users')} />
                        <NavLink href="/admin/settings/ai" icon="sparkle" label="Pengaturan AI" active={is('/admin/settings')} />

                        {adminProjects && adminProjects.length > 0 && (
                            <>
                                <div className="at-sidebar__section">Artikel per project</div>
                                {adminProjects.map((p) => (
                                    <NavLink
                                        key={p.id}
                                        href={`/admin/projects/${p.slug}/articles`}
                                        icon="book"
                                        label={p.name}
                                        active={is(`/admin/projects/${p.slug}/articles`) || is(`/admin/projects/${p.slug}/categories`)}
                                    />
                                ))}
                            </>
                        )}
                    </nav>
                    <div className="at-sidebar__user">
                        <div className="at-avatar at-avatar--sm">{auth.user?.name.charAt(0).toUpperCase()}</div>
                        <div className="at-sidebar__user-info">
                            <div className="at-sidebar__user-name">{auth.user?.name}</div>
                            <div className="at-sidebar__user-email">{auth.user?.email}</div>
                        </div>
                        <Link href="/logout" method="post" as="button" className="at-icon-btn" aria-label="Keluar">
                            <Icon name="logout" size={16} />
                        </Link>
                    </div>
                </aside>

                <div className="at-shell">
                    <header className="at-header">
                        <button className="at-menu-toggle" onClick={toggleSidebar} aria-label="Buka/tutup menu">
                            <Icon name="menu" />
                        </button>
                        <div className="at-header__right">
                            {!aiEnabled && (
                                <Link href="/admin/settings/ai" className="at-badge at-badge--warning hidden sm:inline-flex" title="Atur provider & API key">
                                    AI belum aktif
                                </Link>
                            )}
                            <Link href="/" className="at-btn at-btn--outline at-btn--sm at-press">
                                <Icon name="external" size={14} /> <span className="hidden sm:inline">Lihat situs</span>
                            </Link>
                            <ThemeToggle />
                        </div>
                    </header>

                    <main className="at-main" id="at-main">
                        <div className="at-page-head">
                            <div className="at-page-head__row">
                                <div>
                                    {breadcrumb && (
                                        <nav className="at-breadcrumb mb-1 flex flex-wrap gap-1 text-sm" aria-label="Breadcrumb">
                                            {breadcrumb.map((b, i) => (
                                                <span key={i} className="flex gap-1">
                                                    {b.href ? (
                                                        <Link href={b.href} className="hover:underline">
                                                            {b.label}
                                                        </Link>
                                                    ) : (
                                                        <span>{b.label}</span>
                                                    )}
                                                    {i < breadcrumb.length - 1 && <span>/</span>}
                                                </span>
                                            ))}
                                        </nav>
                                    )}
                                    <h1 className="at-page-head__title">{title}</h1>
                                    {subtitle && <p className="at-page-head__subtitle">{subtitle}</p>}
                                </div>
                                {actions && <div className="at-page-head__actions">{actions}</div>}
                            </div>
                        </div>
                        {children}
                    </main>
                </div>
            </div>
            <div className="at-backdrop" onClick={closeDrawer} aria-hidden="true" />
            <Flash />
        </>
    );
}
