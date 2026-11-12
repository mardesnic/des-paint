const PATHS = {
  settings:
    'M20 7h-9M14 17H5M14 17a3 3 0 1 0 6 0 3 3 0 1 0-6 0M4 7a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  clear: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  hint: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z',
};

export function Icon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg
      className='icon'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
