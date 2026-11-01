import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import { getEnv } from '@/lib/cf';
import { getSiteSettings, saveLandingImage } from '@/lib/db';
import { DEFAULT_LANDING_IMAGE } from '@/lib/settings';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

async function removeOldObject(url: string) {
  if (!url.startsWith('/media/')) return;
  const { MEDIA } = await getEnv();
  await MEDIA.delete(url.slice('/media/'.length)).catch(() => {});
}

/** 새 랜딩 이미지를 R2에 올리고 설정을 바꾼다. */
export async function POST(req: Request) {
  if (!(await isAuthenticated())) return json({ error: '로그인이 필요해요.' }, 401);

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return json({ error: '이미지 파일을 선택해 주세요.' }, 400);
  const ext = ALLOWED[file.type];
  if (!ext) return json({ error: 'JPG, PNG, WEBP, GIF, AVIF 이미지만 올릴 수 있어요.' }, 400);
  if (file.size > MAX_BYTES) return json({ error: '10MB 이하 이미지만 올릴 수 있어요.' }, 400);

  const { MEDIA } = await getEnv();
  const key = `landing/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  await MEDIA.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const { landingImage: previous } = await getSiteSettings();
  const url = `/media/${key}`;
  await saveLandingImage(url);
  await removeOldObject(previous);
  revalidatePath('/');
  return json({ url });
}

/** 기본 이미지로 되돌린다. */
export async function DELETE() {
  if (!(await isAuthenticated())) return json({ error: '로그인이 필요해요.' }, 401);
  const { landingImage: previous } = await getSiteSettings();
  await saveLandingImage(DEFAULT_LANDING_IMAGE);
  await removeOldObject(previous);
  revalidatePath('/');
  return json({ url: DEFAULT_LANDING_IMAGE });
}
