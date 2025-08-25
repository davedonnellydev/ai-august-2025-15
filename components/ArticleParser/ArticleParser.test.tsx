import { render, screen, userEvent } from '@/test-utils';
import { ArticleParser } from './ArticleParser';
jest.mock('@/app/context/AppStateContext', () => ({
  useAppState: () => ({
    setUrlAndSync: jest.fn(),
    refreshRemainingRequests: jest.fn(),
  }),
}));
jest.mock('@/app/lib/storage/summaries', () => ({
  findByUrl: jest.fn(() => undefined),
  sanitizeUrl: jest.fn((u: string) =>
    u && /^https?:\/\//i.test(u) ? u : null
  ),
  setArticleParsedData: jest.fn(),
  setSummary: jest.fn(),
}));
import * as storage from '@/app/lib/storage/summaries';

// Mock the ClientRateLimiter
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

// Mock fetch
global.fetch = jest.fn();

describe('ArticleParser component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(storage, 'findByUrl').mockReturnValue(undefined as any);
  });

  it('renders input field and buttons', () => {
    render(<ArticleParser />);
    expect(
      screen.getByLabelText('Enter the URL of a webpage you want to summarise')
    ).toBeInTheDocument();
    expect(screen.getByText('Summarise')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('shows inline instructions for selected mode', () => {
    render(<ArticleParser />);
    expect(
      screen.getByText(/Write a 2-3 sentence abstract/i)
    ).toBeInTheDocument();
  });

  it('allows user to type in input field', async () => {
    const user = userEvent.setup();
    render(<ArticleParser />);

    const input = screen.getByLabelText(
      'Enter the URL of a webpage you want to summarise'
    );
    await user.type(input, 'Hello world');

    expect(input).toHaveValue('Hello world');
  });

  it('shows error when trying to submit empty input', async () => {
    const user = userEvent.setup();
    render(<ArticleParser />);

    const submitButton = screen.getByText('Summarise');
    await user.click(submitButton);

    expect(
      screen.getByText('Error: Please enter a url of an article to summarise.')
    ).toBeInTheDocument();
  });

  it('resets form when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<ArticleParser />);

    const input = screen.getByLabelText(
      'Enter the URL of a webpage you want to summarise'
    );
    const resetButton = screen.getByText('Reset');

    await user.type(input, 'Test input');
    await user.click(resetButton);

    expect(input).toHaveValue('');
  });

  it('navigates to results if URL already stored (no fetch)', async () => {
    const user = userEvent.setup();
    jest.spyOn(storage, 'findByUrl').mockReturnValue({
      url: 'https://x.com',
      content: '',
      createdAt: 0,
      updatedAt: 0,
      summaries: {},
    } as any);
    render(<ArticleParser />);
    const input = screen.getByLabelText(
      'Enter the URL of a webpage you want to summarise'
    );
    await user.type(input, 'https://x.com');
    const submitButton = screen.getByText('Summarise');
    await user.click(submitButton);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
