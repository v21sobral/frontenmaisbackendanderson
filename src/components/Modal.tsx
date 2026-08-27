interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, onClose, children }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl md:rounded-3xl max-h-[90dvh] md:max-h-[85vh] w-full md:max-w-lg flex flex-col">
        {/* Handle bar — mobile only */}
        <div className="w-10 h-1 rounded-full bg-slate-200 absolute top-2.5 left-1/2 -translate-x-1/2 md:hidden" />
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-lg"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
