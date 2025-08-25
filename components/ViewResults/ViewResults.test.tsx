import { render, screen, userEvent } from '@/test-utils';
import { ViewResults } from './ViewResults';
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('@/app/lib/storage/summaries', () => ({
  findByUrl: jest.fn(() => ({
    url: 'https://site.com',
    title: 'Title',
    domain: 'site.com',
    content: 'content',
    createdAt: 0,
    updatedAt: 0,
    summaries: { tldr: { text: 'hi', updatedAt: 0 } },
  })),
  sanitizeUrl: jest.fn((u: string) =>
    u && /^https?:\/\//i.test(u) ? u : null
  ),
}));
jest.mock('@/app/context/AppStateContext', () => ({
  useAppState: () => ({
    refreshRemainingRequests: jest.fn(),
  }),
}));
import * as storage from '@/app/lib/storage/summaries';

jest.mock('../../app/lib/utils/api-helpers', () => ({
  ClientRateLimiter: {
    getRemainingRequests: jest.fn(() => 10),
    checkLimit: jest.fn(() => true),
  },
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}));

global.fetch = jest.fn();

describe('ViewResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows Generate button for unsaved mode', async () => {
    jest.spyOn(storage, 'findByUrl').mockReturnValue({
      url: 'https://site.com',
      title: 'Title',
      domain: 'site.com',
      content: 'content',
      createdAt: 0,
      updatedAt: 0,
      summaries: { tldr: { text: 'hi', updatedAt: 0 } },
    } as any);

    render(<ViewResults url="https://site.com" />);

    const selects = await screen.findAllByLabelText('Summary mode');
    const select = selects[0] as HTMLInputElement;
    await userEvent.click(select);
    await userEvent.click(screen.getByRole('option', { name: /faqs/i }));
    expect(await screen.findByText('Generate summary')).toBeInTheDocument();
  });
});
