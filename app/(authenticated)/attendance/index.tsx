import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Clock, Search, Calendar, Map, Filter } from 'lucide-react-native';

// Helper to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

// Calculate duration between two timestamps
const calculateDuration = (startTime: string, endTime: string | null) => {
  if (!endTime) return 'In progress';
  
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const durationHours = (end - start) / (1000 * 60 * 60);
  
  return `${durationHours.toFixed(2)} hours`;
};

export default function AttendanceScreen() {
  const router = useRouter();
  const { session, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [filterEmployee, setFilterEmployee] = useState<string | null>(null);

  useEffect(() => {
    loadAttendanceData();
    if (userRole === 'admin') {
      loadEmployees();
    }
  }, [userRole]);

  const loadAttendanceData = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('attendance')
        .select(`
          *,
          profiles:employee_id (
            first_name,
            last_name,
            email
          )
        `)
        .order('punch_in_time', { ascending: false });
      
      // Filter by employee ID if user is an employee, or if an admin has selected a filter
      if (userRole === 'employee') {
        query = query.eq('employee_id', session.user.id);
      } else if (userRole === 'admin' && filterEmployee) {
        query = query.eq('employee_id', filterEmployee);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      Alert.alert('Error', 'Failed to load attendance records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'employee');
        
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAttendanceData();
  };

  const handleFilterChange = (employeeId: string | null) => {
    setFilterEmployee(employeeId);
    setTimeout(loadAttendanceData, 100);
  };

  const renderAttendanceItem = ({ item }: { item: any }) => {
    const isOngoing = !item.punch_out_time;
    
    return (
      <TouchableOpacity
        style={[styles.attendanceCard, isOngoing && styles.ongoingCard]}
        onPress={() => router.push(`/attendance/details?id=${item.id}`)}
      >
        <View style={styles.attendanceHeader}>
          {userRole === 'admin' && (
            <Text style={styles.employeeName}>
              {item.profiles.first_name} {item.profiles.last_name}
            </Text>
          )}
          <Text style={styles.dateText}>
            {new Date(item.punch_in_time).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.timeContainer}>
          <View style={styles.timeBlock}>
            <Clock size={16} color="#666" />
            <View>
              <Text style={styles.timeLabel}>Punch In</Text>
              <Text style={styles.timeValue}>
                {formatDate(item.punch_in_time)}
              </Text>
            </View>
          </View>
          
          <View style={styles.timeBlock}>
            <Clock size={16} color="#666" />
            <View>
              <Text style={styles.timeLabel}>Punch Out</Text>
              <Text style={styles.timeValue}>
                {item.punch_out_time 
                  ? formatDate(item.punch_out_time)
                  : 'Not punched out'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.attendanceFooter}>
          <View style={styles.durationContainer}>
            <Text style={styles.durationLabel}>Duration:</Text>
            <Text style={[
              styles.durationValue, 
              isOngoing && styles.ongoingText
            ]}>
              {calculateDuration(item.punch_in_time, item.punch_out_time)}
            </Text>
          </View>
          
          {item.is_field_visit && (
            <View style={styles.fieldVisitBadge}>
              <Map size={12} color="#FFF" />
              <Text style={styles.fieldVisitText}>Field Visit</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderAdminFilters = () => {
    if (userRole !== 'admin') return null;
    
    return (
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>
          <Filter size={16} color="#333" /> Filter by Employee:
        </Text>
        
        <ScrollableEmployeeFilter 
          employees={employees}
          selectedEmployee={filterEmployee}
          onSelect={handleFilterChange}
        />
      </View>
    );
  };

  // Scrollable employee filter component
  const ScrollableEmployeeFilter = ({ 
    employees, 
    selectedEmployee, 
    onSelect 
  }: { 
    employees: any[], 
    selectedEmployee: string | null, 
    onSelect: (id: string | null) => void 
  }) => {
    return (
      <FlatList
        data={[{ id: null, first_name: 'All', last_name: 'Employees' }, ...employees]}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id || 'all'}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.employeeFilterItem,
              selectedEmployee === item.id && styles.selectedEmployeeFilter
            ]}
            onPress={() => onSelect(item.id)}
          >
            <Text style={[
              styles.employeeFilterText,
              selectedEmployee === item.id && styles.selectedEmployeeFilterText
            ]}>
              {item.id === null ? 'All' : `${item.first_name} ${item.last_name}`}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.employeeFilterList}
      />
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0069D9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderAdminFilters()}
      
      <FlatList
        data={attendanceRecords}
        renderItem={renderAttendanceItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0069D9']}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Calendar size={48} color="#CCC" />
            <Text style={styles.emptyText}>No attendance records found</Text>
          </View>
        )}
      />
    </View>
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
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ongoingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeeName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333',
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '48%',
  },
  timeLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  timeValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    marginTop: 2,
  },
  attendanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 12,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  durationValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
  },
  ongoingText: {
    color: '#28A745',
  },
  fieldVisitBadge: {
    backgroundColor: '#0069D9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  fieldVisitText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  filterTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeFilterList: {
    marginTop: 8,
  },
  employeeFilterItem: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedEmployeeFilter: {
    backgroundColor: '#0069D9',
  },
  employeeFilterText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#333',
  },
  selectedEmployeeFilterText: {
    color: '#FFFFFF',
  },
});