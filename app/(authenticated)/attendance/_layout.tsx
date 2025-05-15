import React from 'react';
import { Stack } from 'expo-router';

export default function AttendanceLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Attendance Records',
          headerTitleStyle: {
            fontFamily: 'Inter-Medium',
            fontSize: 18,
          },
          headerStyle: {
            backgroundColor: '#F5F5F5',
          },
        }} 
      />
      <Stack.Screen 
        name="details" 
        options={{ 
          title: 'Attendance Details',
          headerTitleStyle: {
            fontFamily: 'Inter-Medium',
            fontSize: 18,
          },
          headerStyle: {
            backgroundColor: '#F5F5F5',
          },
        }}
      />
    </Stack>
  );
}