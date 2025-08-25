'use client';

import { useEffect, useState } from 'react';
import { Button, Text, TextInput, Select } from '@mantine/core';
import { ClientRateLimiter } from '@/app/lib/utils/api-helpers';

type SummaryModes =
  | 'tldr'
  | 'plain-english'
  | 'key-takeaways'
  | 'structured-outline'
  | 'structured-summary'
  | 'faqs';

const SummaryModeInstructions: Record<SummaryModes, string> = {
  tldr: 'Write a 2-3 sentence abstract capturing the single central claim + most consequential implication. No lists. Output format: plain Markdown paragraph.',
  'plain-english':
    'Rewrite for a general audience at ~Grade 8 readability. Keep all concrete facts, avoid jargon. Output format: plain Markdown paragraph.',
  'key-takeaways':
    'Return 5-10 bullets. Each bullet ≤20 words. One fact per bullet. Preserve any figures and dates. Output format: Markdown bullet list',
  'structured-outline':
    "Produce a hierarchical outline mirroring the document's headings (H1-H3 max). Use nested Markdown lists. No commentary beyond the outline. Output format: nested Markdown list.",
  'structured-summary':
    "Produce a hierarchical outline mirroring the document's headings (H1-H3 max). Use Markdown headings. Underneath each heading, provide a brief summary of that section. Output format: nested Markdown headings and paragraphs.",
  faqs: 'Derive 5-8 likely reader questions and answer them with 1-2 sentences each. Answers must be supported by CONTENT. Output format: Markdown headings and paragraphs.',
};

export function ArticleParser() {
  const [_input, setInput] = useState('');
  const [url, setUrl] = useState('');
  const [parsedWebsite, setParsedWebsite] = useState(null);
  const [summaryMode, setSummaryMode] = useState<SummaryModes>('tldr');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingRequests, setRemainingRequests] = useState(0);

  // Update remaining requests on component mount and after translations
  useEffect(() => {
    setRemainingRequests(ClientRateLimiter.getRemainingRequests());
  }, []);

  const parseUrl = async (): Promise<string> => {
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Parser failed');
      }

      const { article } = await res.json();
      setParsedWebsite(article);
      const content: string = article?.content ?? '';
      setInput(content);
      return content;
    } catch (error) {
      console.error('Parser error:', error);
      setError(error instanceof Error ? error.message : 'Parser failed');
      return '';
    }
  };

  const handleRequest = async () => {
    if (!url.trim()) {
      setError('Please enter a url of an article to summarise.');
      return;
    }

    // Check rate limit before proceeding
    if (!ClientRateLimiter.checkLimit()) {
      setError('Rate limit exceeded. Please try again later.');
      setRemainingRequests(ClientRateLimiter.getRemainingRequests());
      return;
    }

    setIsLoading(true);
    setError('');

    const parsedContent = await parseUrl();
    if (!parsedContent || parsedContent.trim().length === 0) {
      setIsLoading(false);
      setError('No content could be extracted from the provided URL.');
      return;
    }

    try {
      const summaryInstructions = SummaryModeInstructions[summaryMode];

      const response = await fetch('/api/openai/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: parsedContent,
          summaryInstructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        throw new Error(errorData.error || 'API call failed');
      }

      const result = await response.json();
      setResponse(result.response);

      // Update remaining requests after successful translation
      setRemainingRequests(ClientRateLimiter.getRemainingRequests());
    } catch (err) {
      console.error('API error:', err);
      setError(err instanceof Error ? err.message : 'API failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInput('');
    setUrl('');
    setSummaryMode('tldr');
    setParsedWebsite(null);
    setResponse('');
    setError('');
  };

  return (
    <>
      <div style={{ maxWidth: 600, margin: '20px auto', padding: '20px' }}>
        <TextInput
          value={url}
          onChange={(event) => setUrl(event.currentTarget.value)}
          size="md"
          radius="md"
          label="Enter a URL"
          placeholder="https://en.wikipedia.org/wiki/Singin%27_in_the_Rain"
        />

        <Select
          label="Summary mode"
          placeholder="Select mode"
          value={summaryMode}
          onChange={(value) => value && setSummaryMode(value as SummaryModes)}
          data={[
            { value: 'tldr', label: 'TL;DR' },
            { value: 'plain-english', label: 'Plain English' },
            { value: 'key-takeaways', label: 'Key Takeaways' },
            { value: 'structured-outline', label: 'Structured Outline' },
            { value: 'structured-summary', label: 'Structured Summary' },
            { value: 'faqs', label: 'FAQs' },
          ]}
          size="md"
          radius="md"
          mt="md"
        />

        <Button
          variant="filled"
          color="cyan"
          onClick={() => handleRequest()}
          loading={isLoading}
        >
          Summarise
        </Button>
        <Button variant="light" color="cyan" onClick={() => handleReset()}>
          Reset
        </Button>

        {error && (
          <Text c="red" ta="center" size="lg" maw={580} mx="auto" mt="xl">
            Error: {error}
          </Text>
        )}

        {response && (
          <Text c="dimmed" ta="center" size="lg" maw={580} mx="auto" mt="xl">
            Answer: {response}
          </Text>
        )}
      </div>

      <Text c="dimmed" ta="center" size="sm" maw={580} mx="auto" mt="xl">
        You have {remainingRequests} article summaries remaining.
      </Text>
    </>
  );
}
