import { io } from 'socket.io-client';
import { getSocketBaseUrl } from './config';

let socket = null;
let connectPromise = null;

const getSocket = () => socket;

const createSocket = (token) => {
  const SOCKET_BASE_URL = getSocketBaseUrl();
  socket = io(SOCKET_BASE_URL, {
    transports: ['websocket'],
    autoConnect: false,
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity
  });

  socket.on('connect', () => {
    console.log('[socket] Connected successfully');
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[socket] Connection error:', error?.message || error);
  });

  return socket;
};

const connect = async (token) => {
  if (!token) {
    console.warn('[socket] Missing auth token, skipping connection');
    return null;
  }

  if (!socket) {
    createSocket(token);
  }

  if (socket.connected) {
    console.log('[socket] Socket already connected, returning existing socket');
    return socket;
  }

  socket.auth = { token };

  if (!connectPromise) {
    connectPromise = new Promise((resolve, reject) => {
      const handleConnect = () => {
        console.log('[socket] Connection event fired, verifying socket state...');
        cleanup();
        // Verify socket is actually connected
        if (socket.connected) {
          console.log('[socket] Socket verified as connected, resolving promise');
          resolve(socket);
        } else {
          // Socket says it connected but connected is false - wait a tiny bit
          console.warn('[socket] Socket connect event fired but socket.connected is false, waiting...');
          setTimeout(() => {
            if (socket.connected) {
              console.log('[socket] Socket now connected after wait, resolving promise');
              resolve(socket);
            } else {
              console.error('[socket] Socket still not connected after wait');
              reject(new Error('Socket connected event fired but socket.connected is false'));
            }
          }, 100);
        }
      };

      const handleError = (error) => {
        console.error('[socket] Connection error in promise:', error);
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        socket.off('connect', handleConnect);
        socket.off('connect_error', handleError);
        connectPromise = null;
      };

      socket.once('connect', handleConnect);
      socket.once('connect_error', handleError);
      console.log('[socket] Starting socket connection...');
      socket.connect();
    });
  } else {
    console.log('[socket] Connection already in progress, waiting for existing promise');
  }

  return connectPromise;
};

const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectPromise = null;
  }
};

const joinGroup = (groupId) => {
  if (!socket || !groupId) {
    console.warn('[socket] Cannot join group - socket or groupId missing', { 
      hasSocket: !!socket, 
      groupId: groupId 
    });
    return;
  }

  // Ensure groupId is a string
  const normalizedGroupId = String(groupId);
  console.log('[socket] joinGroup called:', normalizedGroupId, 'socket.connected:', socket.connected, 'socket.id:', socket.id);
  
  // Helper to actually emit the join with verification
  const emitJoin = () => {
    if (!socket) {
      console.error('[socket] Cannot emit join-group - socket is null');
      return false;
    }
    
    if (!socket.connected) {
      console.warn('[socket] Cannot emit join-group - socket not connected. socket.connected:', socket.connected, 'socket.id:', socket.id);
      return false;
    }
    
    try {
      console.log('[socket] Emitting join-group for:', normalizedGroupId, 'to server (socket.id:', socket.id + ')');
      socket.emit('join-group', normalizedGroupId);
      console.log('[socket] join-group event emitted successfully');
      return true;
    } catch (error) {
      console.error('[socket] Error emitting join-group:', error);
      return false;
    }
  };
  
  if (socket.connected) {
    // Socket is already connected, join immediately
    const success = emitJoin();
    if (!success) {
      console.warn('[socket] Failed to emit join-group immediately, will retry on next connect');
      // Set up a listener to retry when it connects
      const retryHandler = () => {
        console.log('[socket] Retrying join-group after reconnection');
        emitJoin();
        socket.off('connect', retryHandler);
      };
      socket.once('connect', retryHandler);
    }
  } else {
    // Socket not connected yet, wait for connection
    console.warn('[socket] Socket not connected yet, waiting for connection before joining group:', normalizedGroupId);
    // Use a named function so we can remove it if needed
    const connectHandler = () => {
      console.log('[socket] Socket connected in joinGroup handler, joining group:', normalizedGroupId);
      // Add a small delay to ensure socket is fully ready
      setTimeout(() => {
        const success = emitJoin();
        if (!success) {
          console.error('[socket] Failed to emit join-group even after connection');
        }
      }, 50);
    };
    
    // Remove any existing listener to avoid duplicates
    socket.off('connect', connectHandler);
    socket.once('connect', connectHandler);
  }
};

const leaveGroup = (groupId) => {
  if (!socket || !groupId) {
    return;
  }
  
  // Ensure groupId is a string
  const normalizedGroupId = String(groupId);
  console.log('[socket] Leaving group:', normalizedGroupId);
  socket.emit('leave-group', normalizedGroupId);
};

const on = (eventName, handler) => {
  if (!socket || !eventName || !handler) {
    return;
  }
  socket.on(eventName, handler);
};

const off = (eventName, handler) => {
  if (!socket || !eventName || !handler) {
    return;
  }
  socket.off(eventName, handler);
};

export const socketService = {
  connect,
  disconnect,
  joinGroup,
  leaveGroup,
  on,
  off,
  getSocket
};


