/**
 * 장소/카테고리/키워드에 맞춰 fallback 이미지를 매칭해주는 헬퍼 함수
 */

// /public/images/place/ 디렉토리 내 사용 가능한 이미지 파일 목록
export const PLACE_IMAGES = {
  church: '/images/place/church.png',
  palace: '/images/place/palace.png',
  ocean: '/images/place/ocean.png',
  nature: '/images/place/nature.png',
  market: '/images/place/market..png',
  food: '/images/place/food..png',
  default: '/images/place/default.png',
} as const;

/**
 * 텍스트(제목, 태그, 카테고리 등) 및 기존 image URL을 기반으로 적절한 이미지를 반환합니다.
 * 이미지 정보가 없거나, 깨진 이미지/빈 문자열일 경우 키워드 매칭을 진행하고 
 * 매칭되는 것이 없으면 default.png를 반환합니다.
 */
export function getPlaceImage(imageUrl?: string | null, textContent?: string): string {
  // 1. 이미지가 정상적으로 제공된 경우 (http://, https://, /images/ 등)
  if (imageUrl && imageUrl.trim() !== '') {
    return imageUrl;
  }

  // 2. 이미지 정보가 없을 경우 textContent(제목, 태그 등) 기반으로 적절한 이미지 매칭
  const text = (textContent || '').toLowerCase();

  if (text.includes('음식') || text.includes('맛집') || text.includes('카페') || text.includes('food') || text.includes('미식') || text.includes('치킨')) {
    return PLACE_IMAGES.food;
  }

  if (text.includes('시장') || text.includes('쇼핑') || text.includes('market') || text.includes('마트') || text.includes('상점')) {
    return PLACE_IMAGES.market;
  }

  if (text.includes('성당') || text.includes('교회') || text.includes('사찰') || text.includes('절') || text.includes('종교') || text.includes('church')) {
    return PLACE_IMAGES.church;
  }

  if (text.includes('궁') || text.includes('궁궐') || text.includes('경복궁') || text.includes('덕수궁') || text.includes('창덕궁') || text.includes('성') || text.includes('palace') || text.includes('역사')) {
    return PLACE_IMAGES.palace;
  }

  if (text.includes('바다') || text.includes('해변') || text.includes('해수욕장') || text.includes('섬') || text.includes('ocean') || text.includes('beach') || text.includes('포구')) {
    return PLACE_IMAGES.ocean;
  }

  if (text.includes('자연') || text.includes('산') || text.includes('공원') || text.includes('폭포') || text.includes('숲') || text.includes('nature') || text.includes('힐링') || text.includes('황톳길')) {
    return PLACE_IMAGES.nature;
  }

  // 3. 매칭되는 키워드가 없으면 default 이미지 반환
  return PLACE_IMAGES.default;
}
