import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useBreakpoints } from '../../src/composables/useBreakpoints';
import { withSetup } from '../utils';

describe('useBreakpoints', () => {
  let originalInnerWidth;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
    vi.restoreAllMocks();
  });

  it('correctly identifies mobile breakpoints', () => {
    window.innerWidth = 500;
    const [{ isMobile, isTablet, isDesktop }] = withSetup(() => useBreakpoints());
    expect(isMobile.value).toBe(true);
    expect(isTablet.value).toBe(false);
    expect(isDesktop.value).toBe(false);
  });

  it('correctly identifies tablet breakpoints', () => {
    window.innerWidth = 800;
    const [{ isMobile, isTablet, isDesktop }] = withSetup(() => useBreakpoints());
    expect(isMobile.value).toBe(false);
    expect(isTablet.value).toBe(true);
    expect(isDesktop.value).toBe(false);
  });

  it('correctly identifies desktop breakpoints', () => {
    window.innerWidth = 1400;
    const [{ isMobile, isTablet, isDesktop }] = withSetup(() => useBreakpoints());
    expect(isMobile.value).toBe(false);
    expect(isTablet.value).toBe(false);
    expect(isDesktop.value).toBe(true);
  });
});
