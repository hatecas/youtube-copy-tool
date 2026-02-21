# YouTube Copy Tool

유튜브 영상 분석 & 콘텐츠 카피 도구

## 기능

1. **레퍼런스 영상 분석** - 유튜브 링크 3개 이상 입력 → 썸네일, 제목, 조회수, 대본(인트로~5분) 자동 분석
2. **주제 추천** - 조회수 높은 순으로 분석 후 AI가 주제/타겟 추천
3. **콘텐츠 생성** - 선택한 주제에 맞는 썸네일 텍스트(3개), 제목(2개), 인트로~대본(타겟별 2개) 자동 생성

## 기술 스택

- **프론트엔드**: Next.js 15 (App Router) + TypeScript + Tailwind CSS → Vercel 배포
- **백엔드**: Python (Flask) → Railway 배포
- **DB**: Supabase (PostgreSQL)
- **AI**: 추후 연결 (OpenAI GPT / Claude API)

## 프로젝트 구조

```
youtube-copy-tool/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (백엔드 프록시)
│   ├── globals.css        # 글로벌 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 메인 페이지
├── backend/               # Python 백엔드
│   ├── app.py            # Flask 서버
│   ├── requirements.txt  # Python 패키지
│   ├── Procfile          # Railway 배포
│   └── runtime.txt       # Python 버전
├── components/            # React 컴포넌트
│   ├── Header.tsx
│   ├── StepIndicator.tsx
│   ├── VideoInputStep.tsx
│   ├── AnalysisStep.tsx
│   ├── TopicSelectStep.tsx
│   └── ResultStep.tsx
├── lib/                   # 유틸리티
│   ├── api.ts
│   ├── supabase.ts
│   └── types.ts
├── supabase/              # DB 마이그레이션
│   └── migration.sql
└── .env.example           # 환경변수 예시
```

## 시작하기

### 프론트엔드 (Vercel)

```bash
npm install
npm run dev
```

### 백엔드 (Railway)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 환경변수 설정

`.env.example`을 참고하여 `.env` 파일을 생성하세요.

## 배포

- **프론트엔드**: Vercel에 GitHub 연결 후 자동 배포
- **백엔드**: Railway에 `backend/` 폴더 연결 후 자동 배포
- **DB**: Supabase에서 `supabase/migration.sql` 실행
