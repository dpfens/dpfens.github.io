---
title: Home
layout: default
---
<link href="/assets/css/pages/home.css" rel="stylesheet" media="all" />

<div class="hero bg-orange-3">
    <div class="hero-left hero-content hero-top d-flex align-items-center py-4 px-3">
        <div>
            <p>My name is</p>
            <h1 class="headline"><span>Doug</span><br/><span>Fenstermacher</span></h1>
            <p class="sub-headline" style="margin-left: 0.25em;">I build software for novel projects, and for the people who use them.</p>
            <a class="btn bg-blue-3" href="/project">My Projects</a>
        </div>
    </div>
    <div class="hero-right hero-content hero-bottom">
        <img class="maxw-30em" src="/assets/img/00e0c0bc-e146-43e7-b172-5ac748ec77bf.png" />
    </div>
</div>

<div class="hero border-3 border-top border-black bg-green-2">
    <div class="hero-left hero-top hero-content border-lg-3 border-end-lg border-lg-black min-vh-50" style="background: url('/assets/img/07068cc6-af89-4854-8c62-6790b5cc67da.png') center center no-repeat; background-size: cover;">
    </div>
    <div class="hero-right hero-bottom hero-content d-flex align-items-center pb-5 min-vh-50">
        <div>
            <h2 class="headline">From long runs to code sprints</h2>
            <p>I used to run competitively. These days I chase solutions that work for real people in real places, not just demos that impress in conference rooms.</p>
            <div class="d-flex justify-content-around">
                <a class="btn bg-purple-3" href="/about">About Me</a>
                <a class="btn bg-red-3" href="/experiment">My Experiments</a>
            </div>
        </div>
    </div>
</div>

<div class="bg-orange-1">
    <div class="row pt-5 pb-4 border-3 border-top border-black">
        <div class="col-12 offset-md-1 col-md-10 offset-lg-2 col-lg-8">
            <p class="sub-headline">I like building sustainable solutions for specific problems. Here are some of the components that can be combined, adapted, and maintained long after the initial build.</p>
        </div>
    </div>

    <div class="grid gx-3 gy-3 px-3 pb-5">

{% capture panelContent %}
I build web applications from the backend up using Python, PHP, Java for the foundation, ReactJS and AngularJS for interfaces that work even when the wifi doesn't.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="Web/App Development" content=panelContent extraClassName="bg-red-3" %}

{% capture panelContent %}
I turn messy datasets into something useful. I prefer Python for wrangling, anomaly detection, recommendation systems. AngularJS for making the results legible to humans.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="Data Analysis" content=panelContent extraClassName="bg-green-2" %}

{% capture panelContent %}
I build and deploy NLP and computer vision models that run in production, not just Jupyter Notebooks. I create custom loss functions like hierarchical cross-entropy when the problem needs nuance.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="Machine Learning" content=panelContent extraClassName="bg-blue-4" %}

{% capture panelContent %}
I design systems where individual incentives align with collective goals, like markets, resource allocation, governance structures. I look at them as puzzles to guide behavior without coercion.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="Mechanism Design" content=panelContent extraClassName="bg-purple-2" %}

{% capture panelContent %}
When resource allocation gets tangled, I untangle it using linear optimization, combinatorial methods, cost-minimization.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="Operations Research" content=panelContent extraClassName="bg-orange-2" %}
    
{% capture panelContent %}
Docker orchestration, microservices, REST APIs, GitLab CI/CD, etc. I build the infrastructure that lets applications scale without collapsing.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="System Architecture/Design" content=panelContent extraClassName="bg-pink-3" %}
    </div>
</div>

{% if site.posts and site.posts.size > 0 %}
<div class="bg-blue-1">
    <div class="row pt-5 pb-4 border-3 border-top border-black">
        <div class="col-12 offset-md-1 col-md-10 offset-lg-2 col-lg-8">
            <p class="sub-headline">My blog is where I think out loud about messy, real-world problems. Sustainable solutions, impact-driven design, practical approaches that outlast the next shiny framework.</p>
        </div>
    </div>
    <div class="grid gx-3 gy-3 px-3 pb-5">
    {% assign filtered = site.posts | where_exp: "post", "post.hide != true" %}
    {% for post in filtered limit: 6 %}
        {% capture colorClassName %}{% cycle "bg-purple-2", "bg-red-2", "bg-orange-2", "bg-pink-3", "bg-blue-4", "bg-green-2" %}{% endcapture %}
        {% include components/post-panel.html post=post extraClassName=colorClassName postcategory=true %}
    {% endfor %}
    </div>
</div>
{% endif %}

<style>
  .hero {
    position: relative;
    overflow: hidden; /* keep strokes from spilling past the hero edges */
  }
 
  .hero-flow-field {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    /* opacity/transition removed -- the sweep animation is now the reveal */
  }
 
  /* both hero-content blocks already share this class, so one rule
     lifts them both above the canvas */
  .hero-content {
    position: relative;
    z-index: 1;
  }

  .hero-flow-regenerate {
    position: absolute;
    right: 14px;
    bottom: 14px;
    z-index: 2;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 2px solid #011627;
    background: rgba(255, 255, 255, 0.85);
    color: #011627;
    font-size: 1.15rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0.55;
    transition: opacity 0.2s ease, transform 0.3s ease;
  }

  .hero-flow-regenerate:hover,
  .hero-flow-regenerate:focus-visible {
    opacity: 1;
  }

  .hero-flow-regenerate:active {
    transform: rotate(180deg);
  }

  .hero-flow-regenerate:disabled {
    cursor: default;
  }
</style>
<script id="main-hero-flow-field">
    document.addEventListener('DOMContentLoaded', function() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let shouldDisableAnimation = prefersReducedMotion;

    if (!shouldDisableAnimation && 'getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            shouldDisableAnimation = battery.level < 0.20 && !battery.charging;
        });
    }
    if (shouldDisableAnimation) {
        return;
    }

    const COLOR_PALETTE = ['#ff6b35', '#f7c548', '#2ec4b6', '#011627', '#e71d36'];
    const hero = document.querySelector('.hero');

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-flow-field';
    hero.insertBefore(canvas, hero.firstChild);

    const regenerateBtn = document.createElement('button');
    regenerateBtn.type = 'button';
    regenerateBtn.className = 'hero-flow-regenerate';
    regenerateBtn.setAttribute('aria-label', 'Regenerate flow field pattern');
    regenerateBtn.innerHTML = '&#x21bb;';
    hero.appendChild(regenerateBtn);

    const protectedEl = hero.querySelector('.hero-left');
    const ctx = canvas.getContext('2d');

    const GU = GenerativeUtilities;
    const Vec2 = GU.core.types.Vector.forDimension(2);
    const { PerlinNoise, OctaveNoiseGenerator, CompositeNoiseGenerator } = GU.distribution.noise;
    const { EuclideanSpace } = GU.math.metricSpace;
    const { SigmoidMapper } = GU.core.utils.mapping;
    const { LCGRandom, Mulberry32 } = GU.math.random.generator;
    const { NormalDistribution } = GU.math.random.distribution.continuous;

    const CELL              = 12;
    const JITTER            = 0.9;
    const STEP              = 4;
    const STEPS_MEAN        = 62;
    const STEPS_VARIANCE    = 30;
    const STEPS_MIN         = 20;
    const STEPS_MAX         = 92;
    const WIDTH_MEAN        = 2.5;
    const WIDTH_VARIANCE    = 1.0;
    const WIDTH_MIN         = 0.5;
    const WIDTH_MAX         = 3.5;
    const NOISE_SCALE       = 0.003;
    const ANGLE_SPINS       = 3;
    const REPEL_PADDING     = 20;
    const REPEL_RADIUS      = 50;
    const REPEL_VARIANCE    = 10;
    const REPEL_WEIGHT      = 2;
    const BOX_CORNER_RADIUS = 24;

    const MIN_SEP = 7;
    const OCC_CELL = MIN_SEP;

    // Total time-to-fully-drawn budget is SWEEP_DURATION_MS + STROKE_DRAW_MS.
    // A stroke near the right edge activates almost immediately and takes
    // STROKE_DRAW_MS to grow; a stroke at the left edge doesn't activate
    // until the sweep front reaches it, then takes the same STROKE_DRAW_MS
    // to grow -- so the very last stroke finishes at exactly their sum.
    const SWEEP_DURATION_MS = 3000;  // time for the activation front to cross the canvas
    const STROKE_DRAW_MS    = 750;  // time any single stroke takes to grow once active
    const WIDTH_BUCKET  = 1.0;   // rounds stroke widths into buckets so segments
                              // sharing a color+width can be batched into one
                              // path/stroke() call instead of thousands of
                              // individual calls -- this is the main fix for
                              // the mid-sweep jank
    const MAX_FRAME_DT  = 48;    // ms -- caps how much virtual time a single
                                // frame can advance. Without this, a slow/janky
                                // frame causes a big time jump next frame, which
                                // makes every active stroke "catch up" by several
                                // steps at once in that same frame -- that burst
                                // is what reads as a freeze-then-lurch. Capping
                                // it means a slow device just takes a bit longer
                                // than 1s total, instead of visibly stuttering.

    const seed = Date.now() & 0xffffffff;

    const rng = new LCGRandom();
    rng.setSeed(seed);

    const colorRng = new Mulberry32();
    colorRng.setSeed(seed ^ 0x9e3779b9);

    const perlin = new PerlinNoise(2);

    const noise = new OctaveNoiseGenerator(2, perlin, {
        octaves: 2,
        persistence: 0.5,
        lacunarity: 3
    });
    noise.seed(seed);

    const space = new EuclideanSpace(2);

    const REPEL_STEEPNESS = 1;
    const sigmoid = new SigmoidMapper(
        { min: 0, max: REPEL_RADIUS },
        { min: 0, max: 1 },
        REPEL_STEEPNESS
    );

    const stepsDist = new NormalDistribution(STEPS_MEAN, STEPS_VARIANCE);
    const widthDist = new NormalDistribution(WIDTH_MEAN, WIDTH_VARIANCE);

    function clamp(v, lo, hi, rng) {
        if (!Number.isFinite(v)) return rng ? rng.randFloat(lo, hi) : (lo + hi) / 2;
        return v < lo ? lo : v > hi ? hi : v;
    }

    let width, height, boxes;
    let affectedCells = null;
    let spatialGrid, optimizedBoxes = [];
    let currentGeneration = 0;
    let strokeOccupancy;

    function measure() {
        const heroBox = hero.getBoundingClientRect();
        width = canvas.width = heroBox.width;
        height = canvas.height = heroBox.height;
        canvas.style.width = heroBox.width + 'px';
        canvas.style.height = heroBox.height + 'px';

        const textTargets = protectedEl.querySelectorAll('h1, p');
        const buttonTargets = protectedEl.querySelectorAll('a');

        function padded(r) {
            return {
                left:   r.left   - heroBox.left - REPEL_PADDING,
                top:    r.top    - heroBox.top  - REPEL_PADDING,
                right:  r.right  - heroBox.left + REPEL_PADDING,
                bottom: r.bottom - heroBox.top  + REPEL_PADDING
            };
        }

        boxes = [];

        textTargets.forEach((el) => {
            const range = document.createRange();
            range.selectNodeContents(el);
            Array.from(range.getClientRects()).forEach((r) => boxes.push(padded(r)));
        });

        buttonTargets.forEach((el) => boxes.push(padded(el.getBoundingClientRect())));

        computeAffectedCells();
    }

    // Builds the list of stroke descriptors (start point, length, width,
    // color, and when in the sweep it should activate) WITHOUT calling
    // flowAngleAt -- that math is deferred to the per-frame growth step
    // below, which is what actually removes the blocking work.
    function buildStrokes() {
        const strokes = [];
        const numBoxes = optimizedBoxes.length;

        for (let gy = CELL / 2; gy < height; gy += CELL) {
            for (let gx = CELL / 2; gx < width; gx += CELL) {
                let x = gx + (rng.random() - 0.5) * CELL * JITTER;
                let y = gy + (rng.random() - 0.5) * CELL * JITTER;

                let inside = false;
                for (let i = 0; i < numBoxes; i++) {
                    const b = optimizedBoxes[i];
                    if (x > b.left && x < b.right && y > b.top && y < b.bottom) {
                        inside = true;
                        break;
                    }
                }
                if (inside) continue;

                const strokeSteps = Math.round(
                    clamp(stepsDist.sample(colorRng), STEPS_MIN, STEPS_MAX, colorRng)
                );
                const strokeWidth = clamp(
                    widthDist.sample(colorRng), WIDTH_MIN, WIDTH_MAX, colorRng
                );
                const color = colorRng.choice(COLOR_PALETTE);

                // x near the right edge -> startNorm ~0 -> activates almost
                // immediately. x near the left edge -> startNorm ~1 ->
                // activates near the end of the sweep window.
                const startNorm = 1 - (x / width);

                strokes.push({
                    x, y,
                    steps: strokeSteps,
                    stepsDone: 0,
                    strokeWidth,
                    color,
                    startTime: startNorm * SWEEP_DURATION_MS,
                    finished: false
                });
            }
        }

        return strokes;
    }

    function isInsideAnyBox(x, y) {
        const numBoxes = optimizedBoxes.length;
        for (let i = 0; i < numBoxes; i++) {
            const b = optimizedBoxes[i];
            if (x > b.left && x < b.right && y > b.top && y < b.bottom) return true;
        }
        return false;
    }

    function flushBatch(batch) {
        for (const group of batch.values()) {
            ctx.strokeStyle = group.color;
            ctx.lineWidth = group.width;
            ctx.lineCap = 'round';
            ctx.beginPath();
            for (const seg of group.segments) {
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
            }
            ctx.stroke();
        }
    }

    function claimOrReject(x, y, id) {
        const cx = Math.floor(x / OCC_CELL);
        const cy = Math.floor(y / OCC_CELL);
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const bucket = strokeOccupancy.get((cx + dx) + ',' + (cy + dy));
                if (!bucket) continue;
                for (const p of bucket) {
                    if (p.id === id) continue; // don't collide with self
                    const ddx = x - p.x, ddy = y - p.y;
                    if (ddx * ddx + ddy * ddy < MIN_SEP * MIN_SEP) return false;
                }
            }
        }
        const key = cx + ',' + cy;
        (strokeOccupancy.get(key) || strokeOccupancy.set(key, []).get(key)).push({ x, y, id });
        return true;
    }

    // Advances one stroke by exactly one segment. Returns false if the
    // stroke has run out of bounds or drifted into a protected box (caller
    // should mark it finished).
    function advanceStroke(stroke) {
        const angle = flowAngleAt(stroke.x, stroke.y);
        const nx = stroke.x + Math.cos(angle) * STEP;
        const ny = stroke.y + Math.sin(angle) * STEP;

        if (nx < 0 || nx > width || ny < 0 || ny > height) return null;
        if (isInsideAnyBox(nx, ny)) return null;
        if (!claimOrReject(nx, ny, stroke.id)) return null;   // <- new

        const segment = { x1: stroke.x, y1: stroke.y, x2: nx, y2: ny, color: stroke.color, width: stroke.strokeWidth };
        stroke.x = nx; stroke.y = ny; stroke.stepsDone++;
        return segment;
    }

    // Drives the animated reveal. `generation` is captured at call time so
    // a resize/regenerate that bumps currentGeneration mid-sweep cleanly
    // aborts this loop instead of fighting over the canvas.
    function runSweep(strokes, generation, onComplete) {
        let virtualElapsed = 0;
        let lastTs = null;

        function frame(ts) {
            if (generation !== currentGeneration) return;

            if (lastTs === null) lastTs = ts;
            const dt = Math.min(ts - lastTs, MAX_FRAME_DT);
            lastTs = ts;
            virtualElapsed += dt;

            const batch = new Map();
            let allDone = true;

            for (const s of strokes) {
                if (s.finished) continue;
                if (virtualElapsed < s.startTime) { allDone = false; continue; }

                const strokeElapsed = virtualElapsed - s.startTime;
                const progress = Math.min(strokeElapsed / STROKE_DRAW_MS, 1);
                const targetSteps = Math.round(progress * s.steps);

                while (s.stepsDone < targetSteps) {
                    const seg = advanceStroke(s);
                    if (!seg) { s.finished = true; break; }

                    const bucketWidth = Math.round(seg.width / WIDTH_BUCKET) * WIDTH_BUCKET;
                    const key = seg.color + '|' + bucketWidth;
                    let group = batch.get(key);
                    if (!group) { group = { color: seg.color, width: bucketWidth, segments: [] }; batch.set(key, group); }
                    group.segments.push(seg);
                }
                if (s.stepsDone >= s.steps) s.finished = true;
                if (!s.finished) allDone = false;
            }

            flushBatch(batch);

            if (!allDone) {
                requestAnimationFrame(frame);
            } else if (onComplete) {
                onComplete();
            }
        }

        requestAnimationFrame(frame);
    }

    // Synchronous fallback (no animated reveal) -- used on resize so the
    // user isn't replaying a 1s animation every time they drag the window.
    function drawAllInstant(strokes) {
        for (const s of strokes) {
            while (s.stepsDone < s.steps) {
                if (!advanceStroke(s)) break;
            }
        }
    }

    function flowAngleAt(x, y) {
        const samplePoint = Vec2.from([x * NOISE_SCALE, y * NOISE_SCALE]);
        const baseAngle = noise.evaluate(samplePoint) * Math.PI * ANGLE_SPINS;

        const boundaryResult = nearestBoundaryPoint(x, y);
        if (boundaryResult === null) {
            return baseAngle;
        }

        const nx = boundaryResult[0];
        const ny = boundaryResult[1];

        const dx = x - nx;
        const dy = y - ny;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= REPEL_RADIUS) {
            return baseAngle;
        }

        const clampedDist = Math.min(dist, REPEL_RADIUS);
        const push = sigmoid.map(REPEL_RADIUS - clampedDist);
        const awayAngle = Math.atan2(y - ny, x - nx);

        const dxBlend = CompositeNoiseGenerator.weightedAverage(
            [Math.cos(baseAngle), Math.cos(awayAngle)],
            [1, REPEL_WEIGHT * push]
        );
        const dyBlend = CompositeNoiseGenerator.weightedAverage(
            [Math.sin(baseAngle), Math.sin(awayAngle)],
            [1, REPEL_WEIGHT * push]
        );

        return Math.atan2(dyBlend, dxBlend);
    }

    function nearestBoundaryPoint(x, y) {
        const cx = Math.floor(x / REPEL_RADIUS);
        const cy = Math.floor(y / REPEL_RADIUS);
        if (!affectedCells.has(cx + ',' + cy)) {
            return null;
        }

        const queryPoint = Vec2.from([x, y]);
        const nearbyHits = spatialGrid.queryRadius(queryPoint, REPEL_RADIUS);

        if (nearbyHits.length === 0) {
            return null;
        }

        let bestDistSq = Infinity;
        let bestX = 0;
        let bestY = 0;
        let foundReal = false;

        const seenBoxes = new Set();

        for (let i = 0; i < nearbyHits.length; i++) {
            const b = nearbyHits[i].box;
            if (seenBoxes.has(b)) continue;
            seenBoxes.add(b);

            const br = b.r;
            const cx = Math.min(Math.max(x, b.left + br), b.right - br);
            const cy = Math.min(Math.max(y, b.top + br), b.bottom - br);
            const bdx = x - cx;
            const bdy = y - cy;
            const bd = Math.sqrt(bdx * bdx + bdy * bdy);

            if (bd - br > REPEL_RADIUS) continue;

            let nx = 0, ny = 0;
            if (bd > 1e-6) {
                const scale = br / bd;
                nx = cx + bdx * scale;
                ny = cy + bdy * scale;
            } else {
                const dLeft = x - b.left, dRight = b.right - x;
                const dTop = y - b.top, dBottom = b.bottom - y;
                const m = Math.min(dLeft, dRight, dTop, dBottom);
                if (m === dLeft) { nx = b.left; ny = y; }
                else if (m === dRight) { nx = b.right; ny = y; }
                else if (m === dTop) { nx = x; ny = b.top; }
                else { nx = x; ny = b.bottom; }
            }

            const dx = x - nx, dy = y - ny;
            const dSq = dx * dx + dy * dy;
            if (dSq < bestDistSq) {
                bestDistSq = dSq;
                bestX = nx;
                bestY = ny;
                foundReal = true;
            }
        }

        return foundReal ? [bestX, bestY] : null;
    }

    function computeAffectedCells() {
        affectedCells = new Set();
        if (boxes.length === 0) return;
        const cell = REPEL_RADIUS;
        for (const b of boxes) {
            const minCx = Math.floor((b.left - REPEL_RADIUS) / cell);
            const maxCx = Math.floor((b.right + REPEL_RADIUS) / cell);
            const minCy = Math.floor((b.top - REPEL_RADIUS) / cell);
            const maxCy = Math.floor((b.bottom + REPEL_RADIUS) / cell);
            for (let cx = minCx; cx <= maxCx; cx++) {
                for (let cy = minCy; cy <= maxCy; cy++) {
                    affectedCells.add(cx + ',' + cy);
                }
            }
        }
    }

    function initSpatialGrid() {
        spatialGrid.clear();
        optimizedBoxes = [];
        let globalPointCounter = 0;
        const stepSize = REPEL_RADIUS * 0.8;

        for (let i = 0; i < boxes.length; i++) {
            const b = boxes[i];

            const w = b.right - b.left;
            const h = b.bottom - b.top;

            const cachedR = Math.min(BOX_CORNER_RADIUS, w * 0.5, h * 0.5);

            const optBox = {
                left: b.left,
                right: b.right,
                top: b.top,
                bottom: b.bottom,
                r: cachedR
            };
            optimizedBoxes.push(optBox);

            const xSteps = Math.ceil(w / stepSize);
            const ySteps = Math.ceil(h / stepSize);

            const addSamplePoint = (x, y) => {
                spatialGrid.insert({
                    id: `box_${i}_pt_${globalPointCounter++}`,
                    box: optBox,
                    position: Vec2.from([x, y])
                });
            };

            for (let s = 0; s <= xSteps; s++) {
                const t = s / xSteps;
                const x = b.left + t * w;
                addSamplePoint(x, b.top);
                addSamplePoint(x, b.bottom);
            }

            for (let s = 1; s < ySteps; s++) {
                const t = s / ySteps;
                const y = b.top + t * h;
                addSamplePoint(b.left, y);
                addSamplePoint(b.right, y);
            }
        }
    }

    measure();

    spatialGrid = new GU.core.utils.SpatialHash({
        dimensions: 2,
        cellSize: REPEL_RADIUS,
        positionOf: (item) => item.position,
        distance: (a, b) => Math.sqrt((a.get(0) - b.get(0)) ** 2 + (a.get(1) - b.get(1)) ** 2),
        idOf: (item) => item.id
    });

    initSpatialGrid();
    canvas.style.opacity = '1'; // canvas is transparent until strokes draw, so no fade needed
    strokeOccupancy = new Map(); 
    currentGeneration++;
    runSweep(buildStrokes(), currentGeneration);

    let regenerating = false;
    regenerateBtn.addEventListener('click', () => {
        if (regenerating) return;
        regenerating = true;
        regenerateBtn.disabled = true;

        currentGeneration++;
        const myGeneration = currentGeneration;

        ctx.clearRect(0, 0, width, height);
        strokeOccupancy = new Map(); 

        const newSeed = Date.now() & 0xffffffff;
        rng.setSeed(newSeed);
        colorRng.setSeed(newSeed ^ 0x9e3779b9);
        noise.seed(newSeed);

        runSweep(buildStrokes(), myGeneration, () => {
            regenerating = false;
            regenerateBtn.disabled = false;
        });
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            currentGeneration++; // invalidate any in-flight sweep

            measure();

            spatialGrid = new GU.core.utils.SpatialHash({
                dimensions: 2,
                cellSize: REPEL_RADIUS,
                positionOf: (item) => item.position,
                distance: (a, b) => Math.sqrt((a.get(0) - b.get(0)) ** 2 + (a.get(1) - b.get(1)) ** 2),
                idOf: (item) => item.id
            });

            initSpatialGrid();
            ctx.clearRect(0, 0, width, height);
            strokeOccupancy = new Map();
            drawAllInstant(buildStrokes()); // no animated reveal on resize
        }, 120);
    });

});
</script>
<script id="">

</script>