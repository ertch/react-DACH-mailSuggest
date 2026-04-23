import React, { useState } from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmailSuggestion from './EmailSuggestion';
import { DACH_DOMAINS } from './utils';

function Controlled({
  initial = '',
  onAccept,
  ...rest
}: {
  initial?: string;
  onAccept?: (v: string) => void;
  [k: string]: any;
}) {
  const [email, setEmail] = useState(initial);
  return (
    <div>
      <input
        type="email"
        data-testid="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <EmailSuggestion
        email={email}
        onAccept={(v) => {
          setEmail(v);
          onAccept?.(v);
        }}
        debounceMs={0}
        {...rest}
      />
    </div>
  );
}

describe('EmailSuggestion', () => {
  test('renders nothing for a clean email', () => {
    render(<Controlled initial="user@gmail.com" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('renders warning for typo', () => {
    render(<Controlled initial="user@gmial.com" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('button')).toHaveTextContent('user@gmail.com');
  });

  test('onAccept fires with corrected value and clears warning', () => {
    const onAccept = jest.fn();
    render(<Controlled initial="user@gmial.com" onAccept={onAccept} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onAccept).toHaveBeenCalledWith('user@gmail.com');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('custom warningText and suffixText', () => {
    render(
      <Controlled
        initial="user@gmial.com"
        warningText="Did you mean "
        suffixText="."
      />
    );
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Did you mean user@gmail.com.');
  });

  test('render prop overrides default markup', () => {
    render(
      <Controlled
        initial="user@gmial.com"
        render={({ suggestion, accept }: { suggestion: string; accept: () => void }) => (
          <div data-testid="custom">
            <span>fixed: {suggestion}</span>
            <button type="button" onClick={accept}>take it</button>
          </div>
        )}
      />
    );
    expect(screen.getByTestId('custom')).toHaveTextContent('fixed: user@gmail.com');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('take it'));
    expect(screen.queryByTestId('custom')).not.toBeInTheDocument();
  });

  test('onSuggest fires whenever a suggestion is shown', () => {
    const onSuggest = jest.fn();
    const { rerender } = render(
      <Controlled initial="user@gmial.com" onSuggest={onSuggest} />
    );
    expect(onSuggest).toHaveBeenCalledWith('user@gmail.com');
    expect(onSuggest).toHaveBeenCalledTimes(1);
  });

  test('custom domains list is used', () => {
    render(
      <Controlled
        initial="alice@cmopany.de"
        domains={[...DACH_DOMAINS, 'company.de']}
      />
    );
    expect(screen.getByRole('button')).toHaveTextContent('alice@company.de');
  });

  test('disabled prop suppresses the warning', () => {
    render(<Controlled initial="user@gmial.com" disabled />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('updates when the email prop changes', () => {
    function Harness() {
      const [email, setEmail] = useState('user@gmail.com');
      return (
        <div>
          <button type="button" onClick={() => setEmail('user@gmial.com')}>break</button>
          <EmailSuggestion email={email} onAccept={setEmail} debounceMs={0} />
        </div>
      );
    }
    render(<Harness />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('break'));
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
