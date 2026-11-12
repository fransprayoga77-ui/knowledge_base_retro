import { Head, Link } from '@inertiajs/react';
import { Icon } from '../../components/Icon';
import PublicLayout from '../../layouts/PublicLayout';
import type { Category, Project } from '../../types';

export default function Audience({ project, audience, categories }: { project: Project; audience: { key: string; label: string }; categories: Category[] }) {
    return (
        <PublicLayout project={project} audience={audience.key}>
            <Head title={`Panduan ${audience.label} · ${project.name}`} />
            <div className="mx-auto max-w-7xl px-4 py-10">
                <nav className="mb-4 flex items-center gap-2 text-sm text-text-muted" aria-label="Breadcrumb">
                    <Link href={`/${project.slug}`} className="hover:text-text-strong">
                        {project.name}
                    </Link>
                    <span>/</span>
                    <span className="text-text-strong">{audience.label}</span>
                </nav>
                <h1 className="font-display text-4xl font-black text-text-strong sm:text-5xl">Panduan {audience.label}</h1>

                <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
                    <aside className="hidden lg:block">
                        <div className="sticky top-24 at-card p-4">
                            <div className="at-eyebrow mb-2 text-text-muted">Kategori</div>
                            <ul className="space-y-1 text-sm">
                                {categories.map((c) => (
                                    <li key={c.id}>
                                        <a href={`#${c.slug}`} className="flex justify-between rounded-sm px-2 py-1.5 hover:bg-accent-wash">
                                            <span>{c.name}</span>
                                            <span className="text-text-muted">{c.count}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>
                    <div className="space-y-8">
                        {categories.map((c) => (
                            <section key={c.id} id={c.slug} className="scroll-mt-24">
                                <h2 className="mb-3 font-display text-2xl font-bold text-text-strong">{c.name}</h2>
                                <div className="at-card divide-y-2 divide-border-default">
                                    {c.articles.map((a) => (
                                        <Link key={a.id} href={`/${project.slug}/a/${a.slug}`} className="group flex items-start gap-3 p-4 hover:bg-accent-wash">
                                            <span className="mt-1 text-accent">
                                                <Icon name="file" />
                                            </span>
                                            <span className="flex-1">
                                                <span className="block font-semibold text-text-strong group-hover:underline">{a.title}</span>
                                                {a.excerpt && <span className="mt-0.5 block text-sm text-text-muted">{a.excerpt}</span>}
                                            </span>
                                            <Icon name="arrowRight" size={16} className="mt-1 text-text-muted" />
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ))}
                        {categories.length === 0 && <div className="at-card p-8 text-center text-text-muted">Belum ada artikel.</div>}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
