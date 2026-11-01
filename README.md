# RSVP 초대장

모바일 초대장과 참석 응답(RSVP) 관리 페이지입니다.
Next.js 16 + [OpenNext](https://opennext.js.org/cloudflare)로 Cloudflare Workers에서 동작하며, 데이터는 D1, 이미지는 R2에 저장합니다.

## 구성

| 경로 | 설명 |
| --- | --- |
| `/` | 초대장. 참석/불참 응답, 같은 연락처로 다시 응답하면 수정 |
| `/admin` | 관리 페이지. 응답 목록·검색·CSV·삭제, 응답 마감, 문구·대표 이미지 변경 |
| `/media/*` | R2에 올린 이미지 제공 |
| `migrations/` | D1 스키마 |

## 로컬 개발

```bash
npm install
cp .dev.vars.example .dev.vars   # ADMIN_PASSWORD, SESSION_SECRET 설정
npm run db:migrate:local
npm run dev                      # http://localhost:3000
npm run preview                  # Workers 런타임으로 미리보기 (http://localhost:8787)
```

## 배포 (최초 1회 준비)

```bash
npx wrangler d1 create rsvp-db          # 출력된 database_id를 wrangler.jsonc에 넣기
npx wrangler r2 bucket create rsvp-media
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET  # openssl rand -base64 32
npm run db:migrate:remote
npm run deploy
```

이후 배포는 `npm run deploy`만 하면 됩니다. `wrangler.jsonc`를 바꾸면 `npm run cf-typegen`으로 타입을 다시 만드세요.
