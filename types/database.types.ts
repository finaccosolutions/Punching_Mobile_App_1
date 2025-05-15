export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          role?: string
          created_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          employee_id: string
          department: string | null
          position: string | null
          join_date: string | null
          basic_salary: number
          da: number
          hra: number
          other_allowances: number
          created_at: string
        }
        Insert: {
          id: string
          employee_id: string
          department?: string | null
          position?: string | null
          join_date?: string | null
          basic_salary?: number
          da?: number
          hra?: number
          other_allowances?: number
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          department?: string | null
          position?: string | null
          join_date?: string | null
          basic_salary?: number
          da?: number
          hra?: number
          other_allowances?: number
          created_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          employee_id: string
          punch_in_time: string | null
          punch_in_location: Json | null
          punch_out_time: string | null
          punch_out_location: Json | null
          total_hours: number | null
          is_field_visit: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          punch_in_time?: string | null
          punch_in_location?: Json | null
          punch_out_time?: string | null
          punch_out_location?: Json | null
          total_hours?: number | null
          is_field_visit?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          punch_in_time?: string | null
          punch_in_location?: Json | null
          punch_out_time?: string | null
          punch_out_location?: Json | null
          total_hours?: number | null
          is_field_visit?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      payroll: {
        Row: {
          id: string
          employee_id: string
          month: number
          year: number
          days_worked: number
          basic_salary: number
          da_amount: number
          hra_amount: number
          other_allowances: number
          gross_salary: number
          deductions: number
          net_salary: number
          status: string
          created_at: string
          processed_at: string | null
          processed_by: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          month: number
          year: number
          days_worked?: number
          basic_salary?: number
          da_amount?: number
          hra_amount?: number
          other_allowances?: number
          gross_salary?: number
          deductions?: number
          net_salary?: number
          status?: string
          created_at?: string
          processed_at?: string | null
          processed_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          month?: number
          year?: number
          days_worked?: number
          basic_salary?: number
          da_amount?: number
          hra_amount?: number
          other_allowances?: number
          gross_salary?: number
          deductions?: number
          net_salary?: number
          status?: string
          created_at?: string
          processed_at?: string | null
          processed_by?: string | null
        }
      }
    }
  }
}