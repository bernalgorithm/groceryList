import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '../context/AppContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            headerTintColor: '#0f172a',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: '#f8fafc',
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'Grocery Lists',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="list/[id]"
            options={{
              title: 'List',
              headerShown: true,
              headerBackTitle: 'Lists',
            }}
          />
          <Stack.Screen
            name="friends/index"
            options={{
              title: 'Family & Friends',
              headerShown: true,
              headerBackTitle: 'Lists',
            }}
          />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
