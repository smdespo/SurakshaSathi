// src/components/ui/Card.jsx
export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl shadow-card p-5 ${className}`}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// src/components/ui/StepBadge.jsx
export function StepBadge({ number, done = false }) {
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
        ${done ? "bg-brand-teal text-white" : "bg-gray-100 text-gray-400"}`}
    >
      {done ? (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : number}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// src/components/ui/ProgressBar.jsx
export function ProgressBar({ value = 0, className = "" }) {
  return (
    <div className={`w-full bg-gray-100 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="h-full bg-brand-teal rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// src/components/ui/StatusBadge.jsx
const STATUS_STYLES = {
  open:        "bg-blue-50   text-blue-700",
  submitted:   "bg-blue-50   text-blue-700",
  "in-progress":"bg-amber-50  text-amber-700",
  reviewing:   "bg-amber-50  text-amber-700",
  closed:      "bg-gray-100  text-gray-500",
  resolved:    "bg-green-50  text-green-700",
  high:        "bg-red-50    text-red-600",
  medium:      "bg-amber-50  text-amber-700",
  low:         "bg-gray-100  text-gray-500",
};

export function StatusBadge({ status }) {
  const s = status?.toLowerCase() || "";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[s] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// src/components/ui/SectionLabel.jsx
export function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// src/components/ui/AlertBanner.jsx
export function AlertBanner({ type = "error", message, onClose }) {
  if (!message) return null;
  const styles = {
    error:   "bg-red-50 border-red-200 text-red-700",
    success: "bg-green-50 border-green-200 text-green-700",
    info:    "bg-blue-50 border-blue-200 text-blue-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
  };
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${styles[type]}`}>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 mt-0.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}