// Fixed upstream and read-only operation allowlist: never proxy arbitrary URLs.
export function registerTourProxy(app, { request = fetch, key = () => process.env.TOUR_API_KEY || process.env.VITE_TOUR_API_KEY } = {}) {
  const operations = {
    KorService2: ['areaBasedList2', 'searchKeyword2', 'detailCommon2', 'locationBasedList2'],
    TatsCnctrRateService: ['tatsCnctrRatedList'],
    LocgoHubTarService1: ['areaBasedList1'],
    DataLabService: ['locgoRegnVisitrDDList', 'metcoRegnVisitrDDList'],
  };
  app.get('/api/tourapi/:service/:operation', async (req, res) => {
    const { service, operation } = req.params;
    if (!operations[service]?.includes(operation)) return res.status(404).json({ error: '지원하지 않는 관광 API입니다.' });
    let secret = key()?.trim();
    if (!secret) return res.status(503).json({ error: '관광 API 설정이 필요합니다.' });
    try { secret = decodeURIComponent(secret); } catch {}
    const target = new URL(`https://apis.data.go.kr/B551011/${service}/${operation}`);
    const query = new URL(req.originalUrl, 'http://localhost').searchParams;
    for (const [name, value] of query) if (name.toLowerCase() !== 'servicekey') target.searchParams.append(name, value);
    target.searchParams.set('serviceKey', secret);
    try {
      const upstream = await request(target, { redirect: 'error', signal: AbortSignal.timeout(20000) });
      let body = await upstream.text();
      for (const value of [secret, encodeURIComponent(secret)]) body = body.replaceAll(value, '[redacted]');
      res.status(upstream.status).set('Content-Type', upstream.headers.get('content-type') || 'application/json').send(body);
    } catch {
      res.status(502).json({ error: '관광 데이터 서버에 연결하지 못했습니다.' });
    }
  });
}
