import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  Search, 
  Plus, 
  UserCircle, 
  Building, 
  BriefcaseBusiness 
} from 'lucide-react-native';

export default function EmployeesScreen() {
  const router = useRouter();
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (userRole !== 'admin') {
      router.replace('/(authenticated)/home');
      return;
    }
    
    loadEmployees();
  }, [userRole]);

  useEffect(() => {
    filterEmployees();
  }, [searchQuery, employees]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          employees:employees (*)
        `)
        .eq('role', 'employee')
        .order('first_name', { ascending: true });
        
      if (error) throw error;
      setEmployees(data || []);
      filterEmployees();
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert('Error', 'Failed to load employees. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterEmployees = () => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = employees.filter(emp => 
      (emp.first_name && emp.first_name.toLowerCase().includes(query)) ||
      (emp.last_name && emp.last_name.toLowerCase().includes(query)) ||
      (emp.email && emp.email.toLowerCase().includes(query)) ||
      (emp.employees && emp.employees[0]?.department && 
       emp.employees[0].department.toLowerCase().includes(query))
    );
    
    setFilteredEmployees(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEmployees();
  };

  const handleAddEmployee = () => {
    router.push('/(authenticated)/employees/add');
  };

  const renderEmployeeItem = ({ item }: { item: any }) => {
    const employeeData = item.employees && item.employees[0];
    
    return (
      <TouchableOpacity
        style={styles.employeeCard}
        onPress={() => router.push(`/(authenticated)/employees/details?id=${item.id}`)}
      >
        <View style={styles.avatarContainer}>
          <UserCircle size={50} color="#0069D9" />
        </View>
        
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>
            {item.first_name} {item.last_name}
          </Text>
          <Text style={styles.employeeEmail}>{item.email}</Text>
          
          {employeeData && (
            <View style={styles.detailsRow}>
              {employeeData.department && (
                <View style={styles.detailBadge}>
                  <Building size={12} color="#666" />
                  <Text style={styles.detailText}>{employeeData.department}</Text>
                </View>
              )}
              
              {employeeData.position && (
                <View style={styles.detailBadge}>
                  <BriefcaseBusiness size={12} color="#666" />
                  <Text style={styles.detailText}>{employeeData.position}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
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
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search employees..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddEmployee}
        >
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredEmployees}
        renderItem={renderEmployeeItem}
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
            <Users size={48} color="#CCC" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No employees match your search' : 'No employees found'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={styles.emptyAddButton}
                onPress={handleAddEmployee}
              >
                <Text style={styles.emptyAddButtonText}>Add Employee</Text>
              </TouchableOpacity>
            )}
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginRight: 12,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 12,
  },
  addButton: {
    backgroundColor: '#0069D9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  employeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333',
  },
  employeeEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  detailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
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
    textAlign: 'center',
  },
  emptyAddButton: {
    backgroundColor: '#0069D9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyAddButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
});