interface PublishedDateBadgeProps {
  date: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PublishedDateBadge({ date }: PublishedDateBadgeProps) {
  const formatted = formatDate(date);
  if (!formatted) return null;

  return (
    <p
      className="font-outfit mb-[16px]"
      style={{ fontSize: "18px", fontWeight: 700 }}
    >
      Last Updated on {formatted}
    </p>
  );
}
