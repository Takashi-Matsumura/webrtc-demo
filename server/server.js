const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const port = parseInt(process.env.PORT || '3001', 10);

// ルーム管理
const rooms = new Map();
const roomDeletionTimers = new Map();

const server = createServer();

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // ルーム作成
  socket.on('create-room', () => {
    const roomId = uuidv4().substring(0, 8);
    rooms.set(roomId, {
      id: roomId,
      participants: [],
      createdAt: new Date(),
    });
    socket.emit('room-created', roomId);
    console.log(`Room created: ${roomId}`);
  });

  // ルーム参加
  socket.on('join-room', (roomId) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('error', 'ルームが見つかりません');
      return;
    }

    if (room.participants.length >= 2) {
      socket.emit('room-full');
      return;
    }

    // 削除タイマーがあればキャンセル
    if (roomDeletionTimers.has(roomId)) {
      clearTimeout(roomDeletionTimers.get(roomId));
      roomDeletionTimers.delete(roomId);
      console.log(`Room ${roomId} deletion cancelled - user joined`);
    }

    // 既存の参加者を取得
    const existingParticipants = [...room.participants];

    room.participants.push(socket.id);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userId = socket.id;

    // 参加者に通知
    socket.emit('room-joined', {
      roomId,
      participants: existingParticipants,
    });

    // 既存の参加者に新規参加を通知
    socket.to(roomId).emit('user-joined', socket.id);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // ルーム退出
  socket.on('leave-room', (roomId) => {
    leaveRoom(socket, roomId);
  });

  // WebRTC シグナリング: Offer
  socket.on('offer', (data) => {
    const { roomId, targetUserId, offer } = data;
    io.to(targetUserId).emit('offer', {
      userId: socket.id,
      offer,
    });
    console.log(`Offer sent from ${socket.id} to ${targetUserId}`);
  });

  // WebRTC シグナリング: Answer
  socket.on('answer', (data) => {
    const { roomId, targetUserId, answer } = data;
    io.to(targetUserId).emit('answer', {
      userId: socket.id,
      answer,
    });
    console.log(`Answer sent from ${socket.id} to ${targetUserId}`);
  });

  // WebRTC シグナリング: ICE Candidate
  socket.on('ice-candidate', (data) => {
    const { roomId, targetUserId, candidate } = data;
    io.to(targetUserId).emit('ice-candidate', {
      userId: socket.id,
      candidate,
    });
  });

  // 切断時
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const roomId = socket.data.roomId;
    if (roomId) {
      leaveRoom(socket, roomId);
    }
  });
});

function leaveRoom(socket, roomId) {
  const room = rooms.get(roomId);
  if (room) {
    room.participants = room.participants.filter((id) => id !== socket.id);
    socket.to(roomId).emit('user-left', socket.id);
    socket.leave(roomId);

    // ルームが空になったら5分後に削除
    if (room.participants.length === 0) {
      if (roomDeletionTimers.has(roomId)) {
        clearTimeout(roomDeletionTimers.get(roomId));
      }

      const timer = setTimeout(() => {
        const currentRoom = rooms.get(roomId);
        if (currentRoom && currentRoom.participants.length === 0) {
          rooms.delete(roomId);
          roomDeletionTimers.delete(roomId);
          console.log(`Room ${roomId} deleted (empty for 5 minutes)`);
        }
      }, 5 * 60 * 1000);

      roomDeletionTimers.set(roomId, timer);
      console.log(`Room ${roomId} will be deleted in 5 minutes if no one joins`);
    }
  }
  console.log(`User ${socket.id} left room ${roomId}`);
}

server.listen(port, () => {
  console.log(`> Signaling server ready on http://localhost:${port}`);
});
