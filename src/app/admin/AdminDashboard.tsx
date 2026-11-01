'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  Check,
  Download,
  ExternalLink,
  ImageUp,
  LogOut,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { Rsvp } from '@/lib/db';
import {
  DEFAULT_LANDING_IMAGE,
  TEXT_FIELDS,
  TEXT_GROUPS,
  TEXT_MAX_LENGTH,
  type SiteSettings,
  type TextSettings,
} from '@/lib/settings';
import {
  deleteRsvpAction,
  logoutAction,
  refreshRsvpsAction,
  saveTextsAction,
  setRsvpOpenAction,
} from './actions';
import styles from './admin.module.css';

type Toast = { id: number; kind: 'success' | 'error'; message: string };
type Tab = 'responses' | 'texts' | 'image';
type Filter = 'all' | 'yes' | 'no';

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : dateFormatter.format(d);
}

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const push = (kind: Toast['kind'], message: string) => {
    const id = ++nextId.current;
    setToasts((t) => [...t, { id, kind, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };
  return { toasts, push };
}

export default function AdminDashboard({
  initialSettings,
  initialRsvps,
}: {
  initialSettings: SiteSettings;
  initialRsvps: Rsvp[];
}) {
  const [tab, setTab] = useState<Tab>('responses');
  const [rsvps, setRsvps] = useState(initialRsvps);
  const [rsvpOpen, setRsvpOpen] = useState(initialSettings.rsvpOpen);
  const [savedTexts, setSavedTexts] = useState(initialSettings.texts);
  const [landingImage, setLandingImage] = useState(initialSettings.landingImage);
  const [togglePending, startToggle] = useTransition();
  const { toasts, push } = useToasts();

  const stats = useMemo(() => {
    const yes = rsvps.filter((r) => r.attending).length;
    return { total: rsvps.length, yes, no: rsvps.length - yes };
  }, [rsvps]);

  const toggleOpen = () => {
    const next = !rsvpOpen;
    startToggle(async () => {
      const res = await setRsvpOpenAction(next);
      if (res.ok) {
        setRsvpOpen(next);
        push('success', next ? '응답을 다시 받아요.' : '응답을 마감했어요.');
      } else push('error', res.error);
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'responses', label: `응답 ${stats.total}` },
    { id: 'texts', label: '초대장 문구' },
    { id: 'image', label: '대표 이미지' },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.brand}>초대장 관리</h1>
          <div className={styles.headerActions}>
            <a href="/" target="_blank" rel="noopener noreferrer" className={styles.ghostButton} aria-label="초대장 보기">
              <ExternalLink size={16} aria-hidden />
              <span>초대장 보기</span>
            </a>
            <form action={logoutAction}>
              <button type="submit" className={styles.ghostButton} aria-label="로그아웃">
                <LogOut size={16} aria-hidden />
                <span>로그아웃</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.overview} aria-label="요약">
          <div className={styles.statGrid}>
            <Stat label="전체 응답" value={stats.total} />
            <Stat label="참석" value={stats.yes} tone="yes" />
            <Stat label="불참" value={stats.no} tone="no" />
          </div>
          <div className={styles.openCard}>
            <div>
              <p className={styles.openTitle}>응답 받기</p>
              <p className={styles.openSub}>{rsvpOpen ? '지금 응답을 받고 있어요' : '응답이 마감된 상태예요'}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={rsvpOpen}
              aria-label="응답 받기"
              className={`${styles.switch} ${rsvpOpen ? styles.switchOn : ''}`}
              onClick={toggleOpen}
              disabled={togglePending}
            >
              <span className={styles.switchThumb} />
            </button>
          </div>
        </section>

        <nav className={styles.tabs} role="tablist" aria-label="관리 메뉴">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div role="tabpanel">
          {tab === 'responses' && <ResponsesPanel rsvps={rsvps} setRsvps={setRsvps} toast={push} />}
          {tab === 'texts' && (
            <TextsPanel saved={savedTexts} onSaved={setSavedTexts} landingImage={landingImage} toast={push} />
          )}
          {tab === 'image' && <ImagePanel current={landingImage} onChange={setLandingImage} toast={push} />}
        </div>
      </main>

      <div className={styles.toastStack} aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${t.kind === 'error' ? styles.toastError : ''}`}>
            {t.kind === 'success' ? <Check size={16} aria-hidden /> : <X size={16} aria-hidden />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'yes' | 'no' }) {
  return (
    <div className={styles.stat}>
      <p className={styles.statLabel}>
        {tone && <span className={`${styles.dot} ${tone === 'yes' ? styles.dotYes : styles.dotNo}`} />}
        {label}
      </p>
      <p className={styles.statValue}>{value.toLocaleString('ko-KR')}</p>
    </div>
  );
}

/* ───────── 응답 목록 ───────── */

function ResponsesPanel({
  rsvps,
  setRsvps,
  toast,
}: {
  rsvps: Rsvp[];
  setRsvps: (r: Rsvp[] | ((prev: Rsvp[]) => Rsvp[])) => void;
  toast: (kind: Toast['kind'], message: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const [, startDelete] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    return rsvps.filter((r) => {
      if (filter === 'yes' && !r.attending) return false;
      if (filter === 'no' && r.attending) return false;
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || (qDigits !== '' && r.phone.replace(/\D/g, '').includes(qDigits));
    });
  }, [rsvps, query, filter]);

  const refresh = () =>
    startRefresh(async () => {
      try {
        setRsvps(await refreshRsvpsAction());
        toast('success', '최신 응답을 불러왔어요.');
      } catch {
        toast('error', '불러오지 못했어요. 다시 로그인해 주세요.');
      }
    });

  const remove = (id: number) => {
    setConfirmId(null);
    startDelete(async () => {
      const res = await deleteRsvpAction(id);
      if (res.ok) {
        setRsvps((prev) => prev.filter((r) => r.id !== id));
        toast('success', '응답을 삭제했어요.');
      } else toast('error', res.error);
    });
  };

  const downloadCsv = () => {
    const header = ['이름', '연락처', '참석 여부', '최초 응답', '최근 수정'];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = visible.map((r) =>
      [r.name, r.phone, r.attending ? '참석' : '불참', formatDate(r.created_at), formatDate(r.updated_at)]
        .map(escape)
        .join(','),
    );
    // 엑셀에서 한글이 깨지지 않도록 BOM을 붙인다.
    const blob = new Blob(['﻿' + [header.join(','), ...lines].join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rsvp-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} aria-hidden />
          <input
            type="search"
            placeholder="이름 또는 연락처 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="응답 검색"
          />
        </div>
        <div className={styles.segment} role="group" aria-label="참석 여부 필터">
          {(
            [
              ['all', '전체'],
              ['yes', '참석'],
              ['no', '불참'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              className={filter === id ? styles.segmentActive : ''}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.toolbarActions}>
          <button type="button" className={styles.iconButton} onClick={refresh} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? styles.spin : ''} aria-hidden />
            <span>새로고침</span>
          </button>
          <button type="button" className={styles.iconButton} onClick={downloadCsv} disabled={visible.length === 0}>
            <Download size={16} aria-hidden />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          {rsvps.length === 0 ? '아직 받은 응답이 없어요.' : '조건에 맞는 응답이 없어요.'}
        </div>
      ) : (
        <ul className={styles.rsvpList}>
          <li className={`${styles.rsvpRow} ${styles.rsvpHead}`} aria-hidden>
            <span>이름</span>
            <span>연락처</span>
            <span>참석 여부</span>
            <span>응답 시각</span>
            <span />
          </li>
          {visible.map((r) => (
            <li key={r.id} className={styles.rsvpRow}>
              <span className={styles.rsvpName}>{r.name}</span>
              <a href={`tel:${r.phone.replace(/\D/g, '')}`} className={styles.rsvpPhone}>
                {r.phone}
              </a>
              <span>
                <span className={`${styles.badge} ${r.attending ? styles.badgeYes : styles.badgeNo}`}>
                  {r.attending ? '참석' : '불참'}
                </span>
              </span>
              <span className={styles.rsvpDate} title={r.updated_at !== r.created_at ? `수정 ${formatDate(r.updated_at)}` : undefined}>
                {formatDate(r.created_at)}
                {r.updated_at !== r.created_at && <em> · 수정됨</em>}
              </span>
              <span className={styles.rsvpActions}>
                {confirmId === r.id ? (
                  <>
                    <button type="button" className={styles.dangerButton} onClick={() => remove(r.id)}>
                      삭제
                    </button>
                    <button type="button" className={styles.textButton} onClick={() => setConfirmId(null)}>
                      취소
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={styles.iconOnly}
                    onClick={() => setConfirmId(r.id)}
                    aria-label={`${r.name} 응답 삭제`}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ───────── 문구 설정 ───────── */

function TextsPanel({
  saved,
  onSaved,
  landingImage,
  toast,
}: {
  saved: TextSettings;
  onSaved: (t: TextSettings) => void;
  landingImage: string;
  toast: (kind: Toast['kind'], message: string) => void;
}) {
  const [draft, setDraft] = useState(saved);
  const [pending, startSave] = useTransition();
  const dirty = TEXT_FIELDS.some((f) => draft[f.key] !== saved[f.key]);

  // 저장하지 않은 변경이 있으면 페이지를 떠나기 전에 경고한다.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const save = () =>
    startSave(async () => {
      const res = await saveTextsAction(draft);
      if (res.ok) {
        const trimmed = Object.fromEntries(
          Object.entries(draft).map(([k, v]) => [k, v.trim()]),
        ) as TextSettings;
        setDraft(trimmed);
        onSaved(trimmed);
        toast('success', '문구를 저장했어요.');
      } else toast('error', res.error);
    });

  return (
    <section className={styles.textsLayout}>
      <div className={styles.panel}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          {TEXT_GROUPS.map((group) => (
            <fieldset key={group.id} className={styles.fieldGroup}>
              <legend className={styles.groupTitle}>{group.title}</legend>
              {TEXT_FIELDS.filter((f) => f.group === group.id).map((f) => (
                <div key={f.key} className={styles.field}>
                  <label htmlFor={`text-${f.key}`} className={styles.fieldLabel}>
                    {f.label}
                  </label>
                  <input
                    id={`text-${f.key}`}
                    type={f.key === 'event_map_url' ? 'url' : 'text'}
                    className={styles.input}
                    value={draft[f.key]}
                    placeholder={f.placeholder}
                    maxLength={TEXT_MAX_LENGTH}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  />
                  {'hint' in f && <p className={styles.fieldHint}>{f.hint}</p>}
                </div>
              ))}
            </fieldset>
          ))}

          <div className={`${styles.saveBar} ${dirty ? styles.saveBarDirty : ''}`}>
            <span>{dirty ? '저장하지 않은 변경이 있어요' : '모든 변경이 저장됐어요'}</span>
            <div className={styles.saveBarActions}>
              <button type="button" className={styles.textButton} onClick={() => setDraft(saved)} disabled={!dirty || pending}>
                되돌리기
              </button>
              <button type="submit" className={styles.primaryButton} disabled={!dirty || pending}>
                {pending ? '저장 중…' : '저장'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <aside className={styles.previewWrap} aria-label="미리보기">
        <p className={styles.previewLabel}>미리보기</p>
        <div className={styles.preview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={landingImage} alt="" className={styles.previewImage} />
          <div className={styles.previewCard}>
            <p className={styles.previewSubtitle}>{draft.subtitle}</p>
            <p className={styles.previewTitle}>{draft.title || '메인 타이틀'}</p>
            <div className={styles.previewDivider} />
            {[draft.event_date, draft.event_time, draft.event_venue].filter(Boolean).map((v, i) => (
              <p key={i} className={styles.previewDetail}>
                {v}
              </p>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}

/* ───────── 대표 이미지 ───────── */

function ImagePanel({
  current,
  onChange,
  toast,
}: {
  current: string;
  onChange: (url: string) => void;
  toast: (kind: Toast['kind'], message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDefault = current === DEFAULT_LANDING_IMAGE;

  const send = async (init: RequestInit, successMessage: string) => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/landing-image', init);
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error || '처리하지 못했어요.');
      onChange(body.url);
      toast('success', successMessage);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : '처리하지 못했어요.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const upload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('error', '이미지 파일만 올릴 수 있어요.');
    const fd = new FormData();
    fd.append('file', file);
    void send({ method: 'POST', body: fd }, '대표 이미지를 바꿨어요.');
  };

  return (
    <section className={`${styles.panel} ${styles.imagePanel}`}>
      <div className={styles.imageCurrent}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current} alt="현재 대표 이미지" />
        {isDefault && <span className={styles.imageBadge}>기본 이미지</span>}
      </div>

      <div className={styles.imageSide}>
        <label
          className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''} ${busy ? styles.dropZoneBusy : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!busy) upload(e.dataTransfer.files[0]);
          }}
        >
          <ImageUp size={28} aria-hidden />
          <strong>{busy ? '처리 중…' : '이미지를 끌어오거나 눌러서 선택'}</strong>
          <span>JPG·PNG·WEBP, 10MB 이하 · 세로 5:7 비율을 권장해요</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="sr-only"
            disabled={busy}
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </label>

        {!isDefault && (
          <button
            type="button"
            className={styles.textButton}
            disabled={busy}
            onClick={() => void send({ method: 'DELETE' }, '기본 이미지로 되돌렸어요.')}
          >
            <RotateCcw size={14} aria-hidden /> 기본 이미지로 되돌리기
          </button>
        )}
      </div>
    </section>
  );
}
