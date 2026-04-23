export { default as EmailSuggestion } from './EmailSuggestion';
export type { EmailSuggestionProps } from './EmailSuggestion';
export { useEmailSuggestion } from './useEmailSuggestion';
export type {
  UseEmailSuggestionOptions,
  UseEmailSuggestionResult,
} from './useEmailSuggestion';

/** @deprecated Prefer `EmailSuggestion` or `useEmailSuggestion`. */
export { default as DACHSuggestions } from './DACHSuggestions';
export type { DACHSuggestionsProps } from './DACHSuggestions';

export { default } from './DACHSuggestions';

export {
  DACH_DOMAINS,
  findClosestProvider,
  isKnownProvider,
  damerauLevenshteinDistance,
} from './utils';
