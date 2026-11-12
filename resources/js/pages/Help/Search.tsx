import { Head, Link, router } from '@inertiajs/react';
import { Icon } from '../../components/Icon';
import { SearchHero } from '../../components/SearchHero';
import PublicLayout from '../../layouts/PublicLayout';
import type { Project } from '../../types';

interface Result {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    audience: string;
    category: string | null;
}

export default function Search({ project, q, filter, results }: { project: Project; q: string; filter: string | null; results: Result[] }) {
    return (
        <PublicLayout project={project} audience={filter ?? undefined} hideHeaderSearch>
            <Head title={`Cari "${q}" · ${project.name}`} />
            <SearchHero key={q} slug={project.slug} title="Hasil pencarian" initial={q} />
            <div className="mx-auto max-w-4xl px-4 py-10">
                {project.audiences.length > 1 && (
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-text-muted">Untuk:</span>
                        {[{ key: '', label: 'Semua' }, ...project.audiences].map((a) => (
                            <button
                                key={a.key}
                                type="button"
                                className={`at-btn at-btn--sm at-press ${(filter ?? '') === a.key ? 'at-btn--dark' : 'at-btn--outline'}`}
                                onClick={() => router.get(`/${project.slug}/cari`, a.key ? { q, untuk: a.key } : { q }, { preserveScroll: true })}
                            >
                                {a.label}
                            </button>
                        ))}
                    </div>
                )}

                <p className="mb-4 text-text-muted">
                    {results.length} hasil untuk <strong className="text-text-strong">“{q}”</strong>
                </p>

                {results.length === 0 ? (
                    <div className="at-card p-8">
                        <h2 className="font-display text-2xl font-bold text-text-strong">Belum ketemu.</h2>
                        <p className="mt-2">Coba kata lain yang lebih umum, atau tanyakan langsung ke asisten AI lewat tombol di pojok kanan bawah.</p>
                    </div>
                ) : (
                    <div className="at-card divide-y-2 divide-border-default">
                        {results.map((r) => (
                            <Link key={r.id} href={`/${project.slug}/a/${r.slug}`} className="group flex items-start gap-3 p-5 hover:bg-accent-wash">
                                <span className="mt-1 text-accent">
                                    <Icon name="file" />
                                </span>
                                <span className="flex-1">
                                    <span className="block font-display text-lg font-bold text-text-strong group-hover:underline">{r.title}</span>
                                    {r.excerpt && <span className="mt-1 block text-text">{r.excerpt}</span>}
                                    <span className="mt-2 flex flex-wrap gap-2">
                                        <span className="at-badge at-badge--secondary">{r.audience}</span>
                                        {r.category && <span className="at-badge at-badge--neutral">{r.category}</span>}
                                    </span>
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
