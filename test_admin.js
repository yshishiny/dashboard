fetch('http://localhost:3000/api/admin/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'password123', full_name: 'Test' })
}).then(r => r.json()).then(console.log).catch(console.error);
