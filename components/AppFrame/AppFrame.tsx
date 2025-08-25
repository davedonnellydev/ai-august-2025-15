'use client';

import React from 'react';
import {
  AppShell,
  Badge,
  Box,
  Button,
  Burger,
  Group,
  NavLink,
  ScrollArea,
  Text,
  Title,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAppState } from '@/app/context/AppStateContext';
import {
  listSummarised,
  clearAll,
  deleteByUrl,
} from '@/app/lib/storage/summaries';

export function AppFrame({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure(false);
  const { setUrlAndSync, remainingRequests, currentUrl } = useAppState();
  const [items, setItems] = React.useState(() => listSummarised());

  React.useEffect(() => {
    // Recompute on storage changes
    const handler = () => setItems(listSummarised());
    window.addEventListener('storage', handler);
    window.addEventListener('summaries:changed', handler as EventListener);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('summaries:changed', handler as EventListener);
    };
  }, []);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 320, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      footer={{ height: 56 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label="Toggle navigation"
            />
            <Title
              order={3}
              onClick={() => setUrlAndSync(null)}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setUrlAndSync(null);
                }
              }}
              aria-label="Go to home"
            >
              Blog Summariser
            </Title>
          </Group>
          {currentUrl ? (
            <Button
              variant="light"
              onClick={() => setUrlAndSync(null)}
              aria-label="Enter a new URL"
            >
              New URL
            </Button>
          ) : (
            <span />
          )}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>Previously summarised</Text>
          {items.length > 0 && (
            <Button
              size="compact-xs"
              variant="subtle"
              color="red"
              onClick={() => {
                if (window.confirm('Clear all saved summaries?')) clearAll();
              }}
              aria-label="Clear saved summaries"
            >
              Clear
            </Button>
          )}
        </Group>
        <ScrollArea style={{ height: 'calc(100% - 28px)' }}>
          {items.length === 0 ? (
            <Text c="dimmed" size="sm">
              No items yet
            </Text>
          ) : (
            items.map((it) => (
              <Group
                key={it.url}
                justify="space-between"
                align="center"
                wrap="nowrap"
                gap="xs"
              >
                <NavLink
                  label={it.title || new URL(it.url).hostname}
                  description={it.domain}
                  active={currentUrl === it.url}
                  onClick={() => setUrlAndSync(it.url)}
                  style={{ flex: 1 }}
                />
                <Tooltip label="Delete" openDelay={300}>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label={`Delete ${it.title || it.url}`}
                    onClick={() => {
                      if (window.confirm('Delete this saved page?')) {
                        deleteByUrl(it.url);
                        if (currentUrl === it.url) setUrlAndSync(null);
                      }
                    }}
                  >
                    ×
                  </ActionIcon>
                </Tooltip>
              </Group>
            ))
          )}
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box>{children}</Box>
      </AppShell.Main>

      <AppShell.Footer>
        <Group
          h="100%"
          px="md"
          justify="flex-end"
          gap="xs"
          style={{ paddingTop: 8, paddingBottom: 8 }}
        >
          <Text size="sm" c="dimmed">
            Remaining summary tokens
          </Text>
          <Badge color="cyan" variant="light">
            {remainingRequests}
          </Badge>
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}


