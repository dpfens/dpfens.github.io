---
layout: post
title: "Streamline Hatching: A Programmer's Guide to Computational Drawing"
description: Sharing an attempt at computational hatching. Using structure tensors, edge tangent flow, and streamline integration to transform photographs into hand-drawn-looking illustrations.
keywords: computational drawing, hatching, cross-hatching, structure tensor, edge tangent flow, streamline integration, non-photorealistic rendering, NPR, image stylization, generative art, canvas, svg, computer-vision
tags: data math webgpu drawing svg

introduction: Streamline hatching is a technique for transforming images into something that looks hand-sketched using structural tensors and edge-tangent flows
---

I've always wanted to be able to draw. I like the idea of taking an image in my mind and making it so everyone else can see what I see. And I like the creative aspect of it.  Being able to draw whatever I want, however I want.  But I can't draw. Not yet, at least.  I'm working on it though.  I try to doodle while I watch TV to build my confidence.  I try to sketch thing I'm bad at, like clothes, faces, people to get better at proportions.  But I struggle particularly with different styles of drawing.

This is a guide to one particular technique called *streamline hatching* where *hatching* is a pen & paper approach for shading an image where strokes following the form of objects, density varies with tone, crosshatching building up in shadows, etc. More importantly, you'll understand *why* each piece of the pipeline exists and what happens when you change it.

{% include components/heading.html heading='What We\'re Building Toward' level=2 %}

Hatching is a drawing technique where artists use parallel lines to create tone and texture. The direction of the strokes typically follows the form of what's being drawn, like curving around a sphere, running along a cylinder, radiating from a corner etc. The spacing between strokes controls darkness, so closer strokes appear darker which means a darker shade like a shadow, and further apart strokes for highlights.

Cross-hatching adds a second layer of strokes at an angle to the first, building up darker tones in shadow regions.

When hatching is done well, hatching reveals what shape something is as well as how dark it is.

My goal was to replicate this. Given an input image, I wanted to:

1. Understand the directional structure of the image.  where are the forms, and which way do they "flow"?
2. Generate strokes that follow this structure
3. Control density and placement so that dark areas get more strokes than light areas
4. Optionally add cross-hatching in the darkest regions

The output should look like something a human might have drawn.

{% include components/heading.html heading='The Pipeline at a Glance' level=2 %}

Here's the full pipeline:

1. Input Image
2. Grayscale Conversion
3. Structure Tensor Computation (at multiple scales)
4. Orientation & Coherence Fields
5. Edge Tangent Flow (ETF) Refinement
6. Direction Propagation
7. Stroke Generation
8. Rendering

Here's the working implementation. Try it with the preset shapes or upload your own image.  Experiment with the parameters and watch how the output changes. The rest of this post explains what's happening under the hood.

<p class="codepen" data-height="900" data-default-tab="result" data-slug-hash="emzmzdd" data-pen-title="Hatching - WebGPU" data-user="dfens" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/dfens/pen/emzmzdd">
  Hatching - WebGPU</a> by Douglas Fenstermacher (<a href="https://codepen.io/dfens">@dfens</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

{% include components/heading.html heading='The Parameter Space' level=3 %}

The full system has many parameters.  Here they are, grouped by the aspect of the outcome they effect:

**Analysis parameters** (affect how structure is perceived):
* `sigma` array: Scales for multi-scale analysis
* `scaleCombination`: How to combine scales ('eigenvalue' or 'gradient')
* `fineScaleBias`: Preference for fine vs. coarse detail
* `minCoherenceThreshold`: Below this, orientation is unreliable

**Flow field parameters** (affect smoothness and propagation):
* `etfIterations`: How many refinement passes
* `etfKernelSize`: Size of the refinement neighborhood
* `propagationIterations`: How far direction spreads into flat regions

**Stroke parameters** (affect individual strokes):
* `strokeCount`: How many strokes to attempt
* `minLength`, `maxLength`: Stroke length range
* `strokeWidth`, `widthVariation`: Appearance
* `strokeJitter`: Hand-drawn wobble

**Placement parameters** (affect overall coverage):
* `toneInfluence`: Weight darkness vs. uniform coverage
* `minSpacing`: Minimum distance between stroke seeds
* `seedRandomness`: Jitter in seed grid

**Tone parameters** (affect light/dark handling):
* `backgroundBrightnessThreshold`: What counts as "background"
* `lowGradientThreshold`: What counts as "no structure"
* `crossHatch`: Enable perpendicular strokes
* `crossHatchThreshold`: Darkness level for cross-hatching

{% include components/heading.html heading='Presets as Starting Points' level=3 %}

The implementation includes several presets that configure these parameters for different effects:

**Sketch**: Loose, gestural strokes
* Fewer, longer strokes
* Higher width variation
* Lower opacity

**Engraving**: Dense, controlled lines
* Many short strokes
* Low width variation
* High tone influence
* Cross-hatching enabled

**Crosshatch**: Emphasis on tonal building
* Medium density
* Strong cross-hatching in shadows

**Simple Shapes**: For geometric forms
* Single scale (coarse)
* High propagation to fill flat regions

{% include components/heading.html heading='Computational Considerations' level=3 %}

The implementation supports both CPU and WebGPU backends. The core algorithms are the same; only the tensor operations differ.

For CPU:
* Structure tensor computation: `O(width × height × scales × kernel_size^2)`
* ETF refinement: `O(width × height × iterations × kernel_size^2)`
* Stroke generation: `O(stroke_count × max_length)`

For interactive use on typical images (500×500), CPU processing takes 1-3 seconds on a modern browser. WebGPU reduces this substantially for the tensor operations but has overhead for the stroke generation phase which remains CPU-bound.

{% include components/heading.html heading='Further Reading' level=2 %}

For you want to look into the underlying techniques:

* **Structure Tensor**: Förstner, W., & Gülch, E. (1987). "A fast operator for detection and precise location of distinct points, corners and centres of circular features." Search for "structure tensor image processing" for accessible tutorials.
* **Edge Tangent Flow**: Kang, H., Lee, S., & Chui, C. K. (2007). "Coherent Line Drawing." This paper introduced the ETF refinement technique.
* **Streamline Visualization**: Search "streamline integration visualization" for the fluid dynamics perspective on field-following curves.
* **Non-Photorealistic Rendering**: The field of NPR has extensive literature on computational illustration techniques. Gooch & Gooch's book "Non-Photorealistic Rendering" is a comprehensive introduction.

*The complete implementation, including an interactive demo, is available on [CodePen](https://codepen.io/dfens/full/emzmzdd). Try it with your own images and experiment with the parameters.  the best way to understand the system is to see how each setting affects the output.*