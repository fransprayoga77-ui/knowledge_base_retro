import { Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Field } from '../../../components/Admin';
import AdminLayout from '../../../layouts/AdminLayout';
import type { Audience } from '../../../types';

interface UserT {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    access: Record<number, string[]>;
}

export default function Form({ user, projects }: { user: UserT | null; projects: { id: number; name: string; audiences: Audience[] }[] }) {
    const form = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        is_admin: user?.is_admin ?? false,
        access: (user?.access ?? {}) as Record<number, string[]>,
    });

    function toggle(projectId: number, key: string) {
        const current = form.data.access[projectId] ?? [];
        const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
        form.setData('access', { ...form.data.access, [projectId]: next });
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        if (user) form.put(`/admin/users/${user.id}`);
        else form.post('/admin/users');
    }

    return (
        <AdminLayout title={user ? 'Edit pengguna' : 'Pengguna baru'} breadcrumb={[{ label: 'Pengguna', href: '/admin/users' }, { label: user?.name ?? 'Baru' }]}>
            <form onSubmit={submit} className="grid max-w-5xl gap-6 lg:grid-cols-2">
                <section className="at-card space-y-4 p-6">
                    <Field label="Nama" error={form.errors.name} htmlFor="name">
                        <input id="name" className="at-input" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                    </Field>
                    <Field label="Email" error={form.errors.email} htmlFor="email">
                        <input id="email" type="email" className="at-input" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} required />
                    </Field>
                    <Field label="Password" error={form.errors.password} hint={user ? 'Kosongkan jika tidak diubah.' : 'Minimal 8 karakter.'} htmlFor="password">
                        <input id="password" type="password" className="at-input" autoComplete="new-password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
                    </Field>
                    <label className="at-check">
                        <input type="checkbox" checked={form.data.is_admin} onChange={(e) => form.setData('is_admin', e.target.checked)} /> Admin (bisa mengelola semua project)
                    </label>
                </section>

                <section className="at-card space-y-4 p-6">
                    <div>
                        <h2 className="font-display text-xl font-bold text-text-strong">Akses baca</h2>
                        <p className="text-sm text-text-muted">Peran publik selalu bisa dibaca semua orang. Centang peran tertutup yang boleh dibaca pengguna ini.</p>
                    </div>
                    {form.data.is_admin ? (
                        <p className="at-alert at-alert--info">
                            <span className="at-alert__body">Admin otomatis bisa membaca semua peran.</span>
                        </p>
                    ) : (
                        projects.map((p) => {
                            const closed = p.audiences.filter((a) => !a.public);
                            if (closed.length === 0) return null;
                            return (
                                <div key={p.id} className="rounded-sm border-2 border-ink p-3">
                                    <div className="mb-2 font-semibold text-text-strong">{p.name}</div>
                                    <div className="flex flex-wrap gap-4">
                                        {closed.map((a) => (
                                            <label key={a.key} className="at-check">
                                                <input type="checkbox" checked={(form.data.access[p.id] ?? []).includes(a.key)} onChange={() => toggle(p.id, a.key)} /> {a.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>

                <div className="flex gap-3 lg:col-span-2">
                    <button type="submit" className="at-btn at-btn--primary at-press" disabled={form.processing}>
                        {form.processing ? 'Menyimpan…' : 'Simpan'}
                    </button>
                    <Link href="/admin/users" className="at-btn at-btn--outline at-press">
                        Batal
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}
