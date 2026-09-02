---
layout: post
title: "DoG Studio: Computing and Compositing Aesthetically Pleasing Lines"
description: A deeper dive into modern approaches for generating aesthetically pleasing lines based on difference-of-Gaussians (DoG) edge detections.
keywords: computational drawing, structure tensor, non-photorealistic rendering, image stylization, generative art, computer-vision, line-art, screentone
tags: data math webgpu webgl drawing
introduction: A free, browser-based tool for turning photos into line art and screentone
---


I've always wanted to learn to draw. Like a lot of people, I had scenes and ideas in my head that I couldn't get out onto paper. My grandmother painted, and I wasn't bad at drawing back in elementary school, but I stopped pursuing it in middle and high school for sports. That worked out fine, but it meant art sat completely untouched for almost twenty years.

I finally came back to it in my 30s, after realizing my growing ability to have ideas was outpacing my ability to convey them concisely. Shortly after I started practicing, I realized that your style of drawing matters as much as what you draw.  I started reading about technique, but also about the different visual movements: expressionism, pointillism, cubism, surrealism, fauvism, etc. I wanted to understand how style mattered to the beholder so I could decide how to represent something in multiple styles.  This lead to be atmospheric design, but that's a story for another day.

That reading eventually led me to other developers' graphics experiments, and from there to trying my own hand at graphics coding. Two early results of that were [streamline hatching](https://dougfenstermacher.com/experiment/streamline-hatching) and an earlier [difference-of-Gaussians experiment](https://dougfenstermacher.com/experiment/difference-of-gaussians). Along the way I picked up how to use WebGPU for number-crunching in the browser, which, as an aside, has been extremely useful.

## From experiment to tool

The original DoG experiment was just an experiment. It worked, but it wasn't stable, and every time I wanted to try a new combination of techniques (say, layering an FDoG pass over an ADoG pass with a specific blend mode) I had to go change code.  And when I tried to do it with too big of an image using WebGPU, the browser crashed.

[DoG Studio](https://dougfenstermacher.com/dogpack/) is that experiment rebuilt properly: more stable, and with layers and blend modes exposed as actual controls, so I can try combinations of visual approaches without touching code each time. It implements the full family of Difference-of-Gaussians techniques from the research (XDoG, FDoG, ADoG, HDoG), all running in-browser on the GPU.

## Realizing it's useful for more than drawing practice

I built this for myself, because it helped me feel creative when learning to draw felt like it was taking too much time for little progress that I couldn't apply elsewhere.  It gives me a strong base to turn into an illustration more vibrant than life (like Fauvism).  But once I built it I started noticing it was useful for things I hadn't planned on using it for:

- Laser engraving and stencil work: FDoG/HDoG output is clean binary black-and-white, which is exactly what a laser engraver or vinyl cutter needs. This one genuinely caught me off guard the first time it came up, as I built the tool to help me draw, not cut wood.
- Stippling and pointillism: pointillism was one of the movements I'd read about early on, so seeing ADoG's dot-density behavior essentially reproduce it as a real output mode was a nice full-circle moment.
- Manga/comic screentone, coloring pages, tattoo stencils: all fairly natural extensions once you have clean, tunable line/tone separation, especially since [Gaussian Image Binarization](https://www.worldscientific.com/doi/abs/10.1142/S0219467821500479) (the ADoG/HDoG paper) explicitly says that it's good for manga.
- ControlNet / `img2img` preprocessing for Stable Diffusion: probably the furthest thing from "learning to draw" this ended up being useful for. FDoG and ADoG output work as conditioning maps the same way Canny/HED/Lineart preprocessors do, but with edge-tangent-flow smoothing that keeps lines coherent instead of fragmented. The underlying GPU/browser work is the same regardless of what ends up consuming the output.

## Features

Here are some tidbits about it actually works under the hood for the curious.

### Library

Rather than baking the actual DoG variant implementations directly into the app, the DoG variants are implemented as a separate library, called [`dogpack`](https://github.com/dpfens/dogpack).  This allows me to keep the mathematical logic completely separate from the app's business logic.   

### Rendering Graph

DoG Studio has 4 variants of DoG implemented, each of which can be configured numerous ways, and can be blended/weighted with the outputs from other DoG configuration to produce a final sketchified image.  To ensure I (and other users) are able to create the compositional and blending logic they need, DoG Studio allows DoG configurations be nested recursively using `DoGLayer`:

```typescript
export interface DogLayer {
  /*
   * How the components will be blended together
   */
  blendMode: multiScale.BuiltinBlendMode;
  /*
   * The DoG component's whose output will be blended together
   */
  components: DogNode[];
}

export type DogConfigNode = XDogConfig | FDogConfig | ADogConfig | HDogConfig;
export type DogNode = DogLayer | DogConfigNode;
```

The implementation uses a depth-first recursion approach to act as a topological sort of the configuration and ensure the configurations and blend logics are only executed once their dependencies are fully met.  This also allows us to execute non-dependencies in parallel to reduce the latency incurred by the calculations involved on arbitrarily large images.  This allows users to layer DoG variants and blend modes to create the final output they are looking for.  For example, a user with a complex image may decide to apply DoG variants with different `sigma` values to capture high-level structure, intermediate structure, and fine details.


### WebGPU / WebGL / CPU Fallbacks

People do not expect to have to wait to process an image.  In the case of a data-intensive local-only app like DoG Studio, long compute would result in the user draining their battery while limiting their ability to practically experiment with different configurations, in addition to locking up the UI.

To make sure we can process our image as quickly as possible, I implemented the preprocessing and DoG variants in WebGPU, WebGL2, and native Javascript.  The application progressively enhances the processing method, prefering WebGPU, falling back to WeBGL, then falling back to CPU.  The vast majority of devices support WebGPU or WebGL, which result in over 10x improvements in processing speed.

Rather than building device-specific implementations for each DoG variant, I progressively enhance each component independently, so every piece stays reusable and can upgrade based on the device's GPU capabilities. If a device lacks support for a given technology, only that component falls back (instead of the whole pipeline) keeping every step running on the most efficient method available.

GPU capabilities of user devices vary as widely as the sizes of images which need to be processed.  To handle arbitrarily large images on arbitrarily small GPUs, I chose to implement a tiling approach with double buffers to iteratively process images which also reduces unnecessary latency due to transfer time between the CPU and the GPU.

Additionally, to avoid any lag to the UI, the entire pipeline is executed on a separate thread via a `WebWorker`.

### Preprocessing

DoG techniques are noise-sensitive by nature, as they are built on taking differences between blurred versions of an image, so anything grainy or high-frequency in the source photo gets amplified right along with the edges you actually want. A raw photo often needs to be conditioned first, or the output turns into a mess of stray lines.

Rather than a single fixed "denoise" step, DoG Studio exposes preprocessing as a set of composable, configurable filters that can be chained in whatever order and combination a given image calls for.

* Bilateral (edge-preserving smoothing): smooths out grain and texture while keeping edges sharp, so skin, sky, and fabric get cleaner without softening the outlines you want the DoG pass to pick up.
* Median (salt-and-pepper noise): knocks out isolated bright or dark pixels, the kind of speckling you get from high-ISO/low-light shots, without blurring anything around them.
* Kuwahara (painterly smoothing): flattens an image into smooth regions with clean boundaries between them, giving a brushed, painterly look rather than a blurred one. Good for pushing an image toward an illustrative or stylized feel before the DoG stage even runs.
* Gaussian blur: a standard uniform blur, useful for softening fine detail evenly across the whole image.
* Contrast stretching: pushes the darkest and lightest tones in the image further apart, so faint edges in flat or washed-out photos become strong enough for the DoG pass to detect.
* Quantization: reduces the image to a limited number of tone levels, which simplifies subtle gradients into flatter bands and tends to produce cleaner, more graphic-looking edges.

A busy outdoor photo might need two rounds of noise removal at different strengths before it even gets to the DoG stage; a clean studio shot might need almost none.

To save people from having to hand-tune that chain every time, DoG Studio also ships a handful of presets built on top of it:

* `light`: a single gentle smoothing pass. Best for images that are already clean, like studio photos or existing illustrations, where you mainly want to strip out sensor noise without touching real detail.
* `standard`: a moderate smoothing pass suited to most everyday photos: portraits, indoor shots, typical outdoor scenes.
* `heavy`: two passes of edge-preserving smoothing at different strengths rather than one aggressive pass, since that holds onto edges better than a single heavier filter would. Meant for busy, high-texture images like grass, foliage, or fabric, where a single strong pass would blur the real edges along with the noise.
* `artistic`: a painterly Kuwahara pass before a light smoothing pass, to get a stylized base before the DoG stage runs. Produces output with more of a hand-drawn or painted feel than a straight photo-to-line conversion.
* `nature`: two smoothing passes tuned for landscapes and outdoor scenes with lots of fine natural texture (leaves, grass, water), clearing out that texture without losing the larger shapes in the scene.

Each preset is a pre-chosen sequence of these filters tuned for a category of image, meant as a starting point you can pick and then adjust from.

### Pixel-specific parameters

Difference-of-Gaussian technique historically only work well on image which have a consistent luminance/brightness, whereas nost images do not have such consistent luminance.  To solve for this I implemented the DoG variants to accept pixel-specific values for 3 of it's core DoG parameters as well as scalar `number`s:

```typescript
/**
 * Has same structure as ImageData but used for 1 dimension instead of 3
 */
export interface ChannelImage {
  data: Float32Array;
  width: number;
  height: number;
}

export interface DoGConfig {
    ...
      /** 
     * Sharpening strength parameter
     * Controls the strength of edge emphasis
     * - p ~= 0: No edge enhancement, just blurred image
     * - p ~= 20: Strong edges suitable for thresholding (XDoG paper's typical value)
     * - p ~= 100+: Extreme edge emphasis for woodcut style
     */
    p: number | ChannelImage; 
    
    /** 
     * Threshold for white vs black transition
     * Values above this become white, values below follow the soft threshold
     * Should be in 0-1 range for normalized images
     */
    epsilon: number | ChannelImage;
    
    /** 
     * Sharpness of the soft threshold / tanh steepness
     * Controls the transition sharpness between black and white
     * - phi ~= 0.01: Very soft transitions (pencil shading, pastel)
     * - phi ~= 1-10: Moderate transitions
     * - phi >> 10: Hard black/white threshold (approaches step function)
     */
    phi: number | ChannelImage;
}
```

This allows users to select an optional toggle for the app to estimate pixel-specific values for each of pixel in the image, from the image itself.  For example, if an image has a dimmer stairwell behind a bright figure, the estimator will adjust the `epsilon` values for the stairwell pixels to use a lower `epsilon`, and higher for the bright figure to have all the features of each shown equally in the output image. 


## Try it

[Give it a try](https://dougfenstermacher.com/dogpack/) on a photo and see what comes out.

If you're curious about the math underneath or want to use it for something yourself, the DoG implementations themselves can be found in [`dogpack`](https://github.com/dpfens/dogpack). The app itself lives in the `gh-pages` branch, if you want to see how it's wired together.  Maybe you will have a use for it I haven't conceived of yet.

I still can't draw the scenes and ideas in my head half as well as I'd like by hand. This tool was never going to teach me that. But it was a nice detour, and I am glad I did it.

*See also: [streamline hatching](https://dougfenstermacher.com/experiment/streamline-hatching), [the original difference-of-Gaussians experiment](https://dougfenstermacher.com/experiment/difference-of-gaussians)*