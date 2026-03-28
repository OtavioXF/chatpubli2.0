import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Composer } from '@/components/Composer';
import { MessageList } from '@/components/MessageList';
import { ChatMessage } from '@/types/chat';

let socket: Socket | null = null;

export default function GroupPage() {
  const router = useRouter();
  const { id } = router.query;
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [name, setName] = useState('Grupo');
  const [locked, setLocked] = useState(false);

  async function load() {
    if (!id) return;
    const res = await fetch(`/api/groups/${id}`);
    const data = await res.json();
    if (data.room) {
      setMessages(data.messages || []);
      setName(data.room.name);
      setLocked(Boolean(data.lock));
    }
  }

  async function verifyPassword() {
    const res = await fetch(`/api/groups/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (data.ok) {
      setAuthorized(true);
      await load();
    }
  }

  async function send(payload: { content: string }) {
    await fetch(`/api/groups/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: payload.content })
    });
    await load();
  }

  useEffect(() => {
    if (!authorized || !id) return;
    socket = io();
    socket.onAny((event) => {
      if (event.includes(String(id))) load();
    });
    return () => socket?.disconnect();
  }, [authorized, id]);

  if (!authorized) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h1 className="text-2xl font-bold">Entrar no grupo</h1>
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite a senha" className="mt-4 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3" />
          <button onClick={verifyPassword} className="mt-4 rounded-xl bg-sky-500 px-4 py-3 font-semibold text-black">Entrar</button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <a href="/" className="text-sm text-sky-300">← Voltar</a>
      <h1 className="mt-3 text-3xl font-bold">{name}</h1>
      {locked ? <div className="mt-4 rounded-xl border border-yellow-600/40 bg-yellow-950/30 p-4">Grupo bloqueado temporariamente.</div> : null}
      <div className="mt-6 space-y-6">
        <MessageList messages={messages} />
        <Composer onSend={send} disabled={locked} />
      </div>
    </main>
  );
}
