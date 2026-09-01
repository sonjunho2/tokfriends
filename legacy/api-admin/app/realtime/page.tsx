'use client'
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function Realtime() {
  const [logs, setLogs] = useState<string[]>([]);
  useEffect(()=>{
    const s = io('http://localhost:4000', { transports: ['websocket'], auth: { token: 'dev' } });
    s.on('message:new', (data:any)=> setLogs(prev => [`msg:${data.msg?.id}`, ...prev].slice(0,200)));
    s.emit('join', { chatId: 'demo-chat' });
    return ()=>{ s.close(); }
  },[]);
  return (
    <main>
      <h1 className="text-xl font-semibold mb-2">실시간 모니터</h1>
      <ul className="text-sm">{logs.map((l,i)=>(<li key={i}>{l}</li>))}</ul>
    </main>
  );
}
