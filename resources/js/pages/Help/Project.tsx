import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { CategoryCard } from '../../components/CategoryCard';
import { Icon } from '../../components/Icon';
import { SearchHero } from '../../components/SearchHero';
import PublicLayout from '../../layouts/PublicLayout';
import type { ArticleLink, Category, Project as ProjectT } from '../../types';

interface Group {
    key: string;
    label: string;
    categories: Category[];
}

export default function Project({
    project,
    groups,
    popular,
    hiddenAudiences,
}: {
    project: ProjectT;
    groups: Group[];
    popular: (ArticleLink & { audience: string })[];
    hiddenAudiences: string[];
}) {
    const [active, setActive] = useState(groups[0]?.key ?? '');
    const group = groups.find((g) => g.key === active);

    return (
        <PublicLayout project={project} audience={groups.length === 1 ? active : undefined} hideHeaderSearch>
            <Head title={project.name} />
            <SearchHero
                slug={project.slug}
                title={
                    <>
                        Ada yang bisa
                        <br />
                        kami <span className="inline-block bg-accent px-2 text-ink">bantu?</span>
                    </>
                }
                subtitle={project.tagline ?? project.description}
            >
                {popular.length > 0 && (
                    <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-text-muted">Populer:</span>
                        {popular.slice(0, 4).map((a) => (
                            <Link key={a.id} href={`/${project.slug}/a/${a.slug}`} className="rounded-sm border-2 border-ink bg-surface px-2.5 py-1 font-semibold text-text-strong hover:bg-accent-wash">
                                {a.title}
                            </Link>
                        ))}
                    </div>
                )}
            </SearchHero>

            <div className="mx-auto max-w-7xl px-4 py-12">
                {groups.length > 1 && (
                    <div className="mb-8">
                        <div className="at-eyebrow mb-3 text-text-muted">Saya adalah…</div>
                        <div className="at-tabs at-tabs--pills">
                            <div className="at-tabs__nav flex flex-wrap gap-2" role="tablist">
                                {groups.map((g) => (
                                    <button
                                        key={g.key}
                                        role="tab"
                                        aria-selected={g.key === active}
                                        className={`at-tabs__tab ${g.key === active ? 'is-active' : ''}`}
                                        onClick={() => setActive(g.key)}
                                    >
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {group && (
                    <>
                        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                            <h2 className="font-display text-3xl font-black text-text-strong">Panduan {group.label}</h2>
                            <Link href={`/${project.slug}/untuk/${group.key}`} className="at-btn at-btn--outline at-btn--sm at-press">
                                Semua artikel {group.label} <Icon name="arrowRight" size={14} />
                            </Link>
                        </div>
                        {group.categories.length === 0 ? (
                            <div className="at-card p-8 text-center text-text-muted">Belum ada artikel untuk {group.label}.</div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {group.categories.map((c) => (
                                    <CategoryCard key={c.id} slug={project.slug} category={c} moreHref={`/${project.slug}/untuk/${group.key}#${c.slug}`} />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {groups.length === 0 && <div className="at-card p-8 text-center">Belum ada panduan yang bisa Anda akses.</div>}

                {hiddenAudiences.length > 0 && (
                    <div className="at-card at-card--subtle mt-10 flex flex-wrap items-center gap-4 p-5">
                        <span className="grid h-10 w-10 place-items-center rounded-sm border-2 border-ink bg-secondary text-ink">
                            <Icon name="lock" />
                        </span>
                        <p className="flex-1">
                            Panduan untuk <strong className="text-text-strong">{hiddenAudiences.join(', ')}</strong> hanya bisa dibaca setelah masuk.
                        </p>
                        <Link href="/login" className="at-btn at-btn--dark at-btn--sm at-press">
                            Masuk
                        </Link>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
