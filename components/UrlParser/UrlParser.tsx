'use client';

import { useEffect, useState } from 'react';
import { Button, Text, TextInput } from '@mantine/core';
import { ClientRateLimiter } from '@/app/lib/utils/api-helpers';

export function UrlParser() {
  const [_input, setInput] = useState('');
  const [url, setUrl] = useState('');
  const [parsedWebsite, setParsedWebsite] = useState(null);
  const [summaryMode, _setSummaryMode] = useState('tldr');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingRequests, setRemainingRequests] = useState(0);

  // Update remaining requests on component mount and after translations
  useEffect(() => {
    setRemainingRequests(ClientRateLimiter.getRemainingRequests());
  }, []);

  useEffect(() => {
    console.log(parsedWebsite);
  }, [parsedWebsite]);

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
      const response = await fetch('/api/openai/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: parsedContent,
          summaryMode,
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
