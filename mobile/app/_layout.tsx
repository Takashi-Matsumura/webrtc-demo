import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#111',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: '音声チャット',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="room/[id]"
          options={{
            title: 'ルーム',
            headerBackTitle: '戻る',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'AI設定',
            headerBackTitle: '戻る',
          }}
        />
      </Stack>
    </>
  );
}
