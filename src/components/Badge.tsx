type Status = "AGENDADA" | "REALIZADA" | "CANCELADA" | "SOLICITADO" | "AGENDADO" | "REALIZADO";

const MAP: Record<Status, string> = {
  AGENDADA: "bg-blue-50 text-blue-700 border-blue-100",
  REALIZADA: "bg-emerald-50 text-emerald-700 border-emerald-100",
  CANCELADA: "bg-rose-50 text-rose-600 border-rose-100",
  SOLICITADO: "bg-amber-50 text-amber-700 border-amber-100",
  AGENDADO: "bg-blue-50 text-blue-700 border-blue-100",
  REALIZADO: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export default function Badge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${MAP[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}
