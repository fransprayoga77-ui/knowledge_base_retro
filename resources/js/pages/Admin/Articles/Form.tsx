import { Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { Field } from '../../../components/Admin';
import { Icon } from '../../../components/Icon';
import AdminLayout from '../../../layouts/AdminLayout';
import { postJson } from '../../../lib';
import type { Project } from '../../../types';

interface ArticleT {
    id: number;
    title: string;
    slug: string;
    audience: string;
    category_id: number | null;
    excerpt: string | null;
    body: string;
    tags: string[] | null;
    platform: string;
    status: string;
    verification: string;
    review_note: string | null;
    position: number;
}

const TEMPLATE = `Satu kalimat tentang apa yang akan berhasil dilakukan pembaca.

## Langkah-langkah

1. Buka menu **Nama Menu**.
2. Tekan **Nama Tombol**.
3. Periksa hasilnya.

## Yang perlu diperhatikan

> **Penting:** Catatan penting untuk pembaca.

## Kendala umum

| Kendala | Solusi |
|---|---|
| Contoh kendala | Langkah yang bisa dicoba |
`;

export default function Form({ project, article, categories }: { project: Project; article: ArticleT | null; categories: { id: number; name: string; audience: string }[] }) {
    const form = useForm({
        title: article?.title ?? '',
        slug: article?.slug ?? '',
        audience: article?.audience ?? project.audiences[0]?.key ?? '',
        category_id: article?.category_id ? String(article.category_id) : '',
        excerpt: article?.excerpt ?? '',
        body: article?.body ?? TEMPLATE,
        tags: (article?.tags ?? []).join(', '),
        platform: article?.platform ?? 'all',
        status: article?.status ?? 'draft',
        verification: article?.verification ?? 'verified',
        review_note: article?.review_note ?? '',
        position: article?.position ?? 0,
    });
    const [tab, setTab] = useState<'tulis' | 'pratinjau'>('tulis');
    const [preview, setPreview] = useState('');

    useEffect(() => {
        if (tab !== 'pratinjau') return;
        postJson<{ html: string }>('/admin/preview', { body: form.data.body })
            .then((r) => setPreview(r.html))
            .catch(() => setPreview('<p>Gagal memuat pratinjau.</p>'));
    }, [tab, form.data.body]);

    function submit(e: FormEvent) {
        e.preventDefault();
        form.transform((d) => ({
            ...d,
            category_id: d.category_id || null,
            tags: d.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
        }));
        if (article) form.put(`/admin/projects/${project.slug}/articles/${article.id}`, { preserveScroll: true });
        else form.post(`/admin/projects/${project.slug}/articles`);
    }

    function destroy() {
        if (article && confirm(`Hapus artikel "${article.title}"?`)) {
            router.delete(`/admin/projects/${project.slug}/articles/${article.id}`);
        }
    }

    const cats = categories.filter((c) => c.audience === form.data.audience);

    return (
        <AdminLayout
            title={article ? 'Edit artikel' : 'Artikel baru'}
            breadcrumb={[
                { label: 'Project', href: '/admin/projects' },
                { label: project.name, href: `/admin/projects/${project.slug}/articles` },
                { label: article ? article.title : 'Baru' },
            ]}
            actions={
                article && (
                    <a href={`/${project.slug}/a/${article.slug}`} target="_blank" className="at-btn at-btn--outline at-press">
                        <Icon name="eye" size={16} /> Lihat di situs
                    </a>
                )
            }
        >
            <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <div className="space-y-4">
                    <section className="at-card space-y-4 p-5">
                        <Field label="Judul" error={form.errors.title} htmlFor="title">
                            <input id="title" className="at-input !text-lg font-semibold" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} required />
                        </Field>
                        <Field label="Ringkasan" error={form.errors.excerpt} hint="Satu kalimat. Tampil di hasil pencarian dan daftar artikel." htmlFor="excerpt">
                            <input id="excerpt" className="at-input" value={form.data.excerpt} onChange={(e) => form.setData('excerpt', e.target.value)} />
                        </Field>
                    </section>

                    <section className="at-card p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="at-segment">
                                <button type="button" className={`at-segment__btn ${tab === 'tulis' ? 'is-active' : ''}`} onClick={() => setTab('tulis')}>
                                    Tulis
                                </button>
                                <button type="button" className={`at-segment__btn ${tab === 'pratinjau' ? 'is-active' : ''}`} onClick={() => setTab('pratinjau')}>
                                    Pratinjau
                                </button>
                            </div>
                            <span className="text-xs text-text-muted">Markdown: ## judul bagian, 1. langkah, **tebal**, &gt; catatan, tabel</span>
                        </div>
                        {tab === 'tulis' ? (
                            <textarea
                                className="at-textarea min-h-[520px] font-mono text-sm leading-relaxed"
                                value={form.data.body}
                                onChange={(e) => form.setData('body', e.target.value)}
                                aria-label="Isi artikel (Markdown)"
                            />
                        ) : (
                            <div className="min-h-[520px] rounded-sm border-2 border-border-default bg-canvas p-5">
                                <div className="kb-prose" dangerouslySetInnerHTML={{ __html: preview }} />
                            </div>
                        )}
                        {form.errors.body && <p className="mt-1 text-sm font-semibold text-danger">{form.errors.body}</p>}
                    </section>
                </div>

                <aside className="space-y-4">
                    <section className="at-card space-y-4 p-5">
                        <Field label="Status" htmlFor="status">
                            <select id="status" className="at-select" value={form.data.status} onChange={(e) => form.setData('status', e.target.value)}>
                                <option value="draft">Draft</option>
                                <option value="published">Terbit</option>
                            </select>
                        </Field>
                        <Field label="Untuk peran" error={form.errors.audience} htmlFor="audience">
                            <select
                                id="audience"
                                className="at-select"
                                value={form.data.audience}
                                onChange={(e) => form.setData((d) => ({ ...d, audience: e.target.value, category_id: '' }))}
                            >
                                {project.audiences.map((a) => (
                                    <option key={a.key} value={a.key}>
                                        {a.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field
                            label="Kategori"
                            error={form.errors.category_id}
                            hint={
                                <Link href={`/admin/projects/${project.slug}/categories`} className="underline">
                                    Kelola kategori
                                </Link>
                            }
                            htmlFor="category"
                        >
                            <select id="category" className="at-select" value={form.data.category_id} onChange={(e) => form.setData('category_id', e.target.value)}>
                                <option value="">— Tanpa kategori —</option>
                                {cats.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Platform" htmlFor="platform">
                                <select id="platform" className="at-select" value={form.data.platform} onChange={(e) => form.setData('platform', e.target.value)}>
                                    <option value="all">Semua</option>
                                    <option value="web">Website</option>
                                    <option value="mobile">Mobile</option>
                                </select>
                            </Field>
                            <Field label="Urutan" htmlFor="position">
                                <input id="position" type="number" min={0} className="at-input" value={form.data.position} onChange={(e) => form.setData('position', Number(e.target.value))} />
                            </Field>
                        </div>
                        <Field label="Slug" error={form.errors.slug} hint="Kosongkan untuk dibuat otomatis dari judul." htmlFor="slug">
                            <input id="slug" className="at-input font-mono text-sm" value={form.data.slug} onChange={(e) => form.setData('slug', e.target.value)} />
                        </Field>
                        <Field label="Tag / sinonim" error={form.errors.tags} hint="Pisahkan dengan koma. Isi kata yang biasa diketik pengguna, mis. DP, uang muka." htmlFor="tags">
                            <input id="tags" className="at-input" value={form.data.tags} onChange={(e) => form.setData('tags', e.target.value)} />
                        </Field>
                    </section>

                    <section className="at-card space-y-3 p-5">
                        <Field label="Verifikasi isi" htmlFor="verification">
                            <select id="verification" className="at-select" value={form.data.verification} onChange={(e) => form.setData('verification', e.target.value)}>
                                <option value="verified">Terverifikasi</option>
                                <option value="needs_review">Perlu konfirmasi</option>
                            </select>
                        </Field>
                        {form.data.verification === 'needs_review' && (
                            <Field label="Yang perlu dikonfirmasi" htmlFor="review_note" hint="Hanya terlihat oleh admin. Pembaca melihat peringatan umum.">
                                <textarea id="review_note" className="at-textarea" rows={4} value={form.data.review_note} onChange={(e) => form.setData('review_note', e.target.value)} />
                            </Field>
                        )}
                    </section>

                    <div className="flex flex-wrap gap-2">
                        <button type="submit" className="at-btn at-btn--primary at-press flex-1" disabled={form.processing}>
                            {form.processing ? 'Menyimpan…' : 'Simpan'}
                        </button>
                        {article && (
                            <button type="button" onClick={destroy} className="at-btn at-btn--outline at-press text-danger" aria-label="Hapus artikel">
                                <Icon name="trash" size={16} />
                            </button>
                        )}
                    </div>
                </aside>
            </form>
        </AdminLayout>
    );
}
