// 전역 포맷 유틸: 한국 로케일, KRW 기본 통화, 날짜 포맷

export type LocaleCode = 'ko-KR' | 'en-US';

// 통화 포매터: 기본은 KRW, 소수 0자리(원 단위)
export const formatCurrency = (
  value: number,
  options?: { 
    locale?: LocaleCode; 
    currency?: string; 
    maximumFractionDigits?: number;
    compact?: boolean;
  }
): string => {
  const locale = options?.locale ?? 'ko-KR';
  const currency = options?.currency ?? 'KRW';
  const maximumFractionDigits = options?.maximumFractionDigits ?? 0; // 원화 기준
  const compact = options?.compact ?? false;

  try {
    if (compact) {
      // 축약 표시: 1K, 1M 등
      if (Math.abs(value) >= 1000000000) {
        return `₩${(value / 1000000000).toFixed(1)}B`;
      } else if (Math.abs(value) >= 1000000) {
        return `₩${(value / 1000000).toFixed(1)}M`;
      } else if (Math.abs(value) >= 1000) {
        return `₩${(value / 1000).toFixed(1)}K`;
      }
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits,
    }).format(value);
  } catch {
    // Intl 실패 시 폴백
    const sign = value < 0 ? '-' : '';
    const num = Math.abs(Math.round(value)).toLocaleString();
    const symbol = currency === 'KRW' ? '₩' : '';
    return `${sign}${symbol}${num}`;
  }
};

// ISO(YYYY-MM-DD) -> 표시용 "YYYY. MM. DD"
export const formatDateDisplay = (isoDate: string): string => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${y}. ${m.padStart(2, '0')}. ${d.padStart(2, '0')}`;
};

// 월 텍스트(한국어 기본): 2025년 9월
export const formatMonthKo = (month: number, year: number): string => {
  const date = new Date(year, month);
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
};

