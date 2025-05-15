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
import { Calendar, DollarSign, Plus, Search, Filter, UserCircle } from 'lucide-react-native';

export default function PayrollScreen() {
  const router = useRouter();
  const { session, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [filterEmployee, setFilterEmployee] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  useEffect(() => {
    loadPayrollData();
    if (userRole === 'admin') {
      loadEmployees();
    }
  }, [userRole, currentMonth, currentYear, filterEmployee]);

  const loadPayrollData = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('payroll')
        .select(`
          *,
          profiles:employee_id (
            first_name,
            last_name,
            email
          ),
          processor:processed_by (
            first_name,
            last_name
          )
        `)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .order('created_at', { ascending: false });
      
      // Filter by employee ID if user is an employee, or if an admin has selected a filter
      if (userRole === 'employee') {
        query = query.eq('employee_id', session.user.id);
      } else if (userRole === 'admin' && filterEmployee) {
        query = query.eq('employee_id', filterEmployee);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setPayrollRecords(data || []);
    } catch (error) {
      console.error('Error loading payroll data:', error);
      Alert.alert('Error', 'Failed to load payroll records');
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
    loadPayrollData();
  };

  const handleFilterChange = (employeeId: string | null) => {
    setFilterEmployee(employeeId);
  };

  const handleMonthChange = (month: number) => {
    setCurrentMonth(month);
  };

  const handleYearChange = (year: number) => {
    setCurrentYear(year);
  };

  const handleGeneratePayroll = async () => {
    if (userRole !== 'admin') return;
    
    // This would typically be a complex operation with attendance calculation
    // Simplified for demo purposes
    Alert.alert('Generate Payroll', 'This would generate payroll records for all employees. This feature is not fully implemented in the demo.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F7B731';
      case 'processed': return '#0069D9';
      case 'paid': return '#28A745';
      default: return '#666';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const renderPayrollItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles.payrollCard}
        onPress={() => {
          // Navigate to payroll details (not implemented in this prototype)
          Alert.alert('View Payroll', 'Payroll details view not implemented in this prototype');
        }}
      >
        {userRole === 'admin' && (
          <View style={styles.employeeHeader}>
            <UserCircle size={20} color="#0069D9" />
            <Text style={styles.employeeName}>
              {item.profiles.first_name} {item.profiles.last_name}
            </Text>
          </View>
        )}
        
        <View style={styles.payrollDetails}>
          <View style={styles.payrollDetail}>
            <Text style={styles.detailLabel}>Month/Year:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.year, item.month - 1).toLocaleString('default', { month: 'long' })} {item.year}
            </Text>
          </View>
          
          <View style={styles.payrollDetail}>
            <Text style={styles.detailLabel}>Gross Salary:</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.gross_salary)}</Text>
          </View>
          
          <View style={styles.payrollDetail}>
            <Text style={styles.detailLabel}>Net Salary:</Text>
            <Text style={styles.detailValueLarge}>{formatCurrency(item.net_salary)}</Text>
          </View>
          
          <View style={styles.payrollDetail}>
            <Text style={styles.detailLabel}>Days Worked:</Text>
            <Text style={styles.detailValue}>{item.days_worked}</Text>
          </View>
        </View>
        
        <View style={styles.payrollFooter}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          
          {item.processed_by && (
            <Text style={styles.processedBy}>
              Processed by: {item.processor.first_name} {item.processor.last_name}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMonthYearSelector = () => {
    const months = [
      { num: 1, name: 'Jan' },
      { num: 2, name: 'Feb' },
      { num: 3, name: 'Mar' },
      { num: 4, name: 'Apr' },
      { num: 5, name: 'May' },
      { num: 6, name: 'Jun' },
      { num: 7, name: 'Jul' },
      { num: 8, name: 'Aug' },
      { num: 9, name: 'Sep' },
      { num: 10, name: 'Oct' },
      { num: 11, name: 'Nov' },
      { num: 12, name: 'Dec' }
    ];
    
    const years = [
      currentYear - 2,
      currentYear - 1, 
      currentYear
    ];
    
    return (
      <View style={styles.dateFilterContainer}>
        <View style={styles.monthSelector}>
          <Text style={styles.selectorLabel}>Month:</Text>
          <FlatList
            data={months}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.num.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.monthItem,
                  currentMonth === item.num && styles.activeMonthItem
                ]}
                onPress={() => handleMonthChange(item.num)}
              >
                <Text style={[
                  styles.monthText,
                  currentMonth === item.num && styles.activeMonthText
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
        
        <View style={styles.yearSelector}>
          <Text style={styles.selectorLabel}>Year:</Text>
          <View style={styles.yearItems}>
            {years.map(year => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearItem,
                  currentYear === year && styles.activeYearItem
                ]}
                onPress={() => handleYearChange(year)}
              >
                <Text style={[
                  styles.yearText,
                  currentYear === year && styles.activeYearText
                ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderAdminControls = () => {
    if (userRole !== 'admin') return null;
    
    return (
      <View style={styles.adminControlsContainer}>
        <TouchableOpacity 
          style={styles.generateButton}
          onPress={handleGeneratePayroll}
        >
          <Plus size={16} color="#FFF" />
          <Text style={styles.generateButtonText}>Generate Payroll</Text>
        </TouchableOpacity>
      </View>
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
      {renderMonthYearSelector()}
      
      {userRole === 'admin' && employees.length > 0 && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>
            <Filter size={16} color="#333" /> Filter by Employee:
          </Text>
          
          <FlatList
            data={[{ id: null, first_name: 'All', last_name: 'Employees' }, ...employees]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id || 'all'}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.employeeFilterItem,
                  filterEmployee === item.id && styles.selectedEmployeeFilter
                ]}
                onPress={() => handleFilterChange(item.id)}
              >
                <Text style={[
                  styles.employeeFilterText,
                  filterEmployee === item.id && styles.selectedEmployeeFilterText
                ]}>
                  {item.id === null ? 'All' : `${item.first_name} ${item.last_name}`}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.employeeFilterList}
          />
        </View>
      )}
      
      {renderAdminControls()}
      
      <FlatList
        data={payrollRecords}
        renderItem={renderPayrollItem}
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
            <DollarSign size={48} color="#CCC" />
            <Text style={styles.emptyText}>No payroll records found for this period</Text>
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
  dateFilterContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  monthSelector: {
    marginBottom: 12,
  },
  selectorLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  monthItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    marginRight: 8,
  },
  activeMonthItem: {
    backgroundColor: '#0069D9',
  },
  monthText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#333',
  },
  activeMonthText: {
    color: '#FFFFFF',
  },
  yearSelector: {
    marginBottom: 8,
  },
  yearItems: {
    flexDirection: 'row',
  },
  yearItem: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    marginRight: 8,
  },
  activeYearItem: {
    backgroundColor: '#0069D9',
  },
  yearText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#333',
  },
  activeYearText: {
    color: '#FFFFFF',
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
  adminControlsContainer: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  generateButton: {
    backgroundColor: '#28A745',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  payrollCard: {
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
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  employeeName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  payrollDetails: {
    marginBottom: 12,
  },
  payrollDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333',
  },
  detailValueLarge: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#0069D9',
  },
  payrollFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 12,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  processedBy: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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
});