type LotusMarkSize = 'sm' | 'md' | 'lg' | 'hero' | 'dot';

type LotusMarkProps = {
  size?: LotusMarkSize;
  className?: string;
};

const PETAL_ANGLES = [0, 60, 120, 180, 240, 300];

/**
 * Geometric lotus mark — primary brand motif (docs/spec/VISUAL_SYSTEM.md).
 * Decorative by default (`aria-hidden`); keep the “Sen” wordmark as real text.
 */
export function LotusMark({ size = 'md', className }: LotusMarkProps) {
  const classes = ['lotus-mark', `lotus-mark--${size}`, className].filter(Boolean).join(' ');

  return (
    <svg
      className={classes}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {PETAL_ANGLES.map((angle) => (
        <ellipse
          key={angle}
          className="lotus-mark__petal"
          cx="24"
          cy="15"
          rx="6.5"
          ry="11"
          transform={`rotate(${angle} 24 24)`}
        />
      ))}
      <circle className="lotus-mark__center" cx="24" cy="24" r="5.5" />
    </svg>
  );
}
