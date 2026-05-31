import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { Card, StatusBadge, AlertBanner } from "../../components/ui/index";
import { Button } from "../../components/ui/Button";
import { adminApi, extractError } from "../../api/client";

const STATUSES  = ["open", "submitted", "reviewing", "in-progress", "resolved", "closed"];
const PRIORITIES= ["low", "medium", "high"];

export default function ReportDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [report,     setReport]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState(null);
  const [signedUrl,  setSignedUrl]  = useState(null);
  const [linkLoading,setLinkLoading]= useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [uploadMsg,  setUploadMsg]  = useState(null);

  // Editable fields
  const [status,   setStatus]   = useState("");
  const [priority, setPriority] = useState("");
  const [officer,  setOfficer]  = useState("");

  const fileRef = useRef(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get("/admin/reports");
      const found = (res.data.reports || []).find((r) => r.id === id);
      if (!found) throw new Error("Report not found.");
      setReport(found);
      setStatus(found.status   || "open");
      setPriority(found.priority || "medium");
      setOfficer(found.officer_name || "");
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await adminApi.patch(`/admin/reports/${id}`, { status, priority, officer_name: officer || null });
      setReport(res.data.report);
      setSaveMsg("Saved successfully.");
    } catch (err) {
      setSaveMsg(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEvidenceUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await adminApi.post(`/admin/reports/${id}/evidence`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setReport(res.data.report);
      setUploadMsg("Evidence uploaded.");
    } catch (err) {
      setUploadMsg(extractError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleGetLink = async () => {
    setLinkLoading(true);
    try {
      const res = await adminApi.get(`/admin/reports/${id}/evidence-link`);
      setSignedUrl(res.data.signed_url);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLinkLoading(false);
    }
  };

  if (loading) return (
    <AppShell title="Report" isAdmin>
      <div className="max-w-lg mx-auto">
        <Card><div className="animate-pulse h-40 bg-gray-50 rounded-xl" /></Card>
      </div>
    </AppShell>
  );

  return (
    <AppShell title="Report Detail" isAdmin>
      <div className="max-w-lg mx-auto space-y-4">

        {/* Back */}
        <button onClick={() => navigate("/admin")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-teal font-medium">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to reports
        </button>

        {error && <AlertBanner type="error" message={error} />}

        {report && (
          <>
            {/* Header */}
            <Card>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-base font-bold text-gray-800 leading-tight">{report.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{report.area} · {report.incident_type}</p>
                </div>
                <StatusBadge status={report.status} />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{report.description}</p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  ["Source",    report.report_source],
                  ["Created",   new Date(report.created_at).toLocaleDateString("en-IN")],
                  ["Latitude",  report.latitude?.toFixed(4)],
                  ["Longitude", report.longitude?.toFixed(4)],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{k}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Update status */}
            <Card>
              <p className="text-sm font-bold text-gray-800 mb-3">Update Report</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-teal bg-white appearance-none">
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-teal bg-white appearance-none">
                    {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Assigned Officer</label>
                  <input value={officer} onChange={(e) => setOfficer(e.target.value)}
                    placeholder="Officer name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-teal" />
                </div>

                {saveMsg && (
                  <AlertBanner type={saveMsg.includes("uccess") ? "success" : "error"} message={saveMsg} />
                )}

                <Button onClick={handleSave} loading={saving} className="w-full">
                  Save Changes
                </Button>
              </div>
            </Card>

            {/* Evidence */}
            <Card>
              <p className="text-sm font-bold text-gray-800 mb-3">Evidence Video</p>

              {report.evidence_path ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-green-700">Evidence uploaded</p>
                      <p className="text-[10px] text-green-600 truncate">{report.evidence_file_name}</p>
                    </div>
                  </div>

                  <Button onClick={handleGetLink} loading={linkLoading} variant="outline" className="w-full">
                    Generate Secure View Link
                  </Button>

                  {signedUrl && (
                    <a
                      href={signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center py-3 px-4 bg-brand-light text-brand-teal font-semibold text-sm rounded-xl border border-brand-teal/30"
                    >
                      Open Evidence Video ↗
                    </a>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-400 mb-3">No evidence uploaded yet.</p>
                  <input type="file" accept="video/*" ref={fileRef}
                    onChange={(e) => handleEvidenceUpload(e.target.files[0])} className="hidden" />

                  {uploadMsg && (
                    <AlertBanner type={uploadMsg.includes("uploaded") ? "success" : "error"} message={uploadMsg} className="mb-3" />
                  )}

                  <Button onClick={() => fileRef.current?.click()} loading={uploading} variant="outline" className="w-full">
                    Upload Evidence Video
                  </Button>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}