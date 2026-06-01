// 선택 옵션과 범용 프리셋. 특정 브랜드/인물/사업명은 넣지 않는다.

export const NICHE_OPTIONS = [
  "뷰티", "여행", "운동", "맛집", "패션", "AI", "창업", "재테크",
  "육아", "반려동물", "공부", "자기계발", "제품판매", "클래스", "커뮤니티",
];

export const GOAL_OPTIONS = [
  "팔로워 증가",
  "상품/서비스 판매",
  "강의/전자책 판매",
  "상담/문의 유도",
  "커뮤니티 모집",
  "개인브랜딩",
  "제휴/광고 제안",
  "아직 모르겠음",
];

export const OFFER_OPTIONS = [
  "제품", "서비스", "강의", "전자책", "모임", "상담", "뉴스레터", "무료자료", "아직 없음",
];

export const CONVERSION_PATHS = [
  "링크 클릭", "DM", "댓글", "신청폼", "구매페이지",
  "카카오채널", "오픈채팅", "뉴스레터", "아직 없음",
];

export const PLATFORM_OPTIONS = [
  "Instagram", "YouTube Shorts", "TikTok", "Threads", "Naver Blog",
];

export const WEEKLY_TIME_OPTIONS = [
  "1~2시간", "3~5시간", "6~10시간", "10시간 이상",
];

export const BENCHMARK_SOURCE_LABELS: Record<string, string> = {
  url: "URL",
  manual_text: "직접 설명",
  screenshot: "스크린샷",
  account_id: "계정 아이디",
  caption_script: "캡션/대본",
  csv_import: "CSV",
};

// 결과 카드(첫 화면)에서 보여줄 산출물 목록
export const RESULT_CARDS = [
  { title: "계정 콘셉트", desc: "방향이 다른 3가지 콘셉트 제안" },
  { title: "팔로우할 이유", desc: "8개 항목 추정 점수 진단" },
  { title: "플랫폼 추천", desc: "분야·여건 기반 적합도" },
  { title: "콘텐츠 포맷", desc: "주제 유지 + 포맷 실험안" },
  { title: "벤치마킹 분석", desc: "후킹·CTA·반복 가능성 분해" },
  { title: "14일/30일 플랜", desc: "실험→검증→전환 배치" },
  { title: "수익화 동선", desc: "조회수와 수익을 분리 설계" },
  { title: "프로필 개선안", desc: "소개글·링크·하이라이트" },
  { title: "AI 제작 프롬프트", desc: "복사해서 바로 쓰는 프롬프트" },
];
