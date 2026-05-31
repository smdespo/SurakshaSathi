import { useEffect, useMemo, useState } from "react";


const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "report", label: "Emergency Report" },
  { id: "watch", label: "Safety Watch" },
  { id: "scan", label: "Video Scan" },
  { id: "police", label: "Police Desk" },
];


async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || `Request failed (${response.status})`);
  }

  return data;
}


function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}


function useGeoCapture() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const capture = () => {
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setLoading(false);
      setError("Location access is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      (geoError) => {
        setLoading(false);
        setError(geoError.code === 1 ? "Location access was denied." : "Unable to fetch location right now.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  return { location, loading, error, capture };
}


function AppShell({ children, activePage, setActivePage, health, modelStatus }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #edf7f1 0%, #f7fbf9 36%, #eef4f0 100%)",
        color: "#0f241c",
      }}
    >
      <div
        style={{
          maxWidth: 1380,
          margin: "0 auto",
          padding: "28px 20px 56px",
          display: "grid",
          gap: 20,
        }}
      >
        <header
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            gap: 18,
          }}
        >
          <div
            style={{
              background: "#14372d",
              borderRadius: 28,
              padding: 24,
              minHeight: 206,
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 24,
                border: "1px dashed rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.03)",
              }}
            />
            <div>
              <div style={{ fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.76 }}>
                SurakshaSathi
              </div>
              <h1 style={{ margin: "10px 0 0", fontSize: 30, lineHeight: 1.1 }}>
                Fast crisis reporting and coordinated police response.
              </h1>
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #d8e5de",
              borderRadius: 28,
              padding: 24,
              display: "grid",
              gap: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 13, color: "#718279", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Live status
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Chip tone={health ? "good" : "soft"}>{health?.message || "Connecting"}</Chip>
                  <Chip tone={modelStatus?.status === "ready" ? "good" : "warn"}>
                    Scan engine: {modelStatus?.status || "unknown"}
                  </Chip>
                </div>
              </div>
              <div style={{ maxWidth: 260, color: "#607067", fontSize: 14, lineHeight: 1.6 }}>
                One place for emergency submission, live awareness, evidence handling, and police-only review.
              </div>
            </div>

            <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    padding: "11px 15px",
                    background: activePage === item.id ? "#dff3ea" : "#f3f6f4",
                    color: activePage === item.id ? "#0d7a5f" : "#51635a",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}


function Chip({ children, tone = "soft" }) {
  const tones = {
    soft: { background: "#f2f5f3", color: "#596c63" },
    good: { background: "#dcfce7", color: "#166534" },
    warn: { background: "#fef3c7", color: "#92400e" },
    danger: { background: "#fee2e2", color: "#991b1b" },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "7px 11px",
        fontSize: 12,
        fontWeight: 700,
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}


function Section({ title, subtitle, action, children }) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #d8e5de",
        borderRadius: 24,
        padding: 22,
        boxShadow: "0 18px 44px rgba(15, 36, 28, 0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#12352b" }}>{title}</h2>
          {subtitle ? <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.6, color: "#66786f" }}>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}


function StatTile({ label, value, helper, accent }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #d8e5de",
        borderRadius: 20,
        padding: 18,
      }}
    >
      <div style={{ fontSize: 12, color: "#73857c", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: accent, marginTop: 8 }}>{value}</div>
      <div style={{ marginTop: 8, color: "#66786f", fontSize: 13, lineHeight: 1.5 }}>{helper}</div>
    </div>
  );
}


function Field({ label, children, hint }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#355147", letterSpacing: "0.03em" }}>{label}</span>
      {children}
      {hint ? <span style={{ fontSize: 12, color: "#7c8d84" }}>{hint}</span> : null}
    </label>
  );
}


function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        boxSizing: "border-box",
        borderRadius: 14,
        border: "1px solid #cedbd4",
        background: "#fcfffd",
        padding: "12px 14px",
        fontSize: 14,
        color: "#11261e",
        ...props.style,
      }}
    />
  );
}


function TextArea(props) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        boxSizing: "border-box",
        minHeight: 110,
        resize: "vertical",
        borderRadius: 14,
        border: "1px solid #cedbd4",
        background: "#fcfffd",
        padding: "12px 14px",
        fontSize: 14,
        color: "#11261e",
        ...props.style,
      }}
    />
  );
}


function Button({ children, variant = "primary", ...props }) {
  const variants = {
    primary: {
      background: props.disabled ? "#d8dfdb" : "#0d7a5f",
      color: "#ffffff",
      border: "none",
    },
    secondary: {
      background: "#ffffff",
      color: "#23463a",
      border: "1px solid #c8d7cf",
    },
  };

  return (
    <button
      {...props}
      style={{
        borderRadius: 14,
        padding: "12px 16px",
        fontSize: 14,
        fontWeight: 700,
        cursor: props.disabled ? "not-allowed" : "pointer",
        ...variants[variant],
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}


function Message({ tone = "soft", children }) {
  const tones = {
    soft: { background: "#f6fbf8", border: "#dbe8e1", color: "#466158" },
    danger: { background: "#fff1f2", border: "#fecdd3", color: "#9f1239" },
    good: { background: "#effcf3", border: "#c7f0d3", color: "#166534" },
  };

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${tones[tone].border}`,
        background: tones[tone].background,
        color: tones[tone].color,
        padding: "14px 16px",
        fontSize: 14,
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}


function LocationCard({ location }) {
  if (!location) {
    return null;
  }

  return (
    <div
      style={{
        background: "#f6fbf8",
        border: "1px solid #dbe8e1",
        borderRadius: 18,
        padding: 16,
        display: "grid",
        gap: 8,
      }}
    >
      <LocationRow label="Latitude" value={location.latitude.toFixed(6)} />
      <LocationRow label="Longitude" value={location.longitude.toFixed(6)} />
      <LocationRow label="Accuracy" value={`${location.accuracy.toFixed(1)} m`} />
    </div>
  );
}


function LocationRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "#688077", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{label}</span>
      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#12352b" }}>{value}</span>
    </div>
  );
}


function ResultPanel({ title, children, tone = "soft" }) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: `1px solid ${tone === "good" ? "#c9ebd6" : "#dbe8e1"}`,
        background: tone === "good" ? "#f2fcf5" : "#f6fbf8",
        padding: 18,
        display: "grid",
        gap: 14,
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 800, color: "#183c31" }}>{title}</div>
      {children}
    </div>
  );
}


function DetailGrid({ items }) {
  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            borderRadius: 16,
            border: "1px solid #dbe8e1",
            background: "#ffffff",
            padding: 14,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#74877d", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {item.label}
          </div>
          <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700, color: "#15392f", lineHeight: 1.4 }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}


function ProbabilityBars({ probabilities = {} }) {
  const entries = Object.entries(probabilities);
  if (!entries.length) {
    return null;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {entries.map(([label, value]) => {
        const percent = Math.round(value * 1000) / 10;
        return (
          <div key={label} style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}>
              <span style={{ color: "#27453a", fontWeight: 600 }}>{label}</span>
              <span style={{ color: "#0d7a5f", fontWeight: 700 }}>{percent}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "#dceae3", overflow: "hidden" }}>
              <div
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #0d7a5f 0%, #2eb884 100%)",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}


function ReportsTable({ reports, onSelect, selectedId }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
        <thead>
          <tr>
            {["Title", "Source", "Area", "Status", "Type", "Evidence", "Created"].map((label) => (
              <th
                key={label}
                style={{
                  textAlign: "left",
                  padding: "0 0 12px",
                  borderBottom: "1px solid #dce8e2",
                  fontSize: 12,
                  color: "#70827a",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr
              key={report.id}
              onClick={() => onSelect(report.id)}
              style={{
                cursor: "pointer",
                background: selectedId === report.id ? "#f6fbf8" : "transparent",
              }}
            >
              <td style={{ padding: "14px 10px 14px 0", borderBottom: "1px solid #edf4f0", fontWeight: 700 }}>{report.title}</td>
              <td style={{ padding: "14px 10px 14px 0", borderBottom: "1px solid #edf4f0" }}>{report.report_source}</td>
              <td style={{ padding: "14px 10px 14px 0", borderBottom: "1px solid #edf4f0" }}>{report.area}</td>
              <td style={{ padding: "14px 10px 14px 0", borderBottom: "1px solid #edf4f0" }}>{report.status}</td>
              <td style={{ padding: "14px 10px 14px 0", borderBottom: "1px solid #edf4f0" }}>{report.incident_type}</td>
              <td style={{ padding: "14px 10px 14px 0", borderBottom: "1px solid #edf4f0" }}>
                {report.evidence_path ? <Chip tone="good">Available</Chip> : <Chip tone="warn">Pending</Chip>}
              </td>
              <td style={{ padding: "14px 0", borderBottom: "1px solid #edf4f0", color: "#607067" }}>{formatDate(report.created_at)}</td>
            </tr>
          ))}
          {!reports.length ? (
            <tr>
              <td colSpan={7} style={{ padding: "22px 0", color: "#70827a" }}>
                No reports yet. Sign in as police admin and refresh to load cases.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}


export default function ClientDashboard() {
  const [activePage, setActivePage] = useState("home");
  const [health, setHealth] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [systemError, setSystemError] = useState("");
  const [busyAction, setBusyAction] = useState("");

  const reportLocation = useGeoCapture();
  const watchLocation = useGeoCapture();
  const scanLocation = useGeoCapture();
  const alertLocation = useGeoCapture();

  const [publicFile, setPublicFile] = useState(null);
  const [publicResult, setPublicResult] = useState(null);
  const [publicError, setPublicError] = useState("");

  const [watchResult, setWatchResult] = useState(null);
  const [watchError, setWatchError] = useState("");
  const [alertResult, setAlertResult] = useState(null);
  const [alertError, setAlertError] = useState("");

  const [scanFile, setScanFile] = useState(null);
  const [scanCreateAlert, setScanCreateAlert] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");

  const [adminSetup, setAdminSetup] = useState({
    superAdminKey: "",
    name: "",
    email: "",
    badgeNumber: "",
    station: "",
  });
  const [adminSetupResult, setAdminSetupResult] = useState(null);
  const [adminSetupError, setAdminSetupError] = useState("");

  const [adminLogin, setAdminLogin] = useState({ email: "", adminKey: "" });
  const [adminSession, setAdminSession] = useState(null);
  const [adminLoginError, setAdminLoginError] = useState("");

  const [reportForm, setReportForm] = useState({
    title: "",
    incident_type: "",
    area: "",
    description: "",
    priority: "medium",
    status: "open",
    officer_name: "",
    latitude: "",
    longitude: "",
  });
  const [reportCreateResult, setReportCreateResult] = useState(null);
  const [reportCreateError, setReportCreateError] = useState("");

  const [reports, setReports] = useState([]);
  const [reportsError, setReportsError] = useState("");
  const [selectedReportId, setSelectedReportId] = useState("");
  const [adminEvidenceFile, setAdminEvidenceFile] = useState(null);
  const [evidenceError, setEvidenceError] = useState("");
  const [evidenceLink, setEvidenceLink] = useState(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [healthData, modelData] = await Promise.all([apiRequest("/"), apiRequest("/model-status")]);
        setHealth(healthData);
        setModelStatus(modelData);
      } catch (error) {
        setSystemError(error.message);
      }
    };

    bootstrap();
  }, []);

  const stats = useMemo(
    () => ({
      publicReports: reports.filter((report) => report.report_source === "public").length,
      policeReports: reports.filter((report) => report.report_source === "admin").length,
      evidenceReady: reports.filter((report) => report.evidence_path).length,
      openReports: reports.filter((report) => report.status !== "closed").length,
    }),
    [reports],
  );

  const selectedReport = reports.find((report) => report.id === selectedReportId) || null;

  const refreshStatus = async () => {
    try {
      setBusyAction("status");
      const [healthData, modelData] = await Promise.all([apiRequest("/"), apiRequest("/model-status")]);
      setHealth(healthData);
      setModelStatus(modelData);
      setSystemError("");
    } catch (error) {
      setSystemError(error.message);
    } finally {
      setBusyAction("");
    }
  };

  const refreshReports = async (session = adminSession) => {
    if (!session) {
      return;
    }

    try {
      setBusyAction("reports");
      const data = await apiRequest("/admin/reports", {
        headers: {
          "X-Admin-Email": session.email,
          "X-Admin-Key": session.adminKey,
        },
      });
      setReports(data.reports || []);
      setReportsError("");
      if (!selectedReportId && data.reports?.length) {
        setSelectedReportId(data.reports[0].id);
      }
    } catch (error) {
      setReportsError(error.message);
    } finally {
      setBusyAction("");
    }
  };

  const submitPublicReport = async () => {
    if (!reportLocation.location || !publicFile) {
      setPublicError("Capture location and choose a video before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("latitude", String(reportLocation.location.latitude));
    formData.append("longitude", String(reportLocation.location.longitude));
    formData.append("file", publicFile);

    try {
      setBusyAction("public");
      const data = await apiRequest("/reports/public", {
        method: "POST",
        body: formData,
      });
      setPublicResult(data);
      setPublicError("");
    } catch (error) {
      setPublicError(error.message);
    } finally {
      setBusyAction("");
    }
  };

  const checkSafety = async () => {
    if (!watchLocation.location) {
      setWatchError("Capture your location first.");
      return;
    }

    try {
      setBusyAction("watch");
      const data = await apiRequest("/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(watchLocation.location),
      });
      setWatchResult(data);
      setWatchError("");
    } catch (error) {
      setWatchError(error.message);
    } finally {
      setBusyAction("");
    }
  };

  const shareLocation = async () => {
    if (!watchLocation.location) {
      setWatchError("Capture your location first.");
      return;
    }

    try {
      setBusyAction("location");
      const data = await apiRequest("/update-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(watchLocation.location),
      });
      setWatchResult(data);
      setWatchError("");
    } catch (error) {
      setWatchError(error.message);
    } finally {
      setBusyAction("");
    }
  };

  const createManualAlert = async () => {
    if (!alertLocation.location) {
      setAlertError("Capture a location before creating an alert.");
      return;
    }

    try {
      setBusyAction("alert");
      const data = await apiRequest("/camera-crime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertLocation.location),
      });
      setAlertResult(data);
      setAlertError("");
    } catch (error) {
      setAlertError(error.message);
    } finally {
      setBusyAction("");
    }
  };

  const runVideoScan = async () => {
    if (!scanFile) {
      setScanError("Choose a video to analyze.");
      return;
    }
    if (scanCreateAlert && !scanLocation.location) {
      setScanError("Capture a location if you want the scan to create an alert.");
      return;
    }

    const formData = new FormData();
    formData.append("file", scanFile);
    formData.append("create_alert", String(scanCreateAlert));
    if (scanLocation.location) {
      formData.append("latitude", String(scanLocation.location.latitude));
      formData.append("longitude", String(scanLocation.location.longitude));
    }

    try {
      setBusyAction("scan");
      const data = await apiRequest("/predict-video", {
        method: "POST",
        body: formData,
      });
      setScanResult(data);
      setScanError("");
    } catch (error) {
      setScanError(error.message);
    } finally {
      setBusyAction("");
    }
  };

  const createAdmin = async () => {
    try {
      setBusyAction("admin-create");
      const data = await apiRequest("/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Super-Admin-Key": adminSetup.superAdminKey,
        },
        body: JSON.stringify({
          name: adminSetup.name,
          email: adminSetup.email,
          badge_number: adminSetup.badgeNumber,
          station: adminSetup.station,
        }),
      });
      setAdminSetupResult(data);
      setAdminSetupError("");
      setAdminLogin({
        email: data.admin.email,
        adminKey: data.admin.admin_key,
      });
    } catch (error) {
      setAdminSetupError(error.message);
    } finally {
      setBusyAction("");
    }
  };

  const loginAdmin = async () => {
    try {
      setBusyAction("admin-login");
      const data = await apiRequest("/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminLogin.email,
          admin_key: adminLogin.adminKey,
        }),
      });
      const session = {
        email: adminLogin.email,
        adminKey: adminLogin.adminKey,
        profile: data.admin,
      };
      setAdminSession(session);
      setAdminLoginError("");
      await refreshReports(session);
    } catch (error) {
      setAdminLoginError(error.message);
    } finally {
      setBusyAction("");
    }
  };

  const createPoliceReport = async () => {
    if (!adminSession) {
      setReportCreateError("Login as police admin first.");
      return;
    }

    try {
      setBusyAction("report-create");
      const data = await apiRequest("/admin/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Email": adminSession.email,
          "X-Admin-Key": adminSession.adminKey,
        },
        body: JSON.stringify({
          ...reportForm,
          officer_name: reportForm.officer_name || null,
          latitude: reportForm.latitude ? Number(reportForm.latitude) : null,
          longitude: reportForm.longitude ? Number(reportForm.longitude) : null,
        }),
      });
      setReportCreateResult(data);
      setReportCreateError("");
      setSelectedReportId(data.report.id);
      await refreshReports();
    } catch (error) {
      setReportCreateError(error.message);
    } finally {
      setBusyAction("");
    }
  };

  const uploadEvidence = async () => {
    if (!adminSession || !selectedReportId || !adminEvidenceFile) {
      setEvidenceError("Choose a report and a video first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", adminEvidenceFile);

    try {
      setBusyAction("evidence-upload");
      await apiRequest(`/admin/reports/${selectedReportId}/evidence`, {
        method: "POST",
        headers: {
          "X-Admin-Email": adminSession.email,
          "X-Admin-Key": adminSession.adminKey,
        },
        body: formData,
      });
      setEvidenceError("");
      await refreshReports();
    } catch (error) {
      setEvidenceError(error.message);
    } finally {
      setBusyAction("");
    }
  };

  const requestEvidenceLink = async () => {
    if (!adminSession || !selectedReportId) {
      setEvidenceError("Select a report first.");
      return;
    }

    try {
      setBusyAction("evidence-link");
      const data = await apiRequest(`/admin/reports/${selectedReportId}/evidence-link`, {
        headers: {
          "X-Admin-Email": adminSession.email,
          "X-Admin-Key": adminSession.adminKey,
        },
      });
      setEvidenceLink(data);
      setEvidenceError("");
    } catch (error) {
      setEvidenceError(error.message);
    } finally {
      setBusyAction("");
    }
  };

  return (
    <AppShell activePage={activePage} setActivePage={setActivePage} health={health} modelStatus={modelStatus}>
      {systemError ? <Message tone="danger">{systemError}</Message> : null}

      {activePage === "home" ? (
        <>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
            <StatTile label="Emergency submissions" value={String(stats.publicReports)} helper="Reports sent quickly by citizens with location and video only." accent="#0d7a5f" />
            <StatTile label="Police reports" value={String(stats.policeReports)} helper="Cases entered directly by authorized police staff." accent="#2563eb" />
            <StatTile label="Evidence available" value={String(stats.evidenceReady)} helper="Reports that already have private video evidence stored." accent="#b45309" />
            <StatTile label="Open cases" value={String(stats.openReports)} helper="Cases that still need review, action, or closure." accent="#dc2626" />
          </div>

          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1.2fr 1fr" }}>
            <Section
              title="Operational flow"
              subtitle="The application is arranged around real-life urgency: rapid reporting first, then verification, then police-only evidence access."
            >
              <div style={{ display: "grid", gap: 14 }}>
                {[
                  ["Emergency Report", "A person in distress shares only location and video. The area is detected automatically."],
                  ["Safety Watch", "A user checks whether the current area has recent nearby alerts or shares a live location update."],
                  ["Video Scan", "A video is analyzed by the scan engine and can optionally create an alert from the same spot."],
                  ["Police Desk", "Police staff create reports, upload private evidence, and open short-lived signed viewing links."],
                ].map(([title, text], index) => (
                  <div
                    key={title}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "44px 1fr",
                      gap: 14,
                      alignItems: "start",
                      padding: "14px 16px",
                      borderRadius: 18,
                      background: "#f6fbf8",
                      border: "1px solid #dbe8e1",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: "#14372d",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#15392f" }}>{title}</div>
                      <div style={{ marginTop: 4, color: "#65776f", fontSize: 14, lineHeight: 1.6 }}>{text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              title="Service readiness"
              subtitle="A quick read on the system before you begin."
              action={<Button variant="secondary" onClick={refreshStatus} disabled={busyAction === "status"}>{busyAction === "status" ? "Refreshing..." : "Refresh"}</Button>}
            >
              <DetailGrid
                items={[
                  { label: "Application", value: health?.message || "Waiting for connection" },
                  { label: "Scan engine", value: modelStatus?.status || "Unknown" },
                  { label: "Model path", value: modelStatus?.model_path || "Not available" },
                  { label: "Police session", value: adminSession ? adminSession.email : "Not signed in" },
                ]}
              />
            </Section>
          </div>
        </>
      ) : null}

      {activePage === "report" ? (
        <Section
          title="Emergency Report"
          subtitle="Built for urgent moments. A person only needs to share live location and the evidence video. The area comes back automatically."
          action={<Chip tone={publicResult ? "good" : "soft"}>{publicResult ? "Report submitted" : "Awaiting submission"}</Chip>}
        >
          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ display: "grid", gap: 14 }}>
              <Field label="Location">
                <Button onClick={reportLocation.capture} disabled={reportLocation.loading || busyAction === "public"}>
                  {reportLocation.loading ? "Capturing location..." : "Use current location"}
                </Button>
              </Field>
              {reportLocation.error ? <Message tone="danger">{reportLocation.error}</Message> : null}
              <LocationCard location={reportLocation.location} />
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <Field label="Evidence video" hint="Accepted formats: MP4, AVI, MOV, MKV">
                <Input type="file" accept="video/*" onChange={(event) => setPublicFile(event.target.files?.[0] || null)} />
              </Field>
              {publicFile ? <Chip tone="good">{publicFile.name}</Chip> : null}
              <Button onClick={submitPublicReport} disabled={busyAction === "public"}>
                {busyAction === "public" ? "Submitting report..." : "Submit emergency report"}
              </Button>
            </div>
          </div>

          {publicError ? <Message tone="danger">{publicError}</Message> : null}
          {publicResult ? (
            <ResultPanel title="Report received" tone="good">
              <DetailGrid
                items={[
                  { label: "Area", value: publicResult.area || "Unknown area" },
                  { label: "Latitude", value: String(publicResult.latitude) },
                  { label: "Longitude", value: String(publicResult.longitude) },
                  { label: "Report ID", value: publicResult.report?.id || "Not available" },
                ]}
              />
              <Message tone="good">
                Police review can now happen from the secure desk, and the evidence remains privately stored until an authorized signed link is requested.
              </Message>
            </ResultPanel>
          ) : null}
        </Section>
      ) : null}

      {activePage === "watch" ? (
        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1fr 1fr" }}>
          <Section
            title="Safety Watch"
            subtitle="Check the current area for recent nearby alerts or share a live location snapshot for awareness."
          >
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button onClick={watchLocation.capture} disabled={watchLocation.loading || !!busyAction}>
                  {watchLocation.loading ? "Capturing..." : "Capture current location"}
                </Button>
                <Button variant="secondary" onClick={shareLocation} disabled={!watchLocation.location || !!busyAction}>
                  {busyAction === "location" ? "Sharing..." : "Share location"}
                </Button>
                <Button variant="secondary" onClick={checkSafety} disabled={!watchLocation.location || !!busyAction}>
                  {busyAction === "watch" ? "Checking..." : "Check area safety"}
                </Button>
              </div>
              {watchLocation.error ? <Message tone="danger">{watchLocation.error}</Message> : null}
              <LocationCard location={watchLocation.location} />
              {watchError ? <Message tone="danger">{watchError}</Message> : null}
              {watchResult ? (
                <ResultPanel title="Safety watch result">
                  <Message tone={String(watchResult.message || "").includes("No recent") ? "good" : "soft"}>
                    {watchResult.message || "Location processed successfully."}
                  </Message>
                  {"area" in watchResult ? (
                    <DetailGrid
                      items={[
                        { label: "Area", value: watchResult.area || "Unknown area" },
                        { label: "Latitude", value: String(watchResult.latitude ?? "-") },
                        { label: "Longitude", value: String(watchResult.longitude ?? "-") },
                      ]}
                    />
                  ) : null}
                </ResultPanel>
              ) : null}
            </div>
          </Section>

          <Section
            title="Manual Alert"
            subtitle="Use this when an operator wants to trigger a location-based alert immediately."
          >
            <div style={{ display: "grid", gap: 14 }}>
              <Button onClick={alertLocation.capture} disabled={alertLocation.loading || busyAction === "alert"}>
                {alertLocation.loading ? "Capturing..." : "Capture alert location"}
              </Button>
              {alertLocation.error ? <Message tone="danger">{alertLocation.error}</Message> : null}
              <LocationCard location={alertLocation.location} />
              <Button variant="secondary" onClick={createManualAlert} disabled={!alertLocation.location || busyAction === "alert"}>
                {busyAction === "alert" ? "Creating..." : "Create nearby alert"}
              </Button>
              {alertError ? <Message tone="danger">{alertError}</Message> : null}
              {alertResult ? (
                <ResultPanel title="Alert created" tone="good">
                  <DetailGrid
                    items={[
                      { label: "Event", value: alertResult.event_type || "manual_report" },
                      { label: "Primary area", value: alertResult.main_area || "Unknown area" },
                      { label: "Nearby areas", value: (alertResult.nearby_areas || []).join(", ") || "Not available" },
                      { label: "Active for", value: `${alertResult.expires_in_minutes || 0} minutes` },
                    ]}
                  />
                </ResultPanel>
              ) : null}
            </div>
          </Section>
        </div>
      ) : null}

      {activePage === "scan" ? (
        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1.05fr 0.95fr" }}>
          <Section
            title="Video Scan"
            subtitle="Analyze a clip using the detection engine. If needed, the result can immediately create a location-based alert."
          >
            <div style={{ display: "grid", gap: 14 }}>
              <Field label="Video file">
                <Input type="file" accept="video/*" onChange={(event) => setScanFile(event.target.files?.[0] || null)} />
              </Field>
              <Field label="Optional location for alert creation">
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button variant="secondary" onClick={scanLocation.capture} disabled={scanLocation.loading || busyAction === "scan"}>
                    {scanLocation.loading ? "Capturing..." : "Capture location"}
                  </Button>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#355147", fontSize: 14 }}>
                    <input type="checkbox" checked={scanCreateAlert} onChange={(event) => setScanCreateAlert(event.target.checked)} />
                    Create an alert if the scan finds a threat
                  </label>
                </div>
              </Field>
              <LocationCard location={scanLocation.location} />
              {scanLocation.error ? <Message tone="danger">{scanLocation.error}</Message> : null}
              <Button onClick={runVideoScan} disabled={busyAction === "scan"}>
                {busyAction === "scan" ? "Analyzing..." : "Run video scan"}
              </Button>
              {scanError ? <Message tone="danger">{scanError}</Message> : null}
            </div>
          </Section>

          <Section
            title="Scan summary"
            subtitle="Results are shown in a readable case-review layout instead of raw output."
          >
            {scanResult ? (
              <ResultPanel title="Latest scan" tone="good">
                <DetailGrid
                  items={[
                    { label: "Decision", value: scanResult.predicted_class || "Not available" },
                    { label: "Frames reviewed", value: String(scanResult.frames_used || 0) },
                    { label: "Source file", value: scanResult.video_name || "Unknown" },
                    { label: "Alert status", value: scanResult.alert_created ? "Created" : "Not created" },
                  ]}
                />
                <ProbabilityBars probabilities={scanResult.probabilities} />
                {scanResult.alert_details ? (
                  <Message tone="good">
                    Alert created for {scanResult.alert_details.main_area || "the detected area"} with nearby coverage in {(scanResult.alert_details.nearby_areas || []).join(", ")}.
                  </Message>
                ) : null}
                {scanResult.alert_message ? <Message>{scanResult.alert_message}</Message> : null}
              </ResultPanel>
            ) : (
              <Message>
                Select a video and run the scan. The decision, confidence bands, and any created alert will appear here in a review-friendly layout.
              </Message>
            )}
          </Section>
        </div>
      ) : null}

      {activePage === "police" ? (
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1fr 1fr" }}>
            <Section
              title="Police Access Setup"
              subtitle="Create the first police admin account with the super-admin key. The generated access key is then used for police-only sections."
            >
              <div style={{ display: "grid", gap: 12 }}>
                <Field label="Super-admin key">
                  <Input type="password" value={adminSetup.superAdminKey} onChange={(event) => setAdminSetup((current) => ({ ...current, superAdminKey: event.target.value }))} />
                </Field>
                <Field label="Officer name">
                  <Input value={adminSetup.name} onChange={(event) => setAdminSetup((current) => ({ ...current, name: event.target.value }))} />
                </Field>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                  <Field label="Email">
                    <Input value={adminSetup.email} onChange={(event) => setAdminSetup((current) => ({ ...current, email: event.target.value }))} />
                  </Field>
                  <Field label="Badge number">
                    <Input value={adminSetup.badgeNumber} onChange={(event) => setAdminSetup((current) => ({ ...current, badgeNumber: event.target.value }))} />
                  </Field>
                </div>
                <Field label="Station">
                  <Input value={adminSetup.station} onChange={(event) => setAdminSetup((current) => ({ ...current, station: event.target.value }))} />
                </Field>
                <Button onClick={createAdmin} disabled={busyAction === "admin-create"}>
                  {busyAction === "admin-create" ? "Creating access..." : "Create police admin"}
                </Button>
              </div>
              {adminSetupError ? <Message tone="danger">{adminSetupError}</Message> : null}
              {adminSetupResult ? (
                <ResultPanel title="Police access created" tone="good">
                  <DetailGrid
                    items={[
                      { label: "Officer", value: adminSetupResult.admin?.name || "Not available" },
                      { label: "Email", value: adminSetupResult.admin?.email || "Not available" },
                      { label: "Station", value: adminSetupResult.admin?.station || "Not available" },
                      { label: "Access key", value: adminSetupResult.admin?.admin_key || "Not available" },
                    ]}
                  />
                </ResultPanel>
              ) : null}
            </Section>

            <Section
              title="Police Sign-In"
              subtitle="Use police credentials to open case review, private evidence upload, and signed evidence access."
              action={adminSession ? <Chip tone="good">Signed in</Chip> : <Chip tone="warn">Locked</Chip>}
            >
              <div style={{ display: "grid", gap: 12 }}>
                <Field label="Police email">
                  <Input value={adminLogin.email} onChange={(event) => setAdminLogin((current) => ({ ...current, email: event.target.value }))} />
                </Field>
                <Field label="Access key">
                  <Input type="password" value={adminLogin.adminKey} onChange={(event) => setAdminLogin((current) => ({ ...current, adminKey: event.target.value }))} />
                </Field>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button onClick={loginAdmin} disabled={busyAction === "admin-login"}>
                    {busyAction === "admin-login" ? "Signing in..." : "Sign in"}
                  </Button>
                  <Button variant="secondary" onClick={() => refreshReports()} disabled={!adminSession}>
                    Refresh cases
                  </Button>
                </div>
              </div>
              {adminLoginError ? <Message tone="danger">{adminLoginError}</Message> : null}
              {adminSession ? (
                <ResultPanel title="Current police session" tone="good">
                  <DetailGrid
                    items={[
                      { label: "Officer", value: adminSession.profile?.name || "Not available" },
                      { label: "Email", value: adminSession.email },
                      { label: "Station", value: adminSession.profile?.station || "Not available" },
                      { label: "Role", value: adminSession.profile?.role || "police_admin" },
                    ]}
                  />
                </ResultPanel>
              ) : null}
            </Section>
          </div>

          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1.05fr 0.95fr" }}>
            <Section
              title="Case Entry"
              subtitle="Create structured police-side case records. These sit alongside public emergency uploads inside the same review list."
            >
              <div style={{ display: "grid", gap: 12 }}>
                <Field label="Title">
                  <Input value={reportForm.title} onChange={(event) => setReportForm((current) => ({ ...current, title: event.target.value }))} />
                </Field>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                  <Field label="Incident type">
                    <Input value={reportForm.incident_type} onChange={(event) => setReportForm((current) => ({ ...current, incident_type: event.target.value }))} />
                  </Field>
                  <Field label="Area">
                    <Input value={reportForm.area} onChange={(event) => setReportForm((current) => ({ ...current, area: event.target.value }))} />
                  </Field>
                </div>
                <Field label="Description">
                  <TextArea value={reportForm.description} onChange={(event) => setReportForm((current) => ({ ...current, description: event.target.value }))} />
                </Field>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(4, 1fr)" }}>
                  <Field label="Priority">
                    <Input value={reportForm.priority} onChange={(event) => setReportForm((current) => ({ ...current, priority: event.target.value }))} />
                  </Field>
                  <Field label="Status">
                    <Input value={reportForm.status} onChange={(event) => setReportForm((current) => ({ ...current, status: event.target.value }))} />
                  </Field>
                  <Field label="Latitude">
                    <Input value={reportForm.latitude} onChange={(event) => setReportForm((current) => ({ ...current, latitude: event.target.value }))} />
                  </Field>
                  <Field label="Longitude">
                    <Input value={reportForm.longitude} onChange={(event) => setReportForm((current) => ({ ...current, longitude: event.target.value }))} />
                  </Field>
                </div>
                <Field label="Officer name">
                  <Input value={reportForm.officer_name} onChange={(event) => setReportForm((current) => ({ ...current, officer_name: event.target.value }))} />
                </Field>
                <Button onClick={createPoliceReport} disabled={busyAction === "report-create"}>
                  {busyAction === "report-create" ? "Saving case..." : "Create case"}
                </Button>
              </div>
              {reportCreateError ? <Message tone="danger">{reportCreateError}</Message> : null}
              {reportCreateResult ? (
                <ResultPanel title="Case created" tone="good">
                  <DetailGrid
                    items={[
                      { label: "Case ID", value: reportCreateResult.report?.id || "Not available" },
                      { label: "Title", value: reportCreateResult.report?.title || "Not available" },
                      { label: "Area", value: reportCreateResult.report?.area || "Not available" },
                      { label: "Status", value: reportCreateResult.report?.status || "Not available" },
                    ]}
                  />
                </ResultPanel>
              ) : null}
            </Section>

            <Section
              title="Evidence Access"
              subtitle="Select a case, upload private evidence, then generate a short-lived viewing link for authorized police access."
            >
              <div style={{ display: "grid", gap: 12 }}>
                <Field label="Choose case">
                  <select
                    value={selectedReportId}
                    onChange={(event) => setSelectedReportId(event.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      borderRadius: 14,
                      border: "1px solid #cedbd4",
                      background: "#fcfffd",
                      padding: "12px 14px",
                      fontSize: 14,
                      color: "#11261e",
                    }}
                  >
                    <option value="">Select a case</option>
                    {reports.map((report) => (
                      <option key={report.id} value={report.id}>
                        {report.title} · {report.report_source}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Evidence video">
                  <Input type="file" accept="video/*" onChange={(event) => setAdminEvidenceFile(event.target.files?.[0] || null)} />
                </Field>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button onClick={uploadEvidence} disabled={busyAction === "evidence-upload"}>
                    {busyAction === "evidence-upload" ? "Uploading..." : "Upload evidence"}
                  </Button>
                  <Button variant="secondary" onClick={requestEvidenceLink} disabled={busyAction === "evidence-link"}>
                    {busyAction === "evidence-link" ? "Generating..." : "Open signed access"}
                  </Button>
                </div>
              </div>

              {selectedReport ? (
                <ResultPanel title="Selected case">
                  <DetailGrid
                    items={[
                      { label: "Title", value: selectedReport.title },
                      { label: "Area", value: selectedReport.area },
                      { label: "Source", value: selectedReport.report_source },
                      { label: "Evidence", value: selectedReport.evidence_path || "Not uploaded yet" },
                    ]}
                  />
                </ResultPanel>
              ) : null}

              {evidenceError ? <Message tone="danger">{evidenceError}</Message> : null}
              {evidenceLink ? (
                <ResultPanel title="Secure access ready" tone="good">
                  <DetailGrid
                    items={[
                      { label: "Case ID", value: evidenceLink.report_id },
                      { label: "Storage path", value: evidenceLink.evidence_path },
                      { label: "Access window", value: `${evidenceLink.expires_in_seconds} seconds` },
                    ]}
                  />
                  <a
                    href={evidenceLink.signed_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      width: "fit-content",
                      textDecoration: "none",
                      borderRadius: 14,
                      padding: "12px 16px",
                      background: "#0d7a5f",
                      color: "#ffffff",
                      fontWeight: 700,
                    }}
                  >
                    Open evidence video
                  </a>
                </ResultPanel>
              ) : null}
            </Section>
          </div>

          <Section
            title="Case Review"
            subtitle="A single review surface for both public emergency submissions and police-entered cases. Evidence remains private until a signed access link is generated."
            action={<Button variant="secondary" onClick={() => refreshReports()} disabled={!adminSession || busyAction === "reports"}>{busyAction === "reports" ? "Refreshing..." : "Refresh list"}</Button>}
          >
            {reportsError ? <Message tone="danger">{reportsError}</Message> : null}
            <ReportsTable reports={reports} onSelect={setSelectedReportId} selectedId={selectedReportId} />
          </Section>
        </div>
      ) : null}
    </AppShell>
  );
}
