// src/components/ui/Button.jsx
export function Button({
  children,
  onClick,
  disabled = false,
  variant = "primary",  // primary | ghost | danger | outline
  size = "md",          // sm | md | lg
  type = "button",
  className = "",
  loading = false,
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed select-none";

  const sizes = {
    sm: "px-4 py-2 text-sm min-h-[38px]",
    md: "px-5 py-3 text-sm min-h-[48px]",
    lg: "px-6 py-4 text-base min-h-[54px]",
  };

  const variants = {
    primary:
      "bg-brand-teal text-white hover:bg-teal-600 disabled:bg-gray-100 disabled:text-gray-400",
    ghost:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50",
    danger:
      "bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50",
    outline:
      "border border-brand-teal text-brand-teal bg-white hover:bg-brand-light disabled:opacity-50",
    navy:
      "bg-brand-navy text-white hover:bg-blue-900 disabled:opacity-50",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      {children}
    </button>
  );
}