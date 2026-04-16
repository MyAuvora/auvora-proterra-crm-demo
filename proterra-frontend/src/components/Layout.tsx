import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  HardHat,
  Gavel,
  Menu,
  X,
  Globe,
  Sparkles,
  Zap,
} from "lucide-react";

const nav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/leads", icon: Users, label: "Leads" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/contractors", icon: HardHat, label: "Contractors" },
  { to: "/bidding", icon: Gavel, label: "Bidding" },
  { to: "/webhooks", icon: Globe, label: "Lead Forms" },
  { to: "/automations", icon: Zap, label: "Automations" },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white transition-transform lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Area */}
        <div className="border-b border-slate-700/50 px-4 py-5">
          <div className="rounded-xl bg-white p-3">
            <img
              src="/proterra-logo.png"
              alt="ProTerra Design"
              className="h-12 w-full object-contain"
            />
          </div>
          <p className="mt-2 text-center text-xs font-medium text-sky-400">Outdoor Design CRM</p>
        </div>

        {/* Navigation */}
        <nav className="mt-6 space-y-1 px-3">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Management
          </p>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-sky-600 text-white shadow-lg shadow-sky-600/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
              end={item.to === "/"}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* AI Assistant Button */}
        <div className="absolute bottom-4 left-3 right-3">
          <NavLink
            to="/ai"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-lg shadow-sky-600/30"
                  : "bg-slate-800/80 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700 hover:text-white"
              }`
            }
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
              <Sparkles className="h-4 w-4" />
            </div>
            Ask Auvora AI
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-stone-200/80 bg-white/80 px-6 backdrop-blur-sm">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              ProTerra Design &mdash; Florida &amp; Alabama Gulf Coast
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gradient-to-br from-stone-50 via-white to-stone-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
