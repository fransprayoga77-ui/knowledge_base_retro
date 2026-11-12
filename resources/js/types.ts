export interface User {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
}

export interface Audience {
    key: string;
    label: string;
    public?: boolean;
}

export interface Project {
    id: number;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    support_contact: string | null;
    color_preset?: string | null;
    audiences: Audience[];
    is_published?: boolean;
}

export interface ArticleLink {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    count: number;
    articles: ArticleLink[];
}

export interface SharedProps {
    appName: string;
    auth: { user: User | null };
    flash: { success?: string | null; error?: string | null };
    aiEnabled: boolean;
    errors: Record<string, string>;
    [key: string]: unknown;
}

export interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
}
