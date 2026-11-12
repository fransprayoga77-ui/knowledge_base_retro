import { Link } from '@inertiajs/react';
import { Kpi } from '../../components/Admin';
import { Icon } from '../../components/Icon';
import AdminLayout from '../../layouts/AdminLayout';
import { formatDate } from '../../lib';

interface Props {
    stats: { projects: number; articles: number; drafts: number; needsReview: number; chats: number; unanswered: number };
    projects: { id: number; name: string; slug: string; tagline: string | null; is_published: boolean; articles_count: number; review_count: number }[];
    needsReview: { id: number; title: string; slug: string; review_note: string | null; project: { name: string; slug: string } }[];
    unanswered: { id: number; question: string; created_at: string; project: { name: string; slug: string } }[];
    topArticles: { id: number; title: string; slug: string; views: number; helpful_yes: number; helpful_no: number; project: { slug: string } }[];
}

export default function Dashboard({ stats, projects, needsReview, unanswered, topArticles }: Props) {
    return (
        <AdminLayout
            title="Dashboard"
            subtitle="Ringkasan konten dan pertanyaan pengguna."
            actions={
                <Link href="/admin/projects/create" className="at-btn at-btn--primary at-press">
                    <Icon name="plus" size={16} /> Project baru
                </Link>
            }
        >
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <Kpi label="Artikel terbit" value={stats.articles} />
                <Kpi label="Perlu konfirmasi" value={stats.needsReview} tone="warning" />
                <Kpi label="Pertanyaan ke AI" value={stats.chats} tone="lime" />
                <Kpi label="Tak terjawab" value={stats.unanswered} tone="danger" />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
                <section className="at-card p-5 xl:col-span-2">
                    <h2 className="mb-4 font-display text-xl font-bold text-text-strong">Project</h2>
                    <div className="at-table-wrap">
                        <table className="at-table">
                            <thead>
                                <tr>
                                    <th>Nama</th>
                                    <th className="text-right">Artikel</th>
                                    <th className="text-right">Perlu konfirmasi</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <div className="font-semibold text-text-strong">{p.name}</div>
                                            <div className="text-sm text-text-muted">/{p.slug}</div>
                                        </td>
                                        <td className="text-right font-mono">{p.articles_count}</td>
                                        <td className="text-right font-mono">{p.review_count}</td>
                                        <td className="text-right">
                                            <Link href={`/admin/projects/${p.slug}/articles`} className="at-btn at-btn--outline at-btn--sm at-press">
                                                Kelola
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="at-card p-5">
                    <h2 className="mb-1 font-display text-xl font-bold text-text-strong">Pertanyaan tak terjawab</h2>
                    <p className="mb-4 text-sm text-text-muted">Bahan untuk artikel baru.</p>
                    {unanswered.length === 0 ? (
                        <p className="text-sm text-text-muted">Belum ada. 🎉</p>
                    ) : (
                        <ul className="space-y-3">
                            {unanswered.map((u) => (
                                <li key={u.id} className="border-l-4 border-danger pl-3">
                                    <div className="text-sm font-semibold text-text-strong">“{u.question}”</div>
                                    <div className="text-xs text-text-muted">
                                        {u.project.name} · {formatDate(u.created_at)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Link href="/admin/chats?answered=0" className="mt-4 inline-flex items-center gap-1 text-sm font-bold">
                        Lihat semua <Icon name="arrowRight" size={14} />
                    </Link>
                </section>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <section className="at-card p-5">
                    <h2 className="mb-1 font-display text-xl font-bold text-text-strong">Perlu dikonfirmasi</h2>
                    <p className="mb-4 text-sm text-text-muted">Artikel berisi ketentuan yang belum final. AI akan memberi catatan saat mengutipnya.</p>
                    <ul className="divide-y-2 divide-border-default">
                        {needsReview.map((a) => (
                            <li key={a.id} className="py-3">
                                <Link href={`/admin/projects/${a.project.slug}/articles/${a.id}/edit`} className="font-semibold text-text-strong hover:underline">
                                    {a.title}
                                </Link>
                                {a.review_note && <p className="mt-1 text-sm text-text-muted">{a.review_note}</p>}
                            </li>
                        ))}
                        {needsReview.length === 0 && <li className="py-3 text-sm text-text-muted">Semua artikel sudah terverifikasi.</li>}
                    </ul>
                </section>

                <section className="at-card p-5">
                    <h2 className="mb-4 font-display text-xl font-bold text-text-strong">Artikel paling sering dibaca</h2>
                    <div className="at-table-wrap">
                        <table className="at-table at-table--dense">
                            <thead>
                                <tr>
                                    <th>Judul</th>
                                    <th className="text-right">Dibaca</th>
                                    <th className="text-right">👍 / 👎</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topArticles.map((a) => (
                                    <tr key={a.id}>
                                        <td>
                                            <a href={`/${a.project.slug}/a/${a.slug}`} target="_blank" className="hover:underline">
                                                {a.title}
                                            </a>
                                        </td>
                                        <td className="text-right font-mono">{a.views}</td>
                                        <td className="text-right font-mono">
                                            {a.helpful_yes} / {a.helpful_no}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
