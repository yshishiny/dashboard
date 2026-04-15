import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const userEmail = 'shishiny@gmail.com';
  const { data: users } = await admin.auth.admin.listUsers();
  const user = users.users.find(u => u.email === userEmail);
  
  if (!user) return console.log('User not found');
  
  // To impersonate the user, we can't easily generate a JWT via admin unless we use custom function.
  // Let's just use the admin key to insert a row with their owner_id. IF that succeeds, we know schema is fine.
  const { data: insertData, error: insertError } = await admin.from('pillars').insert([{
    title: "Test Pillar",
    objective: "Test Objective",
    target: "Test Target",
    due_date: "2026-12-31",
    owner_id: user.id
  }]).select().single();
  
  console.log('Insert Result:', insertError || insertData);
}
run();
