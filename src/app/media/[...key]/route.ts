import { getEnv } from '@/lib/cf';

export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params;
  const objectKey = key.map(decodeURIComponent).join('/');
  if (!objectKey || objectKey.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  const { MEDIA } = await getEnv();
  const object = await MEDIA.get(objectKey);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  // 업로드할 때마다 새 키를 쓰므로 오래 캐시해도 된다.
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}
