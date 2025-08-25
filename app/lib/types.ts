export type SummaryMode =
  | 'tldr'
  | 'plain-english'
  | 'key-takeaways'
  | 'structured-outline'
  | 'structured-summary'
  | 'faqs';

export type ModeSummary = {
  text: string;
  updatedAt: number;
};

export type StoredArticle = {
  url: string;
  title?: string;
  author?: string;
  domain?: string;
  lead_image_url?: string | null;
  content: string;
  createdAt: number;
  updatedAt: number;
  summaries: Partial<Record<SummaryMode, ModeSummary>>;
};


