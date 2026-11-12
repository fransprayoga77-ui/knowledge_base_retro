import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Stamp } from '../../components/Icon';

export default function Login() {
    const form = useForm({ email: '', password: '', remember: true });

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post('/login', { onFinish: () => form.reset('password') });
    }

    return (
        <div className="kb-grid-bg grid min-h-screen place-items-center px-4 py-12">
            <Head title="Masuk" />
            <div className="at-card w-full max-w-md p-8">
                <Link href="/" className="mb-6 flex items-center gap-3">
                    <Stamp size={36} />
                    <span className="font-display text-xl font-black text-text-strong">Knowledge Base</span>
                </Link>
                <h1 className="font-display text-3xl font-black text-text-strong">Masuk</h1>
                <p className="mt-1 text-text-muted">Untuk admin, atau tim yang punya akses panduan khusus.</p>

                <form onSubmit={submit} className="mt-6 space-y-4">
                    {form.errors.email && (
                        <div className="at-alert at-alert--danger">
                            <div className="at-alert__body">{form.errors.email}</div>
                        </div>
                    )}
                    <div>
                        <label className="at-form-label" htmlFor="email">
                            Email
                        </label>
                        <input id="email" type="email" className="at-input" autoComplete="email" required value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                    </div>
                    <div>
                        <label className="at-form-label" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="at-input"
                            autoComplete="current-password"
                            required
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                        />
                    </div>
                    <label className="at-check">
                        <input type="checkbox" checked={form.data.remember} onChange={(e) => form.setData('remember', e.target.checked)} /> Ingat saya
                    </label>
                    <button type="submit" className="at-btn at-btn--primary at-btn--block at-btn--lg at-press" disabled={form.processing}>
                        {form.processing ? 'Memproses…' : 'Masuk'}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm">
                    <Link href="/" className="font-semibold underline">
                        ← Kembali ke pusat bantuan
                    </Link>
                </p>
            </div>
        </div>
    );
}
