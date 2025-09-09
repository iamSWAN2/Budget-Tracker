import { AITransaction, TransactionType } from '../types';

export interface ColumnMapping {
  date?: number;
  description?: number;
  amount?: number;
  type?: number;
  account?: number;
  // 신규 HIGH 우선순위 필드들
  reference?: number;    // 참조번호 - 중복 방지
  category?: number;     // 카테고리 - 자동 분류
  balance?: number;      // 잔액 - 거래 후 잔액
}

export interface ParsedColumn {
  index: number;
  name: string;
  detectedType: 'date' | 'amount' | 'description' | 'type' | 'account' | 'reference' | 'category' | 'balance' | 'unknown';
  confidence: number;
  samples: string[];
}

// 패턴 정의
const PATTERNS = {
  date: [
    /\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/,  // 2025-01-01, 2025/01/01
    /\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/,  // 01-01-2025, 01/01/2025
    /\d{4}\.\d{1,2}\.\d{1,2}/,        // 2025.01.01
    /\d{1,2}\.\d{1,2}\.\d{4}/         // 01.01.2025
  ],
  amount: [
    /₩[\d,]+/,                        // ₩10,000
    /\$[\d,\.]+/,                     // $10.00
    /^[\d,]+$/,                       // 10000, 10,000
    /^-?[\d,\.]+$/                    // -10000, 10.50
  ],
  type: [
    /지출|출금|차감|결제/,
    /수입|입금|입력|충전/,
    /expense|debit|withdrawal/i,
    /income|credit|deposit/i
  ],
  // 신규 패턴들
  reference: [
    /^\d{10,}$/,                      // 10자리 이상 숫자 (거래번호)
    /^[A-Z]\d{8,}$/,                  // 영문+숫자 조합
    /승인|approval|ref|transaction/i  // 승인번호 키워드
  ],
  category: [
    /식당|음식|카페|coffee/i,          // 식비 관련
    /마트|마켓|편의점|convenience/i,   // 쇼핑 관련
    /교통|버스|지하철|택시|transport/i, // 교통비 관련
    /의료|병원|약국|medical/i          // 의료비 관련
  ],
  balance: [
    /잔액|balance|남은|remain/i,       // 잔액 키워드
    /^[\d,]+$/                        // 순수 숫자 (금액과 유사하지만 맥락으로 구분)
  ]
};

// 헤더명으로 컬럼 타입 추론
const HEADER_KEYWORDS = {
  date: ['날짜', 'date', '일자', '거래일', '거래날짜', 'transaction_date'],
  amount: ['금액', 'amount', '거래금액', '금액', 'transaction_amount', '출금', '입금'],
  description: ['내용', 'description', '거래내용', '상세', 'detail', 'memo', '적요'],
  type: ['거래유형', 'type', '거래구분', '타입', 'transaction_type', '구분'],
  account: ['계좌', 'account', '카드', 'card', '은행', 'bank', '계좌명', 'account_name'],
  // 신규 헤더 키워드들
  reference: ['참조번호', 'reference', '거래번호', '승인번호', 'transaction_id', 'approval', 'ref_no'],
  category: ['카테고리', 'category', '분류', '업종', '가맹점', 'merchant', 'business_type'],
  balance: ['잔액', 'balance', '잔고', '현재잔액', 'current_balance', 'remaining']
};

export class LocalCsvParser {
  
  // CSV 파일 읽기
  static async parseFile(file: File): Promise<{ headers: string[], rows: string[][] }> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('CSV 파일이 비어있습니다.');
    }

    const headers = this.parseCsvLine(lines[0]);
    const rows = lines.slice(1).map(line => this.parseCsvLine(line));
    
    return { headers, rows };
  }

  // CSV 라인 파싱 (콤마, 따옴표 처리)
  static parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  // 컬럼 자동 감지
  static analyzeColumns(headers: string[], rows: string[][]): ParsedColumn[] {
    return headers.map((header, index) => {
      const samples = rows.slice(0, 5).map(row => row[index] || '').filter(Boolean);
      
      return {
        index,
        name: header,
        detectedType: this.detectColumnType(header, samples),
        confidence: this.calculateConfidence(header, samples),
        samples
      };
    });
  }

  // 컬럼 타입 감지
  static detectColumnType(header: string, samples: string[]): 'date' | 'amount' | 'description' | 'type' | 'account' | 'reference' | 'category' | 'balance' | 'unknown' {
    const headerLower = header.toLowerCase();
    
    // 헤더명으로 먼저 판단
    for (const [type, keywords] of Object.entries(HEADER_KEYWORDS)) {
      if (keywords.some(keyword => headerLower.includes(keyword.toLowerCase()))) {
        return type as any;
      }
    }

    // 샘플 데이터로 패턴 매칭
    if (samples.length === 0) return 'unknown';

    // 날짜 패턴 체크
    if (PATTERNS.date.some(pattern => samples.some(sample => pattern.test(sample)))) {
      return 'date';
    }

    // 금액 패턴 체크
    if (PATTERNS.amount.some(pattern => samples.some(sample => pattern.test(sample)))) {
      return 'amount';
    }

    // 거래유형 패턴 체크
    if (PATTERNS.type.some(pattern => samples.some(sample => pattern.test(sample)))) {
      return 'type';
    }

    // 참조번호 패턴 체크
    if (PATTERNS.reference.some(pattern => samples.some(sample => pattern.test(sample)))) {
      return 'reference';
    }

    // 카테고리 패턴 체크
    if (PATTERNS.category.some(pattern => samples.some(sample => pattern.test(sample)))) {
      return 'category';
    }

    // 잔액 패턴 체크 (금액과 구분하기 위해 헤더명 우선 고려)
    if (PATTERNS.balance.some(pattern => samples.some(sample => pattern.test(sample))) &&
        HEADER_KEYWORDS.balance.some(keyword => header.toLowerCase().includes(keyword.toLowerCase()))) {
      return 'balance';
    }

    // 계좌/카드 패턴 체크 (일반적으로 은행명/카드사명 포함)
    if (samples.some(sample => /카드|은행|bank|card/i.test(sample))) {
      return 'account';
    }

    // 기본적으로 설명으로 분류
    return 'description';
  }

  // 신뢰도 계산
  static calculateConfidence(header: string, samples: string[]): number {
    const headerLower = header.toLowerCase();
    let headerScore = 0;
    let patternScore = 0;

    // 헤더명 점수
    for (const [type, keywords] of Object.entries(HEADER_KEYWORDS)) {
      if (keywords.some(keyword => headerLower.includes(keyword.toLowerCase()))) {
        headerScore = 0.7;
        break;
      }
    }

    // 패턴 매칭 점수
    if (samples.length > 0) {
      const matchingPatterns = Object.values(PATTERNS).flat().filter(pattern => 
        samples.some(sample => pattern.test(sample))
      );
      patternScore = Math.min(matchingPatterns.length * 0.3, 0.3);
    }

    return Math.min(headerScore + patternScore, 1.0);
  }

  // 금액 정규화
  static normalizeAmount(amountStr: string): number {
    // 통화 기호, 콤마 제거
    const cleaned = amountStr.replace(/[₩$,]/g, '').trim();
    return Math.abs(parseFloat(cleaned)) || 0;
  }

  // 날짜 정규화
  static normalizeDate(dateStr: string): string {
    // 여러 날짜 형식을 YYYY-MM-DD로 변환
    const cleaned = dateStr.replace(/[^\d\/\-\.]/g, '').trim();
    
    // 2025/05/01 형식
    const match1 = cleaned.match(/(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/);
    if (match1) {
      const [, year, month, day] = match1;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // 05/01/2025 형식
    const match2 = cleaned.match(/(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})/);
    if (match2) {
      const [, month, day, year] = match2;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // 기본값으로 오늘 날짜 반환
    return new Date().toISOString().split('T')[0];
  }

  // 거래 타입 정규화
  static normalizeType(typeStr: string): TransactionType {
    const cleaned = typeStr.toLowerCase().trim();
    
    if (['지출', '출금', '차감', '결제', 'expense', 'debit', 'withdrawal'].some(keyword => 
      cleaned.includes(keyword))) {
      return TransactionType.EXPENSE;
    }
    
    if (['수입', '입금', '입력', '충전', 'income', 'credit', 'deposit'].some(keyword => 
      cleaned.includes(keyword))) {
      return TransactionType.INCOME;
    }

    // 금액이 음수면 지출, 양수면 수입으로 추론
    return TransactionType.EXPENSE; // 기본값
  }

  // 컬럼 매핑으로 거래 데이터 변환
  static convertToTransactions(
    headers: string[], 
    rows: string[][], 
    mapping: ColumnMapping
  ): AITransaction[] {
    return rows
      .filter(row => row.length > 0 && row.some(cell => cell.trim()))
      .map((row, index) => {
        try {
          const date = mapping.date !== undefined ? 
            this.normalizeDate(row[mapping.date] || '') : 
            new Date().toISOString().split('T')[0];

          const description = mapping.description !== undefined ? 
            (row[mapping.description] || `거래 ${index + 1}`) : 
            `거래 ${index + 1}`;

          const amount = mapping.amount !== undefined ? 
            this.normalizeAmount(row[mapping.amount] || '0') : 
            0;

          const type = mapping.type !== undefined ? 
            this.normalizeType(row[mapping.type] || 'expense') : 
            TransactionType.EXPENSE;

          return {
            date,
            description: description.trim(),
            amount,
            type: type === TransactionType.EXPENSE ? 'EXPENSE' : 'INCOME'
          };
        } catch (error) {
          console.warn(`Row ${index + 1} parsing error:`, error);
          return {
            date: new Date().toISOString().split('T')[0],
            description: `오류 데이터 ${index + 1}`,
            amount: 0,
            type: 'EXPENSE' as const
          };
        }
      })
      .filter(transaction => transaction.amount > 0); // 0원 거래 제외
  }
}