# lab

작고 빠르게 만들어보는 웹 서비스 모음. 한 저장소에 여러 서비스가 `apps/` 아래로 들어가고,
각각 독립적으로 배포됩니다.

## 서비스

| 앱 | 배포 | 설명 |
| --- | --- | --- |
| [wongoji](apps/wongoji) | [wongoji-write.vercel.app](https://wongoji-write.vercel.app/) | 이어달리기 원고지 — 한 사람이 하루에 한 글자씩 이어 쓰는 공용 원고지 |
| [cointower](apps/cointower) | [cointower-luck.vercel.app](https://cointower-luck.vercel.app/) | 동전탑 — 앞면만으로 몇 층까지 쌓는지 겨루는 기록판 |
| [quest](apps/quest) | [quest-guild.vercel.app](https://quest-guild.vercel.app/) | 오늘의 퀘스트 — 파티원 중 오늘의 용사를 소환하는 랜덤 추첨기 |
| [omikuji](apps/omikuji) | 아직 없음 | 오늘의 냥쿠지 — 도트 고양이가 흔들어 주는 하루 한 번의 운세 뽑기 |

## 개발

npm workspaces를 씁니다. 루트에서 한 번만 설치하면 모든 앱의 의존성이 함께 설치됩니다.

```bash
npm install
npm run wongoji      # apps/wongoji 개발 서버 (:3000)
npm run cointower    # apps/cointower 개발 서버 (:3001)
npm run quest        # apps/quest 개발 서버 (:3002)
npm run omikuji      # apps/omikuji 개발 서버 (:3003)
```

앱마다 포트를 다르게 고정해 두었으므로 동시에 띄워도 부딪히지 않습니다.

## 새 서비스 추가하기

1. `apps/<이름>/` 폴더를 만들고 `package.json`의 `name`을 `<이름>`으로 둡니다.
2. `dev` 스크립트에 아직 쓰지 않은 포트를 `--port`로 고정합니다.
3. 루트 `package.json`의 `scripts`에 개발 서버 단축 명령을 추가합니다.
4. 루트에서 `npm install` 한 번.

`apps/*`가 이미 workspace 글롭이라 루트 설정을 따로 고칠 일은 없습니다.

## 배포 (Vercel)

앱 하나당 Vercel 프로젝트 하나를 만들고, 같은 저장소를 연결한 뒤
**Settings → General → Root Directory**를 해당 앱 경로로 지정합니다.

| 앱 | Root Directory | 저장소 |
| --- | --- | --- |
| wongoji | `apps/wongoji` | Upstash Redis |
| cointower | `apps/cointower` | Upstash Redis |
| quest | `apps/quest` | 없음 |
| omikuji | `apps/omikuji` | 없음 |

Root Directory를 지정하면 Vercel이 해당 경로 변경분만 보고 빌드하므로,
한 앱을 고쳐도 다른 앱이 다시 배포되지 않습니다.

### 저장소 연결

Storage 탭에서 Upstash Redis를 연결하면 자격증명이 자동으로 주입됩니다. 변수 이름은
**`KV_REST_API_URL` / `KV_REST_API_TOKEN`** 입니다 — 2024년 Vercel KV에서 Upstash로
이관될 때 남은 레거시 이름이라, Upstash 문서가 안내하는 `UPSTASH_REDIS_REST_*` 와
다릅니다. 두 이름 모두 읽도록 해두었으니 어느 쪽으로 붙여도 동작합니다.

**연결한 뒤에는 반드시 재배포해야 합니다.** 환경변수는 빌드 시점에 주입되므로, 연결만
하고 두면 기존 배포는 계속 저장소 없이 돌아갑니다. 이 상태에서는 인스턴스마다 자기
메모리로 응답해서 **사람마다 다른 화면을 보고, 콜드 스타트마다 데이터가 사라집니다.**
겉보기엔 멀쩡해 보이므로 앱이 이때 화면에 경고를 띄웁니다. 그 경고가 보이면 재배포가
빠진 것입니다.

키에 앱별 접두어(`wongoji:`, `tower:`)를 붙이므로 하나의 Upstash 인스턴스를 공유해도
서로 침범하지 않습니다.

무료 한도는 Upstash가 먼저 찹니다 — 월 50만 명령, 데이터 256 MB. Vercel Hobby는 월
100 GB 전송과 100만 호출이고, **초과하면 과금이 아니라 30일간 정지**입니다. Hobby는
비상업적 용도 전용이라 광고나 결제를 붙이려면 Pro로 올려야 합니다.
