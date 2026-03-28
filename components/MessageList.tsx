import { ChatMessage } from '@/types/chat';

type Props = {
  messages: ChatMessage[];
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
};

export function MessageList({ messages, onDelete, isAdmin = false }: Props) {
  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <div key={message.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/10">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-white">{message.visibleName}</div>
              <div className="text-xs text-zinc-400">{new Date(message.createdAt).toLocaleString()}</div>
            </div>
            {isAdmin && !message.isDeleted && onDelete ? (
              <button onClick={() => onDelete(message.id)} className="rounded-lg bg-red-600 px-3 py-1 text-sm font-medium hover:bg-red-500">
                Apagar
              </button>
            ) : null}
          </div>

          {message.isDeleted ? (
            <p className="italic text-zinc-500">Mensagem removida pela moderação.</p>
          ) : (
            <>
              {message.content ? <p className="whitespace-pre-wrap text-zinc-100">{message.content}</p> : null}
              <div className="mt-3 space-y-3">
                {message.attachments.map((file) => {
                  if (file.mimeType.startsWith('image/')) {
                    return <img key={file.id} src={file.url} alt={file.fileName} className="max-h-96 rounded-xl border border-zinc-800" />;
                  }
                  if (file.mimeType.startsWith('video/')) {
                    return <video key={file.id} src={file.url} controls className="max-h-96 rounded-xl border border-zinc-800" />;
                  }
                  return (
                    <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-zinc-800 p-3 text-sm text-sky-300 hover:bg-zinc-800">
                      {file.fileName}
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
