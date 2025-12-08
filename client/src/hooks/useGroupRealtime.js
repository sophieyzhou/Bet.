import { useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { socketService } from '../services/socketService';

const getItemAsync = async (key) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
};

export const useGroupRealtime = ({
  groupId,
  onGroupUpdate,
  onEventNew,
  onEventUpdate,
  onEventDelete
}) => {
  // Keep latest handlers without retriggering socket lifecycle
  const handlersRef = useRef({
    onGroupUpdate,
    onEventNew,
    onEventUpdate,
    onEventDelete
  });

  useEffect(() => {
    handlersRef.current = {
      onGroupUpdate,
      onEventNew,
      onEventUpdate,
      onEventDelete
    };
  }, [onGroupUpdate, onEventNew, onEventUpdate, onEventDelete]);

  useEffect(() => {
    if (!groupId) {
      return () => undefined;
    }

    let isMounted = true;
    let activeSocket = null;
    const unsubscribers = [];

    const setupRealtime = async () => {
      try {
        const token = await getItemAsync('authToken');
        if (!token || !isMounted) {
          console.warn('[realtime] Missing token or component unmounted');
          return;
        }

        console.log('[realtime] Connecting socket for groupId:', groupId);
        activeSocket = await socketService.connect(token);
        if (!activeSocket || !isMounted) {
          console.warn('[realtime] Socket connection failed or component unmounted');
          return;
        }

        // Verify socket is actually connected after promise resolves
        console.log('[realtime] Socket connection promise resolved. Verifying connection state...');
        console.log('[realtime] socket.connected:', activeSocket.connected, 'socket.id:', activeSocket.id);
        
        // Wait a moment if socket just connected to ensure it's fully ready
        if (!activeSocket.connected) {
          console.warn('[realtime] WARNING: Socket promise resolved but socket.connected is false! Waiting...');
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log('[realtime] After wait, socket.connected:', activeSocket.connected, 'socket.id:', activeSocket.id);
        }

        if (!activeSocket.connected) {
          console.error('[realtime] ERROR: Socket is not connected after verification. Cannot proceed.');
          return;
        }

        if (!isMounted) {
          console.warn('[realtime] Component unmounted during connection verification');
          return;
        }

        // Ensure groupId is normalized to string
        const normalizedGroupId = String(groupId);
        console.log('[realtime] Socket verified and ready, setting up handlers for groupId:', normalizedGroupId);

        // Stable handlers that reference latest callbacks
        const groupUpdateHandler = (payload) => {
          console.log('[realtime] Received group:update for groupId:', payload?._id);
          handlersRef.current.onGroupUpdate?.(payload);
        };
        activeSocket.on('group:update', groupUpdateHandler);
        unsubscribers.push(() => activeSocket.off('group:update', groupUpdateHandler));
        console.log('[realtime] Registered group:update handler');

        const eventNewHandler = (payload) => {
          console.log('[realtime] Received events:new - eventId:', payload?._id);
          handlersRef.current.onEventNew?.(payload);
        };
        activeSocket.on('events:new', eventNewHandler);
        unsubscribers.push(() => activeSocket.off('events:new', eventNewHandler));
        console.log('[realtime] Registered events:new handler');

        const eventUpdateHandler = (payload) => {
          console.log('[realtime] Received events:update - eventId:', payload?._id, 'vetoCount:', payload?.vetoCount);
          handlersRef.current.onEventUpdate?.(payload);
        };
        activeSocket.on('events:update', eventUpdateHandler);
        unsubscribers.push(() => activeSocket.off('events:update', eventUpdateHandler));
        console.log('[realtime] Registered events:update handler');

        const eventDeleteHandler = (payload) => {
          console.log('[realtime] Received events:delete - eventId:', payload?.eventId || payload?._id);
          handlersRef.current.onEventDelete?.(payload);
        };
        activeSocket.on('events:delete', eventDeleteHandler);
        unsubscribers.push(() => activeSocket.off('events:delete', eventDeleteHandler));
        console.log('[realtime] Registered events:delete handler');

        // NOW join the room after handlers are set up
        console.log('[realtime] Handlers registered, joining group:', normalizedGroupId);
        socketService.joinGroup(normalizedGroupId);

        // Rejoin group on reconnect
        const handleReconnect = () => {
          if (isMounted) {
            console.log('[realtime] Socket reconnected, rejoining group:', normalizedGroupId);
            socketService.joinGroup(normalizedGroupId);
          }
        };
        activeSocket.on('reconnect', handleReconnect);
        unsubscribers.push(() => activeSocket.off('reconnect', handleReconnect));
      } catch (error) {
        console.error('[realtime] Failed to initialize connection:', error);
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      console.log('[realtime] Cleaning up realtime connection for groupId:', groupId);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      if (activeSocket && groupId) {
        const normalizedGroupId = String(groupId);
        socketService.leaveGroup(normalizedGroupId);
      }
    };
  }, [groupId]);
};


