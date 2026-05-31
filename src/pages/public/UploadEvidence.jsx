import { useState, useRef, useCallback } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, StepBadge, ProgressBar, AlertBanner } from "../../components/ui/index";
import { Button } from "../../components/ui/Button";
import { useLocation } from "../../hooks/useLocation";
import { useChunkedUpload } from "../../hooks/useChunkedUpload";

const ACCEPTED = ["video/mp4", "video/quicktime", "video/avi", "video/x-msvideo", "video/x-matroska"];
const fmtSize  = (b) =>
  b >= 1073741824 ? (b / 1073741824).toFixed(2) + " GB"
  : b >= 1048576 ? (b / 1048576).toFixed(1) + " MB"
  : (b / 1024).toFixed(0) + " KB";

export default function UploadEvidence() {
  const { location, loading: locLoading, error: locError, fetchLocation } = useLocation();
  const { upload, progress, uploading, error: uploadError, reset: resetUpload } = useChunkedUpload();

  const [videoFile,    setVideoFile]    = useState(null);
  const [dragging,     setDragging]     = useState(false);
  const [fileError,    setFileError]    = useState(null);
  const [result,       setResult]       = useState(null);
  const [camId,        setCamId]        = useState("");
  const [incidentType, setIncidentType] = useState("");
  const fileInputRef = useRef(null);

  const acceptFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setFileError("Please select a valid video file (MP4, MOV, AVI, MKV).");
      return;
    }
    setFileError(null);
    setResult(null);
    resetUpload();
    setVideoFile(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files[0]);
  }, []);

  const removeFile = () => {
    setVideoFile(null);
    setFileError(null);
    setResult(null);
    resetUpload();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!videoFile || !location) return;
    try {
      const res = await upload(videoFile, location.latitude, location.longitude);
      setResult(res);
      setVideoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (_) {
      // error shown via hook
    }
  };

  const totalChunks = videoFile ? Math.ceil(videoFile.size / (5 * 1024 * 1024)) : 0;
  const canSubmit = !!videoFile && !!location && !uploading;

  return (
    <AppShell title="Report Crime">
      <div className="max-w-lg mx-auto space-y-4">

        <div className="mb-1">
          <h2 className="text-base font-bold text-gray-800">Report an Incident</h2>
          <p className="text-xs text-gray-400 mt-0.5">Upload CCTV footage with your location for AI crime detection</p>
        </div>

        {/* ── Step 1: Location ── */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <StepBadge number="1" done={!!location} />
            <div>
              <p className="text-sm font-bold text-gray-800">Verify Location</p>
              <p className="text-xs text-gray-400">GPS is required to alert nearby users</p>
            </div>
          </div>

          <Button
            onClick={fetchLocation}
            loading={locLoading}
            variant={location ? "outline" : "primary"}
            className="w-full"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {locLoading ? "Locking GPS..." : location ? "Location Attached ✓" : "Latch My Location"}
          </Button>

          {locError && <AlertBanner type="error" message={locError} className="mt-3" />}

          {location && (
            <div className="mt-3 bg-brand-lighter border border-brand-teal/20 rounded-xl overflow-hidden">
              {[
                ["Latitude",  location.latitude.toFixed(5)],
                ["Longitude", location.longitude.toFixed(5)],
                ["Accuracy",  location.accuracy.toFixed(1) + "m"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center px-4 py-2.5 border-b border-brand-teal/10 last:border-0">
                  <span className="text-xs text-gray-500 font-mono">{k}</span>
                  <span className="text-xs font-bold text-brand-teal font-mono">{v}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Step 2: Camera info ── */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <StepBadge number="2" done={!!camId} />
            <div>
              <p className="text-sm font-bold text-gray-800">Camera Details</p>
              <p className="text-xs text-gray-400">Optional — helps police trace the source</p>
            </div>
          </div>

          <div className="space-y-3">
            <input
              value={camId}
              onChange={(e) => setCamId(e.target.value)}
              placeholder="Camera ID (e.g. CAM-042 · Baner Junction)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-brand-teal transition-colors placeholder:text-gray-300"
            />
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-teal transition-colors bg-white appearance-none"
              style={{ color: incidentType ? "#1f2937" : "#d1d5db" }}
            >
              <option value="">Incident type — AI will auto-detect</option>
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

        {/* ── Step 3: Video upload ── */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <StepBadge number="3" done={!!result} />
            <div>
              <p className="text-sm font-bold text-gray-800">Upload Footage</p>
              <p className="text-xs text-gray-400">Any size · MP4, AVI, MOV, MKV</p>
            </div>
          </div>

          {!videoFile ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150
                ${dragging ? "border-brand-teal bg-brand-light" : "border-gray-200 bg-gray-50 hover:border-brand-teal/50"}`}
            >
              <input
                type="file"
                accept="video/*"
                ref={fileInputRef}
                onChange={(e) => acceptFile(e.target.files[0])}
                className="hidden"
              />
              <div className={`flex justify-center mb-3 ${dragging ? "text-brand-teal" : "text-gray-300"}`}>
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Tap to select CCTV footage</p>
              <p className="text-xs text-gray-400 mb-4">or drag and drop · any file size accepted</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["MP4", "AVI", "MOV", "MKV"].map((f) => (
                  <span key={f} className="px-2.5 py-0.5 bg-white border border-gray-200 rounded-md text-xs text-gray-500 font-medium">{f}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-brand-light flex items-center justify-center text-brand-teal flex-shrink-0">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 002-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{videoFile.name}</p>
                    <p className="text-xs text-gray-400">{fmtSize(videoFile.size)} · {totalChunks} chunk{totalChunks > 1 ? "s" : ""}</p>
                  </div>
                </div>
                {!uploading && (
                  <button onClick={removeFile} className="p-1.5 text-gray-400 hover:text-gray-600">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {uploading && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Uploading chunk {Math.min(Math.ceil(progress / 100 * totalChunks), totalChunks)} of {totalChunks}</span>
                    <span className="font-bold text-brand-teal">{progress}%</span>
                  </div>
                  <ProgressBar value={progress} />
                  <p className="text-[10px] text-gray-400">Do not close the app during upload</p>
                </div>
              )}
            </div>
          )}

          {(fileError || uploadError) && (
            <AlertBanner type="error" message={fileError || uploadError} className="mt-3" />
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={uploading}
            className="w-full mt-4"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {uploading ? `Transmitting ${progress}%...` : "Submit to Detection"}
          </Button>

          <p className="text-center text-[10px] text-gray-300 mt-2">
            {location
              ? `GPS: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
              : "⚠ Complete Step 1 — location required for area alerts"}
          </p>
        </Card>

        {/* ── Result ── */}
        {result && (
          <Card className="!border-green-200 !bg-green-50">
            <div className="flex items-center gap-2 text-green-700 font-bold text-sm mb-4">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Analysed successfully
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                ["Prediction",    result.report?.incident_type || result.predicted_class],
                ["Area",          result.area || result.alert_details?.main_area],
                ["Alert created", result.report ? "Yes" : "No"],
                ["Status",        result.report?.status || "submitted"],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="bg-white rounded-lg p-3 border border-green-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">{k}</p>
                  <p className="text-sm font-semibold text-gray-800 capitalize">{String(v)}</p>
                </div>
              ))}
            </div>

            {result.alert_details?.nearby_areas && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Nearby Areas Alerted</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.alert_details.nearby_areas.slice(0, 6).map((area) => (
                    <span key={area} className="px-2.5 py-1 bg-brand-light text-brand-teal rounded-full text-xs font-semibold">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

      </div>
    </AppShell>
  );
}