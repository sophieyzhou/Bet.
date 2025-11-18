const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function summarizePayload(payload) {
  try {
    if (!payload) return { type: 'null' };
    if (Array.isArray(payload)) {
      return { type: 'array', length: payload.length };
    }
    if (typeof payload === 'object') {
      const summary = {};
      if (payload._id) summary._id = String(payload._id);
      if (payload.groupId) summary.groupId = String(payload.groupId);
      if (payload.eventId) summary.eventId = String(payload.eventId);
      if (payload.userId) summary.userId = String(payload.userId);
      summary.keys = Object.keys(payload);
      return summary;
    }
    return { type: typeof payload };
  } catch (e) {
    return { type: 'error', message: e?.message };
  }
}

function getRoomSize(roomName) {
  if (!io) return 0;
  const room = io.sockets?.adapter?.rooms?.get(roomName);
  return room ? room.size : 0;
}

function initializeRealtime(httpServer, { origins = [] } = {}) {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: origins,
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake?.auth?.token;
      if (!token) {
        return next(new Error('Unauthorized: missing token'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
      socket.data.userId = decoded.userId;
      return next();
    } catch (err) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data?.userId;
    console.log('[ws] connect', { socketId: socket.id, userId });

    socket.on('join-group', (groupIdRaw) => {
      const groupId = String(groupIdRaw);
      socket.join(groupId);
      console.log('[ws] join-group', {
        socketId: socket.id,
        userId,
        groupId,
        roomSize: getRoomSize(groupId)
      });
    });

    socket.on('leave-group', (groupIdRaw) => {
      const groupId = String(groupIdRaw);
      socket.leave(groupId);
      console.log('[ws] leave-group', {
        socketId: socket.id,
        userId,
        groupId,
        roomSize: getRoomSize(groupId)
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('[ws] disconnect', { socketId: socket.id, userId, reason });
    });
  });

  return io;
}

function emitToGroup(groupIdRaw, eventName, payload) {
  if (!io) {
    console.warn('[ws] emit called before initialization');
    return;
  }
  const groupId = String(groupIdRaw);
  io.to(groupId).emit(eventName, payload);
  console.log('[ws] emit', {
    eventName,
    groupId,
    roomSize: getRoomSize(groupId),
    payload: summarizePayload(payload)
  });
}

function getIo() {
  return io;
}

module.exports = {
  initializeRealtime,
  emitToGroup,
  getIo
};


