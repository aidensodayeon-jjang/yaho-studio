import { EchoCard } from '../types';
import { TourSpotItem } from '../api/tourApi';
import { ECHO_CARDS } from '../data/mockData';
import { getTourFallbackImage } from './getTourFallbackImage';

function generateScore(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  return 70 + (positiveHash % 26); // 70 to 95 inclusive
}

export function tourSpotToEchoCard(spot: TourSpotItem, index: number): EchoCard {
  const fallbackCard = ECHO_CARDS[index % ECHO_CARDS.length] || ECHO_CARDS[0];
  const title = spot.title || '관광지';

  // 1. TourAPI의 firstimage가 있으면 반드시 실제 이미지를 우선 사용
  const hasOriginalImage = Boolean(spot.firstimage && spot.firstimage.trim() !== '');
  const fallbackResult = getTourFallbackImage(title, spot.contenttypeid);

  const displayImage = hasOriginalImage ? spot.firstimage! : fallbackResult.image;

  return {
    ...fallbackCard,
    id: spot.contentid || `tour-${index}`,
    contentid: spot.contentid,
    contenttypeid: spot.contenttypeid,
    title: title,
    addr1: spot.addr1 || '',
    image: displayImage,
    hasOriginalImage: hasOriginalImage,
    imageSource: hasOriginalImage ? 'tourApi' : 'placeholder',
    fallbackCategory: fallbackResult.fallbackCategory,
    fallbackLabel: fallbackResult.fallbackLabel,
    score: generateScore(spot.contentid || String(index)),
    subtitle: spot.addr1 ? `위치: ${spot.addr1}` : fallbackCard.subtitle,
    tags: spot.addr1
      ? spot.addr1.split(' ').slice(0, 3).filter(Boolean)
      : fallbackCard.tags,
  };
}
