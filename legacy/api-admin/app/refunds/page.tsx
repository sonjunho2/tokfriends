'use client'
import React, { useEffect, useState } from 'react';

export default function Refunds() {
  const [items, setItems] = useState<any[]>([]);
  const [token, setToken] = useState('');
  const [form, setForm] = useState({ userId:'', platform:'ios', productId:'', receiptId:'', reason:'' });

  const load = async () => {
    const res = await fetch('http://localhost:4000/admin/refunds', { headers: token ? { 'Authorization': 'Bearer '+token } : {} });
    const data = await res.json();
    setItems(data);
  };
  const submit = async () => {
    const res = await fetch('http://localhost:4000/admin/refunds', { method: 'POST', headers: { 'Content-Type': 'application/json','Authorization':'Bearer '+token }, body: JSON.stringify(form) });
    if (res.ok) load();
  };
  const approve = async (id:string) => {
    await fetch(`http://localhost:4000/admin/refunds/${id}/approve`, { method: 'PATCH', headers: { 'Authorization':'Bearer '+token } });
    load();
  };
  const deny = async (id:string) => {
    await fetch(`http://localhost:4000/admin/refunds/${id}/deny`, { method: 'PATCH', headers: { 'Authorization':'Bearer '+token } });
    load();
  };

  useEffect(()=>{ load(); }, []);
  return (
    <main>
      <h1 className="text-xl font-semibold mb-2">환불 요청</h1>
      <input className="border px-2 py-1 rounded mr-2" placeholder="관리자 JWT" value={token} onChange={e=>setToken(e.target.value)} />
      <button onClick={load} className="px-3 py-1 bg-black text-white rounded">새로고침</button>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded shadow">
          <h2 className="font-medium">요청 생성</h2>
          {['userId','platform','productId','receiptId','reason'].map(k => (
            <input key={k} className="border px-2 py-1 rounded block w-full my-1" placeholder={k} value={(form as any)[k]} onChange={e=>setForm({...form, [k]:e.target.value})} />
          ))}
          <button onClick={submit} className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded">등록</button>
        </div>
        <div>
          {items.map(it => (
            <div key={it.id} className="bg-white p-3 rounded shadow mb-2">
              <div className="font-medium">#{it.id} — {it.status}</div>
              <div className="text-sm text-slate-600">{it.platform} · {it.productId}</div>
              <div className="mt-2 space-x-2">
                <button onClick={()=>approve(it.id)} className="px-3 py-1 bg-green-600 text-white rounded">승인</button>
                <button onClick={()=>deny(it.id)} className="px-3 py-1 bg-red-600 text-white rounded">거절</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
