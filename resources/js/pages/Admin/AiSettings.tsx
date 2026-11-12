import { useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Field } from '../../components/Admin';
import { Icon } from '../../components/Icon';
import AdminLayout from '../../layouts/AdminLayout';
import { postJson } from '../../lib';

interface Preset {
    label: string;
    driver: 'anthropic' | 'openai';
    base_url: string | null;
    model: string;
    models: string[];
    key_url: string | null;
    note: string;
}

interface Props {
    providers: Record<string, Preset>;
    current: {
        provider: string;
        model: string;
        base_url: string | null;
        effort: string;
        has_key: boolean;
        key_hint: string | null;
        key_from_env: boolean;
        enabled: boolean;
    };
}

export default function AiSettings({ providers, current }: Props) {
    const form = useForm({
        provider: current.provider,
        model: current.model,
        base_url: current.base_url ?? '',
        effort: current.effort,
        api_key: '',
        clear_key: false,
    });
    const [test, setTest] = useState<{ ok: boolean; message: string; ms?: number } | null>(null);
    const [testing, setTesting] = useState(false);
    const preset = providers[form.data.provider];
    const providerChanged = form.data.provider !== current.provider;

    function choose(key: string) {
        const p = providers[key];
        setTest(null);
        form.setData((d) => ({
            ...d,
            provider: key,
            model: key === current.provider ? current.model : p.model,
            base_url: key === current.provider ? (current.base_url ?? '') : (p.base_url ?? ''),
            // Key provider lama hampir pasti tidak berlaku untuk provider baru.
            clear_key: key !== current.provider && current.has_key,
            api_key: '',
        }));
    }

    async function runTest() {
        setTesting(true);
        setTest(null);
        try {
            setTest(await postJson('/admin/settings/ai/test', form.data));
        } catch (e) {
            setTest({ ok: false, message: e instanceof Error ? e.message : 'Gagal menguji.' });
        } finally {
            setTesting(false);
        }
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        form.put('/admin/settings/ai', { preserveScroll: true, onSuccess: () => form.setData('api_key', '') });
    }

    return (
        <AdminLayout
            title="Pengaturan AI"
            subtitle="Pilih model AI untuk asisten di semua pusat bantuan. Jawaban tetap hanya diambil dari artikel."
            actions={
                current.enabled ? <span className="at-badge at-badge--success">Aktif</span> : <span className="at-badge at-badge--warning">Belum aktif</span>
            }
        >
            <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_420px]">
                <section className="at-card p-5">
                    <h2 className="mb-4 font-display text-xl font-bold text-text-strong">Provider</h2>
                    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Provider AI">
                        {Object.entries(providers).map(([key, p]) => {
                            const active = form.data.provider === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    onClick={() => choose(key)}
                                    className={`at-press flex flex-col justify-start rounded-sm border-2 border-ink p-4 text-left ${active ? 'bg-accent text-ink shadow-md' : 'bg-surface hover:bg-accent-wash'}`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-display text-lg font-bold">{p.label}</span>
                                        {active && <Icon name="check" />}
                                    </div>
                                    <p className={`mt-1 text-sm ${active ? 'text-ink' : 'text-text-muted'}`}>{p.note}</p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="at-card space-y-4 p-5">
                    <h2 className="font-display text-xl font-bold text-text-strong">{preset.label}</h2>

                    <Field label="Model" error={form.errors.model} hint="Nama model persis seperti di dokumentasi provider. Model kecil/murah biasanya cukup untuk menjawab dari artikel." htmlFor="model">
                        <input id="model" list="model-list" className="at-input font-mono" value={form.data.model} onChange={(e) => form.setData('model', e.target.value)} placeholder="nama-model" />
                        <datalist id="model-list">
                            {preset.models.map((m) => (
                                <option key={m} value={m} />
                            ))}
                        </datalist>
                    </Field>

                    {preset.driver === 'openai' && (
                        <Field label="Base URL" error={form.errors.base_url} hint="Alamat API yang kompatibel dengan OpenAI (tanpa /chat/completions)." htmlFor="base_url">
                            <input id="base_url" className="at-input font-mono text-sm" value={form.data.base_url} onChange={(e) => form.setData('base_url', e.target.value)} placeholder="https://…/v1" />
                        </Field>
                    )}

                    <Field
                        label="API key"
                        error={form.errors.api_key}
                        hint={
                            <>
                                {current.has_key && !providerChanged && !form.data.clear_key
                                    ? `Tersimpan ${current.key_hint}${current.key_from_env ? ' (dari .env)' : ''}. Kosongkan bila tidak ingin mengganti.`
                                    : 'Disimpan terenkripsi di database.'}{' '}
                                {preset.key_url && (
                                    <a href={preset.key_url} target="_blank" rel="noreferrer" className="font-semibold underline">
                                        Ambil API key ↗
                                    </a>
                                )}
                            </>
                        }
                        htmlFor="api_key"
                    >
                        <input
                            id="api_key"
                            type="password"
                            autoComplete="off"
                            className="at-input font-mono"
                            value={form.data.api_key}
                            onChange={(e) => form.setData('api_key', e.target.value)}
                            placeholder={current.has_key && !form.data.clear_key ? current.key_hint ?? '' : 'tempel API key di sini'}
                        />
                    </Field>
                    {current.has_key && !current.key_from_env && (
                        <label className="at-check text-sm">
                            <input type="checkbox" checked={form.data.clear_key} onChange={(e) => form.setData('clear_key', e.target.checked)} /> Hapus API key yang tersimpan
                        </label>
                    )}

                    {preset.driver === 'anthropic' && (
                        <Field label="Ketelitian (effort)" hint="Rendah = lebih cepat dan hemat. Untuk menjawab dari artikel, rendah biasanya sudah cukup." htmlFor="effort">
                            <select id="effort" className="at-select" value={form.data.effort} onChange={(e) => form.setData('effort', e.target.value)}>
                                <option value="low">Rendah</option>
                                <option value="medium">Sedang</option>
                                <option value="high">Tinggi</option>
                            </select>
                        </Field>
                    )}

                    {test && (
                        <div className={`at-alert ${test.ok ? 'at-alert--success' : 'at-alert--danger'}`}>
                            <div className="at-alert__body text-sm">
                                <strong>{test.ok ? 'Berhasil' : 'Gagal'}</strong>
                                {test.ms !== undefined && ` (${(test.ms / 1000).toFixed(1)} detik)`}: {test.message}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                        <button type="button" className="at-btn at-btn--outline at-press" onClick={runTest} disabled={testing}>
                            {testing ? 'Menguji…' : 'Tes koneksi'}
                        </button>
                        <button type="submit" className="at-btn at-btn--primary at-press" disabled={form.processing}>
                            {form.processing ? 'Menyimpan…' : 'Simpan'}
                        </button>
                    </div>
                </section>
            </form>
        </AdminLayout>
    );
}
