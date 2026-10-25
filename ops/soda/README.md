# 야호 소다서버 운영

GitHub 커밋 archive로 빌드하며 비밀 설정은 `/srv/soda/config/yaho-production/runtime.env`에만 보관합니다.
TourAPI는 고정된 공공 API 주소로 서버에서 중계하여 브라우저 JS에 키를 넣지 않습니다.
작성 중인 기획안은 기존과 동일한 도메인의 브라우저 localStorage에 남습니다. 별도 서버 DB는 없습니다.
프록시는 yaho.sodayeon.co.kr → 127.0.0.1:13097입니다.
`YAHO_PREWARM=false`는 시작 시 유료 AI 사전 수집을 하지 않으며 실제 화면 요청 때 정상 수집합니다.
배포 전 원본 프록시 설정을 백업하고 실패하면 기존 11번6978로 되돌립니다.
11번 프로세스는 전환 후에도 복구용으로 유지합니다.
