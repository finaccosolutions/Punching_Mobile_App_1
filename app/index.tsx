import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function IndexScreen() {
  const { session, initialized } = useAuth();

  useEffect(() => {
    if (initialized) {
      SplashScreen.hideAsync();
    }
  }, [initialized]);

  // Don't render anything until auth is initialized
  if (!initialized) return null;

  // Redirect based on auth status
  if (session) {
    return <Redirect href="/(authenticated)/home" />;
  } else {
    return <Redirect href="/login" />;
  }
}