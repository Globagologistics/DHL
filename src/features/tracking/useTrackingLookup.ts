import { useCallback, useEffect, useRef, useState } from 'react';
import { TRACKING_NUMBER_LENGTH, lookupShipmentReference, normalizeTrackingInput, rememberTrackingNumber } from '../../services/trackingService';
import type { TrackingLookupResult } from '../../services/trackingService';

export type TrackingPhase = 'empty' | 'typing' | 'incomplete' | 'ready' | 'searching' | 'found' | 'not_found' | 'error';
export type FoundShipment = Extract<TrackingLookupResult, { status: 'found' }>;

/** Delay after the 12th digit before searching, so a fast correction does not query twice. */
export const AUTO_LOOKUP_DEBOUNCE_MS = 450;
/** Keeps "Searching" on screen long enough to read without slowing fast answers much. */
const MIN_SEARCH_MS = 700;
const wait = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

type Options = {
  /** Search automatically once 12 digits are present. */
  autoSearch?: boolean;
  onFound?: (shipment: FoundShipment, digits: string) => void;
};

/**
 * Tracking-number state machine shared by the Track page and Customer Support.
 * Only one lookup can be current: every edit or new search bumps a sequence
 * number and stale responses are ignored, so auto-search and a button press
 * cannot race each other.
 */
export function useTrackingLookup({ autoSearch = true, onFound }: Options = {}) {
  const [digits, setDigitsState] = useState('');
  const [phase, setPhase] = useState<TrackingPhase>('empty');
  const [searchedNumber, setSearchedNumber] = useState('');
  const sequence = useRef(0);
  const debounce = useRef<number | null>(null);
  const digitsRef = useRef('');
  const phaseRef = useRef<TrackingPhase>('empty');
  const onFoundRef = useRef(onFound);
  onFoundRef.current = onFound;

  const updatePhase = (next: TrackingPhase) => { phaseRef.current = next; setPhase(next); };
  const clearDebounce = () => { if (debounce.current !== null) { window.clearTimeout(debounce.current); debounce.current = null; } };
  useEffect(() => () => { clearDebounce(); sequence.current++; }, []);

  const search = useCallback(async (value: string) => {
    clearDebounce();
    const current = ++sequence.current;
    setSearchedNumber(value);
    updatePhase('searching');
    const started = performance.now();
    const result = await lookupShipmentReference(value);
    const remaining = MIN_SEARCH_MS - (performance.now() - started);
    if (remaining > 0) await wait(remaining);
    if (current !== sequence.current) return;
    if (result.status === 'found') {
      updatePhase('found');
      rememberTrackingNumber(result.trackingNumber || value);
      onFoundRef.current?.(result, value);
    } else {
      updatePhase(result.status === 'not_found' ? 'not_found' : 'error');
    }
  }, []);

  const setDigits = useCallback((raw: string) => {
    const next = normalizeTrackingInput(raw);
    if (next === digitsRef.current && phaseRef.current !== 'incomplete') return;
    digitsRef.current = next;
    setDigitsState(next);
    clearDebounce();
    sequence.current++; // an edit makes any in-flight answer stale
    if (!next) { updatePhase('empty'); return; }
    if (next.length < TRACKING_NUMBER_LENGTH) { updatePhase('typing'); return; }
    updatePhase('ready');
    if (autoSearch) debounce.current = window.setTimeout(() => { debounce.current = null; void search(next); }, AUTO_LOOKUP_DEBOUNCE_MS);
  }, [autoSearch, search]);

  /** Explicit Track / Continue press. Returns false when the number is incomplete. */
  const submit = useCallback(() => {
    const value = digitsRef.current;
    if (value.length < TRACKING_NUMBER_LENGTH) { updatePhase('incomplete'); return false; }
    if (phaseRef.current === 'searching' || phaseRef.current === 'found') return true;
    void search(value);
    return true;
  }, [search]);

  /** Fills the field and searches immediately (for example from ?id= in a link). */
  const start = useCallback((raw: string) => {
    const value = normalizeTrackingInput(raw);
    digitsRef.current = value;
    setDigitsState(value);
    if (value.length === TRACKING_NUMBER_LENGTH) void search(value);
    else updatePhase(value ? 'incomplete' : 'empty');
  }, [search]);

  /** Returns from a result panel to the form without searching again. */
  const reset = useCallback(() => {
    clearDebounce();
    sequence.current++;
    const value = digitsRef.current;
    updatePhase(!value ? 'empty' : value.length < TRACKING_NUMBER_LENGTH ? 'typing' : 'ready');
  }, []);

  return { digits, phase, searchedNumber, setDigits, submit, start, reset, retry: () => void search(searchedNumber || digitsRef.current) };
}
