/*
  # Initial Schema Setup

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `role` (text, either 'admin' or 'employee')
      - `created_at` (timestamp)
    - `employees`
      - `id` (uuid, primary key, references profiles.id)
      - `employee_id` (text, unique)
      - `department` (text)
      - `position` (text)
      - `join_date` (date)
      - `basic_salary` (numeric)
      - `da` (numeric - Dearness Allowance)
      - `hra` (numeric - House Rent Allowance)
      - `other_allowances` (numeric)
      - `created_at` (timestamp)
    - `attendance`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references profiles.id)
      - `punch_in_time` (timestamp)
      - `punch_in_location` (json with latitude, longitude)
      - `punch_out_time` (timestamp)
      - `punch_out_location` (json with latitude, longitude)
      - `total_hours` (numeric)
      - `is_field_visit` (boolean)
      - `notes` (text)
      - `created_at` (timestamp)
    - `payroll`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references profiles.id)
      - `month` (integer)
      - `year` (integer)
      - `days_worked` (numeric)
      - `basic_salary` (numeric)
      - `da_amount` (numeric)
      - `hra_amount` (numeric)
      - `other_allowances` (numeric)
      - `gross_salary` (numeric)
      - `deductions` (numeric)
      - `net_salary` (numeric)
      - `status` (text - pending, processed, paid)
      - `created_at` (timestamp)
      - `processed_at` (timestamp)
      - `processed_by` (uuid, references profiles.id)
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  role text CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
  created_at timestamptz DEFAULT now()
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id text UNIQUE NOT NULL,
  department text,
  position text,
  join_date date,
  basic_salary numeric(10, 2) DEFAULT 0,
  da numeric(10, 2) DEFAULT 0,
  hra numeric(10, 2) DEFAULT 0,
  other_allowances numeric(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  punch_in_time timestamptz,
  punch_in_location jsonb,
  punch_out_time timestamptz,
  punch_out_location jsonb,
  total_hours numeric(5, 2),
  is_field_visit boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create payroll table
CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  month integer CHECK (month BETWEEN 1 AND 12),
  year integer,
  days_worked numeric(5, 2) DEFAULT 0,
  basic_salary numeric(10, 2) DEFAULT 0,
  da_amount numeric(10, 2) DEFAULT 0,
  hra_amount numeric(10, 2) DEFAULT 0,
  other_allowances numeric(10, 2) DEFAULT 0,
  gross_salary numeric(10, 2) DEFAULT 0,
  deductions numeric(10, 2) DEFAULT 0,
  net_salary numeric(10, 2) DEFAULT 0,
  status text CHECK (status IN ('pending', 'processed', 'paid')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES profiles(id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Admins can see all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (role = 'admin');

CREATE POLICY "Users can see their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Create policies for employees
CREATE POLICY "Admins can manage employees"
  ON employees
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Employees can see their own details"
  ON employees
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Create policies for attendance
CREATE POLICY "Admins can see all attendance"
  ON attendance
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Employees can see their own attendance"
  ON attendance
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Employees can insert their own attendance"
  ON attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update their own attendance"
  ON attendance
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid());

-- Create policies for payroll
CREATE POLICY "Admins can manage payroll"
  ON payroll
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Employees can see their own payroll"
  ON payroll
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());