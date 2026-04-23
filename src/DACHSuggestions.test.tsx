import React, { useState } from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DACHSuggestions from './DACHSuggestions';
import { DACH_DOMAINS } from './utils';

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
    jest.advanceTimersByTime(0);
  });
  act(() => {
    input.dispatchEvent(new Event('blur', { bubbles: true }));
  });
}

describe('DACHSuggestions', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

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

  test('suggestion renders as native button (keyboard-accessible)', () => {
    render(<TestPage />);
    const input = screen.getByTestId('email') as HTMLInputElement;
    typeAndBlur(input, 'user@gmial.com');

    const btn = screen.getByRole('button');
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).toHaveAttribute('type', 'button');

    act(() => { btn.click(); });
    expect(screen.queryByText(/Dieser Mailprovider ist uns nicht bekannt/)).not.toBeInTheDocument();
  });

  test('warning container is an aria-live status region', () => {
    render(<TestPage />);
    const input = screen.getByTestId('email') as HTMLInputElement;
    typeAndBlur(input, 'user@gmial.com');

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
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

  test('custom suffixText replaces the default "?"', () => {
    render(
      <div>
        <input type="email" data-dach-suggestion="sfx" data-testid="email3" />
        <DACHSuggestions id="sfx" debounceMs={0} warningText="Did you mean " suffixText="." />
      </div>
    );
    const input = screen.getByTestId('email3') as HTMLInputElement;
    typeAndBlur(input, 'test@gmial.com');

    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Did you mean test@gmail.com.');
  });

  test('disabled prop attaches no listeners', () => {
    render(
      <div>
        <input type="email" data-dach-suggestion="dis" data-testid="email4" />
        <DACHSuggestions id="dis" debounceMs={0} disabled />
      </div>
    );
    const input = screen.getByTestId('email4') as HTMLInputElement;
    typeAndBlur(input, 'test@gmial.com');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('custom domains list is used instead of DACH_DOMAINS', () => {
    render(
      <div>
        <input type="email" data-dach-suggestion="ext" data-testid="email5" />
        <DACHSuggestions
          id="ext"
          debounceMs={0}
          domains={[...DACH_DOMAINS, 'company.de']}
          warningText="Meinten Sie "
        />
      </div>
    );
    const input = screen.getByTestId('email5') as HTMLInputElement;
    typeAndBlur(input, 'alice@cmopany.de');

    expect(screen.getByText('alice@company.de')).toBeInTheDocument();
  });

  test('onSuggest fires with the suggested value', () => {
    const onSuggest = jest.fn();
    render(
      <div>
        <input type="email" data-dach-suggestion="cb1" data-testid="email6" />
        <DACHSuggestions id="cb1" debounceMs={0} onSuggest={onSuggest} />
      </div>
    );
    const input = screen.getByTestId('email6') as HTMLInputElement;
    typeAndBlur(input, 'user@gmial.com');

    expect(onSuggest).toHaveBeenCalledWith('user@gmail.com');
  });

  test('onAccept fires when the user clicks the suggestion', () => {
    const onAccept = jest.fn();
    render(
      <div>
        <input type="email" data-dach-suggestion="cb2" data-testid="email7" />
        <DACHSuggestions id="cb2" debounceMs={0} onAccept={onAccept} />
      </div>
    );
    const input = screen.getByTestId('email7') as HTMLInputElement;
    typeAndBlur(input, 'user@gmial.com');

    act(() => { screen.getByRole('button').click(); });
    expect(onAccept).toHaveBeenCalledWith('user@gmail.com');
  });
});
