# D-A-CH Email Suggestion

React library that catches email domain typos for the D-A-CH region (Germany, Austria, Switzerland). Zero dependencies, SSR-safe, accessible.

```tsx
import { useState } from 'react';
import { EmailSuggestion } from 'dach-email-suggestion';

function SignUp() {
  const [email, setEmail] = useState('');
  return (
    <>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <EmailSuggestion email={email} onAccept={setEmail} />
    </>
  );
}
// User types "kunde@gmial.com" →
// "Dieser Mailprovider ist uns nicht bekannt. Meinten Sie: kunde@gmail.com?"
```

## Install (WIP)

```bash
npm install dach-email-suggestion
```

## Quick Start

### `<EmailSuggestion>` — render component

Renders only the warning below your input. Never touches the input element itself — works with MUI, Mantine, react-hook-form, Formik, or any controlled input.

```tsx
import { useState } from 'react';
import { EmailSuggestion } from 'dach-email-suggestion';

function ContactForm() {
  const [email, setEmail] = useState('');

  return (
    <>
      <label htmlFor="email">E-Mail</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <EmailSuggestion email={email} onAccept={setEmail} />
    </>
  );
}
```

### `useEmailSuggestion` — headless hook

Full control over rendering. Includes `getCorrected()` for synchronous submit-time checks that bypass the debounce.

```tsx
import { useState } from 'react';
import { useEmailSuggestion } from 'dach-email-suggestion';

function ContactForm() {
  const [email, setEmail] = useState('');
  const { suggestion, getCorrected } = useEmailSuggestion(email);

  const handleSubmit = () => {
    const corrected = getCorrected();
    if (corrected) {
      // typo detected — ask user before submitting
      return alert(`Meinten Sie ${corrected}?`);
    }
    // no typo, proceed
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {suggestion && (
        <p>
          Meinten Sie{' '}
          <button type="button" onClick={() => setEmail(suggestion)}>{suggestion}</button>?
        </p>
      )}
      <button type="submit">Absenden</button>
    </form>
  );
}
```

## API Reference

### Hook: `useEmailSuggestion(email, options?)`

**Parameters:**

| Param | Type | Description |
|---|---|---|
| `email` | `string` | The current email value to check |

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `maxDistance` | `number` | `2` | Max Damerau-Levenshtein edit distance |
| `debounceMs` | `number` | `300` | Debounce delay in ms. `0` for immediate. |
| `domains` | `readonly string[]` | `DACH_DOMAINS` | Domain list to match against |
| `disabled` | `boolean` | `false` | Skip detection entirely |

**Returns:**

| Field | Type | Description |
|---|---|---|
| `suggestion` | `string \| null` | Debounced suggestion (full email), or `null` |
| `getCorrected` | `() => string \| null` | Synchronous check — bypasses debounce, useful at submit-time |

### Component: `<EmailSuggestion>`

Accepts all hook options above, plus:

| Prop | Type | Default | Description |
|---|---|---|---|
| `email` | `string` | **required** | Current email value from your state |
| `onAccept` | `(correctedEmail: string) => void` | **required** | Called when user clicks the suggestion |
| `onSuggest` | `(suggestion: string) => void` | — | Fires whenever a suggestion is displayed |
| `warningText` | `string` | `'Dieser Mailprovider ist uns nicht bekannt. Meinten Sie: '` | Text before the clickable suggestion |
| `suffixText` | `string` | `'?'` | Text appended after the suggestion |
| `warningClassName` | `string` | `'email-warning'` | CSS class for the warning container |
| `suggestionClassName` | `string` | `'email-suggestion'` | CSS class for the suggestion button |
| `render` | `(p: { suggestion: string; accept: () => void }) => ReactNode` | — | Custom renderer, replaces default markup entirely |

## Recipes

### Custom warning text

```tsx
<EmailSuggestion
  email={email}
  onAccept={setEmail}
  warningText="Did you mean "
/>
// → "Did you mean user@gmail.com?"

<EmailSuggestion
  email={email}
  onAccept={setEmail}
  warningText="Meinten Sie vielleicht "
  suffixText="."
/>
// → "Meinten Sie vielleicht user@gmail.com."
```

> The default warning text is German since this is a DACH-focused package. Use `warningText` and `suffixText` to localize.

### Custom rendering with `render` prop

```tsx
<EmailSuggestion
  email={email}
  onAccept={setEmail}
  render={({ suggestion, accept }) => (
    <Alert severity="warning" action={<Button onClick={accept}>Fix</Button>}>
      Typo? We think you meant <strong>{suggestion}</strong>
    </Alert>
  )}
/>
```

### Extending the domain list

Import `DACH_DOMAINS` and spread to add your own:

```tsx
import { EmailSuggestion, DACH_DOMAINS } from 'dach-email-suggestion';

<EmailSuggestion
  email={email}
  onAccept={setEmail}
  domains={[...DACH_DOMAINS, 'company.de', 'partner.ch']}
/>
```

Or pass an entirely custom array to replace the defaults.

### Analytics callbacks

```tsx
<EmailSuggestion
  email={email}
  onAccept={(corrected) => {
    setEmail(corrected);
    track('email_typo_fixed', { corrected });
  }}
  onSuggest={(suggestion) => {
    track('email_typo_suggested', { suggestion });
  }}
/>
```

### Submit-time guard

`getCorrected()` computes synchronously, ignoring the debounce — catches typos even if the user submits before the debounce fires:

```tsx
const { getCorrected } = useEmailSuggestion(email);

const handleSubmit = () => {
  const corrected = getCorrected();
  if (corrected) {
    return confirm(`Meinten Sie ${corrected}?`);
  }
  // safe to submit
};
```

## Accessibility

- Warning renders as `role="status"` with `aria-live="polite"` — screen readers announce new suggestions without interrupting the user
- The suggestion is a native `<button type="button">` — keyboard-focusable, activatable via Enter/Space

## Styling

Minimal inline styles ship as defaults. Override with CSS classes:

```css
.email-warning {
  color: #b45309;
  font-size: 0.85rem;
  margin-top: 4px;
}

.email-suggestion {
  color: #2563eb;
  cursor: pointer;
  text-decoration: underline;
}
```

## Legacy API: `<DACHSuggestions>`

The original `data-dach-suggestion` attribute-coupled component is still exported for backwards compatibility. It wraps `<EmailSuggestion>` internally. New code should use `<EmailSuggestion>` or `useEmailSuggestion`.

```tsx
import { DACHSuggestions } from 'dach-email-suggestion';

<input type="email" data-dach-suggestion="mailCheck" />
<DACHSuggestions id="mailCheck" />
```

Accepts all `<EmailSuggestion>` props (`domains`, `disabled`, `onSuggest`, `onAccept`, `warningText`, `suffixText`) plus `id` which links it to the input via `data-dach-suggestion`.

## Supported Domains

### Germany
gmx.de, gmx.net, gmx.com, web.de, mail.de, kabelmail.de, t-online.de, freenet.de, posteo.de, mailbox.org, tutanota.com, tutanota.de, 1und1.de, ionos.de, arcor.de, vodafone.de, o2online.de

### Austria
gmx.at, aon.at, a1.net, chello.at, three.at, magenta.at, inode.at, live.at

### Switzerland
gmx.ch, bluewin.ch, bluemail.ch, sunrise.ch, hispeed.ch, swissonline.ch

### International (common in DACH)
gmail.com, googlemail.com, outlook.com, outlook.de, hotmail.com, hotmail.de, live.com, live.de, yahoo.com, yahoo.de, icloud.com, me.com, protonmail.com, proton.me

## How It Works

Uses **Damerau-Levenshtein** (Optimal String Alignment) with:
- 3-row rolling array — O(min(n,m)) space
- Early termination when distance exceeds threshold
- Transposition detection — "gmial" to "gmail" = distance 1

## License

MIT
