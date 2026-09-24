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

Root Directory만 지정해서는 푸시마다 모든 앱이 다시 빌드됩니다. 그래서 프로젝트마다
**변경 없는 커밋은 배포 건너뛰기**(Settings → Build and Deployment → Root Directory 아래)를
켜 둡니다. 아래 워크플로가 모든 프로젝트에 알아서 켜므로, 한 앱을 고치면 그 앱만 배포되고
`apps/` 밖만 바꾼 PR에는 배포가 붙지 않습니다.

### 배포 자동화

- **기존 앱**: Vercel Git 연동이 알아서 배포합니다. PR에는 미리보기가, `main`에는 프로덕션이 올라갑니다.
- **새 앱**: `apps/<이름>/`이 `main`에 들어오면 [`Vercel projects`](.github/workflows/vercel-projects.yml)
  워크플로가 Root Directory가 `apps/<이름>`인 Vercel 프로젝트 `<이름>`을 만들고 첫 프로덕션 배포를 띄웁니다.
  같은 Root Directory로 이 저장소에 연결된 프로젝트가 이미 있으면 이름이 달라도 새로 만들지 않습니다.
- **모든 프로젝트**: 같은 워크플로가 "변경 없는 커밋은 배포 건너뛰기"가 꺼져 있으면 켭니다. 그 밖의 설정은 건드리지 않습니다.

워크플로는 `apps/**`나 워크플로 자체가 바뀐 채 `main`에 푸시될 때 돌고, Actions 탭에서 수동으로 돌릴 수도 있습니다.

처음 한 번만 설정합니다.

1. [Vercel → Account Settings → Tokens](https://vercel.com/account/tokens)에서 토큰을 만듭니다. Scope는 프로젝트가 있는 팀으로 둡니다.
2. GitHub 저장소 **Settings → Secrets and variables → Actions**에 `VERCEL_TOKEN` 시크릿으로 넣습니다.
3. 팀이 바뀌면 같은 화면의 Variables에 `VERCEL_TEAM_ID`를 넣습니다. 없으면 현재 팀 ID를 씁니다.

시크릿이 없으면 워크플로는 경고만 남기고 건너뜁니다. 자동으로 만든 프로젝트의 주소는
`<이름>.vercel.app`이고, 이미 쓰인 이름이면 Vercel이 다른 주소를 붙입니다. `*-luck` 같은 별칭 도메인과
Upstash 연결은 여전히 Vercel에서 직접 합니다.

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
