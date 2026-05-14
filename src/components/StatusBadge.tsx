interface StatusBadgeProps {
  status: string;
  color: string;
  bg: string;
}

export function StatusBadge({ status, color, bg }: StatusBadgeProps) {
  return (
    <span
      style={{
        backgroundColor: bg,
        color,
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 999,
        padding: '2px 10px',
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {status}
    </span>
  );
}
