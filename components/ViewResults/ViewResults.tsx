'use client';

import React from 'react';
import { Badge, Box, Group, Image, Paper, Stack, Text, Title } from '@mantine/core';
import { findByUrl } from '@/app/lib/storage/summaries';

export function ViewResults({ url }: { url: string }) {
  const article = findByUrl(url);

  if (!article) {
    return (
      <Paper p="md" withBorder>
        <Text>We couldn't find stored data for this URL.</Text>
      </Paper>
    );
  }

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
        <Group justify="space-between" mb="sm">
          <Title order={4}>Summary</Title>
          <Badge variant="light">Wiring in progress</Badge>
        </Group>
        <Text c="dimmed">Further implementation will follow in the next step.</Text>
      </Paper>
    </Stack>
  );
}


