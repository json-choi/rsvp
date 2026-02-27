'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getRSVPs,
  updateLandingImage,
  getLandingImage,
  getTextSettings,
  updateTextSettings,
} from './adminActions';
import { TEXT_SETTING_KEYS, TEXT_SETTING_LABELS } from './textSettingsConfig';
import { supabase } from '@/lib/supabase';

type RSVP = {
  id: number;
  name: string;
  phone: string;
  attending: boolean | null;
  created_at: string | null;
};

export default function AdminPage() {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>('');
  const [textSettings, setTextSettings] = useState<Record<string, string>>({});
  const [savingText, setSavingText] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const [rsvpData, imageData, textData] = await Promise.all([
          getRSVPs(),
          getLandingImage(),
          getTextSettings(),
        ]);
        setRsvps(rsvpData ?? []);
        setCurrentImage(imageData);
        setTextSettings(textData);
        setLoading(false);
      } catch {
        router.push('/admin/login');
      }
    }
    fetchData();
  }, [router]);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `landing-${Date.now()}.${fileExt}`;
    const filePath = `images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('invitation-assets')
      .upload(filePath, file);

    if (uploadError) {
      alert('Error uploading image!');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('invitation-assets')
      .getPublicUrl(filePath);

    const result = await updateLandingImage(publicUrl);
    if (result.success) {
      setCurrentImage(publicUrl);
      alert('이미지가 업데이트 됐어요!');
    }
    setUploading(false);
  };

  const handleSaveText = async () => {
    setSavingText(true);
    try {
      await updateTextSettings(textSettings);
      alert('저장됐어요!');
    } catch {
      alert('저장 실패');
    }
    setSavingText(false);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>Loading...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Admin Dashboard</h1>
        <button
          onClick={() => {
            document.cookie = 'admin_session=; Max-Age=0; path=/;';
            router.push('/admin/login');
          }}
          style={{ padding: '8px 16px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>

      {/* 텍스트 설정 */}
      <section style={{ marginBottom: '50px', background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '20px' }}>문구 설정</h2>
        <div style={{ display: 'grid', gap: '16px' }}>
          {TEXT_SETTING_KEYS.map(key => (
            <div key={key}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: '#555', fontWeight: 600 }}>
                {TEXT_SETTING_LABELS[key]}
              </label>
              <input
                type="text"
                value={textSettings[key] ?? ''}
                onChange={e => setTextSettings(prev => ({ ...prev, [key]: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSaveText}
          disabled={savingText}
          style={{
            marginTop: '20px',
            padding: '10px 24px',
            background: '#2c3e50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          {savingText ? '저장 중...' : '저장'}
        </button>
      </section>

      {/* 이미지 설정 */}
      <section style={{ marginBottom: '50px', background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        <h2>랜딩 이미지 설정</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginTop: '15px' }}>
          <div>
            <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>현재 이미지:</p>
            <img src={currentImage} alt="Current Landing" style={{ width: '150px', borderRadius: '8px', border: '1px solid #ddd' }} />
          </div>
          <div>
            <p style={{ marginBottom: '10px' }}>새 이미지 업로드:</p>
            <input type="file" accept="image/*" onChange={handleUploadImage} disabled={uploading} />
            {uploading && <p style={{ marginTop: '10px', color: '#2c3e50' }}>업로드 중...</p>}
            <p style={{ marginTop: '10px', fontSize: '0.8rem', color: '#888' }}>
              Supabase에 'invitation-assets' public 버킷이 필요해요.
            </p>
          </div>
        </div>
      </section>

      {/* RSVP 목록 */}
      <section>
        <h2>RSVP 목록 ({rsvps.length}명)</h2>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          marginTop: '15px',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f7f6', textAlign: 'left' }}>
              <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>이름</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>연락처</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>참석 여부</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>등록일</th>
            </tr>
          </thead>
          <tbody>
            {rsvps.map((rsvp) => (
              <tr key={rsvp.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px' }}>{rsvp.name}</td>
                <td style={{ padding: '15px' }}>{rsvp.phone}</td>
                <td style={{ padding: '15px' }}>{rsvp.attending ? '✅ 참석' : '❌ 불참'}</td>
                <td style={{ padding: '15px', fontSize: '0.85rem', color: '#888' }}>
                  {rsvp.created_at ? new Date(rsvp.created_at).toLocaleString('ko-KR') : '-'}
                </td>
              </tr>
            ))}
            {rsvps.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>아직 응답이 없어요.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
