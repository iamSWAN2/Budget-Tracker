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

// 현재 시간을 포함한 날짜-시간 표시 (거래 내역용)
export const formatDateTimeDisplay = (isoDate: string): string => {
  if (!isoDate) return '';
  
  // 날짜만 있는 경우 (YYYY-MM-DD) - 현재 시간 추가
  if (isoDate.length === 10) {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5); // HH:MM
    return `${formatDateDisplay(isoDate)}. ${timeStr}`;
  }
  
  // 이미 시간이 포함된 경우 (ISO datetime)
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return isoDate;
    
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    
    return `${y}. ${m}. ${d}. ${h}:${min}`;
  } catch {
    return isoDate;
  }
};

// 월 텍스트(한국어 기본): 2025년 9월
export const formatMonthKo = (month: number, year: number): string => {
  const date = new Date(year, month);
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
};

