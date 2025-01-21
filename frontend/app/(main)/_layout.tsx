import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MainLayout() {
  const router = useRouter();

  useEffect(() => {
    checkAuthAndPreferences();
  }, []);

  const checkAuthAndPreferences = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const hasPreferences = await AsyncStorage.getItem('userPreferences');

      if (!token) {
        router.replace('/(auth)/login');
      } else if (!hasPreferences) {
        router.replace('/(main)/onboarding');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      router.replace('/(auth)/login');
    }
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f5f5f5',
        },
        headerTintColor: '#000',
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: 'Home',
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          headerTitle: 'Preferences',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="screens/VenueMapScreen"
        options={{
          headerTitle: 'Explore Venues',
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}