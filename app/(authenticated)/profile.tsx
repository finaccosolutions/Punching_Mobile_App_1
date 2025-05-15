import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
  User, 
  Mail, 
  Calendar, 
  Building,
  BriefcaseBusiness,
  Clock,
  LogOut,
  Key
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { session, logout, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (session) {
      loadUserData();
    }
  }, [session]);

  const loadUserData = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      
      // Load profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (profileError) throw profileError;
      setUserProfile(profile);
      
      // Load employee details if user is an employee
      if (profile.role === 'employee') {
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (employeeError && employeeError.code !== 'PGRST116') {
          throw employeeError;
        }
        
        setEmployeeDetails(employee || null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    
    try {
      setPasswordLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordModalVisible(false);
      
      Alert.alert('Success', 'Password updated successfully');
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0069D9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {userProfile?.first_name?.[0]}{userProfile?.last_name?.[0]}
            </Text>
          </View>
          <Text style={styles.name}>
            {userProfile?.first_name} {userProfile?.last_name}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {userRole === 'admin' ? 'Administrator' : 'Employee'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoRow}>
            <User size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>
                {userProfile?.first_name} {userProfile?.last_name}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Mail size={20} color="#666" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userProfile?.email}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.passwordButton}
            onPress={() => setPasswordModalVisible(true)}
          >
            <Key size={16} color="#0069D9" />
            <Text style={styles.passwordButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        {employeeDetails && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Employment Details</Text>
            
            <View style={styles.infoRow}>
              <BriefcaseBusiness size={20} color="#666" style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Employee ID</Text>
                <Text style={styles.infoValue}>{employeeDetails.employee_id}</Text>
              </View>
            </View>
            
            {employeeDetails.department && (
              <View style={styles.infoRow}>
                <Building size={20} color="#666" style={styles.infoIcon} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Department</Text>
                  <Text style={styles.infoValue}>{employeeDetails.department}</Text>
                </View>
              </View>
            )}
            
            {employeeDetails.position && (
              <View style={styles.infoRow}>
                <BriefcaseBusiness size={20} color="#666" style={styles.infoIcon} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Position</Text>
                  <Text style={styles.infoValue}>{employeeDetails.position}</Text>
                </View>
              </View>
            )}
            
            {employeeDetails.join_date && (
              <View style={styles.infoRow}>
                <Calendar size={20} color="#666" style={styles.infoIcon} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Date Joined</Text>
                  <Text style={styles.infoValue}>
                    {new Date(employeeDetails.join_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {employeeDetails && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Salary Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.salaryLabel}>Basic Salary:</Text>
              <Text style={styles.salaryValue}>
                ${employeeDetails.basic_salary.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.salaryLabel}>Dearness Allowance (DA):</Text>
              <Text style={styles.salaryValue}>
                ${employeeDetails.da.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.salaryLabel}>House Rent Allowance (HRA):</Text>
              <Text style={styles.salaryValue}>
                ${employeeDetails.hra.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.salaryLabel}>Other Allowances:</Text>
              <Text style={styles.salaryValue}>
                ${employeeDetails.other_allowances.toFixed(2)}
              </Text>
            </View>
            
            <View style={[styles.infoRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Monthly Salary:</Text>
              <Text style={styles.totalValue}>
                ${(
                  employeeDetails.basic_salary +
                  employeeDetails.da +
                  employeeDetails.hra +
                  employeeDetails.other_allowances
                ).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LogOut size={20} color="#FFF" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {passwordModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.passwordModal}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <TextInput
              style={styles.passwordInput}
              placeholder="Current Password"
              placeholderTextColor="#888"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            
            <TextInput
              style={styles.passwordInput}
              placeholder="New Password"
              placeholderTextColor="#888"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm New Password"
              placeholderTextColor="#888"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleChangePassword}
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              >
                {passwordLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0069D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    color: '#FFFFFF',
  },
  name: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#333',
  },
  roleBadge: {
    backgroundColor: '#EFEFEF',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  roleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333',
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
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333',
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  passwordButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#0069D9',
    marginLeft: 8,
  },
  salaryLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  salaryValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  totalLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  totalValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#0069D9',
  },
  logoutButton: {
    backgroundColor: '#DC3545',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  passwordModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  passwordInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0069D9',
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
});