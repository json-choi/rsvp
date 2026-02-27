'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRSVPs, updateLandingImage, getLandingImage } from './adminActions';
import { supabase } from '@/lib/supabase';

type RSVP = {
  id: number;
  name: string;
  phone: string;
  attending: boolean | null;
  createdAt: Date | null;
};

export default function AdminPage() {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const [rsvpData, imageData] = await Promise.all([getRSVPs(), getLandingImage()]);
        setRsvps(rsvpData);
        setCurrentImage(imageData);
        setLoading(false);
      } catch (error) {
        console.error('Fetch data failed:', error);
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

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('invitation-assets')
      .upload(filePath, file);

    if (uploadError) {
      alert('Error uploading image!');
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('invitation-assets')
      .getPublicUrl(filePath);

    // Save to DB
    const result = await updateLandingImage(publicUrl);
    if (result.success) {
      setCurrentImage(publicUrl);
      alert('Image updated successfully!');
    }
    setUploading(false);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>Loading...</div>;

  return (
    <div style={{
      padding: '40px',
      maxWidth: '1000px',
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: '#fff'
    }}>
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

      <section style={{ marginBottom: '50px', background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        <h2>Landing Image Settings</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginTop: '15px' }}>
          <div>
            <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>Current Image Preview:</p>
            <img src={currentImage} alt="Current Landing" style={{ width: '150px', borderRadius: '8px', border: '1px solid #ddd' }} />
          </div>
          <div>
            <p style={{ marginBottom: '10px' }}>Upload New Image:</p>
            <input type="file" accept="image/*" onChange={handleUploadImage} disabled={uploading} />
            {uploading && <p style={{ marginTop: '10px', color: '#2c3e50' }}>Uploading...</p>}
            <p style={{ marginTop: '10px', fontSize: '0.8rem', color: '#888' }}>
              Note: Requires a 'invitation-assets' public bucket in Supabase.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2>RSVP List</h2>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          marginTop: '15px',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f7f6', textAlign: 'left' }}>
              <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>Name</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>Phone</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>Attending</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {rsvps.map((rsvp) => (
              <tr key={rsvp.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px' }}>{rsvp.name}</td>
                <td style={{ padding: '15px' }}>{rsvp.phone}</td>
                <td style={{ padding: '15px' }}>{rsvp.attending ? '✅ Yes' : '❌ No'}</td>
                <td style={{ padding: '15px', fontSize: '0.85rem', color: '#888' }}>
                  {rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleString() : '-'}
                </td>
              </tr>
            ))}
            {rsvps.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>No responses yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
