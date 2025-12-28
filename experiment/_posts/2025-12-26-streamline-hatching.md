---
layout: post
title: "Streamline Hatching: A Programmer's Guide to Computational Drawing"
description: A deep dive into computational hatching. Using structure tensors, edge tangent flow, and streamline integration to transform photographs into hand-drawn-looking illustrations.
keywords: computational drawing, hatching, cross-hatching, structure tensor, edge tangent flow, streamline integration, non-photorealistic rendering, NPR, image stylization, generative art, canvas, svg, computer-vision
tags: data math webgpu drawing svg

introduction: A guide to streamline hatching, a technique for transforming images into something that looks hand-sketched.
---

I've always wanted to be able to draw. I like the idea of taking an image in my mind and making it so everyone else can see what I see. And I like the creative aspect of it.  Being able to draw whatever I want, however I want.  But I can't draw. Not yet, at least.  I'm working on it though.  I try to doodle while I watch TV to build my confidence.  I try to sketch thing I'm bad at, like clothes, faces, people to get better at proportions.  But I struggle particularly with different styles of drawing.

This is a guide to one particular technique for computational drawing: *streamline hatching*, an approach to the sketching technique for shading. By the end, you'll understand how to take a photograph or rendered image and transform it into something that looks like it was sketched by hand.  With strokes following the form of objects, density varying with tone, crosshatching building up in shadows, etc. More importantly, you'll understand *why* each piece of the pipeline exists and what happens when you change it.

## What We're Building Toward

Before diving into the technical details, let's establish what we're actually trying to achieve.

Hatching is a drawing technique where artists use parallel lines to create tone and texture. The direction of the strokes typically follows the form of what's being drawn: curving around a sphere, running along a cylinder, radiating from a corner. The spacing between strokes controls darkness: closer together for shadows, further apart for highlights.

Cross-hatching adds a second layer of strokes at an angle to the first, building up darker tones in shadow regions.

When done well, hatching reveals *what shape* something is as well as *how dark* it is. The strokes become a kind of visual grammar that our eyes parse automatically.

Our computational goal is to replicate this. Given an input image, we want to:

1. **Understand the directional structure** of the image.  where are the forms, and which way do they "flow"?
2. **Generate strokes** that follow this structure
3. **Control density and placement** so that dark areas get more strokes than light areas
4. **Optionally add cross-hatching** in the darkest regions

The output should look like something a human might have drawn, not like a mechanical filter was applied.

## The Pipeline at a Glance

Here's the full pipeline we'll be building:

1. Input Image
2. Grayscale Conversion
3. Structure Tensor Computation (at multiple scales)
4. Orientation & Coherence Fields
5. Edge Tangent Flow (ETF) Refinement
6. Direction Propagation
7. Stroke Generation
8. Rendering

Each stage feeds into the next. We'll work through them one by one, but keep this overall flow in mind, as it explains why certain decisions are made at each step.

Here's the working implementation. Try it with the preset shapes or upload your own image.  Experiment with the parameters and watch how the output changes. The rest of this post explains what's happening under the hood.

<p class="codepen" data-height="900" data-default-tab="result" data-slug-hash="emzmzdd" data-pen-title="Hatching - WebGPU" data-user="dfens" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/dfens/pen/emzmzdd">
  Hatching - WebGPU</a> by Douglas Fenstermacher (<a href="https://codepen.io/dfens">@dfens</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

---

## Part 1: Reading the Image

### What Information Do We Actually Need?

Think about what a human artist pays attention to when deciding where and how to place hatching strokes:

- **Edges and contours**: Where do forms begin and end?
- **Surface direction**: Which way does the surface "run" at each point?
- **Confidence**: How certain are we about the direction? (A flat, textureless wall gives us nothing to work with.)
- **Tone**: How dark should this region be?

Tone is easy. We look at the brightness of each pixel. The first three are harder. They require us to analyze the *local structure* of the image, not just individual pixel values.

This is where the **structure tensor** comes in.

### The Structure Tensor: Orientation from Gradients

The structure tensor is a mathematical tool from computer vision that answers a specific question: "What is the dominant orientation at this point in the image?"

At any point in an image, we can compute the *gradient*. On an edge, the gradient points perpendicular to the edge. In a textured region, gradients point in various directions depending on the local pattern.

The gradient at a single pixel is noisy and unreliable. But if we look at a *neighborhood* of gradients and ask "what's the overall trend?", we get something much more stable. That's what the structure tensor captures.

Mathematically, we:

1. Compute horizontal and vertical gradients (Gx and Gy) at each pixel using Sobel operators
2. Form the tensor components: Jxx = Gx·Gx, Jxy = Gx·Gy, Jyy = Gy·Gy
3. Smooth these components with a Gaussian filter (this is the "neighborhood averaging")
4. Analyze the resulting 2×2 matrix at each pixel

The analysis of that matrix (via eigenvalue decomposition) gives us:

- **Dominant orientation**: The direction perpendicular to the strongest gradient trend
- **Coherence**: How "directional" the neighborhood is (high coherence = strong consistent orientation, low coherence = isotropic or noisy)

If this sounds abstract, think of it this way: we're asking "if I were to draw a stroke through this pixel, which direction would feel most *natural* given the local image structure?"

### Why Multiple Scales?

A single scale of analysis isn't enough. Consider an image with both fine texture (like fabric weave) and large-scale form (like the curve of a shoulder). A small analysis window captures the texture direction. A large window captures the form direction. Both might be valid depending on what kind of hatching you want.

The implementation uses an array of sigma values (e.g., `[1.0, 2.0, 4.0, 8.0]`) and computes the structure tensor at each scale. It then selects the "best" scale at each pixel based on:

- **Coherence**: Higher is better (stronger directional signal)
- **Gradient magnitude**: We weight toward scales where there's actually something to measure
- **Fine scale bias**: A tunable preference for finer detail when coherence is similar

```javascript
// Per-pixel scale selection
let bestScore = -1;
for (let scaleIdx = 0; scaleIdx < scales.length; scaleIdx++) {
  let score = coherence[scaleIdx] * (0.3 + 0.7 * normalizedMagnitude[scaleIdx]);
  
  // Bias toward finer scales
  const scalePosition = scaleIdx / (scales.length - 1);
  score *= (1 + fineScaleBias * (1 - scalePosition));
  
  if (score > bestScore) {
    bestScore = score;
    bestScaleIdx = scaleIdx;
  }
}
```

The result is an orientation field that adapts to local image content; following fine details where they exist, falling back to coarse structure where they don't.

### Handling the Background

One important practical concern: what about regions with no structure at all? A pure white background has no gradients, so the structure tensor gives us nothing meaningful.

The implementation detects background regions using two criteria:
- High brightness (above a threshold, default 0.85)
- Low gradient magnitude

Pixels matching both criteria are flagged. We can either avoid placing strokes there entirely, or let strokes pass through with reduced confidence.

---

## Part 2: Building the Flow Field

### From Structure Tensor to Edge Tangent Flow

The structure tensor gives us orientation and coherence at each pixel. But these values are noisy, and neighboring pixels might have slightly inconsistent orientations. If we traced strokes directly through this field, they'd be jittery and unnatural.

The **Edge Tangent Flow (ETF)** refinement step smooths the orientation field while preserving (and even enhancing) edges. It's based on a technique from line drawing research (Kang et al., "Coherent Line Drawing").

The algorithm iteratively refines the field:

```javascript
for (let iter = 0; iter < etfIterations; iter++) {
  for each pixel (x, y) {
    // Look at neighbors in a kernel
    for each neighbor in kernel {
      // Weight by:
      // 1. Spatial distance (closer = more influence)
      // 2. Magnitude similarity (similar gradient strength = more influence)
      // 3. Direction alignment (similar direction = more influence)
      
      // Flip neighbor direction if it points "against" current direction
      // (handles the 180° ambiguity in orientations)
      
      // Accumulate weighted average
    }
    // Normalize result
  }
}
```

The key insights:
- **Spatial weighting** creates smooth transitions
- **Magnitude weighting** makes high-gradient regions (edges) more influential
- **Direction alignment** prevents averaging across incompatible orientations
- **Direction flipping** handles the fact that orientations are bidirectional (a stroke running left-to-right is the same as one running right-to-left)

After a few iterations (typically 3-5), the field becomes much smoother while still respecting edges and contours.

### Propagating Direction into Flat Regions

Even with ETF refinement, we still have a problem: flat, textureless regions have undefined or unreliable orientations. The structure tensor gave us "no signal," and no amount of smoothing creates signal from nothing.

Strokes should continue across flat regions in a visually sensible way. A human artist would extend the direction from nearby structured regions.

The implementation does this with an iterative propagation algorithm:

1. Mark pixels with reliable orientation (high gradient magnitude and coherence)
2. For each unreliable pixel adjacent to a reliable one, interpolate direction from reliable neighbors
3. Repeat until the field is complete (or we hit an iteration limit)

The propagation is weighted by gradient magnitude and coherence of the source pixels.  So direction flows from confident regions into uncertain ones, not the other way around.

```javascript
// Propagation step
for each unreliable pixel {
  let sumX = 0, sumY = 0, weightSum = 0;
  
  for each neighbor {
    if (neighbor is reliable) {
      const w = (0.3 + magnitude[neighbor]) * (0.5 + coherence[neighbor]);
      sumX += cos(angle[neighbor]) * w;
      sumY += sin(angle[neighbor]) * w;
      weightSum += w;
    }
  }
  
  if (weightSum > 0) {
    // Normalize and mark as newly reliable
    newAngle = atan2(sumY, sumX);
  }
}
```

---

## Part 3: Drawing the Strokes

### Streamline Integration

We now have a smooth, complete flow field. The next step is tracing curves through it, creating our hatching strokes.

The technique is called *streamline integration*, borrowed from fluid dynamics visualization. Starting from a seed point, we follow the field direction in small steps, building up a path.

A naive implementation would use Euler integration: "move in the current direction by step size." But this accumulates error quickly and produces wobbly results. Instead, we use **4th-order Runge-Kutta (RK4)** integration:

```javascript
function integrateStreamline(etf, startX, startY, direction, maxSteps, stepSize) {
  const points = [{x: startX, y: startY}];
  let x = startX, y = startY;
  
  for (let i = 0; i < maxSteps; i++) {
    // RK4: sample field at four points to estimate next position
    const k1 = getFieldDirection(etf, x, y);
    const k2 = getFieldDirection(etf, x + k1.x * stepSize * 0.5, y + k1.y * stepSize * 0.5);
    const k3 = getFieldDirection(etf, x + k2.x * stepSize * 0.5, y + k2.y * stepSize * 0.5);
    const k4 = getFieldDirection(etf, x + k3.x * stepSize, y + k3.y * stepSize);
    
    // Weighted average
    const dx = (k1.x + 2*k2.x + 2*k3.x + k4.x) / 6 * stepSize * direction;
    const dy = (k1.y + 2*k2.y + 2*k3.y + k4.y) / 6 * stepSize * direction;
    
    x += dx;
    y += dy;
    points.push({x, y});
    
    // Stop if we leave the image bounds or hit background
    if (outOfBounds(x, y) || isBackground(x, y)) break;
  }
  
  return points;
}
```

Each stroke is traced in both directions from its seed point (forward and backward), then concatenated into a single path.

### Seed Placement: The Art of "Not Too Many, Not Too Few"

Where we start our streamlines matters enormously. Too few strokes and the image is sparse. Too many and it becomes a dense mess. Uniform random placement produces clumpy, uneven coverage.

The implementation uses a coverage-aware greedy approach:

1. **Generate candidates** on a regular grid (with some jitter)
2. **Score each candidate** by:
   - Darkness at that pixel (darker = higher priority)
   - Coherence (higher = more suitable for stroking)
   - Tone influence parameter (how much to weight darkness vs. uniform coverage)
3. **Sort candidates** by score
4. **Greedily accept candidates** that aren't too close to existing strokes

The "too close" check uses a coverage map that accumulates stroke density. Each time a stroke is placed, the coverage map is updated:

```javascript
function addCoverage(points, strokeWidth) {
  for (const p of points) {
    const radius = strokeWidth * 2;
    for each pixel within radius of p {
      const falloff = 1 - (distance / radius);
      coverageMap[pixel] += falloff * 0.5;
    }
  }
}
```

When evaluating a candidate, we check if the coverage at that location exceeds a threshold. The threshold varies with brightness; dark areas tolerate higher coverage (more overlapping strokes).

### Stroke Length and Parameters

Several parameters control the character of individual strokes:

- **minLength / maxLength**: Range of stroke lengths in pixels
- **stepSize**: Integration step (smaller = smoother but slower)
- **strokeWidth**: Rendering width
- **widthVariation**: How much width varies along the stroke (tapered ends)
- **opacity**: Base opacity
- **strokeJitter**: Random perpendicular displacement for a hand-drawn feel

The actual length of each stroke is determined by:
1. How far the streamline can be traced before hitting boundaries or background
2. A target length based on local darkness and coherence

Darker, high-coherence regions get longer strokes. Lighter, uncertain regions get shorter ones.

---

## Part 4: Cross-Hatching

Cross-hatching adds strokes perpendicular to the primary direction in dark regions. This builds up tone and adds visual interest.

The implementation:

1. Creates a rotated copy of the ETF (perpendicular directions)
2. Identifies candidate pixels in dark regions (darkness > crossHatchThreshold)
3. Runs a separate placement pass using the rotated field
4. Uses a separate coverage map to avoid cross-stroke clumping

```javascript
// Create perpendicular field
const crossEtf = {
  tx: new Float32Array(width * height),
  ty: new Float32Array(width * height),
  //...
};

for (let i = 0; i < width * height; i++) {
  crossEtf.tx[i] = -etf.ty[i];  // Rotate 90°
  crossEtf.ty[i] = etf.tx[i];
}
```

Cross-hatch strokes are typically shorter and fewer than primary strokes (about 40% as many in the default configuration).

---

## Part 5: Rendering and Output

The final step is rendering strokes to a canvas or exporting to SVG.

### Canvas Rendering

For interactive display, strokes are drawn to an HTML canvas:

```javascript
for (const stroke of strokes) {
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  
  for (let i = 1; i < stroke.points.length; i++) {
    // Taper width toward ends
    const t = i / (stroke.points.length - 1);
    const taper = 1 - Math.abs(t - 0.5) * 2;
    ctx.lineWidth = baseWidth - maxVariation + maxVariation * taper;
    
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  
  ctx.stroke();
}
```

The stroke opacity varies with the darkness at the seed point.  Strokes in shadow regions are more opaque than those in highlights.

### SVG Export

For resolution-independent output, strokes can be exported as SVG paths:

```javascript
function strokesToSVG(strokes, width, height, style) {
  const paths = strokes.map(stroke => {
    const d = `M ${stroke.points[0].x} ${stroke.points[0].y} ` +
              stroke.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    
    return `<path d="${d}" stroke="${color}" stroke-width="${width}" 
            stroke-opacity="${opacity}" stroke-linecap="round" fill="none"/>`;
  });
  
  return `<svg xmlns="..." viewBox="0 0 ${width} ${height}">${paths.join('')}</svg>`;
}
```

---

## Part 6: Putting It All Together

### The Parameter Space

The full system has many parameters. Here's how they cluster:

**Analysis parameters** (affect how structure is perceived):
- `sigma` array: Scales for multi-scale analysis
- `scaleCombination`: How to combine scales ('eigenvalue' or 'gradient')
- `fineScaleBias`: Preference for fine vs. coarse detail
- `minCoherenceThreshold`: Below this, orientation is unreliable

**Flow field parameters** (affect smoothness and propagation):
- `etfIterations`: How many refinement passes
- `etfKernelSize`: Size of the refinement neighborhood
- `propagationIterations`: How far direction spreads into flat regions

**Stroke parameters** (affect individual strokes):
- `strokeCount`: How many strokes to attempt
- `minLength`, `maxLength`: Stroke length range
- `strokeWidth`, `widthVariation`: Appearance
- `strokeJitter`: Hand-drawn wobble

**Placement parameters** (affect overall coverage):
- `toneInfluence`: Weight darkness vs. uniform coverage
- `minSpacing`: Minimum distance between stroke seeds
- `seedRandomness`: Jitter in seed grid

**Tone parameters** (affect light/dark handling):
- `backgroundBrightnessThreshold`: What counts as "background"
- `lowGradientThreshold`: What counts as "no structure"
- `crossHatch`: Enable perpendicular strokes
- `crossHatchThreshold`: Darkness level for cross-hatching

### Presets as Starting Points

The implementation includes several presets that configure these parameters for different effects:

**Sketch**: Loose, gestural strokes
- Fewer, longer strokes
- Higher width variation
- Lower opacity

**Engraving**: Dense, controlled lines
- Many short strokes
- Low width variation
- High tone influence
- Cross-hatching enabled

**Crosshatch**: Emphasis on tonal building
- Medium density
- Strong cross-hatching in shadows

**Simple Shapes**: For geometric forms
- Single scale (coarse)
- High propagation to fill flat regions

### Computational Considerations

The implementation supports both CPU and WebGPU backends. The core algorithms are the same; only the tensor operations differ.

For CPU:
- Structure tensor computation: O(width × height × scales × kernel_size²)
- ETF refinement: O(width × height × iterations × kernel_size²)
- Stroke generation: O(stroke_count × max_length)

For interactive use on typical images (500×500), CPU processing takes 1-3 seconds on a modern browser. WebGPU reduces this substantially for the tensor operations but has overhead for the stroke generation phase which remains serial.

---

## Where to Go From Here

This implementation covers the fundamentals, but there's plenty of room for extension:

**Color hatching**: Instead of grayscale, use oriented strokes in different colors to suggest local hue.

**Variable stroke styles**: Different brush textures for different regions (stippling in soft areas, bold strokes on edges).

**Temporal coherence**: For video, ensure stroke placement is stable between frames.

**User guidance**: Allow painting hints to override the automatic orientation field.

**Alternative placement strategies**: Poisson disk sampling, space-filling curves, or learned distributions.

The technique generalizes well. Using image structure to guide stroke direction applies whether you're generating pen-and-ink illustrations, painterly renderings, or abstract visualizations.

---

## Further Reading

For those who want to dive deeper into the underlying techniques:

- **Structure Tensor**: Förstner, W., & Gülch, E. (1987). "A fast operator for detection and precise location of distinct points, corners and centres of circular features." Search for "structure tensor image processing" for accessible tutorials.

- **Edge Tangent Flow**: Kang, H., Lee, S., & Chui, C. K. (2007). "Coherent Line Drawing." This paper introduced the ETF refinement technique.

- **Streamline Visualization**: Search "streamline integration visualization" for the fluid dynamics perspective on field-following curves.

- **Non-Photorealistic Rendering**: The field of NPR has extensive literature on computational illustration techniques. Gooch & Gooch's book "Non-Photorealistic Rendering" is a comprehensive introduction.

---

*The complete implementation, including an interactive demo, is available on [CodePen](https://codepen.io/dfens/full/emzmzdd). Try it with your own images and experiment with the parameters.  the best way to understand the system is to see how each setting affects the output.*