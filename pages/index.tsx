import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Composer } from '@/components/Composer';
import { MessageList } from '@/components/MessageList';
import { AdminPanel } from '@/components/AdminPanel';
import { ChatMessage, RoomSummary } from '@/types/chat';

type SessionPayload = {
  id: string;
  displayName: string;
  isHiddenAdmin: boolean;
};

let socket: Socket | null = null;

export default function HomePage() {
  const [tab, setTab] = useState<'publico' | 'grupos'>('publico');
  const [displayName, setDisplayName] = useState('');
  const [rememberName, setRememberName] = useState(true);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [groups, setGroups] = useState<RoomSummary[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [locked, setLocked] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupPassword, setGroupPassword] = useState('');

  async function startSession() {
    const res = await fetch('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, rememberName })
    });
    const data = await res.json();
    if (data.session) setSession(data.session);
  }

  async function loadPublicMessages() {
    const res = await fetch(`/api/public/messages?order=${order}`);
    const data = await res.json();
    setMessages(data.messages || []);
    setLocked(Boolean(data.lock));
  }

  async function loadGroups() {
    const res = await fetch('/api/groups');
    const data = await res.json();
    setGroups(data.groups || []);
  }

  useEffect(() => {
    loadPublicMessages();
    loadGroups();
  }, [order]);

  useEffect(() => {
    socket = io();
    socket.onAny((event, payload) => {
      if (event.includes('chatpublico') || event.includes('message') || event.includes('locked') || event.includes('unlocked') || event.includes('cleared')) {
        loadPublicMessages();
      }
    });
    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, []);

  async function sendPublicMessage(payload: { content: string; file?: File | null }) {
    const form = new FormData();
    form.append('content', payload.content);
    if (payload.file) form.append('file', payload.file);
    await fetch('/api/public/messages', { method: 'POST', body: form });
    await loadPublicMessages();
  }

  async function deleteMessage(id: string) {
    await fetch('/api/admin/delete-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await loadPublicMessages();
  }

  async function clearRoom() {
    await fetch('/api/admin/clear-room', { method: 'POST' });
    await loadPublicMessages();
  }

  async function lockRoom(minutes: number) {
    await fetch('/api/admin/lock-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes })
    });
    await loadPublicMessages();
  }

  async function unlockRoom() {
    await fetch('/api/admin/lock-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unlock' })
    });
    await loadPublicMessages();
  }

  async function createGroup() {
    await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, password: groupPassword })
    });
    setGroupName('');
    setGroupPassword('');
    await loadGroups();
  }

  const sortedMessages = useMemo(() => messages, [messages]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Chatpublico / Grupos</h1>
        <div className="flex gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-1">
          <button onClick={() => setTab('publico')} className={`rounded-xl px-4 py-2 ${tab === 'publico' ? 'bg-sky-500 text-black' : 'text-zinc-300'}`}>Chatpublico</button>
          <button onClick={() => setTab('grupos')} className={`rounded-xl px-4 py-2 ${tab === 'grupos' ? 'bg-sky-500 text-black' : 'text-zinc-300'}`}>Grupos</button>
        </div>
      </div>

      {!session ? (
        <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-semibold">Entrar anonimamente</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Escolha um nome" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3" />
              <label className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={rememberName} onChange={(e) => setRememberName(e.target.checked)} />
                Lembrar nome
              </label>
            </div>
            <button onClick={startSession} className="rounded-2xl bg-sky-500 px-5 py-3 font-semibold text-black hover:bg-sky-400">Entrar</button>
          </div>
          <p className="mt-3 text-sm text-zinc-400">Quem usar o nome secreto definido no backend entra com moderação oculta, sem aparecer como admin para o resto do chat.</p>
        </section>
      ) : null}

      {tab === 'publico' ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div>
                <div className="text-lg font-semibold">Chat público anônimo</div>
                <div className="text-sm text-zinc-400">Todos veem as mensagens em tempo real.</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setOrder('desc')} className={`rounded-xl px-4 py-2 ${order === 'desc' ? 'bg-zinc-100 text-black' : 'bg-zinc-800'}`}>Recentes primeiro</button>
                <button onClick={() => setOrder('asc')} className={`rounded-xl px-4 py-2 ${order === 'asc' ? 'bg-zinc-100 text-black' : 'bg-zinc-800'}`}>Recentes no final</button>
              </div>
            </div>

            {locked ? <div className="rounded-2xl border border-yellow-600/40 bg-yellow-950/30 p-4 text-yellow-200">Chat bloqueado temporariamente.</div> : null}
            <MessageList messages={sortedMessages} isAdmin={Boolean(session?.isHiddenAdmin)} onDelete={deleteMessage} />
            <Composer onSend={sendPublicMessage} disabled={!session || locked} />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <h3 className="text-lg font-semibold">Sua sessão</h3>
              <p className="mt-2 text-sm text-zinc-300">Nome: {session?.displayName || 'não iniciado'}</p>
              <p className="mt-1 text-sm text-zinc-400">Status: {session?.isHiddenAdmin ? 'moderador oculto' : 'usuário comum'}</p>
            </div>
            {session?.isHiddenAdmin ? <AdminPanel onClear={clearRoom} onLock={lockRoom} onUnlock={unlockRoom} /> : null}
          </aside>
        </section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="text-xl font-semibold">Criar grupo</h2>
            <div className="mt-4 space-y-3">
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Nome do grupo" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3" />
              <input value={groupPassword} onChange={(e) => setGroupPassword(e.target.value)} placeholder="Senha do grupo" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3" />
              <button onClick={createGroup} disabled={!session} className="w-full rounded-xl bg-sky-500 px-4 py-3 font-semibold text-black hover:bg-sky-400 disabled:opacity-50">Criar grupo</button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="text-xl font-semibold">Grupos existentes</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {groups.map((group) => (
                <a key={group.id} href={`/group/${group.id}`} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 hover:border-sky-400">
                  <div className="font-semibold">{group.name}</div>
                  <div className="mt-1 text-sm text-zinc-400">Sala privada com senha</div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
