import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ToastStack } from '../components/ToastStack'

const LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/customers', label: 'Customers', end: false },
  { to: '/analytics', label: 'Revenue Analytics', end: true },
]

function pageMeta(pathname: string) {
  if (pathname.startsWith('/customers/')) {
    return {
      kicker: 'CRM',
      title: 'Customer details',
      copy: 'Account information, subscription, and revenue history for this customer.',
    }
  }
  if (pathname.startsWith('/customers')) {
    return {
      kicker: 'CRM',
      title: 'Customers',
      copy: 'Manage accounts, subscriptions, and recurring revenue across your customer base.',
    }
  }
  if (pathname.startsWith('/analytics')) {
    return {
      kicker: 'Finance',
      title: 'Revenue Analytics',
      copy: 'Track recognized revenue, subscription mix, and customer contribution.',
    }
  }
  return {
    kicker: 'Overview',
    title: 'Dashboard',
    copy: 'A concise view of customer health and recurring revenue.',
  }
}

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const meta = pageMeta(pathname)

  return (
    <div className="app-shell">
      <div className={`overlay${open ? ' show' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            R
          </div>
          <div>
            <div className="brand-name">RevAn</div>
            <div className="brand-sub">Revenue Analytics</div>
          </div>
        </div>
        <nav className="nav" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">Customer data is stored locally in this browser for the prototype.</div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            <button type="button" className="menu-btn" onClick={() => setOpen(true)} aria-label="Open navigation">
              Menu
            </button>
            <p className="page-kicker">{meta.kicker}</p>
            <h1 className="page-title">{meta.title}</h1>
            <p className="page-copy">{meta.copy}</p>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
      <ToastStack />
    </div>
  )
}
