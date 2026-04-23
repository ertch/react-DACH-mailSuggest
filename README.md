# D-A-CH Email Suggestion

React library that catches email domain typos for the D-A-CH region.

## Install (WIP)

```bash
npm install dach-email-suggestion
```

## Usage

The library ships two idiomatic APIs — a render component and a bare hook — plus a legacy wrapper for gradual migration.

### `<EmailSuggestion>` — controlled render component

Bring your own input. The component only renders the warning.

```tsx
import { useState } from 'react';
import { EmailSuggestion } from 'dach-email-suggestion';

function SignUp() {
  const [email, setEmail] = useState('');

  return (
    <>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <EmailSuggestion email={email} onAccept={setEmail} />
    </>
  );
}
```

Works with any input component — Mantine, MUI, headless libraries, masked inputs, `react-hook-form`, Formik — because we never touch the input element.

### `useEmailSuggestion` — headless hook

Render the warning yourself:

```tsx
import { useEmailSuggestion } from 'dach-email-suggestion';

function SignUp() {
  const [email, setEmail] = useState('');
  const { suggestion, getCorrected } = useEmailSuggestion(email);

  const handleSubmit = () => {
    const corrected = getCorrected();
    if (corrected) {
      // Typo detected even if user submitted before debounce fired
      return ask(`Meinten Sie ${corrected}?`);
    }
    submit(email);
  };

  return (
    <>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {suggestion && (
        <p>Meinten Sie <button onClick={() => setEmail(suggestion)}>{suggestion}</button>?</p>
      )}
    </>
  );
}
```

`getCorrected()` bypasses the debounce and returns the answer synchronously — handy at submit-time.

### Hook Return

| Field | Type | Description |
|---|---|---|
| `suggestion` | `string \| null` | Debounced current suggestion |
| `getCorrected` | `() => string \| null` | Compute synchronously, ignoring debounce |

### Hook Options

| Option | Type | Default | Description |
|---|---|---|---|
| `maxDistance` | `number` | `2` | Max edit distance for typo detection |
| `debounceMs` | `number` | `300` | Debounce delay in ms. `0` for immediate. |
| `domains` | `readonly string[]` | `DACH_DOMAINS` | Domain list to check against |
| `disabled` | `boolean` | `false` | Skip detection entirely |

### `<EmailSuggestion>` Props

All hook options above, plus:

| Prop | Type | Default | Description |
|---|---|---|---|
| `email` | `string` | **required** | Current email from your state |
| `onAccept` | `(v: string) => void` | **required** | Called when the user accepts the suggestion |
| `onSuggest` | `(s: string) => void` | — | Fires whenever a suggestion is displayed |
| `warningText` | `string` | `'Dieser Mailprovider ist uns nicht bekannt. Meinten Sie: '` | Text before the clickable suggestion |
| `suffixText` | `string` | `'?'` | Text appended after the suggestion |
| `warningClassName` | `string` | `'email-warning'` | CSS class for the warning container |
| `suggestionClassName` | `string` | `'email-suggestion'` | CSS class for the clickable suggestion |
| `render` | `(p: { suggestion, accept }) => ReactNode` | — | Custom renderer; overrides default markup |

### Custom rendering via `render` prop

```tsx
<EmailSuggestion
  email={email}
  onAccept={setEmail}
  render={({ suggestion, accept }) => (
    <Alert severity="warning" action={<Button onClick={accept}>Übernehmen</Button>}>
      Typo? Wir vermuten <strong>{suggestion}</strong>
    </Alert>
  )}
/>
```

### Extending the domain list

Import `DACH_DOMAINS` and spread to add your own entries — no implicit merging:

```tsx
import { EmailSuggestion, DACH_DOMAINS } from 'dach-email-suggestion';

<EmailSuggestion
  email={email}
  onAccept={setEmail}
  domains={[...DACH_DOMAINS, 'company.de', 'partner.ch']}
/>
```

Or pass an entirely custom array to replace the default.

### Callbacks for analytics

```tsx
<EmailSuggestion
  email={email}
  onAccept={(v) => { setEmail(v); track('email_typo_fixed', { value: v }); }}
  onSuggest={(s) => track('email_typo_suggested', { suggestion: s })}
/>
```

## Accessibility

- The warning renders as a `role="status"` region with `aria-live="polite"`, so screen readers announce new suggestions without interrupting the user.
- The clickable correction is a native `<button type="button">` — keyboard-focusable, Enter/Space-activatable out of the box.

## Styling

The component ships with minimal inline styles. Override via CSS classes:

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

The original `data-dach-suggestion` + `id` attribute-coupled component is still shipped for backwards compatibility — it is a thin DOM-to-state bridge over the new hook. New code should use `<EmailSuggestion>` or `useEmailSuggestion`.

```tsx
import { DACHSuggestions } from 'dach-email-suggestion';

<input type="email" data-dach-suggestion="mailCheck" />
<DACHSuggestions id="mailCheck" />
```

Accepts all hook options (`maxDistance`, `debounceMs`, `domains`, `disabled`) plus the same text/class/callback props as `<EmailSuggestion>`.

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
