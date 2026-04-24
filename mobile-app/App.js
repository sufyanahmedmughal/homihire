import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/store/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { reset } from './src/navigation/navigationRef';
import { setupNotificationChannel } from './src/services/notifications';

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Ensure Android notification channel is created on app start
    setupNotificationChannel();

    // ── Foreground notification received ──────────────────────────────────
    // (already handled by setNotificationHandler in notifications.js)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[App] Foreground notification received:', notification.request.content.title);
      }
    );

    // ── Notification TAP handler (background / killed state) ─────────────
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('[App] Notification tapped, type:', data?.type);

        if (data?.type === 'approved') {
          reset({ index: 0, routes: [{ name: 'WorkerHome' }] });
        } else if (data?.type === 'rejected') {
          reset({
            index: 0,
            routes: [{ name: 'Rejected', params: { rejection_reason: data?.reason } }],
          });
        }
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" backgroundColor="#0A0A0F" />
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
