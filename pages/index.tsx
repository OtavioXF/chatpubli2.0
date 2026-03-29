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

  useEffect(() => {
    const savedName = window.localStorage.getItem('chatpublico_name');
    if (savedName) {
      setDisplayName(savedName);
      setRememberName(true);
    }
  }, []);

  async function startSession() {
    const trimmedName = displayName.trim();
    if (!trimmedName) return;

    const res = await fetch('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: trimmedName, rememberName })
    });

    const data = await res.json();

    if (data.session) {
      setSession(data.session);

      if (rememberName) {
        window.localStorage.setItem('chatpublico_name', trimmedName);
      } else {
        window.localStorage.removeItem('chatpublico_name');
      }
    }
  }

  function changeName() {
    setSession(null);
    setDisplayName('');
    setRememberName(false);
  }

  function forgetRememberedName() {
    window.localStorage.removeItem('chatpublico_name');
    setDisplayName('');
    setRememberName(false);
    setSession(null);
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

    socket.onAny((event) => {
      if (
        event.includes('chatpublico') ||
        event.includes('message') ||
        event.includes('locked') ||
        event.includes('unlocked') ||
        event.includes('cleared')
      ) {
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

    await fetch('/api/public/messages', {
      method: 'POST',
      body: form
    });

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
    await fetch('/api/admin/clear-room', {
      method: 'POST'
    });

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
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Chatpublico / Grupos</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Chat público anônimo e salas privadas com senha.
            </p>
          </div>

          <div className="flex gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
            <button
              onClick={() => setTab('publico')}
              className={`rounded-xl px-4 py-2 ${
                tab === 'publico' ? 'bg-sky-500 text-black' : 'text-zinc-300'
              }`}
            >
              Chatpublico
            </button>
            <button
              onClick={() => setTab('grupos')}
              className={`rounded-xl px-4 py-2 ${
                tab === 'grupos' ? 'bg-sky-500 text-black' : 'text-zinc-300'
              }`}
            >
              Grupos
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-xl font-semibold">Sua sessão</h2>

          {!session ? (
            <div className="mt-4 space-y-4">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Escolha um nome"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3"
              />

              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={rememberName}
                  onChange={(e) => setRememberName(e.target.checked)}
                />
                Lembrar nome
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={startSession}
                  className="rounded-xl bg-sky-500 px-4 py-3 font-semibold text-black"
                >
                  Entrar
                </button>

                <button
                  onClick={forgetRememberedName}
                  className="rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-200"
                >
                  Limpar nome salvo
                </button>
              </div>

              <p className="text-sm text-zinc-400">
                Quem usar o nome secreto definido no backend entra com moderação oculta,
                sem aparecer como admin para o resto do chat.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-zinc-300">
                Nome atual: <span className="font-semibold text-white">{session.displayName}</span>
              </p>

              <p className="text-sm text-zinc-300">
                Status:{' '}
                <span className="font-semibold text-white">
                  {session.isHiddenAdmin ? 'moderador oculto' : 'usuário comum'}
                </span>
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={changeName}
                  className="rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-200"
                >
                  Trocar nome
                </button>

                <button
                  onClick={forgetRememberedName}
                  className="rounded-xl border border-red-700 px-4 py-3 text-sm text-red-200"
                >
                  Esquecer nome salvo
                </button>
              </div>
            </div>
          )}
        </div>

        {tab === 'publico' ? (
          <section className="mt-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Chat público anônimo</h2>
                  <p className="text-sm text-zinc-400">
                    Todos veem as mensagens em tempo real.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setOrder('desc')}
                    className={`rounded-xl px-4 py-2 ${
                      order === 'desc' ? 'bg-zinc-100 text-black' : 'bg-zinc-800 text-white'
                    }`}
                  >
                    Recentes primeiro
                  </button>
                  <button
                    onClick={() => setOrder('asc')}
                    className={`rounded-xl px-4 py-2 ${
                      order === 'asc' ? 'bg-zinc-100 text-black' : 'bg-zinc-800 text-white'
                    }`}
                  >
                    Recentes no final
                  </button>
                </div>
              </div>

              {locked ? (
                <div className="rounded-xl border border-yellow-600/40 bg-yellow-950/30 p-4">
                  Chat bloqueado temporariamente.
                </div>
              ) : null}

              <MessageList messages={sortedMessages} />
              <Composer onSend={sendPublicMessage} disabled={locked || !session} />

              {session?.isHiddenAdmin ? (
                <AdminPanel
                  messages={sortedMessages}
                  onDeleteMessage={deleteMessage}
                  onClearRoom={clearRoom}
                  onLockRoom={lockRoom}
                  onUnlockRoom={unlockRoom}
                />
              ) : null}
            </div>
          </section>
        ) : (
          <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <h2 className="text-2xl font-bold">Criar grupo</h2>

              <div className="mt-4 space-y-3">
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Nome do grupo"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                />
                <input
                  value={groupPassword}
                  onChange={(e) => setGroupPassword(e.target.value)}
                  placeholder="Senha do grupo"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                />
                <button
                  onClick={createGroup}
                  className="w-full rounded-xl bg-sky-500 px-4 py-3 font-semibold text-black"
                >
                  Criar grupo
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <h2 className="text-2xl font-bold">Grupos existentes</h2>

              <div className="mt-4 space-y-3">
                {groups.map((group) => (
                  <a
                    key={group.id}
                    href={`/group/${group.id}`}
                    className="block rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-sky-500"
                  >
                    <div className="font-semibold">{group.name}</div>
                    <div className="mt-1 text-sm text-zinc-400">Sala privada com senha</div>
                  </a>
                ))}

                {!groups.length ? (
                  <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
                    Nenhum grupo criado ainda.
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
