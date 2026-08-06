import { useTourData } from '../hooks/useTourData';

interface TourApiTestProps {
  areaCode?: number;
}

export default function TourApiTest({ areaCode = 1 }: TourApiTestProps) {
  const { loading, error, data } = useTourData(areaCode);

  return (
    <div className="p-4 bg-neutral-900 text-white rounded-lg m-4 shadow-md text-xs">
      <h3 className="font-bold text-sm mb-2 text-emerald-400">
        TourAPI 연결 테스트 (지역 코드: {areaCode})
      </h3>
      
      {loading && <div className="text-neutral-300">불러오는 중...</div>}

      {error && (
        <div className="text-red-400 font-medium">
          [오류] {error}
        </div>
      )}

      {!loading && !error && (
        <div>
          <p className="text-neutral-400 mb-2">관광지 목록 ({data.length}건):</p>
          <ul className="list-disc list-inside space-y-1">
            {data.map((spot, index) => (
              <li key={spot.contentid || index} className="text-neutral-200">
                {spot.title || '(제목 없음)'} {spot.addr1 ? `- ${spot.addr1}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
