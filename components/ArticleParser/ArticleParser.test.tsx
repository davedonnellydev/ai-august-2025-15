import { render, screen, userEvent } from '@/test-utils';
import { ArticleParser } from './ArticleParser';

// Mock the ClientRateLimiter
jest.mock('../../app/lib/utils/api-helpers', () => ({
  ClientRateLimiter: {
    getRemainingRequests: jest.fn(() => 10),
    checkLimit: jest.fn(() => true),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('ArticleParser component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input field and buttons', () => {
    render(<ArticleParser />);
    expect(screen.getByLabelText('Enter a URL')).toBeInTheDocument();
    expect(screen.getByText('Summarise')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('displays remaining requests count', () => {
    render(<ArticleParser />);
    expect(
      screen.getByText(/You have \d+ article summaries remaining/)
    ).toBeInTheDocument();
  });

  it('allows user to type in input field', async () => {
    const user = userEvent.setup();
    render(<ArticleParser />);

    const input = screen.getByLabelText('Enter a URL');
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

    const input = screen.getByLabelText('Enter a URL');
    const resetButton = screen.getByText('Reset');

    await user.type(input, 'Test input');
    await user.click(resetButton);

    expect(input).toHaveValue('');
  });
});
