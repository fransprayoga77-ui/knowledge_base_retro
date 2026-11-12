import { Link } from '@inertiajs/react';
import type { Category } from '../types';
import { Icon } from './Icon';

export function CategoryCard({ slug, category, moreHref }: { slug: string; category: Category; moreHref?: string }) {
    return (
        <div className="at-card flex flex-col p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="font-display text-xl font-bold leading-snug text-text-strong">{category.name}</h3>
                <span className="at-badge at-badge--neutral shrink-0">{category.count}</span>
            </div>
            <ul className="flex-1 space-y-2">
                {category.articles.map((a) => (
                    <li key={a.id}>
                        <Link href={`/${slug}/a/${a.slug}`} className="group flex items-start gap-2 text-[0.95rem] leading-snug hover:text-text-strong">
                            <span className="mt-0.5 text-accent">
                                <Icon name="file" size={16} />
                            </span>
                            <span className="underline-offset-4 group-hover:underline">{a.title}</span>
                        </Link>
                    </li>
                ))}
            </ul>
            {moreHref && category.count > category.articles.length && (
                <Link href={moreHref} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-text-strong">
                    Lihat semua {category.count} artikel <Icon name="arrowRight" size={14} />
                </Link>
            )}
        </div>
    );
}
