'use client';

import { useRef, useState } from 'react';
import { Accordion, Button, Group, Paper, Select, Stack, Text, TextInput } from '@mantine/core';
import { ClientRateLimiter } from '@/app/lib/utils/api-helpers';
import { SummaryMode } from '@/app/lib/types';
import { SummaryModeInstructions } from '@/app/lib/summary';
import { findByUrl, sanitizeUrl, setArticleParsedData, setSummary } from '@/app/lib/storage/summaries';
import { useAppState } from '@/app/context/AppStateContext';

 

export function ArticleParser() {
  const { setUrlAndSync, refreshRemainingRequests } = useAppState();
  const [url, setUrl] = useState('');
  const [summaryMode, setSummaryMode] = useState<SummaryMode>('tldr');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<number | null>(null);

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
      const content: string = article?.content ?? '';
      setArticleParsedData(url, {
        title: article?.title,
        author: article?.author,
        domain: article?.domain || new URL(url).hostname,
        lead_image_url: article?.lead_image_url ?? null,
        content,
      });
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

    const normalized = sanitizeUrl(url);
    if (!normalized) {
      setError('Please enter a valid URL starting with http or https.');
      return;
    }

    // If URL already exists in storage, navigate to results
    if (findByUrl(normalized)) {
      setUrlAndSync(normalized);
      return;
    }

    // New summary request decrements rate limit
    if (!ClientRateLimiter.checkLimit()) {
      setError('Rate limit exceeded. Please try again later.');
      refreshRemainingRequests();
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
      setSummary(normalized, summaryMode, result.response);
      refreshRemainingRequests();
      setUrlAndSync(normalized);
    } catch (err) {
      console.error('API error:', err);
      setError(err instanceof Error ? err.message : 'API failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setSummaryMode('tldr');
    setError('');
  };

  return (
    <Stack gap="md" style={{ maxWidth: 720, margin: '20px auto', padding: '20px' }}>
      <Accordion defaultValue={undefined} variant="separated">
        <Accordion.Item value="instructions">
          <Accordion.Control>Instructions</Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" c="dimmed">
              Paste a webpage URL, choose a summary mode, and click Summarise. If the URL was summarised before, you'll be taken directly to the saved results.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <TextInput
        value={url}
        onChange={(event) => {
          const v = event.currentTarget.value;
          setUrl(v);
          if (debounceRef.current) window.clearTimeout(debounceRef.current);
          debounceRef.current = window.setTimeout(() => {
            const normalized = sanitizeUrl(v);
            if (normalized && findByUrl(normalized)) {
              setUrlAndSync(normalized);
            }
          }, 500);
        }}
        onBlur={() => {
          const normalized = sanitizeUrl(url);
          if (normalized && findByUrl(normalized)) {
            setUrlAndSync(normalized);
          }
        }}
        size="md"
        radius="md"
        label="Enter a URL"
        placeholder="https://en.wikipedia.org/wiki/Singin%27_in_the_Rain"
      />

      <Group align="flex-start" wrap="nowrap">
        <div style={{ minWidth: 260, flex: '0 0 260px' }}>
          <Select
            label="Summary mode"
            placeholder="Select mode"
            value={summaryMode}
            onChange={(value) => value && setSummaryMode(value as SummaryMode)}
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
          />
        </div>
        <Paper p="sm" withBorder style={{ flex: 1 }}>
          <Text size="sm" c="dimmed">
            {SummaryModeInstructions[summaryMode]}
          </Text>
        </Paper>
      </Group>

      <Group>
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
      </Group>

      {error && (
        <Text c="red" size="sm">
          Error: {error}
        </Text>
      )}
    </Stack>
  );
}
