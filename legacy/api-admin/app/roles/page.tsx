'use client'
import React, { useState } from 'react';

export default function RolesPage() {
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('moderator');

  const submit = async () => {
    await fetch(`http://localhost:4000/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ role })
    });
    alert('updated');
  };

  return (
    <main>
      <h1 className="text-xl font-semibold mb-2">역할 변경</h1>
      <input className="border px-2 py-1 rounded mr-2" placeholder="관리자 JWT" value={token} onChange={e=>setToken(e.target.value)} />
      <div className="mt-2">
        <input className="border px-2 py-1 rounded mr-2" placeholder="userId" value={userId} onChange={e=>setUserId(e.target.value)} />
        <select className="border px-2 py-1 rounded mr-2" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="user">user</option>
          <option value="moderator">moderator</option>
          <option value="admin">admin</option>
        </select>
        <button onClick={submit} className="px-3 py-1 bg-indigo-600 text-white rounded">저장</button>
      </div>
    </main>
  );
}
