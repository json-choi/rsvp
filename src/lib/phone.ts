/** 숫자만 남긴다. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** 입력 중인 번호를 010-1234-5678 형태로 맞춘다. */
export function formatPhone(value: string): string {
  const d = digitsOnly(value).slice(0, 11);
  if (d.startsWith('02')) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/** 저장 가능한 한국 전화번호인지 확인한다 (9~11자리, 0으로 시작). */
export function isValidPhone(value: string): boolean {
  const d = digitsOnly(value);
  return /^0\d{8,10}$/.test(d);
}
