import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, isAdmin = false, title = "" }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">

      {/* ── Desktop sidebar ── */}
      {!isMobile && <Sidebar isAdmin={isAdmin} />}

      {/* ── Mobile drawer overlay ── */}
      {isMobile && drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-60 z-60 shadow-2xl">
            <Sidebar isAdmin={isAdmin} />
          </div>
        </>
      )}

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 md:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger (mobile only) */}
            {isMobile && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            {/* Logo text on mobile */}
            {isMobile && (
              <button onClick={() => navigate("/")} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-blue to-brand-teal flex items-center justify-center">
                  <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V5l-9-4z" />
                  </svg>
                </div>
                <span className="font-bold text-sm">
                  <span className="text-brand-navy">Suraksha</span>
                  <span className="text-brand-teal">Saathi</span>
                </span>
              </button>
            )}

            {/* Page title on desktop */}
            {!isMobile && title && (
              <h1 className="text-base font-bold text-gray-800">{title}</h1>
            )}
          </div>

          {/* Right: Live badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-light rounded-full text-xs font-semibold text-brand-teal">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
              Live
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 px-4 md:px-6 py-5 overflow-y-auto"
          style={{ paddingBottom: isMobile ? "80px" : "24px" }}
        >
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      {isMobile && <BottomNav />}
    </div>
  );
}