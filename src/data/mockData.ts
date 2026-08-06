import { Genre, EchoCard, FeedItem, Project, ChatMessage } from '../types';
import { calculateOpportunityScore } from '../utils/calculateOpportunityScore';

export const GENRES: Genre[] = [
  { id: 'kpop', name: 'K-POP', icon: '🎵' },
  { id: 'drama', name: '드라마', icon: '🎬' },
  { id: 'food', name: '미식', icon: '🍲' },
  { id: 'festival', name: '축제/이벤트', icon: '🌸' },
  { id: 'kbeauty', name: 'K-뷰티', icon: '💄' },
  { id: 'healing', name: '힐링/자연', icon: '🌲' },
  { id: 'family', name: '가족여행', icon: '👨‍👩‍👧‍👦' },
  { id: 'couple', name: '커플여행', icon: '💖' },
  { id: 'pet', name: '반려동물', icon: '🐶' },
  { id: 'sports', name: '스포츠', icon: '⚽' },
  { id: 'anime', name: '게임/애니', icon: '🎮' },
  { id: 'shopping', name: '쇼핑', icon: '🛍️' },
  { id: 'hotplace', name: 'SNS 핫플', icon: '📸' },
  { id: 'wellness', name: '웰니스', icon: '🧘' },
  { id: 'activity', name: '액티비티', icon: '🪂' }
];

const RAW_ECHO_CARDS: EchoCard[] = [
  // --- K-POP GENRE ---
  {
    id: 'kpop-0',
    rank: 1,
    isHot: true,
    image: '/images/hongje_waterfall.png',
    title: '홍제폭포 힐링 패키지',
    tags: ['홍제폭포', '웰니스', '황톳길', '피크닉'],
    score: 97,
    searchVolume: 15420,
    searchVolumeChange: 168,
    posts: 10200,
    postsChange: 42,
    genreId: 'kpop',
    subtitle: '홍제폭포 × 안산 황톳길 × 피크닉',
    confidence: 97,
    reasonDetails: [
      '최근 30일 SNS 언급량이 168% 증가했어요.',
      '일본 관광객 비율이 42%로 높은 편이에요.',
      '평균 체류시간이 41분으로 짧아 타 소비 기회가 높아요.',
      '웰니스 자연 힐링 트렌드와 강하게 연결돼요.'
    ],
    packageSteps: ['홍제폭포\n전망', '안산 황톳길\n맨발체험', '족욕 및\n휴식', '피크닉\n세트', '덕연이치킨\n로컬 맛집', '야간\n홍제폭포'],
    thumbnails: ['홍제폭포', '황톳길', '피크닉', '덕연이치킨', '야간 홍제폭포'],
    thumbnailImages: ['/images/hongje_waterfall.png', '/images/hongje_mud.png', '', '', ''],
    aiAssistantContext: '홍제폭포 방문객은 평균 체류시간이 짧고 주변 소비가 부족합니다.\n\n황톳길, 피크닉, 로컬 맛집을 결합하면 체류시간과 소비를 크게 늘릴 수 있습니다.',
    aiRecommendedActions: ['황톳길 체험상품 구성', '피크닉 세트 기획', '덕연이치킨 제휴', '야간 조명 프로그램', 'SNS 인증 이벤트'],
    stayTimeMinutes: 41,
    targetStayTimeMinutes: 140,
    keywords: ['홍제폭포', '황톳길', '피크닉', '야경', '덕연이치킨', '웰니스']
  },
  {
    id: 'kpop-1',
    rank: 2,
    isHot: true,
    image: '/images/kpop_concert_geoje_1783824523946.png',
    title: '거제 × 리센느',
    tags: ['콘서트 연계', '섬 투어'],
    score: 96,
    searchVolume: 12540,
    searchVolumeChange: 182,
    posts: 8730,
    postsChange: 156,
    genreId: 'kpop',
    subtitle: '지금이 가장 좋은 타이밍이에요! 🎯',
    confidence: 96,
    reasonDetails: [
      '인스타그램 검색량 +182% 급증',
      '유튜브 관련 영상 +156% 증가',
      '네이버 검색량 지속적 상승 (+128%)',
      '관련 뉴스/콘텐츠 312건 발생',
      '거제 내 관광자원 32곳 확보 (TourAPI)',
      '경쟁 상품 부족 (유사 상품 3개 이하)',
      '이번 주 출시 시 마케팅 효과 최대'
    ]
  },
  {
    id: 'kpop-2',
    rank: 2,
    isHot: false,
    image: '/images/kpop_busan_tour_1783824535162.png',
    title: '부산 × BTS 팬투어',
    tags: ['콘서트', '성지순례'],
    score: 93,
    searchVolume: 9210,
    searchVolumeChange: 148,
    posts: 1562, // youtubeViews placeholder
    postsChange: 230,
    genreId: 'kpop',
    subtitle: '글로벌 아미(ARMY)의 화력이 강력하게 집중되는 곳! 💜',
    confidence: 93,
    reasonDetails: [
      '부산 금정구 및 다대포 성지 조회수 +148% 상승',
      '글로벌 팬 커뮤니티 내 포스팅 버즈량 230% 폭발',
      '유튜브 하이라이트 영상 누적 156만 뷰 돌파',
      '인바운드 외국인 관광객 패키지 문의율 35% 급증',
      '지자체 공식 스탬프 투어 제휴 완료',
      '평일 유휴 객실 모객에 절대적으로 유리'
    ]
  },
  {
    id: 'kpop-3',
    rank: 3,
    isHot: false,
    image: '/images/kpop_popup_store_1783824545461.png',
    title: '서울 × 에스파 팝업투어',
    tags: ['팝업스토어', '쇼핑'],
    score: 89,
    searchVolume: 6870,
    searchVolumeChange: 128,
    posts: 5430,
    postsChange: 176,
    genreId: 'kpop',
    subtitle: '성수동과 압구정을 잇는 트렌디 팝업 레이아웃 ⚡',
    confidence: 89,
    reasonDetails: [
      '성수동 에스파 컨셉스토어 주말 대기인원 2천명 돌파',
      '인스타그램 릴스 조회수 평균 20만회 이상 기록',
      '네이버 지도 저장 횟수 전월 대비 128% 증가',
      '외국인 소매 구매액 연계 매출 분석 긍정적 효과',
      'F&B 브랜드 콜라보 한정 혜택 포함 구성 가능',
      '2030 트렌드 세터 집중 타겟팅'
    ]
  },
  {
    id: 'kpop-4',
    rank: 4,
    isHot: false,
    image: '/images/kpop_hanok_tour_1783824554260.png',
    title: '전주 × 세븐틴 힐링투어',
    tags: ['한옥체험', '미식'],
    score: 86,
    searchVolume: 5410,
    searchVolumeChange: 98,
    posts: 3120,
    postsChange: 178,
    genreId: 'kpop',
    subtitle: '전통 한옥 속에서 만나는 세븐틴 멤버들의 발자취 🌿',
    confidence: 86,
    reasonDetails: [
      '세븐틴 자체 예능 전주 촬영지 조회수 98% 상승',
      'X(구 트위터) 실시간 트렌드 및 해시태그 3,120건 도달',
      '전주 한옥마을 내 전통주/다도 패키지 관심 고조',
      '팬클럽(캐럿) 대상 자체 할인 혜택 설계 완료',
      '무공해 힐링 라이프스타일 결합으로 고부가가치 창출',
      '연령대 다양화(10대부터 40대까지 패밀리 투어 가능)'
    ]
  },
  {
    id: 'kpop-5',
    rank: 5,
    isHot: false,
    image: '/images/kpop_jeju_cafe_1783824562987.png',
    title: '제주 × 아이브 감성투어',
    tags: ['감성여행', '카페투어'],
    score: 83,
    searchVolume: 4320,
    searchVolumeChange: 76,
    posts: 892,
    postsChange: 95,
    genreId: 'kpop',
    subtitle: '푸른 제주 바다와 아이브의 러블리 무비 로케이션 🌸',
    confidence: 83,
    reasonDetails: [
      '제주 동부 해안가 아이브 MV 촬영지 검색수 76% 상승',
      '인스타그램 인생샷 명소 해시태그 #IVE_Jeju 누적 등록',
      '현지 감성 풀빌라 및 프라이빗 요트 코스 연계',
      'MZ세대 타겟 SNS 포토 스팟 전문 가이드 동행',
      '주요 카페 7곳과 무료 음료권 패키지 제휴',
      '인플루언서 마케팅 연계 시 파급효과 극대화 기대'
    ]
  },
  {
    id: 'kpop-6',
    rank: 6,
    isHot: false,
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&auto=format&fit=crop&q=60',
    title: '강릉 × 스트레이키즈',
    tags: ['드라이브', '액티비티'],
    score: 80,
    searchVolume: 3980,
    searchVolumeChange: 64,
    posts: 2870,
    postsChange: 81,
    genreId: 'kpop',
    subtitle: '거친 동해 바다에서 느끼는 스트레이키즈의 청춘 에너제틱 코스 🌊',
    confidence: 80,
    reasonDetails: [
      '강릉 헌화로 드라이브 코스 및 서핑 스쿨 검색 64% 증가',
      'Stray Kids 관련 글로벌 포럼 내 강원권 성지순례 게시물 2,870건',
      '동해안 레일바이크 및 해안 글램핑 패키지 연동',
      '강릉 수제맥주 브루어리 시음 혜택 단독 설계',
      '액티브한 1020 남녀 고객 유입에 적합',
      '주말 1박 2일 컴팩트 일정으로 높은 모객율 기대'
    ]
  },

  // --- DRAMA GENRE ---
  {
    id: 'drama-1',
    rank: 1,
    isHot: true,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=60',
    title: '강릉 × 도깨비 & 청춘 로드',
    tags: ['드라마 로케', '바다 카페'],
    score: 95,
    searchVolume: 14210,
    searchVolumeChange: 195,
    posts: 9540,
    postsChange: 162,
    genreId: 'drama',
    subtitle: '첫사랑의 감성 그대로, 영진해변 방파제와 정동진 로드 🎬',
    confidence: 95,
    reasonDetails: [
      '드라마 OST 역주행에 따른 관련 해시태그 검색량 +195% 폭증',
      '영진해변 ‘빨간 목도리’ 대여 포토존 유입객 주말 3천 명',
      '유튜브 하이라이트 영상 재조명 200만 조회수 달성',
      '정동진 레트로 열차 패키지 선판매율 85% 돌파',
      '강릉 안목해변 커피거리 제휴 쿠폰북 기본 포함',
      '감성 숏폼 영상 제작 가이드라인 제공 패키지 구성'
    ]
  },
  {
    id: 'drama-2',
    rank: 2,
    isHot: false,
    image: 'https://images.unsplash.com/photo-1501183007986-d0d080b147f9?w=600&auto=format&fit=crop&q=60',
    title: '수원 × 선재 업고 튀어 투어',
    tags: ['레트로 골목', '카페 투어'],
    score: 91,
    searchVolume: 8940,
    searchVolumeChange: 137,
    posts: 4210,
    postsChange: 185,
    genreId: 'drama',
    subtitle: '임솔과 선재의 비 오는 날 벽화골목 감성 데이트 ☔',
    confidence: 91,
    reasonDetails: [
      '행궁동 공방거리 및 촬영 가옥 방문객 월평균 300% 급상승',
      '인스타그램 릴스 내 비오는 행궁동 데이트 코스 180만 뷰',
      '전통 문방구 레트로 불량식품/문구 뽑기 패키징 완료',
      '행궁동 자전거 택시 탑승권 연동 단독 할인 혜택',
      '청춘 드라마 팬덤의 강력한 성지 보존 요청 반영',
      'SNS 인증 유치 시 지역 소상공인 연계 활성화율 최고 수준'
    ]
  },
  {
    id: 'drama-3',
    rank: 3,
    isHot: false,
    image: 'https://images.unsplash.com/photo-1513553404607-988bf2703777?w=600&auto=format&fit=crop&q=60',
    title: '포항 × 갯마을 차차차 힐링',
    tags: ['어촌 마을', '로컬 푸드'],
    score: 88,
    searchVolume: 7120,
    searchVolumeChange: 104,
    posts: 3120,
    postsChange: 112,
    genreId: 'drama',
    subtitle: '공진 시장과 붉은 등대 아래에서 먹는 전복죽과 물회 🍲',
    confidence: 88,
    reasonDetails: [
      '포항 구룡포 및 청하 시장 촬영지 방문 버즈량 +104% 지속',
      '네이버 블로그 후기 및 여행 일정표 스크랩 3,120건 기록',
      '포항 해상 스카이워크 및 사방기념공원 보트 연계',
      '로컬 어촌계 직영 횟집 물회 시식권 기본 구성 탑재',
      '힐링/안식처 컨셉으로 3040 직장인 고정 타겟층 확보',
      '바다 전망 오션 카라반 숙박 패키지 인지도 우수'
    ]
  },
  {
    id: 'drama-4',
    rank: 4,
    isHot: false,
    image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&auto=format&fit=crop&q=60',
    title: '제주 × 삼달리 힐링 로드',
    tags: ['오름/숲길', '독채 스테이'],
    score: 85,
    searchVolume: 5120,
    searchVolumeChange: 92,
    posts: 1980,
    postsChange: 84,
    genreId: 'drama',
    subtitle: '삼달이의 카메라 렌즈 속 숨겨진 오름과 노을 🌅',
    confidence: 85,
    reasonDetails: [
      '제주 동부 미공개 숲길 및 사진작가 출사지 검색어 92% 급증',
      '조용한 시골마을 정취의 독채 돌담 스테이 사전 예약제 운영',
      '현지 해녀들과의 뿔소라 구이 체험 프로그램 독점 제휴',
      '제주 노을 스팟을 달리는 빈티지 오픈카 렌탈 20% 특별 우대',
      '힐링, 명상, 자연 중심의 프리미엄 슬로우 투어 설계',
      '복잡한 상업 관광지에 지친 고품격 웰니스 선호 고객용'
    ]
  },
  {
    id: 'drama-5',
    rank: 5,
    isHot: false,
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=60',
    title: '서울 × 눈물의 여왕 백화점 투어',
    tags: ['럭셔리 라이프', '시티 야경'],
    score: 82,
    searchVolume: 4120,
    searchVolumeChange: 81,
    posts: 1540,
    postsChange: 73,
    genreId: 'drama',
    subtitle: '현우와 해인의 퀸즈 백화점 데이트와 루프탑 프라이빗 디너 🥂',
    confidence: 82,
    reasonDetails: [
      '여의도 대형 쇼핑몰 내 팝업존 및 럭셔리 라운지 검색 81% 증가',
      '한강 크루즈 불꽃 요트 투어 연계 럭셔리 패키지 문의 다수',
      '특급 호텔 1박 숙박 및 프라이빗 도슨트 쇼핑 동행 서비스',
      'SNS에 최적화된 하이엔드 다이닝 디너 혜택 포함',
      '기념일을 맞이한 2030 영 앤 리치 커플 집중 공략',
      '쇼핑과 숙박, 뷰티 올인원 구성으로 편리성 극대화'
    ]
  },
  {
    id: 'drama-6',
    rank: 6,
    isHot: false,
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&auto=format&fit=crop&q=60',
    title: '경주 × 선덕여왕 역사문화 로드',
    tags: ['전통 한옥', '역사 야경'],
    score: 79,
    searchVolume: 3210,
    searchVolumeChange: 52,
    posts: 1100,
    postsChange: 48,
    genreId: 'drama',
    subtitle: '천년고도 경주의 대릉원 녹음과 동궁과 월지 야간 보행길 🌙',
    confidence: 79,
    reasonDetails: [
      '경주 역사지구 야간 미디어파사드 상영 일정 예약 52% 증가',
      '황리단길 전통 한복 및 신라 의상 대여 코스 할인 제휴',
      '전문 문화해설사와 함께하는 별빛 첨성대 미드나잇 야외 투어',
      '전통 경주빵 만들기 체험 클래스 및 한정식 밥상 연계',
      '가족 단위 에듀케이션 투어 및 실버 관광층 만족도 최고',
      '여유롭고 차분한 전통 한옥 스테이 투어 패키징'
    ]
  },

  // --- FOOD GENRE ---
  {
    id: 'food-1',
    rank: 1,
    isHot: true,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=60',
    title: '목포 × 밤의 맛 탐방투어',
    tags: ['야시장', '해산물'],
    score: 94,
    searchVolume: 11540,
    searchVolumeChange: 168,
    posts: 7420,
    postsChange: 142,
    genreId: 'food',
    subtitle: '항구 도시 목포의 낙지 탕탕이와 민어회 맛 탐방 투어 🍲',
    confidence: 94,
    reasonDetails: [
      '목포 9미(味) 관련 미식 검색 지표 +168% 상승',
      '유튜브 먹방 콘텐츠 조회수 누적 300만 뷰 급증',
      '목포 해상케이블카 야간 탑승 및 항구 야시장 투어 연계',
      '백종원 추천 전통 맛집 3곳 프라이빗 웨이팅 프리 패스',
      '식도락 전문 로컬 가이드의 유쾌한 스토리텔링 동행',
      '단체 모객 대비 소규모 맞춤 패키지 수요 1위'
    ]
  },
  {
    id: 'food-2',
    rank: 2,
    isHot: false,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=60',
    title: '대구 × 안지랑 막창 레트로',
    tags: ['막창거리', '먹자골목'],
    score: 90,
    searchVolume: 7890,
    searchVolumeChange: 115,
    posts: 3840,
    postsChange: 120,
    genreId: 'food',
    subtitle: '숯불 향 가득한 대구의 막창 골목과 시원한 수제 맥주 🍻',
    confidence: 90,
    reasonDetails: [
      '인스타그램 릴스 #대구맛집 #안지랑골목 해시태그 115% 상승',
      '막창과 대구 명물 납작만두 콜라보 야외 테라스 맛집 선별',
      '수제맥주 브루어리 공장 투어 및 캔 맥주 DIY 제작 패키지',
      '레트로 음악 감상 및 빈티지 LP바 프리패스 드링크권 제공',
      '대학생 및 청년 직장인 중심의 친목/먹방 투어 유치 강세',
      '대구 시티 투어 버스 1일 이용권 기본 탑재 구성'
    ]
  },
  {
    id: 'food-3',
    rank: 3,
    isHot: false,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=60',
    title: '부산 × 돼지국밥 로컬 마스터',
    tags: ['노포 맛집', '밀면로드'],
    score: 87,
    searchVolume: 6120,
    searchVolumeChange: 98,
    posts: 2980,
    postsChange: 86,
    genreId: 'food',
    subtitle: '진한 사골 육수의 부산 노포 돼지국밥과 깡통시장 야식 야시장 🍜',
    confidence: 87,
    reasonDetails: [
      '부산 대표 노포 골목 먹거리 지도 스크랩 98% 증가',
      '현지 택시기사들이 인정한 숨겨진 돼지국밥 맛집 단독 제휴',
      '깡통야시장 씨앗호떡, 비빔당면 등 야식 스탬프 투어북 제공',
      '부산항대교 야경 전망 루프탑 카페 시그니처 커피 제공',
      '남녀노소 누구나 좋아하는 대중성 최고의 국밥 기획전',
      '저렴한 구성가로 패키지 전환율 220% 향상 가능성 검증'
    ]
  },

  // --- FESTIVAL GENRE ---
  {
    id: 'festival-1',
    rank: 1,
    isHot: true,
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&auto=format&fit=crop&q=60',
    title: '부산 × 불꽃축제 요트명당',
    tags: ['요트 투어', 'VIP 좌석'],
    score: 97,
    searchVolume: 18540,
    searchVolumeChange: 245,
    posts: 12540,
    postsChange: 210,
    genreId: 'festival',
    subtitle: '일 년에 단 하루, 한강과 광안리를 압도하는 최상의 해상 VIP 불꽃 뷰 🎆',
    confidence: 97,
    reasonDetails: [
      '부산 불꽃축제 요트 선상 예약 키워드 검색 +245% 폭증',
      '축제 당일 광안리 일대 도로 통제에 대응한 독보적인 요트 접근권',
      '샴페인 핑거푸드 케이터링 및 선상 라이브 재즈 공연 연동',
      '고급 요트 2층 테라스 VIP 6인 프라이빗 석 한정 한정판 상품',
      '연인 프로포즈 및 기업 VIP 패키지 전용 단독 문의 속출',
      '티켓 프리미엄 마진율 +40% 이상 확보 가능한 최고수익 상품'
    ]
  },
  {
    id: 'festival-2',
    rank: 2,
    isHot: false,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=60',
    title: '보령 × 머드 익스트림 페스티벌',
    tags: ['머드 체험', 'EDM 파티'],
    score: 92,
    searchVolume: 9870,
    searchVolumeChange: 125,
    posts: 5840,
    postsChange: 130,
    genreId: 'festival',
    subtitle: '낮에는 시원한 진흙 뒹굴기, 밤에는 대천해변 EDM 뮤직 나이트! 🎸',
    confidence: 92,
    reasonDetails: [
      '대천해수욕장 머드존 입장권 판매 추이 +125% 급상승',
      '해외 인플루언서 틱톡 머드챌린지 영상 누적 500만 조회 달성',
      '리조트 1박 및 대천 짚라인 체험권 원스톱 옵션 추가',
      '머드 페스티벌 한정판 기념 티셔츠 및 방수팩 사은품 증정',
      '102030 영 제너레이션 중심의 버스 셔틀 패키지 완비',
      '뜨거운 한여름 탈일상 자극 콘텐츠로 모객 반응 즉각 확인'
    ]
  }
];

export const ECHO_CARDS: EchoCard[] = RAW_ECHO_CARDS.map((card) => {
  const result = calculateOpportunityScore(card);
  return {
    ...card,
    score: result.score,
    level: result.level,
    scoreReasons: result.reasons,
    scoreBreakdown: result.breakdown,
  };
});


export const REALTIME_FEED: FeedItem[] = [
  {
    id: 'feed-1',
    channel: 'Instagram',
    title: '거제 리센느 🍊',
    value: '+182%',
    change: '급상승',
    subValue: '관련 게시물 12,540건',
    trendType: 'up',
    chartData: [40, 48, 45, 62, 58, 82]
  },
  {
    id: 'feed-2',
    channel: 'YouTube',
    title: '거제야호 챌린지 🎬',
    value: '156만',
    change: '인기 급상승',
    subValue: '조회수 (최근 7일)',
    trendType: 'up',
    chartData: [30, 35, 50, 72, 85, 120]
  },
  {
    id: 'feed-3',
    channel: 'Naver',
    title: '거제 여행 ✈️',
    value: '+128%',
    change: '상승',
    subValue: '검색량(7일) 8,730건',
    trendType: 'up',
    chartData: [50, 52, 60, 58, 70, 85]
  },
  {
    id: 'feed-4',
    channel: 'News',
    title: '리센느 거제 홍보대사 📰',
    value: '312건',
    change: '이슈',
    subValue: '관련 뉴스 (7일)',
    trendType: 'up',
    chartData: [10, 15, 32, 28, 40, 55]
  },
  {
    id: 'feed-5',
    channel: 'TikTok',
    title: '#거제야호 🔥',
    value: '480만',
    change: '바이럴',
    subValue: '조회수 (최근 7일)',
    trendType: 'up',
    chartData: [10, 20, 15, 50, 65, 95]
  },
  {
    id: 'feed-6',
    channel: 'X',
    title: '리센느 컴백 🐦',
    value: '3,210',
    change: '인기',
    subValue: '언급량 (최근 7일)',
    trendType: 'up',
    chartData: [20, 25, 42, 38, 55, 78]
  }
];

export const RECENT_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: '거제 리센느 2박 3일 상품',
    status: '기획 중',
    progress: 60,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&auto=format&fit=crop&q=60'
  },
  {
    id: 'proj-2',
    title: '부산 BTS 팬투어 3박 4일',
    status: '분석 중',
    progress: 30,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=100&auto=format&fit=crop&q=60'
  }
];

export const CHAT_HISTORY: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'ai',
    text: '안녕하세요, 소다쌤! 오늘은 AI가 분석한 최신 데이터를 바탕으로 최적의 여행상품 기획을 추천해드릴게요.',
    time: '10:30 AM'
  },
  {
    id: 'msg-2',
    sender: 'user',
    text: 'K-POP 장르에서 지금 가장 핫한 여행상품 만들어줘',
    time: '10:31 AM'
  },
  {
    id: 'msg-3',
    sender: 'ai',
    text: '좋아요! K-POP 장르의 실시간 트렌드를 분석해 지금 가장 기회가 높은 상품들을 찾아드릴게요. ✨',
    time: '10:31 AM'
  }
];
