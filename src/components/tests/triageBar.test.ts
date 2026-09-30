import { describe, it, expect } from 'vitest';
import { cleanYearsInput } from '../TriageBar';

describe('TriageBar - cleanYearsInput', () => {
  it('handles empty input and non-numeric characters cleanly', () => {
    expect(cleanYearsInput('')).toBe('');
    expect(cleanYearsInput('abc')).toBe('');
    expect(cleanYearsInput('  ')).toBe('');
    expect(cleanYearsInput('$#@')).toBe('');
  });

  it('strips leading zeros when user enters numbers after backspacing (bug.mp4 reproduction)', () => {
    // Exact scenario from bug.mp4: typing 23 or 125 after 0
    expect(cleanYearsInput('02')).toBe('2');
    expect(cleanYearsInput('023')).toBe('23');
    expect(cleanYearsInput('01')).toBe('1');
    expect(cleanYearsInput('012')).toBe('12');
    expect(cleanYearsInput('0125')).toBe('125');
  });

  it('preserves single zero and valid decimals starting with zero', () => {
    expect(cleanYearsInput('0')).toBe('0');
    expect(cleanYearsInput('0.')).toBe('0.');
    expect(cleanYearsInput('0.5')).toBe('0.5');
    expect(cleanYearsInput('0.25')).toBe('0.25');
  });

  it('collapses multiple redundant zeros to single zero', () => {
    expect(cleanYearsInput('00')).toBe('0');
    expect(cleanYearsInput('000')).toBe('0');
    expect(cleanYearsInput('005')).toBe('5');
  });

  it('handles decimal numbers and prevents multiple decimal points', () => {
    expect(cleanYearsInput('1.5')).toBe('1.5');
    expect(cleanYearsInput('2.5')).toBe('2.5');
    expect(cleanYearsInput('1.2.3')).toBe('1.23');
  });

  it('preserves standard positive integers without alteration', () => {
    expect(cleanYearsInput('2')).toBe('2');
    expect(cleanYearsInput('10')).toBe('10');
    expect(cleanYearsInput('25')).toBe('25');
    expect(cleanYearsInput('50')).toBe('50');
  });
});
