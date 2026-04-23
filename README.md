# D-A-CH Email Suggestion

Drop-in React component that catches email domain typos for the D-A-CH region.

## Install

```bash
npm install dach-email-suggestion
```

## Usage

```tsx
import { DACHSuggestions } from 'dach-email-suggestion';

<input type="email" data-dach-suggestion="mailCheck" />
<DACHSuggestions id="mailCheck" />
```

That's it. The component:

1. Finds the linked input via `data-dach-suggestion`
2. On blur, checks for typos using Damerau-Levenshtein distance
3. Shows a clickable correction: _"Dieser Mailprovider ist uns nicht bekannt. Meinten Sie: user@gmail.com?"_
4. Clicking the suggestion writes the corrected value back into the input

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | **required** | Must match `data-dach-suggestion="..."` on your input |
| `maxDistance` | `number` | `2` | Max edit distance for typo detection |
| `debounceMs` | `number` | `300` | Debounce delay in ms |
| `warningClassName` | `string` | `'email-warning'` | CSS class for the warning container |
| `suggestionClassName` | `string` | `'email-suggestion'` | CSS class for the clickable suggestion |
| `warningText` | `string` | `'Dieser Mailprovider ist uns nicht bekannt. Meinten Sie: '` | Text before the clickable suggestion |

## Custom Warning Text

```tsx
<DACHSuggestions id="mailCheck" warningText="Did you mean " />
// → "Did you mean user@gmail.com?"

<DACHSuggestions id="mailCheck" warningText="Meinten Sie vielleicht " />
// → "Meinten Sie vielleicht user@gmail.com?"
```

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

## Supported Domains

### Germany
gmx.de, gmx.net, web.de, t-online.de, freenet.de, posteo.de, mailbox.org, 1und1.de, ionos.de, arcor.de, vodafone.de, o2online.de

### Austria
gmx.at, aon.at, a1.net, chello.at, three.at, magenta.at

### Switzerland
gmx.ch, bluewin.ch, sunrise.ch, hispeed.ch, swissonline.ch

### International (common in DACH)
gmail.com, googlemail.com, outlook.com, outlook.de, hotmail.com, hotmail.de, live.com, live.de, yahoo.com, yahoo.de, icloud.com, me.com, protonmail.com, proton.me

## How It Works

Uses **Damerau-Levenshtein** (Optimal String Alignment) with:
- 3-row rolling array — O(min(n,m)) space
- Early termination when distance exceeds threshold
- Transposition detection — "gmial" to "gmail" = distance 1

## License

MIT
