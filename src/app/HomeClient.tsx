'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import { submitRSVP } from './actions';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Volume2, VolumeX, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';

type Props = {
  landingImage: string;
  texts: Record<string, string>;
};

export default function HomeClient({ landingImage, texts }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fireFireworks = useCallback(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    fireFireworks();
    if (audioRef.current && !isBgmPlaying) {
      audioRef.current.play().catch(e => console.log('Audio play blocked:', e));
      setIsBgmPlaying(true);
    }
  };

  const toggleBgm = () => {
    if (!audioRef.current) return;
    if (isBgmPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsBgmPlaying(!isBgmPlaying);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await submitRSVP(formData);
    setIsSubmitting(false);
    if (result.success) {
      setIsSuccess(true);
      fireFireworks();
      setTimeout(fireFireworks, 2000);
    } else {
      setError(result.error || '오류가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundGradient} />

      <audio ref={audioRef} loop src="/bgm.mp3" />

      <motion.button
        className={styles.bgmControl}
        onClick={toggleBgm}
        whileHover={{ scale: 1.1 }}
      >
        {isBgmPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </motion.button>

      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="landing"
            className={styles.landing}
            onClick={handleOpen}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 1.1, filter: 'blur(20px)' }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          >
            <motion.div
              className={styles.landingImageContainer}
              animate={{
                boxShadow: [
                  '0 20px 50px rgba(212, 175, 55, 0.3)',
                  '0 20px 80px rgba(212, 175, 55, 0.6)',
                  '0 20px 50px rgba(212, 175, 55, 0.3)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Image
                src={landingImage}
                alt="초대장 입구"
                fill
                style={{ objectFit: 'cover' }}
                priority
                unoptimized={landingImage.startsWith('http')}
              />
            </motion.div>
            <motion.div
              className={styles.clickHint}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              open
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="invitation"
            className={styles.invitation}
            initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, type: 'spring', damping: 12 }}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <p className={styles.subtitle}>{texts.subtitle}</p>
              <h1 className={styles.title}>{texts.title}</h1>
            </motion.div>

            <div className={styles.divider} />

            <div className={styles.details}>
              {[
                { Icon: Calendar, value: texts.event_date },
                { Icon: Clock, value: texts.event_time },
                { Icon: MapPin, value: texts.event_venue },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className={styles.detailItem}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                >
                  <item.Icon className={styles.detailIcon} size={16} />
                  <span>{item.value}</span>
                </motion.div>
              ))}
            </div>

            <div className={styles.divider} />

            {!isSuccess ? (
              <motion.form
                className={styles.rsvpForm}
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <div className={styles.inputGroup}>
                  <label className={styles.label}>이름</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="홍길동"
                    className={styles.input}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>연락처</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="010-0000-0000"
                    className={styles.input}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.submitButton}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isSubmitting ? '확인 중' : '참석 확인'}
                </motion.button>
                {error && (
                  <p style={{ color: '#c0392b', marginTop: '10px', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                    {error}
                  </p>
                )}
              </motion.form>
            ) : (
              <motion.div
                className={styles.successMessage}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring' }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  <Sparkles size={48} color="#d4af37" style={{ marginBottom: '24px' }} />
                </motion.div>
                <h2 className={styles.successTitle}>{texts.success_title}</h2>
                <p className={styles.successSub}>{texts.success_sub}</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
