import { Link, router, usePage } from '@inertiajs/react';
import { Icon } from '../../../components/Icon';
import AdminLayout from '../../../layouts/AdminLayout';
import type { SharedProps, User } from '../../../types';

type Row = User & { projects: { id: number; name: string }[] };

export default function Index({ users }: { users: Row[] }) {
    const { auth } = usePage<SharedProps>().props;

    return (
        <AdminLayout
            title="Pengguna"
            subtitle="Admin mengelola semua konten. Member hanya bisa membaca panduan untuk peran yang diberikan (mis. vendor atau driver)."
            actions={
                <Link href="/admin/users/create" className="at-btn at-btn--primary at-press">
                    <Icon name="plus" size={16} /> Pengguna baru
                </Link>
            }
        >
            <div className="at-card">
                <div className="at-table-wrap">
                    <table className="at-table">
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Peran</th>
                                <th>Akses project</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="font-semibold text-text-strong">{u.name}</div>
                                        <div className="text-sm text-text-muted">{u.email}</div>
                                    </td>
                                    <td>{u.is_admin ? <span className="at-badge at-badge--accent">Admin</span> : <span className="at-badge at-badge--neutral">Member</span>}</td>
                                    <td className="text-sm">{u.is_admin ? 'Semua' : u.projects.map((p) => p.name).join(', ') || '—'}</td>
                                    <td className="whitespace-nowrap text-right">
                                        <Link href={`/admin/users/${u.id}/edit`} className="at-icon-btn" aria-label="Ubah">
                                            <Icon name="edit" size={16} />
                                        </Link>
                                        {u.id !== auth.user?.id && (
                                            <button
                                                type="button"
                                                className="at-icon-btn ml-1"
                                                aria-label="Hapus"
                                                onClick={() => confirm(`Hapus pengguna ${u.name}?`) && router.delete(`/admin/users/${u.id}`)}
                                            >
                                                <Icon name="trash" size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
