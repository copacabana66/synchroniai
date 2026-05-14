interface ScoreBadgeProps {
  score: number;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  let bg: string;
  let color: string;

  if (score >= 85) {
    bg = '#E8F8EF';
    color = '#23B574';
  } else if (score >= 70) {
    bg = '#FEF5E0';
    color = '#D48A12';
  } else {
    bg = '#FDEEEC';
    color = '#C0392B';
  }

  return (
    <span
      style={{
        backgroundColor: bg,
        color,
        fontSize: 13,
        fontWeight: 700,
        borderRadius: 999,
        padding: '2px 10px',
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {score}%
    </span>
  );
}
