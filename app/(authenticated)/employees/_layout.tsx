import React from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';

export default function EmployeesLayout() {
  const { userRole } = useAuth();
  
  // If not admin, redirect to home
  if (userRole !== 'admin') {
    return <Redirect href="/(authenticated)/home" />;
  }
  
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Manage Employees',
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
        name="add" 
        options={{ 
          title: 'Add Employee',
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
          title: 'Employee Details',
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
        name="edit" 
        options={{ 
          title: 'Edit Employee',
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