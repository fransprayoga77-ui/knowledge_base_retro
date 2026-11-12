import { Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Field } from '../../../components/Admin';
import { Icon } from '../../../components/Icon';
import AdminLayout from '../../../layouts/AdminLayout';
import type { Audience, Project } from '../../../types';

function slugify(s: string) {
    return s
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

export default function Form({ project }: { project: Project | null }) {
    const form = useForm({
        name: project?.name ?? '',
        slug: project?.slug ?? '',
        tagline: project?.tagline ?? '',
        description: project?.description ?? '',
        support_contact: project?.support_contact ?? '',
        is_published: project?.is_published ?? true,
        audiences: (project?.audiences ?? [{ key: 'customer', label: 'Pelanggan', public: true }]) as Audience[],
    });
    const errors = form.errors as Record<string, string>;

    function setAudience(i: number, patch: Partial<Audience>) {
        form.setData(
            'audiences',
            form.data.audiences.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
        );
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        if (project) form.put(`/admin/projects/${project.slug}`);
        else form.post('/admin/projects');
    }

    return (
        <AdminLayout
            title={project ? `Pengaturan ${project.name}` : 'Project baru'}
            breadcrumb={[{ label: 'Project', href: '/admin/projects' }, { label: project ? project.name : 'Baru' }]}
        >
            <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_420px]">
                <section className="at-card space-y-4 p-6">
                    <Field label="Nama project" error={errors.name} htmlFor="name">
                        <input
                            id="name"
                            className="at-input"
                            value={form.data.name}
                            onChange={(e) => {
                                const name = e.target.value;
                                form.setData((d) => ({ ...d, name, slug: project || d.slug !== slugify(d.name) ? d.slug : slugify(name) }));
                            }}
                            required
                        />
                    </Field>
                    <Field label="Slug (alamat URL)" error={errors.slug} hint={`Pusat bantuan akan tersedia di /${form.data.slug || 'slug'}`} htmlFor="slug">
                        <input id="slug" className="at-input font-mono" value={form.data.slug} onChange={(e) => form.setData('slug', slugify(e.target.value))} required />
                    </Field>
                    <Field label="Tagline" error={errors.tagline} htmlFor="tagline">
                        <input id="tagline" className="at-input" value={form.data.tagline} onChange={(e) => form.setData('tagline', e.target.value)} />
                    </Field>
                    <Field label="Deskripsi" error={errors.description} htmlFor="description">
                        <textarea id="description" className="at-textarea" rows={3} value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
                    </Field>
                    <Field
                        label="Kontak bantuan resmi"
                        error={errors.support_contact}
                        hint="Ditampilkan di footer dan dipakai asisten AI saat pertanyaan tidak terjawab. Contoh: WhatsApp 0812-xxxx atau email cs@…"
                        htmlFor="support_contact"
                    >
                        <input id="support_contact" className="at-input" value={form.data.support_contact} onChange={(e) => form.setData('support_contact', e.target.value)} />
                    </Field>
                    <label className="at-check">
                        <input type="checkbox" checked={form.data.is_published} onChange={(e) => form.setData('is_published', e.target.checked)} /> Terbitkan pusat bantuan ini
                    </label>
                </section>

                <section className="at-card space-y-4 p-6">
                    <div>
                        <h2 className="font-display text-xl font-bold text-text-strong">Peran pembaca</h2>
                        <p className="text-sm text-text-muted">Artikel dikelompokkan per peran. Peran yang tidak publik hanya bisa dibaca admin dan member yang diberi akses.</p>
                    </div>
                    {errors.audiences && <p className="text-sm font-semibold text-danger">{errors.audiences}</p>}
                    {form.data.audiences.map((a, i) => (
                        <div key={i} className="space-y-2 rounded-sm border-2 border-ink p-3">
                            <div className="grid grid-cols-2 gap-2">
                                <input className="at-input" placeholder="Nama, mis. Vendor" value={a.label} onChange={(e) => setAudience(i, { label: e.target.value })} aria-label="Nama peran" />
                                <input
                                    className="at-input font-mono"
                                    placeholder="kode, mis. vendor"
                                    value={a.key}
                                    disabled={!!project && !!project.audiences.find((x) => x.key === a.key)}
                                    onChange={(e) => setAudience(i, { key: slugify(e.target.value) })}
                                    aria-label="Kode peran"
                                />
                            </div>
                            {(errors[`audiences.${i}.key`] || errors[`audiences.${i}.label`]) && (
                                <p className="text-sm text-danger">{errors[`audiences.${i}.key`] ?? errors[`audiences.${i}.label`]}</p>
                            )}
                            <div className="flex items-center justify-between">
                                <label className="at-check text-sm">
                                    <input type="checkbox" checked={!!a.public} onChange={(e) => setAudience(i, { public: e.target.checked })} /> Publik (tanpa login)
                                </label>
                                {form.data.audiences.length > 1 && (
                                    <button
                                        type="button"
                                        className="text-sm font-semibold text-danger"
                                        onClick={() => form.setData('audiences', form.data.audiences.filter((_, idx) => idx !== i))}
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="at-btn at-btn--outline at-btn--sm at-press"
                        onClick={() => form.setData('audiences', [...form.data.audiences, { key: '', label: '', public: false }])}
                    >
                        <Icon name="plus" size={14} /> Tambah peran
                    </button>
                </section>

                <div className="flex gap-3 xl:col-span-2">
                    <button type="submit" className="at-btn at-btn--primary at-press" disabled={form.processing}>
                        {form.processing ? 'Menyimpan…' : 'Simpan project'}
                    </button>
                    <Link href="/admin/projects" className="at-btn at-btn--outline at-press">
                        Batal
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}
