import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import * as Location from 'expo-location';
import { Clock, MapPin, Award, Calendar } from 'lucide-react-native';

export default function HomeScreen() {
  const { session, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [punchLoading, setPunchLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentAttendance, setCurrentAttendance] = useState<any>(null);
  const [stats, setStats] = useState({
    totalHours: '0',
    daysWorked: '0',
    monthlyAttendance: '0%',
  });
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  useEffect(() => {
    loadUserData();
    checkLocationPermission();
    checkCurrentAttendance();
  }, []);

  const loadUserData = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) throw profileError;
      setUserProfile(profile);
      
      // Fetch attendance stats
      if (profile) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        
        // Get total hours this month
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance')
          .select('total_hours')
          .eq('employee_id', session.user.id)
          .gte('punch_in_time', `${year}-${month.toString().padStart(2, '0')}-01`);
          
        if (attendanceError) throw attendanceError;
        
        const totalHours = attendance
          .map(a => a.total_hours || 0)
          .reduce((sum, hours) => sum + hours, 0);
          
        const daysWorked = attendance.length;
        
        // Calculate working days in month
        const daysInMonth = new Date(year, month, 0).getDate();
        const workingDays = 22; // Approximate working days in a month
        const monthlyAttendance = Math.min(
          Math.round((daysWorked / workingDays) * 100), 
          100
        );
        
        setStats({
          totalHours: totalHours.toFixed(1),
          daysWorked: daysWorked.toString(),
          monthlyAttendance: `${monthlyAttendance}%`,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'We need location permission to record your attendance accurately.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationPermission(false);
    }
  };

  const checkCurrentAttendance = async () => {
    if (!session) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', session.user.id)
        .gte('punch_in_time', today.toISOString())
        .is('punch_out_time', null)
        .order('punch_in_time', { ascending: false })
        .maybeSingle();
        
      if (error) throw error;
      setCurrentAttendance(data);
    } catch (error) {
      console.error('Error checking current attendance:', error);
    }
  };

  const handlePunchIn = async () => {
    if (!locationPermission) {
      Alert.alert(
        'Location Required',
        'Please enable location services to punch in',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      setPunchLoading(true);
      
      // Get current location
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      // Record punch in
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          employee_id: session?.user.id,
          punch_in_time: new Date().toISOString(),
          punch_in_location: {
            latitude: coords.latitude,
            longitude: coords.longitude
          },
          is_field_visit: false // Default to false, can be updated
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setCurrentAttendance(data);
      Alert.alert('Success', 'Punched in successfully!');
    } catch (error) {
      console.error('Error punching in:', error);
      Alert.alert('Error', 'Failed to punch in. Please try again.');
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!currentAttendance) return;
    
    try {
      setPunchLoading(true);
      
      // Get current location
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      const punchOutTime = new Date();
      const punchInTime = new Date(currentAttendance.punch_in_time);
      
      // Calculate hours worked (difference in milliseconds to hours)
      const hoursWorked = (punchOutTime.getTime() - punchInTime.getTime()) / (1000 * 60 * 60);
      
      // Update attendance record
      const { data, error } = await supabase
        .from('attendance')
        .update({
          punch_out_time: punchOutTime.toISOString(),
          punch_out_location: {
            latitude: coords.latitude,
            longitude: coords.longitude
          },
          total_hours: parseFloat(hoursWorked.toFixed(2))
        })
        .eq('id', currentAttendance.id)
        .select()
        .single();
        
      if (error) throw error;
      
      setCurrentAttendance(null);
      loadUserData(); // Refresh stats
      Alert.alert('Success', 'Punched out successfully!');
    } catch (error) {
      console.error('Error punching out:', error);
      Alert.alert('Error', 'Failed to punch out. Please try again.');
    } finally {
      setPunchLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0069D9" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>
            {userProfile?.first_name} {userProfile?.last_name}
          </Text>
          <Text style={styles.roleText}>
            {userRole === 'admin' ? 'Administrator' : 'Employee'}
          </Text>
        </View>

        <View style={styles.punchCard}>
          <Text style={styles.currentStatusText}>
            {currentAttendance 
              ? 'You are currently punched in'
              : 'You are not currently punched in'}
          </Text>
          
          {currentAttendance && (
            <View style={styles.punchTimeContainer}>
              <Clock size={16} color="#666" />
              <Text style={styles.punchTimeText}>
                Since: {new Date(currentAttendance.punch_in_time).toLocaleTimeString()}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.punchButton,
              currentAttendance ? styles.punchOutButton : styles.punchInButton
            ]}
            onPress={currentAttendance ? handlePunchOut : handlePunchIn}
            disabled={punchLoading}
          >
            {punchLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.punchButtonText}>
                {currentAttendance ? 'Punch Out' : 'Punch In'}
              </Text>
            )}
          </TouchableOpacity>
          
          {!locationPermission && (
            <Text style={styles.locationWarning}>
              Location access required for attendance tracking
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>This Month's Summary</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Clock size={24} color="#0069D9" />
            <Text style={styles.statValue}>{stats.totalHours}</Text>
            <Text style={styles.statLabel}>Hours Worked</Text>
          </View>
          
          <View style={styles.statCard}>
            <Calendar size={24} color="#28A745" />
            <Text style={styles.statValue}>{stats.daysWorked}</Text>
            <Text style={styles.statLabel}>Days Present</Text>
          </View>
          
          <View style={styles.statCard}>
            <Award size={24} color="#F7B731" />
            <Text style={styles.statValue}>{stats.monthlyAttendance}</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
        </View>
        
        {userRole === 'admin' && (
          <View style={styles.adminSection}>
            <Text style={styles.sectionTitle}>Quick Admin Actions</Text>
            <TouchableOpacity 
              style={styles.adminActionButton}
              onPress={() => Alert.alert("Coming Soon", "This feature will be available soon!")}
            >
              <Text style={styles.adminActionButtonText}>
                Generate Monthly Report
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#0069D9',
    padding: 24,
    paddingTop: 12,
  },
  welcomeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  nameText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginTop: 4,
  },
  roleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  punchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentStatusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  punchTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  punchTimeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  punchButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  punchInButton: {
    backgroundColor: '#28A745',
  },
  punchOutButton: {
    backgroundColor: '#DC3545',
  },
  punchButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  locationWarning: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#DC3545',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#333',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '31%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  adminSection: {
    marginBottom: 30,
  },
  adminActionButton: {
    backgroundColor: '#0069D9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  adminActionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
});