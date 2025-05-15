import React, { useEffect } from 'react';
import { Redirect, Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Home, Users, Calculator, ClipboardList, UserCog } from 'lucide-react-native';

export default function AppLayout() {
  const { session, userRole } = useAuth();

  // If user is not authenticated, redirect to login
  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#0069D9',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      
      {/* Common screens for both roles */}
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="payroll"
        options={{
          title: 'Payroll',
          tabBarIcon: ({ color, size }) => <Calculator size={size} color={color} />,
        }}
      />
      
      {/* Admin-only screens */}
      {userRole === 'admin' && (
        <Tabs.Screen
          name="employees"
          options={{
            title: 'Employees',
            tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          }}
        />
      )}
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <UserCog size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#DDDDDD',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginBottom: 4,
  },
});