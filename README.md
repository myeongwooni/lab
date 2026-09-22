# lab

작고 빠르게 만들어보는 웹 서비스 모음. 한 저장소에 여러 서비스가 `apps/` 아래로 들어가고,
각각 독립적으로 배포됩니다.

## 구조

```
apps/
  wongoji/     이어달리기 원고지 — 한 사람이 하루에 한 글자씩 이어 쓰는 공용 원고지
  coinchain/   동전 체인 — 모두가 이어 온 연속 기록, 끊은 사람의 이름이 남는 곳
```

npm workspaces를 씁니다. 루트에서 한 번만 설치하면 모든 앱의 의존성이 함께 설치됩니다.

```bash
npm install
npm run wongoji      # apps/wongoji 개발 서버 (:3000)
npm run coinchain    # apps/coinchain 개발 서버 (:3001)
```

앱마다 포트를 다르게 고정해 두었으므로 동시에 띄워도 부딪히지 않습니다.

## 새 서비스 추가하기

1. `apps/<이름>/` 폴더를 만들고 `package.json`의 `name`을 `<이름>`으로 둡니다.
2. 루트 `package.json`의 `scripts`에 개발 서버 단축 명령을 추가합니다.
3. 루트에서 `npm install` 한 번.

`apps/*`가 이미 workspace 글롭이라 루트 설정을 따로 고칠 일은 없습니다.

## 배포 (Vercel)

앱 하나당 Vercel 프로젝트 하나를 만들고, 같은 저장소를 연결한 뒤
**Settings → General → Root Directory**를 해당 앱 경로로 지정합니다.

| 앱 | Root Directory | 필요한 환경변수 |
| --- | --- | --- |
| wongoji | `apps/wongoji` | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| coinchain | `apps/coinchain` | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |

키에 앱별 접두어(`wongoji:`, `coin:`)를 붙이므로 하나의 Upstash 인스턴스를 공유해도
서로 침범하지 않습니다.

Root Directory를 지정하면 Vercel이 해당 경로 변경분만 보고 빌드하므로,
한 앱을 고쳐도 다른 앱이 다시 배포되지 않습니다.
