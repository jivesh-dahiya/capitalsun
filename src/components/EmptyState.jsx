// A shared empty state for list/table panels across the app — an icon,
// a short heading, and one line saying what will show up here and how,
// so a blank panel teaches the interface instead of just saying "nothing
// here." Kept deliberately plain (no illustration, no card-on-card): the
// icon reuses the same stroke set as the rest of the product.
export default function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon width={22} height={22} />
        </div>
      )}
      <div>
        <div className="empty-state-title">{title}</div>
        {hint && <p>{hint}</p>}
      </div>
      {action}
    </div>
  );
}
