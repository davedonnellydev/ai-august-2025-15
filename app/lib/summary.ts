import { SummaryMode } from './types';

export const SUMMARY_MODES: SummaryMode[] = [
  'tldr',
  'plain-english',
  'key-takeaways',
  'structured-outline',
  'structured-summary',
  'faqs',
];

export const SummaryModeInstructions: Record<SummaryMode, string> = {
  tldr:
    'Write a 2-3 sentence abstract capturing the single central claim + most consequential implication. No lists. Output format: plain Markdown paragraph.',
  'plain-english':
    'Rewrite for a general audience at ~Grade 8 readability. Keep all concrete facts, avoid jargon. Output format: plain Markdown paragraph.',
  'key-takeaways':
    'Return 5-10 bullets. Each bullet ≤20 words. One fact per bullet. Preserve any figures and dates. Output format: Markdown bullet list',
  'structured-outline':
    "Produce a hierarchical outline mirroring the document's headings (H1-H3 max). Use nested Markdown lists. No commentary beyond the outline. Output format: nested Markdown list.",
  'structured-summary':
    "Produce a hierarchical outline mirroring the document's headings (H1-H3 max). Use Markdown headings. Underneath each heading, provide a brief summary of that section. Output format: nested Markdown headings and paragraphs.",
  faqs:
    'Derive 5-8 likely reader questions and answer them with 1-2 sentences each. Answers must be supported by CONTENT. Output format: Markdown headings and paragraphs.',
};


