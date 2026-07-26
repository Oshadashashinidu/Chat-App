export default function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString();
}
