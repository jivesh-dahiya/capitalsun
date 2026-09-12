import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { withViewTransition } from '../lib/viewTransition';
import { CloseIcon, SunIcon, MoonIcon, SearchIcon, HomeIcon, BriefcaseIcon, PeopleIcon, CertificateIcon, GridIcon, MapPinIcon, CoinIcon, WrenchIcon, HardHatIcon, BoxIcon, UserIcon } from '../components/icons';
import CommandPalette from '../components/CommandPalette';
import { useNewLeadAlerts } from '../lib/useNewLeadAlerts';

const nav = [
  { to: '/', label: 'Dashboard', end: true, Icon: HomeIcon },
  { to: '/map', label: 'Map', Icon: MapPinIcon },
  { to: '/leads', label: 'Leads', Icon: PeopleIcon },
  { to: '/quotes', label: 'Quotes', Icon: CertificateIcon },
  { to: '/jobs', label: 'Jobs', Icon: BriefcaseIcon },
  { to: '/payments', label: 'Payments', Icon: CoinIcon },
  { to: '/service', label: 'Service', Icon: WrenchIcon },
  { to: '/installers', label: 'Installers', Icon: HardHatIcon },
  { to: '/inventory', label: 'Inventory', Icon: BoxIcon },
  { to: '/profile', label: 'Profile', Icon: UserIcon },
];

// The four most-used pages for someone working day-to-day (field staff,
// salespeople) get a permanent tab; everything else — the same full list
// above — lives behind "More", which opens the drawer.
const bottomTabs = [
  { to: '/', label: 'Home', end: true, Icon: HomeIcon },
  { to: '/jobs', label: 'Jobs', Icon: BriefcaseIcon },
  { to: '/leads', label: 'Leads', Icon: PeopleIcon },
  { to: '/quotes', label: 'Quotes', Icon: CertificateIcon },
];

export default function AppShell({ theme: { theme, toggleTheme } }) {
  const { company, profile, signOut } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [leadToast, setLeadToast] = useNewLeadAlerts(company?.id);
  const isOnMoreTab = !bottomTabs.some((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)));

  useEffect(() => {
    if (!leadToast) return;
    const timer = setTimeout(() => setLeadToast(null), 10000);
    return () => clearTimeout(timer);
  }, [leadToast, setLeadToast]);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  function handleNavClick(e, to) {
    if (to === location.pathname) return;
    e.preventDefault();
    withViewTransition(() => navigate(to));
  }

  return (
    <div className="app-shell">
      {navOpen && <div className="sidebar-backdrop" onClick={() => setNavOpen(false)} />}

      <aside className={'sidebar' + (navOpen ? ' open' : '')}>
        <div className="sidebar-head">
          <div className="brand-row">
            <div className="brand-mark"><img src="/logo.png" alt="Capitalsun" /></div>
            <div>
              <div className="brand-name">Capitalsun</div>
              <div className="brand-subtitle">{company?.company_name || 'Solar Job Manager'}</div>
            </div>
          </div>
          <button className="icon-btn sidebar-close" aria-label="Close menu" onClick={() => setNavOpen(false)}>
            <CloseIcon />
          </button>
        </div>

        <button className="ghost-btn search-trigger" onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}>
          <SearchIcon width={16} height={16} />
          Search
          <kbd className="search-trigger-kbd">⌘K</kbd>
        </button>

        <nav className="nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={(e) => handleNavClick(e, item.to)}
              className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
            >
              <item.Icon width={17} height={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-card">
          <span className="muted-label">Signed in as</span>
          <h3 style={{ fontSize: '1.05rem' }}>
            {profile?.first_name} {profile?.last_name}
          </h3>
          <button className="ghost-btn theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? <MoonIcon width={16} height={16} /> : <SunIcon width={16} height={16} />}
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
          <button className="ghost-btn" style={{ width: '100%' }} onClick={signOut}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <Outlet />
      </main>

      <nav className="bottom-tab-bar">
        {bottomTabs.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={(e) => handleNavClick(e, item.to)}
            className={({ isActive }) => 'bottom-tab-item' + (isActive ? ' active' : '')}
          >
            <item.Icon width={22} height={22} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={'bottom-tab-item' + (isOnMoreTab ? ' active' : '')}
          onClick={() => setNavOpen(true)}
        >
          <GridIcon width={22} height={22} />
          <span>More</span>
        </button>
      </nav>

      <CommandPalette />

      {leadToast && (
        <div className="new-lead-toast" role="status">
          <div>
            <strong>New lead from {leadToast.channel === 'api' ? 'your website' : 'website chat'}</strong>
            <div className="muted-label">
              {leadToast.first_name} {leadToast.last_name}
              {leadToast.estimated_system_kw ? ` · ~${leadToast.estimated_system_kw}kW` : ''}
              {leadToast.lead_score != null ? ` · Score ${leadToast.lead_score}` : ''}
            </div>
          </div>
          <button type="button" className="chip-btn small" onClick={() => { navigate('/leads'); setLeadToast(null); }}>View</button>
          <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setLeadToast(null)}><CloseIcon /></button>
        </div>
      )}
    </div>
  );
}
