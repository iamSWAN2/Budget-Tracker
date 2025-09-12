# 자산 탭 Phase 3: UX 개선 계획서

> **Status**: 미구현 (Phase 1, 2 완료 후 추후 진행)  
> **Priority**: 중간 (사용성 개선)  
> **Estimated**: 2-3일

## 📌 Overview

Phase 1 (기본 목록형 UI), Phase 2 (필터링/테이블/요약)이 완료된 후, 
사용자 경험을 한 단계 더 향상시키기 위한 인터랙티브 기능들을 구현합니다.

---

## 📱 1. 스와이프 액션 (모바일 우선)

### 구현 목표:
- **왼쪽 스와이프** → 수정 액션 표시
- **오른쪽 스와이프** → 삭제 액션 표시  
- **부드러운 애니메이션** + 햅틱 피드백

### 예상 UX:
```
[💳 신한카드 계좌]  ← 왼쪽 스와이프
                [✏️ 수정]

[💳 신한카드 계좌]  → 오른쪽 스와이프  
[🗑️ 삭제]

- 30% 스와이프: 액션 버튼 힌트 표시
- 60% 스와이프: 액션 버튼 완전 노출
- 80% 스와이프: 자동 액션 실행
```

### 기술 구현:
```typescript
// 패키지: react-swipeable 또는 커스텀 터치 핸들러
import { useSwipeable } from 'react-swipeable';

const SwipeableAccountItem = ({ account, onEdit, onDelete }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  const handlers = useSwipeable({
    onSwipedLeft: () => showEditAction(),
    onSwipedRight: () => showDeleteAction(),
    onSwiping: (eventData) => updateSwipeOffset(eventData),
    trackMouse: true
  });
  
  return (
    <motion.div
      {...handlers}
      animate={{ x: swipeOffset }}
      className="swipeable-account-item"
    >
      {/* 계좌 내용 */}
      <AccountContent account={account} />
      
      {/* 스와이프 액션 버튼들 */}
      <SwipeActions 
        onEdit={() => onEdit(account)}
        onDelete={() => onDelete(account.id)}
        visible={Math.abs(swipeOffset) > 50}
      />
    </motion.div>
  );
};
```

---

## ⌨️ 2. 키보드 네비게이션

### 구현 목표:
- **Tab/Shift+Tab**: 계좌 간 포커스 이동
- **Enter**: 선택된 계좌 수정
- **Delete**: 선택된 계좌 삭제
- **Escape**: 검색/필터 초기화
- **화살표 키**: 목록/테이블 네비게이션
- **Space**: 체크박스 토글 (다중 선택 시)

### 예상 UX:
```
🎯 포커스 흐름:
검색창 → 필터 버튼들 → 정렬 옵션 → 계좌 목록 → 액션 버튼

📋 계좌 목록에서:
↑↓ 화살표: 계좌 간 이동
Enter: 수정 모달 열기
Delete: 삭제 확인 다이얼로그
Space: 선택/해제 (다중 선택 모드)

🔍 검색창에서:
Escape: 검색어 클리어
Enter: 첫 번째 결과로 포커스 이동
```

### 기술 구현:
```typescript
// 키보드 네비게이션 훅
const useKeyboardNavigation = (accounts, onEdit, onDelete) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const accountRefs = useRef([]);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          setFocusedIndex(prev => 
            Math.min(prev + 1, accounts.length - 1)
          );
          break;
        case 'ArrowUp':
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          if (focusedIndex >= 0) {
            onEdit(accounts[focusedIndex]);
          }
          break;
        case 'Delete':
          if (focusedIndex >= 0) {
            onDelete(accounts[focusedIndex].id);
          }
          break;
        case 'Escape':
          setFocusedIndex(-1);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [accounts, focusedIndex, onEdit, onDelete]);
  
  return { focusedIndex, accountRefs };
};
```

---

## ✨ 3. 애니메이션 & 트랜지션

### A. 목록 애니메이션
```typescript
// 계좌 추가/삭제 애니메이션
const AccountList = () => {
  return (
    <AnimatePresence mode="popLayout">
      {accounts.map(account => (
        <motion.div
          key={account.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -300 }}
          layout
          transition={{ duration: 0.3 }}
        >
          <AccountItem account={account} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

// 필터 변경 시 재정렬 애니메이션
const filteredAccounts = useMemo(() => {
  // ... 필터링 로직
}, [filter, accounts]);
```

### B. 인터랙션 애니메이션
```typescript
// 호버 및 클릭 효과
const AccountCard = ({ account }) => {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.02, 
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)" 
      }}
      whileTap={{ scale: 0.98 }}
      className="account-card"
    >
      {/* 계좌 내용 */}
    </motion.div>
  );
};

// 진행바 애니메이션
const CreditUsageBar = ({ usageRate }) => {
  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${usageRate}%` }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="usage-bar"
    />
  );
};
```

### C. 뷰 전환 애니메이션
```typescript
// 카드 ↔ 목록 ↔ 테이블 전환
const AccountsView = ({ viewMode, accounts }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewMode}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        {viewMode === 'card' && <AccountCardView accounts={accounts} />}
        {viewMode === 'list' && <AccountListView accounts={accounts} />}
        {viewMode === 'table' && <AccountTableView accounts={accounts} />}
      </motion.div>
    </AnimatePresence>
  );
};
```

---

## 🎨 4. 추가 UX 개선사항

### A. 드래그 앤 드롭 순서 변경
```typescript
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const DraggableAccountList = () => {
  const onDragEnd = (result) => {
    // 계좌 순서 재정렬
    reorderAccounts(result.source.index, result.destination.index);
  };
  
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="accounts">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {accounts.map((account, index) => (
              <Draggable key={account.id} draggableId={account.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? 'dragging' : ''}
                  >
                    <AccountItem account={account} />
                  </div>
                )}
              </Draggable>
            ))}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
```

### B. 컨텍스트 메뉴
```typescript
const ContextMenu = ({ x, y, account, onClose, onEdit, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ position: 'absolute', left: x, top: y }}
      className="context-menu"
    >
      <button onClick={() => onEdit(account)}>✏️ 수정</button>
      <button onClick={() => onDelete(account.id)}>🗑️ 삭제</button>
      <button onClick={() => toggleFavorite(account.id)}>⭐ 즐겨찾기</button>
    </motion.div>
  );
};
```

---

## 🚀 구현 로드맵

### **1단계 (핵심 - 1일)**
- ✅ 기본 호버/클릭 애니메이션
- ✅ 스와이프 액션 (모바일)
- ✅ Tab 키보드 네비게이션

### **2단계 (고급 - 1일)**  
- 🔄 목록 추가/삭제 애니메이션
- 🔄 뷰 전환 애니메이션
- 🔄 진행바 부드러운 증가

### **3단계 (완성도 - 1일)**
- 💫 드래그 앤 드롭
- 💫 컨텍스트 메뉴
- 💫 로딩 스켈레톤
- 💫 상태별 시각적 피드백

---

## 📦 필요한 패키지

```json
{
  "framer-motion": "^10.x.x",        // 애니메이션
  "react-swipeable": "^7.x.x",       // 스와이프
  "react-beautiful-dnd": "^13.x.x",  // 드래그앤드롭
  "@use-gesture/react": "^10.x.x"    // 제스처 (대안)
}
```

---

## 🎯 기대 효과

### 사용성 향상:
- **📱 모바일**: 스와이프로 빠른 편집/삭제 (3초 → 1초)
- **⌨️ 접근성**: 키보드만으로 완전한 조작 가능
- **🎨 만족도**: 부드러운 애니메이션으로 프리미엄 느낌

### 효율성 증대:
- **🚀 속도**: 직관적 인터랙션으로 작업 속도 20% 향상
- **🎯 정확성**: 시각적 피드백으로 실수 감소
- **💡 학습**: 자연스러운 UX로 기능 발견성 증대

---

**구현 우선순위**: 현재 Phase 1, 2가 완료된 상태에서 필요에 따라 선택적으로 진행 예정.