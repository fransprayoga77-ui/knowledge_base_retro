import { Link, router } from '@inertiajs/react';
import { Icon } from '../../../components/Icon';
import AdminLayout from '../../../layouts/AdminLayout';
import type { Project } from '../../../types';

type Row = Project & { articles_count: number; categories_count: number; members_count: number };

export default function Index({ projects }: { projects: Row[] }) {
    function destroy(p: Row) {
        if (confirm(`Hapus project "${p.name}" beserta ${p.articles_count} artikelnya? Tindakan ini tidak bisa dibatalkan.`)) {
            router.delete(`/admin/projects/${p.slug}`);
        }
    }

    return (
        <AdminLayout
            title="Project"
            subtitle="Setiap project punya pusat bantuan sendiri di /slug-project."
            actions={
                <Link href="/admin/projects/create" className="at-btn at-btn--primary at-press">
                    <Icon name="plus" size={16} /> Project baru
                </Link>
            }
        >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {projects.map((p) => (
                    <div key={p.id} className="at-card flex flex-col p-5">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h2 className="font-display text-2xl font-black text-text-strong">{p.name}</h2>
                                <a href={`/${p.slug}`} target="_blank" className="text-sm text-text-muted hover:underline">
                                    /{p.slug} ↗
                                </a>
                            </div>
                            {p.is_published ? <span className="at-badge at-badge--success">Terbit</span> : <span className="at-badge at-badge--neutral">Tersembunyi</span>}
                        </div>
                        <p className="mt-3 flex-1 text-sm">{p.tagline}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {p.audiences.map((a) => (
                                <span key={a.key} className={`at-badge ${a.public ? 'at-badge--secondary' : 'at-badge--neutral'}`} title={a.public ? 'Publik' : 'Perlu login'}>
                                    {a.public ? '' : '🔒 '}
                                    {a.label}
                                </span>
                            ))}
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2 border-t-2 border-border-default pt-3 text-center text-sm">
                            <div>
                                <div className="font-mono text-xl font-bold text-text-strong">{p.articles_count}</div>artikel
                            </div>
                            <div>
                                <div className="font-mono text-xl font-bold text-text-strong">{p.categories_count}</div>kategori
                            </div>
                            <div>
                                <div className="font-mono text-xl font-bold text-text-strong">{p.members_count}</div>member
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link href={`/admin/projects/${p.slug}/articles`} className="at-btn at-btn--dark at-btn--sm at-press">
                                Artikel
                            </Link>
                            <Link href={`/admin/projects/${p.slug}/categories`} className="at-btn at-btn--outline at-btn--sm at-press">
                                Kategori
                            </Link>
                            <Link href={`/admin/projects/${p.slug}/edit`} className="at-btn at-btn--outline at-btn--sm at-press">
                                Pengaturan
                            </Link>
                            <button type="button" onClick={() => destroy(p)} className="at-btn at-btn--ghost at-btn--sm ml-auto text-danger" aria-label="Hapus project">
                                <Icon name="trash" size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {projects.length === 0 && <div className="at-card p-8 text-center">Belum ada project.</div>}
            </div>
        </AdminLayout>
    );
}
