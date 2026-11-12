import { Head, Link } from '@inertiajs/react';
import { Icon } from '../../components/Icon';
import PublicLayout from '../../layouts/PublicLayout';
import type { Project } from '../../types';

type Item = Project & { article_count: number };

const ACCENTS = ['bg-accent', 'bg-secondary', 'bg-lime', 'bg-tertiary'];

export default function Index({ projects }: { projects: Item[] }) {
    return (
        <PublicLayout>
            <Head title="Pusat Bantuan" />
            <section className="kb-grid-bg border-b-2 border-ink">
                <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
                    <span className="at-badge at-badge--secondary">Knowledge Base</span>
                    <h1 className="mt-5 font-display text-5xl font-black leading-[1.02] text-text-strong sm:text-7xl">
                        Panduan,
                        <br />
                        <span className="inline-block bg-ink px-3 text-canvas">tanpa buku tebal.</span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg">
                        Pilih aplikasi untuk membaca panduan langkah demi langkah, atau tanyakan langsung ke asisten AI di setiap pusat bantuan.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-12">
                <h2 className="at-eyebrow mb-5 text-text-muted">Pusat bantuan tersedia</h2>
                {projects.length === 0 ? (
                    <div className="at-card p-8 text-center">Belum ada project yang diterbitkan.</div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((p, i) => (
                            <Link key={p.id} href={`/${p.slug}`} className="at-card at-press group flex flex-col overflow-hidden">
                                <div className={`${ACCENTS[i % ACCENTS.length]} flex h-24 items-end border-b-2 border-ink p-4`}>
                                    <span className="font-display text-3xl font-black text-ink">{p.name}</span>
                                </div>
                                <div className="flex flex-1 flex-col gap-4 p-5">
                                    <p className="flex-1 text-text">{p.tagline ?? p.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {p.audiences.map((a) => (
                                            <span key={a.key} className="at-badge at-badge--neutral">
                                                {a.label}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between border-t-2 border-border-default pt-3 text-sm font-semibold">
                                        <span>{p.article_count} artikel</span>
                                        <span className="flex items-center gap-1 text-text-strong group-hover:translate-x-1 transition-transform">
                                            Buka <Icon name="arrowRight" size={16} />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </PublicLayout>
    );
}
