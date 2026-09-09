// Collapsed by default for fields that aren't needed on every job/quote —
// keeps a tab or panel scannable instead of dumping every field on screen.
export default function Section({ title, defaultOpen = false, children }) {
  return (
    <details className="detail-section" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="detail-section-body">{children}</div>
    </details>
  );
}
