import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            <Stack.Screen name="doctor/dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="doctor/add-patient" options={{ headerShown: false }} />
            <Stack.Screen name="doctor/patient-timeline/[surgeryId]" options={{ headerShown: false }} />
            <Stack.Screen name="doctor/edit-patient/[surgeryId]" options={{ headerShown: false }} />
            <Stack.Screen name="doctor/report-details/[reportId]" options={{ headerShown: false }} />
            <Stack.Screen name="patient/dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="patient/daily-report" options={{ headerShown: false }} />
            <Stack.Screen name="patient/timeline" options={{ headerShown: false }} />
            <Stack.Screen name="patient/report-details/[reportId]" options={{ headerShown: false }} />
          </Stack>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
