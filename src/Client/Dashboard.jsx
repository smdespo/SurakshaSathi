import React, { useState, useRef, useCallback, useEffect } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8000";
const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  Dashboard: () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Upload: () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  Bell: () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  Map: () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  Pin: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Video: (s = 40) => () => (
    <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Check: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  X: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Menu: () => (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: () => (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  SignOut: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

// ─── Chunked upload ───────────────────────────────────────────────────────────
async function uploadInChunks(file, lat, lon, onProgress) {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  for (let i = 0; i < totalChunks; i++) {
    const chunk = file.slice(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, file.size));
    const form = new FormData();
    form.append("chunk", chunk, file.name);
    form.append("upload_id", uploadId);
    form.append("chunk_index", String(i));
    form.append("total_chunks", String(totalChunks));
    form.append("filename", file.name);
    if (lat != null) form.append("latitude", String(lat));
    if (lon != null) form.append("longitude", String(lon));

    const endpoint = totalChunks === 1 ? `${API_BASE}/predict-video` : `${API_BASE}/upload-chunk`;
    const res = await fetch(endpoint, { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Chunk ${i + 1} failed (HTTP ${res.status})`);
    }
    onProgress(Math.round(((i + 1) / totalChunks) * 100));
    if (totalChunks === 1) return await res.json();
  }

  const finalForm = new FormData();
  finalForm.append("upload_id", uploadId);
  finalForm.append("filename", file.name);
  if (lat != null) finalForm.append("latitude", String(lat));
  if (lon != null) finalForm.append("longitude", String(lon));
  finalForm.append("create_alert", "true");

  const finalRes = await fetch(`${API_BASE}/assemble-and-predict`, { method: "POST", body: finalForm });
  if (!finalRes.ok) {
    const err = await finalRes.json().catch(() => ({}));
    throw new Error(err.detail || "Assembly failed");
  }
  return await finalRes.json();
}

const fmtSize = (b) =>
  b >= 1073741824 ? (b / 1073741824).toFixed(2) + " GB"
  : b >= 1048576 ? (b / 1048576).toFixed(1) + " MB"
  : (b / 1024).toFixed(0) + " KB";

// ─── Reusable atoms ───────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, ...style }}>
    {children}
  </div>
);

const Label = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, disabled, variant = "primary", style: s }) => {
  const base = {
    width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
    fontWeight: 700, fontSize: 15, cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "background 0.15s, opacity 0.15s",
    WebkitTapHighlightColor: "transparent",
    minHeight: 52,
  };
  const variants = {
    primary: { background: disabled ? "#f3f4f6" : "#0d7a5f", color: disabled ? "#9ca3af" : "#fff" },
    ghost:   { background: "#f3f4f6", color: "#374151" },
    danger:  { background: "#fef2f2", color: "#dc2626" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...s }}>
      {children}
    </button>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, sub }) => (
  <Card style={{ padding: "16px 18px", minWidth: 0 }}>
    <Label>{label}</Label>
    <div style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1.1, margin: "6px 0 4px" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#9ca3af" }}>{sub}</div>}
  </Card>
);

// ─── Step badge ───────────────────────────────────────────────────────────────
const StepBadge = ({ n, done }) => (
  <div style={{
    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
    background: done ? "#0d7a5f" : "#f3f4f6",
    color: done ? "#fff" : "#9ca3af",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 700,
  }}>
    {done ? <Icons.Check /> : n}
  </div>
);

// ─── Bottom tab item ──────────────────────────────────────────────────────────
const TabItem = ({ icon: Ic, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 3, padding: "8px 4px 10px",
      background: "none", border: "none", cursor: "pointer",
      color: active ? "#0d7a5f" : "#9ca3af",
      WebkitTapHighlightColor: "transparent",
      position: "relative",
    }}
  >
    <Ic />
    <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: "0.02em" }}>{label}</span>
    {badge > 0 && (
      <span style={{
        position: "absolute", top: 6, right: "50%", transform: "translateX(8px)",
        background: "#ef4444", color: "#fff", borderRadius: "50%",
        width: 16, height: 16, fontSize: 9, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{badge}</span>
    )}
  </button>
);

// ─── Sidebar nav item ─────────────────────────────────────────────────────────
const SideNavItem = ({ icon: Ic, label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex", alignItems: "center", gap: 10, width: "100%",
      padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer",
      background: active ? "#e8f5f0" : "transparent",
      color: active ? "#0d7a5f" : "#4b5563",
      fontWeight: active ? 600 : 400, fontSize: 14,
      transition: "background 0.15s",
      textAlign: "left",
    }}
  >
    <span style={{ color: active ? "#0d7a5f" : "#9ca3af" }}><Ic /></span>
    {label}
  </button>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState("upload");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Location state
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState(null);

  // Upload state
  const [videoFile, setVideoFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Metadata
  const [camId, setCamId] = useState("");
  const [incidentType, setIncidentType] = useState("");

  const handleGetLocation = () => {
    setLocLoading(true);
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported.");
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLocLoading(false);
      },
      (err) => {
        setLocError(err.code === 1 ? "Location denied. Enable permissions." : "Unable to get GPS.");
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const acceptFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setUploadError("Please select a valid video file (MP4, MOV, MKV, AVI).");
      return;
    }
    setVideoFile(file);
    setUploadError(null);
    setResult(null);
    setProgress(0);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files[0]);
  }, []);

  const removeFile = () => {
    setVideoFile(null);
    setUploadError(null);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!videoFile) return;
    setUploading(true);
    setUploadError(null);
    setResult(null);
    setProgress(0);
    try {
      const res = await uploadInChunks(videoFile, location?.latitude ?? null, location?.longitude ?? null, setProgress);
      setResult(res);
      setVideoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Icons.Dashboard },
    { id: "upload",    label: "Upload",    icon: Icons.Upload },
    { id: "alerts",    label: "Alerts",    icon: Icons.Map, badge: 3 },
    { id: "notifs",    label: "Notify",    icon: Icons.Bell },
  ];

  // ─── Page content ─────────────────────────────────────────────────────────
  const pageContent = {
    dashboard: <DashboardPage />,
    upload:    <UploadPage
      location={location} locLoading={locLoading} locError={locError}
      onGetLocation={handleGetLocation}
      videoFile={videoFile} dragging={dragging} setDragging={setDragging}
      onDrop={onDrop} fileInputRef={fileInputRef}
      acceptFile={acceptFile} removeFile={removeFile}
      uploading={uploading} progress={progress} uploadError={uploadError}
      result={result} handleSubmit={handleSubmit}
      camId={camId} setCamId={setCamId}
      incidentType={incidentType} setIncidentType={setIncidentType}
    />,
    alerts:    <AlertsPage />,
    notifs:    <NotifsPage />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f3f4f6", fontFamily: "'Inter','Segoe UI',sans-serif", position: "relative" }}>

      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <aside style={{
          width: 232, background: "#fff", borderRight: "1px solid #e5e7eb",
          display: "flex", flexDirection: "column",
          position: "sticky", top: 0, height: "100vh", flexShrink: 0,
        }}>
          <SidebarContent navItems={navItems} activeTab={activeTab} onNav={setActiveTab} />
        </aside>
      )}

      {/* ── Mobile drawer overlay ── */}
      {isMobile && sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60 }}
          />
          <aside style={{
            position: "fixed", top: 0, left: 0, bottom: 0, width: 260, zIndex: 70,
            background: "#fff", boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
            display: "flex", flexDirection: "column",
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s ease",
          }}>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 4 }}
            >
              <Icons.Close />
            </button>
            <SidebarContent navItems={navItems} activeTab={activeTab} onNav={(t) => { setActiveTab(t); setSidebarOpen(false); }} />
          </aside>
        </>
      )}

      {/* ── Main column ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, paddingBottom: isMobile ? 70 : 0 }}>

        {/* Top bar */}
        <header style={{
          background: "#fff", borderBottom: "1px solid #e5e7eb",
          padding: isMobile ? "13px 16px" : "14px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 40,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#374151", padding: 2, display: "flex" }}>
                <Icons.Menu />
              </button>
            )}
            {isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#0d7a5f,#10b981)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Surakshasathi</span>
              </div>
            )}
            {!isMobile && (
              <span style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>
                {navItems.find(n => n.id === activeTab)?.label || "Dashboard"}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#0d7a5f", background: "#e8f5f0", padding: "5px 10px", borderRadius: 6, display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0d7a5f", animation: "blink 2s infinite" }} />
              Live
            </div>
            {isMobile && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0d7a5f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>RS</div>
            )}
          </div>
        </header>

        {/* Page */}
        <main style={{ flex: 1, padding: isMobile ? 14 : 24, overflowY: "auto" }}>
          {pageContent[activeTab]}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      {isMobile && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          background: "#fff", borderTop: "1px solid #e5e7eb",
          display: "flex",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}>
          {navItems.map(item => (
            <TabItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              badge={item.badge}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input, select, textarea { font-family: inherit; }
        button:active { opacity: 0.85; }
      `}</style>
    </div>
  );
}

// ─── Sidebar content (shared between desktop sidebar + mobile drawer) ─────────
function SidebarContent({ navItems, activeTab, onNav }) {
  return (
    <>
      <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#0d7a5f,#10b981)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Surakshasathi</div>
            <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Crime Detection</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 10px 8px" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#d1d5db", textTransform: "uppercase", letterSpacing: "0.09em", padding: "0 8px", marginBottom: 6 }}>Client Portal</div>
        {navItems.map(item => (
          <SideNavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeTab === item.id}
            onClick={() => onNav(item.id)}
          />
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ padding: "14px 18px", borderTop: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#0d7a5f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>RS</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Rahul Sharma</div>
            <div style={{ fontSize: 10, color: "#0d7a5f", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Security Officer</div>
          </div>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 13, fontWeight: 500, padding: 0 }}>
          <Icons.SignOut /> Sign Out
        </button>
      </div>
    </>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────
function DashboardPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        <StatCard label="Videos Submitted" value="12" color="#0d7a5f"  sub="This session" />
        <StatCard label="Crimes Detected"  value="3"  color="#f59e0b"  sub="Last 30 min" />
        <StatCard label="Active Alerts"    value="5"  color="#ef4444"  sub="Ongoing" />
        <StatCard label="Areas Monitored"  value="10" color="#3b82f6"  sub="Subscribed" />
      </div>

      <Card>
        <Label>Recent activity</Label>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 1 }}>
          {[
            { type: "Theft",             area: "Baner",       time: "2 min ago",  dot: "#ef4444" },
            { type: "Suspicious person", area: "Kothrud",     time: "14 min ago", dot: "#f59e0b" },
            { type: "Normal",            area: "Viman Nagar", time: "22 min ago", dot: "#10b981" },
            { type: "Vandalism",         area: "Aundh",       time: "41 min ago", dot: "#ef4444" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < 3 ? "1px solid #f3f4f6" : "none" }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: item.dot, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{item.type}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{item.area}</div>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>{item.time}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Upload page ──────────────────────────────────────────────────────────────
function UploadPage({
  location, locLoading, locError, onGetLocation,
  videoFile, dragging, setDragging, onDrop, fileInputRef, acceptFile, removeFile,
  uploading, progress, uploadError, result, handleSubmit,
  camId, setCamId, incidentType, setIncidentType,
}) {
  const totalChunks = videoFile ? Math.ceil(videoFile.size / CHUNK_SIZE) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 640, margin: "0 auto", width: "100%" }}>

      {/* ── Step 1: Location ── */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <StepBadge n="1" done={!!location} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Verify location</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Attach GPS so nearby users get alerted</div>
          </div>
        </div>

        <Btn onClick={onGetLocation} disabled={locLoading} variant={locLoading ? "ghost" : "primary"}>
          <Icons.Pin />
          {locLoading ? "Locking GPS..." : location ? "Re-fetch location" : "Latch my location"}
        </Btn>

        {locError && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>
            {locError}
          </div>
        )}

        {location && (
          <div style={{ marginTop: 12, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            {[["Latitude", location.latitude.toFixed(5), "#0d7a5f"], ["Longitude", location.longitude.toFixed(5), "#0d7a5f"], ["Accuracy", location.accuracy.toFixed(1) + "m", "#374151"]].map(([k, v, c]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #f3f4f6", fontFamily: "monospace" }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Step 2: Camera info ── */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <StepBadge n="2" done={!!camId} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Camera details</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Tag the footage source</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            value={camId}
            onChange={e => setCamId(e.target.value)}
            placeholder="Camera ID (e.g. CAM-042 · Baner Junction)"
            style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, color: "#111827", outline: "none", background: "#fff" }}
          />
          <select
            value={incidentType}
            onChange={e => setIncidentType(e.target.value)}
            style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, color: incidentType ? "#111827" : "#9ca3af", outline: "none", background: "#fff", appearance: "none" }}
          >
            <option value="">Incident type — auto-detect by AI</option>
            <option>Theft / Robbery</option>
            <option>Assault / Violence</option>
            <option>Vandalism</option>
            <option>Trespassing</option>
            <option>Suspicious activity</option>
            <option>Road accident</option>
            <option>Other</option>
          </select>
        </div>
      </Card>

      {/* ── Step 3: Video ── */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <StepBadge n="3" done={!!videoFile || !!result} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Upload footage</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Any size · MP4, AVI, MOV, MKV</div>
          </div>
        </div>

        {!videoFile ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "#0d7a5f" : "#d1d5db"}`,
              borderRadius: 12, padding: "32px 20px", textAlign: "center",
              cursor: "pointer", background: dragging ? "#e8f5f0" : "#f9fafb",
              transition: "all 0.15s", marginBottom: 4,
            }}
          >
            <input type="file" accept="video/*" ref={fileInputRef} onChange={e => acceptFile(e.target.files[0])} style={{ display: "none" }} />
            <div style={{ display: "flex", justifyContent: "center", color: dragging ? "#0d7a5f" : "#9ca3af", marginBottom: 10 }}>
              {Icons.Video(36)()}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              Tap to select CCTV footage
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>or drag and drop · any file size</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
              {["MP4", "AVI", "MOV", "MKV"].map(f => (
                <span key={f} style={{ fontSize: 11, padding: "3px 8px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, color: "#6b7280", fontWeight: 500 }}>{f}</span>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, marginBottom: 4, background: "#f9fafb" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: "#e8f5f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#0d7a5f", flexShrink: 0 }}>
                  {Icons.Video(18)()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{videoFile.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{fmtSize(videoFile.size)} · {totalChunks} chunk{totalChunks > 1 ? "s" : ""}</div>
                </div>
              </div>
              {!uploading && (
                <button onClick={removeFile} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 6, flexShrink: 0 }}>
                  <Icons.X />
                </button>
              )}
            </div>
            {uploading && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                  <span>Sending chunk {Math.min(Math.ceil(progress / 100 * totalChunks), totalChunks)} of {totalChunks}</span>
                  <span style={{ fontWeight: 700, color: "#0d7a5f" }}>{progress}%</span>
                </div>
                <div style={{ background: "#e5e7eb", borderRadius: 99, height: 7, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#0d7a5f", borderRadius: 99, width: `${progress}%`, transition: "width 0.3s ease" }} />
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>Do not close the app during upload</div>
              </div>
            )}
          </div>
        )}

        {uploadError && (
          <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, fontSize: 13, color: "#dc2626", marginBottom: 10 }}>
            {uploadError}
          </div>
        )}

        <Btn onClick={handleSubmit} disabled={!videoFile || uploading}>
          {uploading
            ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> Transmitting {progress}%</>
            : <><Icons.Upload /> Submit to detection backend</>}
        </Btn>

        <div style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
          {location
            ? `GPS: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
            : "No GPS attached — complete Step 1 for area alerts"}
        </div>
      </Card>

      {/* ── Result card ── */}
      {result && (
        <Card style={{ border: "1px solid #bbf7d0", background: "#f0fdf4" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#15803d", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
            <Icons.Check /> Analysed successfully
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[
              ["Prediction",    result.predicted_class],
              ["Frames used",  result.frames_used],
              ["Alert created", result.alert_created ? "Yes" : "No"],
              ["File",          result.video_name],
              ...(result.alert_details?.main_area ? [["Main area", result.alert_details.main_area]] : []),
              ...(result.alert_details?.nearby_areas ? [["Nearby", result.alert_details.nearby_areas.slice(0, 3).join(", ")]] : []),
            ].map(([k, v]) => (
              <div key={k} style={{ background: "#fff", borderRadius: 8, padding: "9px 12px", border: "1px solid #d1fae5" }}>
                <div style={{ fontSize: 9, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{String(v)}</div>
              </div>
            ))}
          </div>
          {result.probabilities && (
            <>
              <Label>Class probabilities</Label>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(result.probabilities).map(([cls, prob]) => (
                  <div key={cls}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "#374151", fontWeight: 500 }}>{cls}</span>
                      <span style={{ color: "#0d7a5f", fontWeight: 700 }}>{(prob * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ background: "#d1fae5", borderRadius: 99, height: 5 }}>
                      <div style={{ height: "100%", background: "#0d7a5f", borderRadius: 99, width: `${(prob * 100).toFixed(1)}%`, transition: "width 0.5s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── Alerts page ──────────────────────────────────────────────────────────────
function AlertsPage() {
  const alerts = [
    { type: "Theft",             area: "Baner",       time: "2 min ago",  sev: "high" },
    { type: "Suspicious person", area: "Kothrud",     time: "14 min ago", sev: "medium" },
    { type: "Vandalism",         area: "Aundh",       time: "41 min ago", sev: "high" },
    { type: "Trespassing",       area: "Hinjewadi",   time: "1 hr ago",   sev: "medium" },
    { type: "Road accident",     area: "Wakad",       time: "2 hr ago",   sev: "low" },
  ];
  const sevColor = { high: "#ef4444", medium: "#f59e0b", low: "#6b7280" };
  const sevBg    = { high: "#fef2f2", medium: "#fffbeb", low: "#f9fafb" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 640, margin: "0 auto", width: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatCard label="Active alerts" value="5" color="#ef4444" sub="Last 30 min" />
        <StatCard label="Areas covered" value="10" color="#3b82f6" sub="Monitored zones" />
      </div>
      {alerts.map((a, i) => (
        <div key={i} style={{ background: sevBg[a.sev], border: `1px solid ${sevColor[a.sev]}30`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: sevColor[a.sev], flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{a.type}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{a.area}</div>
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>{a.time}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Notifs page ──────────────────────────────────────────────────────────────
function NotifsPage() {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>
      <Card>
        <Label>Notifications</Label>
        <div style={{ marginTop: 12, fontSize: 14, color: "#6b7280", textAlign: "center", padding: "30px 0" }}>
          No new notifications. You're all caught up.
        </div>
      </Card>
    </div>
  );
}