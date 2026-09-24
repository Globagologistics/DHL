import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { TRACKING_NUMBER_LENGTH, normalizeTrackingInput } from '../../services/trackingService';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'maxLength'> & {
  /** Raw digits (0–12). The field shows them grouped as 1234 5678 9012. */
  value: string;
  onValueChange: (digits: string) => void;
};

/** Caret index in the formatted string after `digitCount` digits. */
function caretForDigits(formatted: string, digitCount: number) {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < formatted.length; index++) {
    if (/\d/.test(formatted[index])) seen++;
    if (seen === digitCount) return index + 1;
  }
  return formatted.length;
}

/**
 * Digits-only tracking field: numeric keypad on phones, at most 12 digits,
 * pasted text is cleaned, and the caret stays put while spaces are inserted.
 */
export const TrackingNumberInput = forwardRef<HTMLInputElement, Props>(function TrackingNumberInput({ value, onValueChange, ...rest }, forwardedRef) {
  const input = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);
  useImperativeHandle(forwardedRef, () => input.current as HTMLInputElement);
  const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');

  useLayoutEffect(() => {
    const field = input.current;
    if (pendingCaret.current === null || !field || document.activeElement !== field) return;
    const position = caretForDigits(formatted, pendingCaret.current);
    field.setSelectionRange(position, position);
    pendingCaret.current = null;
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target;
    const beforeCaret = field.value.slice(0, field.selectionStart ?? field.value.length);
    pendingCaret.current = Math.min(beforeCaret.replace(/\D/g, '').length, TRACKING_NUMBER_LENGTH);
    onValueChange(normalizeTrackingInput(field.value));
  };

  // No maxLength: the browser would truncate a pasted "Tracking: 1234 5678 9012"
  // before it could be cleaned. normalizeTrackingInput caps the value at 12 digits.
  return <input
    {...rest}
    ref={input}
    type="text"
    inputMode="numeric"
    pattern="[0-9 ]*"
    autoComplete="off"
    autoCorrect="off"
    spellCheck={false}
    enterKeyHint="search"
    value={formatted}
    onChange={handleChange}
  />;
});
