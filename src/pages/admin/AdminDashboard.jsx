import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { Card, StatusBadge, AlertBanner } from "../../components/ui/index";
import { Button } from "../../components/ui/Button";
import { adminApi, extractError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { admin } = useAuth();
  const navigate  = useNavigate();

  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get("/admin/reports");
      setReports(res.data.reports || []);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const priorityDot = { high: "bg-red-400", medium: "bg-amber-400", low: "bg-gray-300" };

  return (
    <AppShell title="Case Reports" isAdmin>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Welcome */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-navy to-blue-900 p-5 text-white">
          <p className="text-xs text-blue-200 mb-1 uppercase tracking-wider font-semibold">Police Admin</p>
          <p className="text-base font-bold mb-0.5">Welcome, {admin?.name || "Officer"}</p>
          <p className="text-xs text-blue-200">Manage crime reports and evidence submitted by the public</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",    value: reports.length,                              color: "text-brand-navy" },
            { label: "Open",     value: reports.filter(r => r.status === "open" || r.status === "submitted").length, color: "text-red-500" },
            { label: "Resolved", value: reports.filter(r => r.status === "resolved" || r.status === "closed").length, color: "text-green-500" },
          ].map((s) => (
            <Card key={s.label} className="!p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={fetchReports} loading={loading} variant="outline" className="flex-1">
            Refresh
          </Button>
          <Button onClick={() => navigate("/admin/reports/new")} className="flex-1">
            + New Report
          </Button>
        </div>

        {error && <AlertBanner type="error" message={error} />}

        {/* Reports list */}
        {loading ? (
          <Card>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-50 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : reports.length === 0 ? (
          <Card>
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400">No reports yet.</p>
            </div>
          </Card>
        ) : (
          <Card className="!p-0 overflow-hidden">
            {reports.map((report, i) => (
              <button
                key={report.id}
                onClick={() => navigate(`/admin/reports/${report.id}`)}
                className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors
                  ${i < reports.length - 1 ? "border-b border-gray-50" : ""}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  report.priority === "high" ? "bg-red-50" : "bg-amber-50"
                }`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${priorityDot[report.priority] || "bg-gray-300"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{report.title}</p>
                  <p className="text-xs text-gray-400 truncate">{report.area} · {report.incident_type}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <StatusBadge status={report.status} />
                  <span className="text-[10px] text-gray-300">
                    {new Date(report.created_at).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </button>
            ))}
          </Card>
        )}
      </div>
    </AppShell>
  );
}