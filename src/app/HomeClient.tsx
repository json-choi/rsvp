'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Calendar, Clock, Heart, MapPin, Sparkles, Volume2, VolumeX } from 'lucide-react';
import styles from './page.module.css';
import { submitRsvp } from './actions';
import { formatPhone } from '@/lib/phone';
import type { SiteSettings } from '@/lib/settings';

const AUTO_OPEN_MS = 30_000;
const STORAGE_KEY = 'rsvp:response';

type StoredResponse = { name: string; phone: string; attending: boolean };
type Result = StoredResponse & { updated: boolean };

function readStored(): StoredResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<StoredResponse>;
    if (typeof v.name === 'string' && typeof v.phone === 'string' && typeof v.attending === 'boolean') {
      return { name: v.name, phone: v.phone, attending: v.attending };
    }
  } catch {
    // 저장소를 쓸 수 없는 환경(사파리 프라이빗 등)은 무시한다.
  }
  return null;
}

function writeStored(v: StoredResponse) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {}
}

function fireFireworks() {
  const duration = 4000;
  const end = Date.now() + duration;
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 50,
    disableForReducedMotion: true,
    colors: ['#d4af37', '#f0e0b0', '#c9a227', '#ffffff', '#e8c872'],
  };
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;
  const interval = window.setInterval(() => {
    const left = end - Date.now();
    if (left <= 0) return window.clearInterval(interval);
    const particleCount = 40 * (left / duration);
    confetti({ ...defaults, particleCount, origin: { x: rand(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: rand(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

export default function HomeClient({ texts, landingImage, rsvpOpen }: SiteSettings) {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [attending, setAttending] = useState(true);
  const [error, setError] = useState<{ message: string; field?: 'name' | 'phone' } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const openedRef = useRef(false);

  const open = useCallback((celebrate: boolean) => {
    if (openedRef.current) return;
    openedRef.current = true;
    // 이전에 응답했다면 그 결과를 보여 주고, 수정할 수 있게 폼에도 채워 둔다.
    const stored = readStored();
    if (stored) {
      setResult({ ...stored, updated: false });
      setName(stored.name);
      setPhone(stored.phone);
      setAttending(stored.attending);
    }
    setIsOpen(true);
    if (celebrate) fireFireworks();
  }, []);


  // 한동안 머물러 있으면 자동으로 초대장을 연다.
  useEffect(() => {
    const timer = window.setTimeout(() => open(false), AUTO_OPEN_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  // 사용자가 직접 끈 경우에는 다시 틀지 않는다.
  const userMutedRef = useRef(false);

  const playBgm = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.paused || userMutedRef.current) return;
    audio.play().catch(() => {});
  }, []);

  // 아이콘 상태는 실제 재생 상태를 따른다.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const sync = () => setIsBgmPlaying(!audio.paused);
    audio.addEventListener('play', sync);
    audio.addEventListener('pause', sync);
    return () => {
      audio.removeEventListener('play', sync);
      audio.removeEventListener('pause', sync);
    };
  }, []);

  // 브라우저는 소리 있는 자동 재생을 사용자 동작 전까지 막는다.
  // 우선 바로 재생을 시도하고, 막히면 화면 어디든 처음 누르거나 키를 누를 때 재생한다.
  // (iOS 사파리는 touchend·click에서만 재생을 허용하므로 여러 이벤트를 함께 듣는다.)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const events = ['pointerdown', 'touchend', 'click', 'keydown'] as const;
    const onInteract = (e: Event) => {
      // 음악 버튼은 자체 토글로 처리한다 (여기서 틀면 같은 탭에 바로 꺼진다).
      if (e.target instanceof Element && e.target.closest('[data-bgm-toggle]')) return;
      playBgm();
    };
    const onPlay = () => events.forEach((e) => document.removeEventListener(e, onInteract, true));

    audio.addEventListener('play', onPlay);
    events.forEach((e) => document.addEventListener(e, onInteract, true));
    playBgm();
    return () => {
      audio.removeEventListener('play', onPlay);
      events.forEach((e) => document.removeEventListener(e, onInteract, true));
    };
  }, [playBgm]);

  const openByUser = () => {
    playBgm();
    open(true);
  };

  const toggleBgm = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      userMutedRef.current = false;
      audio.play().catch(() => {});
    } else {
      userMutedRef.current = true;
      audio.pause();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitRsvp({ name, phone, attending });
      if (!res.ok) {
        setError({ message: res.error, field: res.field });
        return;
      }
      const stored = { name: res.name, phone: res.phone, attending: res.attending };
      writeStored(stored);
      setResult({ ...stored, updated: res.updated });
      if (res.attending) {
        fireFireworks();
        window.setTimeout(fireFireworks, 1800);
      }
    });
  };

  const details = [
    { Icon: Calendar, value: texts.event_date, label: '날짜' },
    { Icon: Clock, value: texts.event_time, label: '시간' },
    { Icon: MapPin, value: texts.event_venue, label: '장소', href: texts.event_map_url },
  ].filter((d) => d.value);

  return (
    <MotionConfig reducedMotion="user">
      <main className={styles.container}>
        <div className={styles.backgroundGradient} aria-hidden />

        <audio ref={audioRef} loop preload="auto" src="/bgm.mp3" />

        <motion.button
          type="button"
          data-bgm-toggle
          className={styles.bgmControl}
          onClick={toggleBgm}
          whileHover={{ scale: 1.08 }}
          aria-label={isBgmPlaying ? '배경음악 끄기' : '배경음악 켜기'}
          aria-pressed={isBgmPlaying}
        >
          {isBgmPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </motion.button>

        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.button
              type="button"
              key="landing"
              className={styles.landing}
              onClick={openByUser}
              aria-label="초대장 열기"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -80, scale: 1.08, filter: 'blur(16px)' }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
            >
              <motion.div
                className={styles.landingImageContainer}
                animate={{
                  scale: [1, 1.012, 1],
                  boxShadow: [
                    '0 20px 50px rgba(212, 175, 55, 0.3)',
                    '0 20px 80px rgba(212, 175, 55, 0.6)',
                    '0 20px 50px rgba(212, 175, 55, 0.3)',
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- R2·public 이미지를 그대로 쓴다 */}
                <img src={landingImage} alt="" className={styles.landingImage} fetchPriority="high" />
                <div className={styles.shimmerOverlay} />
              </motion.div>

              <motion.span
                className={styles.landingInfo}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: [0.45, 1, 0.45], y: [4, 0, 4] }}
                transition={{ delay: 0.8, duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                탭하여 열기
              </motion.span>
            </motion.button>
          ) : (
            <motion.section
              key="invitation"
              className={styles.invitation}
              aria-labelledby="invitation-title"
              initial={{ opacity: 0, scale: 0.6, rotateY: 80 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1.1, type: 'spring', damping: 14 }}
            >
              <motion.header
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                {texts.subtitle && <p className={styles.subtitle}>{texts.subtitle}</p>}
                <h1 id="invitation-title" className={styles.title}>
                  {texts.title}
                </h1>
              </motion.header>

              <div className={styles.divider} />

              <ul className={styles.details}>
                {details.map(({ Icon, value, label, href }, i) => (
                  <motion.li
                    key={label}
                    className={styles.detailItem}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.15 }}
                  >
                    <Icon className={styles.detailIcon} size={16} aria-hidden />
                    <span className="sr-only">{label}</span>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className={styles.detailLink}>
                        {value}
                      </a>
                    ) : (
                      <span>{value}</span>
                    )}
                  </motion.li>
                ))}
              </ul>

              <div className={styles.divider} />

              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key="result"
                    className={styles.successMessage}
                    role="status"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring' }}
                  >
                    <motion.div
                      className={styles.successIcon}
                      animate={result.attending ? { rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] } : undefined}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    >
                      {result.attending ? (
                        <Sparkles size={44} color="#d4af37" aria-hidden />
                      ) : (
                        <Heart size={40} color="#c9a227" aria-hidden />
                      )}
                    </motion.div>
                    <h2 className={styles.successTitle}>
                      {result.attending ? texts.success_title : texts.decline_title}
                    </h2>
                    {result.attending && texts.success_sub && <p className={styles.successSub}>{texts.success_sub}</p>}
                    <p className={styles.responseSummary}>
                      {result.name}님 · {result.attending ? '참석' : '불참'}
                      {result.updated ? ' (응답이 수정됐어요)' : ''}
                    </p>
                    {rsvpOpen && (
                      <button type="button" className={styles.linkButton} onClick={() => setResult(null)}>
                        응답 수정하기
                      </button>
                    )}
                  </motion.div>
                ) : !rsvpOpen ? (
                  <motion.p
                    key="closed"
                    className={styles.closedMessage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {texts.closed_message}
                  </motion.p>
                ) : (
                  <motion.form
                    key="form"
                    className={styles.rsvpForm}
                    onSubmit={handleSubmit}
                    noValidate
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <fieldset className={styles.choiceGroup}>
                      <legend className="sr-only">참석 여부</legend>
                      {[
                        { value: true, label: '참석할게요' },
                        { value: false, label: '어려워요' },
                      ].map((opt) => (
                        <label
                          key={String(opt.value)}
                          className={`${styles.choice} ${attending === opt.value ? styles.choiceActive : ''}`}
                        >
                          <input
                            type="radio"
                            name="attending"
                            className="sr-only"
                            checked={attending === opt.value}
                            onChange={() => setAttending(opt.value)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </fieldset>

                    <div className={styles.inputGroup}>
                      <label htmlFor="name" className={styles.label}>
                        이름
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        maxLength={30}
                        placeholder="홍길동"
                        className={styles.input}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        aria-invalid={error?.field === 'name'}
                        aria-describedby={error ? 'rsvp-error' : undefined}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label htmlFor="phone" className={styles.label}>
                        연락처
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        required
                        placeholder="010-0000-0000"
                        className={styles.input}
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        aria-invalid={error?.field === 'phone'}
                        aria-describedby={error ? 'rsvp-error' : undefined}
                      />
                    </div>

                    {error && (
                      <p id="rsvp-error" className={styles.error} role="alert">
                        {error.message}
                      </p>
                    )}

                    <motion.button
                      type="submit"
                      disabled={isPending}
                      className={styles.submitButton}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isPending ? '보내는 중…' : '응답 보내기'}
                    </motion.button>
                    <p className={styles.privacyNote}>입력하신 정보는 행사 안내에만 사용돼요.</p>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
