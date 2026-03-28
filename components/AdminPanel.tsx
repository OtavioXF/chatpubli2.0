type Props = {
  onClear: () => Promise<void>;
  onLock: (minutes: number) => Promise<void>;
  onUnlock: () => Promise<void>;
};

export function AdminPanel({ onClear, onLock, onUnlock }: Props) {
  return (
    <div className="rounded-2xl border border-amber-700/40 bg-amber-950/30 p-4">
      <h3 className="text-lg font-semibold text-amber-300">Painel oculto</h3>
      <p className="mt-1 text-sm text-zinc-300">Apenas a sessão moderadora vê esta área.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={onClear} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500">Limpar chat</button>
        <button onClick={() => onLock(15)} className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400">Bloquear 15 min</button>
        <button onClick={() => onLock(60)} className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400">Bloquear 1 hora</button>
        <button onClick={onUnlock} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400">Desbloquear</button>
      </div>
    </div>
  );
}
