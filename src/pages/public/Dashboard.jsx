import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { Card, StatusBadge } from "../../components/ui/index";
import { Button } from "../../components/ui/Button";

const STATS = [
  { label: "Active Alerts",     value: "5",  color: "text-red-500",        sub: "Last 30 min" },
  { label: "Reports Today",     value: "12", color: "text-brand-teal",     sub: "Submitted" },
  { label: "Areas Monitored",   value: "10", color: "text-brand-cyan",     sub: "Zones active" },
  { label: "Crimes Detected",   value: "3",  color: "text-amber-500",      sub: "By AI today" },
];

const RECENT = [
  { type: "Theft",             area: "Baner",       time: "2 min ago",  priority: "high",   status: "open" },
  { type: "Suspicious person", area: "Kothrud",     time: "14 min ago", priority: "medium", status: "reviewing" },
  { type: "Vandalism",         area: "Aundh",       time: "41 min ago", priority: "high",   status: "open" },
  { type: "Normal activity",   area: "Viman Nagar", time: "1 hr ago",   priority: "low",    status: "resolved" },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <AppShell title="Dashboard">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Hero greeting */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-navy to-blue-800 p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V5l-9-4z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-base">Suraksha Saathi</div>
              <div className="text-xs text-blue-200">Community Safety Network</div>
            </div>
          </div>
          <p className="text-sm text-blue-100 leading-relaxed mb-4">
            Help keep your area safe. Report suspicious activity or upload CCTV footage for AI analysis.
          </p>
          <Button
            onClick={() => navigate("/upload")}
            className="!bg-brand-teal !text-white !min-h-[40px] !text-sm"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Report an Incident
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {STATS.map((s) => (
            <Card key={s.label} className="!p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{s.label}</p>
              <p className={`text-3xl font-bold leading-none ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
            </Card>
          ))}
        </div>

        {/* Recent activity */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-800">Recent Activity</p>
            <button
              onClick={() => navigate("/alerts")}
              className="text-xs text-brand-teal font-semibold"
            >
              View all →
            </button>
          </div>
          <div className="space-y-0">
            {RECENT.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 py-3 ${i < RECENT.length - 1 ? "border-b border-gray-50" : ""}`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  item.priority === "high" ? "bg-red-400" :
                  item.priority === "medium" ? "bg-amber-400" : "bg-gray-300"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.type}</p>
                  <p className="text-xs text-gray-400">{item.area}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={item.status} />
                  <span className="text-[10px] text-gray-300">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/alerts")}
            className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-card hover:shadow-md transition-shadow text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Area Alerts</p>
              <p className="text-xs text-gray-400">5 active</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/notifications")}
            className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-card hover:shadow-md transition-shadow text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#2bbfa4" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Notifications</p>
              <p className="text-xs text-gray-400">Check your area</p>
            </div>
          </button>
        </div>

      </div>
    </AppShell>
  );
}