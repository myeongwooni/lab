import { PALETTE } from "./palette";
import { ART, SCENE_H, SCENE_W, type ArtId, type Layer } from "./scenes";
import { SPRITES, type SpriteId } from "./sprites";

// 한 줄에서 같은 색이 이어지면 사각형 하나로 합쳐 그립니다.
export function Pixels({ id, flip = false }: { id: SpriteId; flip?: boolean }) {
  const rows = SPRITES[id];
  const width = rows[0].length;
  const rects: React.ReactNode[] = [];
  rows.forEach((row, y) => {
    let start = 0;
    for (let col = 1; col <= row.length; col += 1) {
      if (col < row.length && row[col] === row[start]) continue;
      const fill = PALETTE[row[start]];
      if (fill) {
        const x = flip ? width - col : start;
        rects.push(<rect key={`${y}-${start}`} x={x} y={y} width={col - start} height={1} fill={fill} />);
      }
      start = col;
    }
  });
  return <>{rects}</>;
}

export function Sprite({ id, scale, className, title, flip }: { id: SpriteId; scale: number; className?: string; title?: string; flip?: boolean }) {
  const rows = SPRITES[id];
  const width = rows[0].length;
  const height = rows.length;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <Pixels id={id} flip={flip} />
    </svg>
  );
}

function LayerView({ layer }: { layer: Layer }) {
  if (layer.kind === "rect") {
    return <rect x={layer.x} y={layer.y} width={layer.w} height={layer.h} fill={PALETTE[layer.c]} className={layer.cls} />;
  }
  return (
    <g transform={`translate(${layer.x} ${layer.y})`} className={layer.cls}>
      <Pixels id={layer.id} flip={layer.flip} />
    </g>
  );
}

// 층이 수백 개라 같은 장면을 다시 그리지 않도록 결과를 기억해 둡니다.
const cache = new Map<ArtId, React.ReactNode>();
function sceneLayers(art: ArtId) {
  let node = cache.get(art);
  if (!node) {
    node = ART[art].map((layer, i) => <LayerView key={i} layer={layer} />);
    cache.set(art, node);
  }
  return node;
}

export function SceneArt({ art, label, children }: { art: ArtId; label: string; children?: React.ReactNode }) {
  return (
    <svg className="scene-art" viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} shapeRendering="crispEdges" role="img" aria-label={label}>
      {sceneLayers(art)}
      {children}
    </svg>
  );
}

// 장면 위에 몬스터를 두 배 크기로 세웁니다. 발끝이 바닥선(y=52)에 닿게 둡니다.
export function MonsterOnStage({ id, state }: { id: SpriteId; state: "idle" | "hit" | "attack" | "down" }) {
  const rows = SPRITES[id];
  const w = rows[0].length * 2;
  const h = rows.length * 2;
  const x = Math.round((SCENE_W - w) / 2);
  const y = 53 - h;
  return (
    <>
      {/* 전투 중에는 배경을 어둡게 눌러 몬스터를 돋보이게 합니다. */}
      <rect width={SCENE_W} height={SCENE_H} fill="#0b0810" opacity={0.35} />
      <g transform={`translate(${x} ${y})`}>
      <g className={`monster monster-${state}`}>
        <rect x={4} y={h - 1} width={w - 8} height={2} fill="#000" opacity={0.35} />
        <g transform="scale(2)">
          <Pixels id={id} />
        </g>
      </g>
      </g>
    </>
  );
}
