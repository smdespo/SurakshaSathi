import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

const publicNav = [
  { path: "/",             label: "Dashboard",    icon: "grid" },
  { path: "/upload",       label: "Report Crime", icon: "upload" },
  { path: "/alerts",       label: "Area Alerts",  icon: "alert" },
  { path: "/notifications",label: "Notifications",icon: "bell" },
];

const adminNav = [
  { path: "/admin",             label: "Overview",     icon: "grid" },
  { path: "/admin/reports",     label: "Case Reports",  icon: "file" },
];

const ICONS = {
  grid: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  upload: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  alert: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  bell: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  file: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

function NavItem({ path, label, icon }) {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname === path;

  return (
    <button
      onClick={() => navigate(path)}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left
        ${active
          ? "bg-brand-light text-brand-teal font-semibold"
          : "text-gray-500 hover:bg-gray-50 font-medium"
        }`}
    >
      <span className={active ? "text-brand-teal" : "text-gray-400"}>
        {ICONS[icon]}
      </span>
      {label}
    </button>
  );
}

export function Sidebar({ isAdmin = false }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = isAdmin ? adminNav : publicNav;

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <img 
            src={logo} 
            alt="Suraksha Saathi Logo" 
            className=" h-auto w-auto object-contain block"
          />
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest px-3 mb-2">
          {isAdmin ? "Admin Menu" : "Menu"}
        </p>
        {navItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}

        {/* Switch portal link */}
        <div className="pt-4 border-t border-gray-50 mt-4">
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest px-3 mb-2">
            Switch
          </p>
          {isAdmin ? (
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-50 font-medium"
            >
              Public Portal →
            </button>
          ) : (
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-50 font-medium"
            >
              Admin Login →
            </button>
          )}
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-50">
        {admin ? (
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-brand-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {admin.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{admin.name || "Admin"}</div>
                <div className="text-[10px] text-brand-teal font-medium uppercase tracking-wide">Police Admin</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-red-500 text-sm font-medium hover:text-red-700"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-teal text-xs font-bold">
              U
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700">Public User</div>
              <div className="text-[10px] text-gray-400">Citizen</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}