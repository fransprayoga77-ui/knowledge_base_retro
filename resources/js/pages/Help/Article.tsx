import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Icon } from '../../components/Icon';
import PublicLayout from '../../layouts/PublicLayout';
import { formatDate, postJson } from '../../lib';
import type { ArticleLink, Project, SharedProps } from '../../types';

interface ArticleT {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    tags: string[] | null;
    platform: 'all' | 'web' | 'mobile';
    status: string;
    verification: 'verified' | 'needs_review';
    updated_at: string;
    audience: { key: string; label: string };
    category: { id: number; name: string; slug: string } | null;
    html: string;
    toc: { id: string; text: string; level: number }[];
}

const PLATFORM: Record<string, string> = { web: 'Website', mobile: 'Aplikasi mobile' };

export default function Article({ project, article, siblings }: { project: Project; article: ArticleT; siblings: ArticleLink[] }) {
    const { auth } = usePage<SharedProps>().props;
    const [voted, setVoted] = useState<boolean | null>(null);
    const idx = siblings.findIndex((s) => s.id === article.id);
    const prev = idx > 0 ? siblings[idx - 1] : null;
    const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

    async function vote(helpful: boolean) {
        setVoted(helpful);
        try {
            await postJson(`/${project.slug}/a/${article.slug}/feedback`, { helpful });
        } catch {
            /* tidak kritis */
        }
    }

    return (
        <PublicLayout project={project} audience={article.audience.key}>
            <Head title={`${article.title} · ${project.name}`} />
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[1fr_260px]">
                <article className="min-w-0">
                    <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-text-muted" aria-label="Breadcrumb">
                        <Link href={`/${project.slug}`} className="hover:text-text-strong">
                            {project.name}
                        </Link>
                        <span>/</span>
                        <Link href={`/${project.slug}/untuk/${article.audience.key}`} className="hover:text-text-strong">
                            {article.audience.label}
                        </Link>
                        {article.category && (
                            <>
                                <span>/</span>
                                <Link href={`/${project.slug}/untuk/${article.audience.key}#${article.category.slug}`} className="hover:text-text-strong">
                                    {article.category.name}
                                </Link>
                            </>
                        )}
                    </nav>

                    <div className="mb-4 flex flex-wrap gap-2">
                        <span className="at-badge at-badge--secondary">{article.audience.label}</span>
                        {article.platform !== 'all' && <span className="at-badge at-badge--tertiary">{PLATFORM[article.platform]}</span>}
                        {article.status !== 'published' && <span className="at-badge at-badge--warning">Draft (pratinjau admin)</span>}
                    </div>

                    <h1 className="font-display text-4xl font-black leading-tight text-text-strong sm:text-5xl">{article.title}</h1>
                    {article.excerpt && <p className="mt-4 max-w-[72ch] text-lg text-text-muted">{article.excerpt}</p>}
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-muted">
                        <span>Diperbarui {formatDate(article.updated_at)}</span>
                        {auth.user?.is_admin && (
                            <Link href={`/admin/projects/${project.slug}/articles/${article.id}/edit`} className="inline-flex items-center gap-1 font-semibold text-text-strong underline">
                                <Icon name="edit" size={14} /> Edit artikel
                            </Link>
                        )}
                    </div>

                    {article.verification === 'needs_review' && (
                        <div className="at-alert at-alert--warning mt-6 max-w-[72ch]">
                            <div className="at-alert__body flex gap-3">
                                <Icon name="alert" className="mt-0.5 shrink-0" />
                                <span>Sebagian ketentuan di artikel ini masih dikonfirmasi dan dapat berubah. Jika ragu, hubungi tim bantuan.</span>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 border-t-2 border-ink pt-2">
                        <div className="kb-prose" dangerouslySetInnerHTML={{ __html: article.html }} />
                    </div>

                    {article.tags && article.tags.length > 0 && (
                        <div className="mt-8 flex flex-wrap items-center gap-2">
                            <Icon name="tag" size={16} className="text-text-muted" />
                            {article.tags.map((t) => (
                                <Link key={t} href={`/${project.slug}/cari?q=${encodeURIComponent(t)}`} className="at-badge at-badge--neutral">
                                    {t}
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="at-card mt-10 flex flex-wrap items-center gap-4 p-5">
                        {voted === null ? (
                            <>
                                <span className="font-display text-lg font-bold text-text-strong">Apakah artikel ini membantu?</span>
                                <div className="flex gap-2">
                                    <button type="button" className="at-btn at-btn--outline at-btn--sm at-press" onClick={() => vote(true)}>
                                        <Icon name="thumbUp" size={16} /> Ya
                                    </button>
                                    <button type="button" className="at-btn at-btn--outline at-btn--sm at-press" onClick={() => vote(false)}>
                                        <Icon name="thumbDown" size={16} /> Tidak
                                    </button>
                                </div>
                            </>
                        ) : (
                            <span className="font-semibold">
                                {voted ? 'Terima kasih! Senang bisa membantu.' : 'Terima kasih. Coba tanyakan ke asisten di pojok kanan bawah, atau hubungi tim bantuan.'}
                            </span>
                        )}
                    </div>

                    {(prev || next) && (
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            {prev ? (
                                <Link href={`/${project.slug}/a/${prev.slug}`} className="at-card at-press p-4">
                                    <span className="at-eyebrow flex items-center gap-1 text-text-muted">
                                        <Icon name="arrowLeft" size={12} /> Sebelumnya
                                    </span>
                                    <span className="mt-1 block font-semibold text-text-strong">{prev.title}</span>
                                </Link>
                            ) : (
                                <span />
                            )}
                            {next && (
                                <Link href={`/${project.slug}/a/${next.slug}`} className="at-card at-press p-4 text-right">
                                    <span className="at-eyebrow flex items-center justify-end gap-1 text-text-muted">
                                        Berikutnya <Icon name="arrowRight" size={12} />
                                    </span>
                                    <span className="mt-1 block font-semibold text-text-strong">{next.title}</span>
                                </Link>
                            )}
                        </div>
                    )}
                </article>

                <aside className="hidden lg:block">
                    <div className="sticky top-24 space-y-6">
                        {article.toc.length > 1 && (
                            <div className="at-card p-4">
                                <div className="at-eyebrow mb-2 text-text-muted">Di halaman ini</div>
                                <ul className="space-y-1 text-sm">
                                    {article.toc.map((h) => (
                                        <li key={h.id} className={h.level === 3 ? 'pl-3' : ''}>
                                            <a href={`#${h.id}`} className="block rounded-sm px-2 py-1 hover:bg-accent-wash">
                                                {h.text}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {siblings.length > 1 && article.category && (
                            <div className="at-card p-4">
                                <div className="at-eyebrow mb-2 text-text-muted">{article.category.name}</div>
                                <ul className="space-y-1 text-sm">
                                    {siblings.map((s) => (
                                        <li key={s.id}>
                                            <Link
                                                href={`/${project.slug}/a/${s.slug}`}
                                                className={`block rounded-sm px-2 py-1 ${s.id === article.id ? 'bg-ink font-semibold text-canvas' : 'hover:bg-accent-wash'}`}
                                            >
                                                {s.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </PublicLayout>
    );
}
