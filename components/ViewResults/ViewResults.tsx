'use client';

import React from 'react';
import {
  Badge,
  Box,
  Button,
  Group,
  Image,
  Paper,
  Select,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import { SummaryMode } from '@/app/lib/types';
import { SUMMARY_MODES, SummaryModeInstructions } from '@/app/lib/summary';
import {
  findByUrl,
  setArticleParsedData,
  setSummary,
} from '@/app/lib/storage/summaries';
import { useAppState } from '@/app/context/AppStateContext';
import { ClientRateLimiter } from '@/app/lib/utils/api-helpers';

export function ViewResults({ url }: { url: string }) {
  const { setUrlAndSync, refreshRemainingRequests } = useAppState();
  const [currentUrl] = React.useState<string>(url);
  const [loadingGenerate, setLoadingGenerate] = React.useState(false);
  const [loadingRefresh, setLoadingRefresh] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [selectedMode, setSelectedMode] = React.useState<SummaryMode>('tldr');
  const [tick, setTick] = React.useState<number>(0); // force re-read from storage

  const article = findByUrl(currentUrl);

  const savedModes = React.useMemo<Set<SummaryMode>>(() => {
    const s = new Set<SummaryMode>();
    if (article?.summaries) {
      Object.keys(article.summaries).forEach((k) => s.add(k as SummaryMode));
    }
    return s;
  }, [article?.summaries, tick]);

  const lastUrlRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    // On URL change, set a sensible default without overriding later user choices
    if (lastUrlRef.current !== currentUrl) {
      lastUrlRef.current = currentUrl;
      if (savedModes.size > 0) {
        setSelectedMode((prev) =>
          savedModes.has(prev) ? prev : [...savedModes][0]
        );
      } else {
        setSelectedMode('tldr');
      }
    }
  }, [currentUrl, savedModes]);

  if (!article) {
    return (
      <Paper p="md" withBorder>
        <Text>We couldn't find stored data for this URL.</Text>
      </Paper>
    );
  }

  const generateForMode = async () => {
    if (!article) return;
    setError('');
    setLoadingGenerate(true);
    try {
      const instructions = SummaryModeInstructions[selectedMode];
      const response = await fetch('/api/openai/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: article.content,
          summaryInstructions: instructions,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API call failed');
      }
      const result = await response.json();
      setSummary(article.url, selectedMode, result.response);
      setTick((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate summary');
    } finally {
      setLoadingGenerate(false);
    }
  };

  const refreshSummaries = async () => {
    if (!ClientRateLimiter.checkLimit()) {
      setError('Rate limit exceeded. Please try again later.');
      refreshRemainingRequests();
      return;
    }
    setError('');
    setLoadingRefresh(true);
    try {
      // Re-parse
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: article.url }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Parser failed');
      }
      const { article: parsed } = await res.json();
      const content: string = parsed?.content ?? '';
      setArticleParsedData(article.url, {
        title: parsed?.title,
        author: parsed?.author,
        domain: parsed?.domain || new URL(article.url).hostname,
        lead_image_url: parsed?.lead_image_url ?? null,
        content,
      });

      // Re-generate only for already-saved modes
      for (const mode of savedModes) {
        const instructions = SummaryModeInstructions[mode];
        const resp = await fetch('/api/openai/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: content,
            summaryInstructions: instructions,
          }),
        });
        if (!resp.ok) {
          const errorData = await resp.json();
          throw new Error(errorData.error || 'API call failed');
        }
        const result = await resp.json();
        setSummary(article.url, mode, result.response);
      }

      refreshRemainingRequests();
      setTick((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to refresh summaries');
    } finally {
      setLoadingRefresh(false);
    }
  };

  const currentSummary = article.summaries?.[selectedMode]?.text ?? '';

  return (
    <Stack gap="md">
      <Paper p="md" withBorder>
        <Group align="flex-start" justify="space-between">
          <Box style={{ flex: 1 }}>
            <Title order={3} mb={4}>
              {article.title || new URL(article.url).hostname}
            </Title>
            <Text size="sm" c="dimmed">
              {article.author ? `${article.author} • ` : ''}
              {article.domain}
            </Text>
            <Text size="sm" mt="xs">
              <a href={article.url} target="_blank" rel="noreferrer">
                {article.url}
              </a>
            </Text>
          </Box>
          {article.lead_image_url ? (
            <Image
              src={article.lead_image_url}
              alt={article.title || 'Lead image'}
              radius="md"
              w={160}
              h={120}
              fit="cover"
            />
          ) : null}
        </Group>
      </Paper>

      <Paper p="md" withBorder>
        <Group justify="space-between" mb="sm" align="flex-end">
          <div style={{ minWidth: 280 }}>
            <Select
              label="Summary mode"
              placeholder="Select mode"
              value={selectedMode}
              onChange={(value) =>
                value && setSelectedMode(value as SummaryMode)
              }
              data={SUMMARY_MODES.map((m) => ({
                value: m,
                label:
                  `${m === 'tldr' ? 'TL;DR' : m.replace('-', ' ')}` +
                  (savedModes.has(m) ? ' ✓' : ''),
              }))}
            />
          </div>
          {/* No actions on the right; refresh moved below the summary section */}
        </Group>

        <Text size="sm" c="dimmed" mb="sm">
          {SummaryModeInstructions[selectedMode]}
        </Text>

        {error && (
          <Text c="red" size="sm" mb="sm">
            Error: {error}
          </Text>
        )}

        {currentSummary ? (
          <ReactMarkdown>{currentSummary}</ReactMarkdown>
        ) : (
          <>
            <Text c="dimmed" size="sm" mb="sm">
              No summary saved for this mode yet.
            </Text>
            <Button
              onClick={generateForMode}
              loading={loadingGenerate}
              aria-label="Generate summary for selected mode"
            >
              Generate summary
            </Button>
          </>
        )}
      </Paper>

      <Paper p="md" withBorder>
        <Group justify="center">
          <Tooltip
            label="Refreshes & parses webpage data, then updates all existing summaries based on fresh content. Costs 1 summary token."
            openDelay={300}
            multiline
            w={220}
          >
            <Button
              color="red"
              onClick={refreshSummaries}
              loading={loadingRefresh}
              aria-label="Refresh summaries"
            >
              Refresh summaries
            </Button>
          </Tooltip>
        </Group>
      </Paper>
    </Stack>
  );
}
