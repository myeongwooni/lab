# 그림 슬롯 — 이미지 파일 넣는 곳

엔진은 **그림 파일이 있으면 그것을, 없으면 코드로 그린 SVG를** 씁니다. 아래 경로에 파일을 넣기만 하면 됩니다. 코드를 고칠 필요는 없습니다.

## 넣는 법

1. 아래 표의 경로에 파일을 넣습니다. 파일 이름은 id 그대로(소문자·숫자·밑줄).
   - 배경: `public/art/bg/<id>.webp` (또는 `.png` `.jpg`)
   - CG: `public/art/cg/<id>.webp` (또는 `.png` `.jpg`)
   - 인물: `public/art/char/<인물id>/<표정>.webp` (또는 `.png`) — **배경이 투명한** 그림
2. `apps/sandglass`에서 `npm run dev` 또는 `npm run build`를 실행합니다. 두 명령 모두 먼저 `scripts/art-manifest.mjs`를 돌려 `app/art/slots.generated.ts`(있는 그림 목록)를 새로 씁니다. 따로 돌리려면 `npm run art`.
3. 새로 생긴 `slots.generated.ts`도 함께 커밋합니다(Vercel 빌드에서도 다시 만들어지지만, 커밋해 두면 diff로 무엇이 바뀌었는지 보입니다).

규칙
- 같은 이름이 여러 확장자로 있으면 `webp` > `png` > `jpg` 순서로 씁니다. 용량 때문에 **WebP(품질 80~90)** 를 권합니다.
- 인물 표정 그림이 없으면 그 인물의 `normal` 그림을 씁니다. `normal`도 없으면 SVG로 돌아갑니다. 그러니 인물은 `normal`부터 넣으세요.
- 재의 왕 맨얼굴(`@flag unmasked` 뒤)은 별도 폴더 `public/art/char/ashking_bare/`입니다.
- 파일을 바꾸면 주소 뒤의 해시(`?v=`)가 바뀌어 브라우저 캐시도 새로 받습니다.
- CG는 세로로 좁은 화면에서 [`app/art/cg-focus.ts`](../app/art/cg-focus.ts)에 적은 초점(그림 가로 위치 %)을 가운데로 잘라 보여 줍니다. 두 인물이 멀리 떨어진 CG는 `"fit"`으로 두면 좁은 화면에서 전체를 보여 줍니다. CG를 새로 넣거나 바꾸면 이 값도 확인하세요.
- 오른쪽(`right`) 자리에 선 인물은 엔진이 **좌우 반전**합니다. 모든 인물을 같은 방향(관객 기준 왼쪽을 향한 3/4 자세)으로 그려 주세요. 비대칭 디테일(엘리오스의 흰 가닥, 시안의 안대)은 반전돼도 괜찮은 정도로.

## 크기와 구도

| 종류 | 권장 크기 | 화면에 들어가는 방식 | 안전 영역 |
|---|---|---|---|
| 배경 | 1920×1080 (16:9) | 화면을 꽉 채우고 넘치는 부분은 잘림(cover) | 중요한 피사체는 **가운데 폭 500/1600**(약 600px/1920) 안에 — 휴대폰 세로 화면에선 가운데만 보입니다. **아래 30%는 대사창이 덮으므로** 중요한 것을 두지 않습니다. 배경에는 인물을 그리지 않습니다. |
| CG | 1920×1080 (16:9) | cover | 핵심은 가운데 폭 500/1600 안. CG는 아래까지 써도 됩니다(대사창이 반투명해짐). 회상록에서는 전체가 보입니다. |
| 인물 | 1200×2000 (3:5), 투명 배경 | 600:1000 상자 안에 비율 유지(contain), 아래쪽 가운데 정렬 | 머리 꼭대기 y≈120~240px(2000 기준), 허벅지 중간에서 잘리고 아랫단은 투명하게 사라지게. 성인 인물은 머리 크기가 키의 1/6.5. 토비는 작게(머리가 세로 중간쯤부터). 모든 인물의 발밑 기준선과 확대 비율을 맞춥니다. |

## 공통 스타일 (모든 프롬프트 앞에 붙이기)

배경·CG:

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen
```

인물:

```text
Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text
```

네거티브 프롬프트(지원하는 도구라면):

```text
text, letters, watermark, signature, logo, extra fingers, deformed hands, blurry, lowres, jpeg artifacts, photorealistic, 3d render
```

팔레트 기준: 새벽 금 `#ffd27a` · 잿빛 `#8a8784` · 틈새의 밤 `#1b1a22` · 핏빛 `#8f1d24` · 청탑 `#4a6fb5` · 솔레인의 낮 하늘 `#8fc6f0` · 주황 기와 `#e0764a`. 자세한 건 [`art-direction.md`](art-direction.md).

## 인물 설정표 (모든 그림에서 똑같이)

| id | 이름 | 머리 | 눈 | 옷 | 영어 설정(프롬프트에 그대로) |
|---|---|---|---|---|---|
| `elios` | 엘리오스 | 어깨까지 흑발, 느슨하게 묶음, 앞머리 흰 가닥 서너 줄, 작은 검은 뿔 둘, 뾰족 귀 | 왼 붉음 / 오른 금색 | 짙은 남색 목깃 코트, 놋쇠 단추 두 줄, 검은 장갑, 금 회중시계 줄 | Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain |
| `razel` | 라젤 | 모래빛 갈색, 뒤로 묶음, 잔머리, 수염 자국, 콧등 흉터 | 호박색 | 회색 늑대 모피 망토, 갈색 가죽 갑옷, 등의 대검 | Razel, a tall broad-shouldered 31-year-old mercenary captain, sandy brown hair tied back, stubble, scar across the bridge of his nose, amber eyes, gray wolf-fur cloak over leather armor, greatsword |
| `sian` | 시안 | 하늘빛 도는 은발, 턱선, 왼쪽 가는 땋은 머리와 푸른 구슬 | 오른 회청색 / 왼 흰 레이스 안대 | 흰·푸른 마도사 로브, 높은 깃, 은사슬, 푸른 어깨 망토 | Sian, an elegant 26-year-old court mage with pale sky-tinted silver chin-length hair and a thin braid with a blue bead, right eye blue-gray, left eye covered by a white lace eyepatch, white and blue mage robes with silver chains (keep the eyepatch in every expression) |
| `lili` | 리리 | 주황 단발(끝이 흰색), 큰 여우 귀, 풍성한 꼬리 | 초록, 주근깨 | 검은 원피스, 흰 앞치마, 흰 머릿수건 | Lili, a small cheerful 16-year-old fox beastkin maid, orange bob hair with white tips, large orange fox ears with white inner fur, big fluffy fox tail, green eyes, light freckles, black dress with white apron and white headscarf |
| `toby` | 토비 | 헝클어진 갈색 | 크고 둥근 갈색 | 너무 큰 누런 셔츠, 멜빵, 앞니 하나 빠짐 | Toby, a 9-year-old street urchin boy, messy brown hair, big eyes, one front tooth missing, dirt on cheek, oversized yellowish shirt with suspenders, small figure (head starts near the middle of the frame) |
| `cecilia` | 세실리아 | 금빛 긴 곱슬, 반 묶음, 흰 리본, 작은 티아라 | 하늘색 | 연분홍·흰 드레스, 흰 장갑 | Cecilia, a 19-year-old princess, long golden curly hair half-tied with a white ribbon, small tiara, large sky-blue eyes, pale pink and white dress, white gloves, angelic |
| `adelhart` | 아델하르트 | 짧은 금발, 뒤로 넘김 | 날카로운 푸른색 | 은빛 흉갑(해와 모래시계 문장), 붉은 망토 | Adelhart, a 28-year-old first prince and commander, short slicked-back blond hair, sharp blue eyes, straight brows, silver breastplate with a sun-and-hourglass crest, red cape, stern and arrogant |
| `ashking` | 재의 왕 | 새하얀 긴 머리, 가면 위로 끝이 부서지는 뿔 | 가면(금 간 흰 도자기, 눈구멍 속 잿빛 빛) | 검회색 재와 모래의 넝마 망토, 몸 가장자리가 재로 부서짐 | the Ash King, a tall figure in a tattered charcoal cloak of ash and sand, long pure-white hair, cracked white porcelain mask with two eyeholes, two horns with ashen crumbling tips, edges of his body crumbling into drifting ash (the mask never comes off; show emotion by mask tilt and eyehole glow) |
| `ashking_bare` | 재의 왕 (맨얼굴) | 새하얀 긴 머리, 부서지는 뿔 | 잿빛으로 바랜 두 눈(한쪽에 붉은빛 조금) | 재의 왕과 같은 망토, 뺨·목에 재처럼 갈라진 금. 엘리오스와 같은 얼굴이 여위고 늙은(30대 후반) | the unmasked Ash King: a gaunt aged version of Elios in his late thirties, long pure-white hair, ashen gray faded eyes with a faint trace of red in one eye, ash-like cracks on cheeks and neck, crumbling horns, tattered charcoal ash cloak, body edges crumbling into ash |
| `faceless` | 무면 | 후드 | 눈·코·입 없는 흰 도자기 가면 | 검은 후드 로브, 가슴에 은빛 황혼 문양, 가는 은빛 칼 | a Faceless assassin: smooth featureless white porcelain mask with no eyes, nose or mouth, black hooded robe, silver sunset crest on the chest, thin silver blade (all expressions may be the same image) |
| `herman` | 헤르만 | 은발 올백, 단정한 콧수염 | 가는 눈 | 검은 연미복, 흰 장갑, 은빛 모노클 줄 | Herman, a 60s royal chamberlain, silver slicked-back hair, neat mustache, narrow eyes, black tailcoat, white gloves, silver monocle chain, gentle old gentleman |
| (CG 전용) | 한서하 | 어깨 닿는 검은 단발, 낮게 대충 묶음, 잔머리 | 짙은 갈색, 옅은 다크서클 | 프롤로그·1~2장: 남색 스크럽 + 회색 후드 집업, ID카드 줄 / 3장부터: 생성색 원피스 + 짙은 녹색 망토. 왼손바닥에 금빛 모래시계 문양 | a 26-year-old Korean woman with a shoulder-length black bob loosely tied low with stray strands, dark brown eyes, faint dark circles |

같은 인물을 여러 장 뽑을 때는 **같은 시드 · 같은 설정 문장**을 쓰고, `normal`을 먼저 확정한 다음 그 그림을 참고 이미지(img2img / reference)로 표정만 바꾸면 얼굴이 흔들리지 않습니다.

## 배경 (33장)

모든 배경: 1920×1080, 인물 없음, 중요한 것은 가운데 폭 약 600px 안, 아래 30%는 비워 둘 것(바닥·풀·물 정도).

### 1. `black` — 단색 검정

- 파일: `public/art/bg/black.webp`
- 참고: optional — 코드가 단색으로 그립니다. 넣지 않아도 됩니다.

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, solid black, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 2. `white` — 단색 흰색

- 파일: `public/art/bg/white.webp`
- 참고: optional — 코드가 단색으로 그립니다.

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, solid warm white, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 3. `er` — 서울, 응급실 소생실 (새벽, 형광등, 모니터)

- 파일: `public/art/bg/er.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, modern Seoul hospital emergency resuscitation room at 4 am, cold fluorescent lights, ECG monitors glowing green, empty bed with rumpled sheets, IV poles, blue-gray hush, no people, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 4. `rooftop` — 서울, 병원 옥상 (여름 새벽, 한강 쪽 푸른 하늘, 자판기)

- 파일: `public/art/bg/rooftop.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, hospital rooftop in Seoul at summer dawn, deep blue sky fading to peach over the Han River and city skyline, a lone glowing vending machine, metal railing, water tank, no people, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 5. `seoul` — 서울 을지로 골목 (아침, 오래된 간판, 시계 수리점)

- 파일: `public/art/bg/seoul.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, narrow old alley in Euljiro Seoul on a bright morning, weathered shop signs without readable text, a tiny old watch repair shop with a display window of clocks, tangled power lines, warm sunlight, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 6. `plaza` — 솔레인 태양의 분수 광장 (아침, 종탑, 멀리 여명탑)

- 파일: `public/art/bg/plaza.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, grand fantasy city plaza at 8 am, sun-shaped fountain in the center, white stone buildings with orange tiled roofs stacked up a hill, bell tower, a gigantic white clock tower with a golden dial far in the distance, blue birds, bright clear sky, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 7. `market` — 솔레인 시장 거리 (낮, 천막, 향신료)

- 파일: `public/art/bg/market.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, bustling fantasy market street at midday, colorful canvas awnings, spice sacks, fruit stalls, glowing magic-stone lanterns, white walls and orange roofs, festive bunting, no main characters, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 8. `alley` — 낮은 거리 뒷골목 (해 질 녘, 빨래줄, 운하)

- 파일: `public/art/bg/alley.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, narrow back alley of a fantasy slum at sunset, laundry lines overhead, small canal with a stone footbridge, peeling plaster walls, long orange shadows, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 9. `tavern` — 늑대의 둥지 선술집 (밤, 벽난로, 나무 탁자)

- 파일: `public/art/bg/tavern.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, cozy mercenary tavern at night, big stone fireplace, heavy wooden tables and benches, tankards, a gray wolf pelt banner on the wall, warm amber candlelight, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 10. `inn` — 늑대의 둥지 2층 객실 (밤, 작은 창, 침대 하나)

- 파일: `public/art/bg/inn.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, small inn room upstairs at night, single wooden bed with a patched quilt, tiny window with moonlight, candle on a stool, rough plank walls, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 11. `chapel` — 버려진 새벽 여신 예배당 (밤, 부서진 여신상, 스테인드글라스, 촛불)

- 파일: `public/art/bg/chapel.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, abandoned chapel of a dawn goddess at night, broken marble goddess statue, cracked stained glass window with moonlight beams, scattered candles, dust, faint glowing magic circle on the stone floor, eerie, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 12. `between` — 틈새의 방 (잿더미 왕좌, 부서진 시계들, 위로 떨어지는 모래, 잿빛 새벽 창)

- 파일: `public/art/bg/between.webp`
- 참고: 왕좌는 비워 두세요(재의 왕은 스탠딩으로 올라갑니다).

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, surreal throne room made of ash, a charcoal-gray ash throne on steps, broken clock faces scattered on the floor, gears frozen in midair, golden sand grains falling upward, huge arched window showing an endless gray dawn, dark #1b1a22 tones with gold accents, empty throne, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 13. `villa` — 시계의 집 외관 (담쟁이, 낡은 별궁, 저녁)

- 파일: `public/art/bg/villa.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, old detached palace villa covered in ivy at dusk, round clock above the door, warm lit windows, overgrown garden path, purple evening sky, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 14. `workshop` — 시계의 집 공방 (수백 개의 시계, 작업대, 아침 빛)

- 파일: `public/art/bg/workshop.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, clockmaker's workshop filled with hundreds of clocks on every wall, cuckoo clocks, pendulum clocks, dissected brass gears, a cluttered workbench with tools and a broken golden hourglass on a shelf, morning light beams through a window, floating dust, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 15. `guestroom` — 시계의 집 객실 (서하의 방, 아침, 커튼, 벽시계)

- 파일: `public/art/bg/guestroom.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, guest bedroom in an old villa in the morning, white curtains glowing with sunlight, neat bed, a wall clock, small vanity, wooden floor, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 16. `villa_hall` — 시계의 집 식당과 나선 계단 (밤, 긴 식탁, 촛대)

- 파일: `public/art/bg/villa_hall.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, long dining hall at night with a long table and seven teacups, candelabras, a creaking spiral staircase in the corner, clocks on the walls, deep shadows, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 17. `villa_roof` — 시계의 집 옥상 (밤, 솔레인 야경과 여명탑)

- 파일: `public/art/bg/villa_roof.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, villa rooftop at night overlooking a fantasy hill city with thousands of warm window lights, the huge dawn clock tower glowing in the distance, starry sky, low stone parapet, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 18. `court` — 왕궁 대회랑 (낮, 기둥, 태양 문장, 붉은 융단)

- 파일: `public/art/bg/court.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, grand royal palace corridor in daylight, tall white columns, red carpet, golden sun and hourglass emblems on banners, high windows with sunlight, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 19. `royal_garden` — 왕궁 정원 (오후, 흰 장미, 해시계, 분수)

- 파일: `public/art/bg/royal_garden.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, royal palace garden in the afternoon, white rose hedges, stone sundial, marble fountain, gravel paths, soft golden light, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 20. `king_room` — 국왕의 침실 (어두운 커튼, 큰 침대, 약병)

- 파일: `public/art/bg/king_room.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, dim royal bedchamber, heavy dark red curtains, huge canopy bed, bedside table crowded with medicine bottles, single candle, oppressive atmosphere, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 21. `magetower` — 청탑 서재와 테라스 (밤, 별, 책, 푸른 술식등)

- 파일: `public/art/bg/magetower.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, court mage's blue tower study at night, towering bookshelves, floating blue magic lamps, open terrace doors to a starry sky with a telescope, astrolabes, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 22. `liana_room` — 청탑 꼭대기 리아나의 방 (작은 침대, 인형, 오르골, 먼지 없는 방)

- 파일: `public/art/bg/liana_room.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, small child's bedroom at the top of a tower preserved perfectly, tiny bed, dolls, a music box on the nightstand, little shoes, spotless and frozen in time, pale moonlight, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 23. `slums` — 낮은 거리 전경 (낮, 판잣집, 빨래, 아이들)

- 파일: `public/art/bg/slums.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, fantasy slum district below the city walls in daytime, patched shacks, laundry lines, small canal, children's toys, distant high white walls, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 24. `sewer` — 낮은 거리 지하 수로 (잿빛 결정, 물, 어둠)

- 파일: `public/art/bg/sewer.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, underground canal tunnel beneath a fantasy city, dark water, arched brick vaults, glowing ash-gray crystals growing on walls, eerie faint light, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 25. `southgate` — 남문 성벽 위 (새벽, 망루, 멀리 평원)

- 파일: `public/art/bg/southgate.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, top of the southern city wall at dawn, watchtower, banners, distant plains and hills under a pale dawn sky, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 26. `festival` — 새벽제 등불 축제 (밤, 운하 위 등불, 하늘로 오르는 등, 인파)

- 파일: `public/art/bg/festival.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, dawn festival at night, canal filled with floating lanterns, sky lanterns rising into the stars, silhouettes of crowds on bridges, warm gold and deep blue, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 27. `belltower` — 광장 종탑 꼭대기 (밤, 큰 종, 발아래 등불의 도시)

- 파일: `public/art/bg/belltower.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, top of a bell tower at night, massive bronze bell, open arches, the lantern-lit city far below, dizzying height, wind, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 28. `dawntower` — 여명탑 꼭대기, 새벽의 제단 (거대한 시계 문자판과 톱니, 제단)

- 파일: `public/art/bg/dawntower.webp`
- 참고: 타이틀 화면 배경으로도 쓰입니다. 왼쪽 1/3은 로고가 올라가니 어둡고 단순하게.

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, summit of a colossal clock tower, a giant golden clock dial with sun and moon symbols instead of numerals, huge gears, a white stone altar in the center, dawn sky beyond, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 29. `ashfall` — 회명 — 잿빛 해 아래 재가 내리는 솔레인

- 파일: `public/art/bg/ashfall.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, fantasy hill city under a gray sun disc, ash falling like snow, muted gray sky, white walls and orange roofs dulled with ash, eerie silence, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 30. `dawn` — 금빛 해돋이의 솔레인

- 파일: `public/art/bg/dawn.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, fantasy hill city at golden sunrise, the sun rising behind the great clock tower, radiant gold light, clouds glowing, hope, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 31. `hill` — 왕도 밖 언덕 (새벽, 멀리 솔레인)

- 파일: `public/art/bg/hill.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, grassy hill outside the capital at dawn, a lone path, the city and its clock tower small in the distance, wide sky, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 32. `ruins` — 북부 레벤의 폐허 (가을, 잿빛 땅에 새싹)

- 파일: `public/art/bg/ruins.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, ruins of a northern town in autumn, broken stone walls on gray ashen ground, small green sprouts growing, falling autumn leaves, soft sunlight, no characters, no people in foreground, main subject centered, lower third kept simple
```

### 33. `memory` — 기억의 공간 (흰 허공, 떠다니는 조각)

- 파일: `public/art/bg/memory.webp`

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, white void of memory, floating fragments of broken glass and clock pieces, soft light, dreamlike, no characters, no people in foreground, main subject centered, lower third kept simple
```

## 이벤트 CG (25장)

모든 CG: 1920×1080. 핵심은 가운데. 서하의 얼굴은 너무 정면으로 크게 그리지 않아도 됩니다(플레이어의 시선). 사망 장면은 **피와 상처를 직접 그리지 않고** 빛·색·손으로 표현합니다.

### 1. `cg_fall` 「하늘로 떨어지는 모래」

- 파일: `public/art/cg/cg_fall.webp`
- 장면: 프롤로그 — 잿빛 하늘과 금빛 모래 사이로 추락하는 서하

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, a 26-year-old Korean woman with a shoulder-length black bob loosely tied low with stray strands, dark brown eyes, faint dark circles, navy nurse scrubs under a gray hoodie, lanyard ID card falling backward through the sky, gray ashen clouds above, golden sand grains streaming upward around her, hospital rooftop railing dissolving far above, vertigo, wide shot
```

### 2. `cg_first_death` 「넷에서 멈춘 맥박」

- 파일: `public/art/cg/cg_first_death.webp`
- 장면: 1장 — 쓰러진 서하의 시선: 부서진 여신상, 스테인드글라스의 달빛, 멀어지는 촛불

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, first-person view from the stone floor of an abandoned chapel at night, tilted angle, broken goddess statue and cracked stained glass with moonlight, candle flames blurring and fading, a pale hand in the foreground, vignette, dim red tinge, no gore
```

### 3. `cg_ashking` 「잿더미 왕좌」

- 파일: `public/art/cg/cg_ashking.webp`
- 장면: 1장 — 잿더미 왕좌에 앉은 가면의 남자, 위로 떨어지는 모래

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, the Ash King, a tall figure in a tattered charcoal cloak of ash and sand, long pure-white hair, cracked white porcelain mask with two eyeholes, two horns with ashen crumbling tips, edges of his body crumbling into drifting ash seated on a throne of ash in a surreal room of broken clocks, golden sand falling upward, gray endless dawn through a huge arched window, melancholy, symmetrical composition
```

### 4. `cg_sand` 「모래가 된 대답」

- 파일: `public/art/cg/cg_sand.webp`
- 장면: 2장 — 모래가 되어 부서지는 라젤

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, Razel, a tall broad-shouldered 31-year-old mercenary captain, sandy brown hair tied back, stubble, scar across the bridge of his nose, amber eyes, gray wolf-fur cloak over leather armor, greatsword crumbling into golden sand starting from his fingertips, his face showing puzzled worry, tavern interior, sand streaming, dramatic tragic moment, a woman's reaching hand in the foreground
```

### 5. `cg_demon` 「그림자의 칼날」

- 파일: `public/art/cg/cg_demon.webp`
- 장면: 2장 — 마족의 모습을 드러낸 엘리오스

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain, hood blown back, horns revealed, red eye glowing, shadows turning into black blades piercing white-masked assassins, abandoned chapel at night, dynamic action, candlelight and red glow
```

### 6. `cg_clocks` 「수백 개의 째깍임」

- 파일: `public/art/cg/cg_clocks.webp`
- 장면: 3장 — 수백 개의 시계에 둘러싸여 태엽을 감는 엘리오스

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain winding a clock at a workbench, surrounded by hundreds of clocks, morning light beams through a window, dust motes, calm and gentle
```

### 7. `cg_tea` 「식탁보에 번지는 홍차」

- 파일: `public/art/cg/cg_tea.webp`
- 장면: 3장 — 엎어진 찻잔과 식탁보에 번지는 붉은 홍차

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, close-up of an overturned porcelain teacup on a white tablecloth, red tea spreading like a stain, blurred candlelit dining hall and clocks in background, shallow depth of field, ominous still life
```

### 8. `cg_lili` 「꺼져 가는 여우불」

- 파일: `public/art/cg/cg_lili.webp`
- 장면: 4장 — 서하의 손을 잡은 리리의 작은 손, 꺼져 가는 여우불빛

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, close-up of a small girl's hand holding a woman's hand on a dark floor, a fading orange foxfire light, orange fox tail with white tip nearby, night, tragic tenderness, no gore
```

### 9. `cg_lanterns` 「운하 위의 등불」

- 파일: `public/art/cg/cg_lanterns.webp`
- 장면: 5장 — 운하 위의 등불과 하늘로 오르는 등, 서하의 뒷모습

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, back view of a 26-year-old Korean woman with a shoulder-length black bob loosely tied low with stray strands, dark brown eyes, faint dark circles, ivory linen dress with a dark green cloak standing on a canal bridge, thousands of floating lanterns and sky lanterns rising, festival night, wonder
```

### 10. `cg_betrayal` 「종탑의 흰 리본」

- 파일: `public/art/cg/cg_betrayal.webp`
- 장면: 5장 — 등불을 등진 세실리아가 미소 지으며 칼을 쥔

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, Cecilia, a 19-year-old princess with long golden curly hair half-tied with a white ribbon, sky-blue eyes, pale pink and white dress, white gloves, smiling sweetly while holding a thin silver dagger, backlit by lanterns atop a bell tower at night, a white ribbon fluttering in the wind, unsettling
```

### 11. `cg_e_waltz` 「태엽 왈츠」

- 파일: `public/art/cg/cg_e_waltz.webp`
- 장면: e06 — 공방에서 서툰 왈츠

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain awkwardly waltzing with a 26-year-old Korean woman with a shoulder-length black bob loosely tied low with stray strands, dark brown eyes, faint dark circles, ivory linen dress with a dark green cloak in a clock workshop at night, candlelight, clocks ticking around them, shy tender expressions
```

### 12. `cg_unmask` 「가면 아래의 얼굴」

- 파일: `public/art/cg/cg_unmask.webp`
- 장면: e07 — 가면을 벗은 재의 왕: 늙고 여위고 재로 부서져 가는 엘리오스

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, a gaunt aged version of Elios in his late thirties, long white hair, ashen gray faded eyes with a faint trace of red in one, ash-like cracks on cheeks and neck, horns crumbling, a cracked porcelain mask falling from a woman's hand, ash throne room, heartbreaking
```

### 13. `cg_e_good` 「새벽을 부르는 이름」

- 파일: `public/art/cg/cg_e_good.webp`
- 장면: 엘리오스 굿 — 금빛 새벽의 여명탑 꼭대기

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain with more white in his hair embracing a 26-year-old Korean woman with a shoulder-length black bob loosely tied low with stray strands, dark brown eyes, faint dark circles, ivory linen dress with a dark green cloak atop the great clock tower at golden dawn, ash turning into golden sand and flying away between them, radiant sunrise
```

### 14. `cg_e_bad` 「재의 왕관」

- 파일: `public/art/cg/cg_e_bad.webp`
- 장면: 엘리오스 배드 — 재의 왕관

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, back view of Elios with fully white hair holding a shattered golden hourglass, gray ash falling, gray sun, crown-like silhouette of ash, despair
```

### 15. `cg_r_back` 「등을 맡긴다는 것」

- 파일: `public/art/cg/cg_r_back.webp`
- 장면: r07 — 대검을 든 라젤의 넓은 등, 그 뒤의 서하

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, back view of Razel, a tall broad-shouldered 31-year-old mercenary captain, sandy brown hair tied back, stubble, scar across the bridge of his nose, amber eyes, gray wolf-fur cloak over leather armor, greatsword holding his greatsword in gray ashen light, protecting a 26-year-old Korean woman with a shoulder-length black bob loosely tied low with stray strands, dark brown eyes, faint dark circles, ivory linen dress with a dark green cloak standing behind him, embers, determined
```

### 16. `cg_r_good` 「재 위에 돋은 새싹」

- 파일: `public/art/cg/cg_r_good.webp`
- 장면: 라젤 굿 — 재가 걷힌 지붕 위에서 해를 보는 둘

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, Razel, a tall broad-shouldered 31-year-old mercenary captain, sandy brown hair tied back, stubble, scar across the bridge of his nose, amber eyes, gray wolf-fur cloak over leather armor, greatsword with a bandaged arm and a 26-year-old Korean woman with a shoulder-length black bob loosely tied low with stray strands, dark brown eyes, faint dark circles, ivory linen dress with a dark green cloak sitting on slum rooftops watching the sunrise, ash cleared, warm light, peaceful smiles
```

### 17. `cg_r_bad` 「마지막 모래 한 알」

- 파일: `public/art/cg/cg_r_bad.webp`
- 장면: 라젤 배드 — 쓰러진 라젤의 손을 잡은 서하, 마지막 금빛 한 알

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, a woman holding the hand of a fallen large mercenary in a gray dawn, a single last golden sand grain falling from her palm with a glowing hourglass mark, ash, grief, no gore
```

### 18. `cg_s_eye` 「시계 문자판의 눈동자」

- 파일: `public/art/cg/cg_s_eye.webp`
- 장면: s06 — 안대를 벗은 시안의 금빛 시계 눈동자

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, extreme close-up of Sian's face without his eyepatch, left eye is a golden clock-dial iris, many layered translucent reflections of a woman inside the eye, silver hair, mystical blue light
```

### 19. `cg_s_blade` 「울면서 찌르는 칼」

- 파일: `public/art/cg/cg_s_blade.webp`
- 장면: s07 — 울면서 칼을 든 시안

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, Sian, an elegant 26-year-old court mage with pale sky-tinted silver chin-length hair and a thin braid with a blue bead, right eye blue-gray, left eye covered by a white lace eyepatch, white and blue mage robes with silver chains with tears streaming, holding a blade toward the viewer in a tower basement lit by a glowing blue magic circle, anguish, no gore
```

### 20. `cg_s_good` 「지금이라는 오르골」

- 파일: `public/art/cg/cg_s_good.webp`
- 장면: 시안 굿 — 금빛 새벽의 청탑 테라스, 안대를 벗은 시안과 서하, 오르골

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, Sian without eyepatch (golden clock iris) and a 26-year-old Korean woman with a shoulder-length black bob loosely tied low with stray strands, dark brown eyes, faint dark circles, ivory linen dress with a dark green cloak on a tower terrace at golden dawn, holding a music box together, gentle smiles
```

### 21. `cg_s_bad` 「모래 속의 누이」

- 파일: `public/art/cg/cg_s_bad.webp`
- 장면: 시안 배드 — 오르골을 든 어린 리아나와 소년 시안

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, a 10-year-old girl with silver hair holding a music box beside a young silver-haired boy, child's bedroom, gray ashen sky outside the window, bittersweet frozen memory
```

### 22. `cg_two_kings` 「두 명의 엘리오스」

- 파일: `public/art/cg/cg_two_kings.webp`
- 장면: t06 — 잿빛 왕좌 앞, 젊은 엘리오스와 재가 된 엘리오스, 그 사이의 서하

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain and the unmasked aged ash-crumbling version of himself facing each other before an ash throne, a 26-year-old Korean woman with a shoulder-length black bob loosely tied low with stray strands, dark brown eyes, faint dark circles, ivory linen dress with a dark green cloak standing between them, sand falling upward, symmetrical
```

### 23. `cg_shatter` 「깨지는 역시계」

- 파일: `public/art/cg/cg_shatter.webp`
- 장면: t07 — 부서지는 금빛 모래시계

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, a golden hourglass shattering in midair, glass shards and golden sand exploding outward, a young woman and a black-haired horned young man reaching toward it, dramatic slow motion
```

### 24. `cg_true` 「천 번째 새벽」

- 파일: `public/art/cg/cg_true.webp`
- 장면: 트루 — 천 번째 새벽

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, one year later, a 26-year-old Korean woman with a shoulder-length black bob loosely tied low with stray strands, dark brown eyes, faint dark circles, ivory linen dress with a dark green cloak and Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain (white streaks in his bangs) on the great clock tower at golden sunrise over the festival city, sky lanterns, hands intertwined, joy
```

### 25. `cg_return` 「4시 44분의 캔커피」

- 파일: `public/art/cg/cg_return.webp`
- 장면: 어나더 — 을지로 시계 수리점

```text
Japanese TV anime style, isekai fantasy, clean crisp lineart, cel shading with 2-3 tone shadows, luminous sky and soft bloom, detailed painted fantasy background art, cinematic lighting, high detail, 16:9 widescreen, an old watch repair shop in a Seoul alley, a golden hourglass in the display window, a young man with black hair and a single white streak in his bangs looking up from behind the counter with an unreadable, startled expression, warm morning light, hopeful ambiguity
```

## 인물 스탠딩 (10명 × 표정 10 + 재의 왕 맨얼굴)

표정 id: `normal`(기본) · `smile`(미소) · `sad`(슬픔) · `angry`(분노) · `surprise`(놀람) · `serious`(진지) · `tender`(다정) · `pain`(고통) · `smirk`(비웃음/능청) · `cry`(울음)

모든 인물: 1200×2000 투명 PNG/WebP, 몸과 옷은 표정마다 같고 얼굴만 바뀝니다.

### `elios` — 엘리오스

| 표정 | 파일 | 프롬프트 |
|---|---|---|
| `normal` 기본 | `public/art/char/elios/normal.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain, calm neutral expression` |
| `smile` 미소 | `public/art/char/elios/smile.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain, gentle smile` |
| `sad` 슬픔 | `public/art/char/elios/sad.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain, sad downcast eyes, slight frown` |
| `angry` 분노 | `public/art/char/elios/angry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain, angry glare, furrowed brows` |
| `surprise` 놀람 | `public/art/char/elios/surprise.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain, surprised, wide eyes, small open mouth` |
| `serious` 진지 | `public/art/char/elios/serious.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain, serious determined expression` |
| `tender` 다정 | `public/art/char/elios/tender.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain, tender soft gaze, faint blush` |
| `pain` 고통 | `public/art/char/elios/pain.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain, wincing in pain, gritted teeth, sweat drop` |
| `smirk` 비웃음/능청 | `public/art/char/elios/smirk.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain, sly smirk` |
| `cry` 울음 | `public/art/char/elios/cry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Elios, a slender 21-year-old half-demon prince with shoulder-length black hair loosely tied, a few white strands in his bangs, two small curved black horns, pointed ears, heterochromia (left eye red, right eye gold), pale skin, high-collared dark navy coat with brass buttons, black gloves, gold pocket watch chain, crying, tears streaming down cheeks` |

### `razel` — 라젤

| 표정 | 파일 | 프롬프트 |
|---|---|---|
| `normal` 기본 | `public/art/char/razel/normal.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Razel, a tall broad-shouldered 31-year-old mercenary captain, sandy brown hair tied back, stubble, scar across the bridge of his nose, amber eyes, gray wolf-fur cloak over leather armor, greatsword, calm neutral expression` |
| `smile` 미소 | `public/art/char/razel/smile.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Razel, a tall broad-shouldered 31-year-old mercenary captain, sandy brown hair tied back, stubble, scar across the bridge of his nose, amber eyes, gray wolf-fur cloak over leather armor, greatsword, gentle smile` |
| `sad` 슬픔 | `public/art/char/razel/sad.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Razel, a tall broad-shouldered 31-year-old mercenary captain, sandy brown hair tied back, stubble, scar across the bridge of his nose, amber eyes, gray wolf-fur cloak over leather armor, greatsword, sad downcast eyes, slight frown` |
| `angry` 분노 | `public/art/char/razel/angry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Razel, a tall broad-shouldered 31-year-old mercenary captain, sandy brown hair tied back, stubble, scar across the bridge of his nose, amber eyes, gray wolf-fur cloak over leather armor, greatsword, angry glare, furrowed brows` |
| `surprise` 놀람 | `public/art/char/razel/surprise.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Razel, a tall broad-shouldered 31-year-old mercenary captain, sandy brown hair tied back, stubble, scar across the bridge of his nose, amber eyes, gray wolf-fur cloak over leather armor, greatsword, surprised, wide eyes, small open mouth` |
| `serious` 진지 | `public/art/char/razel/serious.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Razel, a tall broad-shouldered 31-year-old mercenary captain, sandy brown hair tied back, stubble, scar across the bridge of his nose, amber eyes, gray wolf-fur cloak over leather armor, greatsword, serious determined expression` |
| `tender` 다정 | `public/art/char/razel/tender.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Razel, a tall broad-shouldered 31-year-old mercenary captain, sandy brown hair tied back, stubble, scar across the bridge of his nose, amber eyes, gray wolf-fur cloak over leather armor, greatsword, tender soft gaze, faint blush` |
| `pain` 고통 | `public/art/char/razel/pain.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Razel, a tall broad-shouldered 31-year-old mercenary captain, sandy brown hair tied back, stubble, scar across the bridge of his nose, amber eyes, gray wolf-fur cloak over leather armor, greatsword, wincing in pain, gritted teeth, sweat drop` |
| `smirk` 비웃음/능청 | `public/art/char/razel/smirk.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Razel, a tall broad-shouldered 31-year-old mercenary captain, sandy brown hair tied back, stubble, scar across the bridge of his nose, amber eyes, gray wolf-fur cloak over leather armor, greatsword, sly smirk` |
| `cry` 울음 | `public/art/char/razel/cry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Razel, a tall broad-shouldered 31-year-old mercenary captain, sandy brown hair tied back, stubble, scar across the bridge of his nose, amber eyes, gray wolf-fur cloak over leather armor, greatsword, crying, tears streaming down cheeks` |

### `sian` — 시안

| 표정 | 파일 | 프롬프트 |
|---|---|---|
| `normal` 기본 | `public/art/char/sian/normal.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Sian, an elegant 26-year-old court mage with pale sky-tinted silver chin-length hair and a thin braid with a blue bead, right eye blue-gray, left eye covered by a white lace eyepatch, white and blue mage robes with silver chains (keep the eyepatch in every expression), calm neutral expression` |
| `smile` 미소 | `public/art/char/sian/smile.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Sian, an elegant 26-year-old court mage with pale sky-tinted silver chin-length hair and a thin braid with a blue bead, right eye blue-gray, left eye covered by a white lace eyepatch, white and blue mage robes with silver chains (keep the eyepatch in every expression), gentle smile` |
| `sad` 슬픔 | `public/art/char/sian/sad.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Sian, an elegant 26-year-old court mage with pale sky-tinted silver chin-length hair and a thin braid with a blue bead, right eye blue-gray, left eye covered by a white lace eyepatch, white and blue mage robes with silver chains (keep the eyepatch in every expression), sad downcast eyes, slight frown` |
| `angry` 분노 | `public/art/char/sian/angry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Sian, an elegant 26-year-old court mage with pale sky-tinted silver chin-length hair and a thin braid with a blue bead, right eye blue-gray, left eye covered by a white lace eyepatch, white and blue mage robes with silver chains (keep the eyepatch in every expression), angry glare, furrowed brows` |
| `surprise` 놀람 | `public/art/char/sian/surprise.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Sian, an elegant 26-year-old court mage with pale sky-tinted silver chin-length hair and a thin braid with a blue bead, right eye blue-gray, left eye covered by a white lace eyepatch, white and blue mage robes with silver chains (keep the eyepatch in every expression), surprised, wide eyes, small open mouth` |
| `serious` 진지 | `public/art/char/sian/serious.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Sian, an elegant 26-year-old court mage with pale sky-tinted silver chin-length hair and a thin braid with a blue bead, right eye blue-gray, left eye covered by a white lace eyepatch, white and blue mage robes with silver chains (keep the eyepatch in every expression), serious determined expression` |
| `tender` 다정 | `public/art/char/sian/tender.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Sian, an elegant 26-year-old court mage with pale sky-tinted silver chin-length hair and a thin braid with a blue bead, right eye blue-gray, left eye covered by a white lace eyepatch, white and blue mage robes with silver chains (keep the eyepatch in every expression), tender soft gaze, faint blush` |
| `pain` 고통 | `public/art/char/sian/pain.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Sian, an elegant 26-year-old court mage with pale sky-tinted silver chin-length hair and a thin braid with a blue bead, right eye blue-gray, left eye covered by a white lace eyepatch, white and blue mage robes with silver chains (keep the eyepatch in every expression), wincing in pain, gritted teeth, sweat drop` |
| `smirk` 비웃음/능청 | `public/art/char/sian/smirk.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Sian, an elegant 26-year-old court mage with pale sky-tinted silver chin-length hair and a thin braid with a blue bead, right eye blue-gray, left eye covered by a white lace eyepatch, white and blue mage robes with silver chains (keep the eyepatch in every expression), sly smirk` |
| `cry` 울음 | `public/art/char/sian/cry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Sian, an elegant 26-year-old court mage with pale sky-tinted silver chin-length hair and a thin braid with a blue bead, right eye blue-gray, left eye covered by a white lace eyepatch, white and blue mage robes with silver chains (keep the eyepatch in every expression), crying, tears streaming down cheeks` |

### `lili` — 리리

| 표정 | 파일 | 프롬프트 |
|---|---|---|
| `normal` 기본 | `public/art/char/lili/normal.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Lili, a small cheerful 16-year-old fox beastkin maid, orange bob hair with white tips, large orange fox ears with white inner fur, big fluffy fox tail, green eyes, light freckles, black dress with white apron and white headscarf, calm neutral expression` |
| `smile` 미소 | `public/art/char/lili/smile.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Lili, a small cheerful 16-year-old fox beastkin maid, orange bob hair with white tips, large orange fox ears with white inner fur, big fluffy fox tail, green eyes, light freckles, black dress with white apron and white headscarf, gentle smile` |
| `sad` 슬픔 | `public/art/char/lili/sad.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Lili, a small cheerful 16-year-old fox beastkin maid, orange bob hair with white tips, large orange fox ears with white inner fur, big fluffy fox tail, green eyes, light freckles, black dress with white apron and white headscarf, sad downcast eyes, slight frown` |
| `angry` 분노 | `public/art/char/lili/angry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Lili, a small cheerful 16-year-old fox beastkin maid, orange bob hair with white tips, large orange fox ears with white inner fur, big fluffy fox tail, green eyes, light freckles, black dress with white apron and white headscarf, angry glare, furrowed brows` |
| `surprise` 놀람 | `public/art/char/lili/surprise.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Lili, a small cheerful 16-year-old fox beastkin maid, orange bob hair with white tips, large orange fox ears with white inner fur, big fluffy fox tail, green eyes, light freckles, black dress with white apron and white headscarf, surprised, wide eyes, small open mouth` |
| `serious` 진지 | `public/art/char/lili/serious.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Lili, a small cheerful 16-year-old fox beastkin maid, orange bob hair with white tips, large orange fox ears with white inner fur, big fluffy fox tail, green eyes, light freckles, black dress with white apron and white headscarf, serious determined expression` |
| `tender` 다정 | `public/art/char/lili/tender.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Lili, a small cheerful 16-year-old fox beastkin maid, orange bob hair with white tips, large orange fox ears with white inner fur, big fluffy fox tail, green eyes, light freckles, black dress with white apron and white headscarf, tender soft gaze, faint blush` |
| `pain` 고통 | `public/art/char/lili/pain.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Lili, a small cheerful 16-year-old fox beastkin maid, orange bob hair with white tips, large orange fox ears with white inner fur, big fluffy fox tail, green eyes, light freckles, black dress with white apron and white headscarf, wincing in pain, gritted teeth, sweat drop` |
| `smirk` 비웃음/능청 | `public/art/char/lili/smirk.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Lili, a small cheerful 16-year-old fox beastkin maid, orange bob hair with white tips, large orange fox ears with white inner fur, big fluffy fox tail, green eyes, light freckles, black dress with white apron and white headscarf, sly smirk` |
| `cry` 울음 | `public/art/char/lili/cry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Lili, a small cheerful 16-year-old fox beastkin maid, orange bob hair with white tips, large orange fox ears with white inner fur, big fluffy fox tail, green eyes, light freckles, black dress with white apron and white headscarf, crying, tears streaming down cheeks` |

### `toby` — 토비

| 표정 | 파일 | 프롬프트 |
|---|---|---|
| `normal` 기본 | `public/art/char/toby/normal.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Toby, a 9-year-old street urchin boy, messy brown hair, big eyes, one front tooth missing, dirt on cheek, oversized yellowish shirt with suspenders, small figure (head starts near the middle of the frame), calm neutral expression` |
| `smile` 미소 | `public/art/char/toby/smile.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Toby, a 9-year-old street urchin boy, messy brown hair, big eyes, one front tooth missing, dirt on cheek, oversized yellowish shirt with suspenders, small figure (head starts near the middle of the frame), gentle smile` |
| `sad` 슬픔 | `public/art/char/toby/sad.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Toby, a 9-year-old street urchin boy, messy brown hair, big eyes, one front tooth missing, dirt on cheek, oversized yellowish shirt with suspenders, small figure (head starts near the middle of the frame), sad downcast eyes, slight frown` |
| `angry` 분노 | `public/art/char/toby/angry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Toby, a 9-year-old street urchin boy, messy brown hair, big eyes, one front tooth missing, dirt on cheek, oversized yellowish shirt with suspenders, small figure (head starts near the middle of the frame), angry glare, furrowed brows` |
| `surprise` 놀람 | `public/art/char/toby/surprise.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Toby, a 9-year-old street urchin boy, messy brown hair, big eyes, one front tooth missing, dirt on cheek, oversized yellowish shirt with suspenders, small figure (head starts near the middle of the frame), surprised, wide eyes, small open mouth` |
| `serious` 진지 | `public/art/char/toby/serious.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Toby, a 9-year-old street urchin boy, messy brown hair, big eyes, one front tooth missing, dirt on cheek, oversized yellowish shirt with suspenders, small figure (head starts near the middle of the frame), serious determined expression` |
| `tender` 다정 | `public/art/char/toby/tender.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Toby, a 9-year-old street urchin boy, messy brown hair, big eyes, one front tooth missing, dirt on cheek, oversized yellowish shirt with suspenders, small figure (head starts near the middle of the frame), tender soft gaze, faint blush` |
| `pain` 고통 | `public/art/char/toby/pain.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Toby, a 9-year-old street urchin boy, messy brown hair, big eyes, one front tooth missing, dirt on cheek, oversized yellowish shirt with suspenders, small figure (head starts near the middle of the frame), wincing in pain, gritted teeth, sweat drop` |
| `smirk` 비웃음/능청 | `public/art/char/toby/smirk.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Toby, a 9-year-old street urchin boy, messy brown hair, big eyes, one front tooth missing, dirt on cheek, oversized yellowish shirt with suspenders, small figure (head starts near the middle of the frame), sly smirk` |
| `cry` 울음 | `public/art/char/toby/cry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Toby, a 9-year-old street urchin boy, messy brown hair, big eyes, one front tooth missing, dirt on cheek, oversized yellowish shirt with suspenders, small figure (head starts near the middle of the frame), crying, tears streaming down cheeks` |

### `cecilia` — 세실리아

| 표정 | 파일 | 프롬프트 |
|---|---|---|
| `normal` 기본 | `public/art/char/cecilia/normal.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Cecilia, a 19-year-old princess, long golden curly hair half-tied with a white ribbon, small tiara, large sky-blue eyes, pale pink and white dress, white gloves, angelic, calm neutral expression` |
| `smile` 미소 | `public/art/char/cecilia/smile.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Cecilia, a 19-year-old princess, long golden curly hair half-tied with a white ribbon, small tiara, large sky-blue eyes, pale pink and white dress, white gloves, angelic, gentle smile` |
| `sad` 슬픔 | `public/art/char/cecilia/sad.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Cecilia, a 19-year-old princess, long golden curly hair half-tied with a white ribbon, small tiara, large sky-blue eyes, pale pink and white dress, white gloves, angelic, sad downcast eyes, slight frown` |
| `angry` 분노 | `public/art/char/cecilia/angry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Cecilia, a 19-year-old princess, long golden curly hair half-tied with a white ribbon, small tiara, large sky-blue eyes, pale pink and white dress, white gloves, angelic, angry glare, furrowed brows` |
| `surprise` 놀람 | `public/art/char/cecilia/surprise.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Cecilia, a 19-year-old princess, long golden curly hair half-tied with a white ribbon, small tiara, large sky-blue eyes, pale pink and white dress, white gloves, angelic, surprised, wide eyes, small open mouth` |
| `serious` 진지 | `public/art/char/cecilia/serious.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Cecilia, a 19-year-old princess, long golden curly hair half-tied with a white ribbon, small tiara, large sky-blue eyes, pale pink and white dress, white gloves, angelic, serious determined expression` |
| `tender` 다정 | `public/art/char/cecilia/tender.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Cecilia, a 19-year-old princess, long golden curly hair half-tied with a white ribbon, small tiara, large sky-blue eyes, pale pink and white dress, white gloves, angelic, tender soft gaze, faint blush` |
| `pain` 고통 | `public/art/char/cecilia/pain.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Cecilia, a 19-year-old princess, long golden curly hair half-tied with a white ribbon, small tiara, large sky-blue eyes, pale pink and white dress, white gloves, angelic, wincing in pain, gritted teeth, sweat drop` |
| `smirk` 비웃음/능청 | `public/art/char/cecilia/smirk.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Cecilia, a 19-year-old princess, long golden curly hair half-tied with a white ribbon, small tiara, large sky-blue eyes, pale pink and white dress, white gloves, angelic, same sweet smile but eyes not smiling at all, unsettling` |
| `cry` 울음 | `public/art/char/cecilia/cry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Cecilia, a 19-year-old princess, long golden curly hair half-tied with a white ribbon, small tiara, large sky-blue eyes, pale pink and white dress, white gloves, angelic, crying, tears streaming down cheeks` |

### `adelhart` — 아델하르트

| 표정 | 파일 | 프롬프트 |
|---|---|---|
| `normal` 기본 | `public/art/char/adelhart/normal.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Adelhart, a 28-year-old first prince and commander, short slicked-back blond hair, sharp blue eyes, straight brows, silver breastplate with a sun-and-hourglass crest, red cape, stern and arrogant, calm neutral expression` |
| `smile` 미소 | `public/art/char/adelhart/smile.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Adelhart, a 28-year-old first prince and commander, short slicked-back blond hair, sharp blue eyes, straight brows, silver breastplate with a sun-and-hourglass crest, red cape, stern and arrogant, gentle smile` |
| `sad` 슬픔 | `public/art/char/adelhart/sad.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Adelhart, a 28-year-old first prince and commander, short slicked-back blond hair, sharp blue eyes, straight brows, silver breastplate with a sun-and-hourglass crest, red cape, stern and arrogant, sad downcast eyes, slight frown` |
| `angry` 분노 | `public/art/char/adelhart/angry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Adelhart, a 28-year-old first prince and commander, short slicked-back blond hair, sharp blue eyes, straight brows, silver breastplate with a sun-and-hourglass crest, red cape, stern and arrogant, angry glare, furrowed brows` |
| `surprise` 놀람 | `public/art/char/adelhart/surprise.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Adelhart, a 28-year-old first prince and commander, short slicked-back blond hair, sharp blue eyes, straight brows, silver breastplate with a sun-and-hourglass crest, red cape, stern and arrogant, surprised, wide eyes, small open mouth` |
| `serious` 진지 | `public/art/char/adelhart/serious.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Adelhart, a 28-year-old first prince and commander, short slicked-back blond hair, sharp blue eyes, straight brows, silver breastplate with a sun-and-hourglass crest, red cape, stern and arrogant, serious determined expression` |
| `tender` 다정 | `public/art/char/adelhart/tender.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Adelhart, a 28-year-old first prince and commander, short slicked-back blond hair, sharp blue eyes, straight brows, silver breastplate with a sun-and-hourglass crest, red cape, stern and arrogant, tender soft gaze, faint blush` |
| `pain` 고통 | `public/art/char/adelhart/pain.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Adelhart, a 28-year-old first prince and commander, short slicked-back blond hair, sharp blue eyes, straight brows, silver breastplate with a sun-and-hourglass crest, red cape, stern and arrogant, wincing in pain, gritted teeth, sweat drop` |
| `smirk` 비웃음/능청 | `public/art/char/adelhart/smirk.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Adelhart, a 28-year-old first prince and commander, short slicked-back blond hair, sharp blue eyes, straight brows, silver breastplate with a sun-and-hourglass crest, red cape, stern and arrogant, sly smirk` |
| `cry` 울음 | `public/art/char/adelhart/cry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Adelhart, a 28-year-old first prince and commander, short slicked-back blond hair, sharp blue eyes, straight brows, silver breastplate with a sun-and-hourglass crest, red cape, stern and arrogant, crying, tears streaming down cheeks` |

### `ashking` — 재의 왕

| 표정 | 파일 | 프롬프트 |
|---|---|---|
| `normal` 기본 | `public/art/char/ashking/normal.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the Ash King, a tall figure in a tattered charcoal cloak of ash and sand, long pure-white hair, cracked white porcelain mask with two eyeholes, two horns with ashen crumbling tips, edges of his body crumbling into drifting ash (the mask never comes off; show emotion by mask tilt and eyehole glow), mask facing forward, dim gray glow in eyeholes` |
| `smile` 미소 | `public/art/char/ashking/smile.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the Ash King, a tall figure in a tattered charcoal cloak of ash and sand, long pure-white hair, cracked white porcelain mask with two eyeholes, two horns with ashen crumbling tips, edges of his body crumbling into drifting ash (the mask never comes off; show emotion by mask tilt and eyehole glow), mask tilted slightly, soft warm glow in eyeholes` |
| `sad` 슬픔 | `public/art/char/ashking/sad.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the Ash King, a tall figure in a tattered charcoal cloak of ash and sand, long pure-white hair, cracked white porcelain mask with two eyeholes, two horns with ashen crumbling tips, edges of his body crumbling into drifting ash (the mask never comes off; show emotion by mask tilt and eyehole glow), mask lowered, deep shadow over eyeholes` |
| `angry` 분노 | `public/art/char/ashking/angry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the Ash King, a tall figure in a tattered charcoal cloak of ash and sand, long pure-white hair, cracked white porcelain mask with two eyeholes, two horns with ashen crumbling tips, edges of his body crumbling into drifting ash (the mask never comes off; show emotion by mask tilt and eyehole glow), mask tilted forward, sharp bright glow in eyeholes` |
| `surprise` 놀람 | `public/art/char/ashking/surprise.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the Ash King, a tall figure in a tattered charcoal cloak of ash and sand, long pure-white hair, cracked white porcelain mask with two eyeholes, two horns with ashen crumbling tips, edges of his body crumbling into drifting ash (the mask never comes off; show emotion by mask tilt and eyehole glow), mask lifted, eyeholes flaring` |
| `serious` 진지 | `public/art/char/ashking/serious.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the Ash King, a tall figure in a tattered charcoal cloak of ash and sand, long pure-white hair, cracked white porcelain mask with two eyeholes, two horns with ashen crumbling tips, edges of his body crumbling into drifting ash (the mask never comes off; show emotion by mask tilt and eyehole glow), mask straight, steady glow` |
| `tender` 다정 | `public/art/char/ashking/tender.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the Ash King, a tall figure in a tattered charcoal cloak of ash and sand, long pure-white hair, cracked white porcelain mask with two eyeholes, two horns with ashen crumbling tips, edges of his body crumbling into drifting ash (the mask never comes off; show emotion by mask tilt and eyehole glow), mask tilted gently to one side, faint golden glow` |
| `pain` 고통 | `public/art/char/ashking/pain.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the Ash King, a tall figure in a tattered charcoal cloak of ash and sand, long pure-white hair, cracked white porcelain mask with two eyeholes, two horns with ashen crumbling tips, edges of his body crumbling into drifting ash (the mask never comes off; show emotion by mask tilt and eyehole glow), more ash crumbling from his edges, mask cracked further` |
| `smirk` 비웃음/능청 | `public/art/char/ashking/smirk.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the Ash King, a tall figure in a tattered charcoal cloak of ash and sand, long pure-white hair, cracked white porcelain mask with two eyeholes, two horns with ashen crumbling tips, edges of his body crumbling into drifting ash (the mask never comes off; show emotion by mask tilt and eyehole glow), mask tilted with a slight sardonic angle` |
| `cry` 울음 | `public/art/char/ashking/cry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the Ash King, a tall figure in a tattered charcoal cloak of ash and sand, long pure-white hair, cracked white porcelain mask with two eyeholes, two horns with ashen crumbling tips, edges of his body crumbling into drifting ash (the mask never comes off; show emotion by mask tilt and eyehole glow), a trail of ash falling from an eyehole like a tear` |

### `ashking_bare` — 재의 왕 (맨얼굴)

| 표정 | 파일 | 프롬프트 |
|---|---|---|
| `normal` 기본 | `public/art/char/ashking_bare/normal.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the unmasked Ash King: a gaunt aged version of Elios in his late thirties, long pure-white hair, ashen gray faded eyes with a faint trace of red in one eye, ash-like cracks on cheeks and neck, crumbling horns, tattered charcoal ash cloak, body edges crumbling into ash, calm neutral expression` |
| `smile` 미소 | `public/art/char/ashking_bare/smile.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the unmasked Ash King: a gaunt aged version of Elios in his late thirties, long pure-white hair, ashen gray faded eyes with a faint trace of red in one eye, ash-like cracks on cheeks and neck, crumbling horns, tattered charcoal ash cloak, body edges crumbling into ash, gentle smile` |
| `sad` 슬픔 | `public/art/char/ashking_bare/sad.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the unmasked Ash King: a gaunt aged version of Elios in his late thirties, long pure-white hair, ashen gray faded eyes with a faint trace of red in one eye, ash-like cracks on cheeks and neck, crumbling horns, tattered charcoal ash cloak, body edges crumbling into ash, sad downcast eyes, slight frown` |
| `angry` 분노 | `public/art/char/ashking_bare/angry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the unmasked Ash King: a gaunt aged version of Elios in his late thirties, long pure-white hair, ashen gray faded eyes with a faint trace of red in one eye, ash-like cracks on cheeks and neck, crumbling horns, tattered charcoal ash cloak, body edges crumbling into ash, angry glare, furrowed brows` |
| `surprise` 놀람 | `public/art/char/ashking_bare/surprise.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the unmasked Ash King: a gaunt aged version of Elios in his late thirties, long pure-white hair, ashen gray faded eyes with a faint trace of red in one eye, ash-like cracks on cheeks and neck, crumbling horns, tattered charcoal ash cloak, body edges crumbling into ash, surprised, wide eyes, small open mouth` |
| `serious` 진지 | `public/art/char/ashking_bare/serious.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the unmasked Ash King: a gaunt aged version of Elios in his late thirties, long pure-white hair, ashen gray faded eyes with a faint trace of red in one eye, ash-like cracks on cheeks and neck, crumbling horns, tattered charcoal ash cloak, body edges crumbling into ash, serious determined expression` |
| `tender` 다정 | `public/art/char/ashking_bare/tender.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the unmasked Ash King: a gaunt aged version of Elios in his late thirties, long pure-white hair, ashen gray faded eyes with a faint trace of red in one eye, ash-like cracks on cheeks and neck, crumbling horns, tattered charcoal ash cloak, body edges crumbling into ash, tender soft gaze, faint blush` |
| `pain` 고통 | `public/art/char/ashking_bare/pain.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the unmasked Ash King: a gaunt aged version of Elios in his late thirties, long pure-white hair, ashen gray faded eyes with a faint trace of red in one eye, ash-like cracks on cheeks and neck, crumbling horns, tattered charcoal ash cloak, body edges crumbling into ash, wincing in pain, gritted teeth, sweat drop` |
| `smirk` 비웃음/능청 | `public/art/char/ashking_bare/smirk.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the unmasked Ash King: a gaunt aged version of Elios in his late thirties, long pure-white hair, ashen gray faded eyes with a faint trace of red in one eye, ash-like cracks on cheeks and neck, crumbling horns, tattered charcoal ash cloak, body edges crumbling into ash, sly smirk` |
| `cry` 울음 | `public/art/char/ashking_bare/cry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, the unmasked Ash King: a gaunt aged version of Elios in his late thirties, long pure-white hair, ashen gray faded eyes with a faint trace of red in one eye, ash-like cracks on cheeks and neck, crumbling horns, tattered charcoal ash cloak, body edges crumbling into ash, crying, tears streaming down cheeks` |

### `faceless` — 무면

| 표정 | 파일 | 프롬프트 |
|---|---|---|
| `normal` 기본 | `public/art/char/faceless/normal.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, a Faceless assassin: smooth featureless white porcelain mask with no eyes, nose or mouth, black hooded robe, silver sunset crest on the chest, thin silver blade (all expressions may be the same image), motionless, blank mask` |
| `smile` 미소 | `public/art/char/faceless/smile.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, a Faceless assassin: smooth featureless white porcelain mask with no eyes, nose or mouth, black hooded robe, silver sunset crest on the chest, thin silver blade (all expressions may be the same image), motionless, blank mask` |
| `sad` 슬픔 | `public/art/char/faceless/sad.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, a Faceless assassin: smooth featureless white porcelain mask with no eyes, nose or mouth, black hooded robe, silver sunset crest on the chest, thin silver blade (all expressions may be the same image), motionless, blank mask` |
| `angry` 분노 | `public/art/char/faceless/angry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, a Faceless assassin: smooth featureless white porcelain mask with no eyes, nose or mouth, black hooded robe, silver sunset crest on the chest, thin silver blade (all expressions may be the same image), motionless, blank mask, faint red glow along the mask edge` |
| `surprise` 놀람 | `public/art/char/faceless/surprise.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, a Faceless assassin: smooth featureless white porcelain mask with no eyes, nose or mouth, black hooded robe, silver sunset crest on the chest, thin silver blade (all expressions may be the same image), motionless, blank mask` |
| `serious` 진지 | `public/art/char/faceless/serious.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, a Faceless assassin: smooth featureless white porcelain mask with no eyes, nose or mouth, black hooded robe, silver sunset crest on the chest, thin silver blade (all expressions may be the same image), motionless, blank mask` |
| `tender` 다정 | `public/art/char/faceless/tender.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, a Faceless assassin: smooth featureless white porcelain mask with no eyes, nose or mouth, black hooded robe, silver sunset crest on the chest, thin silver blade (all expressions may be the same image), motionless, blank mask` |
| `pain` 고통 | `public/art/char/faceless/pain.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, a Faceless assassin: smooth featureless white porcelain mask with no eyes, nose or mouth, black hooded robe, silver sunset crest on the chest, thin silver blade (all expressions may be the same image), motionless, blank mask` |
| `smirk` 비웃음/능청 | `public/art/char/faceless/smirk.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, a Faceless assassin: smooth featureless white porcelain mask with no eyes, nose or mouth, black hooded robe, silver sunset crest on the chest, thin silver blade (all expressions may be the same image), motionless, blank mask` |
| `cry` 울음 | `public/art/char/faceless/cry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, a Faceless assassin: smooth featureless white porcelain mask with no eyes, nose or mouth, black hooded robe, silver sunset crest on the chest, thin silver blade (all expressions may be the same image), motionless, blank mask` |

### `herman` — 헤르만

| 표정 | 파일 | 프롬프트 |
|---|---|---|
| `normal` 기본 | `public/art/char/herman/normal.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Herman, a 60s royal chamberlain, silver slicked-back hair, neat mustache, narrow eyes, black tailcoat, white gloves, silver monocle chain, gentle old gentleman, calm neutral expression` |
| `smile` 미소 | `public/art/char/herman/smile.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Herman, a 60s royal chamberlain, silver slicked-back hair, neat mustache, narrow eyes, black tailcoat, white gloves, silver monocle chain, gentle old gentleman, gentle smile` |
| `sad` 슬픔 | `public/art/char/herman/sad.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Herman, a 60s royal chamberlain, silver slicked-back hair, neat mustache, narrow eyes, black tailcoat, white gloves, silver monocle chain, gentle old gentleman, sad downcast eyes, slight frown` |
| `angry` 분노 | `public/art/char/herman/angry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Herman, a 60s royal chamberlain, silver slicked-back hair, neat mustache, narrow eyes, black tailcoat, white gloves, silver monocle chain, gentle old gentleman, angry glare, furrowed brows` |
| `surprise` 놀람 | `public/art/char/herman/surprise.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Herman, a 60s royal chamberlain, silver slicked-back hair, neat mustache, narrow eyes, black tailcoat, white gloves, silver monocle chain, gentle old gentleman, surprised, wide eyes, small open mouth` |
| `serious` 진지 | `public/art/char/herman/serious.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Herman, a 60s royal chamberlain, silver slicked-back hair, neat mustache, narrow eyes, black tailcoat, white gloves, silver monocle chain, gentle old gentleman, serious determined expression` |
| `tender` 다정 | `public/art/char/herman/tender.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Herman, a 60s royal chamberlain, silver slicked-back hair, neat mustache, narrow eyes, black tailcoat, white gloves, silver monocle chain, gentle old gentleman, tender soft gaze, faint blush` |
| `pain` 고통 | `public/art/char/herman/pain.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Herman, a 60s royal chamberlain, silver slicked-back hair, neat mustache, narrow eyes, black tailcoat, white gloves, silver monocle chain, gentle old gentleman, wincing in pain, gritted teeth, sweat drop` |
| `smirk` 비웃음/능청 | `public/art/char/herman/smirk.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Herman, a 60s royal chamberlain, silver slicked-back hair, neat mustache, narrow eyes, black tailcoat, white gloves, silver monocle chain, gentle old gentleman, polite smile turning sinister, cold narrow eyes` |
| `cry` 울음 | `public/art/char/herman/cry.webp` | `Japanese TV anime character design sheet style, isekai fantasy, clean crisp lineart with colored outlines, cel shading with 2-tone shadows, large expressive eyes with layered highlights, glossy hair highlight band, single character, standing pose from head to mid-thigh, three-quarter view facing slightly to the viewer's left, full body centered in frame, transparent background, no background, no text, Herman, a 60s royal chamberlain, silver slicked-back hair, neat mustache, narrow eyes, black tailcoat, white gloves, silver monocle chain, gentle old gentleman, crying, tears streaming down cheeks` |

