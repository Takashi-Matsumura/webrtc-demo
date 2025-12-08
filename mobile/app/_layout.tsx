import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#111',
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: 'AI設定', headerBackTitle: '戻る' }}
      />
      <Stack.Screen
        name="room/[id]"
        options={{ title: 'ルーム', headerBackTitle: '戻る' }}
      />
    </Stack>
  );
}
