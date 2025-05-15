import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Mail, User, Building, BriefcaseBusiness, Calendar, DollarSign, SaveIcon, Lock } from 'lucide-react-native';

export default function AddEmployeeScreen() {
  const router = useRouter();
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Profile info
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  
  // Employee details
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [joinDate, setJoinDate] = useState('');
  
  // Salary information
  const [basicSalary, setBasicSalary] = useState('');
  const [da, setDa] = useState('');
  const [hra, setHra] = useState('');
  const [otherAllowances, setOtherAllowances] = useState('');

  // Check if form is valid
  const isFormValid = () => {
    return (
      email.trim() !== '' &&
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      password.trim() !== '' &&
      employeeId.trim() !== '' &&
      basicSalary.trim() !== ''
    );
  };

  const handleSave = async () => {
    if (!isFormValid()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user account');
      
      const userId = authData.user.id;
      
      // Create profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          role: 'employee'
        });
        
      if (profileError) throw profileError;
      
      // Create employee details
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          id: userId,
          employee_id: employeeId,
          department,
          position,
          join_date: joinDate || null,
          basic_salary: parseFloat(basicSalary) || 0,
          da: parseFloat(da) || 0,
          hra: parseFloat(hra) || 0,
          other_allowances: parseFloat(otherAllowances) || 0
        });
        
      if (employeeError) throw employeeError;
      
      Alert.alert(
        'Success',
        'Employee added successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error adding employee:', error);
      Alert.alert('Error', error.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  // If not admin, redirect
  if (userRole !== 'admin') {
    router.replace('/(authenticated)/home');
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.inputContainer}>
          <Mail size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email *"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <User size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="First Name *"
            placeholderTextColor="#888"
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <User size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Last Name *"
            placeholderTextColor="#888"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Lock size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password *"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Employment Details</Text>
        
        <View style={styles.inputContainer}>
          <BriefcaseBusiness size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Employee ID *"
            placeholderTextColor="#888"
            value={employeeId}
            onChangeText={setEmployeeId}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Building size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Department"
            placeholderTextColor="#888"
            value={department}
            onChangeText={setDepartment}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <BriefcaseBusiness size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Position"
            placeholderTextColor="#888"
            value={position}
            onChangeText={setPosition}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Calendar size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Join Date (YYYY-MM-DD)"
            placeholderTextColor="#888"
            value={joinDate}
            onChangeText={setJoinDate}
          />
        </View>
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Salary Information</Text>
        
        <View style={styles.inputContainer}>
          <DollarSign size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Basic Salary *"
            placeholderTextColor="#888"
            value={basicSalary}
            onChangeText={setBasicSalary}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <DollarSign size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Dearness Allowance (DA)"
            placeholderTextColor="#888"
            value={da}
            onChangeText={setDa}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <DollarSign size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="House Rent Allowance (HRA)"
            placeholderTextColor="#888"
            value={hra}
            onChangeText={setHra}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <DollarSign size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Other Allowances"
            placeholderTextColor="#888"
            value={otherAllowances}
            onChangeText={setOtherAllowances}
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, !isFormValid() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading || !isFormValid()}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <SaveIcon size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>Save Employee</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.requiredNote}>
        <Text style={styles.requiredText}>* Required fields</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 0,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
    paddingRight: 12,
  },
  buttonContainer: {
    margin: 16,
  },
  saveButton: {
    backgroundColor: '#0069D9',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  saveButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  requiredNote: {
    margin: 16,
    marginTop: 0,
  },
  requiredText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});