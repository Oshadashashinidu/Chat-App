export default function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleTimeString();
}
