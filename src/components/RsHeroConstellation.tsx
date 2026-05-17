// Port of public/legacy/js/app.js:546-726 (heroConstellationSVG)
// Renders the animated SVG background used on the Welcome hero. Animation is
// SMIL-based (no JS), so we just inject the SVG string.

type Depth = 0 | 1 | 2

interface ConstellationNode {
  x: number
  y: number
  r: number
  d: Depth
  acc: boolean
}

type Edge = readonly [number, number]

function depthValue(values: readonly [number, number, number], depth: Depth): number {
  return values[depth]
}

function heroConstellationSVG(): string {
  const W = 840, H = 340

  const nodes: ConstellationNode[] = [
    { x: 118, y: 50,  r: 9.5, d: 0, acc: false },
    { x: 292, y: 24,  r: 7,   d: 0, acc: false },
    { x: 562, y: 35,  r: 11,  d: 0, acc: false },
    { x: 718, y: 60,  r: 8,   d: 0, acc: false },
    { x: 18,  y: 142, r: 7.5, d: 0, acc: false },
    { x: 820, y: 120, r: 8.5, d: 0, acc: false },
    { x: 30,  y: 225, r: 6.5, d: 0, acc: false },
    { x: 808, y: 200, r: 7.5, d: 0, acc: false },
    { x: 152, y: 282, r: 12,  d: 0, acc: false },
    { x: 362, y: 308, r: 8,   d: 0, acc: false },
    { x: 505, y: 318, r: 6.5, d: 0, acc: false },
    { x: 682, y: 278, r: 10,  d: 0, acc: false },
    { x: 835, y: 258, r: 7,   d: 0, acc: false },
    { x: 195, y: 148, r: 6,   d: 1, acc: true  },
    { x: 445, y: 100, r: 5,   d: 1, acc: false },
    { x: 638, y: 162, r: 7,   d: 1, acc: true  },
    { x: 275, y: 228, r: 5.5, d: 1, acc: false },
    { x: 590, y: 242, r: 6.5, d: 1, acc: true  },
    { x: 755, y: 178, r: 5.5, d: 1, acc: false },
    { x: 388, y: 168, r: 4,   d: 2, acc: true  },
    { x: 518, y: 198, r: 3.2, d: 2, acc: false },
    { x: 320, y: 278, r: 3.6, d: 2, acc: true  },
    { x: 210, y: 200, r: 2.8, d: 2, acc: false },
  ]

  const mainEdges: Edge[]  = [[0,1],[1,2],[2,3],[0,4],[3,5],[4,6],[5,7],[6,8],[7,12],[8,9],[9,10],[10,11],[11,12],[1,9],[2,11]]
  const crossEdges: Edge[] = [[13,0],[13,14],[14,2],[15,3],[15,18],[16,8],[17,9],[18,11],[13,16],[17,20],[19,14],[16,21],[22,9],[22,16]]

  const starData: Array<[number, number, number]> = [
    [42,18,0.6],[160,38,0.8],[380,15,0.5],[550,22,0.7],[720,40,0.6],[800,55,0.9],
    [60,90,0.5],[200,75,0.7],[330,55,0.6],[480,80,0.8],[640,60,0.5],[770,90,0.7],
    [85,150,0.6],[245,135,0.5],[450,130,0.7],[700,140,0.6],[140,190,0.5],[490,155,0.8],
    [720,190,0.6],[350,240,0.7],[570,260,0.5],[715,245,0.6],[100,260,0.7],
    [475,290,0.5],[640,320,0.6],[200,310,0.7],[700,330,0.5],[820,300,0.6],
  ]
  const stars = starData.map(([x,y,r], i) => {
    const op = (0.10 + (i % 6) * 0.05).toFixed(2)
    const col = i % 4 === 0 ? 'var(--accent)' : 'var(--primary)'
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity="${op}"/>`
  }).join('')

  const iridGrads = `
    <linearGradient id="ir0" gradientUnits="objectBoundingBox" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#c084fc"/><stop offset="16%"  stop-color="#818cf8"/>
      <stop offset="32%"  stop-color="#38bdf8"/><stop offset="48%"  stop-color="#2dd4bf"/>
      <stop offset="64%"  stop-color="#f472b6"/><stop offset="82%"  stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#c084fc"/>
      <animateTransform attributeName="gradientTransform" type="rotate"
        values="0 0.5 0.5;360 0.5 0.5" dur="7s" repeatCount="indefinite"/>
    </linearGradient>
    <linearGradient id="ir1" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#f472b6"/><stop offset="20%"  stop-color="#c084fc"/>
      <stop offset="40%"  stop-color="#60a5fa"/><stop offset="60%"  stop-color="#34d399"/>
      <stop offset="80%"  stop-color="#fbbf24"/><stop offset="100%" stop-color="#f472b6"/>
      <animateTransform attributeName="gradientTransform" type="rotate"
        values="0 0.5 0.5;-360 0.5 0.5" dur="10s" repeatCount="indefinite"/>
    </linearGradient>
    <linearGradient id="ir2" gradientUnits="objectBoundingBox" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%"   stop-color="#38bdf8"/><stop offset="25%"  stop-color="#d946ef"/>
      <stop offset="50%"  stop-color="#f9a8d4"/><stop offset="75%"  stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#38bdf8"/>
      <animateTransform attributeName="gradientTransform" type="rotate"
        values="0 0.5 0.5;360 0.5 0.5" dur="5s" repeatCount="indefinite"/>
    </linearGradient>`

  const sphereDefs = nodes.map(({ d, acc }, i) => {
    const col  = acc ? 'var(--accent)' : 'var(--primary)'
    const col2 = acc ? 'var(--primary)' : 'var(--accent)'
    const hx = 30 + (i * 11) % 18
    const hy = 22 + (i * 7)  % 16
    const specOp     = depthValue([0.22, 0.48, 0.78], d).toFixed(2)
    const bodyHigh   = depthValue([0.78, 0.90, 1.00], d).toFixed(2)
    const bodyMid    = depthValue([0.50, 0.62, 0.75], d).toFixed(2)
    const bodyLow    = depthValue([0.08, 0.14, 0.22], d).toFixed(2)
    const iridOp     = depthValue([0.08, 0.18, 0.30], d).toFixed(2)
    return `<radialGradient id="sg${i}" cx="${hx}%" cy="${hy}%" r="72%" fx="${hx-8}%" fy="${hy-8}%">
        <stop offset="0%"   stop-color="white"  stop-opacity="${specOp}"/>
        <stop offset="18%"  stop-color="${col}"  stop-opacity="${bodyHigh}"/>
        <stop offset="68%"  stop-color="${col}"  stop-opacity="${bodyMid}"/>
        <stop offset="100%" stop-color="${col}"  stop-opacity="${bodyLow}"/>
      </radialGradient>
      <radialGradient id="hg${i}" cx="72%" cy="72%" r="50%">
        <stop offset="0%"   stop-color="${col2}" stop-opacity="${iridOp}"/>
        <stop offset="100%" stop-color="${col2}" stop-opacity="0"/>
      </radialGradient>`
  }).join('')

  const renderEdge = (a: number, b: number) => {
    const na = nodes[a], nb = nodes[b]
    if (!na || !nb) return ''
    const dist = Math.hypot(nb.x - na.x, nb.y - na.y)
    const depthAvg = (na.d + nb.d) / 2
    const baseOp   = depthValue([0.20, 0.32, 0.48], Math.round(depthAvg) as Depth)
    const op = Math.max(0.05, baseOp - dist * 0.000055).toFixed(2)
    const w  = (0.6 + depthAvg * 0.5).toFixed(1)
    const col = (na.acc || nb.acc) ? 'var(--accent)' : 'var(--primary)'
    return `<line x1="${na.x.toFixed(1)}" y1="${na.y.toFixed(1)}" x2="${nb.x.toFixed(1)}" y2="${nb.y.toFixed(1)}" stroke="${col}" stroke-opacity="${op}" stroke-width="${w}"/>`
  }
  const lines = [...mainEdges, ...crossEdges].map(([a,b]) => renderEdge(a,b)).join('')

  const renderNode = ({ x, y, r, d, acc: _acc }: typeof nodes[number], i: number) => {
    void _acc
    const speed = depthValue([4.5, 3.2, 2.2], d)
    const da = (speed + (i * 0.23) % 1.5).toFixed(1)
    const db = (speed * 1.45 + (i * 0.37) % 1.8).toFixed(1)
    const dc = (speed * 0.78 + (i * 0.29) % 1.1).toFixed(1)
    const d1 = (speed * 0.88 + (i * 0.15) % 0.8).toFixed(1)

    const swA = depthValue([0.8, 1.1, 1.6], d).toFixed(1)
    const swB = depthValue([0.6, 0.85, 1.2], d).toFixed(1)
    const swC = depthValue([0.45, 0.65, 0.95], d).toFixed(1)

    const rA_s = (r * 1.02).toFixed(1)
    const rA_e = (r * depthValue([5.8, 4.6, 3.5], d)).toFixed(1)
    const rB_s = (r * 1.02).toFixed(1)
    const rB_e = (r * depthValue([4.5, 3.6, 2.8], d)).toFixed(1)
    const rC_s = (r * 1.02).toFixed(1)
    const rC_e = (r * depthValue([3.2, 2.5, 2.0], d)).toFixed(1)

    const opA = depthValue([0.45, 0.65, 0.85], d)
    const opB = depthValue([0.35, 0.52, 0.70], d)
    const opC = depthValue([0.28, 0.42, 0.60], d)
    const filmOp = depthValue([0.04, 0.06, 0.09], d)

    const mA = 1.18, mB = 1.24, mC = 1.15

    const gA = `ir${i % 3}`
    const gB = `ir${(i + 1) % 3}`
    const gC = `ir${(i + 2) % 3}`

    const kt = '0;0.62;0.90;1'
    const ks = '0.42 0 0.58 1;0 0 1 1;0 0 1 1'
    const rimOp = depthValue([0.00, 0.14, 0.28], d)

    return `<g>
      <ellipse cx="${x}" cy="${y}" rx="${rA_s}" ry="${(parseFloat(rA_s)*mA).toFixed(1)}"
        fill="url(#${gA})" fill-opacity="${filmOp}" stroke="url(#${gA})" stroke-width="${swA}">
        <animate attributeName="rx" values="${rA_s};${rA_e};${rA_e};${rA_s}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${da}s" repeatCount="indefinite"/>
        <animate attributeName="ry" values="${(parseFloat(rA_s)*mA).toFixed(1)};${(parseFloat(rA_e)/mA).toFixed(1)};${(parseFloat(rA_e)/mA).toFixed(1)};${(parseFloat(rA_s)*mA).toFixed(1)}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${da}s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" values="${opA};0;0;${opA}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${da}s" repeatCount="indefinite"/>
        <animate attributeName="fill-opacity" values="${filmOp};0;0;${filmOp}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${da}s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="${x}" cy="${y}" rx="${rB_s}" ry="${(parseFloat(rB_s)/mB).toFixed(1)}"
        fill="none" stroke="url(#${gB})" stroke-width="${swB}">
        <animate attributeName="rx" values="${rB_s};${rB_e};${rB_e};${rB_s}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${db}s" repeatCount="indefinite"/>
        <animate attributeName="ry" values="${(parseFloat(rB_s)/mB).toFixed(1)};${(parseFloat(rB_e)*mB).toFixed(1)};${(parseFloat(rB_e)*mB).toFixed(1)};${(parseFloat(rB_s)/mB).toFixed(1)}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${db}s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" values="${opB};0;0;${opB}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${db}s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="${x}" cy="${y}" rx="${rC_s}" ry="${(parseFloat(rC_s)*mC).toFixed(1)}"
        fill="none" stroke="url(#${gC})" stroke-width="${swC}">
        <animate attributeName="rx" values="${rC_s};${rC_e};${rC_e};${rC_s}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${dc}s" repeatCount="indefinite"/>
        <animate attributeName="ry" values="${(parseFloat(rC_s)*mC).toFixed(1)};${(parseFloat(rC_e)/mC).toFixed(1)};${(parseFloat(rC_e)/mC).toFixed(1)};${(parseFloat(rC_s)*mC).toFixed(1)}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${dc}s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" values="${opC};0;0;${opC}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${dc}s" repeatCount="indefinite"/>
      </ellipse>
      <circle cx="${x}" cy="${y}" r="${r}" fill="url(#sg${i})">
        <animate attributeName="opacity" values="1;0.85;1" dur="${d1}s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${x}" cy="${y}" r="${r}" fill="url(#hg${i})">
        <animate attributeName="opacity" values="1;0.45;1" dur="${da}s" repeatCount="indefinite"/>
      </circle>
      ${rimOp > 0 ? `<circle cx="${x}" cy="${y}" r="${(r-0.3).toFixed(1)}" fill="none" stroke="white" stroke-width="0.55" stroke-opacity="${rimOp.toFixed(2)}"/>` : ''}
    </g>`
  }
  const pts = nodes.map((n, i) => renderNode(n, i)).join('')

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${iridGrads}${sphereDefs}</defs>${stars}${lines}${pts}</svg>`
}

const SVG_MARKUP = heroConstellationSVG()

export function RsHeroConstellation() {
  return <div className="hero-constellation" aria-hidden dangerouslySetInnerHTML={{ __html: SVG_MARKUP }} />
}
