'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  PhoneCall,
  Percent,
  Timer,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface SystemSettingItem {
  key: string;
  value: string;
  description?: string | null;
  updatedAt?: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Core 3 Policy Settings
  const [defaultCallRate, setDefaultCallRate] = useState('1200');
  const [platformFeePercent, setPlatformFeePercent] = useState('30');
  const [snapshotIntervalSec, setSnapshotIntervalSec] = useState('20');

  // Full System Settings List
  const [settingsList, setSettingsList] = useState<SystemSettingItem[]>([]);

  // New Custom Setting Form
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/system-settings');
      const list: SystemSettingItem[] = res.data?.data || [];
      setSettingsList(list);

      // Extract core settings
      list.forEach((item) => {
        if (item.key === 'DEFAULT_CALL_RATE') setDefaultCallRate(item.value);
        if (item.key === 'PLATFORM_FEE_PERCENT') setPlatformFeePercent(item.value);
        if (item.key === 'SNAPSHOT_INTERVAL_SEC') setSnapshotIntervalSec(item.value);
      });
    } catch (err: any) {
      toast({
        title: '설정 조회 실패',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save 3 Core Policies Batch
  const handleSaveCorePolicies = async () => {
    setSaving(true);
    try {
      await api.put('/admin/system-settings', {
        settings: {
          DEFAULT_CALL_RATE: defaultCallRate,
          PLATFORM_FEE_PERCENT: platformFeePercent,
          SNAPSHOT_INTERVAL_SEC: snapshotIntervalSec,
        },
      });

      toast({
        title: '운영 정책 저장 완료',
        description: '1:1 통화 단가, 수수료율, AI 감시 주기가 실시간 백엔드 캐시에 즉시 반영되었습니다.',
      });
      fetchSettings();
    } catch (err: any) {
      toast({
        title: '정책 저장 실패',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Create or Update Individual Setting
  const handleUpsertItem = async (key: string, value: string, description?: string) => {
    try {
      await api.post('/admin/system-settings', { key, value, description });
      toast({
        title: '설정 저장 완료',
        description: `[${key}] 항목이 업데이트되었습니다.`,
      });
      fetchSettings();
    } catch (err: any) {
      toast({
        title: '저장 실패',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    }
  };

  // Delete Setting
  const handleDeleteItem = async (key: string) => {
    if (!confirm(`'${key}' 설정을 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/admin/system-settings/${key}`);
      toast({
        title: '설정 삭제 완료',
        description: `[${key}] 설정이 삭제되었습니다.`,
      });
      fetchSettings();
    } catch (err: any) {
      toast({
        title: '삭제 실패',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    }
  };

  // Add New Custom Setting
  const handleAddCustomSetting = async () => {
    if (!newKey.trim() || !newValue.trim()) {
      toast({ title: '키와 값을 모두 입력하세요.', variant: 'destructive' });
      return;
    }
    await handleUpsertItem(newKey.trim(), newValue.trim(), newDesc.trim());
    setNewKey('');
    setNewValue('');
    setNewDesc('');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 rounded-xl">
              <Settings className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                운영 정책 및 시스템 동적 설정
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                실서비스 런타임에 직접 동기화되는 핵심 비즈니스 파라미터 및 SystemSetting CRUD 콘솔
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button
            size="sm"
            onClick={handleSaveCorePolicies}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
          >
            <Save className="w-4 h-4" />
            {saving ? '반영 중...' : '핵심 정책 일괄 저장'}
          </Button>
        </div>
      </div>

      {/* 3대 핵심 정책 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. 1:1 통화 기본 단가 */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <PhoneCall className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                선차감 과금
              </span>
            </div>
            <CardTitle className="text-lg font-bold mt-3">1:1 통화 기본 분당 단가</CardTitle>
            <CardDescription>
              호스트 자율 단가 미설정 시 적용되는 시스템 기본 분당 요율
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="defaultCallRate" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                분당 포인트 (ON)
              </Label>
              <div className="relative">
                <Input
                  id="defaultCallRate"
                  type="number"
                  value={defaultCallRate}
                  onChange={(e) => setDefaultCallRate(e.target.value)}
                  className="font-bold text-lg pr-12"
                  placeholder="1200"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">ON/분</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              * 통화 수락 시 첫 1분 즉시 선차감 후 매 60초마다 자동 차감됩니다.
            </p>
          </CardContent>
        </Card>

        {/* 2. 플랫폼 수수료율 */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Percent className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                수수료 정책
              </span>
            </div>
            <CardTitle className="text-lg font-bold mt-3">플랫폼 수수료율</CardTitle>
            <CardDescription>
              1:1 통화 과금 발생 시 플랫폼 수취 비율
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="platformFeePercent" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                수수료 비율 (%)
              </Label>
              <div className="relative">
                <Input
                  id="platformFeePercent"
                  type="number"
                  min="0"
                  max="100"
                  value={platformFeePercent}
                  onChange={(e) => setPlatformFeePercent(e.target.value)}
                  className="font-bold text-lg pr-8"
                  placeholder="30"
                />
                <span className="absolute right-3 top-2.5 text-sm font-bold text-slate-400">%</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              * 예: {defaultCallRate} ON 통화 시 플랫폼 수취: {Math.floor((parseInt(defaultCallRate || '0') * parseInt(platformFeePercent || '0')) / 100)} ON / 크리에이터: {parseInt(defaultCallRate || '0') - Math.floor((parseInt(defaultCallRate || '0') * parseInt(platformFeePercent || '0')) / 100)} ON
            </p>
          </CardContent>
        </Card>

        {/* 3. 실시간 AI 감시 주기 */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg">
                <Timer className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                Gemini Vision
              </span>
            </div>
            <CardTitle className="text-lg font-bold mt-3">실시간 감시 주기</CardTitle>
            <CardDescription>
              아고라 스트림 스냅샷 캡처 및 AI 판정 주기
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="snapshotIntervalSec" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                평시 캡처 주기 (초)
              </Label>
              <div className="relative">
                <Input
                  id="snapshotIntervalSec"
                  type="number"
                  value={snapshotIntervalSec}
                  onChange={(e) => setSnapshotIntervalSec(e.target.value)}
                  className="font-bold text-lg pr-10"
                  placeholder="20"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">초</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              * 유해/의심 행동(위험도 60점 이상) 포착 시 자동으로 <strong className="text-rose-500">5초 주기</strong>로 긴급 단축됩니다.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 전체 SystemSetting 테이블 CRUD 섹션 */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                전체 시스템 파라미터 (SystemSetting CRUD)
              </CardTitle>
              <CardDescription>
                데이터베이스에 영구 보관되며 백엔드 인메모리 캐시와 실시간 동기화되는 설정 테이블
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Settings Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                  <th className="py-3 px-4">설정 키 (Key)</th>
                  <th className="py-3 px-4">설정 값 (Value)</th>
                  <th className="py-3 px-4">설명 (Description)</th>
                  <th className="py-3 px-4 text-right">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {settingsList.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {item.key}
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        defaultValue={item.value}
                        onBlur={(e) => {
                          if (e.target.value !== item.value) {
                            handleUpsertItem(item.key, e.target.value, item.description || '');
                          }
                        }}
                        className="h-8 max-w-xs font-semibold text-xs"
                      />
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {item.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.key)}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {settingsList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      등록된 설정이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* New Setting Add Form */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              새 시스템 설정 추가
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Key (영문 대문자 권장)</Label>
                <Input
                  placeholder="예: CHAT_MAX_LENGTH"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Value</Label>
                <Input
                  placeholder="예: 500"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Description (선택)</Label>
                <Input
                  placeholder="예: 채팅 최대 글자 수"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleAddCustomSetting} className="bg-slate-800 hover:bg-slate-900 text-white text-xs">
                설정 추가
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
