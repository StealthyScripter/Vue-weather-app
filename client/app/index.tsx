import { useEffect } from 'react';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
  const timer = setTimeout(() => {
    router.replace('/login' as any);  // Correct route + delayed call
  }, 100);
  return () => clearTimeout(timer);
}, []);
}