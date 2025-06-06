// import { Stack } from 'expo-router';

// export default function RootLayout() {
//   return (
//     <Stack>
//       <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//     </Stack>
//   );
// }

import { Stack } from 'expo-router';
import { ThemeProvider } from './contexts/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(drawer)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
