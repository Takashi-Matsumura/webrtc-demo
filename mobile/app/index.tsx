import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSocket } from '../src/hooks/useSocket';
import { RoomForm } from '../src/components/RoomForm';

export default function HomeScreen() {
  const router = useRouter();
  const { socket, isConnected, createRoom } = useSocket();

  // ルーム作成イベントのリスナー
  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = (roomId: string) => {
      console.log('Room created:', roomId);
      router.push(`/room/${roomId}`);
    };

    socket.on('room-created', handleRoomCreated);

    return () => {
      socket.off('room-created', handleRoomCreated);
    };
  }, [socket, router]);

  const handleCreateRoom = () => {
    createRoom();
  };

  const handleJoinRoom = (roomId: string) => {
    router.push(`/room/${roomId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <RoomForm
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        isConnected={isConnected}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});
