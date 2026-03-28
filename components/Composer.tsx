import { FormEvent, useState } from 'react';

type Props = {
  onSend: (payload: { content: string; file?: File | null }) => Promise<void>;
  disabled?: boolean;
};

export function Composer({ onSend, disabled = false }: Props) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim() && !file) return;
    setSending(true);
    try {
      await onSend({ content, file });
      setContent('');
      setFile(null);
      const input = document.getElementById('file-input') as HTMLInputElement | null;
      if (input) input.value = '';
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={disabled || sending}
        placeholder={disabled ? 'Chat bloqueado temporariamente' : 'Digite sua mensagem...'}
        className="min-h-28 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none"
      />
      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input id="file-input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={disabled || sending} className="text-sm text-zinc-300" />
        <button disabled={disabled || sending} className="rounded-xl bg-sky-500 px-4 py-2 font-semibold text-black hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50">
          {sending ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </form>
  );
}
