import { useState } from 'react';
import { ChatMessage } from '@/types/chat';

type Props = {
  messages: ChatMessage[];
  onDeleteMessage: (id: string) => Promise<void>;
  onClearRoom: () => Promise<void>;
  onLockRoom: (minutes: number) => Promise<void>;
  onUnlockRoom: () => Promise<void>;
};

export function AdminPanel({
  messages,
  onDeleteMessage,
  onClearRoom,
  onLockRoom,
  onUnlockRoom
}: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    try {
      setBusyId(id);
      await onDeleteMessage(id);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-red-900/40 bg-red-950/20 p-4">
      <h3 className="text-lg font-bold text-red-200">Painel oculto</h3>
      <p className="mt-1 text-sm text-zinc-300">
        Apenas a sessão moderadora vê esta área.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={onClearRoom}
          className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-black hover:bg-red-400"
        >
          Limpar chat
        </button>

        <button
          onClick={() => onLockRoom(15)}
          className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400"
        >
          Bloquear 15 min
        </button>

        <button
          onClick={() => onLockRoom(60)}
          className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400"
        >
          Bloquear 1 hora
        </button>

        <button
          onClick={onUnlockRoom}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
        >
          Desbloquear
        </button>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
          Excluir mensagens
        </h4>

        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
          {messages.length ? (
            messages.map((message) => (
              <div
                key={message.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">
                    {message.visibleName || 'Anônimo'}
                  </div>
                  <div className="mt-1 break-words text-sm text-zinc-300">
                    {message.content || '(sem texto)'}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(message.id)}
                  disabled={busyId === message.id}
                  className="shrink-0 rounded-lg border border-red-700 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-900/30 disabled:opacity-50"
                >
                  {busyId === message.id ? 'Apagando...' : 'Apagar'}
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-sm text-zinc-500">
              Nenhuma mensagem para moderar.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
