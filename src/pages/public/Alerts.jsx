import { useEffect, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, AlertBanner, StatusBadge } from "../../components/ui/index";
import { Button } from "../../components/ui/Button";
import { useLocation } from "../../hooks/useLocation";
import { publicApi, extractError } from "../../api/client";

const MOCK_ALERTS = [
  { type: "Theft",             area: "Baner",       time: "2 min ago",  priority: "high",   status: "open" },
  { type: "Suspicious person", area: "Kothrud",     time: "14 min ago", priority: "medium", status: "reviewing" },
  { type: "Vandalism",         area: "Aundh",       time: "41 min ago", priority: "high",   status: "open" },
  { type: "Trespassing",       area: "Hinjewadi",   time: "1 hr ago",   priority: "medium", status: "reviewing" },
  { type: "Road accident",     area: "Wakad",       time: "2 hr ago",   priority: "low",    status: "resolved" },
];

export default function Alerts() {
  const { location, loading: locLoading, error: locError, fetchLocation } = useLocation();
  const [notifyMsg,  setNotifyMsg]  = useState(null);
  const [checking,   setChecking]   = useState(false);
  const [notifyError,setNotifyError]= useState(null);

  const checkNearby = async (lat, lon) => {
    setChecking(true);
    setNotifyError(null);
    try {
      const res = await publicApi.post("/notify", { latitude: lat, longitude: lon });
      setNotifyMsg(res.data.message);
    } catch (err) {
      setNotifyError(extractError(err));
    } finally {
      setChecking(false);
    }
  };

  // Auto-check when location is available
  useEffect(() => {
    if (location) checkNearby(location.latitude, location.longitude);
  }, [location]);

  // Poll every 30s
  useEffect(() => {
    if (!location) return;
    const id = setInterval(() => checkNearby(location.latitude, location.longitude), 30000);
    return () => clearInterval(id);
  }, [location]);

  const isCrimeNear = notifyMsg?.toLowerCase().includes("crime reported");

  return (
    <AppShell title="Area Alerts">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Location check strip */}
        <Card>
          <p className="text-sm font-bold text-gray-800 mb-1">Crime Near You</p>
          <p className="text-xs text-gray-400 mb-4">
            Share your location to check for active alerts in your area (auto-refreshes every 30s)
          </p>

          {!location ? (
            <Button onClick={fetchLocation} loading={locLoading} className="w-full">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Check My Area
            </Button>
          ) : (
            <div className={`rounded-xl p-4 flex items-center gap-3 ${isCrimeNear ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCrimeNear ? "bg-red-100" : "bg-green-100"}`}>
                {isCrimeNear ? (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${isCrimeNear ? "text-red-700" : "text-green-700"}`}>
                  {checking ? "Checking..." : notifyMsg}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)} · Auto-refreshing
                </p>
              </div>
            </div>
          )}

          {locError    && <AlertBanner type="error" message={locError}    className="mt-3" />}
          {notifyError && <AlertBanner type="error" message={notifyError} className="mt-3" />}
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active", value: "5", color: "text-red-500" },
            { label: "Zones",  value: "10",color: "text-brand-cyan" },
            { label: "Today",  value: "12",color: "text-brand-teal" },
          ].map((s) => (
            <Card key={s.label} className="!p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Alert feed */}
        <Card>
          <p className="text-sm font-bold text-gray-800 mb-4">Recent Alerts</p>
          <div className="space-y-0">
            {MOCK_ALERTS.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 py-3 ${i < MOCK_ALERTS.length - 1 ? "border-b border-gray-50" : ""}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  alert.priority === "high" ? "bg-red-50"
                  : alert.priority === "medium" ? "bg-amber-50"
                  : "bg-gray-50"
                }`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    alert.priority === "high" ? "bg-red-400"
                    : alert.priority === "medium" ? "bg-amber-400"
                    : "bg-gray-300"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{alert.type}</p>
                  <p className="text-xs text-gray-400">{alert.area}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={alert.status} />
                  <span className="text-[10px] text-gray-300">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}