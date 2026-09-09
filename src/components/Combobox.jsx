import { useEffect, useRef, useState } from 'react';

// A searchable single-select for lists too long to scroll comfortably (the CEC
// equipment catalog runs into the thousands per manufacturer/category). Native
// <select> semantics for keyboard/form behavior aren't needed here — this is a
// plain filter-as-you-type list, which is the actual bottleneck being solved.
//
// `subLabel`, when given, renders a second muted line under each option (e.g.
// series / phase / type) and is also searchable, so "FoxESS KH10" matches an
// option whose title is "FoxESS Co Ltd KH10 (AS4777-2 2020)" even though the
// words aren't adjacent — each typed word only needs to appear somewhere.
export default function Combobox({ value, onChange, options, placeholder = 'Search…', disabled, formatOption, subLabel }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

  const selected = options.find((o) => o.id === value);
  const label = (o) => (formatOption ? formatOption(o) : o.name);
  const searchText = (o) => `${label(o)} ${subLabel ? subLabel(o) : ''}`.toLowerCase();

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Spacing in manufacturer/model names is inconsistent in the source data
  // ("FOX ESS" vs "FoxESS", "Red Earth" vs "RedEarth") — collapsing spaces on
  // both sides before matching means a typed word matches regardless of
  // whether the label happens to have a space in the middle of it.
  const collapse = (s) => s.replace(/\s+/g, '');
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean).map(collapse);
  const filtered = words.length
    ? options.filter((o) => {
        const text = collapse(searchText(o));
        return words.every((word) => text.includes(word));
      }).slice(0, 200)
    : options.slice(0, 200);

  return (
    <div className="combobox" ref={rootRef}>
      <input
        className="combobox-input"
        value={open ? query : (selected ? label(selected) : '')}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => { setOpen(true); setQuery(''); }}
        onChange={(e) => setQuery(e.target.value)}
      />
      {open && (
        <div className="combobox-list">
          {value && (
            <button type="button" className="combobox-option combobox-clear" onMouseDown={(e) => { e.preventDefault(); onChange(''); setOpen(false); }}>
              Clear selection
            </button>
          )}
          {filtered.length === 0 && <div className="combobox-empty">No matches</div>}
          {filtered.map((o) => (
            <button
              type="button"
              key={o.id}
              className={'combobox-option' + (o.id === value ? ' selected' : '')}
              onMouseDown={(e) => { e.preventDefault(); onChange(o.id); setOpen(false); }}
            >
              <span className="combobox-option-title">{label(o)}</span>
              {subLabel && <span className="combobox-option-sub">{subLabel(o)}</span>}
            </button>
          ))}
          {options.length > filtered.length && filtered.length === 200 && (
            <div className="combobox-hint">Keep typing to narrow down {options.length} results…</div>
          )}
        </div>
      )}
    </div>
  );
}
