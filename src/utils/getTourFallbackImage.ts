export interface TourFallbackImageResult {
  image: string;
  fallbackCategory: string;
  fallbackLabel: string;
}

export function getTourFallbackImage(
  title?: string,
  contentTypeId?: string | number
): TourFallbackImageResult {
  const safeTitle = (title || '').toLowerCase().replace(/\s+/g, '');
  const typeIdStr = contentTypeId ? String(contentTypeId) : '';

  // 1. A: 성당 / 교회 (palace보다 반드시 먼저 검사하여 '성' 키워드와 오매칭 방지)
  const churchKeywords = ['성당', '교회', '대성당', '예배당', 'chapel', 'church', 'cathedral'];
  if (churchKeywords.some((kw) => safeTitle.includes(kw))) {
    return {
      image: '/images/place/church.png',
      fallbackCategory: 'church',
      fallbackLabel: '성당·교회 테마 이미지',
    };
  }

  // 2. B: 궁 / 한옥 / 성 / 문
  const palaceKeywords = [
    '궁', '궁궐', '한옥', '성', '성곽', '문', '고택', '민속촌', '왕릉', '사찰', '절'
  ];
  // 단어 일부 오매칭 방지: '성당' 등은 위에서 미리 처리됨
  if (palaceKeywords.some((kw) => safeTitle.includes(kw))) {
    return {
      image: '/images/place/palace.png',
      fallbackCategory: 'palace',
      fallbackLabel: '고궁·한옥 테마 이미지',
    };
  }

  // 3. C: 해변 / 바다 / 항구
  const oceanKeywords = [
    '해변', '해수욕장', '바다', '해안', '항구', '포구', '섬', '등대', '선착장'
  ];
  if (oceanKeywords.some((kw) => safeTitle.includes(kw))) {
    return {
      image: '/images/place/ocean.png',
      fallbackCategory: 'ocean',
      fallbackLabel: '바다·해변 테마 이미지',
    };
  }

  // 4. D: 산 / 공원 / 계곡 / 폭포
  const natureKeywords = [
    '산', '공원', '계곡', '폭포', '숲', '수목원', '자연휴양림', '둘레길', '올레길', '정원', '호수'
  ];
  if (natureKeywords.some((kw) => safeTitle.includes(kw))) {
    return {
      image: '/images/place/nature.png',
      fallbackCategory: 'nature',
      fallbackLabel: '자연·숲 테마 이미지',
    };
  }

  // 5. E: 시장 / 쇼핑 / 거리
  const marketKeywords = [
    '시장', '쇼핑', '거리', '상가', '몰', '백화점', '아울렛', '상점가', '전통시장'
  ];
  if (marketKeywords.some((kw) => safeTitle.includes(kw))) {
    return {
      image: '/images/place/market..png',
      fallbackCategory: 'market',
      fallbackLabel: '시장·거리 테마 이미지',
    };
  }

  // 6. F: 식당 / 카페 / 맛집 또는 contentTypeId가 39 (음식점)
  const foodKeywords = [
    '식당', '음식점', '맛집', '카페', '커피', '레스토랑', '베이커리', '디저트'
  ];
  if (typeIdStr === '39' || foodKeywords.some((kw) => safeTitle.includes(kw))) {
    return {
      image: '/images/place/food..png',
      fallbackCategory: 'food',
      fallbackLabel: '미식·카페 테마 이미지',
    };
  }

  // 7. G: 기본 이미지
  return {
    image: '/images/place/default.png',
    fallbackCategory: 'default',
    fallbackLabel: '관광지 기본 이미지',
  };
}
