'use client';
import { ArticleParser } from '@/components/ArticleParser/ArticleParser';
import { useAppState } from './context/AppStateContext';
import { ViewResults } from '@/components/ViewResults/ViewResults';

export default function HomePage() {
  const { currentUrl } = useAppState();
  return currentUrl ? <ViewResults url={currentUrl} /> : <ArticleParser />;
}
