import {
  damerauLevenshteinDistance,
  findClosestProvider,
  isKnownProvider,
} from './utils';

describe('damerauLevenshteinDistance', () => {
  test('identical strings -> 0', () => {
    expect(damerauLevenshteinDistance('gmail.com', 'gmail.com')).toBe(0);
  });

  test('empty vs non-empty -> length', () => {
    expect(damerauLevenshteinDistance('', 'abc')).toBe(3);
    expect(damerauLevenshteinDistance('abc', '')).toBe(3);
  });

  test('both empty -> 0', () => {
    expect(damerauLevenshteinDistance('', '')).toBe(0);
  });

  test('single insertion -> 1', () => {
    expect(damerauLevenshteinDistance('gmal.com', 'gmail.com')).toBe(1);
  });

  test('single deletion -> 1', () => {
    expect(damerauLevenshteinDistance('gmaail.com', 'gmail.com')).toBe(1);
  });

  test('single substitution -> 1', () => {
    expect(damerauLevenshteinDistance('gmail.cpm', 'gmail.com')).toBe(1);
  });

  test('single transposition -> 1', () => {
    expect(damerauLevenshteinDistance('gmial.com', 'gmail.com')).toBe(1);
    expect(damerauLevenshteinDistance('gmx.ed', 'gmx.de')).toBe(1);
  });

  test('symmetry: distance(a,b) === distance(b,a)', () => {
    expect(damerauLevenshteinDistance('abc', 'bac')).toBe(
      damerauLevenshteinDistance('bac', 'abc')
    );
    expect(damerauLevenshteinDistance('gmail.com', 'gmial.com')).toBe(
      damerauLevenshteinDistance('gmial.com', 'gmail.com')
    );
  });

  test('early termination returns maxDistance + 1', () => {
    expect(damerauLevenshteinDistance('abc', 'xyz', 1)).toBe(2);
    expect(damerauLevenshteinDistance('completelydifferent', 'gmail', 2)).toBe(3);
  });

  test('maxDistance does not affect results within threshold', () => {
    expect(damerauLevenshteinDistance('gmial.com', 'gmail.com', 2)).toBe(1);
    expect(damerauLevenshteinDistance('gmal.com', 'gmail.com', 2)).toBe(1);
  });
});

describe('findClosestProvider', () => {
  test('exact match returns null', () => {
    expect(findClosestProvider('gmail.com')).toBeNull();
    expect(findClosestProvider('web.de')).toBeNull();
    expect(findClosestProvider('gmx.at')).toBeNull();
  });

  test('case-insensitive exact match returns null', () => {
    expect(findClosestProvider('Gmail.Com')).toBeNull();
    expect(findClosestProvider('WEB.DE')).toBeNull();
  });

  test('transposition: gmial.com -> gmail.com', () => {
    expect(findClosestProvider('gmial.com')).toBe('gmail.com');
  });

  test('deletion: gmal.com -> gmail.com', () => {
    expect(findClosestProvider('gmal.com')).toBe('gmail.com');
  });

  test('transposition: gmx.ed -> gmx.de', () => {
    expect(findClosestProvider('gmx.ed')).toBe('gmx.de');
  });

  test('extra char: yahooo.com -> yahoo.com', () => {
    expect(findClosestProvider('yahooo.com')).toBe('yahoo.com');
  });

  test('substitution: web.dd -> web.de', () => {
    expect(findClosestProvider('web.dd')).toBe('web.de');
  });

  test('deletion: hotmal.com -> hotmail.com', () => {
    expect(findClosestProvider('hotmal.com')).toBe('hotmail.com');
  });

  test('empty string returns null', () => {
    expect(findClosestProvider('')).toBeNull();
  });

  test('completely different domain returns null', () => {
    expect(findClosestProvider('completelydifferent.com')).toBeNull();
  });

  test('outlok.com -> outlook.com', () => {
    expect(findClosestProvider('outlok.com')).toBe('outlook.com');
  });

  test('protonmal.com -> protonmail.com', () => {
    expect(findClosestProvider('protonmal.com')).toBe('protonmail.com');
  });
});

describe('isKnownProvider', () => {
  test('recognizes known providers', () => {
    expect(isKnownProvider('gmail.com')).toBe(true);
    expect(isKnownProvider('web.de')).toBe(true);
    expect(isKnownProvider('bluewin.ch')).toBe(true);
    expect(isKnownProvider('aon.at')).toBe(true);
  });

  test('case insensitive', () => {
    expect(isKnownProvider('Gmail.Com')).toBe(true);
    expect(isKnownProvider('WEB.DE')).toBe(true);
  });

  test('unknown provider returns false', () => {
    expect(isKnownProvider('unknown.com')).toBe(false);
    expect(isKnownProvider('myprovider.de')).toBe(false);
  });
});
