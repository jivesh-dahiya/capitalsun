import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { withViewTransition } from '../lib/viewTransition';

const NAV_ACTIONS = [
  { label: 'Go to Dashboard', to: '/' },
  { label: 'Go to Map', to: '/map' },
  { label: 'Go to Leads', to: '/leads' },
  { label: 'Go to Quotes', to: '/quotes' },
  { label: 'Go to Jobs', to: '/jobs' },
  { label: 'Go to Payments', to: '/payments' },
  { label: 'Go to Service', to: '/service' },
  { label: 'Go to Installers', to: '/installers' },
  { label: 'Go to Inventory', to: '/inventory' },
  { label: 'Go to Profile', to: '/profile' },
];

export default function CommandPalette() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [jobResults, setJobResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    function handleOpenEvent() {
      setOpen(true);
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setJobResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !company || query.trim().length < 2) {
      setJobResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      const q = query.trim();
      const { data } = await supabase
        .from('jobs')
        .select('id, first_name, last_name, address_line, stage')
        .eq('company_id', company.id)
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,address_line.ilike.%${q}%`)
        .limit(6);
      setJobResults(data ?? []);
    }, 200);
    return () => clearTimeout(handle);
  }, [query, open, company]);

  const navActions = NAV_ACTIONS.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));
  const quickActions = 'create new job'.includes(query.toLowerCase()) || query.trim() === ''
    ? [{ label: '+ New Job', action: () => go('/jobs?new=1') }]
    : [];

  const items = [
    ...quickActions.map((a) => ({ type: 'action', ...a })),
    ...navActions.map((a) => ({ type: 'nav', ...a })),
    ...jobResults.map((j) => ({ type: 'job', job: j })),
  ];

  function go(path) {
    setOpen(false);
    withViewTransition(() => navigate(path));
  }

  function selectItem(item) {
    if (!item) return;
    if (item.type === 'action') item.action();
    else if (item.type === 'nav') go(item.to);
    else if (item.type === 'job') go(`/jobs?job=${item.job.id}`);
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectItem(items[activeIndex]);
    }
  }

  if (!open) return null;

  return (
    <div className="cmdk-backdrop" onClick={() => setOpen(false)}>
      <div className="cmdk-panel" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmdk-input"
          placeholder="Search jobs, or jump to a page…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
          onKeyDown={handleKeyDown}
        />
        <div className="cmdk-results">
          {items.length === 0 && <div className="cmdk-empty">No matches.</div>}

          {quickActions.length > 0 && (
            <div className="cmdk-group">
              <div className="cmdk-group-label">Quick action</div>
              {quickActions.map((a, i) => (
                <button
                  key={a.label}
                  className={'cmdk-item' + (items[activeIndex]?.label === a.label ? ' active' : '')}
                  onMouseEnter={() => setActiveIndex(items.findIndex((it) => it.label === a.label))}
                  onClick={() => selectItem({ type: 'action', ...a })}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {navActions.length > 0 && (
            <div className="cmdk-group">
              <div className="cmdk-group-label">Navigate</div>
              {navActions.map((a) => (
                <button
                  key={a.to}
                  className={'cmdk-item' + (items[activeIndex]?.label === a.label ? ' active' : '')}
                  onMouseEnter={() => setActiveIndex(items.findIndex((it) => it.label === a.label))}
                  onClick={() => selectItem({ type: 'nav', ...a })}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {jobResults.length > 0 && (
            <div className="cmdk-group">
              <div className="cmdk-group-label">Jobs</div>
              {jobResults.map((j) => {
                const idx = items.findIndex((it) => it.type === 'job' && it.job.id === j.id);
                return (
                  <button
                    key={j.id}
                    className={'cmdk-item' + (idx === activeIndex ? ' active' : '')}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => selectItem({ type: 'job', job: j })}
                  >
                    {j.first_name} {j.last_name}
                    <span className="cmdk-item-meta">{j.address_line}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="cmdk-hint">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
