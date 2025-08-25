'use client';

import { useEffect, useState } from 'react';
import { Button, Text, TextInput, Title } from '@mantine/core';
import { ClientRateLimiter } from '@/app/lib/utils/api-helpers';
import classes from './UrlParser.module.css';
// Removing server-only parser import from client component

export function UrlParser() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingRequests, setRemainingRequests] = useState(0);

  // Update remaining requests on component mount and after translations
  useEffect(() => {
    setRemainingRequests(ClientRateLimiter.getRemainingRequests());
  }, []);

  const parseUrl = async () => {
    try {
        const res = await fetch('/api/parse', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: "https://en.wikipedia.org/wiki/Singin%27_in_the_Rain",
            }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Parser failed');
          }

          const data = await res.json();
          console.log(data);
          const articleTitle: string = data.article?.title || 'Untitled';
          const articleExcerpt: string = data.article?.excerpt || '';
          setResponse(`${articleTitle} — ${articleExcerpt}`);

    } catch (error) {
        console.error('Parser error:', error);
      setError(error instanceof Error ? error.message : 'Parser failed');
    }

  }
  

  const handleRequest = async () => {
    if (!input.trim()) {
      setError('Please enter some text to translate');
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

    try {
      const response = await fetch('/api/openai/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
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
    setResponse('');
    setError('');
  };

  return (
    <>
      <div style={{ maxWidth: 600, margin: '20px auto', padding: '20px' }}>
        <TextInput
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          size="md"
          radius="md"
          label="Enter a url"
          placeholder="https://en.wikipedia.org/wiki/Singin%27_in_the_Rain"
        />

        <Button
          variant="filled"
          color="cyan"
          onClick={() => parseUrl()}
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
        You have {remainingRequests} questions remaining.
      </Text>
    </>
  );
}
