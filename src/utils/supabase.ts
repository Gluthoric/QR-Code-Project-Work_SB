import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xbuiunafhcscvjftnvxr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhidWl1bmFmaGNzY3ZqZnRudnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2NzQxMjQsImV4cCI6MjA0MjI1MDEyNH0.4VWt4sw7XIu0qeS7H_TgClk60sQ7HJk9dVIc_ERvlyU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);