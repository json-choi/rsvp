'use client';

import { useActionState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { loginAction, type LoginState } from '../actions';
import styles from '../admin.module.css';

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <main className={styles.loginPage}>
      <form action={formAction} className={styles.loginCard}>
        <div className={styles.loginIcon}>
          <LockKeyhole size={22} aria-hidden />
        </div>
        <h1 className={styles.loginTitle}>초대장 관리</h1>
        <p className={styles.loginSub}>관리자 비밀번호를 입력해 주세요.</p>
        <label htmlFor="password" className="sr-only">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          placeholder="비밀번호"
          className={styles.input}
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? 'login-error' : undefined}
        />
        {state.error && (
          <p id="login-error" className={styles.fieldError} role="alert">
            {state.error}
          </p>
        )}
        <button type="submit" className={styles.primaryButton} disabled={pending}>
          {pending ? '확인 중…' : '로그인'}
        </button>
      </form>
    </main>
  );
}
