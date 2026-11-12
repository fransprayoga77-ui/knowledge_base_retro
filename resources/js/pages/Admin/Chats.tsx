import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Pagination } from '../../components/Admin';
import AdminLayout from '../../layouts/AdminLayout';
import { formatDate } from '../../lib';
import type { Paginated } from '../../types';

interface Log {
    id: number;
    question: string;
    answer: string | null;
    answered: boolean;
    feedback: 'up' | 'down' | null;
    error: string | null;
    sources: { n: number; title: string; slug: string }[] | null;
    created_at: string;
    project: { id: number; name: string; slug: string };
}

export default function Chats({ logs, projects, filters }: { logs: Paginated<Log>; projects: { id: number; name: string }[]; filters: Record<string, string | undefined> }) {
    const [open, setOpen] = useState<number | null>(null);

    function apply(patch: Record<string, string>) {
        const next: Record<string, string> = { ...(filters as Record<string, string>), ...patch };
        Object.keys(next).forEach((k) => next[k] === '' && delete next[k]);
        router.get('/admin/chats', next, { preserveState: true, replace: true });
    }

    return (
        <AdminLayout title="Log Chat AI" subtitle="Pertanyaan pengguna ke asisten. Pertanyaan yang tak terjawab adalah ide artikel berikutnya.">
            <div className="at-card mb-4 flex flex-wrap gap-3 p-4">
                <select className="at-select w-auto" value={filters.project ?? ''} onChange={(e) => apply({ project: e.target.value })} aria-label="Project">
                    <option value="">Semua project</option>
                    {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                        </option>
                    ))}
                </select>
                <select className="at-select w-auto" value={filters.answered ?? ''} onChange={(e) => apply({ answered: e.target.value })} aria-label="Status jawaban">
                    <option value="">Semua jawaban</option>
                    <option value="1">Terjawab</option>
                    <option value="0">Tak terjawab</option>
                </select>
                <select className="at-select w-auto" value={filters.feedback ?? ''} onChange={(e) => apply({ feedback: e.target.value })} aria-label="Penilaian">
                    <option value="">Semua penilaian</option>
                    <option value="up">👍 Membantu</option>
                    <option value="down">👎 Tidak membantu</option>
                </select>
            </div>

            <div className="at-card divide-y-2 divide-border-default">
                {logs.data.map((l) => (
                    <div key={l.id} className="p-4">
                        <button type="button" className="flex w-full items-start gap-3 text-left" onClick={() => setOpen(open === l.id ? null : l.id)}>
                            <span className="flex-1">
                                <span className="block font-semibold text-text-strong">“{l.question}”</span>
                                <span className="mt-1 block text-xs text-text-muted">
                                    {l.project.name} · {formatDate(l.created_at)}
                                </span>
                            </span>
                            <span className="flex shrink-0 flex-wrap justify-end gap-1">
                                {l.answered ? <span className="at-badge at-badge--success">Terjawab</span> : <span className="at-badge at-badge--danger">Tak terjawab</span>}
                                {l.feedback && <span className="at-badge at-badge--neutral">{l.feedback === 'up' ? '👍' : '👎'}</span>}
                                {l.error && <span className="at-badge at-badge--warning">{l.error === 'ai_disabled' ? 'AI nonaktif' : 'Error'}</span>}
                            </span>
                        </button>
                        {open === l.id && (
                            <div className="mt-3 rounded-sm border-2 border-border-default bg-canvas p-4 text-sm">
                                <div className="whitespace-pre-wrap">{l.answer}</div>
                                {l.sources && l.sources.length > 0 && (
                                    <div className="mt-3 text-xs">
                                        <strong>Sumber:</strong>{' '}
                                        {l.sources.map((s) => (
                                            <a key={s.n} href={`/${l.project.slug}/a/${s.slug}`} target="_blank" className="mr-2 underline">
                                                [{s.n}] {s.title}
                                            </a>
                                        ))}
                                    </div>
                                )}
                                {l.error && l.error !== 'ai_disabled' && <div className="mt-2 font-mono text-xs text-danger">{l.error}</div>}
                            </div>
                        )}
                    </div>
                ))}
                {logs.data.length === 0 && <div className="p-8 text-center text-text-muted">Belum ada percakapan.</div>}
            </div>
            <Pagination page={logs} />
        </AdminLayout>
    );
}
