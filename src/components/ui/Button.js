export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer select-none';

  const variants = {
    primary:   'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm',
    secondary: 'bg-slate-700 hover:bg-slate-800 text-white focus:ring-slate-500 shadow-sm',
    success:   'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-sm',
    danger:    'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm',
    outline:   'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 focus:ring-blue-500 shadow-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2',
  };

  return (
    <button
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
