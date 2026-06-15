import { NavLink, Outlet } from 'react-router-dom';
import { FolderKanban, ListTodo, Rocket } from 'lucide-react';

const navItems = [
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'All Tasks', icon: ListTodo },
];

function NavItem({ to, label, icon: Icon }: (typeof navItems)[number]) {
  return (
    <NavLink
      to={to}
      className={({ isActive }: { isActive: boolean }) =>
        [
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-white/10 text-white shadow-sm ring-1 ring-inset ring-white/10'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4 shrink-0 opacity-90" />
      {label}
    </NavLink>
  );
}

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 md:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-lg shadow-brand-900/30">
            <Rocket className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight text-white">
            Release Tracker
          </span>
        </div>
        <nav className="flex gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }: { isActive: boolean }) =>
                [
                  'rounded-lg p-2 transition-colors',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white',
                ].join(' ')
              }
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" />
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800/90 bg-slate-950 md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-lg shadow-brand-900/40">
            <Rocket className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold tracking-tight text-white">
              Release Tracker
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Project ops
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="border-t border-slate-800/80 p-4">
          <p className="text-xs text-slate-500">Release Tracker v0.1</p>
          <p className="mt-0.5 text-[11px] text-slate-600">
            FastAPI · React · PostgreSQL
          </p>
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden bg-slate-50 px-5 sm:px-8 md:px-8 lg:px-10 xl:px-12">
        <Outlet />
      </main>
    </div>
  );
}
