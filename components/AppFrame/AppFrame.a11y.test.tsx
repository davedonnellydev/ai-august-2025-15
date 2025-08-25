import { render } from '@/test-utils';
import { AppFrame } from './AppFrame';
import { axe } from 'jest-axe';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}));

jest.mock('@/app/context/AppStateContext', () => ({
  useAppState: () => ({
    currentUrl: null,
    remainingRequests: 5,
    setUrlAndSync: jest.fn(),
    refreshRemainingRequests: jest.fn(),
  }),
}));

describe('AppFrame accessibility', () => {
  it('has no a11y violations', async () => {
    const { container } = render(
      <AppFrame>
        <div>Content</div>
      </AppFrame>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
