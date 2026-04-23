import { renderHook, act } from '@testing-library/react';
import { useEmailSuggestion } from './useEmailSuggestion';
import { DACH_DOMAINS } from './utils';

describe('useEmailSuggestion', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('returns null suggestion when email is empty', () => {
    const { result } = renderHook(() => useEmailSuggestion('', { debounceMs: 0 }));
    expect(result.current.suggestion).toBeNull();
  });

  test('returns null when email has no @', () => {
    const { result } = renderHook(() => useEmailSuggestion('user.com', { debounceMs: 0 }));
    expect(result.current.suggestion).toBeNull();
  });

  test('returns null when @ is trailing', () => {
    const { result } = renderHook(() => useEmailSuggestion('user@', { debounceMs: 0 }));
    expect(result.current.suggestion).toBeNull();
  });

  test('suggests correction for typo (immediate, debounceMs=0)', () => {
    const { result } = renderHook(() => useEmailSuggestion('user@gmial.com', { debounceMs: 0 }));
    expect(result.current.suggestion).toBe('user@gmail.com');
  });

  test('null for correct domain', () => {
    const { result } = renderHook(() => useEmailSuggestion('user@gmail.com', { debounceMs: 0 }));
    expect(result.current.suggestion).toBeNull();
  });

  test('debounce delays state update', () => {
    const { result } = renderHook(() => useEmailSuggestion('user@gmial.com', { debounceMs: 500 }));
    expect(result.current.suggestion).toBeNull();
    act(() => { jest.advanceTimersByTime(499); });
    expect(result.current.suggestion).toBeNull();
    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current.suggestion).toBe('user@gmail.com');
  });

  test('rapid email changes reset debounce timer', () => {
    const { result, rerender } = renderHook(
      ({ email }) => useEmailSuggestion(email, { debounceMs: 300 }),
      { initialProps: { email: 'a@gmial.com' } }
    );
    act(() => { jest.advanceTimersByTime(200); });
    rerender({ email: 'b@gmial.com' });
    act(() => { jest.advanceTimersByTime(200); });
    expect(result.current.suggestion).toBeNull();
    act(() => { jest.advanceTimersByTime(100); });
    expect(result.current.suggestion).toBe('b@gmail.com');
  });

  test('getCorrected bypasses debounce and computes synchronously', () => {
    const { result } = renderHook(() => useEmailSuggestion('user@gmial.com', { debounceMs: 1000 }));
    expect(result.current.suggestion).toBeNull();
    expect(result.current.getCorrected()).toBe('user@gmail.com');
  });

  test('getCorrected returns null for clean email', () => {
    const { result } = renderHook(() => useEmailSuggestion('user@gmail.com'));
    expect(result.current.getCorrected()).toBeNull();
  });

  test('custom domains list is honored', () => {
    const { result } = renderHook(() =>
      useEmailSuggestion('alice@cmopany.de', {
        debounceMs: 0,
        domains: [...DACH_DOMAINS, 'company.de'],
      })
    );
    expect(result.current.suggestion).toBe('alice@company.de');
  });

  test('disabled suppresses suggestion and getCorrected', () => {
    const { result } = renderHook(() =>
      useEmailSuggestion('user@gmial.com', { debounceMs: 0, disabled: true })
    );
    expect(result.current.suggestion).toBeNull();
    expect(result.current.getCorrected()).toBeNull();
  });

  test('maxDistance bounds the search', () => {
    const { result } = renderHook(() =>
      useEmailSuggestion('user@totallydifferent.com', { debounceMs: 0, maxDistance: 2 })
    );
    expect(result.current.suggestion).toBeNull();
  });
});
