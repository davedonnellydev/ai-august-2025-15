import '@mantine/core/styles.css';

import React from 'react';
import {
  ColorSchemeScript,
  mantineHtmlProps,
  MantineProvider,
} from '@mantine/core';
import { theme } from '../theme';
import { AppStateProvider } from './context/AppStateContext';
import { AppFrame } from '@/components/AppFrame/AppFrame';

export const metadata = {
  title: 'Blog Summariser',
  description:
    'A blog/webpage summariser app built for AIAugust App a Day Challenge',
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <AppStateProvider>
            <AppFrame>{children}</AppFrame>
          </AppStateProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
