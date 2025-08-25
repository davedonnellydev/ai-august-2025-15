import { ModeSummary, StoredArticle, SummaryMode } from '../types';

const STORAGE_KEY = 'summaries_v1';

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function emitChange(): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('summaries:changed'));
    } catch {
      // noop
    }
  }
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function saveAll(articles: StoredArticle[]): void {
  if (!hasStorage()) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  emitChange();
}

export function loadAll(): StoredArticle[] {
  if (!hasStorage()) {
    return [];
  }
  return safeParse<StoredArticle[]>(localStorage.getItem(STORAGE_KEY), []);
}

export function sanitizeUrl(input: string): string | null {
  try {
    const u = new URL(input.trim());
    if (!u.protocol.startsWith('http')) {
      return null;
    }
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

export function findByUrl(url: string): StoredArticle | undefined {
  const normalized = sanitizeUrl(url);
  if (!normalized) {
    return undefined;
  }
  return loadAll().find((a) => a.url === normalized);
}

export function upsertArticle(article: StoredArticle): void {
  const articles = loadAll();
  const idx = articles.findIndex((a) => a.url === article.url);
  if (idx >= 0) {
    articles[idx] = article;
  } else {
    articles.unshift(article);
  }
  saveAll(articles);
}

export function ensureArticle(url: string): StoredArticle {
  const normalized = sanitizeUrl(url);
  if (!normalized) {
    throw new Error('Invalid URL');
  }
  const existing = findByUrl(normalized);
  if (existing) {
    return existing;
  }
  const now = Date.now();
  const fresh: StoredArticle = {
    url: normalized,
    title: undefined,
    author: undefined,
    domain: new URL(normalized).hostname,
    lead_image_url: null,
    content: '',
    createdAt: now,
    updatedAt: now,
    summaries: {},
  };
  upsertArticle(fresh);
  return fresh;
}

export function setArticleParsedData(
  url: string,
  parsed: Partial<
    Pick<
      StoredArticle,
      'title' | 'author' | 'domain' | 'lead_image_url' | 'content'
    >
  >
): StoredArticle {
  const normalized = sanitizeUrl(url);
  if (!normalized) {
    throw new Error('Invalid URL');
  }
  const current = ensureArticle(normalized);
  const updated: StoredArticle = {
    ...current,
    title: parsed.title ?? current.title,
    author: parsed.author ?? current.author,
    domain: parsed.domain ?? current.domain,
    lead_image_url: parsed.lead_image_url ?? current.lead_image_url,
    content: parsed.content ?? current.content,
    updatedAt: Date.now(),
  };
  upsertArticle(updated);
  return updated;
}

export function setSummary(
  url: string,
  mode: SummaryMode,
  text: string
): StoredArticle {
  const normalized = sanitizeUrl(url);
  if (!normalized) {
    throw new Error('Invalid URL');
  }
  const article = ensureArticle(normalized);
  const summaries = { ...article.summaries };
  const summary: ModeSummary = { text, updatedAt: Date.now() };
  (summaries as any)[mode] = summary;
  const updated: StoredArticle = {
    ...article,
    summaries,
    updatedAt: Date.now(),
  };
  upsertArticle(updated);
  return updated;
}

export function listSummarised(): Array<
  Pick<StoredArticle, 'url' | 'title' | 'domain' | 'updatedAt'>
> {
  return loadAll()
    .filter((a) => Object.keys(a.summaries ?? {}).length > 0)
    .map((a) => ({
      url: a.url,
      title: a.title,
      domain: a.domain,
      updatedAt: a.updatedAt,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function clearAll(): void {
  if (!hasStorage()) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  emitChange();
}

export function deleteByUrl(url: string): void {
  if (!hasStorage()) {
    return;
  }
  const normalized = sanitizeUrl(url);
  if (!normalized) {
    return;
  }
  const articles = loadAll().filter((a) => a.url !== normalized);
  saveAll(articles);
}
