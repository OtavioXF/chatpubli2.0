import { Server as IOServer } from 'socket.io';

let io: IOServer | null = null;

export function setIO(server: IOServer) {
  io = server;
}

export function getIO() {
  return io;
}
