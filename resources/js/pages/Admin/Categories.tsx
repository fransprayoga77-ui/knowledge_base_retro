import { router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Icon } from '../../components/Icon';
import AdminLayout from '../../layouts/AdminLayout';
import type { Project } from '../../types';

interface Cat {
    id: number;
    name: string;
    slug: string;
    audience: string;
    position: number;
    articles_count: number;
}

function Row({ project, cat }: { project: Project; cat: Cat }) {
    const [editing, setEditing] = useState(false);
    const form = useForm({ name: cat.name, audience: cat.audience, position: cat.position });

    function save(e: FormEvent) {
        e.preventDefault();
        form.put(`/admin/projects/${project.slug}/categories/${cat.id}`, { preserveScroll: true, onSuccess: () => setEditing(false) });
    }

    if (editing) {
        return (
            <tr>
                <td colSpan={4}>
                    <form onSubmit={save} className="flex flex-wrap items-center gap-2">
                        <input className="at-input w-20" type="number" min={0} value={form.data.position} onChange={(e) => form.setData('position', Number(e.target.value))} aria-label="Urutan" />
                        <input className="at-input min-w-[200px] flex-1" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} aria-label="Nama kategori" />
                        <button className="at-btn at-btn--primary at-btn--sm at-press" disabled={form.processing}>
                            Simpan
                        </button>
                        <button type="button" className="at-btn at-btn--ghost at-btn--sm" onClick={() => setEditing(false)}>
                            Batal
                        </button>
                    </form>
                </td>
            </tr>
        );
    }

    return (
        <tr>
            <td className="w-16 font-mono">{cat.position}</td>
            <td className="font-semibold text-text-strong">{cat.name}</td>
            <td className="font-mono">{cat.articles_count}</td>
            <td className="text-right">
                <button type="button" className="at-icon-btn" onClick={() => setEditing(true)} aria-label="Ubah">
                    <Icon name="edit" size={16} />
                </button>
                <button
                    type="button"
                    className="at-icon-btn ml-1"
                    aria-label="Hapus"
                    onClick={() => confirm(`Hapus kategori "${cat.name}"?`) && router.delete(`/admin/projects/${project.slug}/categories/${cat.id}`, { preserveScroll: true })}
                >
                    <Icon name="trash" size={16} />
                </button>
            </td>
        </tr>
    );
}

export default function Categories({ project, categories }: { project: Project; categories: Cat[] }) {
    const form = useForm({ name: '', audience: project.audiences[0]?.key ?? '', position: categories.length + 1 });

    function add(e: FormEvent) {
        e.preventDefault();
        form.post(`/admin/projects/${project.slug}/categories`, { preserveScroll: true, onSuccess: () => form.reset('name') });
    }

    return (
        <AdminLayout
            title="Kategori"
            subtitle="Kategori dikelompokkan per peran. Urutan menentukan posisi di halaman bantuan."
            breadcrumb={[
                { label: 'Project', href: '/admin/projects' },
                { label: project.name, href: `/admin/projects/${project.slug}/articles` },
                { label: 'Kategori' },
            ]}
        >
            <form onSubmit={add} className="at-card mb-6 flex flex-wrap items-end gap-3 p-4">
                <div className="min-w-[220px] flex-1">
                    <label className="at-form-label" htmlFor="cat-name">
                        Kategori baru
                    </label>
                    <input id="cat-name" className="at-input" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="mis. Pembayaran" required />
                    {form.errors.name && <p className="mt-1 text-sm text-danger">{form.errors.name}</p>}
                </div>
                <div>
                    <label className="at-form-label" htmlFor="cat-aud">
                        Peran
                    </label>
                    <select id="cat-aud" className="at-select" value={form.data.audience} onChange={(e) => form.setData('audience', e.target.value)}>
                        {project.audiences.map((a) => (
                            <option key={a.key} value={a.key}>
                                {a.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="w-24">
                    <label className="at-form-label" htmlFor="cat-pos">
                        Urutan
                    </label>
                    <input id="cat-pos" type="number" min={0} className="at-input" value={form.data.position} onChange={(e) => form.setData('position', Number(e.target.value))} />
                </div>
                <button className="at-btn at-btn--primary at-press" disabled={form.processing}>
                    <Icon name="plus" size={16} /> Tambah
                </button>
            </form>

            <div className="grid gap-6 xl:grid-cols-2">
                {project.audiences.map((a) => {
                    const rows = categories.filter((c) => c.audience === a.key);
                    return (
                        <section key={a.key} className="at-card p-5">
                            <h2 className="mb-3 font-display text-xl font-bold text-text-strong">{a.label}</h2>
                            {rows.length === 0 ? (
                                <p className="text-sm text-text-muted">Belum ada kategori.</p>
                            ) : (
                                <div className="at-table-wrap">
                                    <table className="at-table at-table--dense">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Nama</th>
                                                <th>Artikel</th>
                                                <th />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((c) => (
                                                <Row key={c.id} project={project} cat={c} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>
        </AdminLayout>
    );
}
