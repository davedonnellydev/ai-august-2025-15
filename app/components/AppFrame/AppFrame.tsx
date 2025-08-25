'use client';

import React from 'react';
import { AppShell, Badge, Box, Group, NavLink, ScrollArea, Text, Title } from '@mantine/core';
import { useAppState } from '@/app/context/AppStateContext';
import { listSummarised } from '@/app/lib/storage/summaries';

export function AppFrame({ children }: { children: React.ReactNode }) {
  const { setUrlAndSync, remainingRequests } = useAppState();
  const [items, setItems] = React.useState(() => listSummarised());

  React.useEffect(() => {
    // Recompute on storage changes
    const handler = () => setItems(listSummarised());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 320, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3} onClick={() => setUrlAndSync(null)} style={{ cursor: 'pointer' }}>
            Webpage Summariser
          </Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Text fw={600} mb="xs">Previously summarised</Text>
        <ScrollArea style={{ height: 'calc(100% - 28px)' }}>
          {items.length === 0 ? (
            <Text c="dimmed" size="sm">No items yet</Text>
          ) : (
            items.map((it) => (
              <NavLink
                key={it.url}
                label={it.title || new URL(it.url).hostname}
                description={it.domain}
                onClick={() => setUrlAndSync(it.url)}
              />
            ))
          )}
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box>{children}</Box>
      </AppShell.Main>

      <AppShell.Footer>
        <Group h="100%" px="md" justify="space-between">
          <Text size="sm" c="dimmed">
            Remaining requests
          </Text>
          <Badge color="cyan" variant="light">{remainingRequests}</Badge>
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}


