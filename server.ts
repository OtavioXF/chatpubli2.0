import http from 'http';
import next from 'next';
import { Server as IOServer } from 'socket.io';
import { setIO } from './lib/socket';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = http.createServer((req, res) => handler(req, res));
  const io = new IOServer(httpServer, {
    cors: {
      origin: '*'
    }
  });

  io.on('connection', (socket) => {
    socket.on('ping-chatpublico', () => {
      socket.emit('pong-chatpublico');
    });
  });

  setIO(io);

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
