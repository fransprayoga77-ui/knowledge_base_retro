import { usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { postJson } from '../lib';
import type { Project, SharedProps } from '../types';
import { Icon } from './Icon';

interface Source {
    n: number;
    title: string;
    slug: string;
}
interface Message {
    role: 'user' | 'assistant';
    content: string;
    html?: string;
    sources?: Source[];
    id?: number;
    answered?: boolean;
    feedback?: 'up' | 'down';
}
interface ChatResponse {
    id: number;
    answer: string;
    html: string;
    answered: boolean;
    sources: Source[];
}

const SUGGESTIONS: Record<string, string[]> = {
    default: ['Bagaimana cara memulai?', 'Saya lupa password', 'Bagaimana menghubungi tim bantuan?'],
};

export function ChatWidget({ project, audience }: { project: Project; audience?: string }) {
    const { aiEnabled } = usePage<SharedProps>().props;
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const storageKey = `kb:chat:${project.slug}`;

    // Simpan percakapan per project selama sesi browser.
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) setMessages(JSON.parse(saved));
        } catch {
            /* abaikan */
        }
    }, [storageKey]);
    useEffect(() => {
        try {
            sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-20)));
        } catch {
            /* abaikan */
        }
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, storageKey]);
    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    async function send(question: string) {
        const q = question.trim();
        if (!q || loading) return;
        setError(null);
        const history = messages.map(({ role, content }) => ({ role, content })).slice(-8);
        setMessages((m) => [...m, { role: 'user', content: q }]);
        setInput('');
        setLoading(true);
        try {
            const res = await postJson<ChatResponse>(`/${project.slug}/chat`, { question: q, audience, history });
            setMessages((m) => [
                ...m,
                { role: 'assistant', content: res.answer, html: res.html, sources: res.sources, id: res.id, answered: res.answered },
            ]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
        } finally {
            setLoading(false);
        }
    }

    async function rate(index: number, feedback: 'up' | 'down') {
        const msg = messages[index];
        if (!msg.id || msg.feedback) return;
        setMessages((m) => m.map((x, i) => (i === index ? { ...x, feedback } : x)));
        try {
            await postJson(`/${project.slug}/chat/${msg.id}/feedback`, { feedback });
        } catch {
            /* tidak kritis */
        }
    }

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        void send(input);
    }

    return (
        <>
            {open && (
                <section className="kb-chat-panel at-card overflow-hidden" aria-label="Asisten bantuan">
                    <header className="flex items-center gap-3 border-b-2 border-ink bg-accent px-4 py-3 text-on-accent">
                        <span className="grid h-9 w-9 place-items-center rounded-sm border-2 border-ink bg-surface text-ink">
                            <Icon name="sparkle" size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="font-display text-lg font-bold leading-tight">Tanya Asisten</div>
                            <div className="truncate text-xs opacity-90">Jawaban dari artikel {project.name}</div>
                        </div>
                        {messages.length > 0 && (
                            <button type="button" className="text-xs font-semibold underline" onClick={() => setMessages([])}>
                                Mulai baru
                            </button>
                        )}
                        <button type="button" className="at-icon-btn" onClick={() => setOpen(false)} aria-label="Tutup asisten">
                            <Icon name="close" />
                        </button>
                    </header>

                    <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto bg-canvas p-4">
                        {messages.length === 0 && (
                            <div className="space-y-3">
                                <p className="text-sm text-text">
                                    Halo! Tanyakan apa saja tentang <strong className="text-text-strong">{project.name}</strong>. Saya akan
                                    menjawab berdasarkan artikel pusat bantuan.
                                </p>
                                {!aiEnabled && (
                                    <div className="at-alert at-alert--warning text-sm">
                                        <div className="at-alert__body">Mode AI belum aktif — saya akan menampilkan artikel yang paling relevan.</div>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {SUGGESTIONS.default.map((s) => (
                                        <button key={s} type="button" className="at-btn at-btn--outline at-btn--sm at-press" onClick={() => send(s)}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((m, i) =>
                            m.role === 'user' ? (
                                <div key={i} className="flex justify-end">
                                    <div className="max-w-[85%] rounded-md border-2 border-ink bg-ink px-3 py-2 text-sm text-canvas whitespace-pre-wrap">{m.content}</div>
                                </div>
                            ) : (
                                <div key={i} className="max-w-[95%] rounded-md border-2 border-ink bg-surface p-3 shadow-sm">
                                    <div className="kb-prose kb-prose--compact" dangerouslySetInnerHTML={{ __html: m.html ?? m.content }} />
                                    {m.sources && m.sources.length > 0 && (
                                        <div className="mt-3 border-t border-border-default pt-2">
                                            <div className="at-eyebrow mb-1 text-text-muted">Sumber</div>
                                            <ul className="space-y-1 text-sm">
                                                {m.sources.map((s) => (
                                                    <li key={s.n} className="flex gap-2">
                                                        <span className="kb-cite !align-baseline">{s.n}</span>
                                                        <a className="font-semibold text-text-strong underline decoration-accent decoration-2 underline-offset-2" href={`/${project.slug}/a/${s.slug}`}>
                                                            {s.title}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {m.id && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
                                            {m.feedback ? (
                                                <span>Terima kasih atas penilaiannya.</span>
                                            ) : (
                                                <>
                                                    <span>Membantu?</span>
                                                    <button type="button" className="at-icon-btn !h-7 !w-7" onClick={() => rate(i, 'up')} aria-label="Membantu">
                                                        <Icon name="thumbUp" size={14} />
                                                    </button>
                                                    <button type="button" className="at-icon-btn !h-7 !w-7" onClick={() => rate(i, 'down')} aria-label="Tidak membantu">
                                                        <Icon name="thumbDown" size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ),
                        )}

                        {loading && (
                            <div className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-surface px-3 py-2 text-sm">
                                <span className="at-spinner" aria-hidden="true" /> Mencari jawaban…
                            </div>
                        )}
                        {error && (
                            <div className="at-alert at-alert--danger text-sm">
                                <div className="at-alert__body">{error}</div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={onSubmit} className="flex items-end gap-2 border-t-2 border-ink bg-surface p-3">
                        <textarea
                            ref={inputRef}
                            className="at-textarea min-h-[44px] flex-1 resize-none"
                            rows={1}
                            maxLength={1000}
                            placeholder="Tulis pertanyaan…"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    void send(input);
                                }
                            }}
                        />
                        <button type="submit" className="at-btn at-btn--primary at-btn--icon at-press" disabled={loading || !input.trim()} aria-label="Kirim">
                            <Icon name="send" />
                        </button>
                    </form>
                </section>
            )}

            <button
                type="button"
                className="kb-chat-fab at-btn at-btn--dark at-btn--lg at-press"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-label={open ? 'Tutup asisten' : 'Tanya asisten'}
            >
                <Icon name={open ? 'close' : 'chat'} />
                <span className="hidden sm:inline">{open ? 'Tutup' : 'Tanya Asisten'}</span>
            </button>
        </>
    );
}
