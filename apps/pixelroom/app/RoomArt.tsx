import type { Puzzle, Run } from "../lib/game";

// 모든 사물은 외부 이미지 없이 정수 좌표의 SVG 블록으로 그립니다.
// 클릭 판정은 page.tsx의 투명한 HTML 버튼이 맡아 터치·키보드 조작을 보장합니다.
export default function RoomArt({ puzzle, run }: { puzzle: Puzzle; run: Run }) {
  const { palette: p } = puzzle;
  const stars = [
    [319, 112], [348, 93], [386, 125], [409, 104], [335, 144], [397, 154],
    [366, 160], [355, 127], [420, 133], [305, 163],
  ];
  return (
    <svg viewBox="0 0 800 500" role="img" aria-label="별빛이 창으로 비치는 도트 방. 책장, 그림, 시계, 서랍, 라디오, 화분, 카펫, 금고, 문을 조사할 수 있습니다." shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="bricks" width="64" height="36" patternUnits="userSpaceOnUse">
          <path d="M0 35H64M32 0V35" stroke="#111e2b" opacity=".12" strokeWidth="2" fill="none"/>
        </pattern>
        <pattern id="boards" width="70" height="100" patternUnits="userSpaceOnUse">
          <path d="M0 0L-30 100M70 0L40 100M0 44H70" stroke="#171f2c" opacity=".22" strokeWidth="2" fill="none"/>
        </pattern>
        <pattern id="rugPattern" width="42" height="30" patternUnits="userSpaceOnUse">
          <path d="M20 0L38 15L20 30L2 15Z" stroke="#e7b98e" strokeWidth="2" fill="none" opacity=".42" />
        </pattern>
      </defs>

      {/* room shell */}
      <rect width="800" height="500" fill="#121b27" />
      <path d="M22 52L96 22H698L778 52L724 344H82Z" fill={p.wallDark}/>
      <path d="M86 38H714V347H86Z" fill={p.wall}/>
      <path d="M86 38H714V347H86Z" fill="url(#bricks)" />
      <path d="M18 51L86 38V347L15 469Z" fill={p.wallDark}/>
      <path d="M714 38L780 52L785 469L714 347Z" fill="#1b2939" />
      <path d="M86 340H714L792 484H8Z" fill={p.floor} />
      <path d="M86 340H714L792 484H8Z" fill="url(#boards)" />
      <path d="M86 339H715" stroke="#171e2d" strokeWidth="12" />
      <path d="M86 331H714" stroke={p.floorLight} strokeWidth="4" opacity=".54" />
      <path d="M22 466H780" stroke="#121b27" strokeWidth="12" />
      {/* ambient fragments */}
      <path d="M87 40H710" stroke={p.accent} strokeWidth="4" opacity=".25" />
      <path d="M98 53H705" stroke="#ffffff" opacity=".05" strokeWidth="4" />
      <path d="M47 105H69M737 105H753M48 140H62" stroke={p.accent} strokeWidth="4" opacity=".3"/>

      {/* window and moon */}
      <rect x="294" y="63" width="158" height="146" fill="#172535" stroke="#182a37" strokeWidth="12" />
      <rect x="307" y="76" width="132" height="120" fill="#152335" />
      <path d="M307 184L340 164L372 173L400 154L439 170V196H307Z" fill="#253749" />
      <path d="M307 190L340 177L368 182L410 170L439 181V196H307Z" fill="#2b4655" />
      <rect x={397 - puzzle.constellation * 6} y="92" width="30" height="30" fill="#f0e6bf" />
      <rect x={408 - puzzle.constellation * 6} y="87" width="26" height="28" fill="#152335" />
      {stars.slice(puzzle.constellation, puzzle.constellation + 6).map(([x,y], i) => <rect key={i} x={x} y={y} width={i % 3 === 0 ? 5 : 3} height={i % 3 === 0 ? 5 : 3} fill="#f9edba" opacity={0.56 + i * 0.06} />)}
      <rect x="369" y="72" width="9" height="130" fill="#5a6670" />
      <rect x="302" y="133" width="141" height="9" fill="#5a6670" />
      <rect x="283" y="199" width="179" height="12" fill="#b4a28c" />
      <rect x="281" y="210" width="184" height="6" fill="#42384b" />
      <path d="M291 217L242 340H509L457 217Z" fill={p.glow} opacity={run.lampOn ? ".075" : ".04"} />

      {/* picture: ink appears only through lens */}
      <rect x="271" y="232" width="165" height="101" fill="#261f2d" />
      <rect x="277" y="238" width="153" height="89" fill="#bc9065" />
      <rect x="285" y="246" width="137" height="73" fill="#435b67" />
      <path d="M286 309L326 277L343 289L379 256L421 294V319H286Z" fill="#263b50" />
      <path d="M286 311L316 291L340 301L370 276L420 310V319H286Z" fill="#7a8a78" />
      <rect x="308" y="258" width="12" height="12" fill="#f5d5a0" />
      <path d="M277 234H432" stroke="#e0b58b" strokeWidth="5" />
      {run.paintingRevealed && (
        <g>
          <rect x="344" y="266" width="43" height="42" fill="#1e3650" stroke="#a6d9ff" strokeWidth="3" />
          <text x="365" y="295" fill="#c5eeff" textAnchor="middle" fontSize="29" fontFamily="monospace" fontWeight="bold">{puzzle.digits.blue}</text>
        </g>
      )}

      {/* shelf and colored books */}
      <rect x="112" y="114" width="147" height="240" fill="#231e2c" />
      <rect x="119" y="119" width="134" height="224" fill="#7a5347" />
      <rect x="128" y="132" width="116" height="192" fill="#281f2b" />
      {[189, 260, 324].map((y) => <g key={y}><rect x="124" y={y} width="124" height="10" fill="#a77553"/><rect x="124" y={y + 9} width="124" height="4" fill="#4a3039"/></g>)}
      {[
        { x: 135, c: "#c9756c", h: 40 }, { x: 152, c: "#a18e79", h: 49 }, { x: 170, c: "#83a5a0", h: 43 },
        { x: 190, c: "#d2ad66", h: 52 }, { x: 209, c: "#8693bf", h: 43 }, { x: 226, c: "#b76f84", h: 38 },
      ].map((b, i) => <g key={i}><rect x={b.x} y={188 - b.h} width="14" height={b.h} fill={b.c}/><rect x={b.x+4} y={196 - b.h} width="3" height="5" fill="#f4dfba" opacity=".8" /></g>)}
      {puzzle.order.map((c, i) => {
        const fill = { red: "#d66e70", blue: "#76afdf", yellow: "#f1c973" }[c];
        return <g key={c}><rect x={148 + i * 26} y="215" width="18" height="44" fill={fill} /><rect x={152 + i * 26} y="223" width="10" height="3" fill="#fff1d2" opacity=".7" /><rect x={153 + i * 26} y="248" width="8" height="3" fill="#302939" opacity=".65"/></g>;
      })}
      <rect x="141" y="282" width="47" height="41" fill="#6f777c" />
      <rect x="149" y="274" width="32" height="13" fill="#c3baa9" />
      <rect x="198" y="294" width="38" height="30" fill="#537c74" />
      <rect x="205" y="284" width="23" height="12" fill="#dfca98" />
      <rect x="105" y="353" width="162" height="10" fill="#1b1d2b" opacity=".55" />

      {/* clock: red clue */}
      <rect x="522" y="74" width="89" height="116" fill="#382e3d" />
      <rect x="528" y="81" width="77" height="103" fill="#ac8865" />
      <rect x="538" y="89" width="57" height="57" rx="1" fill="#e4d6b6" stroke="#5e5663" strokeWidth="5" />
      <path d="M566 97V103M566 134V139M543 116H548M584 116H589" stroke="#4a3944" strokeWidth="3" />
      <path d="M566 116L566 103L579 116" stroke="#4a3944" strokeWidth="4" fill="none" />
      <rect x="546" y="155" width="41" height="22" fill="#4d3440" />
      <text x="566" y="172" textAnchor="middle" fill="#ff9992" fontSize="21" fontFamily="monospace" fontWeight="bold">{puzzle.digits.red}</text>
      <rect x="518" y="186" width="97" height="6" fill="#382733" />

      {/* desk and lamp */}
      <path d="M451 314L641 314L662 341L433 341Z" fill="#bf886a" />
      <rect x="435" y="337" width="222" height="11" fill="#75505a" />
      <path d="M460 347H633V415H605V377H487V415H460Z" fill="#5d4150" />
      <rect x="484" y="345" width="135" height="44" fill="#9a6c5c" />
      <rect x="492" y="352" width="120" height="29" fill={run.drawerOpen ? "#3b2e37" : "#7a5355"}/>
      <rect x="543" y="360" width="24" height="5" fill="#d6bd98" />
      {run.drawerOpen && <g><path d="M485 381L474 403H620L611 381Z" fill="#b1826a" /><rect x="532" y="382" width="26" height="13" fill="#9ed8ec" /></g>}
      <rect x="472" y="259" width="8" height="54" fill="#958779" />
      <rect x="451" y="258" width="47" height="8" fill="#5e555d" />
      <path d="M447 262L455 224H496L505 262Z" fill={run.lampOn ? "#e8c783" : "#6d6a6a"} />
      {run.lampOn && <g><path d="M442 266L416 314H534L507 266Z" fill="#ffeac0" opacity=".12" /><rect x="456" y="263" width="37" height="4" fill="#fff0b9" /></g>}
      <rect x="465" y="308" width="31" height="6" fill="#6e5b5e" />

      {/* radio on desk */}
      <rect x="545" y="279" width="78" height="39" fill="#3e4256" stroke="#191d30" strokeWidth="4" />
      <rect x="554" y="288" width="31" height="21" fill={run.radioWorking ? "#c9b881" : "#1d2938"} />
      {run.radioWorking ? <text x="569" y="305" textAnchor="middle" fontFamily="monospace" fontSize="19" fontWeight="bold" fill="#273949">{puzzle.digits.yellow}</text> : <path d="M561 296H578M561 302H578" stroke="#68747c" strokeWidth="2" />}
      <circle cx="602" cy="298" r="9" fill="#282d42" stroke="#a4a6a0" strokeWidth="3"/>
      <rect x="549" y="274" width="63" height="4" fill="#a8a9b2" />
      <path d="M551 274L561 251" stroke="#c6b9a4" strokeWidth="3" />
      {run.radioWorking && <rect x="595" y="283" width="5" height="3" fill="#a8e3bd" />}

      {/* tiny chest / safe */}
      <rect x="626" y="389" width="73" height="63" fill="#262e3e" />
      <rect x="630" y="382" width="65" height="66" fill={run.safeOpen ? "#2e443e" : "#6a7480"} stroke="#1f2c38" strokeWidth="5" />
      <rect x="640" y="391" width="44" height="42" fill={run.safeOpen ? "#162930" : "#45515d"} />
      {run.safeOpen ? <rect x="647" y="402" width="28" height="13" fill="#f5df9e" /> : <g><rect x="645" y="397" width="35" height="11" fill="#172634" /><rect x="650" y="401" width="5" height="3" fill="#cce3ce" /><rect x="659" y="401" width="5" height="3" fill="#cce3ce" /><rect x="668" y="401" width="5" height="3" fill="#cce3ce" /><rect x="657" y="415" width="11" height="11" fill="#afc1bc" /></g>}
      <rect x="626" y="452" width="75" height="6" fill="#222233" opacity=".5" />

      {/* escape door */}
      <rect x="643" y="124" width="97" height="217" fill="#1d2735" />
      <rect x="650" y="127" width="83" height="206" fill={run.phase === "won" ? "#aad6bd" : "#9c765e"} />
      <rect x="661" y="140" width="61" height="178" fill={run.phase === "won" ? "#e7f2d5" : "#574454"} />
      <rect x="669" y="152" width="46" height="83" fill={run.phase === "won" ? "#d8eacb" : "#6f5a60"} />
      <rect x="669" y="247" width="46" height="58" fill={run.phase === "won" ? "#d8eacb" : "#6f5a60"} />
      <rect x="705" y="239" width="12" height="7" fill="#f8d18c" />
      <rect x="702" y="239" width="4" height="14" fill="#9d784e" />
      <rect x="642" y="333" width="100" height="10" fill="#4a3848" />
      {run.phase === "won" && <path d="M650 128L699 111L699 320L650 333Z" fill="#dff3d5" opacity=".32" />}

      {/* plant */}
      <rect x="80" y="373" width="72" height="56" fill="#a97566" />
      <path d="M74 367H160L149 387H87Z" fill="#d59973" />
      <rect x="89" y="383" width="55" height="38" fill="#b68068" />
      <rect x="109" y="309" width="8" height="66" fill="#5f9478" />
      <path d="M115 345L96 318L78 311L85 334L107 355Z" fill="#4d947c" />
      <path d="M116 341L129 304L149 293L144 319L119 359Z" fill="#74b394" />
      <path d="M112 332L105 290L93 281L92 307Z" fill="#8dc6a0" />
      <path d="M120 353L146 336L155 336L141 354L120 365Z" fill="#3f816d" />
      <path d="M96 317L85 301M124 334L141 307" stroke="#bddbb4" strokeWidth="3" opacity=".5" />
      {hasBatteryDecoration(run) && <rect x="124" y="371" width="16" height="8" fill="#e7cd78" />}

      {/* rug */}
      <path d="M254 390H455L491 465H211Z" fill="#302c3f" opacity=".45" />
      <path d="M258 381H453L487 454H222Z" fill="#be7c79" />
      <path d="M272 390H441L466 442H244Z" fill="#815d75" />
      <path d="M272 390H441L466 442H244Z" fill="url(#rugPattern)" />
      <path d="M263 390H448M237 446H476" stroke="#e4b68c" strokeWidth="3" opacity=".7" />
      <path d="M259 455V463M273 456V464M443 456V464M465 454V462" stroke="#e3af80" strokeWidth="3" />
      {run.inventory.includes("brass") && <path d="M363 386L380 375L395 387" stroke="#e6bf72" strokeWidth="3" fill="none" opacity=".65" />}
      {/* foreground stars */}
      {[ [42,420], [752,420], [277,70], [480,104], [624,231] ].map(([x,y], i) => <rect key={i} x={x} y={y} width="4" height="4" fill={p.accent} opacity={.22 + i * .08} />)}
      <rect x="8" y="480" width="784" height="10" fill="#101922" />
    </svg>
  );
}

function hasBatteryDecoration(run: Run) {
  return run.inventory.includes("battery") && !run.radioWorking;
}
