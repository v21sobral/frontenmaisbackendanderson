interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: string;
}

export default function StatCard({ label, value, sub, color = "text-emerald-600", icon }: Props) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 flex items-start gap-4">
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-xl flex-shrink-0">
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
        <p className={`text-2xl font-semibold ${color}`} style={{ fontFamily: "Outfit, sans-serif" }}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
