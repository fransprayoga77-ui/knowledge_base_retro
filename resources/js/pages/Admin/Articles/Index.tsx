import { Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useRef, useState } from 'react';
import { Pagination, ReviewBadge, StatusBadge } from '../../../components/Admin';
import { Icon } from '../../../components/Icon';
import AdminLayout from '../../../layouts/AdminLayout';
import type { Paginated, Project } from '../../../types';

interface Row {
    id: number;
    title: string;
    slug: string;
    audience: string;
    status: string;
    verification: string;
    platform: string;
    views: number;
    helpful_yes: number;
    helpful_no: number;
    category: string | null;
}
interface Filters {
    q?: string;
    audience?: string;
    status?: string;
    verification?: string;
    category?: string;
}

export default function Index({
    project,
    articles,
    categories,
    filters,
}: {
    project: Project;
    articles: Paginated<Row>;
    categories: { id: number; name: string; audience: string }[];
    filters: Filters;
}) {
    const [q, setQ] = useState(filters.q ?? '');
    const [showImport, setShowImport] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const importForm = useForm<{ files: File[]; status: string }>({ files: [], status: 'draft' });
    const label = (key: string) => project.audiences.find((a) => a.key === key)?.label ?? key;

    function apply(patch: Filters) {
        const next = { ...filters, ...patch };
        Object.keys(next).forEach((k) => !next[k as keyof Filters] && delete next[k as keyof Filters]);
        router.get(`/admin/projects/${project.slug}/articles`, next as Record<string, string>, { preserveState: true, replace: true });
    }

    function submitImport(e: FormEvent) {
        e.preventDefault();
        importForm.post(`/admin/projects/${project.slug}/import`, {
            forceFormData: true,
            onSuccess: () => {
                importForm.reset();
                setShowImport(false);
                if (fileRef.current) fileRef.current.value = '';
            },
        });
    }

    return (
        <AdminLayout
            title={`Artikel ${project.name}`}
            breadcrumb={[{ label: 'Project', href: '/admin/projects' }, { label: project.name }]}
            actions={
                <>
                    <a href={`/${project.slug}`} target="_blank" className="at-btn at-btn--outline at-press">
                        <Icon name="eye" size={16} /> Lihat
                    </a>
                    <Link href={`/admin/projects/${project.slug}/categories`} className="at-btn at-btn--outline at-press">
                        <Icon name="folder" size={16} /> Kategori
                    </Link>
                    <button type="button" className="at-btn at-btn--outline at-press" onClick={() => setShowImport((s) => !s)}>
                        <Icon name="upload" size={16} /> Impor .md
                    </button>
                    <Link href={`/admin/projects/${project.slug}/articles/create`} className="at-btn at-btn--primary at-press">
                        <Icon name="plus" size={16} /> Artikel baru
                    </Link>
                </>
            }
        >
            {showImport && (
                <form onSubmit={submitImport} className="at-card mb-6 space-y-3 p-5">
                    <h2 className="font-display text-xl font-bold text-text-strong">Impor file Markdown</h2>
                    <p className="text-sm text-text-muted">
                        Satu file = satu artikel, dengan frontmatter YAML (<code>title</code>, <code>slug</code>, <code>audience</code>, <code>category</code>, <code>tags</code>,
                        dst). Slug yang sudah ada akan diperbarui.
                    </p>
                    <input
                        ref={fileRef}
                        type="file"
                        multiple
                        accept=".md,.markdown,.txt"
                        className="at-input"
                        onChange={(e) => importForm.setData('files', Array.from(e.target.files ?? []))}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                        <select className="at-select w-auto" value={importForm.data.status} onChange={(e) => importForm.setData('status', e.target.value)}>
                            <option value="draft">Artikel baru sebagai draft</option>
                            <option value="published">Artikel baru langsung terbit</option>
                        </select>
                        <button type="submit" className="at-btn at-btn--dark at-press" disabled={importForm.processing || importForm.data.files.length === 0}>
                            {importForm.processing ? 'Mengimpor…' : `Impor ${importForm.data.files.length || ''} file`}
                        </button>
                    </div>
                    {Object.values(importForm.errors).map((err, i) => (
                        <p key={i} className="text-sm font-semibold text-danger">
                            {err}
                        </p>
                    ))}
                </form>
            )}

            <div className="at-card mb-4 flex flex-wrap items-center gap-3 p-4">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        apply({ q });
                    }}
                    className="relative min-w-[220px] flex-1"
                >
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                        <Icon name="search" size={16} />
                    </span>
                    <input className="at-input !pl-9" placeholder="Cari judul atau slug…" value={q} onChange={(e) => setQ(e.target.value)} />
                </form>
                <select className="at-select w-auto" value={filters.audience ?? ''} onChange={(e) => apply({ audience: e.target.value, category: '' })} aria-label="Peran">
                    <option value="">Semua peran</option>
                    {project.audiences.map((a) => (
                        <option key={a.key} value={a.key}>
                            {a.label}
                        </option>
                    ))}
                </select>
                <select className="at-select w-auto" value={filters.category ?? ''} onChange={(e) => apply({ category: e.target.value })} aria-label="Kategori">
                    <option value="">Semua kategori</option>
                    {categories
                        .filter((c) => !filters.audience || c.audience === filters.audience)
                        .map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} ({label(c.audience)})
                            </option>
                        ))}
                </select>
                <select className="at-select w-auto" value={filters.status ?? ''} onChange={(e) => apply({ status: e.target.value })} aria-label="Status">
                    <option value="">Semua status</option>
                    <option value="published">Terbit</option>
                    <option value="draft">Draft</option>
                </select>
                <select className="at-select w-auto" value={filters.verification ?? ''} onChange={(e) => apply({ verification: e.target.value })} aria-label="Verifikasi">
                    <option value="">Semua verifikasi</option>
                    <option value="needs_review">Perlu konfirmasi</option>
                    <option value="verified">Terverifikasi</option>
                </select>
            </div>

            <div className="at-card">
                <div className="at-table-wrap">
                    <table className="at-table">
                        <thead>
                            <tr>
                                <th>Judul</th>
                                <th>Peran</th>
                                <th>Kategori</th>
                                <th>Status</th>
                                <th className="text-right">Dibaca</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {articles.data.map((a) => (
                                <tr key={a.id}>
                                    <td className="max-w-md">
                                        <Link href={`/admin/projects/${project.slug}/articles/${a.id}/edit`} className="font-semibold text-text-strong hover:underline">
                                            {a.title}
                                        </Link>
                                        <div className="font-mono text-xs text-text-muted">{a.slug}</div>
                                    </td>
                                    <td>{label(a.audience)}</td>
                                    <td>{a.category ?? <span className="text-text-muted">—</span>}</td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            <StatusBadge status={a.status} />
                                            <ReviewBadge verification={a.verification} />
                                        </div>
                                    </td>
                                    <td className="text-right font-mono">{a.views}</td>
                                    <td className="text-right">
                                        <a href={`/${project.slug}/a/${a.slug}`} target="_blank" className="at-icon-btn" aria-label="Lihat artikel">
                                            <Icon name="eye" size={16} />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {articles.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-muted">
                                        Tidak ada artikel yang cocok.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <Pagination page={articles} />
        </AdminLayout>
    );
}
