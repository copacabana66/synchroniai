import { useEffect, useRef, useState } from 'react';

interface ScoreBarProps {
  label: string;
  value: number;
  barColor: string;
}

export function ScoreBar({ label, value, barColor }: ScoreBarProps) {
  const [width, setWidth] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const t = setTimeout(() => setWidth(value), 80);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-primary font-medium">{label}</span>
        <span className="text-sm font-bold" style={{ color: barColor }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}
