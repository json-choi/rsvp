import 'server-only';
import { getEnv } from './cf';
import {
  DEFAULT_LANDING_IMAGE,
  TEXT_DEFAULTS,
  TEXT_KEYS,
  type SiteSettings,
  type TextKey,
} from './settings';

export type Rsvp = {
  id: number;
  name: string;
  phone: string;
  attending: boolean;
  created_at: string;
  updated_at: string;
};

type RsvpRow = Omit<Rsvp, 'attending'> & { attending: number };

const LANDING_IMAGE_KEY = 'landing_image';
const RSVP_OPEN_KEY = 'rsvp_open';

export async function getSiteSettings(): Promise<SiteSettings> {
  const { DB } = await getEnv();
  const { results } = await DB.prepare('SELECT key, value FROM settings').all<{
    key: string;
    value: string;
  }>();
  const map = new Map(results.map((r) => [r.key, r.value]));

  const texts = { ...TEXT_DEFAULTS };
  for (const key of TEXT_KEYS) {
    const v = map.get(key);
    if (v !== undefined) texts[key] = v;
  }

  return {
    texts,
    landingImage: map.get(LANDING_IMAGE_KEY) || DEFAULT_LANDING_IMAGE,
    rsvpOpen: map.get(RSVP_OPEN_KEY) !== '0',
  };
}

async function putSettings(entries: [string, string][]) {
  if (entries.length === 0) return;
  const { DB } = await getEnv();
  const stmt = DB.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  );
  await DB.batch(entries.map(([k, v]) => stmt.bind(k, v)));
}

export async function saveTexts(texts: Partial<Record<TextKey, string>>) {
  await putSettings(Object.entries(texts) as [string, string][]);
}

export async function saveLandingImage(url: string) {
  await putSettings([[LANDING_IMAGE_KEY, url]]);
}

export async function saveRsvpOpen(open: boolean) {
  await putSettings([[RSVP_OPEN_KEY, open ? '1' : '0']]);
}

/** 같은 연락처면 갱신하고, 새로 만든 응답인지 여부를 돌려준다. */
export async function upsertRsvp(input: { name: string; phone: string; attending: boolean }) {
  const { DB } = await getEnv();
  const row = await DB.prepare(
    `INSERT INTO rsvps (name, phone, attending) VALUES (?1, ?2, ?3)
     ON CONFLICT(phone) DO UPDATE SET
       name = excluded.name,
       attending = excluded.attending,
       updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
     RETURNING created_at = updated_at AS is_new`,
  )
    .bind(input.name, input.phone, input.attending ? 1 : 0)
    .first<{ is_new: number }>();
  return { isNew: row?.is_new === 1 };
}

export async function listRsvps(): Promise<Rsvp[]> {
  const { DB } = await getEnv();
  const { results } = await DB.prepare(
    'SELECT id, name, phone, attending, created_at, updated_at FROM rsvps ORDER BY created_at DESC, id DESC',
  ).all<RsvpRow>();
  return results.map((r) => ({ ...r, attending: r.attending === 1 }));
}

export async function deleteRsvp(id: number) {
  const { DB } = await getEnv();
  await DB.prepare('DELETE FROM rsvps WHERE id = ?1').bind(id).run();
}
