export interface Beat {
  id: string;
  label: string; // short chapter name (story island)
  from: number;
  to: number;
  title: string;
  body?: string;
  note?: string;
}

/** Copy for each scroll window of the pinned story. `from`/`to` are progress (0..1). */
export const BEATS: Beat[] = [
  {
    id: 'intro', label: 'The data center', from: 0, to: 0.2,
    title: 'Compute more. Disturb less.',
    body: 'Source-level noise control for the infrastructure powering our world.',
  },
  { id: 'deer', label: 'Deer enters', from: 0.2, to: 0.4, title: "Infrastructure doesn't exist in isolation." },
  { id: 'break', label: 'Dissolve', from: 0.4, to: 0.6, title: 'Rethink the footprint.' },
  { id: 'reform', label: 'Rebuild', from: 0.6, to: 0.8, title: 'Quieter by design.' },
  {
    id: 'final', label: 'Coexist', from: 0.8, to: 1,
    title: 'THRESHOLD',
    body: 'Reduce the noise. Respect what surrounds it.',
    note: 'An illustrative vision of lower-impact infrastructure — not a claim that noise cancellation restores habitat.',
  },
];
