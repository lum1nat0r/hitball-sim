import './style.css'

type SpawnMode = 'impact' | 'random' | 'fixed' | 'offset'

type Ball = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  colorIndex: number
  collisionEligibleAt: number
}

type Point = { x: number; y: number }

type Config = {
  initialBalls: number
  maxBalls: number
  fillArena: boolean
  radius: number
  speed: number
  restitution: number
  gravity: number
  spawnMode: SpawnMode
  fixedX: number
  fixedY: number
  offsetDistance: number
  offsetAngle: number
  trails: boolean
}

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="Hitball home">
        <span class="brand-mark"><i></i><i></i><i></i></span>
        <span>HITBALL</span>
      </a>
      <div class="eyebrow"><span class="live-dot"></span> REAL-TIME PHYSICS LAB</div>
      <button class="icon-button" id="themeButton" aria-label="Toggle high contrast" title="Toggle high contrast">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36A7 7 0 0 1 12 3Z"/></svg>
      </button>
    </header>

    <main class="workspace">
      <section class="stage-card" aria-label="Ball simulation">
        <div class="stage-header">
          <div>
            <div class="section-label">LIVE ARENA</div>
            <h1>Collision field</h1>
          </div>
          <div class="metrics" aria-live="polite">
            <div class="metric"><strong id="ballCount">0</strong><span>BALLS</span></div>
            <div class="metric"><strong id="collisionCount">0</strong><span>COLLISIONS</span></div>
            <div class="metric"><strong id="fpsCount">60</strong><span>FPS</span></div>
          </div>
        </div>

        <div class="canvas-wrap" id="canvasWrap">
          <canvas id="simulationCanvas" aria-label="Animated balls bouncing within a circular arena"></canvas>
          <div class="canvas-glow"></div>
          <div class="paused-badge" id="pausedBadge"><span></span> Paused</div>
          <div class="cap-notice" id="capNotice">Ball limit reached</div>
        </div>

        <div class="stage-footer">
          <p><kbd>Click</kbd> arena to place the fixed spawn point</p>
          <p class="status-copy"><span></span><b id="statusText">Simulation running</b></p>
        </div>
      </section>

      <aside class="control-panel">
        <div class="control-heading">
          <div>
            <div class="section-label">PARAMETERS</div>
            <h2>Experiment setup</h2>
          </div>
          <button class="reset-button" id="resetButton" title="Reset simulation">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4.9 16.5a8 8 0 1 0 .6-9.7L3 9"/></svg>
            RESET
          </button>
        </div>

        <div class="control-scroll">
          <section class="control-section">
            <h3><span>01</span> Population</h3>
            <label class="control-row">
              <span class="control-meta"><b>Starting balls</b><small>Population after reset</small></span>
              <span class="range-cluster"><output data-output="initialBalls">6</output><input type="range" min="2" max="20" step="1" value="6" data-config="initialBalls" /></span>
            </label>
            <label class="control-row limit-row">
              <span class="control-meta"><b>Ball limit</b><small id="limitDescription">Safety ceiling</small></span>
              <span class="range-cluster" id="limitRange"><output data-output="maxBalls">180</output><input type="range" min="25" max="300" step="5" value="180" data-config="maxBalls" /></span>
            </label>
            <label class="limit-option">
              <span class="control-meta"><b>Fill the arena</b><small>Spawn until no free point remains</small></span>
              <input type="checkbox" data-config="fillArena" />
              <span class="toggle" aria-hidden="true"></span>
            </label>
            <label class="control-row">
              <span class="control-meta"><b>Ball size</b><small>Radius in pixels</small></span>
              <span class="range-cluster"><output data-output="radius">8 px</output><input type="range" min="4" max="16" step="1" value="8" data-config="radius" /></span>
            </label>
          </section>

          <section class="control-section">
            <h3><span>02</span> Motion</h3>
            <label class="control-row">
              <span class="control-meta"><b>Speed</b><small>Velocity of every ball</small></span>
              <span class="range-cluster"><output data-output="speed">150</output><input type="range" min="40" max="320" step="5" value="150" data-config="speed" /></span>
            </label>
            <label class="control-row">
              <span class="control-meta"><b>Bounciness</b><small>Energy retained on impact</small></span>
              <span class="range-cluster"><output data-output="restitution">92%</output><input type="range" min="40" max="105" step="1" value="92" data-config="restitution" /></span>
            </label>
            <label class="control-row">
              <span class="control-meta"><b>Gravity</b><small>Downward acceleration</small></span>
              <span class="range-cluster"><output data-output="gravity">0</output><input type="range" min="0" max="500" step="10" value="0" data-config="gravity" /></span>
            </label>
          </section>

          <section class="control-section spawn-section">
            <h3><span>03</span> New ball spawn</h3>
            <label class="select-label" for="spawnMode">SPAWN POINT</label>
            <div class="select-wrap">
              <select id="spawnMode" data-config="spawnMode">
                <option value="impact">At collision</option>
                <option value="random" selected>Random in arena</option>
                <option value="fixed">Fixed point</option>
                <option value="offset">Offset from collision</option>
              </select>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>
            </div>

            <div class="mode-options" data-mode-options="fixed">
              <label class="control-row compact">
                <span class="control-meta"><b>Horizontal</b></span>
                <span class="range-cluster"><output data-output="fixedX">50%</output><input type="range" min="10" max="90" step="1" value="50" data-config="fixedX" /></span>
              </label>
              <label class="control-row compact">
                <span class="control-meta"><b>Vertical</b></span>
                <span class="range-cluster"><output data-output="fixedY">50%</output><input type="range" min="10" max="90" step="1" value="50" data-config="fixedY" /></span>
              </label>
            </div>

            <div class="mode-options" data-mode-options="offset">
              <label class="control-row compact">
                <span class="control-meta"><b>Distance</b></span>
                <span class="range-cluster"><output data-output="offsetDistance">45 px</output><input type="range" min="10" max="120" step="5" value="45" data-config="offsetDistance" /></span>
              </label>
              <label class="control-row compact">
                <span class="control-meta"><b>Direction</b></span>
                <span class="range-cluster"><output data-output="offsetAngle">30°</output><input type="range" min="0" max="360" step="5" value="30" data-config="offsetAngle" /></span>
              </label>
            </div>
          </section>

          <section class="control-section display-section">
            <h3><span>04</span> Display</h3>
            <label class="toggle-row">
              <span class="control-meta"><b>Motion trails</b><small>Keep a trace of each path</small></span>
              <input type="checkbox" data-config="trails" />
              <span class="toggle" aria-hidden="true"></span>
            </label>
          </section>
        </div>

        <button class="pause-button" id="pauseButton">
          <svg class="pause-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>
          <svg class="play-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z"/></svg>
          <span>Pause simulation</span>
          <kbd>SPACE</kbd>
        </button>
      </aside>
    </main>
  </div>
`

const canvas = document.querySelector<HTMLCanvasElement>('#simulationCanvas')!
const canvasWrap = document.querySelector<HTMLDivElement>('#canvasWrap')!
const ctx = canvas.getContext('2d')!
const ballCount = document.querySelector<HTMLElement>('#ballCount')!
const collisionCount = document.querySelector<HTMLElement>('#collisionCount')!
const fpsCount = document.querySelector<HTMLElement>('#fpsCount')!
const pauseButton = document.querySelector<HTMLButtonElement>('#pauseButton')!
const pauseLabel = pauseButton.querySelector('span')!
const pausedBadge = document.querySelector<HTMLDivElement>('#pausedBadge')!
const resetButton = document.querySelector<HTMLButtonElement>('#resetButton')!
const capNotice = document.querySelector<HTMLDivElement>('#capNotice')!
const statusText = document.querySelector<HTMLElement>('#statusText')!
const themeButton = document.querySelector<HTMLButtonElement>('#themeButton')!

const config: Config = {
  initialBalls: 6,
  maxBalls: 180,
  fillArena: false,
  radius: 8,
  speed: 150,
  restitution: 0.92,
  gravity: 0,
  spawnMode: 'random',
  fixedX: 0.5,
  fixedY: 0.5,
  offsetDistance: 45,
  offsetAngle: 30,
  trails: false,
}

let balls: Ball[] = []
let nextId = 1
let collisions = 0
let paused = false
let arena = { x: 0, y: 0, radius: 0 }
let activeContacts = new Set<number>()
let pendingContacts = new Set<number>()
let gridHeads = new Int32Array(0)
let gridLinks = new Int32Array(0)
let lastTime = performance.now()
let fpsSmoothing = 60
let capNoticeTimer = 0
let capNoticeMessage = ''
let capNoticeVisibleUntil = 0
let arenaIsFull = false
const palette = [178, 191, 207, 225, 262, 286, 319, 344, 24, 49]
const ballSprites: Array<HTMLCanvasElement | undefined> = []

function randomDirection(speed = config.speed): Point {
  const angle = Math.random() * Math.PI * 2
  const variance = 0.78 + Math.random() * 0.44
  return { x: Math.cos(angle) * speed * variance, y: Math.sin(angle) * speed * variance }
}

function clampToArena(point: Point, ballRadius: number): Point {
  const dx = point.x - arena.x
  const dy = point.y - arena.y
  const distance = Math.hypot(dx, dy)
  const limit = Math.max(0, arena.radius - ballRadius - 2)
  if (distance <= limit || distance === 0) return point
  return { x: arena.x + (dx / distance) * limit, y: arena.y + (dy / distance) * limit }
}

function randomArenaPoint(ballRadius = config.radius): Point {
  const angle = Math.random() * Math.PI * 2
  const distance = Math.sqrt(Math.random()) * Math.max(0, arena.radius - ballRadius - 5)
  return { x: arena.x + Math.cos(angle) * distance, y: arena.y + Math.sin(angle) * distance }
}

function makeBall(point: Point, radius = config.radius, collisionDelay = 0): Ball {
  const position = clampToArena(point, radius)
  const velocity = randomDirection()
  const id = nextId++
  return {
    id,
    x: position.x,
    y: position.y,
    vx: velocity.x,
    vy: velocity.y,
    radius,
    colorIndex: (id - 1) % palette.length,
    collisionEligibleAt: performance.now() + collisionDelay,
  }
}

function isSpawnPointOpen(point: Point, radius: number, pendingBalls: readonly Ball[] = []): boolean {
  for (const ball of balls) {
    const minimumDistance = ball.radius + radius + 2
    const dx = ball.x - point.x
    const dy = ball.y - point.y
    if (dx * dx + dy * dy < minimumDistance * minimumDistance) return false
  }
  for (const ball of pendingBalls) {
    const minimumDistance = ball.radius + radius + 2
    const dx = ball.x - point.x
    const dy = ball.y - point.y
    if (dx * dx + dy * dy < minimumDistance * minimumDistance) return false
  }
  return true
}

function findOpenRandomPoint(radius: number, pendingBalls: readonly Ball[] = [], attempts = 240): Point | null {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const candidate = randomArenaPoint(radius)
    if (isSpawnPointOpen(candidate, radius, pendingBalls)) return candidate
  }
  return null
}

function nonOverlappingPoint(radius: number): Point {
  return findOpenRandomPoint(radius, [], 80) ?? randomArenaPoint(radius)
}

function resetSimulation(): void {
  balls = []
  nextId = 1
  collisions = 0
  activeContacts.clear()
  pendingContacts.clear()
  capNoticeVisibleUntil = 0
  capNotice.classList.remove('visible')
  arenaIsFull = false
  for (let i = 0; i < config.initialBalls; i++) {
    balls.push(makeBall(nonOverlappingPoint(config.radius)))
  }
  updateMetrics()
  if (paused) draw()
}

function spawnPoint(impact: Point, pendingBalls: readonly Ball[]): Point | null {
  if (config.spawnMode === 'random') {
    return findOpenRandomPoint(config.radius, pendingBalls, config.fillArena ? 600 : 240)
  }

  let preferred: Point
  switch (config.spawnMode) {
    case 'fixed': {
      const diameter = arena.radius * 2
      preferred = clampToArena(
        {
          x: arena.x - arena.radius + diameter * config.fixedX,
          y: arena.y - arena.radius + diameter * config.fixedY,
        },
        config.radius,
      )
      break
    }
    case 'offset': {
      const angle = (config.offsetAngle * Math.PI) / 180
      preferred = clampToArena(
        {
          x: impact.x + Math.cos(angle) * config.offsetDistance,
          y: impact.y + Math.sin(angle) * config.offsetDistance,
        },
        config.radius,
      )
      break
    }
    case 'impact':
      preferred = clampToArena(impact, config.radius)
      break
  }

  if (!config.fillArena || isSpawnPointOpen(preferred, config.radius, pendingBalls)) return preferred
  return findOpenRandomPoint(config.radius, pendingBalls, 600)
}

function showCapNotice(message: string): void {
  const now = performance.now()
  if (message === capNoticeMessage && now < capNoticeVisibleUntil) return
  capNoticeMessage = message
  capNoticeVisibleUntil = now + 1800
  capNotice.textContent = message
  capNotice.classList.add('visible')
  window.clearTimeout(capNoticeTimer)
  capNoticeTimer = window.setTimeout(() => capNotice.classList.remove('visible'), 1800)
}

function resolveBallCollisions(): void {
  pendingContacts.clear()
  const now = performance.now()
  const newBalls: Ball[] = []
  const cellSize = Math.max(2, config.radius * 2)
  const originX = arena.x - arena.radius - config.radius
  const originY = arena.y - arena.radius - config.radius
  const gridSpan = (arena.radius + config.radius) * 2
  const columns = Math.max(1, Math.ceil(gridSpan / cellSize))
  const rows = columns
  const cellCount = columns * rows

  if (gridHeads.length < cellCount) gridHeads = new Int32Array(cellCount)
  if (gridLinks.length < balls.length) gridLinks = new Int32Array(balls.length)
  gridHeads.fill(-1, 0, cellCount)

  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i]
    const cellX = Math.min(columns - 1, Math.max(0, Math.floor((ball.x - originX) / cellSize)))
    const cellY = Math.min(rows - 1, Math.max(0, Math.floor((ball.y - originY) / cellSize)))
    const cell = cellY * columns + cellX
    gridLinks[i] = gridHeads[cell]
    gridHeads[cell] = i
  }

  for (let i = 0; i < balls.length; i++) {
    const a = balls[i]
    const cellX = Math.min(columns - 1, Math.max(0, Math.floor((a.x - originX) / cellSize)))
    const cellY = Math.min(rows - 1, Math.max(0, Math.floor((a.y - originY) / cellSize)))
    const firstX = Math.max(0, cellX - 1)
    const lastX = Math.min(columns - 1, cellX + 1)
    const firstY = Math.max(0, cellY - 1)
    const lastY = Math.min(rows - 1, cellY + 1)

    for (let neighborY = firstY; neighborY <= lastY; neighborY++) {
      for (let neighborX = firstX; neighborX <= lastX; neighborX++) {
        let j = gridHeads[neighborY * columns + neighborX]
        while (j !== -1) {
          if (j > i) {
            const b = balls[j]
            if (now >= a.collisionEligibleAt && now >= b.collisionEligibleAt) {
              const dx = b.x - a.x
              const dy = b.y - a.y
              const minDistance = a.radius + b.radius
              const distanceSquared = dx * dx + dy * dy
              if (distanceSquared < minDistance * minDistance) {
                const lowerId = a.id < b.id ? a.id : b.id
                const higherId = a.id < b.id ? b.id : a.id
                const key = lowerId * 1_000_000 + higherId
                pendingContacts.add(key)
                const distance = Math.sqrt(distanceSquared) || 0.001
                const nx = dx / distance
                const ny = dy / distance
                const overlap = minDistance - distance
                const totalRadius = a.radius + b.radius
                const aShare = b.radius / totalRadius
                const bShare = a.radius / totalRadius

                a.x -= nx * overlap * aShare
                a.y -= ny * overlap * aShare
                b.x += nx * overlap * bShare
                b.y += ny * overlap * bShare

                const relativeX = b.vx - a.vx
                const relativeY = b.vy - a.vy
                const normalSpeed = relativeX * nx + relativeY * ny
                if (normalSpeed < 0) {
                  const impulse = (-(1 + config.restitution) * normalSpeed) / 2
                  a.vx -= impulse * nx
                  a.vy -= impulse * ny
                  b.vx += impulse * nx
                  b.vy += impulse * ny
                }

                if (!activeContacts.has(key)) {
                  collisions++
                  const belowLimit = config.fillArena || balls.length + newBalls.length < config.maxBalls
                  if (belowLimit && !arenaIsFull) {
                    const point = spawnPoint({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, newBalls)
                    if (point) {
                      newBalls.push(makeBall(point, config.radius, 280))
                    } else if (config.fillArena) {
                      arenaIsFull = true
                      showCapNotice('Arena is full')
                    } else {
                      showCapNotice('No open spawn point')
                    }
                  } else if (!config.fillArena) {
                    showCapNotice('Ball limit reached')
                  }
                }
              }
            }
          }
          j = gridLinks[j]
        }
      }
    }
  }

  const previousContacts = activeContacts
  activeContacts = pendingContacts
  pendingContacts = previousContacts
  balls.push(...newBalls)
}

function resolveArenaCollision(ball: Ball): void {
  const dx = ball.x - arena.x
  const dy = ball.y - arena.y
  const distance = Math.hypot(dx, dy)
  const limit = arena.radius - ball.radius
  if (distance <= limit) return

  const nx = distance === 0 ? 1 : dx / distance
  const ny = distance === 0 ? 0 : dy / distance
  ball.x = arena.x + nx * limit
  ball.y = arena.y + ny * limit
  const outwardSpeed = ball.vx * nx + ball.vy * ny
  if (outwardSpeed > 0) {
    ball.vx -= (1 + config.restitution) * outwardSpeed * nx
    ball.vy -= (1 + config.restitution) * outwardSpeed * ny
  }
}

function simulate(delta: number): void {
  let fastestSquared = config.speed * config.speed
  for (const ball of balls) {
    const speedSquared = ball.vx * ball.vx + ball.vy * ball.vy
    if (speedSquared > fastestSquared) fastestSquared = speedSquared
  }
  const substeps = Math.min(
    5,
    Math.max(1, Math.ceil((Math.sqrt(fastestSquared) * delta) / Math.max(5, config.radius))),
  )
  const step = delta / substeps

  for (let s = 0; s < substeps; s++) {
    for (const ball of balls) {
      ball.vy += config.gravity * step
      ball.x += ball.vx * step
      ball.y += ball.vy * step
      resolveArenaCollision(ball)
    }
    resolveBallCollisions()
  }
}

function drawArena(): void {
  ctx.save()
  ctx.beginPath()
  ctx.arc(arena.x, arena.y, arena.radius, 0, Math.PI * 2)
  ctx.clip()

  const radial = ctx.createRadialGradient(arena.x, arena.y, 0, arena.x, arena.y, arena.radius)
  radial.addColorStop(0, 'rgba(19, 25, 36, 0.22)')
  radial.addColorStop(0.72, 'rgba(5, 8, 14, 0.1)')
  radial.addColorStop(1, 'rgba(86, 234, 218, 0.045)')
  ctx.fillStyle = radial
  ctx.fillRect(arena.x - arena.radius, arena.y - arena.radius, arena.radius * 2, arena.radius * 2)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.026)'
  ctx.lineWidth = 1
  const grid = Math.max(30, arena.radius / 7)
  for (let x = arena.x - arena.radius; x <= arena.x + arena.radius; x += grid) {
    ctx.beginPath()
    ctx.moveTo(x, arena.y - arena.radius)
    ctx.lineTo(x, arena.y + arena.radius)
    ctx.stroke()
  }
  for (let y = arena.y - arena.radius; y <= arena.y + arena.radius; y += grid) {
    ctx.beginPath()
    ctx.moveTo(arena.x - arena.radius, y)
    ctx.lineTo(arena.x + arena.radius, y)
    ctx.stroke()
  }
  ctx.restore()

  ctx.beginPath()
  ctx.arc(arena.x, arena.y, arena.radius, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(127, 255, 237, 0.58)'
  ctx.lineWidth = 2
  ctx.shadowColor = 'rgba(70, 255, 225, 0.42)'
  ctx.shadowBlur = 18
  ctx.stroke()
  ctx.shadowBlur = 0

  ctx.beginPath()
  ctx.arc(arena.x, arena.y, arena.radius - 5, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
  ctx.lineWidth = 1
  ctx.stroke()
}

function drawFixedMarker(): void {
  if (config.spawnMode !== 'fixed') return
  const diameter = arena.radius * 2
  const point = clampToArena(
    {
      x: arena.x - arena.radius + diameter * config.fixedX,
      y: arena.y - arena.radius + diameter * config.fixedY,
    },
    config.radius,
  )
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 210, 94, 0.8)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 4])
  ctx.beginPath()
  ctx.arc(point.x, point.y, config.radius + 7, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(point.x - 4, point.y)
  ctx.lineTo(point.x + 4, point.y)
  ctx.moveTo(point.x, point.y - 4)
  ctx.lineTo(point.x, point.y + 4)
  ctx.stroke()
  ctx.restore()
}

function getBallSprite(radius: number, colorIndex: number): HTMLCanvasElement {
  const cacheKey = radius * palette.length + colorIndex
  const cached = ballSprites[cacheKey]
  if (cached) return cached

  const sprite = document.createElement('canvas')
  const size = Math.ceil(radius * 4 + 4)
  const center = size / 2
  const hue = palette[colorIndex]
  sprite.width = size
  sprite.height = size
  const spriteContext = sprite.getContext('2d')!
  const gradient = spriteContext.createRadialGradient(
    center - radius * 0.35,
    center - radius * 0.38,
    radius * 0.08,
    center,
    center,
    radius,
  )
  gradient.addColorStop(0, `hsl(${hue} 100% 95%)`)
  gradient.addColorStop(0.2, `hsl(${hue} 92% 68%)`)
  gradient.addColorStop(1, `hsl(${hue} 84% 43%)`)
  spriteContext.beginPath()
  spriteContext.arc(center, center, radius, 0, Math.PI * 2)
  spriteContext.fillStyle = gradient
  spriteContext.shadowColor = `hsla(${hue} 95% 63% / 0.72)`
  spriteContext.shadowBlur = Math.min(15, radius * 1.5)
  spriteContext.fill()
  spriteContext.shadowBlur = 0
  spriteContext.strokeStyle = `hsla(${hue} 100% 91% / 0.7)`
  spriteContext.lineWidth = 0.75
  spriteContext.stroke()
  ballSprites[cacheKey] = sprite
  return sprite
}

function drawBall(ball: Ball): void {
  const sprite = getBallSprite(ball.radius, ball.colorIndex)
  ctx.drawImage(sprite, ball.x - sprite.width / 2, ball.y - sprite.height / 2)
}

function draw(): void {
  ctx.fillStyle = config.trails ? 'rgba(7, 10, 16, 0.19)' : '#070a10'
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
  drawArena()
  drawFixedMarker()
  for (const ball of balls) drawBall(ball)
}

function updateMetrics(): void {
  ballCount.textContent = balls.length.toLocaleString()
  collisionCount.textContent = collisions.toLocaleString()
  fpsCount.textContent = Math.round(fpsSmoothing).toString()
}

function frame(now: number): void {
  const elapsed = Math.min((now - lastTime) / 1000, 0.05)
  lastTime = now
  if (!paused) simulate(elapsed)
  draw()
  if (elapsed > 0) fpsSmoothing = fpsSmoothing * 0.92 + (1 / elapsed) * 0.08
  updateMetrics()
  requestAnimationFrame(frame)
}

function resizeCanvas(): void {
  const rect = canvasWrap.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(rect.width * dpr)
  canvas.height = Math.round(rect.height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  arena = {
    x: rect.width / 2,
    y: rect.height / 2,
    radius: Math.max(80, Math.min(rect.width, rect.height) * 0.425),
  }
  for (const ball of balls) {
    const clamped = clampToArena(ball, ball.radius)
    ball.x = clamped.x
    ball.y = clamped.y
  }
  draw()
}

function togglePause(): void {
  paused = !paused
  pauseButton.classList.toggle('is-paused', paused)
  pausedBadge.classList.toggle('visible', paused)
  pauseLabel.textContent = paused ? 'Resume simulation' : 'Pause simulation'
  statusText.textContent = paused ? 'Simulation paused' : 'Simulation running'
  if (!paused) lastTime = performance.now()
}

function formatOutput(key: keyof Config, raw: number | boolean | string): string {
  if (key === 'restitution') return `${raw}%`
  if (key === 'fixedX' || key === 'fixedY') return `${raw}%`
  if (key === 'radius' || key === 'offsetDistance') return `${raw} px`
  if (key === 'offsetAngle') return `${raw}°`
  return String(raw)
}

function syncModeOptions(): void {
  document.querySelectorAll<HTMLElement>('[data-mode-options]').forEach((element) => {
    element.classList.toggle('visible', element.dataset.modeOptions === config.spawnMode)
  })
}

function setNumericConfig(key: keyof Config, value: number): void {
  if (key === 'restitution') {
    config.restitution = value / 100
  } else if (key === 'fixedX' || key === 'fixedY') {
    config[key] = value / 100
  } else if (key === 'speed') {
    const ratio = value / config.speed
    config.speed = value
    for (const ball of balls) {
      ball.vx *= ratio
      ball.vy *= ratio
    }
  } else if (key === 'radius') {
    config.radius = value
    arenaIsFull = false
    for (const ball of balls) ball.radius = value
  } else if (key !== 'trails' && key !== 'fillArena' && key !== 'spawnMode') {
    config[key] = value
  }
}

document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-config]').forEach((input) => {
  input.addEventListener('input', () => {
    const key = input.dataset.config as keyof Config
    if (input instanceof HTMLInputElement && input.type === 'checkbox') {
      if (key === 'fillArena') {
        config.fillArena = input.checked
        arenaIsFull = false
        const limitInput = document.querySelector<HTMLInputElement>('[data-config="maxBalls"]')!
        const limitOutput = document.querySelector<HTMLOutputElement>('[data-output="maxBalls"]')!
        const limitDescription = document.querySelector<HTMLElement>('#limitDescription')!
        limitInput.disabled = config.fillArena
        limitInput.closest('.range-cluster')?.classList.toggle('disabled', config.fillArena)
        limitOutput.textContent = config.fillArena ? 'AUTO' : String(config.maxBalls)
        limitDescription.textContent = config.fillArena ? 'No fixed ceiling' : 'Safety ceiling'
      } else {
        config.trails = input.checked
      }
    } else if (key === 'spawnMode') {
      config.spawnMode = input.value as SpawnMode
      arenaIsFull = false
      syncModeOptions()
    } else {
      const value = Number(input.value)
      setNumericConfig(key, value)
      const output = document.querySelector<HTMLOutputElement>(`[data-output="${key}"]`)
      if (output) output.textContent = formatOutput(key, value)
    }
  })
})

canvas.addEventListener('pointerdown', (event) => {
  const rect = canvas.getBoundingClientRect()
  const point = clampToArena({ x: event.clientX - rect.left, y: event.clientY - rect.top }, config.radius)
  const diameter = arena.radius * 2
  config.fixedX = Math.max(0.1, Math.min(0.9, (point.x - (arena.x - arena.radius)) / diameter))
  config.fixedY = Math.max(0.1, Math.min(0.9, (point.y - (arena.y - arena.radius)) / diameter))
  for (const key of ['fixedX', 'fixedY'] as const) {
    const percentage = Math.round(config[key] * 100)
    const input = document.querySelector<HTMLInputElement>(`[data-config="${key}"]`)!
    const output = document.querySelector<HTMLOutputElement>(`[data-output="${key}"]`)!
    input.value = String(percentage)
    output.textContent = `${percentage}%`
  }
  const select = document.querySelector<HTMLSelectElement>('#spawnMode')!
  select.value = 'fixed'
  config.spawnMode = 'fixed'
  syncModeOptions()
  draw()
})

pauseButton.addEventListener('click', togglePause)
resetButton.addEventListener('click', resetSimulation)
themeButton.addEventListener('click', () => document.body.classList.toggle('high-contrast'))
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLSelectElement)) {
    event.preventDefault()
    togglePause()
  }
})

const resizeObserver = new ResizeObserver(resizeCanvas)
resizeObserver.observe(canvasWrap)
syncModeOptions()
resizeCanvas()
resetSimulation()
requestAnimationFrame(frame)
