import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  Alert,
  Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Clock, Calendar, Navigation, File as FileEdit } from 'lucide-react-native';

// Only declare MapView and Marker types outside the conditional import
type MapViewType = any;
type MarkerType = any;

// Only import and assign MapView and Marker when not on web
let MapView: MapViewType;
let Marker: MarkerType;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (error) {
    console.warn('react-native-maps not available');
  }
}

const LocationDisplay = ({ location, title }: { location: any, title: string }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webLocationContainer}>
        <Text style={styles.webLocationText}>
          Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </Text>
        <Text style={styles.webLocationNote}>
          Map view is not available in web version
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title={title}
        />
      </MapView>
      
      <TouchableOpacity 
        style={styles.directionsButton}
        onPress={() => {
          Alert.alert("Navigation", "Opening maps app is not supported in web version");
        }}
      >
        <Navigation size={16} color="#FFF" />
        <Text style={styles.directionsButtonText}>Get Directions</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function AttendanceDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadAttendanceDetails();
    }
  }, [id]);

  const loadAttendanceDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles:employee_id (
            first_name,
            last_name,
            email,
            role
          )
        `)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      // Check permission
      if (
        userRole !== 'admin' && 
        data.employee_id !== session?.user.id
      ) {
        Alert.alert('Access Denied', 'You do not have permission to view this record');
        router.back();
        return;
      }
      
      setAttendance(data);
    } catch (error) {
      console.error('Error loading attendance details:', error);
      Alert.alert('Error', 'Failed to load attendance details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateDuration = () => {
    if (!attendance) return 'N/A';
    
    if (!attendance.punch_out_time) {
      return 'In progress';
    }
    
    const punchIn = new Date(attendance.punch_in_time);
    const punchOut = new Date(attendance.punch_out_time);
    const durationMs = punchOut.getTime() - punchIn.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const handleToggleFieldVisit = async () => {
    if (!attendance) return;
    
    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          is_field_visit: !attendance.is_field_visit
        })
        .eq('id', attendance.id);
        
      if (error) throw error;
      
      setAttendance({
        ...attendance,
        is_field_visit: !attendance.is_field_visit
      });
      
      Alert.alert(
        'Success', 
        `Marked as ${!attendance.is_field_visit ? 'field visit' : 'regular attendance'}`
      );
    } catch (error) {
      console.error('Error updating field visit status:', error);
      Alert.alert('Error', 'Failed to update field visit status');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0069D9" />
      </View>
    );
  }

  if (!attendance) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Attendance record not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>
              {attendance.profiles.first_name} {attendance.profiles.last_name}
            </Text>
            {userRole === 'admin' && (
              <Text style={styles.employeeEmail}>{attendance.profiles.email}</Text>
            )}
          </View>
          
          <View style={[
            styles.statusBadge,
            attendance.punch_out_time ? styles.completedBadge : styles.ongoingBadge
          ]}>
            <Text style={styles.statusText}>
              {attendance.punch_out_time ? 'Completed' : 'In Progress'}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Calendar size={20} color="#666" />
          <View style={styles.detailsContent}>
            <Text style={styles.detailsLabel}>Date</Text>
            <Text style={styles.detailsValue}>
              {new Date(attendance.punch_in_time).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Clock size={20} color="#666" />
          <View style={styles.detailsContent}>
            <Text style={styles.detailsLabel}>Punch In Time</Text>
            <Text style={styles.detailsValue}>
              {formatDate(attendance.punch_in_time)}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Clock size={20} color="#666" />
          <View style={styles.detailsContent}>
            <Text style={styles.detailsLabel}>Punch Out Time</Text>
            <Text style={styles.detailsValue}>
              {attendance.punch_out_time 
                ? formatDate(attendance.punch_out_time) 
                : 'Not punched out yet'}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Clock size={20} color="#666" />
          <View style={styles.detailsContent}>
            <Text style={styles.detailsLabel}>Duration</Text>
            <Text style={styles.detailsValue}>{calculateDuration()}</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <MapPin size={20} color="#666" />
          <View style={styles.detailsContent}>
            <Text style={styles.detailsLabel}>Status</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.detailsValue}>
                {attendance.is_field_visit ? 'Field Visit' : 'Regular Attendance'}
              </Text>
              
              {userRole === 'admin' && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleToggleFieldVisit}
                >
                  <FileEdit size={16} color="#0069D9" />
                  <Text style={styles.editButtonText}>Change</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {attendance.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{attendance.notes}</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Location Information</Text>

      <View style={styles.card}>
        <Text style={styles.locationTitle}>Punch In Location</Text>
        {attendance.punch_in_location ? (
          <LocationDisplay 
            location={attendance.punch_in_location} 
            title="Punch In Location" 
          />
        ) : (
          <Text style={styles.noLocationText}>No location data available</Text>
        )}

        {attendance.punch_out_time && (
          <>
            <Text style={[styles.locationTitle, styles.locationTitleSecond]}>
              Punch Out Location
            </Text>
            {attendance.punch_out_location ? (
              <LocationDisplay 
                location={attendance.punch_out_location} 
                title="Punch Out Location" 
              />
            ) : (
              <Text style={styles.noLocationText}>No location data available</Text>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#DC3545',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#333',
  },
  employeeEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  completedBadge: {
    backgroundColor: '#28A745',
  },
  ongoingBadge: {
    backgroundColor: '#F7B731',
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  detailsContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailsLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  detailsValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#0069D9',
    marginLeft: 4,
  },
  notesContainer: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  notesLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  notesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
  },
  locationTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  locationTitleSecond: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  mapContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  map: {
    height: 200,
    width: '100%',
  },
  directionsButton: {
    backgroundColor: '#0069D9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  directionsButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  noLocationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  webLocationContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  webLocationText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  webLocationNote: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});