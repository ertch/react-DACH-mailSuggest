import React, { useState } from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DACHSuggestions from './DACHSuggestions';

function TestPage() {
  const [email, setEmail] = useState('');
  return (
    <div>
      <input
        type="email"
        data-dach-suggestion="testMail"
        data-testid="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-Mail"
      />
      <DACHSuggestions id="testMail" debounceMs={0} />
    </div>
  );
}

function typeAndBlur(input: HTMLInputElement, value: string) {
  act(() => {
    const nativeSet = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    nativeSet.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  act(() => {
    vi.advanceTimersByTime(0);
  });
  act(() => {
    input.dispatchEvent(new Event('blur', { bubbles: true }));
  });
}

describe('DACHSuggestions', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('renders nothing initially', () => {
    render(<TestPage />);
    expect(screen.queryByText(/Dieser Mailprovider/)).not.toBeInTheDocument();
  });

  test('shows typo warning on blur with misspelled domain', () => {
    render(<TestPage />);
    const input = screen.getByTestId('email') as HTMLInputElement;
    typeAndBlur(input, 'user@gmial.com');

    expect(screen.getByText(/Dieser Mailprovider ist uns nicht bekannt/)).toBeInTheDocument();
    expect(screen.getByText('user@gmail.com')).toBeInTheDocument();
  });

  test('no warning for correct domain', () => {
    render(<TestPage />);
    const input = screen.getByTestId('email') as HTMLInputElement;
    typeAndBlur(input, 'user@gmail.com');

    expect(screen.queryByText(/Dieser Mailprovider ist uns nicht bekannt/)).not.toBeInTheDocument();
  });

  test('clicking suggestion removes the warning', () => {
    render(<TestPage />);
    const input = screen.getByTestId('email') as HTMLInputElement;
    typeAndBlur(input, 'user@gmial.com');

    const link = screen.getByText('user@gmail.com');
    act(() => { link.click(); });

    expect(screen.queryByText(/Dieser Mailprovider ist uns nicht bekannt/)).not.toBeInTheDocument();
  });

  test('suggestion is keyboard accessible via Enter', () => {
    render(<TestPage />);
    const input = screen.getByTestId('email') as HTMLInputElement;
    typeAndBlur(input, 'user@gmial.com');

    const link = screen.getByRole('button');
    act(() => {
      link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(screen.queryByText(/Dieser Mailprovider ist uns nicht bekannt/)).not.toBeInTheDocument();
  });

  test('handles multiple @ signs gracefully', () => {
    render(<TestPage />);
    const input = screen.getByTestId('email') as HTMLInputElement;
    typeAndBlur(input, 'us@er@gmial.com');

    // Uses first @ — domain is "er@gmial.com", no match expected
    expect(screen.queryByText(/Dieser Mailprovider/)).not.toBeInTheDocument();
  });

  test('custom warningText is shown', () => {
    render(
      <div>
        <input type="email" data-dach-suggestion="custom" data-testid="email2" />
        <DACHSuggestions id="custom" debounceMs={0} warningText="Did you mean " />
      </div>
    );
    const input = screen.getByTestId('email2') as HTMLInputElement;
    typeAndBlur(input, 'test@gmial.com');

    expect(screen.getByText(/Did you mean/)).toBeInTheDocument();
    expect(screen.queryByText(/Dieser Mailprovider/)).not.toBeInTheDocument();
  });
});
