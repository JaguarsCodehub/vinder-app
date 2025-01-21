import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Layout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="(main)" 
          options={{ 
            headerTitle: "Home",
            headerStyle: {
              backgroundColor: '#f5f5f5',
            },
          }} 
        />
        
      </Stack>
    </>
  );
}
