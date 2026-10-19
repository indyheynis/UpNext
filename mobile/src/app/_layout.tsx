import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlayerHypeProvider } from '../screens/PlayerHype';
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PlayerHypeProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: '#090C10' },
          }}
        />
      </PlayerHypeProvider>
    </SafeAreaProvider>
  );
}
