(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.GenerativeUtilities = {}));
})(this, (function (exports) { 'use strict';

    /** sRGB gamma decode: companded → linear. */
    function srgbToLinear(c) {
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    /** Convert sRGB (0–1) to OKLab. */
    function rgbToOklab({ r, g, b }) {
        const lr = srgbToLinear(r);
        const lg = srgbToLinear(g);
        const lb = srgbToLinear(b);
        const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
        const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
        const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
        const l_ = Math.cbrt(l);
        const m_ = Math.cbrt(m);
        const s_ = Math.cbrt(s);
        return {
            L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
            a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
            b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
        };
    }
    /** Convert OKLab to OKLCh (cylindrical form). */
    function oklabToOklch({ L, a, b }) {
        const C = Math.hypot(a, b);
        let h = Math.atan2(b, a);
        if (h < 0)
            h += Math.PI * 2;
        return { L, C, h };
    }
    /** Direct sRGB → OKLCh convenience. */
    function rgbToOklch(rgb) {
        return oklabToOklch(rgbToOklab(rgb));
    }
    const POW_25_7 = 6103515625; // 25^7
    const DEG_TO_RAD = Math.PI / 180;
    const RAD_TO_DEG = 180 / Math.PI;
    function deltaE2000(labA, labB, options) {
        /*
        * CIE2000 equation for quantifying perceptual distance between colors.
        * For a very high-level explanation, see https://sensing.konicaminolta.us/us/blog/identifying-color-differences-using-l-a-b-or-l-c-h-coordinates/
        * or for a more mathematical approach: https://zschuessler.github.io/DeltaE/learn/
        * Implementation based on equations from http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CIE2000.html
        *
        * Thresholds
        * 0: No perceivable difference between the colors.
        * 0-1: Very slight difference, likely imperceptible to most observers.
        * 1-2: Slight difference, noticeable to trained observers or under careful examination.
        * 2-3.5: Distinct difference, noticeable to most observers.
        * 3.5-5: Significant difference, readily apparent to all observers.
        * Above 5: Very large difference, colors are clearly distinct.
        *
        * Weighting factors
        * kL (lightness weighting factor): Controls the influence of lightness differences on the overall Delta E 2000 value.
        * kC (chroma weighting factor): Controls the influence of chroma differences.
        * kH (hue weighting factor): Controls the influence of hue differences.
        *
        * Higher values of a given factor emphasize that aspect of the color.  Each ranges from 0 to 2, and default to 1.
        */
        const { L: l1, a: a1, b: b1 } = labA;
        const { L: l2, a: a2, b: b2 } = labB;
        /*
         * kL (lightness) weighting factor ( 0.0 <= kL <= 2.0)
         * Increasing kL amplifies the importance of lightness differences.
         * This can be useful for applications where subtle lightness variations are crucial, like in textile or paint industries.
         * Conversely, lowering kL downplays lightness changes, which might be beneficial for web design where screen brightness can affect perceived lightness.
         * */
        const kl = Math.min(Math.max(options?.kL ?? 1.0, 0.0), 2.0);
        /*
         * kC (chroma) weighting factor ( 0.0 <= kC <= 2.0)
         * Adjusting kC modifies the influence of chroma (color saturation) in the calculation.
         * Raising kC highlights chroma differences, making vibrant colors stand out more.
         * Lowering it reduces the impact of chroma variations, potentially minimizing the appearance of color shifts due to factors like lighting or viewing angle.
         * */
        const kc = Math.min(Math.max(options?.kC ?? 1.0, 0.0), 2.0);
        /*
         * kH (hue) weighting factor ( 0.0 <= kH <= 2.0)
         * Modifying kH alters the emphasis on hue (color tint) differences.
         * This is rarely used in practical applications due to the complexity of hue calculations and its potentially limited impact on perceived color changes in most contexts.
         * */
        const kh = Math.min(Math.max(options?.kH ?? 1.0, 0.0), 2.0);
        const avgL = (l1 + l2) * 0.5;
        const avgLm50 = avgL - 50;
        const avgLm50Sq = avgLm50 * avgLm50;
        const c1 = Math.sqrt(a1 * a1 + b1 * b1);
        const c2 = Math.sqrt(a2 * a2 + b2 * b2);
        const avgC = (c1 + c2) * 0.5;
        const avgC2 = avgC * avgC;
        const avgC4 = avgC2 * avgC2;
        const avgC7 = avgC4 * avgC2 * avgC;
        const g = (1 - Math.sqrt(avgC7 / (avgC7 + POW_25_7))) * 0.5;
        const onePlusG = 1 + g;
        const a1p = a1 * onePlusG;
        const a2p = a2 * onePlusG;
        const c1p = Math.sqrt(a1p * a1p + b1 * b1);
        const c2p = Math.sqrt(a2p * a2p + b2 * b2);
        const avgCp = (c1p + c2p) * 0.5;
        let h1p = Math.atan2(b1, a1p) * RAD_TO_DEG;
        if (h1p < 0)
            h1p += 360;
        let h2p = Math.atan2(b2, a2p) * RAD_TO_DEG;
        if (h2p < 0)
            h2p += 360;
        const avghp = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + 360) * 0.5 : (h1p + h2p) * 0.5;
        const avghpRad = avghp * DEG_TO_RAD;
        const t = 1
            - 0.17 * Math.cos(avghpRad - 30 * DEG_TO_RAD)
            + 0.24 * Math.cos(2 * avghpRad)
            + 0.32 * Math.cos(3 * avghpRad + 6 * DEG_TO_RAD)
            - 0.20 * Math.cos(4 * avghpRad - 63 * DEG_TO_RAD);
        let deltahp = h2p - h1p;
        if (Math.abs(deltahp) > 180) {
            deltahp += h2p <= h1p ? 360 : -360;
        }
        const deltalp = l2 - l1;
        const deltacp = c2p - c1p;
        deltahp = 2 * Math.sqrt(c1p * c2p) * Math.sin(deltahp * DEG_TO_RAD * 0.5);
        const sl = 1 + (0.015 * avgLm50Sq) / Math.sqrt(20 + avgLm50Sq);
        const sc = 1 + 0.045 * avgCp;
        const sh = 1 + 0.015 * avgCp * t;
        const avgCp2 = avgCp * avgCp;
        const avgCp4 = avgCp2 * avgCp2;
        const avgCp7 = avgCp4 * avgCp2 * avgCp;
        const deltaroArg = (avghp - 275) / 25;
        const deltaro = 30 * Math.exp(-(deltaroArg * deltaroArg));
        const rc = 2 * Math.sqrt(avgCp7 / (avgCp7 + POW_25_7));
        const rt = -rc * Math.sin(2 * deltaro * DEG_TO_RAD);
        const lTerm = deltalp / (kl * sl);
        const cTerm = deltacp / (kc * sc);
        const hTerm = deltahp / (kh * sh);
        const lSq = lTerm * lTerm;
        const cSq = cTerm * cTerm;
        const hSq = hTerm * hTerm;
        const rotation = rt * cTerm * hTerm;
        const sumSq = lSq + cSq + hSq;
        const deltaE = Math.sqrt(sumSq + rotation);
        // Build the per-dimension breakdown. Shares are normalized against the sum
        // of the three squared (orthogonal) terms; the rotation cross-term is
        // reported separately. Guard against division by zero for identical colors.
        let shareL = 0, shareC = 0, shareH = 0, rotationShare = 0;
        let dominant = null;
        if (sumSq > 0) {
            shareL = lSq / sumSq;
            shareC = cSq / sumSq;
            shareH = hSq / sumSq;
            rotationShare = rotation / sumSq;
            dominant = shareL >= shareC && shareL >= shareH ? 'L'
                : shareC >= shareH ? 'C'
                    : 'H';
        }
        return {
            deltaE,
            shares: { L: shareL, C: shareC, H: shareH },
            dominant,
            rotationShare,
        };
    }
    /**
     * Called the Just Noticeable difference threshold.
     * Represents the smallest color difference that a typical observer can perceive under specific viewing conditions.
     * For Delta E 2000, a JND value of around 1 is generally accepted. This means a Delta E 2000 difference of 1 or
     * less is often considered imperceptible to most people.
     */
    deltaE2000.JND = 1.0;
    deltaE2000.IMPERCEPTIBLE = 1.0; // alias, reads better in some contexts
    deltaE2000.PERCEPTIBLE = 2.0; // noticeable to most observers
    deltaE2000.DISTINCT = 3.5; // readily apparent
    deltaE2000.LARGE = 5.0; // clearly different colors
    deltaE2000.MIN = 0.0;
    deltaE2000.MAX = 100.0; // approximate; deltaE2000 has no strict upper bound but black↔white ≈ 100
    deltaE2000.K_MIN = 0.0;
    deltaE2000.K_MAX = 2.0;
    deltaE2000.K_DEFAULT = 1.0;
    function deltaE94Approximate(labA, labB) {
        /**
         * calculates the perceptual distance between colors in CIELAB
         */
        var deltaL = labA.L - labB.L;
        var deltaA = labA.a - labB.a;
        var deltaB = labA.b - labB.b;
        var c1 = Math.sqrt(labA.a * labA.a + labA.b * labA.b);
        var c2 = Math.sqrt(labB.a * labB.a + labB.b * labB.b);
        var deltaC = c1 - c2;
        var deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
        deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
        var sc = 1.0 + 0.045 * c1;
        var sh = 1.0 + 0.015 * c1;
        var deltaLKlsl = deltaL / (1.0);
        var deltaCkcsc = deltaC / (sc);
        var deltaHkhsh = deltaH / (sh);
        var i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
        return i < 0 ? 0 : Math.sqrt(i);
    }
    /**
     * CIE94 color-difference formula (1994).
     *
     * Simpler and faster than CIE2000, with better perceptual uniformity than
     * CIE76. Asymmetric by design — the SC/SH weighting uses C1 (the first
     * argument's chroma), so dE94(A, B) ≠ dE94(B, A) in general. The convention
     * is to pass the reference color first.
     *
     * Reference: CIE Publication 116-1995, "Industrial Colour-Difference Evaluation."
     * Formula: https://en.wikipedia.org/wiki/Color_difference#CIE94
     */
    function deltaE94(labA, labB, options = {}) {
        const kL = Math.min(Math.max(options.kL ?? 1.0, 0.0), 2.0);
        const kC = Math.min(Math.max(options.kC ?? 1.0, 0.0), 2.0);
        const kH = Math.min(Math.max(options.kH ?? 1.0, 0.0), 2.0);
        const K1 = options.K1 ?? 0.045;
        const K2 = options.K2 ?? 0.015;
        const dL = labA.L - labB.L;
        const da = labA.a - labB.a;
        const db = labA.b - labB.b;
        const C1 = Math.sqrt(labA.a * labA.a + labA.b * labA.b);
        const C2 = Math.sqrt(labB.a * labB.a + labB.b * labB.b);
        const dC = C1 - C2;
        // ΔH² = Δa² + Δb² − ΔC². Clamp to zero to absorb floating-point underflow
        // when two colors share a hue but differ only in chroma — the subtraction
        // can produce a tiny negative number, and sqrt of that is NaN.
        const dH2 = Math.max(0, da * da + db * db - dC * dC);
        const dH = Math.sqrt(dH2);
        // SL = 1 in graphic-arts mode. Kept explicit so a future textiles-mode
        // variant (SL depending on L*) is a one-line change.
        const SL = 1;
        const SC = 1 + K1 * C1;
        const SH = 1 + K2 * C1;
        const termL = dL / (kL * SL);
        const termC = dC / (kC * SC);
        const termH = dH / (kH * SH);
        return Math.sqrt(termL * termL + termC * termC + termH * termH);
    }
    /**
     * Just Noticeable Difference threshold for CIE94. ~1.0 in graphic-arts mode
     * (the formula was calibrated against CIE76's JND of 2.3 by deflating it).
     */
    deltaE94.JND = 1.0;
    deltaE94.GRAPHIC_ARTS = { K1: 0.045, K2: 0.015, kL: 1 };
    deltaE94.TEXTILES = { K1: 0.048, K2: 0.014, kL: 2 };
    function deltaE74(labA, labB) {
        let sum = 0.0;
        sum += Math.pow(labB.L - labA.L, 2.0);
        sum += Math.pow(labB.a - labA.a, 2.0);
        sum += Math.pow(labB.b - labA.b, 2.0);
        return Math.sqrt(sum);
    }
    /**
     * Just Noticeable Difference (JND) threshold
     * defined at 2.3 on
     * https://en.wikipedia.org/wiki/Color_difference#CIE76
     * */
    deltaE74.JND = 2.3;

    var color = /*#__PURE__*/Object.freeze({
        __proto__: null,
        deltaE2000: deltaE2000,
        deltaE74: deltaE74,
        deltaE94: deltaE94,
        deltaE94Approximate: deltaE94Approximate,
        oklabToOklch: oklabToOklch,
        rgbToOklab: rgbToOklab,
        rgbToOklch: rgbToOklch
    });

    /**
     * A generic vector class that represents a mathematical vector in D-dimensional space.
     * Supports a wide range of vector operations and metrics.
     * @template D - The number of dimensions in the vector space
     * @typeParam D - The dimension of the vector space (must be positive integer)
     * @example
     * ```typescript
     * // 2D vector for game physics
     * type Vec2D = Vector<2>;
     * const position = new Vec2D([10, 20]);
     *
     * // 3D vector for computer graphics
     * type Vec3D = Vector<3>;
     * const normal = new Vec3D([0, 1, 0]);
     *
     * // 4D vector for machine learning features
     * type Vec4D = Vector<4>;
     * const features = new Vec4D([age, income, credit_score, years_employed]);
     *
     * // High-dimensional vector for text embedding
     * type Vec768D = Vector<768>;
     * const textEmbedding = new Vec768D(bertEmbeddings);
     * ```
    */
    class Vector {
        coords;
        static EPSILON = 1e-10;
        /**
         * Creates a new vector with the specified coordinates.
         * @param coords - An array-like object containing the vector's coordinates
         * @throws Error if the number of coordinates doesn't match the vector's dimension
         */
        constructor(coords) {
            if (coords.length !== this.constructor.dimensions) {
                throw new Error(`Expected ${this.constructor.dimensions} dimensions, got ${coords.length}`);
            }
            if (!Vector.isValid(coords)) {
                throw new Error(`All components of vector must be valid numbers (${coords})`);
            }
            this.coords = new Float64Array(coords);
        }
        /**
         * Indicates if any components of the provided coordinates are not finite
         *
         * @param coords
         * @returns {boolean} Indicates if any components are not finite
         */
        static isValid(coords) {
            for (var i = 0; i < coords.length; i++) {
                const value = coords[i];
                if (!Number.isFinite(value)) {
                    return false;
                }
            }
            return true;
        }
        static dimensions;
        /**
         * Creates a specialized Vector class for a specific dimension.
         *
         * @desc Factory method that creates a new Vector subclass configured for a specific dimensionality.
         * The created class includes dimension-specific static methods and type safety.
         *
         * @param d - The number of dimensions for the vector space
         * @returns A constructor for vectors of the specified dimension with:
         *          - Static dimension property
         *          - Zero vector factory method
         *          - Unit vector factory method
         * @throws {Error} If dimension is not a positive integer
         *
         * @example
         * ```typescript
         * const Vector3D = Vector.forDimension(3);
         * const v = new Vector3D([1, 2, 3]);
         * const zero = Vector3D.zero();
         * const unitX = Vector3D.unit(0);
         * ```
         */
        static forDimension(d) {
            return class extends Vector {
                static dimensions = d;
                /**
                 * Creates a zero vector of specified dimension.
                 * @param dimension - The dimension of the vector space
                 * @returns A new vector with all coordinates set to zero
                 */
                static zero() {
                    return new this(new Float64Array(d));
                }
                /**
                 * Creates a unit vector along the specified dimension axis.
                 *
                 * @desc Creates a vector of the specified dimension with a 1 in the specified position
                 * and 0s elsewhere. This is useful for creating basis vectors and coordinate axes.
                 *
                 * @param dimension - The axis along which to create the unit vector (0-based index)
                 * @returns A new unit vector with 1 in the specified dimension and 0s elsewhere
                 * @throws {Error} If dimension is out of bounds
                 *
                 * @example
                 * ```typescript
                 * const Vector3D = Vector.forDimension(3);
                 * const unitX = Vector3D.unit(0); // [1,0,0]
                 * const unitY = Vector3D.unit(1); // [0,1,0]
                 * const unitZ = Vector3D.unit(2); // [0,0,1]
                 * ```
                 */
                static unit(dimension) {
                    if (dimension < 0 || dimension >= d) {
                        throw new Error(`Dimension ${dimension} out of bounds for ${d}-dimensional vector`);
                    }
                    const coords = new Float64Array(d);
                    coords[dimension] = 1;
                    return new this(coords);
                }
            };
        }
        /**
         * Creates a static zero vector of specified dimension.
         *
         * @desc Factory method creating vector with all coordinates set to zero.
         * Useful as neutral element for addition or initial value.
         *
         * @param dimension - Dimension of vector space
         * @returns New zero vector of specified dimension
         * @throws {Error} If dimension is not positive integer
         *
         * @example
         * ```typescript
         * const zero3D = Vector.zero(3); // [0,0,0]
         * ```
         */
        static zero(dimension) {
            return new (Vector.forDimension(dimension))(new Float64Array(dimension));
        }
        /**
         * Creates a zero vector matching dimension of given vector.
         *
         * @desc Convenience method creating zero vector of same dimension.
         * Useful when needing neutral element matching existing vector.
         *
         * @param vector - Vector to match dimension with
         * @returns New zero vector of same dimension
         *
         * @example
         * ```typescript
         * const v = new Vector3D([1,2,3]);
         * const zero = Vector.zeroLike(v); // [0,0,0]
         * ```
         */
        static zeroLike(vector) {
            return new vector.constructor(new Float64Array(vector.dimension));
        }
        /**
         * Creates a vector from any iterable of numbers. The iterable's length
         * (or yielded count) must match the target dimension.
         *
         * @example
         * ```typescript
         * Vector3D.from([1, 2, 3]);
         * Vector3D.from(new Set([1, 2, 3]));
         * Vector3D.from(function*() { yield 1; yield 2; yield 3; }());
         * ```
         */
        static from(source) {
            return new this(Array.from(source));
        }
        /**
         * Creates a vector by calling `fn(i)` for each dimension index.
         * Mirrors `Array.from({ length }, fn)`.
         *
         * @example
         * ```typescript
         * Vector5D.fromFn(i => i * i);   // [0, 1, 4, 9, 16]
         * ```
         */
        static fromFn(fn) {
            const d = this.dimensions;
            const coords = new Float64Array(d);
            for (let i = 0; i < d; i++)
                coords[i] = fn(i);
            return new this(coords);
        }
        /**
         * Creates a vector with every component set to `value`.
         *
         * @example
         * ```typescript
         * Vector4D.filled(1);    // [1, 1, 1, 1]
         * Vector3D.filled(-0.5); // [-0.5, -0.5, -0.5]
         * ```
         */
        static filled(value) {
            const coords = new Float64Array(this.dimensions);
            coords.fill(value);
            return new this(coords);
        }
        /**
         * Creates a vector with components uniformly sampled from `[min, max)`.
         * Defaults to [0, 1).
         */
        static random(min = 0, max = 1) {
            const range = max - min;
            const d = this.dimensions;
            const coords = new Float64Array(d);
            for (let i = 0; i < d; i++)
                coords[i] = min + Math.random() * range;
            return new this(coords);
        }
        /**
         * Creates a unit vector uniformly distributed on the (D-1)-sphere.
         * Uses Gaussian sampling + normalization — the correct method for
         * uniform spherical distribution (rejection-free, works in any D).
         */
        static randomUnit() {
            const d = this.dimensions;
            const coords = new Float64Array(d);
            let lenSq = 0;
            // Re-sample on the astronomically rare zero-vector case
            while (lenSq < 1e-300) {
                lenSq = 0;
                for (let i = 0; i < d; i++) {
                    // Box-Muller for standard normal
                    const u1 = Math.random() || Number.MIN_VALUE;
                    const u2 = Math.random();
                    coords[i] = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                    lenSq += coords[i] * coords[i];
                }
            }
            const inv = 1 / Math.sqrt(lenSq);
            for (let i = 0; i < d; i++)
                coords[i] *= inv;
            return new this(coords);
        }
        /**
         * Creates a vector of `D` equally-spaced values from `start` to `end` inclusive.
         *
         * @example
         * ```typescript
         * Vector5D.linspace(0, 1);   // [0, 0.25, 0.5, 0.75, 1]
         * ```
         */
        static linspace(start, end) {
            const d = this.dimensions;
            if (d < 2) {
                throw new Error('linspace requires dimension >= 2');
            }
            const step = (end - start) / (d - 1);
            const coords = new Float64Array(d);
            for (let i = 0; i < d; i++)
                coords[i] = start + i * step;
            return new this(coords);
        }
        /**
         * Creates a deep copy of the vector.
         *
         * @desc Creates an independent copy with the same coordinate values but separate memory allocation.
         * Essential for avoiding unintended modifications when working with vector references.
         *
         * @returns A new vector with identical coordinates
         *
         * @example
         * ```typescript
         * const v1 = new Vector2D([1, 2]);
         * const v2 = v1.clone();
         * v2.scale(2); // v1 remains unchanged
         * ```
         */
        clone() {
            return new this.constructor(this.coords);
        }
        toString() {
            return `Vector<${this.dimension}>(${Array.from(this.coords).join(', ')})`;
        }
        /**
         * Converts the vector to a standard array representation.
         *
         * @desc Creates a new Float64Array containing the vector's coordinates.
         * Useful for interoperability with other APIs and data structures.
         *
         * @returns A Float64Array copy of the vector's coordinates
         *
         * @example
         * ```typescript
         * const v = new Vector3D([1, 2, 3]);
         * const arr = v.toArray();
         * // arr is Float64Array[1, 2, 3]
         * ```
         */
        toArray() {
            return new Float64Array(this.coords);
        }
        /**
         * Gets the value at a specific index in the vector.
         *
         * @desc Safely accesses individual coordinate values by index.
         *
         * @param index - Zero-based index of coordinate to retrieve
         * @returns The value at the specified index
         * @throws {Error} If index is out of bounds
         *
         * @example
         * ```typescript
         * const v = new Vector3D([1, 2, 3]);
         * const y = v.get(1); // 2
         * ```
         */
        get(index) {
            return this.coords[index];
        }
        /**
         * Gets the dimension of the vector.
         * @returns The number of dimensions in the vector
         */
        get dimension() {
            return this.coords.length;
        }
        /**
         * Makes the vector iterable, yielding each coordinate in order.
         * Enables `for...of`, spread syntax, destructuring, and `Array.from`.
         *
         * @example
         * ```typescript
         * const v = new Vector3D([1, 2, 3]);
         * for (const x of v) console.log(x);   // 1, 2, 3
         * const arr = [...v];                  // [1, 2, 3]
         * const [x, y, z] = v;                 // destructuring
         * Array.from(v, x => x * 2);           // [2, 4, 6]
         * ```
         */
        *[Symbol.iterator]() {
            for (let i = 0; i < this.coords.length; i++) {
                yield this.coords[i];
            }
        }
        static ensureSameDimension(a, b, operation) {
            if (a.dimension !== b.dimension) {
                throw new Error(`Cannot ${operation} vectors of different dimensions: ${a.dimension} and ${b.dimension}`);
            }
        }
        /**
         * Sum of all components.
         */
        sum() {
            let s = 0;
            for (let i = 0; i < this.coords.length; i++)
                s += this.coords[i];
            return s;
        }
        /**
         * Arithmetic mean of all components.
         */
        mean() {
            return this.sum() / this.coords.length;
        }
        /**
         * Population variance of components (divisor = N).
         * Pass `sample = true` for sample variance (divisor = N - 1).
         */
        variance(sample = false) {
            const n = this.coords.length;
            if (sample && n < 2) {
                throw new Error('Sample variance requires at least 2 components');
            }
            const mu = this.mean();
            let sumSq = 0;
            for (let i = 0; i < n; i++) {
                const d = this.coords[i] - mu;
                sumSq += d * d;
            }
            return sumSq / (sample ? n - 1 : n);
        }
        /**
         * Standard deviation. See `variance` for the `sample` flag.
         */
        stdDev(sample = false) {
            return Math.sqrt(this.variance(sample));
        }
        /**
         * Minimum component value.
         */
        min() {
            let m = this.coords[0];
            for (let i = 1; i < this.coords.length; i++) {
                if (this.coords[i] < m)
                    m = this.coords[i];
            }
            return m;
        }
        /**
         * Maximum component value.
         */
        max() {
            let m = this.coords[0];
            for (let i = 1; i < this.coords.length; i++) {
                if (this.coords[i] > m)
                    m = this.coords[i];
            }
            return m;
        }
        /**
         * Index of the minimum component (first occurrence on ties).
         */
        argMin() {
            let idx = 0;
            for (let i = 1; i < this.coords.length; i++) {
                if (this.coords[i] < this.coords[idx])
                    idx = i;
            }
            return idx;
        }
        /**
         * Index of the maximum component (first occurrence on ties).
         */
        argMax() {
            let idx = 0;
            for (let i = 1; i < this.coords.length; i++) {
                if (this.coords[i] > this.coords[idx])
                    idx = i;
            }
            return idx;
        }
        /**
         * Median component value. For even-length vectors, returns the mean
         * of the two middle values.
         */
        median() {
            const sorted = Array.from(this.coords).sort((a, b) => a - b);
            const n = sorted.length;
            const mid = n >> 1;
            return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
        }
        /**
         * Applies `fn` to each component and returns a new vector of the same dimension.
         * Non-mutating.
         *
         * @example
         * ```typescript
         * v.map(x => x * 2);          // scale by 2
         * v.map(Math.abs);            // absolute value
         * v.map((x, i) => x + i);     // add index to each component
         * ```
         */
        map(fn) {
            const result = new Float64Array(this.coords.length);
            for (let i = 0; i < this.coords.length; i++) {
                result[i] = fn(this.coords[i], i);
            }
            return new this.constructor(result);
        }
        /**
         * Reduces components to a single value, left-to-right.
         *
         * @example
         * ```typescript
         * v.reduce((acc, x) => acc + x * x, 0);   // sum of squares
         * v.reduce((acc, x) => Math.max(acc, x), -Infinity);
         * ```
         */
        reduce(fn, initial) {
            let acc = initial;
            for (let i = 0; i < this.coords.length; i++) {
                acc = fn(acc, this.coords[i], i);
            }
            return acc;
        }
        /**
         * Tests whether every component satisfies the predicate.
         */
        every(predicate) {
            for (let i = 0; i < this.coords.length; i++) {
                if (!predicate(this.coords[i], i))
                    return false;
            }
            return true;
        }
        /**
         * Tests whether at least one component satisfies the predicate.
         */
        some(predicate) {
            for (let i = 0; i < this.coords.length; i++) {
                if (predicate(this.coords[i], i))
                    return true;
            }
            return false;
        }
        /**
         * Executes `fn` for each component. Returns void; use `map` for transformations.
         */
        forEach(fn) {
            for (let i = 0; i < this.coords.length; i++) {
                fn(this.coords[i], i);
            }
        }
        /**
         * Element-wise (Hadamard) product with another vector of the same dimension.
         */
        hadamard(other) {
            Vector.ensureSameDimension(this, other, 'hadamard');
            const result = new Float64Array(this.coords.length);
            for (let i = 0; i < this.coords.length; i++) {
                result[i] = this.coords[i] * other.get(i);
            }
            return new this.constructor(result);
        }
        /**
         * Checks if vectors are equal within a specified tolerance.
         *
         * @desc Compares vectors for equality accounting for floating-point imprecision.
         * Two vectors are considered equal if corresponding coordinates differ by less than epsilon.
         *
         * @param other - Vector to compare with
         * @param epsilon - Maximum allowed difference between coordinates (default: 1e-10)
         * @returns true if vectors are equal within epsilon
         *
         * @example
         * ```typescript
         * const v1 = new Vector2D([1, 2]);
         * const v2 = new Vector2D([1.0000001, 2]);
         * console.log(v1.equals(v2, 0.001)); // true
         * console.log(v1.equals(v2));        // false (using default epsilon)
         * ```
         */
        equals(other, epsilon = Vector.EPSILON) {
            if (!(other instanceof Vector)) {
                return false;
            }
            if (this.dimension !== other.dimension) {
                return false;
            }
            for (let i = 0; i < this.dimension; i++) {
                if (Math.abs(this.coords[i] - other.get(i)) > epsilon) {
                    return false;
                }
            }
            return true;
        }
        /**
         * Adds another vector to this one.
         * The addition is performed component-wise: (a₁,a₂,...) + (b₁,b₂,...) = (a₁+b₁,a₂+b₂,...)
         *
         * Vector addition is useful in many scenarios:
         * - Combining multiple forces acting on an object
         * - Moving an object by combining its current position with a displacement
         * - Calculating a resultant velocity from multiple velocity components
         *
         * @param other - The vector to add
         * @returns A new vector representing the sum
         * @throws Error if vectors have different dimensions
         *
         * @param other - The vector to add
         * @returns A new vector representing the sum
         * @throws {Error} If vectors have different dimensions
         *
         * @example Physics Simulation
         * ```typescript
         * // Multiple forces acting on an object
         * const gravity = new Vector3D([0, -9.81, 0]);
         * const wind = new Vector3D([5, 0, -2]);
         * const thrust = new Vector3D([0, 20, 0]);
         *
         * // Calculate net force
         * const netForce = gravity.add(wind).add(thrust);
         * ```
         *
         * @example Neural Networks
         * ```typescript
         * // Gradient descent step
         * type ModelParams = Vector<10000>;
         * const weights = new ModelParams(currentWeights);
         * const gradients = new ModelParams(computedGradients);
         * const learningRate = 0.01;
         *
         * // Update weights: w = w - lr * ∇w
         * const newWeights = weights.add(gradients.scale(-learningRate));
         * ```
         */
        add(other) {
            Vector.ensureSameDimension(this, other, 'add');
            const result = new Float64Array(this.dimension);
            for (let i = 0; i < this.dimension; i++) {
                result[i] = this.coords[i] + other.get(i);
            }
            return new this.constructor(result);
        }
        /**
         * Subtracts another vector from this one.
         * The subtraction is performed component-wise: (a₁,a₂,...) - (b₁,b₂,...) = (a₁-b₁,a₂-b₂,...)
         * @param other - The vector to subtract
         * @returns A new vector representing the difference
         * @throws Error if vectors have different dimensions
         */
        subtract(other) {
            Vector.ensureSameDimension(this, other, 'subtract');
            const result = new Float64Array(this.dimension);
            for (let i = 0; i < this.dimension; i++) {
                result[i] = this.coords[i] - other.get(i);
            }
            return new this.constructor(result);
        }
        /**
         * Scales the vector by a scalar factor.
         * Multiplies each component by the factor: k(a₁,a₂,...) = (ka₁,ka₂,...)
         *
         * Scales a vector by multiplying it by a number. Scaling changes the vector's
         * magnitude (length) while preserving its direction. Common uses include:
         * - Adjusting the strength of a force
         * - Changing the speed of movement
         * - Applying weights to vectors in machine learning
         *
         *
         * @param factor - The scalar to multiply by
         * @returns A new vector scaled by the factor
         */
        scale(factor) {
            const result = new Float64Array(this.dimension);
            for (let i = 0; i < this.dimension; i++) {
                result[i] = this.coords[i] * factor;
            }
            return new this.constructor(result);
        }
        /**
         * Computes the dot (scalar) product with another vector.
         * Calculated as: a·b = Σ(aᵢbᵢ)
         *
         * Calculates the dot product (scalar product) with another vector.
         * The dot product is one of the most useful vector operations because it tells you:
         * - How similar two vectors' directions are (through the angle between them)
         * - The length of one vector projected onto another
         * - Whether two vectors are perpendicular (dot product = 0)
         *
         * Common applications:
         * - Calculating work done by a force (force · displacement)
         * - Finding the angle between two vectors
         * - Determining if vectors are perpendicular
         * - Computing the projection of one vector onto another
         *
         * @param other - The vector to compute the dot product with
         * @returns The scalar result of the dot product
         * @throws Error if vectors have different dimensions
         */
        dot(other) {
            Vector.ensureSameDimension(this, other, 'dot product');
            let sum = 0;
            for (let i = 0; i < this.dimension; i++) {
                sum += this.coords[i] * other.get(i);
            }
            return sum;
        }
        /**
         * Computes the Euclidean length (magnitude) of the vector.
         * Calculated as: ‖v‖ = √(Σvᵢ²)
         *
         * Calculates the length (magnitude) of the vector using the Pythagorean theorem.
         * The length is useful for:
         * - Finding the distance between two points
         * - Calculating the speed from a velocity vector
         * - Determining the strength of a force
         * - Checking if a vector is a unit vector (length = 1)
         *
         * @returns The length of the vector
         */
        length() {
            return Math.sqrt(this.dot(this));
        }
        /**
         * Creates a unit vector in the same direction as this vector.
         * Calculated as: v̂ = v/‖v‖
         *
         * Creates a unit vector (a vector with length 1) in the same direction as this vector.
         * Unit vectors are important because they:
         * - Represent pure direction without magnitude
         * - Make it easy to move in a direction by a specific amount
         * - Are used as the basis for coordinate systems
         * - Simplify many geometric calculations
         *
         * Common uses:
         * - Getting the direction of movement independent of speed
         * - Creating direction vectors for raycasting
         * - Defining surface normals for 3D graphics
         *
         * Example:
         * ```typescript
         * // A velocity of 3 m/s right and 4 m/s up
         * const velocity = new Vector2D([3, 4]);
         * // Get just the direction of movement
         * const direction = velocity.normalize();  // [0.6, 0.8]
         * // Move 10 units in this direction
         * const movement = direction.scale(10);    // [6, 8]
         * ```
         *
         * @returns A new vector with length 1 in the same direction
         * @throws Error if the vector has zero length
         */
        normalize() {
            const len = this.length();
            if (len === 0) {
                throw new Error('Cannot normalize zero vector');
            }
            return this.scale(1 / len);
        }
        /**
         * Computes the generalized cross product of vectors.
         * This implementation uses the following approaches:
         * 1. For 3D: Standard cross product
         * 2. For n-D: Generalized using the wedge product and Hodge star operator
         *
         * Computes the cross product of vectors, producing a vector perpendicular to both inputs.
         * The cross product is fundamental in:
         * - Calculating surface normals for 3D graphics
         * - Computing torque in physics
         * - Determining right-hand rule directions
         * - Finding perpendicular vectors for camera systems
         *
         * Example:
         * ```typescript
         * // Two edges of a triangle in 3D
         * const edge1 = new Vector3D([1, 0, 0]);
         * const edge2 = new Vector3D([0, 1, 0]);
         * // Calculate surface normal
         * const normal = edge1.cross(edge2);  // [0, 0, 1]
         * // This normal points straight up, perpendicular to both edges
         * ```
         *
         * For dimensions higher than 3, it generalizes to finding vectors
         * perpendicular to multiple input vectors.
         *
         * @param others Array of n-2 other vectors (so total of n-1 vectors including this one)
         * @returns A vector perpendicular to all input vectors
         */
        cross(...others) {
            const n = this.dimension;
            // Special case for 3D - traditional cross product
            if (n === 3 && others.length === 1) {
                const other = others[0];
                Vector.ensureSameDimension(this, other, 'cross product');
                const result = new Float64Array(3);
                result[0] = this.coords[1] * other.get(2) - this.coords[2] * other.get(1);
                result[1] = this.coords[2] * other.get(0) - this.coords[0] * other.get(2);
                result[2] = this.coords[0] * other.get(1) - this.coords[1] * other.get(0);
                return new this.constructor(result);
            }
            // Check if we have the correct number of vectors for n-dimensional cross product
            if (others.length !== n - 2) {
                throw new Error(`Expected ${n - 2} additional vectors for ${n}-dimensional cross product, got ${others.length}`);
            }
            // Ensure all vectors have the same dimension
            others.forEach(v => Vector.ensureSameDimension(this, v, 'cross product'));
            // Create matrix for determinant calculation
            // First row will be the standard basis vectors e₁, e₂, ..., eₙ
            // Subsequent rows are the components of the input vectors
            const matrix = new Float64Array(n * n);
            // Initialize result vector
            const result = new Float64Array(n);
            // For each component of the result vector
            for (let i = 0; i < n; i++) {
                // Create the matrix for the current component
                // First row: unit vector (1 in current position, 0 elsewhere)
                for (let j = 0; j < n; j++) {
                    matrix[j] = j === i ? 1 : 0;
                }
                // Add this vector's components
                for (let j = 0; j < n; j++) {
                    matrix[n + j] = this.coords[j];
                }
                // Add other vectors' components
                for (let k = 0; k < others.length; k++) {
                    for (let j = 0; j < n; j++) {
                        matrix[(k + 2) * n + j] = others[k].get(j);
                    }
                }
                result[i] = this.determinant(matrix, n);
            }
            return new this.constructor(result);
        }
        /**
         * Computes the determinant of a square matrix using LU decomposition.
         *
         * @desc Internal helper method that calculates matrix determinant using
         * LU decomposition with partial pivoting for numerical stability.
         *
         * @param matrix - Matrix as Float64Array in row-major order
         * @param n - Matrix dimension
         * @returns The determinant value
         * @private
         */
        determinant(matrix, n) {
            // Create working copy of the matrix
            const LU = new Float64Array(matrix);
            const pivot = new Int32Array(n);
            let sign = 1;
            // Initialize pivot array
            for (let i = 0; i < n; i++) {
                pivot[i] = i;
            }
            // LU decomposition with partial pivoting
            for (let k = 0; k < n - 1; k++) {
                // Find pivot
                let p = k;
                let max = Math.abs(LU[k * n + k]);
                for (let i = k + 1; i < n; i++) {
                    const abs = Math.abs(LU[i * n + k]);
                    if (abs > max) {
                        max = abs;
                        p = i;
                    }
                }
                // Swap rows if necessary
                if (p !== k) {
                    for (let i = 0; i < n; i++) {
                        const temp = LU[k * n + i];
                        LU[k * n + i] = LU[p * n + i];
                        LU[p * n + i] = temp;
                    }
                    const temp = pivot[k];
                    pivot[k] = pivot[p];
                    pivot[p] = temp;
                    sign = -sign;
                }
                // Check for singularity
                if (Math.abs(LU[k * n + k]) < Vector.EPSILON) {
                    return 0;
                }
                // Compute multipliers and eliminate k-th column
                for (let i = k + 1; i < n; i++) {
                    LU[i * n + k] /= LU[k * n + k];
                    for (let j = k + 1; j < n; j++) {
                        LU[i * n + j] -= LU[i * n + k] * LU[k * n + j];
                    }
                }
            }
            // Compute determinant as product of diagonal elements
            let det = sign;
            for (let i = 0; i < n; i++) {
                det *= LU[i * n + i];
            }
            return det;
        }
        /**
         * Computes the wedge (exterior) product of two vectors.
         *
         * Returns a new vector representing the bivector in the exterior algebra.
         * Represents the oriented area of the parallelogram spanned by the vectors.
         *
         * Creates a wedge (exterior) product between vectors.
         * The wedge product helps with:
         * - Computing oriented areas and volumes
         * - Differential geometry calculations
         * - Physics simulations
         * - Computer graphics and geometry processing
         *
         * Example:
         * ```typescript
         * // Two edges of a parallelogram
         * const edge1 = new Vector2D([2, 0]);
         * const edge2 = new Vector2D([1, 1]);
         *
         * // Calculate oriented area
         * const area = edge1.wedge(edge2);
         * // The magnitude gives the area
         * // The sign indicates orientation (clockwise/counterclockwise)
         *
         * // In 3D, can be used to find surface normals:
         * const v1 = new Vector3D([1, 0, 0]);
         * const v2 = new Vector3D([0, 1, 0]);
         * const normal = v1.wedge(v2);  // Points in z direction
         * ```
         *
         * @param other - The vector to compute wedge product with
         * @returns Components of the resulting bivector
         */
        wedge(other) {
            Vector.ensureSameDimension(this, other, 'wedge product');
            const n = this.dimension;
            const resultDimension = (n * (n - 1)) / 2; // Number of components in the bivector
            const result = new Float64Array(resultDimension);
            let index = 0;
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    result[index++] = this.coords[i] * other.get(j) - this.coords[j] * other.get(i);
                }
            }
            return result;
        }
        /**
         * Computes the outer product of two vectors.
         * Results in a matrix where (i,j) element is the product of i-th component of first vector
         * and j-th component of second vector.
         *
         * Creates a tensor representing outer product of vectors.
         * The outer product is essential for:
         * - Creating projection matrices
         * - Neural network weight updates
         * - Quantum mechanical operators
         * - Multi-dimensional data transformations
         *
         * Example:
         * ```typescript
         * // Feature vector
         * const features = new Vector3D([1, 2, 3]);
         * // Weight update direction
         * const gradient = new Vector2D([0.1, -0.1]);
         * // Create weight update matrix
         * const update = features.outer(gradient);
         * // Results in a 3x2 matrix for updating neural network weights
         * ```
         *
         * @param other - The vector to compute outer product with
         * @returns A matrix represented as Float64Array in row-major order
         */
        outer(other) {
            const n = this.dimension;
            const result = new Float64Array(n * n);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    result[i * n + j] = this.coords[i] * other.get(j);
                }
            }
            return result;
        }
        /**
         * Tests if two vectors are parallel within a specified tolerance.
         *
         * * Checks if this vector is parallel to another vector.
         * Two vectors are parallel if one is a scalar multiple of the other.
         *
         * Tests if two vectors point in the same or opposite directions.
         * Parallel vectors are important in:
         * - Physics (parallel forces)
         * - Computer graphics (collinear points)
         * - Geometry processing
         * - Structural analysis
         *
         * @typeParam D - Vector dimension
         * @param other - Vector to test parallelism with
         * @param epsilon - Maximum angular difference to consider parallel
         * @defaultValue epsilon = 1e-10
         *
         * @example
         * ```typescript
         * // Structural engineering: Check if beams are parallel
         * const beam1 = new Vector3D([3, 0, 4]); // First beam direction
         * const beam2 = new Vector3D([6, 0, 8]); // Second beam direction
         * if (beam1.isParallelTo(beam2)) {
         *     console.log("Beams are parallel - valid structural design");
         * }
         *
         * // Computer graphics: Check if normals are anti-parallel
         * const normal1 = new Vector3D([0, 1, 0]);
         * const normal2 = new Vector3D([0, -1, 0]);
         * if (normal1.isParallelTo(normal2)) {
         *     console.log("Surfaces are parallel but opposite facing");
         * }
         *
         * // Machine learning: Check if feature vectors point in same direction
         * const embedding1 = new Vector768D(documentEmbedding1);
         * const embedding2 = new Vector768D(documentEmbedding2);
         * const similarity = embedding1.isParallelTo(embedding2, 0.1);
         * ```
         *
         * @param other - The vector to check parallelism with
         * @param epsilon - Tolerance for floating-point comparisons
         * @returns true if vectors are parallel within epsilon
         */
        areCollinear(other, tolerance) {
            return Vector.rank([this, other], tolerance) <= 1;
        }
        /**
         * Rotates this vector by a specified angle in the plane defined by two axes.
         *
         * Rotates a vector by a specified angle in a plane defined by two axes.
         * Rotation is crucial for:
         * - Animating objects in games
         * - Orienting cameras
         * - Transforming coordinates
         * - Creating circular motion
         *
         * @example
         * ```typescript
         * // Game Development: Rotate character orientation
         * const facing = new Vector3D([1, 0, 0]);  // Facing right
         * const rotated = facing.rotate(Math.PI/2, 0, 1); // Turn 90° in XZ plane
         *
         * // Robotics: Rotate robotic arm joint
         * const armSegment = new Vector6D([length, 0, 0, 0, 0, 0]); // 6-DOF arm
         * const rotated = armSegment.rotate(angle, 2, 3); // Rotate in joints 3&4
         *
         * // Quantum Computing: Rotate quantum state vector
         * const quantumState = new Vector16D(stateVector);
         * const rotatedState = quantumState.rotate(theta, 0, 1);
         * ```
         *
         * @typeParam D - Vector dimension
         * @param angle - The rotation angle in radians
         * @param axis1 - Index of the first axis defining the rotation plane
         * @param axis2 - Index of the second axis defining the rotation plane
         * @returns The rotated vector
         * @throws Error if axis indices are invalid or equal
         */
        rotate(angle, axis1, axis2) {
            if (axis1 < 0 || axis1 >= this.dimension || axis2 < 0 || axis2 >= this.dimension) {
                throw new Error('Invalid axis indices');
            }
            if (axis1 === axis2) {
                throw new Error('Axes must be different');
            }
            const result = this.clone();
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const x = this.coords[axis1];
            const y = this.coords[axis2];
            result.coords[axis1] = x * cos - y * sin;
            result.coords[axis2] = x * sin + y * cos;
            return result;
        }
        /**
         * Returns the Gram matrix of a set of vectors.
         * @param vectors Array of vectors
         * @returns Float64Array representing the Gram matrix in row-major order
         *
         * Computes various types of vector multiplication based on different algebraic structures.
         * Each type has specific applications:
         *
         * Grassmann (Exterior) Product:
         * - Calculating oriented areas and volumes
         * - Geometric algebra computations
         * - Multi-vector operations in physics
         *
         * Clifford (Geometric) Product:
         * - Combining rotations and transformations
         * - Quaternion-like operations in higher dimensions
         * - Physical modeling in geometric algebra
         *
         * Tensor Product:
         * - Quantum mechanics calculations
         * - Neural network operations
         * - Multi-linear transformations
         *
         * Example:
         * ```typescript
         * const v1 = new Vector3D([1, 0, 0]);
         * const v2 = new Vector3D([0, 1, 0]);
         *
         * // Calculate oriented area using Grassmann product
         * const area = v1.multiply(v2, 'grassmann');
         *
         * // Combine rotations using Clifford product
         * const rotation = v1.multiply(v2, 'clifford');
         *
         * // Create transformation matrix using tensor product
         * const transform = v1.multiply(v2, 'tensor');
         * ```
         *
         * @param other The vector to multiply with
         * @param type The type of multiplication to perform
         * @returns The resulting vector or higher-dimensional structure
         */
        multiply(other, type = 'grassmann') {
            Vector.ensureSameDimension(this, other, 'multiply');
            switch (type) {
                case 'grassmann':
                    return this.grassmannMultiply(other);
                case 'clifford':
                    return this.cliffordMultiply(other);
                case 'tensor':
                    return this.tensorMultiply(other);
                case 'quaternion':
                    return this.quaternionMultiply(other);
                case 'cayley-dickson':
                    return this.cayleyDicksonMultiply(other);
                default:
                    throw new Error('Unsupported multiplication type');
            }
        }
        grassmannMultiply(other) {
            // Implements the Grassmann (exterior) product
            // Returns a multivector represented as components in different grades
            const n = this.dimension;
            const resultDimension = 1 << n; // 2^n dimensions for full multivector
            const result = new Float64Array(resultDimension);
            // Compute all possible wedge products of basis vectors
            for (let grade = 0; grade <= n; grade++) {
                for (let bits = 0; bits < resultDimension; bits++) {
                    if (this.bitCount(bits) === grade) {
                        let sign = 1;
                        let value = 1;
                        let mask = bits;
                        while (mask) {
                            const idx = this.lowestBitIndex(mask);
                            value *= this.coords[idx] * other.get(idx);
                            mask &= (mask - 1); // Clear lowest bit
                            // Compute sign based on permutation parity
                            let remaining = mask;
                            while (remaining) {
                                if (remaining & 1)
                                    sign = -sign;
                                remaining >>= 1;
                            }
                        }
                        result[bits] = value * sign;
                    }
                }
            }
            return result;
        }
        cliffordMultiply(other) {
            // Implements the Clifford (geometric) product
            // Combines inner and outer products with metric signature
            const n = this.dimension;
            const resultDimension = 1 << n;
            const result = new Float64Array(resultDimension);
            // Metric tensor (can be customized for different spaces)
            const metric = new Float64Array(n).fill(1); // Euclidean by default
            // Compute both inner and outer products
            const innerPart = this.dot(other);
            const outerPart = this.grassmannMultiply(other);
            // Combine with metric signature
            result[0] = innerPart; // Scalar part
            for (let i = 1; i < resultDimension; i++) {
                let sign = 1;
                let bits = i;
                while (bits) {
                    const idx = this.lowestBitIndex(bits);
                    sign *= metric[idx];
                    bits &= (bits - 1);
                }
                result[i] = outerPart[i] * sign;
            }
            return result;
        }
        tensorMultiply(other) {
            // Implements tensor product, resulting in n×n matrix
            const n = this.dimension;
            const result = new Float64Array(n * n);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    result[i * n + j] = this.coords[i] * other.get(j);
                }
            }
            return result;
        }
        quaternionMultiply(other) {
            if (this.dimension !== 4) {
                throw new Error('Quaternion multiplication requires 4D vectors');
            }
            // Treat vectors as quaternions q = w + xi + yj + zk
            const [w1, x1, y1, z1] = this.coords;
            const [w2, x2, y2, z2] = other.toArray();
            // Implement quaternion multiplication formula
            const result = new Float64Array(4);
            result[0] = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2; // w
            result[1] = w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2; // x
            result[2] = w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2; // y
            result[3] = w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2; // z
            return new this.constructor(result);
        }
        cayleyDicksonMultiply(other) {
            const n = this.dimension;
            if ((n & (n - 1)) !== 0) { // Check if n is power of 2
                throw new Error('Cayley-Dickson multiplication requires dimension to be power of 2');
            }
            // Base case: complex numbers
            if (n === 2) {
                const [a, b] = this.coords;
                const [c, d] = other.toArray();
                return new this.constructor(new Float64Array([
                    a * c - b * d,
                    a * d + b * c
                ]));
            }
            // Recursive case: split into two half-dimensional vectors
            const halfDim = n / 2;
            const a = new (Vector.forDimension(halfDim))(this.coords.slice(0, halfDim));
            const b = new (Vector.forDimension(halfDim))(this.coords.slice(halfDim));
            const c = new (Vector.forDimension(halfDim))(other.toArray().slice(0, halfDim));
            const d = new (Vector.forDimension(halfDim))(other.toArray().slice(halfDim));
            // Apply Cayley-Dickson construction recursively
            const ac = a.cayleyDicksonMultiply(c);
            const ad = a.cayleyDicksonMultiply(d);
            const bc = b.cayleyDicksonMultiply(c);
            // Combine results
            const result = new Float64Array(n);
            result.set(ac.coords);
            result.set(ad.add(bc.scale(-1)).coords, halfDim);
            return new this.constructor(result);
        }
        bitCount(n) {
            let count = 0;
            while (n) {
                count += n & 1;
                n >>= 1;
            }
            return count;
        }
        lowestBitIndex(n) {
            if (n === 0)
                return -1;
            let index = 0;
            while ((n & 1) === 0) {
                n >>= 1;
                index++;
            }
            return index;
        }
        /**
         * Computes the rank of a set of vectors — the dimension of their span.
         *
         * Rank tells you how many vectors are "actually independent." If rank
         * equals vectors.length, the set is linearly independent. If rank is
         * smaller, some vectors are redundant.
         *
         * Implemented via Gaussian elimination with partial pivoting. Tolerance
         * scales with matrix size and entry magnitude, following the NumPy/LAPACK
         * convention.
         *
         * @param vectors - The vectors to analyze. All must have the same dimension.
         * @param tolerance - Optional override for the zero-pivot threshold. If
         *   omitted, uses max(rows, cols) * EPSILON * max(|entries|).
         * @returns The rank, an integer in [0, min(vectors.length, D)].
         */
        static rank(vectors, tolerance) {
            if (vectors.length === 0)
                return 0;
            const rows = vectors.length;
            const cols = vectors[0].dimension;
            // Validate same dimension across all vectors.
            for (let i = 1; i < rows; i++) {
                if (vectors[i].dimension !== cols) {
                    throw new Error('All vectors must have the same dimension');
                }
            }
            // Copy into a mutable working matrix (row-major).
            const A = new Float64Array(rows * cols);
            let maxAbs = 0;
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const v = vectors[i].get(j);
                    A[i * cols + j] = v;
                    const av = Math.abs(v);
                    if (av > maxAbs)
                        maxAbs = av;
                }
            }
            // Default tolerance: scales with size and magnitude.
            const tol = tolerance ?? Math.max(rows, cols) * Vector.EPSILON * Math.max(maxAbs, 1);
            let rank = 0;
            // `row` tracks where we'd place the next pivot row; `col` scans columns.
            let row = 0;
            for (let col = 0; col < cols && row < rows; col++) {
                // Find row with largest absolute value in this column, at or below `row`.
                let pivot = row;
                let pivotAbs = Math.abs(A[row * cols + col]);
                for (let i = row + 1; i < rows; i++) {
                    const a = Math.abs(A[i * cols + col]);
                    if (a > pivotAbs) {
                        pivotAbs = a;
                        pivot = i;
                    }
                }
                // Column is effectively zero below `row`: skip it, no pivot here.
                if (pivotAbs < tol)
                    continue;
                // Swap pivot row up to `row`.
                if (pivot !== row) {
                    for (let j = col; j < cols; j++) {
                        const tmp = A[row * cols + j];
                        A[row * cols + j] = A[pivot * cols + j];
                        A[pivot * cols + j] = tmp;
                    }
                }
                // Eliminate this column in all rows below the pivot.
                const pivotVal = A[row * cols + col];
                for (let i = row + 1; i < rows; i++) {
                    const factor = A[i * cols + col] / pivotVal;
                    if (factor === 0)
                        continue;
                    for (let j = col; j < cols; j++) {
                        A[i * cols + j] -= factor * A[row * cols + j];
                    }
                }
                rank++;
                row++;
            }
            return rank;
        }
        static areLinearlyIndependent(vectors, tolerance) {
            return Vector.rank(vectors, tolerance) === vectors.length;
        }
    }

    var types = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Vector: Vector
    });

    // Implementation of linear mapping with strong typing
    class LinearMapper {
        inputRange;
        outputRange;
        constructor(inputRange, outputRange) {
            // Runtime checks to complement compile-time type safety
            if (inputRange.max <= inputRange.min) {
                throw new Error('Input maximum must be greater than minimum');
            }
            if (outputRange.max <= outputRange.min) {
                throw new Error('Output maximum must be greater than minimum');
            }
            this.inputRange = inputRange;
            this.outputRange = outputRange;
        }
        map(value) {
            // Ensure value is within input range
            if (value < this.inputRange.min || value > this.inputRange.max) {
                throw new Error(`Value ${value} is outside input range [${this.inputRange.min}, ${this.inputRange.max}]`);
            }
            return this.outputRange.min +
                (this.outputRange.max - this.outputRange.min) *
                    (value - this.inputRange.min) /
                    (this.inputRange.max - this.inputRange.min);
        }
        inverse(value) {
            // Ensure value is within output range
            if (value < this.outputRange.min || value > this.outputRange.max) {
                throw new Error(`Value ${value} is outside output range [${this.outputRange.min}, ${this.outputRange.max}]`);
            }
            return this.inputRange.min +
                (this.inputRange.max - this.inputRange.min) *
                    (value - this.outputRange.min) /
                    (this.outputRange.max - this.outputRange.min);
        }
    }
    class QuadraticMapper {
        inputRange;
        outputRange;
        epsilon = 1e-10;
        constructor(inputRange, outputRange) {
            // Runtime checks to complement compile-time type safety
            if (inputRange.max <= inputRange.min) {
                throw new Error('Input maximum must be greater than minimum');
            }
            if (outputRange.max <= outputRange.min) {
                throw new Error('Output maximum must be greater than minimum');
            }
            this.inputRange = inputRange;
            this.outputRange = outputRange;
        }
        map(value) {
            if (value < this.inputRange.min || value > this.inputRange.max) {
                throw new Error(`Value ${value} is outside input range [${this.inputRange.min}, ${this.inputRange.max}]`);
            }
            // Normalize input to [0,1] range
            const normalized = (value - this.inputRange.min) / (this.inputRange.max - this.inputRange.min);
            // Handle extreme values to prevent numerical instability
            if (normalized < this.epsilon)
                return this.outputRange.min;
            if (normalized > 1 - this.epsilon)
                return this.outputRange.max;
            // Apply quadratic transformation
            const transformed = normalized * normalized;
            // Scale to output range
            return this.outputRange.min + (this.outputRange.max - this.outputRange.min) * transformed;
        }
        inverse(value) {
            if (value < this.outputRange.min || value > this.outputRange.max) {
                throw new Error(`Value ${value} is outside output range [${this.outputRange.min}, ${this.outputRange.max}]`);
            }
            // Normalize to [0,1]
            const normalized = (value - this.outputRange.min) / (this.outputRange.max - this.outputRange.min);
            // Handle extreme values to prevent numerical instability
            if (normalized < this.epsilon)
                return this.inputRange.min;
            if (normalized > 1 - this.epsilon)
                return this.inputRange.max;
            // Apply inverse quadratic (square root)
            const transformed = Math.sqrt(normalized);
            // Scale back to input range
            return this.inputRange.min + (this.inputRange.max - this.inputRange.min) * transformed;
        }
    }
    // Exponential mapping implementation
    class ExponentialMapper {
        inputRange;
        outputRange;
        base;
        constructor(inputRange, outputRange, base = Math.E) {
            // Runtime checks to complement compile-time type safety
            if (inputRange.max <= inputRange.min) {
                throw new Error('Input maximum must be greater than minimum');
            }
            if (outputRange.max <= outputRange.min) {
                throw new Error('Output maximum must be greater than minimum');
            }
            this.inputRange = inputRange;
            this.outputRange = outputRange;
            this.base = base;
        }
        map(value) {
            if (value < this.inputRange.min || value > this.inputRange.max) {
                throw new Error(`Value ${value} is outside input range [${this.inputRange.min}, ${this.inputRange.max}]`);
            }
            // Normalize input to [0,1]
            const normalized = (value - this.inputRange.min) / (this.inputRange.max - this.inputRange.min);
            // Apply exponential transformation
            const transformed = (Math.pow(this.base, normalized) - 1) / (this.base - 1);
            // Scale to output range
            return this.outputRange.min + (this.outputRange.max - this.outputRange.min) * transformed;
        }
        inverse(value) {
            if (value < this.outputRange.min || value > this.outputRange.max) {
                throw new Error(`Value ${value} is outside output range [${this.outputRange.min}, ${this.outputRange.max}]`);
            }
            // Normalize to [0,1]
            const normalized = (value - this.outputRange.min) / (this.outputRange.max - this.outputRange.min);
            // Apply inverse exponential (logarithm)
            const transformed = Math.log(normalized * (this.base - 1) + 1) / Math.log(this.base);
            // Scale back to input range
            return this.inputRange.min + (this.inputRange.max - this.inputRange.min) * transformed;
        }
    }
    // Sigmoid mapping implementation
    class SigmoidMapper {
        inputRange;
        outputRange;
        epsilon = 1e-10;
        steepness;
        constructor(inputRange, outputRange, steepness = 1) {
            if (inputRange.max <= inputRange.min) {
                throw new Error('Input maximum must be greater than minimum');
            }
            if (outputRange.max <= outputRange.min) {
                throw new Error('Output maximum must be greater than minimum');
            }
            this.inputRange = inputRange;
            this.outputRange = outputRange;
            this.steepness = steepness;
        }
        map(value) {
            if (value < this.inputRange.min || value > this.inputRange.max) {
                throw new Error(`Value ${value} is outside input range [${this.inputRange.min}, ${this.inputRange.max}]`);
            }
            // Normalize to [0,1]
            const normalized = (value - this.inputRange.min) / (this.inputRange.max - this.inputRange.min);
            // Handle extreme values to prevent numerical instability
            if (normalized < this.epsilon)
                return this.outputRange.min;
            if (normalized > 1 - this.epsilon)
                return this.outputRange.max;
            // Apply sigmoid transformation with scaled steepness
            const x = (normalized * 2 - 1) * this.steepness; // Scale to [-steepness, steepness]
            const transformed = 1 / (1 + Math.exp(-x));
            // Scale to output range
            return this.outputRange.min + (this.outputRange.max - this.outputRange.min) * transformed;
        }
        inverse(value) {
            if (value < this.outputRange.min || value > this.outputRange.max) {
                throw new Error(`Value ${value} is outside output range [${this.outputRange.min}, ${this.outputRange.max}]`);
            }
            // Normalize to [0,1]
            const normalized = (value - this.outputRange.min) / (this.outputRange.max - this.outputRange.min);
            // Handle extreme values to prevent numerical instability
            if (normalized < this.epsilon)
                return this.inputRange.min;
            if (normalized > 1 - this.epsilon)
                return this.inputRange.max;
            // Apply inverse sigmoid (logit)
            const x = Math.log(normalized / (1 - normalized)) / this.steepness;
            // Scale back to input range
            return this.inputRange.min + (this.inputRange.max - this.inputRange.min) * ((x + 1) / 2);
        }
    }
    // Cosine mapping implementation
    class CosineMapper {
        inputRange;
        outputRange;
        constructor(inputRange, outputRange) {
            // Runtime checks to complement compile-time type safety
            if (inputRange.max <= inputRange.min) {
                throw new Error('Input maximum must be greater than minimum');
            }
            if (outputRange.max <= outputRange.min) {
                throw new Error('Output maximum must be greater than minimum');
            }
            this.inputRange = inputRange;
            this.outputRange = outputRange;
        }
        map(value) {
            if (value < this.inputRange.min || value > this.inputRange.max) {
                throw new Error(`Value ${value} is outside input range [${this.inputRange.min}, ${this.inputRange.max}]`);
            }
            // Normalize input to [0,1]
            const normalized = (value - this.inputRange.min) / (this.inputRange.max - this.inputRange.min);
            // Apply cosine transformation (shifted and scaled to [0,1])
            const transformed = (1 - Math.cos(normalized * Math.PI)) / 2;
            // Scale to output range
            return this.outputRange.min + (this.outputRange.max - this.outputRange.min) * transformed;
        }
        inverse(value) {
            if (value < this.outputRange.min || value > this.outputRange.max) {
                throw new Error(`Value ${value} is outside output range [${this.outputRange.min}, ${this.outputRange.max}]`);
            }
            // Normalize to [0,1]
            const normalized = (value - this.outputRange.min) / (this.outputRange.max - this.outputRange.min);
            // Apply inverse cosine
            const transformed = Math.acos(1 - 2 * normalized) / Math.PI;
            // Scale back to input range
            return this.inputRange.min + (this.inputRange.max - this.inputRange.min) * transformed;
        }
    }
    class ClampedMapper {
        inputRange;
        outputRange;
        baseMapper;
        constructor(baseMapper) {
            this.baseMapper = baseMapper;
            this.inputRange = baseMapper.inputRange;
            this.outputRange = baseMapper.outputRange;
        }
        /**
         * Maps the input value using the base mapper and clamps the result to the output range
         */
        map(value) {
            // First, clamp the input value to the input range
            const clampedInput = this.clamp(value, this.inputRange.min, this.inputRange.max);
            // Map the value using the base mapper
            const mappedValue = this.baseMapper.map(clampedInput);
            // Clamp the output to ensure it's within the output range
            return this.clamp(mappedValue, this.outputRange.min, this.outputRange.max);
        }
        /**
         * Provides inverse mapping if the base mapper supports it
         */
        inverse(value) {
            if (!this.baseMapper.inverse) {
                throw new Error('Base mapper does not support inverse mapping');
            }
            // Clamp the input value to the output range (since this is inverse mapping)
            const clampedInput = this.clamp(value, this.outputRange.min, this.outputRange.max);
            // Map the value using the base mapper's inverse
            const mappedValue = this.baseMapper.inverse(clampedInput);
            // Clamp the result to ensure it's within the input range
            return this.clamp(mappedValue, this.inputRange.min, this.inputRange.max);
        }
        /**
         * Helper method to clamp a value between min and max
         */
        clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        }
    }
    class PiecewiseLinearMapper {
        inputRange;
        outputRange;
        controlPoints;
        /**
         * Creates a new PiecewiseLinearMapper with the given control points.
         * Control points must include at least the start and end points of the ranges.
         * Points must be ordered by x value.
         */
        constructor(inputRange, outputRange, additionalPoints = []) {
            // Runtime checks to complement compile-time type safety
            if (inputRange.max <= inputRange.min) {
                throw new Error('Input maximum must be greater than minimum');
            }
            if (outputRange.max <= outputRange.min) {
                throw new Error('Output maximum must be greater than minimum');
            }
            this.inputRange = inputRange;
            this.outputRange = outputRange;
            const allPoints = [
                { x: inputRange.min, y: outputRange.min },
                ...additionalPoints,
                { x: inputRange.max, y: outputRange.max }
            ];
            // Validate control points
            this.validateControlPoints(allPoints);
            // Store sorted control points
            this.controlPoints = allPoints.sort((a, b) => a.x - b.x);
        }
        /**
         * Maps an input value using piecewise linear interpolation between control points
         */
        map(value) {
            if (value < this.inputRange.min || value > this.inputRange.max) {
                throw new Error(`Value ${value} is outside input range [${this.inputRange.min}, ${this.inputRange.max}]`);
            }
            // Find the segment containing the input value
            const segmentStart = this.findSegmentStart(value);
            const segmentEnd = this.findSegmentEnd(value);
            // Perform linear interpolation within the segment
            return this.linearInterpolate(value, segmentStart.x, segmentEnd.x, segmentStart.y, segmentEnd.y);
        }
        /**
         * Provides inverse mapping by finding the appropriate segment and interpolating
         */
        inverse(value) {
            if (value < this.outputRange.min || value > this.outputRange.max) {
                throw new Error(`Value ${value} is outside output range [${this.outputRange.min}, ${this.outputRange.max}]`);
            }
            // Find the segment containing the output value (searching by y values)
            const segment = this.findSegmentForY(value);
            if (!segment) {
                throw new Error('Could not find appropriate segment for inverse mapping');
            }
            // Perform inverse linear interpolation within the segment
            return this.linearInterpolate(value, segment.start.y, segment.end.y, segment.start.x, segment.end.x);
        }
        /**
         * Validates that control points are properly ordered and within ranges
         */
        validateControlPoints(points) {
            if (points.length < 2) {
                throw new Error('At least two control points (range endpoints) are required');
            }
            // Check if points are ordered by x
            for (let i = 1; i < points.length; i++) {
                if (points[i].x <= points[i - 1].x) {
                    throw new Error('Control points must be strictly monotonically increasing in x');
                }
            }
            // Check if all points are within ranges
            for (const point of points) {
                if (point.x < this.inputRange.min || point.x > this.inputRange.max) {
                    throw new Error(`Control point x value ${point.x} is outside input range`);
                }
                if (point.y < this.outputRange.min || point.y > this.outputRange.max) {
                    throw new Error(`Control point y value ${point.y} is outside output range`);
                }
            }
        }
        /**
         * Finds the control point at or before the given x value
         */
        findSegmentStart(x) {
            let index = this.controlPoints.findIndex(point => point.x > x) - 1;
            if (index === -2) { // If no point is greater than x, use the last point
                index = this.controlPoints.length - 2;
            }
            return this.controlPoints[index];
        }
        /**
         * Finds the control point at or after the given x value
         */
        findSegmentEnd(x) {
            let index = this.controlPoints.findIndex(point => point.x > x);
            if (index === -1) { // If no point is greater than x, use the last point
                index = this.controlPoints.length - 1;
            }
            return this.controlPoints[index];
        }
        /**
         * Finds the segment containing the given y value for inverse mapping
         */
        findSegmentForY(y) {
            for (let i = 0; i < this.controlPoints.length - 1; i++) {
                const start = this.controlPoints[i];
                const end = this.controlPoints[i + 1];
                // Check if y is between (or equal to) the segment's y values
                if ((y >= start.y && y <= end.y) || (y <= start.y && y >= end.y)) {
                    return { start, end };
                }
            }
            return null;
        }
        /**
         * Performs linear interpolation between two points
         */
        linearInterpolate(value, x1, x2, y1, y2) {
            return y1 + (value - x1) * (y2 - y1) / (x2 - x1);
        }
    }
    /**
     * Implementation of a logarithmic mapper that transforms values using logarithmic scaling
     */
    class LogarithmicMapper {
        inputRange;
        outputRange;
        epsilon = 1e-10;
        base;
        constructor(inputRange, outputRange, base = Math.E) {
            this.inputRange = inputRange;
            this.outputRange = outputRange;
            this.base = base;
            // Ensure input range minimum is positive for log mapping
            if (this.inputRange.min <= 0) {
                throw new Error('Input range minimum must be positive for logarithmic mapping');
            }
        }
        map(value) {
            // Ensure value is within input range
            if (value < this.inputRange.min || value > this.inputRange.max) {
                throw new Error(`Value ${value} is outside input range [${this.inputRange.min}, ${this.inputRange.max}]`);
            }
            // Handle extreme values to prevent numerical instability
            if (Math.abs(value - this.inputRange.min) < this.epsilon) {
                return this.outputRange.min;
            }
            if (Math.abs(value - this.inputRange.max) < this.epsilon) {
                return this.outputRange.max;
            }
            // Calculate logarithmic mapping
            const normalizedLog = (Math.log(value) - Math.log(this.inputRange.min)) /
                (Math.log(this.inputRange.max) - Math.log(this.inputRange.min));
            return (this.outputRange.min +
                normalizedLog * (this.outputRange.max - this.outputRange.min));
        }
        inverse(value) {
            // Ensure value is within input range
            if (value < this.outputRange.min || value > this.outputRange.max) {
                throw new Error(`Value ${value} is outside output range [${this.outputRange.min}, ${this.outputRange.max}]`);
            }
            // Handle extreme values to prevent numerical instability
            if (Math.abs(value - this.outputRange.min) < this.epsilon) {
                return this.inputRange.min;
            }
            if (Math.abs(value - this.outputRange.max) < this.epsilon) {
                return this.inputRange.max;
            }
            // Calculate inverse logarithmic mapping
            const normalizedValue = (value - this.outputRange.min) /
                (this.outputRange.max - this.outputRange.min);
            return Math.pow(this.base, Math.log(this.inputRange.min) +
                normalizedValue *
                    (Math.log(this.inputRange.max) - Math.log(this.inputRange.min)));
        }
    }
    /**
     * Implements both quantized and periodic mapping functionality
     * Can be used for either discrete steps or continuous periodic mapping
     */
    class QuantizedPeriodicMapper {
        inputRange;
        outputRange;
        steps;
        period;
        /**
         * @param inputRange - Valid input range
         * @param outputRange - Valid output range
         * @param steps - Number of discrete steps (for quantized mapping)
         * @param period - Period length (for periodic mapping)
         */
        constructor(inputRange, outputRange, options = {}) {
            this.inputRange = inputRange;
            this.outputRange = outputRange;
            this.steps = options.steps ?? null;
            this.period = options.period ?? null;
            if (this.steps !== null && this.steps <= 0) {
                throw new Error('Steps must be positive');
            }
            if (this.period !== null && this.period <= 0) {
                throw new Error('Period must be positive');
            }
            if (this.steps !== null && this.period !== null) {
                throw new Error('Cannot specify both steps and period');
            }
        }
        map(value) {
            if (this.steps !== null) {
                return this.quantizedMap(value);
            }
            if (this.period !== null) {
                return this.periodicMap(value);
            }
            throw new Error('Either steps or period must be specified');
        }
        quantizedMap(value) {
            if (this.steps === null)
                throw new Error('Steps not specified');
            // Normalize value to 0-1 range
            const normalizedValue = (value - this.inputRange.min) /
                (this.inputRange.max - this.inputRange.min);
            // Quantize to steps
            const quantized = Math.round(normalizedValue * (this.steps - 1)) / (this.steps - 1);
            // Map to output range
            return (this.outputRange.min +
                quantized * (this.outputRange.max - this.outputRange.min));
        }
        periodicMap(value) {
            if (this.period === null)
                throw new Error('Period not specified');
            // Calculate how many periods we're offset from the input minimum
            const periodsOffset = ((value - this.inputRange.min) % this.period) / this.period;
            // Ensure positive offset
            const normalizedOffset = periodsOffset >= 0 ?
                periodsOffset :
                1 + periodsOffset;
            // Map to output range
            return (this.outputRange.min +
                normalizedOffset * (this.outputRange.max - this.outputRange.min));
        }
        inverse(value) {
            // Note: For periodic mapping, this will return the first matching input
            // within the first period from the input minimum
            if (this.steps !== null) {
                return this.inverseQuantized(value);
            }
            if (this.period !== null) {
                return this.inversePeriodic(value);
            }
            throw new Error('Either steps or period must be specified');
        }
        inverseQuantized(value) {
            if (this.steps === null)
                throw new Error('Steps not specified');
            const normalizedValue = (value - this.outputRange.min) /
                (this.outputRange.max - this.outputRange.min);
            const quantized = Math.round(normalizedValue * (this.steps - 1)) / (this.steps - 1);
            return (this.inputRange.min +
                quantized * (this.inputRange.max - this.inputRange.min));
        }
        inversePeriodic(value) {
            if (this.period === null)
                throw new Error('Period not specified');
            const normalizedValue = (value - this.outputRange.min) /
                (this.outputRange.max - this.outputRange.min);
            return this.inputRange.min + normalizedValue * this.period;
        }
    }
    class DateToSeasonMapper {
        hemisphere;
        // Represent the year as month-of-year (0-11)
        inputRange = { min: 0, max: 11 };
        // Four discrete seasons
        outputRange = { min: 0, max: 3 };
        constructor(hemisphere = 'northern') {
            this.hemisphere = hemisphere;
        }
        map(value) {
            const month = value.getMonth(); // 0 = January
            // Northern hemisphere: Spring = Mar-May, Summer = Jun-Aug, etc.
            const northern = [
                'Winter', 'Winter', // Jan, Feb
                'Spring', 'Spring', 'Spring', // Mar, Apr, May
                'Summer', 'Summer', 'Summer', // Jun, Jul, Aug
                'Autumn', 'Autumn', 'Autumn', // Sep, Oct, Nov
                'Winter' // Dec
            ];
            const season = northern[month];
            if (this.hemisphere === 'northern')
                return season;
            // Southern hemisphere: invert
            const opposite = {
                Spring: 'Autumn',
                Summer: 'Winter',
                Autumn: 'Spring',
                Winter: 'Summer'
            };
            return opposite[season];
        }
        inverse(value) {
            // Return the first day of the season in the current year
            const effectiveSeason = this.hemisphere === 'northern'
                ? value
                : { Spring: 'Autumn', Summer: 'Winter', Autumn: 'Spring', Winter: 'Summer' }[value];
            const startMonth = {
                Spring: 2, // March
                Summer: 5, // June
                Autumn: 8, // September
                Winter: 11 // December
            };
            const year = new Date().getFullYear();
            return new Date(year, startMonth[effectiveSeason], 1);
        }
    }

    var mapping = /*#__PURE__*/Object.freeze({
        __proto__: null,
        ClampedMapper: ClampedMapper,
        CosineMapper: CosineMapper,
        DateToSeasonMapper: DateToSeasonMapper,
        ExponentialMapper: ExponentialMapper,
        LinearMapper: LinearMapper,
        LogarithmicMapper: LogarithmicMapper,
        PiecewiseLinearMapper: PiecewiseLinearMapper,
        QuadraticMapper: QuadraticMapper,
        QuantizedPeriodicMapper: QuantizedPeriodicMapper,
        SigmoidMapper: SigmoidMapper
    });

    /**
     * @fileoverview A generic heap implementation supporting custom comparison keys and flexible ordering.
     * @module Heap
     */
    /**
     * A generic heap (priority queue) implementation that supports custom comparison keys
     * and flexible ordering criteria.
     *
     * @template T - The type of items stored in the heap
     * @template K - The type of the comparison key used for ordering
     */
    class Heap {
        /** Internal storage: each entry caches its precomputed key. */
        data;
        /** Maps an item to its current index in `data`, enabling O(log n) updateKey. */
        indexMap;
        /** The comparison function used to order items. */
        compare;
        /** The function used to extract comparison keys from items. */
        getKey;
        /**
         * Creates a new heap instance.
         *
         * @param getKey - Function to extract comparison keys from items
         * @param compareFn - Optional comparison function (defaults to max heap ordering)
         * @param initialItems - Optional iterable of items to heapify in O(n)
         *
         * @throws {TypeError} If getKey or compareFn are not functions
         */
        constructor(getKey, compareFn = Heap.defaultMaxHeap, initialItems) {
            if (typeof getKey !== 'function') {
                throw new TypeError('getKey must be a function');
            }
            if (typeof compareFn !== 'function') {
                throw new TypeError('compareFn must be a function');
            }
            this.data = [];
            this.indexMap = new Map();
            this.compare = compareFn;
            this.getKey = getKey;
            if (initialItems !== undefined) {
                this.heapify([...initialItems]);
            }
        }
        /** Number of items in the heap. */
        get size() {
            return this.data.length;
        }
        /** True if the heap contains no items. */
        get isEmpty() {
            return this.data.length === 0;
        }
        /**
         * Returns the top item without removing it, or undefined if empty.
         *
         * Note: undefined is also a valid return when T itself includes undefined.
         * Use `size` or `isEmpty` to disambiguate if T allows undefined values.
         */
        peek() {
            return this.data[0]?.item;
        }
        /**
         * Returns true if the given item is currently in the heap.
         * O(1) thanks to the index map.
         */
        contains(item) {
            return this.indexMap.has(item);
        }
        /**
         * Adds a new item to the heap.
         *
         * @complexity O(log n)
         */
        insert(item) {
            if (item === null || item === undefined) {
                throw new TypeError('Cannot insert null or undefined into heap');
            }
            const entry = { item, key: this.getKey(item) };
            this.data.push(entry);
            const idx = this.data.length - 1;
            this.indexMap.set(item, idx);
            this._heapifyUp(idx);
        }
        /**
         * Removes and returns the top item, or undefined if empty.
         *
         * @complexity O(log n)
         */
        extract() {
            if (this.isEmpty)
                return undefined;
            const top = this.data[0];
            const last = this.data.pop();
            this.indexMap.delete(top.item);
            if (this.data.length > 0) {
                this.data[0] = last;
                this.indexMap.set(last.item, 0);
                this._heapifyDown(0);
            }
            return top.item;
        }
        /**
         * Removes an arbitrary item from the heap.
         *
         * @returns True if the item was found and removed
         * @complexity O(log n)
         */
        remove(item) {
            const idx = this.indexMap.get(item);
            if (idx === undefined)
                return false;
            const last = this.data.pop();
            this.indexMap.delete(item);
            // If we just popped the target itself, we're done.
            if (idx === this.data.length)
                return true;
            // Otherwise, place the last entry at idx and re-heapify in whichever
            // direction is needed (the new key may be greater or lesser than the old).
            const oldKey = this.data[idx].key;
            this.data[idx] = last;
            this.indexMap.set(last.item, idx);
            if (this.compare(last.key, oldKey)) {
                this._heapifyUp(idx);
            }
            else {
                this._heapifyDown(idx);
            }
            return true;
        }
        /**
         * Notifies the heap that the item's key has changed (because the caller
         * mutated the item, or because external state used by `getKey` changed).
         * The new key is recomputed and the heap is re-balanced.
         *
         * This replaces the previous broken `updateKey(item, updater)` API. The
         * caller is responsible for the actual mutation; the heap only re-orders.
         *
         * @returns True if the item was found and re-balanced
         * @complexity O(log n)
         *
         * @example
         * ```typescript
         * task.priority = 10;        // caller mutates
         * heap.notifyKeyChanged(task); // heap re-balances
         * ```
         */
        notifyKeyChanged(item) {
            const idx = this.indexMap.get(item);
            if (idx === undefined)
                return false;
            const oldKey = this.data[idx].key;
            const newKey = this.getKey(item);
            this.data[idx].key = newKey;
            if (this.compare(newKey, oldKey)) {
                this._heapifyUp(idx);
            }
            else if (this.compare(oldKey, newKey)) {
                this._heapifyDown(idx);
            }
            // If neither direction wins, the keys are equivalent under `compare`
            // and no movement is needed.
            return true;
        }
        /** Removes all items from the heap. */
        clear() {
            this.data = [];
            this.indexMap.clear();
        }
        /**
         * Returns a non-destructive snapshot of items in arbitrary (heap-array) order.
         * For sorted order, iterate the heap (which is destructive on a clone).
         */
        toArray() {
            return this.data.map(entry => entry.item);
        }
        /**
         * Builds a heap from an array of items in O(n).
         * Replaces any existing contents.
         *
         * @complexity O(n)
         */
        heapify(items) {
            if (!Array.isArray(items)) {
                throw new TypeError('items must be an array');
            }
            this.data = items.map(item => {
                if (item === null || item === undefined) {
                    throw new TypeError('Cannot insert null or undefined into heap');
                }
                return { item, key: this.getKey(item) };
            });
            this.indexMap.clear();
            for (let i = 0; i < this.data.length; i++) {
                this.indexMap.set(this.data[i].item, i);
            }
            // Last non-leaf index is floor(n/2) - 1.
            for (let i = Math.floor(this.data.length / 2) - 1; i >= 0; i--) {
                this._heapifyDown(i);
            }
        }
        /**
         * Merges another heap's items into this one in O(n + m) using bulk heapify
         * rather than O(n log(n+m)) repeated inserts.
         */
        merge(other) {
            if (!(other instanceof Heap)) {
                throw new TypeError('can only merge with another Heap instance');
            }
            const combined = this.data.map(e => e.item).concat(other.data.map(e => e.item));
            this.heapify(combined);
        }
        /**
         * Validates the heap property iteratively.
         *
         * @complexity O(n)
         */
        validateHeap() {
            const n = this.data.length;
            for (let i = 0; i < n; i++) {
                const left = this._left(i);
                const right = this._right(i);
                if (left < n && this._compareAt(left, i))
                    return false;
                if (right < n && this._compareAt(right, i))
                    return false;
            }
            return true;
        }
        // ---- private helpers ----
        _compareAt(i, j) {
            return this.compare(this.data[i].key, this.data[j].key);
        }
        _parent(i) {
            return (i - 1) >> 1;
        }
        _left(i) {
            return 2 * i + 1;
        }
        _right(i) {
            return 2 * i + 2;
        }
        _swap(i, j) {
            const a = this.data[i];
            const b = this.data[j];
            this.data[i] = b;
            this.data[j] = a;
            this.indexMap.set(a.item, j);
            this.indexMap.set(b.item, i);
        }
        _heapifyUp(i) {
            while (i > 0) {
                const parent = this._parent(i);
                if (!this._compareAt(i, parent))
                    break;
                this._swap(i, parent);
                i = parent;
            }
        }
        _heapifyDown(i) {
            const n = this.data.length;
            while (true) {
                let best = i;
                const left = this._left(i);
                const right = this._right(i);
                if (left < n && this._compareAt(left, best))
                    best = left;
                if (right < n && this._compareAt(right, best))
                    best = right;
                if (best === i)
                    break;
                this._swap(i, best);
                i = best;
            }
        }
        // ---- static helpers and factories ----
        static defaultMaxHeap(a, b) {
            return a > b;
        }
        static defaultMinHeap(a, b) {
            return a < b;
        }
        static createMaxHeap(getKey, initialItems) {
            return new Heap(getKey, Heap.defaultMaxHeap, initialItems);
        }
        static createMinHeap(getKey, initialItems) {
            return new Heap(getKey, Heap.defaultMinHeap, initialItems);
        }
        /**
         * Iterates items in heap order without mutating the original heap.
         * Implemented by cloning the underlying array (already a valid heap, so no
         * re-heapify needed) and extracting from the clone.
         */
        *[Symbol.iterator]() {
            // The source array is already a valid heap, so we can reuse its structure
            // directly in a sibling Heap rather than re-running heapify.
            const clone = new Heap(this.getKey, this.compare);
            clone.data = this.data.map(e => ({ item: e.item, key: e.key }));
            for (let i = 0; i < clone.data.length; i++) {
                clone.indexMap.set(clone.data[i].item, i);
            }
            while (!clone.isEmpty) {
                yield clone.extract();
            }
        }
    }

    class SpatialHash {
        dimensions;
        cellSize;
        positionOf;
        distance;
        idOf;
        /** cellKey → list of entries currently in that cell. */
        cells = new Map();
        /**
         * Identity → entry. Two backing maps so we can use the right key type:
         *   - `entriesById`  for keyed mode (string|number id)
         *   - `entriesByRef` for reference mode (T)
         * Only one is populated per instance, chosen at construction.
         */
        entriesById;
        entriesByRef;
        constructor(options) {
            if (!Number.isInteger(options.dimensions) || options.dimensions <= 0) {
                throw new Error(`dimensions must be a positive integer, got ${options.dimensions}`);
            }
            if (!(options.cellSize > 0) || !Number.isFinite(options.cellSize)) {
                throw new Error(`cellSize must be a positive finite number, got ${options.cellSize}`);
            }
            this.dimensions = options.dimensions;
            this.cellSize = options.cellSize;
            this.positionOf = options.positionOf;
            this.distance = options.distance;
            this.idOf = options.idOf;
            if (this.idOf) {
                this.entriesById = new Map();
            }
            else {
                this.entriesByRef = new Map();
            }
        }
        get size() {
            return this.entriesById ? this.entriesById.size : this.entriesByRef.size;
        }
        // ---------- internals: hashing & lookup ----------
        /**
         * Validate that a vector has the configured dimensionality. The `Vector`
         * class enforces this at construction time, but a caller could still pass
         * the wrong specialization (a `Vector<2>` to a 3D hash); we re-check here
         * to fail fast with a clear message rather than indexing past the end.
         */
        checkDim(v, label) {
            if (v.dimension !== this.dimensions) {
                throw new Error(`${label} has dimension ${v.dimension}, expected ${this.dimensions}`);
            }
        }
        /**
         * World coord → cell coord. `Math.floor` (not truncation) so negative
         * coordinates round toward -∞, giving a continuous integer grid across
         * the origin: -0.1 → -1, not 0. This is essential for radius/box queries
         * that straddle the origin.
         */
        cellOf(position, out) {
            const cs = this.cellSize;
            for (let d = 0; d < this.dimensions; d++) {
                out[d] = Math.floor(position.get(d) / cs);
            }
            return out;
        }
        /** Stable string key for a cell coord tuple. */
        keyOf(cell) {
            // Manual join: marginally faster than `Array.from(cell).join(',')`
            // and avoids the allocation of an intermediate Array.
            let key = '' + cell[0];
            for (let d = 1; d < this.dimensions; d++) {
                key += ',';
                key += cell[d];
            }
            return key;
        }
        getEntry(item) {
            if (this.entriesById) {
                return this.entriesById.get(this.idOf(item));
            }
            return this.entriesByRef.get(item);
        }
        setEntry(item, entry) {
            if (this.entriesById) {
                this.entriesById.set(this.idOf(item), entry);
            }
            else {
                this.entriesByRef.set(item, entry);
            }
        }
        deleteEntry(item) {
            if (this.entriesById) {
                return this.entriesById.delete(this.idOf(item));
            }
            return this.entriesByRef.delete(item);
        }
        /**
         * Push an entry into the cell bucket for `entry.cellKey`. Buckets are
         * lazy: empty cells don't appear in the map at all.
         */
        addToCell(entry) {
            let bucket = this.cells.get(entry.cellKey);
            if (bucket === undefined) {
                bucket = [];
                this.cells.set(entry.cellKey, bucket);
            }
            bucket.push(entry);
        }
        /**
         * Remove an entry from its current cell bucket. We swap-pop (move the
         * last element into the removed slot) so removal is O(1) per bucket;
         * order within a cell doesn't matter.
         */
        removeFromCell(entry) {
            const bucket = this.cells.get(entry.cellKey);
            if (bucket === undefined)
                return; // shouldn't happen, but defensive
            const idx = bucket.indexOf(entry);
            if (idx === -1)
                return;
            const last = bucket.length - 1;
            if (idx !== last)
                bucket[idx] = bucket[last];
            bucket.pop();
            if (bucket.length === 0)
                this.cells.delete(entry.cellKey);
        }
        // ---------- mutation API ----------
        insert(item) {
            const existing = this.getEntry(item);
            if (existing !== undefined) {
                // Per spec: when keyed (idOf provided) and id already present, behave
                // as `move`. Without idOf we'd be in entriesByRef mode and "same
                // reference inserted twice" would also land here — which the spec
                // says double-counts, but only without idOf. We satisfy the
                // double-count clause by guarding on idOf:
                if (this.idOf) {
                    // Keyed upsert: replace the stored reference with the new
                    // one (so future positionOf calls see the caller's latest
                    // object), then move it to its current cell.
                    existing.item = item;
                    this.move(item);
                    return;
                }
                // Fall through and add a *second* entry for the same reference.
                // (This matches the documented behavior. It's an unusual path.)
            }
            const pos = this.positionOf(item);
            this.checkDim(pos, 'item position');
            const cell = new Int32Array(this.dimensions);
            this.cellOf(pos, cell);
            const cellKey = this.keyOf(cell);
            const entry = { item, cell, cellKey };
            // Without idOf, `setEntry` overwrites the previous entry for this
            // reference — but we want both entries indexed. Handle that case:
            if (!this.idOf && existing !== undefined) {
                // Two entries for the same ref: addToCell only; do NOT touch the
                // ref→entry map, leaving `existing` reachable for has/remove.
                this.addToCell(entry);
                // Note: `remove` will only find `existing`; the duplicate becomes
                // unreachable through the public API. This is an acknowledged
                // sharp edge of using the hash without idOf — documented on the
                // interface — and the user is on the hook.
                return;
            }
            this.setEntry(item, entry);
            this.addToCell(entry);
        }
        insertMany(items) {
            for (const item of items)
                this.insert(item);
        }
        remove(item) {
            const entry = this.getEntry(item);
            if (entry === undefined)
                return false;
            this.removeFromCell(entry);
            this.deleteEntry(item);
            return true;
        }
        move(item) {
            const entry = this.getEntry(item);
            if (entry === undefined)
                return false;
            const pos = this.positionOf(item);
            this.checkDim(pos, 'item position');
            // Compute the new cell tuple in-place into a scratch, then compare
            // component-wise. If unchanged, we can skip touching the bucket.
            const newCell = new Int32Array(this.dimensions);
            this.cellOf(pos, newCell);
            let changed = false;
            for (let d = 0; d < this.dimensions; d++) {
                if (newCell[d] !== entry.cell[d]) {
                    changed = true;
                    break;
                }
            }
            if (!changed)
                return true; // still in the right bucket — nothing to do
            // Rebucket. We mutate the entry in place rather than allocate a new
            // one, so external references (none right now, but defensive) stay
            // valid.
            this.removeFromCell(entry);
            entry.cell.set(newCell);
            entry.cellKey = this.keyOf(newCell);
            this.addToCell(entry);
            return true;
        }
        clear() {
            this.cells.clear();
            this.entriesById?.clear();
            this.entriesByRef?.clear();
        }
        has(item) {
            return this.getEntry(item) !== undefined;
        }
        // ---------- queries ----------
        /**
         * Iterate all cells whose integer coords lie within `[minCell, maxCell]`
         * (inclusive on both ends). Yields each non-empty bucket exactly once.
         * Implemented as an odometer-style nested loop generalized to D dims.
         */
        *cellsInRange(minCell, maxCell) {
            const D = this.dimensions;
            const cur = new Int32Array(D);
            for (let d = 0; d < D; d++)
                cur[d] = minCell[d];
            // Quick bail: any axis where min > max means an empty range.
            for (let d = 0; d < D; d++) {
                if (minCell[d] > maxCell[d])
                    return;
            }
            while (true) {
                const key = this.keyOf(cur);
                const bucket = this.cells.get(key);
                if (bucket !== undefined)
                    yield bucket;
                // Increment odometer: bump dim 0, carry into higher dims when
                // we pass maxCell[d]. Done when the highest dim overflows.
                let d = 0;
                while (d < D) {
                    cur[d]++;
                    if (cur[d] <= maxCell[d])
                        break;
                    cur[d] = minCell[d];
                    d++;
                }
                if (d === D)
                    return;
            }
        }
        *queryRadius(center, radius) {
            this.checkDim(center, 'query center');
            if (!(radius >= 0) || !Number.isFinite(radius)) {
                throw new Error(`radius must be a non-negative finite number, got ${radius}`);
            }
            const cs = this.cellSize;
            const D = this.dimensions;
            // Cell-bounding-box for the query sphere. Using floor on both ends
            // gives us the inclusive integer span.
            const minCell = new Int32Array(D);
            const maxCell = new Int32Array(D);
            for (let d = 0; d < D; d++) {
                const c = center.get(d);
                minCell[d] = Math.floor((c - radius) / cs);
                maxCell[d] = Math.floor((c + radius) / cs);
            }
            for (const bucket of this.cellsInRange(minCell, maxCell)) {
                for (let i = 0; i < bucket.length; i++) {
                    const entry = bucket[i];
                    const pos = this.positionOf(entry.item);
                    const dist = this.distance(center, pos);
                    // Narrow-phase: cell-bbox can include points outside the sphere.
                    if (dist <= radius) {
                        yield { item: entry.item, position: pos, distance: dist };
                    }
                }
            }
        }
        *queryBox(box) {
            this.checkDim(box.min, 'box.min');
            this.checkDim(box.max, 'box.max');
            const cs = this.cellSize;
            const D = this.dimensions;
            const minCell = new Int32Array(D);
            const maxCell = new Int32Array(D);
            for (let d = 0; d < D; d++) {
                minCell[d] = Math.floor(box.min.get(d) / cs);
                maxCell[d] = Math.floor(box.max.get(d) / cs);
            }
            for (const bucket of this.cellsInRange(minCell, maxCell)) {
                for (let i = 0; i < bucket.length; i++) {
                    const entry = bucket[i];
                    const pos = this.positionOf(entry.item);
                    // Narrow-phase: the boundary cells contain points outside the box.
                    let inside = true;
                    for (let d = 0; d < D; d++) {
                        const v = pos.get(d);
                        if (v < box.min.get(d) || v > box.max.get(d)) {
                            inside = false;
                            break;
                        }
                    }
                    if (inside)
                        yield entry.item;
                }
            }
        }
        /**
         * k-NN by ring expansion.
         *
         * Strategy: start with the cell containing the query point, then grow a
         * cube of `radius` cells outward. After each ring, we know that any item
         * not yet seen is at least `(radius) * cellSize` away from the center
         * along some axis (a lower bound — actual distance can be larger). So we
         * can stop expanding once we have k candidates *and* the worst kept
         * candidate's distance is ≤ that lower bound.
         *
         * The candidates are kept in a max-heap of size k (keyed by distance) so
         * we can drop the farthest in O(log k) when a closer one shows up. Same
         * pattern used in the KD-tree's `nearestNeighbors`.
         */
        queryKNearest(center, k) {
            this.checkDim(center, 'query center');
            if (!Number.isInteger(k) || k < 0) {
                throw new Error(`k must be a non-negative integer, got ${k}`);
            }
            if (k === 0 || this.size === 0)
                return [];
            const D = this.dimensions;
            const cs = this.cellSize;
            const centerCell = new Int32Array(D);
            this.cellOf(center, centerCell);
            // Max-heap on distance: peek() is the worst kept candidate, which is
            // exactly what we need to (a) decide whether a new candidate beats it,
            // and (b) compare against the lower bound for the termination check.
            const heap = Heap.createMaxHeap(hit => hit.distance);
            const consider = (hit) => {
                if (heap.size < k) {
                    heap.insert(hit);
                }
                else if (hit.distance < heap.peek().distance) {
                    heap.extract();
                    heap.insert(hit);
                }
            };
            // Track which cells we've already visited as we expand.
            const visited = new Set();
            const minCell = new Int32Array(D);
            const maxCell = new Int32Array(D);
            // The "shell" at radius r is the set of cells in the cube of half-side
            // r around centerCell, minus the cube of half-side (r-1). For r=0,
            // it's just centerCell. We avoid double-visiting via the `visited`
            // set rather than explicit shell math, which is fiddly in D dims.
            let r = 0;
            const maxR = this.maxRingRadius(centerCell);
            while (true) {
                for (let d = 0; d < D; d++) {
                    minCell[d] = centerCell[d] - r;
                    maxCell[d] = centerCell[d] + r;
                }
                for (const bucket of this.cellsInRange(minCell, maxCell)) {
                    // We need a stable id for the bucket so we can dedupe across
                    // shells. The bucket's cellKey is exactly that — but we don't
                    // have it here without re-deriving. Trick: stash it on the
                    // first entry (every entry in a bucket shares the same key).
                    if (bucket.length === 0)
                        continue;
                    const key = bucket[0].cellKey;
                    if (visited.has(key))
                        continue;
                    visited.add(key);
                    for (let i = 0; i < bucket.length; i++) {
                        const entry = bucket[i];
                        const pos = this.positionOf(entry.item);
                        const dist = this.distance(center, pos);
                        consider({ item: entry.item, position: pos, distance: dist });
                    }
                }
                // Termination check. We can stop expanding when:
                //   1. We have k candidates, AND
                //   2. The worst kept distance ≤ lower bound for items in
                //      shells beyond r.
                //
                // The lower bound: any cell strictly outside the cube of radius
                // r is at least `r * cs` away from the center along the axis
                // that put it outside. So items there are ≥ `r * cs` distant.
                //
                // BUT: that lower bound assumes Euclidean (or any metric where
                // axis-aligned distance is a lower bound on the metric). If the
                // user supplied a custom distance, this assumption can break.
                // We document the limitation and accept it: alternative metrics
                // get a correct-but-possibly-slower answer because they may keep
                // expanding. They'll still terminate via maxR.
                if (heap.size >= k) {
                    const worstKept = heap.peek().distance;
                    const lowerBound = r * cs;
                    if (worstKept <= lowerBound)
                        break;
                }
                if (r >= maxR)
                    break;
                r++;
            }
            // Drain the heap. Extracting from a max-heap gives us worst-first,
            // so we push into the array and reverse for ascending-by-distance.
            const out = [];
            while (!heap.isEmpty) {
                out.push(heap.extract());
            }
            out.reverse();
            return out;
        }
        /**
         * An upper bound on how far we'd ever need to expand from `centerCell`
         * to be sure we've seen every populated cell. We compute it from the
         * actual extent of the populated cells so we don't loop forever in
         * sparse hashes. This is O(#cells), called once per kNN query.
         */
        maxRingRadius(centerCell) {
            const D = this.dimensions;
            let maxR = 0;
            for (const key of this.cells.keys()) {
                // Parse the key. We deliberately don't store cell coords on the
                // bucket itself (only on entries) to keep buckets small; reparsing
                // the key here is fine — it's a per-query overhead, not per-item.
                let start = 0;
                for (let d = 0; d < D; d++) {
                    let end = key.indexOf(',', start);
                    if (end === -1)
                        end = key.length;
                    const c = parseInt(key.substring(start, end), 10);
                    const dist = Math.abs(c - centerCell[d]);
                    if (dist > maxR)
                        maxR = dist;
                    start = end + 1;
                }
            }
            return maxR;
        }
        *items() {
            if (this.entriesById) {
                for (const entry of this.entriesById.values())
                    yield entry.item;
            }
            else {
                for (const entry of this.entriesByRef.values())
                    yield entry.item;
            }
        }
    }

    /**
     * @fileoverview A self-balancing k-dimensional tree for efficient spatial queries.
     * @module KDTree
     */
    /**
     * A self-balancing k-dimensional tree.
     *
     * Two construction modes:
     * - `new KDTree({ distanceFn })` then `insert(...)` repeatedly (online).
     * - `KDTree.build(points, ids, { distanceFn })` for one-shot balanced
     *   construction in O(n log n) when all points are known up front.
     *
     * Online inserts/removes are kept balanced via the scapegoat strategy: when
     * an insertion creates a subtree where one child holds more than `alpha`
     * fraction of that subtree's nodes, the smallest such ancestor is rebuilt
     * from scratch. This gives O(log n) amortized insert and O(log n) search
     * regardless of insertion order.
     *
     * @template D - Number of spatial dimensions.
     * @template I - Type of the point identifier (defaults to `string | number`).
     */
    class KDTree {
        root = null;
        distanceFn;
        sqDistFn;
        alpha;
        _dimensions;
        /** Index of every id currently in the tree, for O(1) `has` and lookup. */
        idIndex = new Map();
        /**
         * Number of inserts/removes since the last full rebuild. Combined with
         * `maxSizeSinceRebuild`, this lets us trigger a full rebuild on remove-
         * heavy workloads (where scapegoat alone is insufficient).
         */
        opsSinceRebuild = 0;
        maxSizeSinceRebuild = 0;
        constructor(options) {
            if (typeof options.distanceFn !== 'function') {
                throw new TypeError('distanceFn must be a function');
            }
            const alpha = options.alpha ?? 0.7;
            if (!(alpha > 0.5 && alpha < 1)) {
                throw new RangeError(`alpha must be in (0.5, 1), got ${alpha}`);
            }
            this.distanceFn = options.distanceFn;
            this.sqDistFn = options.squaredDistanceFn ?? null;
            this.alpha = alpha;
            this._dimensions = options.dimensions ?? null;
        }
        /**
         * Builds a balanced KD-tree from the given points in O(n log n).
         * Use this when you have all points up front — it produces a perfectly
         * balanced tree, unlike repeated `insert` which only stays approximately
         * balanced.
         *
         * @throws Error if `points.length !== ids.length` or if any id is duplicated.
         */
        static build(points, ids, options) {
            if (points.length !== ids.length) {
                throw new Error(`points and ids must have same length (${points.length} vs ${ids.length})`);
            }
            const tree = new KDTree(options);
            if (points.length === 0)
                return tree;
            // Validate uniqueness and dimension up front.
            const dim = points[0].dimension;
            tree._dimensions = options.dimensions ?? dim;
            const seen = new Set();
            for (let i = 0; i < ids.length; i++) {
                if (seen.has(ids[i])) {
                    throw new Error(`duplicate id: ${String(ids[i])}`);
                }
                seen.add(ids[i]);
                if (points[i].dimension !== tree._dimensions) {
                    throw new Error(`point ${i} has dimension ${points[i].dimension}, expected ${tree._dimensions}`);
                }
            }
            // Build a flat array of entries we can sort/partition in place.
            const entries = points.map((point, i) => ({
                point,
                id: ids[i],
            }));
            tree.root = tree._buildBalanced(entries, 0, 0, entries.length - 1);
            tree.maxSizeSinceRebuild = entries.length;
            return tree;
        }
        /** Number of points currently in the tree. */
        get size() {
            return this.idIndex.size;
        }
        /** Spatial dimensionality, or null if the tree has never seen a point. */
        get dimensions() {
            return this._dimensions;
        }
        /** True if no points are in the tree. */
        get isEmpty() {
            return this.idIndex.size === 0;
        }
        /** O(1). True if `id` is in the tree. */
        has(id) {
            return this.idIndex.has(id);
        }
        /** O(1). Returns the point associated with `id`, or undefined. */
        getPoint(id) {
            return this.idIndex.get(id)?.point;
        }
        /**
         * Inserts a new point.
         *
         * @throws Error if the id is already present, or if `point.dimension`
         * disagrees with the tree's dimensionality.
         * @complexity O(log n) amortized.
         */
        insert(point, id) {
            if (this.idIndex.has(id)) {
                throw new Error(`id ${String(id)} already exists in tree`);
            }
            if (this._dimensions === null) {
                this._dimensions = point.dimension;
            }
            else if (point.dimension !== this._dimensions) {
                throw new Error(`point has dimension ${point.dimension}, expected ${this._dimensions}`);
            }
            // Walk down the tree, recording the path so we can detect a scapegoat
            // and update subtree sizes on the way back up.
            const newNode = { point, id, left: null, right: null, size: 1 };
            this.idIndex.set(id, newNode);
            if (this.root === null) {
                this.root = newNode;
                this.opsSinceRebuild++;
                this.maxSizeSinceRebuild = Math.max(this.maxSizeSinceRebuild, this.size);
                return;
            }
            // Path of (parent, isLeftChild) pairs from root to insertion point.
            const path = [];
            let cur = this.root;
            let depth = 0;
            while (true) {
                const dimIdx = depth % this._dimensions;
                const goLeft = point.get(dimIdx) < cur.point.get(dimIdx);
                path.push({ node: cur, wentLeft: goLeft });
                const child = goLeft ? cur.left : cur.right;
                if (child === null) {
                    if (goLeft)
                        cur.left = newNode;
                    else
                        cur.right = newNode;
                    break;
                }
                cur = child;
                depth++;
            }
            // Update sizes on the path; find scapegoat (deepest unbalanced ancestor).
            // We walk root → leaf so we can rebuild the *highest* unbalanced
            // ancestor, which gives the strongest amortized guarantee.
            let scapegoatIdx = -1;
            let scapegoatDepth = -1;
            for (let i = 0; i < path.length; i++) {
                path[i].node.size++;
                const sz = path[i].node.size;
                const leftSz = path[i].node.left?.size ?? 0;
                const rightSz = path[i].node.right?.size ?? 0;
                if (leftSz > this.alpha * sz || rightSz > this.alpha * sz) {
                    if (scapegoatIdx === -1) {
                        scapegoatIdx = i;
                        scapegoatDepth = i;
                    }
                }
            }
            if (scapegoatIdx !== -1) {
                this._rebuildAt(path, scapegoatIdx, scapegoatDepth);
            }
            this.opsSinceRebuild++;
            this.maxSizeSinceRebuild = Math.max(this.maxSizeSinceRebuild, this.size);
        }
        /**
         * Removes the point with the given id.
         * @returns True if the id was present and removed.
         * @complexity O(log n) amortized.
         */
        remove(id) {
            if (!this.idIndex.has(id))
                return false;
            this.root = this._removeRecursive(this.root, id, 0);
            this.idIndex.delete(id);
            this.opsSinceRebuild++;
            // Remove-heavy workloads can leave the tree at low utilization (lots of
            // promoted-from-min-of-right-subtree nodes that drift toward imbalance).
            // If we've done many ops since the last rebuild relative to the high-
            // water-mark size, do a full rebuild.
            if (this.opsSinceRebuild > Math.max(16, this.maxSizeSinceRebuild)) {
                this._fullRebuild();
            }
            return true;
        }
        /**
         * Moves a point to a new position. More efficient than remove + insert
         * because it can short-circuit if the point hasn't actually moved.
         *
         * Note: this currently still does a remove + insert internally. The
         * separate API exists so we don't force callers to remember the old
         * point (the previous `update(point, id, newPoint)` was error-prone).
         *
         * @throws Error if id is not present, or if `newPoint.dimension` disagrees.
         * @complexity O(log n) amortized.
         */
        move(id, newPoint) {
            if (!this.idIndex.has(id)) {
                throw new Error(`id ${String(id)} not found in tree`);
            }
            this.remove(id);
            this.insert(newPoint, id);
        }
        /**
         * Finds the k nearest neighbors of `query`, sorted by ascending distance.
         *
         * @param query - The query point.
         * @param k - Number of neighbors to return (default 1).
         * @param maxDistance - Optional. Only return points within this distance.
         * @complexity O(log n) on average, O(n) worst case in high dimensions.
         */
        nearestNeighbors(query, k = 1, maxDistance) {
            if (k <= 0 || this.root === null)
                return [];
            if (this._dimensions !== null && query.dimension !== this._dimensions) {
                throw new Error(`query has dimension ${query.dimension}, expected ${this._dimensions}`);
            }
            // Use squared distances internally if available — pruning works in any
            // monotonic transform of distance, so this saves n sqrt calls.
            const useSquared = this.sqDistFn !== null;
            const distFn = useSquared ? this.sqDistFn : this.distanceFn;
            const maxDistInternal = maxDistance === undefined
                ? undefined
                : useSquared
                    ? maxDistance * maxDistance
                    : maxDistance;
            // A max-heap of size ≤ k keyed by distance. The root is the worst
            // current candidate, which is exactly what we need to (a) decide
            // whether to insert a new candidate, and (b) prune subtrees.
            const heap = Heap.createMaxHeap(n => n.distance);
            const dims = this._dimensions;
            const search = (node, depth) => {
                if (node === null)
                    return;
                const dist = distFn(query, node.point);
                if (maxDistInternal === undefined || dist <= maxDistInternal) {
                    if (heap.size < k) {
                        heap.insert({ point: node.point, id: node.id, distance: dist });
                    }
                    else if (dist < heap.peek().distance) {
                        heap.extract();
                        heap.insert({ point: node.point, id: node.id, distance: dist });
                    }
                }
                const dimIdx = depth % dims;
                const axisDiff = query.get(dimIdx) - node.point.get(dimIdx);
                const closer = axisDiff < 0 ? node.left : node.right;
                const farther = axisDiff < 0 ? node.right : node.left;
                search(closer, depth + 1);
                // Pruning: only descend to the farther side if it could contain a
                // candidate better than the current worst (or if we don't yet have k).
                // The split-distance is along a single axis; in squared space we
                // compare against `axisDiff * axisDiff` directly.
                const splitDistInternal = useSquared ? axisDiff * axisDiff : Math.abs(axisDiff);
                const worstDist = heap.size === k ? heap.peek().distance : Infinity;
                if ((heap.size < k || splitDistInternal < worstDist) &&
                    (maxDistInternal === undefined || splitDistInternal <= maxDistInternal)) {
                    search(farther, depth + 1);
                }
            };
            search(this.root, 0);
            // Drain the heap. Heap iteration is in heap order (max-first here),
            // so we collect and reverse to get ascending distance.
            const out = [];
            while (!heap.isEmpty) {
                const n = heap.extract();
                out.push({
                    point: n.point,
                    id: n.id,
                    distance: useSquared ? Math.sqrt(n.distance) : n.distance,
                });
            }
            out.reverse();
            return out;
        }
        /**
         * Finds all points within `radius` of `query`. Order is unspecified.
         *
         * @complexity O(log n + r) where r is the number of results.
         */
        pointsInRadius(query, radius) {
            if (this.root === null || radius < 0)
                return [];
            if (this._dimensions !== null && query.dimension !== this._dimensions) {
                throw new Error(`query has dimension ${query.dimension}, expected ${this._dimensions}`);
            }
            const useSquared = this.sqDistFn !== null;
            const distFn = useSquared ? this.sqDistFn : this.distanceFn;
            const radiusInternal = useSquared ? radius * radius : radius;
            const dims = this._dimensions;
            const out = [];
            const visit = (node, depth) => {
                if (node === null)
                    return;
                const dist = distFn(query, node.point);
                if (dist <= radiusInternal) {
                    out.push({
                        point: node.point,
                        id: node.id,
                        distance: useSquared ? Math.sqrt(dist) : dist,
                    });
                }
                const dimIdx = depth % dims;
                const axisDiff = query.get(dimIdx) - node.point.get(dimIdx);
                const splitDistInternal = useSquared ? axisDiff * axisDiff : Math.abs(axisDiff);
                if (axisDiff < 0) {
                    visit(node.left, depth + 1);
                    if (splitDistInternal <= radiusInternal)
                        visit(node.right, depth + 1);
                }
                else {
                    visit(node.right, depth + 1);
                    if (splitDistInternal <= radiusInternal)
                        visit(node.left, depth + 1);
                }
            };
            visit(this.root, 0);
            return out;
        }
        /**
         * Finds points within an axis-aligned bounding box.
         *
         * @param min - Lower corner.
         * @param max - Upper corner.
         * @param options.includeMin - Include points exactly on the lower bound (default true).
         * @param options.includeMax - Include points exactly on the upper bound (default true).
         *
         * @example
         * ```typescript
         * tree.pointsInRange(new V([0, 0]), new V([1, 1]));
         * tree.pointsInRange(new V([0, 0]), new V([1, 1]), { includeMax: false });
         * ```
         *
         * @complexity O(sqrt(n) + r) for 2D balanced trees, with similar bounds in
         *             higher dimensions when the box is small relative to the data.
         */
        pointsInRange(min, max, options = {}) {
            const includeMin = options.includeMin ?? true;
            const includeMax = options.includeMax ?? true;
            const out = [];
            if (this.root === null)
                return out;
            const dims = this._dimensions;
            const visit = (node, depth) => {
                if (node === null)
                    return;
                if (this._isInBox(node.point, min, max, includeMin, includeMax)) {
                    out.push({ point: node.point, id: node.id });
                }
                const dimIdx = depth % dims;
                const nodeCoord = node.point.get(dimIdx);
                const minCoord = min.get(dimIdx);
                const maxCoord = max.get(dimIdx);
                // Recurse left iff some point in the left subtree could be in the
                // range — i.e. the lower bound on this axis is ≤ the node's coord.
                const leftOk = includeMin ? minCoord <= nodeCoord : minCoord < nodeCoord;
                if (leftOk)
                    visit(node.left, depth + 1);
                // Recurse right iff the upper bound on this axis is ≥ the node's coord.
                // (Equality matters because the right subtree contains points with
                // coord ≥ nodeCoord under our insertion rule.)
                const rightOk = includeMax ? maxCoord >= nodeCoord : maxCoord > nodeCoord;
                if (rightOk)
                    visit(node.right, depth + 1);
            };
            visit(this.root, 0);
            return out;
        }
        /** Removes all points. */
        clear() {
            this.root = null;
            this.idIndex.clear();
            this.opsSinceRebuild = 0;
            this.maxSizeSinceRebuild = 0;
        }
        /** Forces a full balanced rebuild. Mostly useful for testing. */
        rebuild() {
            this._fullRebuild();
        }
        /** Iterates `{point, id}` pairs in unspecified order. */
        *[Symbol.iterator]() {
            for (const node of this.idIndex.values()) {
                yield { point: node.point, id: node.id };
            }
        }
        // ---- private helpers ----
        _removeRecursive(node, id, depth) {
            if (node === null)
                return null;
            const dims = this._dimensions;
            const dimIdx = depth % dims;
            // We don't have the original point here (we removed it from the tracking
            // map), so we look it up via the id index.
            const target = this.idIndex.get(id);
            if (target === undefined)
                return node; // shouldn't happen
            if (node === target) {
                // Found the node to remove.
                if (node.right !== null) {
                    // Find the min along this axis in the right subtree, swap, recurse.
                    // We can't just use the leftmost node — KD trees split on different
                    // axes per level, so the in-order successor isn't well-defined. The
                    // axis-min-in-right-subtree trick is the standard approach.
                    const replacement = this._findMin(node.right, dimIdx, depth + 1);
                    const replacementId = replacement.id;
                    const replacementPoint = replacement.point;
                    // Recurse FIRST to delete the replacement from its original spot.
                    // We must do this before re-pointing idIndex[replacementId] at this
                    // node, otherwise the recursion sees the wrong target.
                    node.right = this._removeRecursive(node.right, replacementId, depth + 1);
                    node.point = replacementPoint;
                    node.id = replacementId;
                    this.idIndex.set(replacementId, node);
                }
                else if (node.left !== null) {
                    // KD-tree quirk: when there's no right child, we can't just promote
                    // the left child (its splitting axes would be misaligned). Instead,
                    // find min along this axis in the LEFT subtree, swap, then move
                    // the left subtree to become the right subtree and recurse.
                    const replacement = this._findMin(node.left, dimIdx, depth + 1);
                    const replacementId = replacement.id;
                    const replacementPoint = replacement.point;
                    const newRight = this._removeRecursive(node.left, replacementId, depth + 1);
                    node.point = replacementPoint;
                    node.id = replacementId;
                    this.idIndex.set(replacementId, node);
                    node.right = newRight;
                    node.left = null;
                }
                else {
                    return null;
                }
                this._recomputeSize(node);
                return node;
            }
            // Not this node — recurse based on splitting axis.
            if (target.point.get(dimIdx) < node.point.get(dimIdx)) {
                node.left = this._removeRecursive(node.left, id, depth + 1);
            }
            else {
                // Coord >= node's coord on this axis. By insertion rule, the target
                // is in the right subtree. (Equal-coord points always go right.)
                node.right = this._removeRecursive(node.right, id, depth + 1);
            }
            this._recomputeSize(node);
            return node;
        }
        /** Finds the node with minimum coord along `axis` in the subtree at `node`. */
        _findMin(node, axis, depth) {
            const dims = this._dimensions;
            const dimIdx = depth % dims;
            // If we're splitting on the target axis, the minimum is in the left
            // subtree if it exists, else this node.
            if (dimIdx === axis) {
                if (node.left === null)
                    return node;
                return this._findMin(node.left, axis, depth + 1);
            }
            // Otherwise, the min could be anywhere — check this node and both subtrees.
            let best = node;
            if (node.left !== null) {
                const leftMin = this._findMin(node.left, axis, depth + 1);
                if (leftMin.point.get(axis) < best.point.get(axis))
                    best = leftMin;
            }
            if (node.right !== null) {
                const rightMin = this._findMin(node.right, axis, depth + 1);
                if (rightMin.point.get(axis) < best.point.get(axis))
                    best = rightMin;
            }
            return best;
        }
        _recomputeSize(node) {
            node.size = 1 + (node.left?.size ?? 0) + (node.right?.size ?? 0);
        }
        /**
         * Rebuilds the subtree at `path[idx]` from scratch in balanced form.
         * `path[idx-1]` is the parent (or it's the root if idx === 0).
         */
        _rebuildAt(path, idx, depth) {
            const subtreeRoot = path[idx].node;
            const entries = [];
            this._collectEntries(subtreeRoot, entries);
            const rebuilt = this._buildBalanced(entries, depth, 0, entries.length - 1);
            if (idx === 0) {
                this.root = rebuilt;
            }
            else {
                const parent = path[idx - 1].node;
                if (path[idx - 1].wentLeft)
                    parent.left = rebuilt;
                else
                    parent.right = rebuilt;
            }
        }
        _collectEntries(node, out) {
            if (node === null)
                return;
            out.push({ point: node.point, id: node.id });
            this._collectEntries(node.left, out);
            this._collectEntries(node.right, out);
        }
        /**
         * Builds a balanced KD subtree from `entries[lo..hi]`. Mutates `entries`
         * in place via partial quickselect-style partitioning. Each internal node
         * is the median along the splitting axis at its depth.
         *
         * Also rebuilds the id-index entries for every node, since we're creating
         * fresh node objects.
         */
        _buildBalanced(entries, depth, lo, hi) {
            if (lo > hi)
                return null;
            const dims = this._dimensions;
            const dimIdx = depth % dims;
            const mid = (lo + hi) >> 1;
            this._quickselect(entries, lo, hi, mid, dimIdx);
            const e = entries[mid];
            const node = {
                point: e.point,
                id: e.id,
                left: null,
                right: null,
                size: hi - lo + 1,
            };
            this.idIndex.set(e.id, node);
            node.left = this._buildBalanced(entries, depth + 1, lo, mid - 1);
            node.right = this._buildBalanced(entries, depth + 1, mid + 1, hi);
            return node;
        }
        /**
         * Partitions `arr[lo..hi]` in place so that `arr[k]` is the element that
         * would sit at index `k` if the slice were sorted by `arr[i].point.get(axis)`,
         * and everything to the left is ≤ it, everything to the right is ≥ it.
         *
         * Standard Hoare-partition quickselect. Average O(hi - lo + 1) per call,
         * giving the overall O(n log n) build cost.
         */
        _quickselect(arr, lo, hi, k, axis) {
            while (lo < hi) {
                // Median-of-three pivot selection to avoid worst-case on sorted input.
                const mid = (lo + hi) >> 1;
                const a = arr[lo].point.get(axis);
                const b = arr[mid].point.get(axis);
                const c = arr[hi].point.get(axis);
                let pivotIdx;
                if ((a <= b && b <= c) || (c <= b && b <= a))
                    pivotIdx = mid;
                else if ((b <= a && a <= c) || (c <= a && a <= b))
                    pivotIdx = lo;
                else
                    pivotIdx = hi;
                // Move pivot to end.
                [arr[pivotIdx], arr[hi]] = [arr[hi], arr[pivotIdx]];
                const pivotVal = arr[hi].point.get(axis);
                // Partition.
                let store = lo;
                for (let i = lo; i < hi; i++) {
                    if (arr[i].point.get(axis) < pivotVal) {
                        [arr[i], arr[store]] = [arr[store], arr[i]];
                        store++;
                    }
                }
                [arr[store], arr[hi]] = [arr[hi], arr[store]];
                if (store === k)
                    return;
                if (store < k)
                    lo = store + 1;
                else
                    hi = store - 1;
            }
        }
        /** Rebuilds the entire tree in balanced form. */
        _fullRebuild() {
            if (this.root === null) {
                this.opsSinceRebuild = 0;
                this.maxSizeSinceRebuild = 0;
                return;
            }
            const entries = [];
            this._collectEntries(this.root, entries);
            this.idIndex.clear();
            this.root = this._buildBalanced(entries, 0, 0, entries.length - 1);
            this.opsSinceRebuild = 0;
            this.maxSizeSinceRebuild = this.size;
        }
        _isInBox(point, min, max, includeMin, includeMax) {
            const dims = this._dimensions;
            for (let i = 0; i < dims; i++) {
                const v = point.get(i);
                const lo = min.get(i);
                const hi = max.get(i);
                if (includeMin ? v < lo : v <= lo)
                    return false;
                if (includeMax ? v > hi : v >= hi)
                    return false;
            }
            return true;
        }
    }

    /**
     * Object pool for managing Quadtree nodes
     */
    class NodePool {
        pool;
        maxSize;
        constructor(maxSize = 1000) {
            this.pool = [];
            this.maxSize = maxSize;
        }
        acquire(bounds, config, level) {
            if (this.pool.length > 0) {
                const node = this.pool.pop();
                node.reinitialize(bounds, config, level);
                return node;
            }
            return new BaseQuadtree(bounds, config, level, this);
        }
        release(node) {
            if (this.pool.length < this.maxSize) {
                node.clear();
                this.pool.push(node);
            }
        }
    }
    /**
     * Enhanced Quadtree implementation with improved performance and features
     */
    class BaseQuadtree {
        maxObjects;
        maxLevels;
        minNodeSize;
        adaptiveSplitting;
        nodePool;
        level;
        bounds;
        objects;
        nodes;
        /**
         * Creates a new Quadtree instance
         */
        constructor(bounds, config = {}, level = 0, nodePool) {
            this.validateConfig(config);
            this.validateBounds(bounds);
            this.maxObjects = config.maxObjects ?? 10;
            this.maxLevels = config.maxLevels ?? 4;
            this.minNodeSize = config.minNodeSize ?? 1;
            this.adaptiveSplitting = config.adaptiveSplitting ?? true;
            this.level = level;
            this.bounds = bounds;
            this.objects = [];
            this.nodes = [];
            this.nodePool = nodePool ?? new NodePool();
        }
        /**
         * Validates configuration parameters
         */
        validateConfig(config) {
            if (config.maxObjects !== undefined && config.maxObjects <= 0) {
                throw new Error('maxObjects must be positive');
            }
            if (config.maxLevels !== undefined && config.maxLevels <= 0) {
                throw new Error('maxLevels must be positive');
            }
            if (config.minNodeSize !== undefined && config.minNodeSize <= 0) {
                throw new Error('minNodeSize must be positive');
            }
        }
        /**
         * Validates bounds parameters
         */
        validateBounds(bounds) {
            if (bounds.width <= 0 || bounds.height <= 0) {
                throw new Error('Bounds dimensions must be positive');
            }
        }
        /**
         * Reinitializes the node for object pooling
         */
        reinitialize(bounds, _config, level) {
            this.bounds = bounds;
            this.level = level;
            this.objects = [];
            this.nodes = [];
        }
        /**
         * Checks if two rectangles intersect (AABB collision detection)
         */
        intersects(a, b) {
            return !(a.x + a.width < b.x ||
                b.x + b.width < a.x ||
                a.y + a.height < b.y ||
                b.y + b.height < a.y);
        }
        /**
         * Checks if rectangle a contains rectangle b
         */
        contains(a, b) {
            return (b.x >= a.x &&
                b.x + b.width <= a.x + a.width &&
                b.y >= a.y &&
                b.y + b.height <= a.y + a.height);
        }
        /**
         * Determines optimal split points based on object distribution
         */
        calculateSplitPoints() {
            if (!this.adaptiveSplitting || this.objects.length < 2) {
                return {
                    xSplit: this.bounds.x + this.bounds.width / 2,
                    ySplit: this.bounds.y + this.bounds.height / 2
                };
            }
            // Calculate weighted average of object centers
            let totalWeight = 0;
            let weightedX = 0;
            let weightedY = 0;
            for (const obj of this.objects) {
                const weight = obj.bounds.width * obj.bounds.height;
                const centerX = obj.bounds.x + obj.bounds.width / 2;
                const centerY = obj.bounds.y + obj.bounds.height / 2;
                totalWeight += weight;
                weightedX += centerX * weight;
                weightedY += centerY * weight;
            }
            return {
                xSplit: weightedX / totalWeight,
                ySplit: weightedY / totalWeight
            };
        }
        /**
         * Splits the node into four subnodes using adaptive splitting
         */
        split() {
            if (this.bounds.width <= this.minNodeSize * 2 ||
                this.bounds.height <= this.minNodeSize * 2) {
                return;
            }
            const { xSplit, ySplit } = this.calculateSplitPoints();
            const nextLevel = this.level + 1;
            // Create child nodes with optimal split points
            const createNode = (x, y, width, height) => this.nodePool.acquire({ x, y, width, height }, {
                maxObjects: this.maxObjects,
                maxLevels: this.maxLevels,
                minNodeSize: this.minNodeSize,
                adaptiveSplitting: this.adaptiveSplitting
            }, nextLevel);
            this.nodes = [
                // Top-left (0)
                createNode(this.bounds.x, this.bounds.y, xSplit - this.bounds.x, ySplit - this.bounds.y),
                // Top-right (1)
                createNode(xSplit, this.bounds.y, this.bounds.width - (xSplit - this.bounds.x), ySplit - this.bounds.y),
                // Bottom-left (2)
                createNode(this.bounds.x, ySplit, xSplit - this.bounds.x, this.bounds.height - (ySplit - this.bounds.y)),
                // Bottom-right (3)
                createNode(xSplit, ySplit, this.bounds.width - (xSplit - this.bounds.x), this.bounds.height - (ySplit - this.bounds.y))
            ];
        }
        /**
         * Gets nodes that an object belongs to
         */
        getIndex(rect) {
            if (!this.nodes.length)
                return [];
            // Each node represents a quadrant
            const indexes = [];
            // Check each quadrant
            for (let i = 0; i < this.nodes.length; i++) {
                if (this.contains(this.nodes[i].bounds, rect)) {
                    indexes.push(i);
                }
            }
            return indexes;
        }
        /**
         * Inserts an object into the quadtree
         */
        insert(obj) {
            if (!this.contains(this.bounds, obj.bounds)) {
                return;
            }
            if (this.nodes.length) {
                const indexes = this.getIndex(obj.bounds);
                if (indexes.length > 0) {
                    for (const index of indexes) {
                        this.nodes[index].insert(obj);
                    }
                    return;
                }
            }
            this.objects.push(obj);
            if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
                if (!this.nodes.length) {
                    this.split();
                }
                let i = 0;
                while (i < this.objects.length) {
                    const indexes = this.getIndex(this.objects[i].bounds);
                    if (indexes.length > 0) {
                        const obj = this.objects.splice(i, 1)[0];
                        for (const index of indexes) {
                            this.nodes[index].insert(obj);
                        }
                    }
                    else {
                        i++;
                    }
                }
            }
        }
        /**
         * Removes an object from the quadtree
         */
        remove(obj) {
            if (!this.contains(this.bounds, obj.bounds)) {
                return false;
            }
            let removed = false;
            // First try to remove from child nodes
            if (this.nodes.length) {
                const indexes = this.getIndex(obj.bounds);
                for (const index of indexes) {
                    if (this.nodes[index].remove(obj)) {
                        removed = true;
                    }
                }
            }
            // Then try to remove from current node's objects
            const index = this.objects.findIndex(o => o === obj);
            if (index !== -1) {
                this.objects.splice(index, 1);
                removed = true;
            }
            if (removed) {
                this.tryMerge();
            }
            return removed;
        }
        tryMerge() {
            if (!this.nodes.length)
                return;
            // Get all objects from child nodes
            let childObjects = [];
            for (const node of this.nodes) {
                const nodeObjects = node.getAllObjects();
                childObjects.push(...nodeObjects);
            }
            const totalObjects = this.objects.length + childObjects.length;
            if (totalObjects <= this.maxObjects) {
                // Merge all child objects into current node
                this.objects.push(...childObjects);
                // Clear and release child nodes
                for (const node of this.nodes) {
                    node.clear(); // Ensure child nodes are properly cleared
                    this.nodePool.release(node);
                }
                this.nodes = [];
            }
        }
        /**
         * Retrieves all objects that could collide with the given rectangle
         */
        intersections(rect) {
            const result = new Set();
            if (!this.intersects(this.bounds, rect)) {
                return Array.from(result);
            }
            for (const obj of this.objects) {
                if (this.intersects(obj.bounds, rect)) {
                    result.add(obj);
                }
            }
            if (this.nodes.length) {
                const indexes = this.getIndex(rect);
                for (const index of indexes) {
                    for (const obj of this.nodes[index].intersections(rect)) {
                        result.add(obj);
                    }
                }
            }
            return Array.from(result);
        }
        /**
         * Retrieves all objects which contain the given rectangle
         */
        containers(rect) {
            const result = new Set();
            if (!this.contains(this.bounds, rect)) {
                return Array.from(result);
            }
            for (const obj of this.objects) {
                if (this.contains(obj.bounds, rect)) {
                    result.add(obj);
                }
            }
            if (this.nodes.length) {
                const indexes = this.getIndex(rect);
                for (const index of indexes) {
                    for (const obj of this.nodes[index].containers(rect)) {
                        result.add(obj);
                    }
                }
            }
            return Array.from(result);
        }
        /**
         * Retrieves all objects contained in the given rectangle
         */
        within(rect) {
            const result = new Set();
            // First check if the query rectangle intersects with this node's bounds
            if (!this.intersects(this.bounds, rect)) {
                return Array.from(result);
            }
            // Add objects from this node that are within the query rectangle
            for (const obj of this.objects) {
                if (this.contains(rect, obj.bounds)) {
                    result.add(obj);
                }
            }
            // If we have child nodes, recursively check them
            if (this.nodes.length) {
                for (const node of this.nodes) {
                    const nodeResults = node.within(rect);
                    nodeResults.forEach(obj => result.add(obj));
                }
            }
            return Array.from(result);
        }
        /**
         * Performs k-nearest neighbor search
         */
        findKNearest(point, k) {
            const candidates = this.intersections({
                x: point.x - this.bounds.width,
                y: point.y - this.bounds.height,
                width: this.bounds.width * 2,
                height: this.bounds.height * 2
            });
            return candidates
                .sort((a, b) => {
                const aDist = this.getSquaredDistance(point, a.bounds);
                const bDist = this.getSquaredDistance(point, b.bounds);
                return aDist - bDist;
            })
                .slice(0, k);
        }
        /**
         * Calculates squared distance between a point and a rectangle
         */
        getSquaredDistance(point, rect) {
            const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
            const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
            return dx * dx + dy * dy;
        }
        /**
         * Returns all objects in this node and its children
         */
        getAllObjects() {
            const result = [...this.objects];
            for (const node of this.nodes) {
                result.push(...node.getAllObjects());
            }
            return result;
        }
        /**
         * Clears the quadtree
         */
        clear() {
            this.objects = [];
            for (const node of this.nodes) {
                this.nodePool.release(node);
            }
            this.nodes = [];
        }
        /**
         * Gets statistics about the quadtree
         */
        getStats() {
            let totalNodes = 1;
            let totalObjects = this.objects.length;
            let maxDepth = this.level;
            for (const node of this.nodes) {
                const stats = node.getStats();
                totalNodes += stats.totalNodes;
                totalObjects += stats.totalObjects;
                maxDepth = Math.max(maxDepth, stats.maxDepth);
            }
            return {
                totalNodes,
                totalObjects,
                maxDepth,
                averageObjectsPerNode: totalObjects / totalNodes
            };
        }
    }
    /**
     * Spatial grid for accelerating queries in dense nodes
     */
    class SpatialGrid {
        cells;
        cellSize;
        constructor(bounds, objectCount) {
            this.cells = new Map();
            // Adaptive cell size based on object density
            // Target ~2-3 objects per cell for optimal performance
            const area = bounds.width * bounds.height;
            this.cellSize = Math.max(Math.sqrt(area / (objectCount / 2)), Math.min(bounds.width, bounds.height) / 8);
        }
        getCellKey(x, y) {
            const gridX = Math.floor(x / this.cellSize);
            const gridY = Math.floor(y / this.cellSize);
            return `${gridX},${gridY}`;
        }
        getCellsForRect(rect) {
            const startX = Math.floor(rect.x / this.cellSize);
            const startY = Math.floor(rect.y / this.cellSize);
            const endX = Math.floor((rect.x + rect.width) / this.cellSize);
            const endY = Math.floor((rect.y + rect.height) / this.cellSize);
            const cells = new Set();
            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    cells.add(this.getCellKey(x * this.cellSize, y * this.cellSize));
                }
            }
            return cells;
        }
        insert(obj) {
            const cellKeys = this.getCellsForRect(obj.bounds);
            for (const key of cellKeys) {
                if (!this.cells.has(key)) {
                    this.cells.set(key, { objects: new Set() });
                }
                this.cells.get(key).objects.add(obj);
            }
        }
        remove(obj) {
            const cellKeys = this.getCellsForRect(obj.bounds);
            for (const key of cellKeys) {
                const cell = this.cells.get(key);
                if (cell) {
                    cell.objects.delete(obj);
                    if (cell.objects.size === 0) {
                        this.cells.delete(key);
                    }
                }
            }
        }
        query(rect) {
            const result = new Set();
            const cellKeys = this.getCellsForRect(rect);
            for (const key of cellKeys) {
                const cell = this.cells.get(key);
                if (cell) {
                    for (const obj of cell.objects) {
                        result.add(obj);
                    }
                }
            }
            return result;
        }
        clear() {
            this.cells.clear();
        }
    }
    /**
     * Enhanced BaseQuadtree with spatial grid acceleration
     */
    class OptimizedBaseQuadtree extends BaseQuadtree {
        spatialGrid = null;
        GRID_THRESHOLD = 20; // When to activate grid acceleration
        ensureGrid() {
            if (this.objects.length > this.GRID_THRESHOLD && !this.spatialGrid) {
                this.spatialGrid = new SpatialGrid(this.bounds, this.objects.length);
                // Populate grid with existing objects
                for (const obj of this.objects) {
                    this.spatialGrid.insert(obj);
                }
            }
        }
        insert(obj) {
            super.insert(obj);
            if (this.spatialGrid) {
                this.spatialGrid.insert(obj);
            }
            else if (this.objects.length > this.GRID_THRESHOLD) {
                this.ensureGrid();
            }
        }
        remove(obj) {
            const removed = super.remove(obj);
            if (removed && this.spatialGrid) {
                this.spatialGrid.remove(obj);
                // Disable grid if object count drops significantly
                if (this.objects.length < this.GRID_THRESHOLD / 2) {
                    this.spatialGrid = null;
                }
            }
            return removed;
        }
        intersections(rect) {
            if (!this.intersects(this.bounds, rect)) {
                return [];
            }
            const result = new Set();
            // Use grid acceleration if available
            if (this.spatialGrid) {
                const candidates = this.spatialGrid.query(rect);
                for (const obj of candidates) {
                    if (this.intersects(obj.bounds, rect)) {
                        result.add(obj);
                    }
                }
            }
            else {
                // Fall back to standard quadtree behavior
                for (const obj of this.objects) {
                    if (this.intersects(obj.bounds, rect)) {
                        result.add(obj);
                    }
                }
            }
            // Check child nodes
            if (this.nodes.length) {
                for (const node of this.nodes) {
                    const nodeResults = node.intersections(rect);
                    nodeResults.forEach(obj => result.add(obj));
                }
            }
            return Array.from(result);
        }
        within(rect) {
            if (!this.intersects(this.bounds, rect)) {
                return [];
            }
            const result = new Set();
            // Use grid acceleration if available
            if (this.spatialGrid) {
                const candidates = this.spatialGrid.query(rect);
                for (const obj of candidates) {
                    if (this.contains(rect, obj.bounds)) {
                        result.add(obj);
                    }
                }
            }
            else {
                // Fall back to standard quadtree behavior
                for (const obj of this.objects) {
                    if (this.contains(rect, obj.bounds)) {
                        result.add(obj);
                    }
                }
            }
            // Check child nodes
            if (this.nodes.length) {
                for (const node of this.nodes) {
                    const nodeResults = node.within(rect);
                    nodeResults.forEach(obj => result.add(obj));
                }
            }
            return Array.from(result);
        }
        findKNearest(point, k) {
            // Start with a small search radius
            let searchRadius = Math.min(this.bounds.width, this.bounds.height) / 10;
            let results = [];
            while (results.length < k) {
                const searchRect = {
                    x: point.x - searchRadius,
                    y: point.y - searchRadius,
                    width: searchRadius * 2,
                    height: searchRadius * 2
                };
                // Use optimized intersection query
                results = this.intersections(searchRect);
                if (results.length < k) {
                    // Double search radius if we don't have enough results
                    searchRadius *= 2;
                    // Break if we've searched the entire space
                    if (searchRadius > Math.max(this.bounds.width, this.bounds.height)) {
                        break;
                    }
                }
            }
            // Sort by distance and return k nearest
            return results
                .sort((a, b) => {
                const aDist = this.getSquaredDistance(point, a.bounds);
                const bDist = this.getSquaredDistance(point, b.bounds);
                return aDist - bDist;
            })
                .slice(0, k);
        }
        clear() {
            super.clear();
            if (this.spatialGrid) {
                this.spatialGrid.clear();
                this.spatialGrid = null;
            }
        }
    }
    // Concrete Split Strategies
    class BinarySplitStrategy {
        densityWeight;
        constructor(densityWeight = 1) {
            this.densityWeight = densityWeight;
        }
        split(bounds, _level, objects) {
            if (objects.length === 0) {
                return {
                    xSplit: bounds.x + bounds.width / 2,
                    ySplit: bounds.y + bounds.height / 2
                };
            }
            let totalWeight = 0;
            let weightedX = 0;
            let weightedY = 0;
            objects.forEach(obj => {
                const weight = Math.pow(1, this.densityWeight);
                totalWeight += weight;
                weightedX += obj.x * weight;
                weightedY += obj.y * weight;
            });
            return {
                xSplit: weightedX / totalWeight,
                ySplit: weightedY / totalWeight
            };
        }
    }
    class GoldenRatioSplitStrategy {
        PHI = 1.618033988749895;
        split(bounds) {
            return {
                xSplit: bounds.x + bounds.width / this.PHI,
                ySplit: bounds.y + bounds.height / this.PHI
            };
        }
    }
    class FibonacciSplitStrategy {
        // Golden ratio constant (φ)
        INVERSE_PHI = 1 / ((1 + Math.sqrt(5)) / 2); // ≈ 0.618033988749895
        getFibonacciRatio(_level) {
            // Always return inverse golden ratio for optimal splitting
            return this.INVERSE_PHI;
        }
        split(bounds, level) {
            const ratio = this.getFibonacciRatio(level);
            return {
                xSplit: bounds.x + bounds.width * ratio,
                ySplit: bounds.y + bounds.height * ratio
            };
        }
    }
    // Enhanced Quadtree with Split Strategy
    class Quadtree extends OptimizedBaseQuadtree {
        splitStrategy;
        constructor(bounds, config) {
            super(bounds, {
                maxObjects: config.maxObjects,
                maxLevels: config.maxLevels,
                minNodeSize: config.minNodeSize,
                adaptiveSplitting: true
            });
            this.splitStrategy = config.splitStrategy;
        }
        calculateSplitPoints() {
            const objects = this.objects.map((obj) => obj.data);
            return this.splitStrategy.split(this.bounds, this.level, objects);
        }
    }

    var index$p = /*#__PURE__*/Object.freeze({
        __proto__: null,
        BinarySplitStrategy: BinarySplitStrategy,
        FibonacciSplitStrategy: FibonacciSplitStrategy,
        GoldenRatioSplitStrategy: GoldenRatioSplitStrategy,
        KDTree: KDTree,
        Quadtree: Quadtree
    });

    /**
     * Disjoint-Set / Union-Find.
     *
     * Two flavors:
     *   - `IndexedUnionFind`: dense integer indices `[0, n)`, three `Int32Array`s.
     *   - `KeyedUnionFind<K>`: arbitrary keys, allocated lazily.
     *
     * Both use union-by-rank + path compression for near-O(α(n)) ops.
     */
    // --------------------------------------------------------------------------
    // IndexedUnionFind
    // --------------------------------------------------------------------------
    /**
     * Union-find over a fixed integer range `[0, size)`.
     *
     * Uses three `Int32Array`s of length `size`:
     *   - `parent[i]` — parent of `i` in the forest; `parent[i] === i` ⇒ `i` is a root.
     *   - `rank[i]`   — for roots, an upper bound on the tree's height (union-by-rank).
     *   - `_size[i]`  — for roots, the number of elements in the component.
     *
     * `rank` and `_size` carry different information (rank is bounded by ~log n;
     * size can be up to n) and are only meaningful on roots, so we keep them in
     * separate arrays. The Int32 overhead is negligible compared to the win in
     * clarity over packing both into one slot.
     */
    class IndexedUnionFind {
        parent;
        rank;
        _size; // component size, valid on roots
        _componentCount;
        _capacity;
        constructor(n) {
            if (!Number.isInteger(n) || n < 0) {
                throw new Error(`IIndexedUnionFind size must be a non-negative integer, got ${n}`);
            }
            this._capacity = n;
            this.parent = new Int32Array(n);
            this.rank = new Int32Array(n);
            this._size = new Int32Array(n);
            for (let i = 0; i < n; i++) {
                this.parent[i] = i;
                this._size[i] = 1;
            }
            this._componentCount = n;
        }
        get size() {
            return this._capacity;
        }
        get componentCount() {
            return this._componentCount;
        }
        /**
         * Iterative two-pass path compression: first walk up to find the root,
         * then walk again pointing every node directly at the root. Iterative
         * (rather than recursive) to avoid stack-overflow on long chains, which
         * are common before compression has kicked in.
         *
         * Note: `find` mutates internal pointers (path compression) but does not
         * change the *observable* state — `find(i)`, `connected`, `componentSize`,
         * `componentOf`, `components`, and `labels` all return the same values
         * before and after. This is the standard read-only contract for union-find.
         */
        find(i) {
            if (i < 0 || i >= this._capacity) {
                throw new RangeError(`Index ${i} out of range [0, ${this._capacity})`);
            }
            const parent = this.parent;
            // Walk up to root.
            let root = i;
            while (parent[root] !== root) {
                root = parent[root];
            }
            // Compress: point every node on the path directly at root.
            let cur = i;
            while (parent[cur] !== root) {
                const next = parent[cur];
                parent[cur] = root;
                cur = next;
            }
            return root;
        }
        /**
         * Union-by-rank: the shorter tree is hung under the taller one, which
         * keeps tree height O(log n) before path compression and O(α(n))
         * amortized after.
         */
        union(a, b) {
            const ra = this.find(a);
            const rb = this.find(b);
            if (ra === rb)
                return false;
            const rank = this.rank;
            const parent = this.parent;
            const sizes = this._size;
            let root;
            let child;
            if (rank[ra] < rank[rb]) {
                root = rb;
                child = ra;
            }
            else if (rank[ra] > rank[rb]) {
                root = ra;
                child = rb;
            }
            else {
                // Equal rank: pick one and bump its rank.
                root = ra;
                child = rb;
                rank[ra]++;
            }
            parent[child] = root;
            sizes[root] += sizes[child];
            // sizes[child] is now stale; we never read it for non-roots so leave it.
            this._componentCount--;
            return true;
        }
        connected(a, b) {
            return this.find(a) === this.find(b);
        }
        componentSize(i) {
            return this._size[this.find(i)];
        }
        /**
         * Build a transient bucket from root → members. O(n) time, O(n) memory.
         * We intentionally don't cache: any subsequent `union` would invalidate it.
         */
        *componentOf(i) {
            const target = this.find(i);
            for (let j = 0; j < this._capacity; j++) {
                if (this.find(j) === target)
                    yield j;
            }
        }
        /**
         * Group all elements by root in a single O(n) pass. We use a
         * `Map<rootId, number[]>` because component count and sizes vary; if the
         * caller needs a flat `labels()` buffer instead, that's the cheaper API.
         */
        *components() {
            const buckets = new Map();
            for (let j = 0; j < this._capacity; j++) {
                const r = this.find(j);
                let bucket = buckets.get(r);
                if (bucket === undefined) {
                    bucket = [];
                    buckets.set(r, bucket);
                }
                bucket.push(j);
            }
            for (const bucket of buckets.values())
                yield bucket;
        }
        /**
         * Returns a length-`size` Int32Array where entry `i` is `find(i)`. Has the
         * side effect of fully compressing the forest (every `find` call does so),
         * which is fine — and arguably desirable — for an "I'm done mutating, give
         * me the labels" API.
         */
        labels() {
            const out = new Int32Array(this._capacity);
            for (let i = 0; i < this._capacity; i++) {
                out[i] = this.find(i);
            }
            return out;
        }
    }
    // --------------------------------------------------------------------------
    // KeyedUnionFind
    // --------------------------------------------------------------------------
    /**
     * Union-find over arbitrary keys.
     *
     * Implementation strategy: we maintain an `IndexedUnionFind`-style forest
     * internally on integer slots, plus two side maps:
     *   - `keyToIndex: Map<K, number>` — one-way lookup from caller's keys to slots.
     *   - `indexToKey: K[]`            — reverse lookup; we need it in `find` to
     *                                    return the root *key*, not the slot.
     *
     * We don't reuse `IndexedUnionFind` directly because its capacity is fixed
     * at construction; here we grow on demand via `Array#push` / typed-array
     * doubling. So we inline the same union-by-rank + path-compression logic over
     * regular numeric arrays (fast enough; the Map lookup dominates anyway).
     *
     * Read-only methods (`find`, `connected`, `has`, `componentSize`,
     * `componentOf`, `components`) never register new keys. Unregistered keys are
     * treated as implicit singletons for the purpose of the answer:
     * `find(unseen) === unseen`, `componentSize(unseen) === 1`, etc. Only `add`
     * and `union` actually allocate slots.
     */
    class KeyedUnionFind {
        keyToIndex = new Map();
        indexToKey = [];
        parent = [];
        rank = [];
        _size = [];
        _componentCount = 0;
        get size() {
            return this.indexToKey.length;
        }
        get componentCount() {
            return this._componentCount;
        }
        /**
         * Allocate a new slot for `k` if not present. Returns the slot index in
         * either case. Mutating: only `add` and `union` should call this.
         */
        slot(k) {
            const existing = this.keyToIndex.get(k);
            if (existing !== undefined)
                return existing;
            const idx = this.indexToKey.length;
            this.keyToIndex.set(k, idx);
            this.indexToKey.push(k);
            this.parent.push(idx);
            this.rank.push(0);
            this._size.push(1);
            this._componentCount++;
            return idx;
        }
        /** Find the root slot of the slot `i`, with path compression. */
        findSlot(i) {
            const parent = this.parent;
            let root = i;
            while (parent[root] !== root) {
                root = parent[root];
            }
            let cur = i;
            while (parent[cur] !== root) {
                const next = parent[cur];
                parent[cur] = root;
                cur = next;
            }
            return root;
        }
        has(k) {
            return this.keyToIndex.has(k);
        }
        /**
         * Idempotent registration. Returns true if this call actually added a new
         * singleton — useful for callers who want `componentCount` to reflect
         * elements they've explicitly introduced, even before any unions.
         */
        add(k) {
            if (this.keyToIndex.has(k))
                return false;
            this.slot(k);
            return true;
        }
        find(k) {
            const idx = this.keyToIndex.get(k);
            if (idx === undefined)
                return k; // implicit singleton; do not register
            return this.indexToKey[this.findSlot(idx)];
        }
        union(a, b) {
            const ia = this.slot(a);
            const ib = this.slot(b);
            const ra = this.findSlot(ia);
            const rb = this.findSlot(ib);
            if (ra === rb)
                return false;
            const rank = this.rank;
            const parent = this.parent;
            const sizes = this._size;
            let root;
            let child;
            if (rank[ra] < rank[rb]) {
                root = rb;
                child = ra;
            }
            else if (rank[ra] > rank[rb]) {
                root = ra;
                child = rb;
            }
            else {
                root = ra;
                child = rb;
                rank[ra]++;
            }
            parent[child] = root;
            sizes[root] += sizes[child];
            this._componentCount--;
            return true;
        }
        connected(a, b) {
            const ia = this.keyToIndex.get(a);
            const ib = this.keyToIndex.get(b);
            // Both unregistered: connected iff equal (each is its own singleton).
            if (ia === undefined && ib === undefined)
                return a === b;
            // One registered, one not: definitionally in different components.
            if (ia === undefined || ib === undefined)
                return false;
            return this.findSlot(ia) === this.findSlot(ib);
        }
        componentSize(k) {
            const idx = this.keyToIndex.get(k);
            if (idx === undefined)
                return 1; // implicit singleton
            return this._size[this.findSlot(idx)];
        }
        *componentOf(k) {
            const idx = this.keyToIndex.get(k);
            if (idx === undefined) {
                // Unregistered: yield just `k` as its own implicit component.
                yield k;
                return;
            }
            const target = this.findSlot(idx);
            const n = this.indexToKey.length;
            for (let j = 0; j < n; j++) {
                if (this.findSlot(j) === target)
                    yield this.indexToKey[j];
            }
        }
        *components() {
            const buckets = new Map();
            const n = this.indexToKey.length;
            for (let j = 0; j < n; j++) {
                const r = this.findSlot(j);
                let bucket = buckets.get(r);
                if (bucket === undefined) {
                    bucket = [];
                    buckets.set(r, bucket);
                }
                bucket.push(this.indexToKey[j]);
            }
            for (const bucket of buckets.values())
                yield bucket;
        }
    }

    var index$o = /*#__PURE__*/Object.freeze({
        __proto__: null,
        IndexedUnionFind: IndexedUnionFind,
        KeyedUnionFind: KeyedUnionFind,
        SpatialHash: SpatialHash,
        mapping: mapping,
        trees: index$p
    });

    var index$n = /*#__PURE__*/Object.freeze({
        __proto__: null,
        color: color,
        types: types,
        utils: index$o
    });

    /**
     * A comprehensive color harmony system using the Strategy pattern in the LCH (Lightness, Chroma, Hue)
     * color space. This module provides a flexible and extensible way to generate various color harmonies
     * while maintaining consistent visual relationships between colors.
     */
    /**
     * Utility functions for color manipulation and normalization
     *
     * @desc Collection of helper functions for color processing
     * @summary Color utility functions
     */
    const ColorUtils = {
        /**
         * Normalizes a hue angle to ensure it falls within the valid range
         *
         * @desc Ensures hue values wrap around the color wheel correctly
         * @summary Normalizes hue angles to 0-360 range
         *
         * @param hue - The hue angle to normalize
         * @returns The normalized hue angle between 0 and 360
         *
         * @example
         * ```typescript
         * const normalized = ColorUtils.normalizeHue(400); // Returns 40
         * ```
         */
        normalizeHue: (hue) => ((hue % 360) + 360) % 360,
        /**
         * clamps a numeric value between a minimum and maximum range
         *
         * @desc Ensures a value stays within specified bounds
         * @summary Constrains a number to a given range
         *
         * @param value - The number to clamp
         * @param min - The minimum allowed value
         * @param max - The maximum allowed value
         * @returns The clamped value
         *
         * @example
         * ```typescript
         * const clamped = ColorUtils.clamp(150, 0, 100); // Returns 100
         * ```
         */
        clamp: (value, min, max) => Math.min(Math.max(value, min), max),
        /**
         * Normalizes an LCH color's components to their valid ranges
         *
         * @desc Ensures all color components are within their valid ranges
         * @summary Normalizes LCH color values
         *
         * @param color - The LCH color to normalize
         * @returns A new LCH color with normalized components
         *
         * @example
         * ```typescript
         * const normalized = ColorUtils.normalizeLCH({ l: 150, c: 200, h: 400 });
         * // Returns { l: 100, c: 132, h: 40 }
         * ```
         */
        normalizeLCH: (color) => ({
            L: ColorUtils.clamp(color.L, 0, 100),
            C: ColorUtils.clamp(color.C, 0, 132),
            h: ColorUtils.normalizeHue(color.h)
        })
    };
    /**
     * Base abstract class providing common functionality for harmony strategies
     *
     * @desc Abstract base class implementing shared color harmony functionality
     * @summary Base class for harmony strategies
     *
     * @remarks
     * This class provides common utility methods and enforces the ColorHarmonyStrategy
     * interface. All concrete strategy classes should extend this base class.
     */
    class BaseHarmonyStrategy {
        /**
         * Normalizes a color's components
         *
         * @desc Ensures a color's components are within valid ranges
         * @summary Protected helper method for color normalization
         *
         * @param color - The color to normalize
         * @returns A normalized LCH color
         */
        normalizeColor(color) {
            return ColorUtils.normalizeLCH(color);
        }
    }
    /**
     * Strategy for generating monochromatic color harmonies
     *
     * @desc Generates variations of a color by adjusting lightness and chroma
     * @summary Monochromatic harmony generation strategy
     *
     * @remarks
     * Monochromatic harmonies create variations of a single hue by adjusting
     * lightness and saturation while maintaining the same base hue.
     */
    class MonochromaticStrategy extends BaseHarmonyStrategy {
        /**
         * Generates a monochromatic color harmony
         *
         * @desc Creates variations of a color with different lightness and chroma values
         * @summary Generates monochromatic color variations
         *
         * @param baseColor - The base color to generate variations from
         * @param options - Configuration options for the harmony generation
         * @returns Array of LCH colors in the monochromatic harmony
         *
         * @example
         * ```typescript
         * const strategy = new MonochromaticStrategy();
         * const baseColor = { l: 60, c: 50, h: 120 };
         * const harmony = strategy.generateHarmony(baseColor, {
         *   count: 5,
         *   lightnessRange: [20, 90],
         *   chromaVariation: 10
         * });
         * ```
         */
        generateHarmony(baseColor, options = {}) {
            const { count = 5, lightnessRange = [20, 90], chromaVariation = 10 } = options;
            const colors = [];
            const lightnessStep = (lightnessRange[1] - lightnessRange[0]) / (count - 1);
            for (let i = 0; i < count; i++) {
                const lightness = lightnessRange[0] + (lightnessStep * i);
                const chromaVariant = baseColor.C +
                    (Math.random() * 2 - 1) * chromaVariation;
                colors.push(this.normalizeColor({
                    L: lightness,
                    C: chromaVariant,
                    h: baseColor.h
                }));
            }
            return colors;
        }
    }
    /**
     * Strategy for generating complementary color harmonies
     *
     * @desc Creates color pairs from opposite sides of the color wheel
     * @summary Complementary harmony generation strategy
     *
     * @remarks
     * Complementary colors are directly opposite each other on the color wheel,
     * creating high contrast and vibrant combinations.
     */
    class ComplementaryStrategy extends BaseHarmonyStrategy {
        /**
         * Generates a complementary color harmony
         *
         * @desc Creates a two-color harmony using opposite colors on the wheel
         * @summary Generates complementary color pairs
         *
         * @param baseColor - The base color to find a complement for
         * @param options - Configuration options for the harmony generation
         * @returns Array containing the base color and its complement
         *
         * @example
         * ```typescript
         * const strategy = new ComplementaryStrategy();
         * const baseColor = { l: 60, c: 50, h: 120 };
         * const harmony = strategy.generateHarmony(baseColor, {
         *   chromaVariation: 10
         * });
         * ```
         */
        generateHarmony(baseColor, options = {}) {
            const { chromaVariation = 10 } = options;
            const normalizedBase = this.normalizeColor(baseColor);
            const complement = this.normalizeColor({
                L: baseColor.L,
                C: ColorUtils.clamp(baseColor.C - chromaVariation, 0, 132),
                h: ColorUtils.normalizeHue(baseColor.h + 180)
            });
            return [normalizedBase, complement];
        }
    }
    /**
     * Generates split-complementary color harmonies
     *
     * @desc Creates a three-color harmony using a base color and two colors adjacent to its complement
     * @summary Split-complementary harmony generation strategy
     *
     * @remarks
     * Split-complementary schemes create high contrast while being more balanced
     * than pure complementary schemes by using two colors adjacent to the complement.
     */
    class SplitComplementaryStrategy extends BaseHarmonyStrategy {
        /**
         * Generates a split-complementary color harmony
         *
         * @desc Creates a three-color harmony with split complements
         * @summary Generates split-complementary colors
         *
         * @param baseColor - The base color to generate harmony from
         * @param options - Configuration options for harmony generation
         * @returns Array of three colors in split-complementary arrangement
         *
         * @example
         * ```typescript
         * const strategy = new SplitComplementaryStrategy();
         * const colors = strategy.generateHarmony(baseColor, { angle: 30 });
         * ```
         */
        generateHarmony(baseColor, options = {}) {
            const { angle = 30 } = options;
            const base = this.normalizeColor(baseColor);
            return [
                base,
                this.normalizeColor({
                    ...base,
                    h: ColorUtils.normalizeHue(base.h + 180 - angle)
                }),
                this.normalizeColor({
                    ...base,
                    h: ColorUtils.normalizeHue(base.h + 180 + angle)
                })
            ];
        }
    }
    /**
     * Generates triadic color harmonies
     *
     * @desc Creates a three-color harmony using colors evenly spaced around the color wheel
     * @summary Triadic harmony generation strategy
     *
     * @remarks
     * Triadic color schemes create vibrant and balanced combinations by using three
     * colors equally spaced around the color wheel (120° apart).
     */
    class TriadicStrategy extends BaseHarmonyStrategy {
        /**
         * Generates a triadic color harmony
         *
         * @desc Creates three colors evenly spaced on the color wheel
         * @summary Generates triadic color combinations
         *
         * @param baseColor - The base color to generate harmony from
         * @returns Array of three colors in triadic arrangement
         *
         * @example
         * ```typescript
         * const strategy = new TriadicStrategy();
         * const colors = strategy.generateHarmony(baseColor);
         * ```
         */
        generateHarmony(baseColor) {
            const base = this.normalizeColor(baseColor);
            return [
                base,
                this.normalizeColor({ ...base, h: ColorUtils.normalizeHue(base.h + 120) }),
                this.normalizeColor({ ...base, h: ColorUtils.normalizeHue(base.h + 240) })
            ];
        }
    }
    /**
     * Generates color harmonies based on the golden ratio
     *
     * @desc Creates harmonies using the golden angle (137.5°) for color spacing
     * @summary Golden ratio harmony generation strategy
     *
     * @remarks
     * Golden ratio harmonies create naturally pleasing color combinations based on
     * the same principles found throughout nature and classical art.
     */
    class GoldenRatioStrategy extends BaseHarmonyStrategy {
        GOLDEN_ANGLE = 137.5;
        /**
         * Generates a golden ratio color harmony
         *
         * @desc Creates colors spaced according to the golden angle
         * @summary Generates golden ratio color combinations
         *
         * @param baseColor - The base color to generate harmony from
         * @param options - Configuration options for harmony generation
         * @returns Array of colors spaced by the golden angle
         *
         * @example
         * ```typescript
         * const strategy = new GoldenRatioStrategy();
         * const colors = strategy.generateHarmony(baseColor, { count: 5 });
         * ```
         *
         * @throws {Error} If count is less than 1
         */
        generateHarmony(baseColor, options = {}) {
            const { count = 5 } = options;
            const base = this.normalizeColor(baseColor);
            return Array.from({ length: count }, (_, i) => this.normalizeColor({
                ...base,
                h: ColorUtils.normalizeHue(base.h + (this.GOLDEN_ANGLE * i))
            }));
        }
    }
    /**
     * Composite strategy that combines multiple harmony strategies
     *
     * @desc Combines multiple color harmony strategies into a single strategy
     * @summary Composite harmony generation strategy
     *
     * @remarks
     * This implementation uses the Composite pattern to allow treating
     * individual and compositions of strategies uniformly.
     */
    class CompositeHarmonyStrategy extends BaseHarmonyStrategy {
        strategies;
        /**
         * Creates a new composite strategy
         *
         * @desc Initializes a composite strategy with multiple sub-strategies
         * @summary Composite strategy constructor
         *
         * @param strategies - Array of color harmony strategies to combine
         *
         * @example
         * ```typescript
         * const composite = new CompositeHarmonyStrategy(
         *   new MonochromaticStrategy(),
         *   new ComplementaryStrategy()
         * );
         * ```
         */
        constructor(...strategies) {
            super();
            this.strategies = strategies;
        }
        /**
         * Checks if two LCH colors are effectively equal within a small threshold
         *
         * @desc Compares two LCH colors for equality with tolerance
         * @summary Compares LCH colors for equality
         *
         * @param color1 - First color to compare
         * @param color2 - Second color to compare
         * @param threshold - Tolerance for floating point comparisons
         * @returns True if colors are considered equal
         */
        areColorsEqual(color1, color2, threshold = 0.001) {
            return Math.abs(color1.L - color2.L) < threshold &&
                Math.abs(color1.C - color2.C) < threshold &&
                Math.abs(color1.h - color2.h) < threshold;
        }
        /**
         * Removes duplicate colors from an array of LCH colors
         *
         * @desc Filters out duplicate colors within a threshold
         * @summary Deduplicates LCH colors
         *
         * @param colors - Array of colors to deduplicate
         * @returns Array of unique colors
         */
        deduplicateColors(colors) {
            return colors.reduce((unique, color) => {
                const isDuplicate = unique.some(existingColor => this.areColorsEqual(color, existingColor));
                if (!isDuplicate) {
                    unique.push(color);
                }
                return unique;
            }, []);
        }
        /**
         * Generates a combined color harmony
         *
         * @desc Generates colors using all component strategies
         * @summary Generates composite color harmony
         *
         * @param baseColor - The base color for harmony generation
         * @param options - Configuration options passed to all strategies
         * @returns Array of unique colors from all component strategies
         *
         * @example
         * ```typescript
         * const composite = new CompositeHarmonyStrategy(
         *   new MonochromaticStrategy(),
         *   new ComplementaryStrategy()
         * );
         * const harmony = composite.generateHarmony(baseColor);
         * ```
         */
        generateHarmony(baseColor, options) {
            const allColors = this.strategies.flatMap(strategy => strategy.generateHarmony(baseColor, options));
            // Remove duplicates based on color values
            return this.deduplicateColors(allColors);
        }
    }
    /**
     * Context class for managing and executing color harmony strategies
     *
     * @desc Provides a context for executing color harmony strategies
     * @summary Color harmony context class
     *
     * @remarks
     * This class implements the Strategy pattern's context, allowing
     * dynamic switching between different harmony generation strategies.
     */
    class ColorHarmonyContext {
        strategy;
        /**
         * Creates a new color harmony context
         *
         * @desc Initializes the context with a specific harmony strategy
         * @summary Color harmony context constructor
         *
         * @param strategy - The initial color harmony strategy to use
         *
         * @example
         * ```typescript
         * const context = new ColorHarmonyContext(new MonochromaticStrategy());
         * ```
         */
        constructor(strategy) {
            this.strategy = strategy;
        }
        /**
         * Changes the current harmony strategy
         *
         * @desc Updates the context to use a different harmony strategy
         * @summary Sets the active harmony strategy
         *
         * @param strategy - The new color harmony strategy to use
         *
         * @example
         * ```typescript
         * const context = new ColorHarmonyContext(new MonochromaticStrategy());
         * context.setStrategy(new ComplementaryStrategy());
         * ```
         */
        setStrategy(strategy) {
            this.strategy = strategy;
        }
        /**
         * Generates a color harmony using the current strategy
         *
         * @desc Executes the current strategy to generate a color harmony
         * @summary Generates colors using current strategy
         *
         * @param baseColor - The base color for harmony generation
         * @param options - Configuration options for the harmony generation
         * @returns Array of colors in the generated harmony
         *
         */
        generateHarmony(baseColor, options) {
            return this.strategy.generateHarmony(baseColor, options);
        }
    }
    /**
     * Generator for creating harmonious lighter and darker variants of LCH colors
     *
     * @desc Generates color variants while maintaining harmonic relationships
     * @summary LCH color variant generator
     */
    class LCHVariantGenerator {
        defaultStrategy;
        /**
         * Creates a new variant generator
         *
         * @desc Initializes the generator with default strategy
         * @summary Constructor for variant generator
         */
        constructor() {
            this.defaultStrategy = new GoldenRatioStrategy();
        }
        /**
         * Calculate the chroma adjustment for a given lightness change
         *
         * @desc Determines how much to adjust chroma based on lightness change
         * @summary Calculates chroma adjustment
         *
         * @param originalChroma - The original color's chroma value
         * @param lightnessDelta - The change in lightness
         * @param preserveRatio - Whether to maintain the original chroma ratio
         * @returns The adjusted chroma value
         */
        calculateChromaAdjustment(originalChroma, lightnessDelta, preserveRatio) {
            if (!preserveRatio)
                return originalChroma;
            // Adjust chroma proportionally to maintain perceived saturation
            const adjustment = 1 - (Math.abs(lightnessDelta) / 100);
            return originalChroma * adjustment;
        }
        /**
         * Creates a single variant with adjusted lightness
         *
         * @desc Generates a single color variant with specified adjustments
         * @summary Creates color variant
         *
         * @param color - Base color to modify
         * @param lightnessDelta - Amount to adjust lightness
         * @param options - Configuration options
         * @returns Modified LCH color
         */
        createVariant(color, lightnessDelta, options) {
            const { chromaVariation = 5, preserveChromaRatio = true } = options;
            const newLightness = ColorUtils.clamp(color.L + lightnessDelta, 0, 100);
            const chromaAdjustment = this.calculateChromaAdjustment(color.C, lightnessDelta, preserveChromaRatio);
            // Add slight random variation to chroma for more natural looking results
            const chromaVariant = chromaAdjustment +
                (Math.random() * 2 - 1) * chromaVariation;
            return ColorUtils.normalizeLCH({
                L: newLightness,
                C: chromaVariant,
                h: color.h
            });
        }
        /**
         * Generates a set of lighter and darker variants
         *
         * @desc Creates complete set of color variants
         * @summary Generates color variants
         *
         * @param color - Base color to generate variants from
         * @param options - Configuration options
         * @returns Object containing all generated variants
         *
         * @example
         * ```typescript
         * const generator = new LCHVariantGenerator();
         * const baseColor = { l: 50, c: 30, h: 120 };
         * const variants = generator.generateVariants(baseColor, {
         *   lighterSteps: 3,
         *   darkerSteps: 3,
         *   lightnessStep: 10
         * });
         * ```
         */
        generateVariants(color, options = {}) {
            const { strategy = this.defaultStrategy, lighterSteps = 2, darkerSteps = 2, lightnessStep = 10 } = options;
            // Generate base harmony using provided or default strategy
            const harmonicColors = strategy.generateHarmony(color, options);
            const baseColor = harmonicColors[0]; // Use first color as base
            // Generate lighter variants
            const lighter = Array.from({ length: lighterSteps }, (_, i) => this.createVariant(baseColor, lightnessStep * (i + 1), options));
            // Generate darker variants
            const darker = Array.from({ length: darkerSteps }, (_, i) => this.createVariant(baseColor, -lightnessStep * (i + 1), options));
            return {
                base: baseColor,
                lighter,
                darker,
                original: color
            };
        }
        /**
         * Creates an interpolated scale between two colors
         *
         * @desc Generates a smooth transition between two colors
         * @summary Creates color scale
         *
         * @param start - Starting color
         * @param end - Ending color
         * @param steps - Number of steps in the scale
         * @returns Array of interpolated colors
         *
         * @example
         * ```typescript
         * const generator = new LCHVariantGenerator();
         * const scale = generator.CreateScale(
         *   { l: 30, c: 20, h: 120 },
         *   { l: 80, c: 40, h: 180 },
         *   5
         * );
         * ```
         */
        createScale(start, end, steps) {
            const scale = [];
            for (let i = 0; i < steps; i++) {
                const t = i / (steps - 1);
                scale.push(ColorUtils.normalizeLCH({
                    L: start.L + (end.L - start.L) * t,
                    C: start.C + (end.C - start.C) * t,
                    h: ColorUtils.normalizeHue(start.h + (end.h - start.h) * t)
                }));
            }
            return scale;
        }
    }

    var harmony = /*#__PURE__*/Object.freeze({
        __proto__: null,
        ColorHarmonyContext: ColorHarmonyContext,
        ColorUtils: ColorUtils,
        ComplementaryStrategy: ComplementaryStrategy,
        CompositeHarmonyStrategy: CompositeHarmonyStrategy,
        GoldenRatioStrategy: GoldenRatioStrategy,
        LCHVariantGenerator: LCHVariantGenerator,
        MonochromaticStrategy: MonochromaticStrategy,
        SplitComplementaryStrategy: SplitComplementaryStrategy,
        TriadicStrategy: TriadicStrategy
    });

    var index$m = /*#__PURE__*/Object.freeze({
        __proto__: null,
        harmony: harmony
    });

    /**
     * Halton low-discrepancy sequence in D dimensions.
     *
     * Each dimension uses a different prime base. The first point is at index 1
     * (index 0 is the origin and would skew the distribution).
     *
     * Online by construction — call next() any number of times.
     *
     * @example
     * const halton = new HaltonSampler(2);  // 2D, bases [2, 3]
     * const p1 = halton.next();
     * const p2 = halton.next();
     */
    class HaltonSampler {
        static PRIMES = [
            2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53
        ];
        bases;
        VectorClass;
        startIndex;
        index;
        produced = 0;
        /**
         * @param dimension Number of dimensions (must be <= 16 with default primes)
         * @param startIndex Starting index in the sequence (default 1; skip 0 to avoid origin)
         * @param bases Optional override for the prime bases used per dimension
         */
        constructor(dimension, startIndex = 1, bases) {
            if (dimension < 1) {
                throw new Error('HaltonSampler requires dimension >= 1');
            }
            const chosen = bases ?? HaltonSampler.PRIMES.slice(0, dimension);
            if (chosen.length < dimension) {
                throw new Error(`Need ${dimension} bases, only ${chosen.length} provided`);
            }
            this.bases = chosen;
            this.startIndex = startIndex;
            this.index = startIndex;
            this.VectorClass = Vector.forDimension(dimension);
        }
        get count() {
            return this.produced;
        }
        next() {
            const coords = new Float64Array(this.bases.length);
            for (let d = 0; d < this.bases.length; d++) {
                coords[d] = HaltonSampler.radicalInverse(this.index, this.bases[d]);
            }
            this.index++;
            this.produced++;
            return new this.VectorClass(coords);
        }
        reset() {
            this.index = this.startIndex;
            this.produced = 0;
        }
        /**
         * Radical inverse φ_b(i): write i in base b, reverse the digits,
         * place them after the decimal point.
         */
        static radicalInverse(i, base) {
            let result = 0;
            let f = 1 / base;
            let n = i;
            while (n > 0) {
                result += (n % base) * f;
                n = Math.floor(n / base);
                f /= base;
            }
            return result;
        }
    }

    /**
     * R₂ (Roberts) low-discrepancy sequence using the plastic constant.
     *
     * For D dimensions, uses the unique positive root of x^(D+1) = x + 1.
     * Produces extremely uniform coverage with no visible axis alignment —
     * often the best default for 2D layouts.
     *
     * Reference: http://extremelearning.com.au/unreasonable-effectiveness-of-quasirandom-sequences/
     *
     * @example
     * const r2 = new RobertsSampler(2);
     * const p1 = r2.next();  // first point near (0.7548, 0.5698)
     */
    class RobertsSampler {
        alphas;
        VectorClass;
        seed;
        startIndex;
        index;
        produced = 0;
        /**
         * @param dimension Number of dimensions
         * @param startIndex Starting index (default 0, but offset by `seed` works fine)
         * @param seed Phase offset in [0, 1) — different seeds give different but
         *             equally well-distributed sequences. Useful for layering.
         */
        constructor(dimension, startIndex = 0, seed = 0.5) {
            if (dimension < 1) {
                throw new Error('RobertsSampler requires dimension >= 1');
            }
            if (seed < 0 || seed >= 1) {
                throw new Error('seed must be in [0, 1)');
            }
            const phi = RobertsSampler.plasticConstant(dimension);
            const alphas = new Array(dimension);
            for (let d = 0; d < dimension; d++) {
                alphas[d] = (1 / phi) ** (d + 1);
            }
            this.alphas = alphas;
            this.seed = seed;
            this.startIndex = startIndex;
            this.index = startIndex;
            this.VectorClass = Vector.forDimension(dimension);
        }
        get count() {
            return this.produced;
        }
        next() {
            const coords = new Float64Array(this.alphas.length);
            for (let d = 0; d < this.alphas.length; d++) {
                // (seed + index * α_d) mod 1
                const v = this.seed + this.index * this.alphas[d];
                coords[d] = v - Math.floor(v);
            }
            this.index++;
            this.produced++;
            return new this.VectorClass(coords);
        }
        reset() {
            this.index = this.startIndex;
            this.produced = 0;
        }
        /**
         * Solves x^(D+1) = x + 1 by fixed-point iteration.
         * D=1 → φ ≈ 1.6180 (golden ratio)
         * D=2 → φ ≈ 1.3247 (plastic constant)
         * D=3 → φ ≈ 1.2207
         */
        static plasticConstant(d) {
            let x = 2;
            for (let i = 0; i < 30; i++) {
                x = Math.pow(1 + x, 1 / (d + 1));
            }
            return x;
        }
    }

    /**
     * Sobol low-discrepancy sequence (2D).
     *
     * Direction numbers come from Joe & Kuo's tables (new-joe-kuo-6.21201).
     * Dimension 0 is the van der Corput sequence in base 2.
     * Dimension 1 uses primitive polynomial x² + x + 1 (degree 2, a=1, m=[1, 3]).
     *
     * @example
     * const sobol = new SobolSampler();
     * sobol.next();           // (0, 0)
     * sobol.next();           // (0.5, 0.5)
     * sobol.next();           // (0.75, 0.25)
     * sobol.next();           // (0.25, 0.75)
     */
    class SobolSampler {
        static BITS = 32;
        directions;
        VectorClass;
        startIndex;
        index;
        x;
        produced = 0;
        constructor(startIndex = 0) {
            this.startIndex = startIndex;
            this.index = startIndex;
            this.VectorClass = Vector.forDimension(2);
            this.directions = [
                SobolSampler.buildDirectionsDim0(),
                SobolSampler.buildDirectionsDim1(),
            ];
            this.x = new Uint32Array(2);
            if (startIndex > 0) {
                this.fastForwardTo(startIndex);
            }
        }
        get count() {
            return this.produced;
        }
        next() {
            if (this.index === 0) {
                this.produced++;
                this.index++;
                return new this.VectorClass([0, 0]);
            }
            const c = SobolSampler.lowestZeroBit(this.index - 1);
            this.x[0] ^= this.directions[0][c];
            this.x[1] ^= this.directions[1][c];
            const norm = 1 / 2 ** SobolSampler.BITS;
            const coords = new Float64Array([
                this.x[0] * norm,
                this.x[1] * norm,
            ]);
            this.index++;
            this.produced++;
            return new this.VectorClass(coords);
        }
        reset() {
            this.index = this.startIndex;
            this.produced = 0;
            this.x = new Uint32Array(2);
            if (this.startIndex > 0) {
                this.fastForwardTo(this.startIndex);
            }
        }
        /** Position (0-indexed) of the lowest 0 bit in n. */
        static lowestZeroBit(n) {
            let i = 0;
            while ((n & 1) === 1) {
                n >>>= 1;
                i++;
            }
            return i;
        }
        /**
         * Dimension 0: V_i has only bit (BITS-i) set.
         * Equivalent to the van der Corput sequence in base 2.
         */
        static buildDirectionsDim0() {
            const v = new Uint32Array(SobolSampler.BITS);
            for (let i = 0; i < SobolSampler.BITS; i++) {
                v[i] = 1 << (SobolSampler.BITS - 1 - i);
            }
            return v;
        }
        /**
         * Dimension 1: primitive polynomial x² + x + 1 (a = 1, degree s = 2).
         * Initial direction integers m_1 = 1, m_2 = 3 (odd, < 2^i).
         * Recurrence: m_i = 2·a_1·m_{i-1} XOR (2^2)·m_{i-2} XOR m_{i-2}
         *           = 2·m_{i-1} XOR 4·m_{i-2} XOR m_{i-2}
         *           = 2·m_{i-1} XOR 5·m_{i-2}
         * Then V_i = m_i << (BITS - i).
         */
        static buildDirectionsDim1() {
            const v = new Uint32Array(SobolSampler.BITS);
            const m = new Array(SobolSampler.BITS + 1);
            m[1] = 1;
            m[2] = 3;
            for (let i = 3; i <= SobolSampler.BITS; i++) {
                // For polynomial x² + x + 1: a_1 = 1, and the leading 2^s term contributes m_{i-s}.
                // Recurrence: m_i = 2·m_{i-1} ⊕ (4·m_{i-2}) ⊕ m_{i-2}
                m[i] = (2 * m[i - 1]) ^ (4 * m[i - 2]) ^ m[i - 2];
            }
            for (let i = 1; i <= SobolSampler.BITS; i++) {
                v[i - 1] = (m[i] << (SobolSampler.BITS - i)) >>> 0;
            }
            return v;
        }
        fastForwardTo(target) {
            this.x = new Uint32Array(2);
            for (let i = 1; i < target; i++) {
                const c = SobolSampler.lowestZeroBit(i - 1);
                this.x[0] ^= this.directions[0][c];
                this.x[1] ^= this.directions[1][c];
            }
        }
    }

    var index$l = /*#__PURE__*/Object.freeze({
        __proto__: null,
        HaltonSampler: HaltonSampler,
        RobertsSampler: RobertsSampler,
        SobolSampler: SobolSampler
    });

    var index$k = /*#__PURE__*/Object.freeze({
        __proto__: null,
        lowDiscrepancy: index$l
    });

    /** Construct a module. Params default to empty for non-parametric use. */
    function mod(name, params = []) {
        return { name, params };
    }
    /** Render a Word back to its canonical string form for debugging/serialization. */
    function wordToString(word) {
        return word
            .map((m) => m.params.length === 0 ? m.name : `${m.name}(${m.params.join(",")})`)
            .join("");
    }
    /** Structural equality on modules — useful for tests. */
    function moduleEquals(a, b) {
        if (a.name !== b.name)
            return false;
        if (a.params.length !== b.params.length)
            return false;
        for (let i = 0; i < a.params.length; i++) {
            if (a.params[i] !== b.params[i])
                return false;
        }
        return true;
    }

    /**
     * Expression AST for parametric L-systems.
     *
     * Expressions appear in two places:
     *   - Rule predicates: `n > 0`, `x + y < 10` (boolean-valued)
     *   - Expansion templates: `F(n*0.5)`, `A(n-1)` (numeric-valued)
     *
     * We compile expressions to ASTs at parse time so per-binding evaluation
     * is cheap and the rewriter stays a pure function.
     */
    const EMPTY_BINDING = Object.freeze({});

    class EvaluationError extends Error {
        constructor(message) {
            super(message);
            this.name = "EvaluationError";
        }
    }
    /**
     * Evaluate an expression against a binding. Returns number;
     * booleans are encoded as 0 (false) / 1 (true) so the same
     * machinery handles both numeric expansions and predicate conditions.
     */
    function evaluate(expr, binding) {
        switch (expr.kind) {
            case "num":
                return expr.value;
            case "var": {
                const value = binding[expr.name];
                if (value === undefined) {
                    throw new EvaluationError(`Unbound variable: ${expr.name}`);
                }
                return value;
            }
            case "unop": {
                const v = evaluate(expr.operand, binding);
                switch (expr.op) {
                    case "-":
                        return -v;
                    case "!":
                        return v === 0 ? 1 : 0;
                }
            }
            case "binop": {
                // Short-circuit evaluation for logical operators.
                if (expr.op === "&&") {
                    const l = evaluate(expr.left, binding);
                    if (l === 0)
                        return 0;
                    return evaluate(expr.right, binding) === 0 ? 0 : 1;
                }
                if (expr.op === "||") {
                    const l = evaluate(expr.left, binding);
                    if (l !== 0)
                        return 1;
                    return evaluate(expr.right, binding) === 0 ? 0 : 1;
                }
                const l = evaluate(expr.left, binding);
                const r = evaluate(expr.right, binding);
                switch (expr.op) {
                    case "+":
                        return l + r;
                    case "-":
                        return l - r;
                    case "*":
                        return l * r;
                    case "/":
                        if (r === 0)
                            throw new EvaluationError("Division by zero");
                        return l / r;
                    case "%":
                        if (r === 0)
                            throw new EvaluationError("Modulo by zero");
                        return l % r;
                    case "^":
                        return Math.pow(l, r);
                    case "==":
                        return l === r ? 1 : 0;
                    case "!=":
                        return l !== r ? 1 : 0;
                    case "<":
                        return l < r ? 1 : 0;
                    case "<=":
                        return l <= r ? 1 : 0;
                    case ">":
                        return l > r ? 1 : 0;
                    case ">=":
                        return l >= r ? 1 : 0;
                }
            }
        }
    }
    /** Evaluate an expression as a boolean (zero is false, anything else is true). */
    function evaluateBoolean(expr, binding) {
        return evaluate(expr, binding) !== 0;
    }

    /**
     * Recursive-descent parser for arithmetic/boolean expressions used in
     * parametric L-system rules.
     *
     * Grammar (lowest to highest precedence):
     *   or     := and ('||' and)*
     *   and    := comp ('&&' comp)*
     *   comp   := add (('=='|'!='|'<'|'<='|'>'|'>=') add)?
     *   add    := mul (('+'|'-') mul)*
     *   mul    := pow (('*'|'/'|'%') pow)*
     *   pow    := unary ('^' pow)?            // right-associative
     *   unary  := ('-'|'!') unary | atom
     *   atom   := NUMBER | IDENT | '(' or ')'
     */
    class ParseError extends Error {
        position;
        constructor(message, position) {
            super(`Parse error at position ${position}: ${message}`);
            this.position = position;
            this.name = "ParseError";
        }
    }
    class Parser {
        src;
        pos = 0;
        constructor(src) {
            this.src = src;
        }
        parse() {
            this.skipWs();
            const expr = this.parseOr();
            this.skipWs();
            if (this.pos < this.src.length) {
                throw new ParseError(`Unexpected character '${this.src[this.pos]}'`, this.pos);
            }
            return expr;
        }
        parseOr() {
            let left = this.parseAnd();
            while (this.match("||")) {
                const right = this.parseAnd();
                left = { kind: "binop", op: "||", left, right };
            }
            return left;
        }
        parseAnd() {
            let left = this.parseComp();
            while (this.match("&&")) {
                const right = this.parseComp();
                left = { kind: "binop", op: "&&", left, right };
            }
            return left;
        }
        parseComp() {
            const left = this.parseAdd();
            // Order matters: longer operators first so '<=' isn't mis-parsed as '<'.
            for (const op of ["==", "!=", "<=", ">=", "<", ">"]) {
                if (this.match(op)) {
                    const right = this.parseAdd();
                    return { kind: "binop", op: op, left, right };
                }
            }
            return left;
        }
        parseAdd() {
            let left = this.parseMul();
            while (true) {
                this.skipWs();
                const op = this.peekOneOf(["+", "-"]);
                if (!op)
                    break;
                this.pos += 1;
                const right = this.parseMul();
                left = { kind: "binop", op: op, left, right };
            }
            return left;
        }
        parseMul() {
            let left = this.parsePow();
            while (true) {
                this.skipWs();
                const op = this.peekOneOf(["*", "/", "%"]);
                if (!op)
                    break;
                this.pos += 1;
                const right = this.parsePow();
                left = { kind: "binop", op: op, left, right };
            }
            return left;
        }
        parsePow() {
            const left = this.parseUnary();
            this.skipWs();
            if (this.peek() === "^") {
                this.pos += 1;
                // Right-associative recursion.
                const right = this.parsePow();
                return { kind: "binop", op: "^", left, right };
            }
            return left;
        }
        parseUnary() {
            this.skipWs();
            if (this.peek() === "-") {
                this.pos += 1;
                return { kind: "unop", op: "-", operand: this.parseUnary() };
            }
            if (this.peek() === "!") {
                this.pos += 1;
                return { kind: "unop", op: "!", operand: this.parseUnary() };
            }
            return this.parseAtom();
        }
        parseAtom() {
            this.skipWs();
            const c = this.peek();
            if (c === undefined) {
                throw new ParseError("Unexpected end of input", this.pos);
            }
            if (c === "(") {
                this.pos += 1;
                const inner = this.parseOr();
                this.skipWs();
                if (this.peek() !== ")") {
                    throw new ParseError("Expected ')'", this.pos);
                }
                this.pos += 1;
                return inner;
            }
            if (isDigit(c) || (c === "." && isDigit(this.src[this.pos + 1] ?? ""))) {
                return this.parseNumber();
            }
            if (isIdentStart(c)) {
                return this.parseIdent();
            }
            throw new ParseError(`Unexpected character '${c}'`, this.pos);
        }
        parseNumber() {
            const start = this.pos;
            while (this.pos < this.src.length && isDigit(this.src[this.pos])) {
                this.pos += 1;
            }
            if (this.src[this.pos] === ".") {
                this.pos += 1;
                while (this.pos < this.src.length && isDigit(this.src[this.pos])) {
                    this.pos += 1;
                }
            }
            // Optional exponent.
            if (this.src[this.pos] === "e" || this.src[this.pos] === "E") {
                this.pos += 1;
                if (this.src[this.pos] === "+" || this.src[this.pos] === "-") {
                    this.pos += 1;
                }
                while (this.pos < this.src.length && isDigit(this.src[this.pos])) {
                    this.pos += 1;
                }
            }
            const text = this.src.slice(start, this.pos);
            return { kind: "num", value: Number(text) };
        }
        parseIdent() {
            const start = this.pos;
            while (this.pos < this.src.length && isIdentCont(this.src[this.pos])) {
                this.pos += 1;
            }
            return { kind: "var", name: this.src.slice(start, this.pos) };
        }
        skipWs() {
            while (this.pos < this.src.length && /\s/.test(this.src[this.pos])) {
                this.pos += 1;
            }
        }
        peek() {
            return this.src[this.pos];
        }
        peekOneOf(chars) {
            const c = this.peek();
            return c !== undefined && chars.includes(c) ? c : undefined;
        }
        match(literal) {
            this.skipWs();
            if (this.src.startsWith(literal, this.pos)) {
                this.pos += literal.length;
                return true;
            }
            return false;
        }
    }
    function isDigit(c) {
        return c >= "0" && c <= "9";
    }
    function isIdentStart(c) {
        return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
    }
    function isIdentCont(c) {
        return isIdentStart(c) || isDigit(c);
    }
    /** Parse an expression source string into an AST. */
    function parseExpression(src) {
        return new Parser(src).parse();
    }

    /** A simple sink that accumulates items into an array. */
    class ArraySink {
        items = [];
        emit(item) {
            this.items.push(item);
        }
    }

    /**
     * Walk `word`, dispatching each module to its handler. The state is mutated
     * in place by handlers; the sink accumulates output. Returns the final state
     * for inspection (useful for tests and for chained interpretation).
     *
     * The dispatch loop is the only place that knows about brackets. Every other
     * concern — coordinate systems, output formats, parameter defaults — is
     * pushed into handlers, where it composes freely.
     */
    function interpret(word, state, sink, options) {
        const handlers = options.handlers;
        const onUnknown = options.onUnknown ?? "ignore";
        const openBracket = options.openBracket === undefined ? "[" : options.openBracket;
        const closeBracket = options.closeBracket === undefined ? "]" : options.closeBracket;
        const stack = [];
        let current = state;
        for (let i = 0; i < word.length; i++) {
            const m = word[i];
            // Bracket handling is built in so every state type gets push/pop
            // semantics without each State implementation reinventing it.
            if (openBracket !== null && m.name === openBracket) {
                stack.push(current.clone());
                continue;
            }
            if (closeBracket !== null && m.name === closeBracket) {
                const restored = stack.pop();
                if (restored === undefined) {
                    throw new Error(`Unbalanced bracket: ']' at position ${i} has no matching '['`);
                }
                current = restored;
                continue;
            }
            const handler = handlers[m.name];
            if (handler !== undefined) {
                handler({ module: m, state: current, sink, position: i });
                continue;
            }
            // No handler — apply the unknown policy.
            if (onUnknown === "ignore")
                continue;
            if (onUnknown === "error") {
                throw new Error(`No handler for symbol '${m.name}' at position ${i}` +
                    ` (set onUnknown: "ignore" to skip silently)`);
            }
            // Custom default handler.
            onUnknown({ module: m, state: current, sink, position: i });
        }
        if (stack.length !== 0) {
            throw new Error(`Unbalanced brackets: ${stack.length} unclosed '[' at end of word`);
        }
        return current;
    }
    /**
     * Streaming variant: yields output items as they're emitted. Useful for
     * large words where you don't want to materialize the whole output array.
     *
     * Implementation note: we use a queue-backed sink to bridge the push-based
     * handler API with the pull-based generator API. Handlers push to the queue;
     * the generator drains it after each module.
     */
    function* interpretStream(word, state, options) {
        const queue = [];
        const sink = {
            emit(item) {
                queue.push(item);
            },
        };
        const handlers = options.handlers;
        const onUnknown = options.onUnknown ?? "ignore";
        const openBracket = options.openBracket === undefined ? "[" : options.openBracket;
        const closeBracket = options.closeBracket === undefined ? "]" : options.closeBracket;
        const stack = [];
        let current = state;
        for (let i = 0; i < word.length; i++) {
            const m = word[i];
            if (openBracket !== null && m.name === openBracket) {
                stack.push(current.clone());
                continue;
            }
            if (closeBracket !== null && m.name === closeBracket) {
                const restored = stack.pop();
                if (restored === undefined) {
                    throw new Error(`Unbalanced bracket: ']' at position ${i} has no matching '['`);
                }
                current = restored;
                continue;
            }
            const handler = handlers[m.name];
            if (handler !== undefined) {
                handler({ module: m, state: current, sink, position: i });
            }
            else if (onUnknown === "error") {
                throw new Error(`No handler for symbol '${m.name}' at position ${i}`);
            }
            else if (typeof onUnknown === "function") {
                onUnknown({ module: m, state: current, sink, position: i });
            }
            // Drain anything the handler emitted.
            while (queue.length > 0) {
                yield queue.shift();
            }
        }
        if (stack.length !== 0) {
            throw new Error(`Unbalanced brackets: ${stack.length} unclosed '[' at end of word`);
        }
        return current;
    }

    /**
     * Read the i-th parameter of a module, falling back to a default if missing.
     * Handlers use this constantly: `F` with no params should use a default
     * length, `F(2.5)` should use 2.5.
     *
     *   const length = param(module, 0, defaultLength);
     *   const angle  = param(module, 0, 90);
     */
    function param(m, index, fallback) {
        return m.params[index] ?? fallback;
    }
    /** Read all params, padding the tail with defaults if the module is short. */
    function params(m, defaults) {
        if (m.params.length >= defaults.length)
            return m.params;
        const out = [...m.params];
        for (let i = m.params.length; i < defaults.length; i++) {
            out.push(defaults[i]);
        }
        return out;
    }

    /**
     * 2D turtle state. Heading is stored in radians measured counter-clockwise
     * from the positive X axis (standard mathematical convention).
     *
     * Pen attributes (width, color) live on the state so they participate in
     * the bracket stack — when you pop, the pen color reverts too. This is what
     * lets you draw a branch in green and return to the previous color cleanly.
     */
    class Turtle2D {
        x;
        y;
        /** Heading in radians, CCW from +X axis. */
        heading;
        width;
        color;
        /** Whether the pen is currently drawing. Some symbols may toggle this. */
        penDown;
        constructor(init = {}) {
            this.x = init.x ?? 0;
            this.y = init.y ?? 0;
            // Default heading: +Y ("up"), which matches plant-growth intuition.
            this.heading = init.heading ?? Math.PI / 2;
            this.width = init.width ?? 1;
            this.color = init.color ?? "#000000";
            this.penDown = init.penDown ?? true;
        }
        clone() {
            return new Turtle2D({
                x: this.x,
                y: this.y,
                heading: this.heading,
                width: this.width,
                color: this.color,
                penDown: this.penDown,
            });
        }
        /** Current position as a Vec2 (a fresh object, safe to keep). */
        position() {
            return { x: this.x, y: this.y };
        }
    }
    /** Degrees → radians, since L-systems are usually written in degrees. */
    function deg2rad(deg) {
        return (deg * Math.PI) / 180;
    }

    /**
     * 3D turtle state following the convention in Prusinkiewicz & Lindenmayer,
     * "The Algorithmic Beauty of Plants".
     *
     * The turtle carries three orthogonal unit vectors:
     *   H — Heading       (the direction it's facing)
     *   L — Left          (its left, perpendicular to H)
     *   U — Up            (its up, perpendicular to H and L)
     *
     * Rotation operators rotate these vectors around each other:
     *   yaw   (+ / -)   rotates H and L around U
     *   pitch (& / ^)   rotates H and U around L
     *   roll  (\ / /)   rotates L and U around H
     *
     * Storing the full basis (rather than Euler angles) avoids gimbal lock
     * and makes each operator a simple matrix multiply.
     */
    class Turtle3D {
        x;
        y;
        z;
        hx;
        hy;
        hz; // Heading
        lx;
        ly;
        lz; // Left
        ux;
        uy;
        uz; // Up
        width;
        color;
        penDown;
        constructor(init = {}) {
            this.x = init.x ?? 0;
            this.y = init.y ?? 0;
            this.z = init.z ?? 0;
            // Default basis: heading +Y (up), left +X, up +Z.
            // This matches plant growth: the turtle climbs Y as it "grows".
            this.hx = init.hx ?? 0;
            this.hy = init.hy ?? 1;
            this.hz = init.hz ?? 0;
            this.lx = init.lx ?? 1;
            this.ly = init.ly ?? 0;
            this.lz = init.lz ?? 0;
            this.ux = init.ux ?? 0;
            this.uy = init.uy ?? 0;
            this.uz = init.uz ?? 1;
            this.width = init.width ?? 1;
            this.color = init.color ?? "#000000";
            this.penDown = init.penDown ?? true;
        }
        clone() {
            return new Turtle3D({
                x: this.x, y: this.y, z: this.z,
                hx: this.hx, hy: this.hy, hz: this.hz,
                lx: this.lx, ly: this.ly, lz: this.lz,
                ux: this.ux, uy: this.uy, uz: this.uz,
                width: this.width,
                color: this.color,
                penDown: this.penDown,
            });
        }
        position() {
            return { x: this.x, y: this.y, z: this.z };
        }
        /**
         * Rotate the H and L vectors around U by `angle` radians.
         * (Yaw — turning left/right while keeping "up" fixed.)
         */
        rotateAroundU(angle) {
            const c = Math.cos(angle), s = Math.sin(angle);
            const newHx = c * this.hx + s * this.lx;
            const newHy = c * this.hy + s * this.ly;
            const newHz = c * this.hz + s * this.lz;
            const newLx = -s * this.hx + c * this.lx;
            const newLy = -s * this.hy + c * this.ly;
            const newLz = -s * this.hz + c * this.lz;
            this.hx = newHx;
            this.hy = newHy;
            this.hz = newHz;
            this.lx = newLx;
            this.ly = newLy;
            this.lz = newLz;
        }
        /**
         * Rotate the H and U vectors around L by `angle` radians.
         * (Pitch — tilting up or down while keeping "left" fixed.)
         */
        rotateAroundL(angle) {
            const c = Math.cos(angle), s = Math.sin(angle);
            const newHx = c * this.hx - s * this.ux;
            const newHy = c * this.hy - s * this.uy;
            const newHz = c * this.hz - s * this.uz;
            const newUx = s * this.hx + c * this.ux;
            const newUy = s * this.hy + c * this.uy;
            const newUz = s * this.hz + c * this.uz;
            this.hx = newHx;
            this.hy = newHy;
            this.hz = newHz;
            this.ux = newUx;
            this.uy = newUy;
            this.uz = newUz;
        }
        /**
         * Rotate the L and U vectors around H by `angle` radians.
         * (Roll — tilting sideways without changing direction of travel.)
         */
        rotateAroundH(angle) {
            const c = Math.cos(angle), s = Math.sin(angle);
            const newLx = c * this.lx - s * this.ux;
            const newLy = c * this.ly - s * this.uy;
            const newLz = c * this.lz - s * this.uz;
            const newUx = s * this.lx + c * this.ux;
            const newUy = s * this.ly + c * this.uy;
            const newUz = s * this.lz + c * this.uz;
            this.lx = newLx;
            this.ly = newLy;
            this.lz = newLz;
            this.ux = newUx;
            this.uy = newUy;
            this.uz = newUz;
        }
    }

    /**
     * F — move forward and draw. If the module has a parameter, it's the
     * distance; otherwise the default step length is used.
     *
     * Emits a Segment2D iff the pen is down. The segment carries a snapshot
     * of the current width and color so that downstream consumers see the
     * pen attributes that were active at draw time, not at consume time.
     */
    function forwardDraw(stepLength) {
        return ({ module, state, sink }) => {
            const d = param(module, 0, stepLength);
            const from = state.position();
            state.x += d * Math.cos(state.heading);
            state.y += d * Math.sin(state.heading);
            if (state.penDown) {
                sink.emit({
                    from,
                    to: state.position(),
                    width: state.width,
                    color: state.color,
                });
            }
        };
    }
    /** f — move forward without drawing (lowercase convention). */
    function forwardNoDraw(stepLength) {
        return ({ module, state }) => {
            const d = param(module, 0, stepLength);
            state.x += d * Math.cos(state.heading);
            state.y += d * Math.sin(state.heading);
        };
    }
    /** + — turn left (CCW) by the configured angle (or per-module parameter). */
    function turnLeft(angleDeg) {
        return ({ module, state }) => {
            const a = param(module, 0, angleDeg);
            state.heading += deg2rad(a);
        };
    }
    /** - — turn right (CW) by the configured angle (or per-module parameter). */
    function turnRight(angleDeg) {
        return ({ module, state }) => {
            const a = param(module, 0, angleDeg);
            state.heading -= deg2rad(a);
        };
    }
    /** | — turn around (180°). Common in L-systems for hexagonal/triangular layouts. */
    const turnAround = ({ state }) => {
        state.heading += Math.PI;
    };
    /** Set the pen color. Use with parametric modules like C(0xff0000). */
    const setColor = ({ module, state }) => {
        const c = module.params[0];
        if (c === undefined)
            return;
        // Numeric → hex color. Strings would need a different module shape.
        state.color = "#" + Math.floor(c).toString(16).padStart(6, "0");
    };
    /** Set the pen width. */
    const setWidth = ({ module, state }) => {
        const w = module.params[0];
        if (w !== undefined)
            state.width = w;
    };
    /** Lift the pen (subsequent F still moves but doesn't draw). */
    const penUp = ({ state }) => {
        state.penDown = false;
    };
    /** Lower the pen. */
    const penDown = ({ state }) => {
        state.penDown = true;
    };
    /**
     * The standard 2D turtle handler bundle. Customise by destructuring and
     * overriding, or by adding extra entries:
     *
     *   const handlers = {
     *     ...standardTurtle2D({ stepLength: 5, angleDegrees: 25 }),
     *     X: ({ state, sink }) => { ... custom handler ... },
     *   };
     */
    function standardTurtle2D(config = {}) {
        const step = config.stepLength ?? 1;
        const angle = config.angleDegrees ?? 90;
        return {
            F: forwardDraw(step),
            G: forwardDraw(step),
            f: forwardNoDraw(step),
            "+": turnLeft(angle),
            "-": turnRight(angle),
            "|": turnAround,
            C: setColor,
            "!": setWidth,
            "(": penUp,
            ")": penDown,
        };
    }

    /** F — move forward along H, drawing a segment. */
    function forwardDraw3D(stepLength) {
        return ({ module, state, sink }) => {
            const d = param(module, 0, stepLength);
            const from = state.position();
            state.x += d * state.hx;
            state.y += d * state.hy;
            state.z += d * state.hz;
            if (state.penDown) {
                sink.emit({
                    from,
                    to: state.position(),
                    width: state.width,
                    color: state.color,
                });
            }
        };
    }
    /** f — move forward without drawing. */
    function forwardNoDraw3D(stepLength) {
        return ({ module, state }) => {
            const d = param(module, 0, stepLength);
            state.x += d * state.hx;
            state.y += d * state.hy;
            state.z += d * state.hz;
        };
    }
    /** + — yaw left (rotate H and L around U). */
    function yawLeft(angleDeg) {
        return ({ module, state }) => {
            const a = param(module, 0, angleDeg);
            state.rotateAroundU(deg2rad(a));
        };
    }
    /** - — yaw right. */
    function yawRight(angleDeg) {
        return ({ module, state }) => {
            const a = param(module, 0, angleDeg);
            state.rotateAroundU(-deg2rad(a));
        };
    }
    /** & — pitch down (rotate H and U around L). */
    function pitchDown(angleDeg) {
        return ({ module, state }) => {
            const a = param(module, 0, angleDeg);
            state.rotateAroundL(deg2rad(a));
        };
    }
    /** ^ — pitch up. */
    function pitchUp(angleDeg) {
        return ({ module, state }) => {
            const a = param(module, 0, angleDeg);
            state.rotateAroundL(-deg2rad(a));
        };
    }
    /** \ — roll left (rotate L and U around H). */
    function rollLeft(angleDeg) {
        return ({ module, state }) => {
            const a = param(module, 0, angleDeg);
            state.rotateAroundH(deg2rad(a));
        };
    }
    /** / — roll right. */
    function rollRight(angleDeg) {
        return ({ module, state }) => {
            const a = param(module, 0, angleDeg);
            state.rotateAroundH(-deg2rad(a));
        };
    }
    /** | — turn around (180° yaw). */
    const turnAround3D = ({ state }) => {
        state.rotateAroundU(Math.PI);
    };
    /**
     * Standard 3D turtle handlers, following ABoP conventions.
     *
     *   F, G    forward + draw
     *   f       forward, no draw
     *   + -     yaw   (around U)
     *   & ^     pitch (around L)
     *   \ /     roll  (around H)
     *   |       turn around
     *
     * Combine with your own handlers as needed.
     */
    function standardTurtle3D(config = {}) {
        const step = config.stepLength ?? 1;
        const angle = config.angleDegrees ?? 30;
        return {
            F: forwardDraw3D(step),
            G: forwardDraw3D(step),
            f: forwardNoDraw3D(step),
            "+": yawLeft(angle),
            "-": yawRight(angle),
            "&": pitchDown(angle),
            "^": pitchUp(angle),
            "\\": rollLeft(angle),
            "/": rollRight(angle),
            "|": turnAround3D,
        };
    }

    var index$j = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Turtle2D: Turtle2D,
        Turtle3D: Turtle3D,
        deg2rad: deg2rad,
        forwardDraw: forwardDraw,
        forwardDraw3D: forwardDraw3D,
        forwardNoDraw: forwardNoDraw,
        forwardNoDraw3D: forwardNoDraw3D,
        penDown: penDown,
        penUp: penUp,
        pitchDown: pitchDown,
        pitchUp: pitchUp,
        rollLeft: rollLeft,
        rollRight: rollRight,
        setColor: setColor,
        setWidth: setWidth,
        standardTurtle2D: standardTurtle2D,
        standardTurtle3D: standardTurtle3D,
        turnAround: turnAround,
        turnAround3D: turnAround3D,
        turnLeft: turnLeft,
        turnRight: turnRight,
        yawLeft: yawLeft,
        yawRight: yawRight
    });

    /** Convenience accessor for the focal module of a match context. */
    function focalModule(ctx) {
        return ctx.word[ctx.index];
    }

    /**
     * Matches when the focal module has the given name and (optionally)
     * the expected arity. Binds the module's parameters to the named
     * variables provided in `paramNames`, in order.
     *
     * Examples:
     *   new SymbolMatch("F")                  — matches 'F' with any params
     *   new SymbolMatch("F", [])              — matches 'F' with no params
     *   new SymbolMatch("A", ["n"])           — matches 'A(x)', binds n = x
     *   new SymbolMatch("B", ["x", "y"])      — matches 'B(a,b)', binds x = a, y = b
     *
     * If paramNames is undefined, arity is unchecked and no binding is added.
     * If paramNames is provided, the module must have exactly that arity.
     */
    class SymbolMatch {
        name;
        paramNames;
        constructor(name, paramNames) {
            this.name = name;
            this.paramNames = paramNames;
        }
        match(ctx, incoming) {
            const m = focalModule(ctx);
            if (!m)
                return null;
            if (m.name !== this.name)
                return null;
            if (this.paramNames === undefined) {
                return incoming;
            }
            if (m.params.length !== this.paramNames.length)
                return null;
            if (this.paramNames.length === 0)
                return incoming;
            const next = { ...incoming };
            for (let i = 0; i < this.paramNames.length; i++) {
                next[this.paramNames[i]] = m.params[i];
            }
            return next;
        }
    }

    /**
     * A condition over parameters. Evaluates a compiled expression against
     * the incoming binding; matches iff the expression is truthy.
     *
     * Use as a sibling of SymbolMatch inside an And-predicate, since this
     * predicate itself does no symbol matching — it just checks variables.
     *
     *   new ParamCondition("n > 0")
     *   new ParamCondition("x < 10 && y > 0")
     */
    class ParamCondition {
        expr;
        constructor(condition) {
            this.expr =
                typeof condition === "string" ? parseExpression(condition) : condition;
        }
        match(_ctx, incoming) {
            try {
                return evaluateBoolean(this.expr, incoming) ? incoming : null;
            }
            catch {
                // An unbound variable or division-by-zero in a condition means
                // the rule simply doesn't apply at this position.
                return null;
            }
        }
    }

    const DEFAULT_OPTS = {
        skipBrackets: true,
        openBracket: "[",
        closeBracket: "]",
    };
    function bindSlot(slot, m, incoming) {
        if (m.name !== slot.name)
            return null;
        if (slot.paramNames === undefined)
            return incoming;
        if (m.params.length !== slot.paramNames.length)
            return null;
        if (slot.paramNames.length === 0)
            return incoming;
        const next = { ...incoming };
        for (let i = 0; i < slot.paramNames.length; i++) {
            next[slot.paramNames[i]] = m.params[i];
        }
        return next;
    }
    /**
     * Walk leftward from `from` (exclusive) and collect the main-axis predecessors,
     * skipping branch subtrees. The result is in main-axis order (so the immediate
     * predecessor is the last element).
     *
     * Branch-skipping leftward: when we encounter `]`, we're exiting a branch
     * we never entered, so we walk back past the matching `[` and continue.
     */
    function collectLeftAxis(word, from, count, opts) {
        const out = [];
        let i = from - 1;
        while (i >= 0 && out.length < count) {
            const m = word[i];
            if (opts.skipBrackets && m.name === opts.closeBracket) {
                // Skip back to the matching opening bracket.
                let depth = 1;
                i -= 1;
                while (i >= 0 && depth > 0) {
                    const inner = word[i];
                    if (inner.name === opts.closeBracket)
                        depth += 1;
                    else if (inner.name === opts.openBracket)
                        depth -= 1;
                    i -= 1;
                }
                continue;
            }
            if (opts.skipBrackets && m.name === opts.openBracket) {
                // An unmatched '[' going left means we're inside a branch ourselves;
                // the parent module is just past this bracket.
                i -= 1;
                continue;
            }
            out.push(m);
            i -= 1;
        }
        return out.reverse();
    }
    /**
     * Walk rightward from `from` (exclusive) and collect the main-axis successors,
     * skipping branch subtrees that begin with `[`.
     */
    function collectRightAxis(word, from, count, opts) {
        const out = [];
        let i = from + 1;
        while (i < word.length && out.length < count) {
            const m = word[i];
            if (opts.skipBrackets && m.name === opts.openBracket) {
                // Skip the entire branch subtree.
                let depth = 1;
                i += 1;
                while (i < word.length && depth > 0) {
                    const inner = word[i];
                    if (inner.name === opts.openBracket)
                        depth += 1;
                    else if (inner.name === opts.closeBracket)
                        depth -= 1;
                    i += 1;
                }
                continue;
            }
            if (opts.skipBrackets && m.name === opts.closeBracket) {
                // We've left the branch our focal module sits in — no more axis successors.
                break;
            }
            out.push(m);
            i += 1;
        }
        return out;
    }
    /**
     * Matches when the modules immediately preceding the focal module (along
     * the main axis, skipping branches) match `pattern` in order. The pattern's
     * last slot is the immediate predecessor.
     *
     *   new LeftContext([{ name: "B" }])              — predecessor is B
     *   new LeftContext([{ name: "A", paramNames: ["k"] }, { name: "B" }])
     *       — predecessors are A(x) then B, binds k = x
     */
    class LeftContext {
        pattern;
        opts;
        constructor(pattern, options = {}) {
            this.pattern = pattern;
            this.opts = { ...DEFAULT_OPTS, ...options };
        }
        match(ctx, incoming) {
            if (this.pattern.length === 0)
                return incoming;
            const axis = collectLeftAxis(ctx.word, ctx.index, this.pattern.length, this.opts);
            if (axis.length < this.pattern.length)
                return null;
            let binding = incoming;
            for (let i = 0; i < this.pattern.length; i++) {
                const next = bindSlot(this.pattern[i], axis[i], binding);
                if (next === null)
                    return null;
                binding = next;
            }
            return binding;
        }
    }
    /**
     * Matches when the modules immediately following the focal module (along
     * the main axis, skipping branches) match `pattern` in order. The pattern's
     * first slot is the immediate successor.
     */
    class RightContext {
        pattern;
        opts;
        constructor(pattern, options = {}) {
            this.pattern = pattern;
            this.opts = { ...DEFAULT_OPTS, ...options };
        }
        match(ctx, incoming) {
            if (this.pattern.length === 0)
                return incoming;
            const axis = collectRightAxis(ctx.word, ctx.index, this.pattern.length, this.opts);
            if (axis.length < this.pattern.length)
                return null;
            let binding = incoming;
            for (let i = 0; i < this.pattern.length; i++) {
                const next = bindSlot(this.pattern[i], axis[i], binding);
                if (next === null)
                    return null;
                binding = next;
            }
            return binding;
        }
    }

    /**
     * Conjunction. Sub-predicates run in order; each receives the binding
     * produced by the previous one, so later predicates can use variables
     * bound earlier (e.g. SymbolMatch binds `n`, then ParamCondition checks it).
     *
     * Short-circuits on the first failure.
     */
    class And {
        preds;
        constructor(...preds) {
            this.preds = preds;
        }
        match(ctx, incoming) {
            let binding = incoming;
            for (const p of this.preds) {
                const next = p.match(ctx, binding);
                if (next === null)
                    return null;
                binding = next;
            }
            return binding;
        }
    }
    /**
     * Disjunction. Returns the binding from the first sub-predicate that matches.
     * Note: bindings from alternative branches are NOT merged — each alternative
     * stands alone, so a variable bound only in one branch won't be visible if
     * a different branch matched. Use thoughtfully.
     */
    class Or {
        preds;
        constructor(...preds) {
            this.preds = preds;
        }
        match(ctx, incoming) {
            for (const p of this.preds) {
                const next = p.match(ctx, incoming);
                if (next !== null)
                    return next;
            }
            return null;
        }
    }
    /**
     * Negation. Returns the incoming binding unchanged if the inner predicate
     * fails to match, null otherwise. Any bindings the inner predicate would
     * have produced are discarded (there's nothing for them to refer to since
     * the inner pattern didn't actually apply).
     */
    class Not {
        pred;
        constructor(pred) {
            this.pred = pred;
        }
        match(ctx, incoming) {
            const result = this.pred.match(ctx, incoming);
            return result === null ? incoming : null;
        }
    }
    /** A predicate that always matches and adds nothing to the binding. */
    const ALWAYS = {
        match(_ctx, incoming) {
            return incoming;
        },
    };

    /** Build a ModuleTemplate from a name and optional parameter expressions. */
    function tmpl(name, paramExprs = []) {
        return {
            name,
            paramExprs: paramExprs.map((e) => {
                if (typeof e === "number")
                    return { kind: "num", value: e };
                if (typeof e === "string")
                    return parseExpression(e);
                return e;
            }),
        };
    }
    /** Evaluate an expansion against a binding to produce concrete modules. */
    function evaluateExpansion(expansion, binding) {
        return expansion.map((t) => {
            const params = t.paramExprs.map((e) => evaluate(e, binding));
            return mod(t.name, params);
        });
    }

    /** Build a rule, defaulting weight to 1 for deterministic use. */
    function rule(predicate, expansion, options = {}) {
        const weight = options.weight ?? 1;
        if (weight < 0 || !Number.isFinite(weight)) {
            throw new Error(`Invalid rule weight: ${weight}`);
        }
        return {
            predicate,
            expansion,
            weight,
            label: options.label,
        };
    }

    /**
     * Deterministic selector: picks the first matching rule. With non-overlapping
     * rules this is the standard D0L behavior. With overlapping rules, ordering
     * in the ruleset becomes the priority order.
     */
    class FirstMatch {
        select(matches) {
            return matches[0] ?? null;
        }
    }
    /**
     * Stochastic selector: weighted-random pick among candidates. Weight 0
     * matches are excluded. If all matches have weight 0, returns null.
     */
    class WeightedRandom {
        rng;
        constructor(rng) {
            this.rng = rng;
        }
        select(matches) {
            if (matches.length === 0)
                return null;
            let total = 0;
            for (const m of matches)
                total += m.rule.weight;
            if (total <= 0)
                return null;
            let pick = this.rng.random() * total;
            for (const m of matches) {
                pick -= m.rule.weight;
                if (pick <= 0)
                    return m;
            }
            // Floating-point safety net.
            return matches[matches.length - 1] ?? null;
        }
    }

    /**
     * Find every rule whose predicate matches at the given position.
     * Returns one RuleMatch per matching rule (with its binding).
     */
    function findMatches(word, index, ruleset) {
        const matches = [];
        const ctx = { word, index };
        for (const rule of ruleset) {
            const binding = rule.predicate.match(ctx, EMPTY_BINDING);
            if (binding !== null) {
                matches.push({ rule, binding });
            }
        }
        return matches;
    }
    /**
     * Perform one rewriting pass.
     *
     * Crucially, this is *parallel* rewriting: every module in the input is
     * replaced based on the original word, not on any in-progress output.
     * We iterate positions, look up matches against the input word, and
     * append expansion modules to a fresh output array. The input is never
     * mutated and the output is never read.
     *
     * Modules with no matching rule pass through unchanged (the identity
     * rule), which is what lets bracket and rotation symbols survive when
     * no explicit rule is given for them.
     */
    function rewriteOnce(word, ruleset, selector) {
        const out = [];
        for (let i = 0; i < word.length; i++) {
            const matches = findMatches(word, i, ruleset);
            const chosen = matches.length > 0 ? selector.select(matches) : null;
            if (chosen === null) {
                // Identity expansion — pass the module through unchanged.
                out.push(word[i]);
            }
            else {
                const expanded = evaluateExpansion(chosen.rule.expansion, chosen.binding);
                for (const m of expanded)
                    out.push(m);
            }
        }
        return out;
    }
    /** Iteratively rewrite for `n` passes. */
    function rewrite(axiom, ruleset, selector, iterations) {
        if (iterations < 0 || !Number.isInteger(iterations)) {
            throw new Error(`Invalid iteration count: ${iterations}`);
        }
        let current = axiom;
        for (let i = 0; i < iterations; i++) {
            current = rewriteOnce(current, ruleset, selector);
        }
        return current;
    }
    /**
     * Streaming rewrite — yields each generation in turn. Useful for visualizing
     * growth, debugging, or stopping early once the word exceeds some size.
     */
    function* rewriteGenerations(axiom, ruleset, selector, maxIterations) {
        let current = axiom;
        // Yield generation 0 (the axiom itself, as a fresh array).
        yield [...current];
        for (let i = 0; i < maxIterations; i++) {
            current = rewriteOnce(current, ruleset, selector);
            yield [...current];
        }
    }
    function traceRewrite(word, ruleset, selector) {
        const out = [];
        const trace = [];
        for (let i = 0; i < word.length; i++) {
            const matches = findMatches(word, i, ruleset);
            const chosen = matches.length > 0 ? selector.select(matches) : null;
            trace.push({
                position: i,
                module: word[i],
                chosenRule: chosen?.rule ?? null,
            });
            if (chosen === null) {
                out.push(word[i]);
            }
            else {
                const expanded = evaluateExpansion(chosen.rule.expansion, chosen.binding);
                for (const m of expanded)
                    out.push(m);
            }
        }
        return { result: out, trace };
    }

    /**
     * Convenience wrapper bundling an axiom, ruleset, and selector.
     *
     * The LSystem doesn't add any capability beyond the free functions in
     * rewriter.ts — it just makes the common case ergonomic. The pure functions
     * remain the canonical interface for anything fancier.
     */
    class LSystem {
        axiom;
        ruleset;
        selector;
        constructor(config) {
            this.axiom = config.axiom;
            this.ruleset = config.ruleset;
            this.selector = config.selector ?? new FirstMatch();
        }
        /** Run the rewriter for `iterations` passes and return the final word. */
        run(iterations) {
            return rewrite(this.axiom, this.ruleset, this.selector, iterations);
        }
        /** Run a single rewriting step from a given word. */
        step(word) {
            return rewriteOnce(word, this.ruleset, this.selector);
        }
        /** Stream each generation from 0..maxIterations. */
        generations(maxIterations) {
            return rewriteGenerations(this.axiom, this.ruleset, this.selector, maxIterations);
        }
    }

    /**
     * Parse a string of modules — used for axioms and (when no expressions are
     * needed) for plain rule right-hand-sides. Each character is a separate
     * module unless followed by '(' which begins a parameter list.
     *
     * Examples:
     *   "F+F-F"               → [F, +, F, -, F]
     *   "F(1.5)+F(2)"         → [F(1.5), +, F(2)]
     *   "A(3,0.5)[B]"         → [A(3,0.5), [, B, ]]
     *
     * Multi-character symbols are not supported in this simple form — use the
     * programmatic API (mod / tmpl) for those.
     */
    function parseWord(src) {
        const out = [];
        let i = 0;
        while (i < src.length) {
            const c = src[i];
            if (/\s/.test(c)) {
                i += 1;
                continue;
            }
            const name = c;
            i += 1;
            if (src[i] === "(") {
                const close = src.indexOf(")", i);
                if (close === -1) {
                    throw new Error(`Unclosed '(' at position ${i} in "${src}"`);
                }
                const paramSrc = src.slice(i + 1, close);
                const params = paramSrc.split(",").map((s) => Number(s.trim()));
                if (params.some((n) => Number.isNaN(n))) {
                    throw new Error(`Invalid numeric params in "${paramSrc}"`);
                }
                out.push(mod(name, params));
                i = close + 1;
            }
            else {
                out.push(mod(name));
            }
        }
        return out;
    }
    /**
     * Parse a template string — the right-hand side of a rule, where module
     * parameters may be expressions referring to bound variables.
     *
     * Examples:
     *   "F[+F]F"              → templates with no params
     *   "F(n*0.5)A(n-1)"      → expression-valued params
     */
    function parseTemplate(src) {
        const out = [];
        let i = 0;
        while (i < src.length) {
            const c = src[i];
            if (/\s/.test(c)) {
                i += 1;
                continue;
            }
            const name = c;
            i += 1;
            const paramExprs = [];
            if (src[i] === "(") {
                // Find matching ')' allowing nested parentheses inside expressions.
                let depth = 1;
                let j = i + 1;
                while (j < src.length && depth > 0) {
                    if (src[j] === "(")
                        depth += 1;
                    else if (src[j] === ")")
                        depth -= 1;
                    if (depth > 0)
                        j += 1;
                }
                if (depth !== 0) {
                    throw new Error(`Unclosed '(' at position ${i} in "${src}"`);
                }
                const paramSrc = src.slice(i + 1, j);
                // Split on top-level commas only.
                const parts = splitTopLevelCommas(paramSrc);
                for (const part of parts) {
                    const trimmed = part.trim();
                    if (trimmed.length > 0)
                        paramExprs.push(parseExpression(trimmed));
                }
                i = j + 1;
            }
            out.push({ name, paramExprs });
        }
        return out;
    }
    function splitTopLevelCommas(src) {
        const out = [];
        let depth = 0;
        let start = 0;
        for (let i = 0; i < src.length; i++) {
            const c = src[i];
            if (c === "(")
                depth += 1;
            else if (c === ")")
                depth -= 1;
            else if (c === "," && depth === 0) {
                out.push(src.slice(start, i));
                start = i + 1;
            }
        }
        out.push(src.slice(start));
        return out;
    }

    /**
     * Parse a single rule in classic L-system notation.
     *
     * Supported forms (whitespace is ignored except inside expressions):
     *
     *   "F -> F+F"                                  — D0L
     *   "A(n) -> F(n)A(n+1)"                        — parametric
     *   "A(n) : n > 0 -> F(n)"                      — parametric with condition
     *   "B < A > C -> X"                            — context-sensitive
     *   "B(k) < A(n) > C : n > k -> F(n-k)"         — parametric + context + condition
     *   "F -> F[+F]F  : 0.4"                        — stochastic (weight 0.4)
     *
     * Predecessor (the LHS focal symbol) has the form  SYMBOL  or  SYMBOL(var1,var2,...).
     * Context slots have the same form. The condition starts with ':' and is an
     * expression. The arrow is either '->' or '→'. An optional ' : <number>' at
     * the very end specifies the rule's weight for stochastic selection.
     */
    const ARROW_RE = /->|→/;
    function parsePredecessor(src) {
        const trimmed = src.trim();
        const openIdx = trimmed.indexOf("(");
        if (openIdx === -1) {
            if (trimmed.length !== 1) {
                throw new Error(`Predecessor must be a single symbol, got "${trimmed}"`);
            }
            return { name: trimmed, paramNames: undefined };
        }
        if (!trimmed.endsWith(")")) {
            throw new Error(`Malformed predecessor "${trimmed}"`);
        }
        const name = trimmed.slice(0, openIdx);
        if (name.length !== 1) {
            throw new Error(`Predecessor symbol must be one character: "${name}"`);
        }
        const inner = trimmed.slice(openIdx + 1, -1).trim();
        if (inner.length === 0)
            return { name, paramNames: [] };
        const paramNames = inner.split(",").map((s) => s.trim());
        for (const p of paramNames) {
            if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(p)) {
                throw new Error(`Invalid parameter name "${p}" in "${trimmed}"`);
            }
        }
        return { name, paramNames };
    }
    function parseContextSlots(src) {
        // Context is a juxtaposition of predecessor-shaped specs, e.g. "A(n)B(k)C".
        const slots = [];
        let i = 0;
        const trimmed = src.trim();
        while (i < trimmed.length) {
            const c = trimmed[i];
            if (/\s/.test(c)) {
                i += 1;
                continue;
            }
            const name = c;
            i += 1;
            let paramNames = undefined;
            if (trimmed[i] === "(") {
                const close = trimmed.indexOf(")", i);
                if (close === -1) {
                    throw new Error(`Unclosed '(' in context "${trimmed}"`);
                }
                const inner = trimmed.slice(i + 1, close).trim();
                paramNames = inner.length === 0 ? [] : inner.split(",").map((s) => s.trim());
                for (const p of paramNames) {
                    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(p)) {
                        throw new Error(`Invalid parameter name "${p}" in context`);
                    }
                }
                i = close + 1;
            }
            slots.push({ name, paramNames });
        }
        return slots;
    }
    /**
     * Split off an optional trailing weight specifier of the form " : <number>".
     * We have to be careful: rule conditions also use ':'. The weight specifier
     * sits *after* the arrow, so we only look at the RHS portion.
     */
    function extractWeight(rhs) {
        // Find a ':' followed by something that parses as a finite number to end of string.
        for (let i = rhs.length - 1; i >= 0; i--) {
            if (rhs[i] === ":") {
                const candidate = rhs.slice(i + 1).trim();
                const n = Number(candidate);
                if (Number.isFinite(n) && candidate.length > 0) {
                    return { rhs: rhs.slice(0, i).trim(), weight: n };
                }
                break;
            }
        }
        return { rhs: rhs.trim(), weight: 1 };
    }
    function parseRule(src) {
        const arrowMatch = src.match(ARROW_RE);
        if (!arrowMatch) {
            throw new Error(`Rule missing arrow: "${src}"`);
        }
        const arrowIdx = arrowMatch.index;
        const lhs = src.slice(0, arrowIdx).trim();
        const rawRhs = src.slice(arrowIdx + arrowMatch[0].length).trim();
        const { rhs, weight } = extractWeight(rawRhs);
        // Split LHS into context-and-predecessor, then condition.
        let condition;
        let lhsHead = lhs;
        const colonIdx = lhs.indexOf(":");
        if (colonIdx !== -1) {
            lhsHead = lhs.slice(0, colonIdx).trim();
            condition = lhs.slice(colonIdx + 1).trim();
        }
        // Split lhsHead around '<' and '>' to get [leftCtx <] predecessor [> rightCtx].
        let leftCtxSrc;
        let rightCtxSrc;
        let predSrc = lhsHead;
        const ltIdx = lhsHead.indexOf("<");
        const gtIdx = lhsHead.indexOf(">");
        if (ltIdx !== -1 && gtIdx !== -1) {
            if (gtIdx < ltIdx) {
                throw new Error(`'>' before '<' in "${lhsHead}"`);
            }
            leftCtxSrc = lhsHead.slice(0, ltIdx).trim();
            predSrc = lhsHead.slice(ltIdx + 1, gtIdx).trim();
            rightCtxSrc = lhsHead.slice(gtIdx + 1).trim();
        }
        else if (ltIdx !== -1) {
            leftCtxSrc = lhsHead.slice(0, ltIdx).trim();
            predSrc = lhsHead.slice(ltIdx + 1).trim();
        }
        else if (gtIdx !== -1) {
            predSrc = lhsHead.slice(0, gtIdx).trim();
            rightCtxSrc = lhsHead.slice(gtIdx + 1).trim();
        }
        const pred = parsePredecessor(predSrc);
        const expansion = parseTemplate(rhs);
        const preds = [new SymbolMatch(pred.name, pred.paramNames)];
        if (leftCtxSrc && leftCtxSrc.length > 0) {
            preds.push(new LeftContext(parseContextSlots(leftCtxSrc)));
        }
        if (rightCtxSrc && rightCtxSrc.length > 0) {
            preds.push(new RightContext(parseContextSlots(rightCtxSrc)));
        }
        if (condition && condition.length > 0) {
            preds.push(new ParamCondition(condition));
        }
        const predicate = preds.length === 1 ? preds[0] : new And(...preds);
        return rule(predicate, expansion, { weight, label: src });
    }
    /**
     * Parse multiple rules separated by newlines or semicolons.
     * Blank lines and lines starting with '#' (comments) are ignored.
     */
    function parseRules(src) {
        return src
            .split(/[\n;]+/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0 && !line.startsWith("#"))
            .map(parseRule);
    }

    /**
     * Composable Lindenmayer system core.
     *
     * Layers (each independently usable):
     *   symbols/       — Module, Word, basic data types
     *   expressions/   — AST, parser, evaluator for parametric expressions
     *   predicates/    — SymbolMatch, ParamCondition, LeftContext, RightContext, And/Or/Not
     *   rules/         — Rule, Expansion, ModuleTemplate
     *   selectors/     — FirstMatch (deterministic), WeightedRandom (stochastic)
     *   rewriter/      — rewriteOnce, rewrite, LSystem facade
     *   parser/        — classic L-system text syntax
     */

    var index$i = /*#__PURE__*/Object.freeze({
        __proto__: null,
        ALWAYS: ALWAYS,
        And: And,
        ArraySink: ArraySink,
        EMPTY_BINDING: EMPTY_BINDING,
        EvaluationError: EvaluationError,
        FirstMatch: FirstMatch,
        LSystem: LSystem,
        LeftContext: LeftContext,
        Not: Not,
        Or: Or,
        ParamCondition: ParamCondition,
        ParseError: ParseError,
        RightContext: RightContext,
        SymbolMatch: SymbolMatch,
        WeightedRandom: WeightedRandom,
        evaluate: evaluate,
        evaluateBoolean: evaluateBoolean,
        evaluateExpansion: evaluateExpansion,
        focalModule: focalModule,
        interpret: interpret,
        interpretStream: interpretStream,
        mod: mod,
        moduleEquals: moduleEquals,
        param: param,
        params: params,
        parseExpression: parseExpression,
        parseRule: parseRule,
        parseRules: parseRules,
        parseTemplate: parseTemplate,
        parseWord: parseWord,
        rewrite: rewrite,
        rewriteGenerations: rewriteGenerations,
        rewriteOnce: rewriteOnce,
        rule: rule,
        tmpl: tmpl,
        traceRewrite: traceRewrite,
        turtle: index$j,
        wordToString: wordToString
    });

    // ──────────────────────────────────────────────────────────────────────────────
    // Abstract base: derives `tangentNorm` and `angle` from `innerProduct`
    // ──────────────────────────────────────────────────────────────────────────────
    class AbstractRiemannianManifold {
        tangentNorm(base, v) {
            return Math.sqrt(Math.max(0, this.innerProduct(base, v, v)));
        }
        angle(base, u, v) {
            const nu = this.tangentNorm(base, u);
            const nv = this.tangentNorm(base, v);
            if (nu < Vector.EPSILON || nv < Vector.EPSILON) {
                throw new Error('Cannot compute angle with a zero tangent vector');
            }
            const cos = clamp(this.innerProduct(base, u, v) / (nu * nv), -1, 1);
            return Math.acos(cos);
        }
        /**
         * Computes the angle bisector of two tangent vectors at `base`, returned
         * as a unit tangent vector (under the metric `g_base`).
         *
         * The bisector is the tangent vector pointing "halfway between" `u` and
         * `v` in the tangent space `T_base M`, with all norms and orthogonality
         * measured under the Riemannian inner product at `base` — not the
         * ambient Euclidean dot product. On manifolds where the metric differs
         * from Euclidean (e.g. the Poincaré ball), this will generally not
         * agree with the bisector you'd get by treating `u` and `v` as plain
         * vectors in R^D.
         *
         * Formula: normalize(u/‖u‖_p + v/‖v‖_p), where ‖·‖_p and the final
         * normalization both use `tangentNorm(base, ·)`.
         *
         * @param base - The point on the manifold at which `u` and `v` are
         *               tangent. The metric tensor is evaluated here.
         * @param u    - A tangent vector at `base`. Must be nonzero.
         * @param v    - A tangent vector at `base`. Must be nonzero.
         * @returns A unit tangent vector at `base` (under `g_base`) bisecting
         *          the angle between `u` and `v`.
         * @throws Error if either `u` or `v` has zero norm under `g_base`.
         * @throws Error if `u` and `v` point in opposite directions in the
         *               tangent space. In that case the bisector is not unique
         *               — every vector orthogonal to `u` in `T_base M` is a
         *               valid bisector — and the caller must disambiguate.
         *
         * @example
         * ```typescript
         * // Euclidean: bisector of the x- and y-axes at the origin is the
         * // 45° unit vector, as expected.
         * const R2 = new EuclideanSpace<2>();
         * const origin = new Vector2D([0, 0]);
         * const ex = new Vector2D([1, 0]);
         * const ey = new Vector2D([0, 1]);
         * R2.angleBisector(origin, ex, ey); // ≈ [√2/2, √2/2]
         * ```
         *
         * @example
         * ```typescript
         * // On the sphere, bisect two tangent directions at the north pole.
         * const S2 = new SphericalSpace<3>();
         * const north = new Vector3D([0, 0, 1]);
         * const east  = new Vector3D([1, 0, 0]); // tangent at north
         * const south = new Vector3D([0, 1, 0]); // tangent at north
         * const mid = S2.angleBisector(north, east, south);
         * // `mid` is a unit tangent vector at `north` halfway between east
         * // and south; following the geodesic from `north` along `mid`
         * // walks the meridian between them.
         * ```
         */
        angleBisector(base, u, v) {
            const nu = this.tangentNorm(base, u);
            const nv = this.tangentNorm(base, v);
            if (nu < Vector.EPSILON || nv < Vector.EPSILON) {
                throw new Error('Cannot compute angle bisector with a zero tangent vector');
            }
            const sum = u.scale(1 / nu).add(v.scale(1 / nv));
            const ns = this.tangentNorm(base, sum);
            if (ns < Vector.EPSILON) {
                throw new Error('Angle bisector is not unique: u and v point in opposite directions ' +
                    'in the tangent space at `base`');
            }
            return sum.scale(1 / ns);
        }
        /**
         * Checks if this vector is perpendicular (orthogonal) to another vector.
         * Two vectors are perpendicular if their dot product is zero.
         *
         * Tests if vectors are at right angles to each other.
         * Perpendicular vectors are crucial in:
         * - Constructing coordinate systems
         * - Finding normal vectors
         * - Camera systems in 3D graphics
         * - Physics (orthogonal forces)
         *
         * Example:
         * ```typescript
         * // 3D coordinate system vectors
         * const xAxis = new Vector3D([1, 0, 0]);
         * const yAxis = new Vector3D([0, 1, 0]);
         * const zAxis = new Vector3D([0, 0, 1]);
         *
         * // Verify orthogonality
         * console.log(xAxis.areOrthogonal(yAxis));  // true
         * console.log(yAxis.areOrthogonal(zAxis));  // true
         *
         * // Camera setup
         * const cameraForward = new Vector3D([0, 0, 1]);
         * const cameraRight = new Vector3D([1, 0, 0]);
         * const cameraUp = new Vector3D([0, 1, 0]);
         *
         * // Verify camera axes are perpendicular
         * if (cameraForward.areOrthogonal(cameraRight) &&
         *     cameraRight.areOrthogonal(cameraUp) &&
         *     cameraUp.areOrthogonal(cameraForward)) {
         *     console.log("Camera coordinate system is orthogonal");
         * }
         * ```
         *
         * @param other - The vector to check perpendicularity with
         * @param epsilon - Tolerance for floating-point comparisons
         * @returns true if vectors are perpendicular within epsilon
         */
        areOrthogonal(a, b, epsilon = Vector.EPSILON) {
            Vector.ensureSameDimension(a, b, 'check orthoganality');
            return Math.abs(a.dot(b)) < epsilon;
        }
        project(base, u, v) {
            // proj_v(u) = ( g_p(u, v) / g_p(v, v) ) · v
            const vv = this.innerProduct(base, v, v);
            if (vv < Vector.EPSILON) {
                throw new Error('Cannot project onto a zero tangent vector');
            }
            return v.scale(this.innerProduct(base, u, v) / vv);
        }
    }
    // ──────────────────────────────────────────────────────────────────────────────
    // Euclidean R^D with the standard dot-product metric
    // ──────────────────────────────────────────────────────────────────────────────
    class EuclideanSpace extends AbstractRiemannianManifold {
        distance(a, b) {
            return a.subtract(b).length();
        }
        geodesic(a, b, t) {
            // (1 - t)·a + t·b
            return a.scale(1 - t).add(b.scale(t));
        }
        exp(base, tangent) {
            return base.add(tangent);
        }
        log(base, target) {
            return target.subtract(base);
        }
        innerProduct(_base, u, v) {
            // Metric is constant (identity), so `base` is unused.
            return u.dot(v);
        }
    }
    // ──────────────────────────────────────────────────────────────────────────────
    // Lp-style metric spaces: NOT Riemannian, NOT uniquely geodesic (except p=2)
    //
    // We don't fabricate geodesics for these. Manhattan has infinitely many
    // shortest paths between most pairs; no inner product induces the L1/L∞/Lp
    // (p≠2) norm. They only implement MetricSpace.
    // ──────────────────────────────────────────────────────────────────────────────
    class ManhattanSpace {
        distance(a, b) {
            // Σ |aᵢ - bᵢ|
            let s = 0;
            const n = a.dimension;
            for (let i = 0; i < n; i++)
                s += Math.abs(a.get(i) - b.get(i));
            return s;
        }
    }
    class ChebyshevSpace {
        distance(a, b) {
            // max |aᵢ - bᵢ|
            let m = 0;
            const n = a.dimension;
            for (let i = 0; i < n; i++) {
                const d = Math.abs(a.get(i) - b.get(i));
                if (d > m)
                    m = d;
            }
            return m;
        }
    }
    /**
     * Minkowski Lp metric, p ≥ 1. p=1 → Manhattan, p=2 → Euclidean, p=∞ → Chebyshev.
     * For p=2 you almost certainly want `EuclideanSpace` — it gives the full
     * Riemannian structure rather than just a metric.
     */
    class MinkowskiSpace {
        p;
        constructor(p) {
            this.p = p;
            if (!(p >= 1))
                throw new Error('Minkowski order p must be >= 1');
        }
        distance(a, b) {
            if (this.p === Infinity) {
                // Reduce to Chebyshev — pow(x, Infinity) is a NaN/Infinity hazard.
                let m = 0;
                const n = a.dimension;
                for (let i = 0; i < n; i++) {
                    const d = Math.abs(a.get(i) - b.get(i));
                    if (d > m)
                        m = d;
                }
                return m;
            }
            let s = 0;
            const n = a.dimension;
            for (let i = 0; i < n; i++) {
                s += Math.pow(Math.abs(a.get(i) - b.get(i)), this.p);
            }
            return Math.pow(s, 1 / this.p);
        }
    }
    // ──────────────────────────────────────────────────────────────────────────────
    // Sphere S^(D-1) embedded in R^D
    //
    // Points must lie on the unit sphere (||x|| = 1). Tangent vectors at p are
    // ambient R^D vectors with p · v = 0. Geodesics are great-circle arcs.
    // The induced metric on the tangent plane is just the ambient dot product.
    // ──────────────────────────────────────────────────────────────────────────────
    class SphericalSpace extends AbstractRiemannianManifold {
        /** Antipodal-pair check: log/geodesic are undefined when b = -a. */
        static isAntipodal(cosTheta) {
            return cosTheta <= -1 + 1e-12;
        }
        distance(a, b) {
            // Great-circle distance: arccos(a · b), clamped for floating-point safety.
            return Math.acos(clamp(a.dot(b), -1, 1));
        }
        geodesic(a, b, t) {
            // Slerp. Falls back to linear interp + renormalize when a and b are close.
            const cos = clamp(a.dot(b), -1, 1);
            if (SphericalSpace.isAntipodal(cos)) {
                throw new Error('Geodesic between antipodal points is not unique');
            }
            const theta = Math.acos(cos);
            const sinTheta = Math.sin(theta);
            if (sinTheta < Vector.EPSILON) {
                // a ≈ b: linear blend is numerically safe; renormalize back onto the sphere.
                return a.scale(1 - t).add(b.scale(t)).normalize();
            }
            const wa = Math.sin((1 - t) * theta) / sinTheta;
            const wb = Math.sin(t * theta) / sinTheta;
            return a.scale(wa).add(b.scale(wb));
        }
        exp(base, tangent) {
            // exp_p(v) = cos(||v||)·p + sin(||v||)·(v / ||v||)
            const n = tangent.length();
            if (n < Vector.EPSILON)
                return base;
            return base.scale(Math.cos(n)).add(tangent.scale(Math.sin(n) / n));
        }
        log(base, target) {
            // log_p(q) = θ · (q - (p·q)·p) / ||q - (p·q)·p||,  θ = arccos(p·q)
            const cos = clamp(base.dot(target), -1, 1);
            if (SphericalSpace.isAntipodal(cos)) {
                throw new Error('Logarithm at antipodal point is not unique');
            }
            const theta = Math.acos(cos);
            if (theta < Vector.EPSILON) {
                // Zero tangent: target == base. Robust way to get a zero of the right type.
                return target.subtract(base).scale(0);
            }
            const proj = target.subtract(base.scale(cos)); // orthogonal component
            return proj.scale(theta / proj.length());
        }
        innerProduct(_base, u, v) {
            // Induced from the ambient Euclidean inner product.
            // Caller is responsible for ensuring u, v are tangent at base.
            return u.dot(v);
        }
    }
    // ──────────────────────────────────────────────────────────────────────────────
    // Poincaré ball model of hyperbolic space, curvature -1
    //
    // Points live strictly inside the open unit ball: ||p|| < 1.
    // Conformal metric: g_p = (2 / (1 - ||p||²))² · I_euclidean.
    // Tangent vectors are arbitrary R^D vectors; the metric scales them.
    // Geodesics are arcs of circles meeting the boundary at right angles
    // (or diameters when passing through the origin).
    // ──────────────────────────────────────────────────────────────────────────────
    class PoincareBallSpace extends AbstractRiemannianManifold {
        /** Conformal factor λ_p = 2 / (1 - ||p||²). */
        lambda(p) {
            const ns = p.dot(p);
            if (ns >= 1)
                throw new Error('Point is outside the Poincaré ball');
            return 2 / (1 - ns);
        }
        distance(a, b) {
            // d(a, b) = arcosh(1 + 2·||a-b||² / ((1-||a||²)(1-||b||²)))
            const na2 = a.dot(a);
            const nb2 = b.dot(b);
            if (na2 >= 1 || nb2 >= 1)
                throw new Error('Point is outside the Poincaré ball');
            const diff = a.subtract(b);
            const num = 2 * diff.dot(diff);
            const den = (1 - na2) * (1 - nb2);
            return Math.acosh(1 + num / den);
        }
        /**
         * Möbius addition (gyrovector "translation"):
         *   a ⊕ b = ((1 + 2⟨a,b⟩ + ||b||²)·a + (1 - ||a||²)·b)
         *           / (1 + 2⟨a,b⟩ + ||a||²·||b||²)
         */
        mobiusAdd(a, b) {
            const ab = a.dot(b);
            const na2 = a.dot(a);
            const nb2 = b.dot(b);
            const num = a.scale(1 + 2 * ab + nb2).add(b.scale(1 - na2));
            const den = 1 + 2 * ab + na2 * nb2;
            return num.scale(1 / den);
        }
        /** Möbius scalar multiplication: r ⊗ a = tanh(r · artanh(||a||)) · a/||a||. */
        mobiusScale(r, a) {
            const n = a.length();
            if (n < Vector.EPSILON)
                return a.scale(0);
            return a.scale(Math.tanh(r * Math.atanh(n)) / n);
        }
        geodesic(a, b, t) {
            // γ(t) = a ⊕ (t ⊗ (-a ⊕ b))
            const negA = a.scale(-1);
            const step = this.mobiusAdd(negA, b);
            return this.mobiusAdd(a, this.mobiusScale(t, step));
        }
        exp(base, tangent) {
            // exp_p(v) = p ⊕ ( tanh(λ_p · ||v|| / 2) · v/||v|| )
            const n = tangent.length();
            if (n < Vector.EPSILON)
                return base;
            const lam = this.lambda(base);
            const dir = tangent.scale(Math.tanh(lam * n / 2) / n);
            return this.mobiusAdd(base, dir);
        }
        log(base, target) {
            // log_p(q) = (2/λ_p) · artanh(||-p ⊕ q||) · (-p ⊕ q) / ||-p ⊕ q||
            const diff = this.mobiusAdd(base.scale(-1), target);
            const n = diff.length();
            if (n < Vector.EPSILON)
                return diff.scale(0);
            const lam = this.lambda(base);
            return diff.scale((2 / lam) * Math.atanh(n) / n);
        }
        innerProduct(base, u, v) {
            // g_p(u, v) = λ_p² · ⟨u, v⟩_euclidean
            const lam = this.lambda(base);
            return lam * lam * u.dot(v);
        }
    }
    // ──────────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────────
    function clamp(x, lo, hi) {
        return x < lo ? lo : x > hi ? hi : x;
    }

    var metricSpace = /*#__PURE__*/Object.freeze({
        __proto__: null,
        AbstractRiemannianManifold: AbstractRiemannianManifold,
        ChebyshevSpace: ChebyshevSpace,
        EuclideanSpace: EuclideanSpace,
        ManhattanSpace: ManhattanSpace,
        MinkowskiSpace: MinkowskiSpace,
        PoincareBallSpace: PoincareBallSpace,
        SphericalSpace: SphericalSpace
    });

    /**
     * Calculates the sinuosity of a trajectory represented by an array of vectors.
     * Sinuosity is the ratio of the actual path length to the straight-line distance
     * between the start and end points. A value of 1 indicates a straight line,
     * while higher values indicate more winding paths.
     *
     * @param trajectory - Array of vectors representing the path
     * @returns The sinuosity value (≥ 1)
     * @throws Error if trajectory has fewer than 2 points
     */
    function calculateSinuosity(trajectory, space) {
        if (trajectory.length < 2) {
            throw new Error('Trajectory must have at least 2 points to calculate sinuosity');
        }
        // Calculate the total path length
        let pathLength = 0;
        for (let i = 1; i < trajectory.length; i++) {
            pathLength += space.distance(trajectory[i], trajectory[i - 1]);
        }
        // Calculate the straight-line distance between start and end points
        const straightLineDistance = space.distance(trajectory[0], trajectory[trajectory.length - 1]);
        // Prevent division by zero
        if (straightLineDistance < Vector.EPSILON) {
            return Infinity; // Path returns to its starting point
        }
        return pathLength / straightLineDistance;
    }
    /**
     * Calculates the tortuosity of a trajectory represented by an array of vectors.
     * Tortuosity measures how twisted or curved a path is, using the arc-chord ratio method.
     *
     * This implementation provides three different methods:
     * 1. 'arc-chord': Standard tortuosity as the ratio of path length to straight-line distance
     *    (equivalent to sinuosity)
     * 2. 'average-angle': Average of absolute angles between consecutive segments
     * 3. 'integral-curvature': Sum of absolute curvatures along the path
     *
     * @param trajectory - Array of vectors representing the path
     * @param method - Method to use for calculation ('arc-chord', 'average-angle', or 'integral-curvature')
     * @returns The tortuosity value
     * @throws Error if trajectory has too few points for the selected method
     */
    function calculateTortuosity(trajectory, method = 'arc-chord', space = new EuclideanSpace()) {
        switch (method) {
            case 'arc-chord':
                return calculateSinuosity(trajectory, space);
            case 'average-angle':
                if (trajectory.length < 3) {
                    throw new Error('Trajectory must have at least 3 points to calculate angle-based tortuosity');
                }
                let totalAngle = 0;
                for (let i = 1; i < trajectory.length - 1; i++) {
                    // Create vectors for the two segments
                    const incoming = space.log(trajectory[i], trajectory[i - 1]).scale(-1);
                    const outgoing = space.log(trajectory[i], trajectory[i + 1]);
                    totalAngle += space.angle(trajectory[i], incoming, outgoing);
                }
                return totalAngle / (trajectory.length - 2);
            case 'integral-curvature': {
                if (trajectory.length < 3) ;
                let totalCurvature = 0;
                let totalLength = 0;
                for (let i = 1; i < trajectory.length - 1; i++) {
                    const incoming = space.log(trajectory[i], trajectory[i - 1]).scale(-1);
                    const outgoing = space.log(trajectory[i], trajectory[i + 1]);
                    const prevLength = space.tangentNorm(trajectory[i], incoming);
                    const nextLength = space.tangentNorm(trajectory[i], outgoing);
                    totalLength += prevLength;
                    if (prevLength < Vector.EPSILON || nextLength < Vector.EPSILON)
                        continue;
                    const angle = space.angle(trajectory[i], incoming, outgoing);
                    const segmentCurvature = angle / ((prevLength + nextLength) / 2);
                    totalCurvature += segmentCurvature;
                }
                if (trajectory.length > 1) {
                    totalLength += space.distance(trajectory[trajectory.length - 1], trajectory[trajectory.length - 2]);
                }
                return totalCurvature * totalLength;
            }
            default:
                throw new Error(`Unknown tortuosity calculation method: ${method}`);
        }
    }
    /**
     * Calculates the fractal dimension of a trajectory using the divider method.
     * This can be used as another measure of tortuosity/complexity.
     *
     * @param trajectory - Array of vectors representing the path
     * @param scales - Array of different step sizes to use
     * @returns The estimated fractal dimension
     * @throws Error if trajectory has fewer than 2 points
     */
    function calculateFractalDimension(trajectory, scales = [], space = new EuclideanSpace()) {
        if (trajectory.length < 2) {
            throw new Error('Trajectory must have at least 2 points to calculate fractal dimension');
        }
        // Generate scales if not provided
        if (scales.length === 0) {
            // Find the total path length to determine appropriate scales
            let totalLength = 0;
            for (let i = 1; i < trajectory.length; i++) {
                totalLength += space.distance(trajectory[i], trajectory[i - 1]);
            }
            // Generate logarithmically spaced scales between min segment length and total length/10
            let minLength = Infinity;
            for (let i = 1; i < trajectory.length; i++) {
                const length = space.distance(trajectory[i], trajectory[i - 1]);
                if (length < minLength && length > Vector.EPSILON) {
                    minLength = length;
                }
            }
            // Create scales from minLength to totalLength/10
            const maxScale = totalLength / 10;
            const scaleRatio = Math.pow(maxScale / minLength, 1 / 9);
            scales = Array.from({ length: 10 }, (_, i) => minLength * Math.pow(scaleRatio, i));
        }
        // Calculate path length at each scale
        const lengths = [];
        for (const scale of scales) {
            let length = 0;
            let currentPoint = trajectory[0];
            let i = 1;
            while (i < trajectory.length) {
                const nextPoint = trajectory[i];
                const distance = space.distance(currentPoint, nextPoint);
                if (distance >= scale) {
                    const tangent = space.log(currentPoint, nextPoint);
                    const tangentLen = space.tangentNorm(currentPoint, tangent);
                    const step = tangent.scale(scale / tangentLen);
                    currentPoint = space.exp(currentPoint, step);
                    length += scale;
                }
                else {
                    currentPoint = nextPoint;
                    length += distance;
                    i++;
                }
            }
            lengths.push([Math.log(1 / scale), Math.log(length)]);
        }
        // Calculate fractal dimension using linear regression
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (const [x, y] of lengths) {
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        }
        const n = lengths.length;
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope; // Fractal dimension is the slope of the log-log plot
    } /**
    * Calculates the detour index of a trajectory.
    * The detour index is the ratio of the actual distance traveled to the Euclidean distance
    * between the start and end points. It's effectively the same as sinuosity but with a
    * different name commonly used in transportation and network analysis.
    *
    * Values closer to 1 indicate more direct routes, while higher values indicate more
    * indirect or inefficient routes.
    *
    * @param trajectory - Array of vectors representing the path
    * @returns The detour index value (≥ 1)
    * @throws Error if trajectory has fewer than 2 points
    */
    function calculateDetourIndex(trajectory, space) {
        if (trajectory.length < 2) {
            throw new Error('Trajectory must have at least 2 points to calculate detour index');
        }
        // Calculate the total path length
        let pathLength = 0;
        for (let i = 1; i < trajectory.length; i++) {
            pathLength += space.distance(trajectory[i], trajectory[i - 1]);
        }
        // Calculate the straight-line distance between start and end points
        const straightLineDistance = space.distance(trajectory[0], trajectory[trajectory.length - 1]);
        // Prevent division by zero
        if (straightLineDistance < Vector.EPSILON) {
            return Infinity; // Path returns to its starting point
        }
        return pathLength / straightLineDistance;
    }
    /**
     * Calculates the Hausdorff distance between two trajectories.
     * The Hausdorff distance measures how far two subsets of a metric space are from each other.
     * It finds the greatest of all distances from a point in one set to the closest point in the other set.
     *
     * This is useful for comparing the similarity between trajectories or shapes.
     *
     * @param trajectory1 - First trajectory as array of vectors
     * @param trajectory2 - Second trajectory as array of vectors
     * @param distanceMetric - Optional function to calculate distance between points (defaults to Euclidean)
     * @returns The Hausdorff distance between the trajectories
     */
    function calculateHausdorffDistance(trajectory1, trajectory2, space = new EuclideanSpace()) {
        if (trajectory1.length === 0 || trajectory2.length === 0) {
            throw new Error('Trajectories must not be empty');
        }
        // Helper function to calculate one-directional Hausdorff distance
        function oneDirectionalHausdorff(from, to) {
            let maxDistance = -Infinity;
            for (const point1 of from) {
                let minDistance = Infinity;
                // Find the minimum distance from this point to any point in the other trajectory
                for (const point2 of to) {
                    const distance = space.distance(point1, point2);
                    minDistance = Math.min(minDistance, distance);
                }
                // Update the maximum of these minimum distances
                maxDistance = Math.max(maxDistance, minDistance);
            }
            return maxDistance;
        }
        // Calculate bidirectional Hausdorff distance
        const h1to2 = oneDirectionalHausdorff(trajectory1, trajectory2);
        const h2to1 = oneDirectionalHausdorff(trajectory2, trajectory1);
        // Hausdorff distance is the maximum of the two one-directional distances
        return Math.max(h1to2, h2to1);
    }
    /**
     * Estimates the Hausdorff dimension of a trajectory using box-counting method.
     * The Hausdorff dimension quantifies the "roughness" or space-filling capacity of a curve.
     *
     * This implementation uses the box-counting approach which is a practical approximation
     * of the true Hausdorff dimension.
     *
     * @param trajectory - Array of vectors representing the path
     * @param scaleFactors - Optional array of scale factors to use for box counting (default: powers of 2)
     * @returns The estimated Hausdorff dimension
     */
    function estimateHausdorffDimension(trajectory, scaleFactors = [1, 2, 4, 8, 16, 32, 64, 128]) {
        if (trajectory.length < 2) {
            throw new Error('Trajectory must have at least 2 points to estimate Hausdorff dimension');
        }
        // Find the bounding box of the trajectory
        const findBounds = (trajectory) => {
            // Extract dimensions from the first point
            const dim = trajectory[0].dimension;
            // Initialize min and max arrays with values from the first point
            const minValues = new Float64Array(dim);
            const maxValues = new Float64Array(dim);
            for (let j = 0; j < dim; j++) {
                minValues[j] = trajectory[0].get(j);
                maxValues[j] = trajectory[0].get(j);
            }
            // Find min and max values for each dimension
            for (let i = 1; i < trajectory.length; i++) {
                const point = trajectory[i];
                for (let j = 0; j < dim; j++) {
                    minValues[j] = Math.min(minValues[j], point.get(j));
                    maxValues[j] = Math.max(maxValues[j], point.get(j));
                }
            }
            // Create new Vector instances for min and max
            const VectorClass = Vector.forDimension(dim);
            const min = new VectorClass(minValues);
            const max = new VectorClass(maxValues);
            return [min, max];
        };
        const [min, max] = findBounds(trajectory);
        // Calculate the size of the bounding box
        let maxSize = 0;
        for (let i = 0; i < min.dimension; i++) {
            maxSize = Math.max(maxSize, max.get(i) - min.get(i));
        }
        // Calculate the number of boxes at different scales
        const counts = [];
        for (const scaleFactor of scaleFactors) {
            const boxSize = maxSize / scaleFactor;
            if (boxSize <= Vector.EPSILON)
                continue;
            const boxes = new Set();
            // Assign each point to a box
            for (const point of trajectory) {
                // Calculate box indices for this point
                const indices = [];
                for (let i = 0; i < point.dimension; i++) {
                    const index = Math.floor((point.get(i) - min.get(i)) / boxSize);
                    indices.push(index);
                }
                // Create a string key for this box
                const boxKey = indices.join(',');
                boxes.add(boxKey);
            }
            // Record (log(1/boxSize), log(boxCount))
            counts.push([Math.log(1 / boxSize), Math.log(boxes.size)]);
        }
        // Calculate Hausdorff dimension using linear regression
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (const [x, y] of counts) {
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        }
        const n = counts.length;
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope; // The slope of the log-log plot gives the dimension
    }
    /**
     * Calculates the lacunarity of a trajectory using a box-counting method.
     * Lacunarity measures the "gappiness" or heterogeneity of a pattern.
     * It complements fractal dimension by describing how patterns fill space.
     *
     * Higher values indicate more gaps and heterogeneity, while lower values
     * indicate more uniformity in the distribution of points.
     *
     * @param trajectory - Array of vectors representing the path
     * @param boxSize - Size of the boxes for counting (relative to bounding box)
     * @returns The lacunarity value
     */
    function calculateLacunarity(trajectory, boxSize = 0.1) {
        if (trajectory.length < 2) {
            throw new Error('Trajectory must have at least 2 points to calculate lacunarity');
        }
        // Find the bounding box
        const dim = trajectory[0].dimension;
        const minValues = new Float64Array(dim);
        const maxValues = new Float64Array(dim);
        // Initialize with first point values
        for (let j = 0; j < dim; j++) {
            minValues[j] = trajectory[0].get(j);
            maxValues[j] = trajectory[0].get(j);
        }
        // Find min and max values for each dimension
        for (let i = 1; i < trajectory.length; i++) {
            const point = trajectory[i];
            for (let j = 0; j < dim; j++) {
                minValues[j] = Math.min(minValues[j], point.get(j));
                maxValues[j] = Math.max(maxValues[j], point.get(j));
            }
        }
        // Create new Vector instances
        const VectorClass = Vector.forDimension(dim);
        const min = new VectorClass(minValues);
        const max = new VectorClass(maxValues);
        // Calculate the absolute box size
        const boundingBoxSizes = [];
        for (let i = 0; i < min.dimension; i++) {
            boundingBoxSizes.push(max.get(i) - min.get(i));
        }
        const maxSize = Math.max(...boundingBoxSizes);
        const absoluteBoxSize = maxSize * boxSize;
        // Map to store the number of points in each box
        const boxCounts = new Map();
        // Assign each point to a box and count
        for (const point of trajectory) {
            // Calculate box indices for this point
            const indices = [];
            for (let i = 0; i < point.dimension; i++) {
                const index = Math.floor((point.get(i) - min.get(i)) / absoluteBoxSize);
                indices.push(index);
            }
            // Create a string key for this box
            const boxKey = indices.join(',');
            boxCounts.set(boxKey, (boxCounts.get(boxKey) || 0) + 1);
        }
        // If all boxes have the same count, lacunarity is 1
        if (new Set(boxCounts.values()).size === 1) {
            return 1;
        }
        // Calculate mean and variance of box counts
        const counts = Array.from(boxCounts.values());
        const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length;
        const variance = counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / counts.length;
        // Lacunarity is calculated as (variance / mean²) + 1
        return (variance / (mean * mean)) + 1;
    }
    /**
     * Calculates multi-scale lacunarity for a trajectory.
     * This provides lacunarity values at different scales, giving a more
     * complete characterization of the trajectory's heterogeneity.
     *
     * @param trajectory - Array of vectors representing the path
     * @param scales - Array of box sizes to use (relative to bounding box)
     * @returns Object mapping scales to lacunarity values
     */
    function calculateMultiScaleLacunarity(trajectory, scales = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5]) {
        const result = {};
        for (const scale of scales) {
            result[scale] = calculateLacunarity(trajectory, scale);
        }
        return result;
    }

    var algorithms = /*#__PURE__*/Object.freeze({
        __proto__: null,
        calculateDetourIndex: calculateDetourIndex,
        calculateFractalDimension: calculateFractalDimension,
        calculateHausdorffDistance: calculateHausdorffDistance,
        calculateLacunarity: calculateLacunarity,
        calculateMultiScaleLacunarity: calculateMultiScaleLacunarity,
        calculateSinuosity: calculateSinuosity,
        calculateTortuosity: calculateTortuosity,
        estimateHausdorffDimension: estimateHausdorffDimension
    });

    /**
     * Cubic Bezier Interpolation
     * Takes an array of 4 control points and interpolates between them using cubic Bezier formula
     */
    class CubicBezierInterpolator {
        minRequiredPoints = 4;
        maxRequiredPoints = 4;
        interpolate(points, t) {
            if (points.length !== this.minRequiredPoints) {
                throw new Error(`${this.constructor.name} requires exactly 4 control points`);
            }
            // Handle edge cases
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            const [p0, p1, p2, p3] = points;
            const mt = 1 - t;
            const mt2 = mt * mt;
            const mt3 = mt2 * mt;
            const t2 = t * t;
            const t3 = t2 * t;
            // Cubic Bezier formula:
            // B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
            return p0.scale(mt3)
                .add(p1.scale(3 * mt2 * t))
                .add(p2.scale(3 * mt * t2))
                .add(p3.scale(t3));
        }
    }

    class CatmullRomInterpolator {
        minRequiredPoints = 2;
        maxRequiredPoints = Infinity;
        options;
        constructor(options = {}) {
            this.options = {
                tension: 0.5,
                ...options
            };
        }
        interpolate(points, t) {
            if (points.length < this.minRequiredPoints) {
                throw new Error(`${this.constructor.name} requires at least ${this.minRequiredPoints} points for interpolation`);
            }
            // Handle edge cases
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            const numSegments = points.length - 1;
            const segment = Math.min(Math.floor(t * numSegments), numSegments - 1);
            const segmentT = (t * numSegments) - segment;
            // Get points for the current segment
            const p0 = segment > 0 ? points[segment - 1] : points[0];
            const p1 = points[segment];
            const p2 = points[segment + 1];
            const p3 = segment < numSegments - 1 ? points[segment + 2] : p2;
            return this.interpolateSegment(p0, p1, p2, p3, segmentT, this.options.tension);
        }
        interpolateSegment(p0, p1, p2, p3, t, tension) {
            const t2 = t * t;
            const t3 = t2 * t;
            const m1 = p2.subtract(p0).scale(tension);
            const m2 = p3.subtract(p1).scale(tension);
            return p1.scale(2 * t3 - 3 * t2 + 1)
                .add(m1.scale(t3 - 2 * t2 + t))
                .add(p2.scale(-2 * t3 + 3 * t2))
                .add(m2.scale(t3 - t2));
        }
    }

    class HermiteInterpolator {
        options;
        minRequiredPoints = 2;
        maxRequiredPoints = Infinity;
        constructor(options = {}) {
            this.options = options;
        }
        interpolate(points, t) {
            if (points.length < this.minRequiredPoints) {
                throw new Error(`${this.constructor.name} Requires at least ${this.minRequiredPoints} points for interpolation`);
            }
            // Handle edge cases
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            // Convert regular vectors to hermite points
            const hermitePoints = this.vectorsToHermitePoints(points);
            const numSegments = hermitePoints.length - 1;
            const segment = Math.min(Math.floor(t * numSegments), numSegments - 1);
            const segmentT = (t * numSegments) - segment;
            const p0 = hermitePoints[segment];
            const p1 = hermitePoints[segment + 1];
            return this.interpolateSegment(p0, p1, segmentT);
        }
        vectorsToHermitePoints(points) {
            return points.map((point, index) => {
                const hermitePoint = {
                    position: point
                };
                // Calculate tangents based on neighboring points
                if (index > 0 || index < points.length - 1) {
                    const prev = points[Math.max(0, index - 1)];
                    const next = points[Math.min(points.length - 1, index + 1)];
                    // Calculate tangent as the difference between neighboring points
                    // scaled by tension factor (can be adjusted through options)
                    const tension = this.options.tension || 0.5;
                    const tangent = next.subtract(prev).scale(tension);
                    hermitePoint.tangentIn = tangent;
                    hermitePoint.tangentOut = tangent;
                }
                return hermitePoint;
            });
        }
        interpolateSegment(p0, p1, t) {
            const t2 = t * t;
            const t3 = t2 * t;
            const h00 = 2 * t3 - 3 * t2 + 1;
            const h10 = t3 - 2 * t2 + t;
            const h01 = -2 * t3 + 3 * t2;
            const h11 = t3 - t2;
            return p0.position.scale(h00)
                .add((p0.tangentOut || p0.position).scale(h10))
                .add(p1.position.scale(h01))
                .add((p1.tangentIn || p1.position).scale(h11));
        }
    }

    class QuadraticBezier {
        minRequiredPoints = 3;
        maxRequiredPoints = 3;
        /**
         * Interpolates between an array of points using quadratic Bézier curves.
         * Requires exactly 3 control points (start, control, and end points).
         * @param points Array of exactly 3 points: [p0, p1, p2]
         * @param t Parameter in range [0,1]
         * @returns The interpolated point on the curve at parameter t
         * @throws Error if points array doesn't contain exactly 3 points or if points have different dimensions
         */
        interpolate(points, t) {
            if (points.length !== this.minRequiredPoints) {
                throw new Error(`${this.constructor.name} requires exactly ${this.minRequiredPoints} control points`);
            }
            // Handle edge cases
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            const [p0, p1, p2] = points;
            // Validate dimensions
            if (p0.dimension !== p1.dimension || p1.dimension !== p2.dimension) {
                throw new Error('All vectors must have the same dimension');
            }
            // Validate parameter range
            if (t < 0 || t > 1) {
                throw new Error('Parameter t must be in range [0,1]');
            }
            // Calculate the coefficients
            const t2 = t * t;
            const mt = 1 - t;
            const mt2 = mt * mt;
            // B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
            return p0.scale(mt2)
                .add(p1.scale(2 * mt * t))
                .add(p2.scale(t2));
        }
        /**
         * Gets the derivative of the curve at parameter t.
         * @param points Array of exactly 3 control points
         * @param t Parameter in range [0,1]
         * @returns The derivative vector at parameter t
         */
        getDerivative(points, t) {
            if (points.length !== 3) {
                throw new Error('QuadraticBezier requires exactly 3 control points');
            }
            const [p0, p1, p2] = points;
            if (t < 0 || t > 1) {
                throw new Error('Parameter t must be in range [0,1]');
            }
            const mt = 1 - t;
            // B'(t) = 2(1-t)(P₁-P₀) + 2t(P₂-P₁)
            return p1.subtract(p0).scale(2 * mt)
                .add(p2.subtract(p1).scale(2 * t));
        }
        /**
         * Splits the Bézier curve into two curves at parameter t.
         * Uses de Casteljau's algorithm.
         * @param points Array of exactly 3 control points
         * @param t Parameter in range [0,1]
         * @returns Two arrays of control points representing the split curves
         */
        split(points, t) {
            if (points.length !== 3) {
                throw new Error('QuadraticBezier requires exactly 3 control points');
            }
            const [p0, p1, p2] = points;
            if (t < 0 || t > 1) {
                throw new Error('Parameter t must be in range [0,1]');
            }
            // Calculate intermediate points using de Casteljau's algorithm
            const p01 = p0.scale(1 - t).add(p1.scale(t));
            const p11 = p1.scale(1 - t).add(p2.scale(t));
            const p02 = p01.scale(1 - t).add(p11.scale(t));
            return [
                [p0, p01, p02], // left curve
                [p02, p11, p2] // right curve
            ];
        }
        /**
         * Creates control points for a 2D quadratic Bézier curve.
         * @param x0 Start point x coordinate
         * @param y0 Start point y coordinate
         * @param x1 Control point x coordinate
         * @param y1 Control point y coordinate
         * @param x2 End point x coordinate
         * @param y2 End point y coordinate
         * @returns Array of three 2D vectors representing the control points
         */
        static create2DControlPoints(x0, y0, x1, y1, x2, y2) {
            const Vector2D = Vector.forDimension(2);
            return [
                new Vector2D([x0, y0]),
                new Vector2D([x1, y1]),
                new Vector2D([x2, y2])
            ];
        }
    }

    var index$h = /*#__PURE__*/Object.freeze({
        __proto__: null,
        CatmullRomInterpolator: CatmullRomInterpolator,
        CubicBezierInterpolator: CubicBezierInterpolator,
        HermiteInterpolator: HermiteInterpolator,
        QuadraticBezier: QuadraticBezier
    });

    class BilinearInterpolator {
        minRequiredPoints = 2;
        maxRequiredPoints = Infinity;
        /**
         * Interpolates between a set of points using bilinear interpolation
         * @param points Array of control points to interpolate between
         * @param t Interpolation parameter between 0 and 1
         * @returns Interpolated vector
         */
        interpolate(points, t) {
            if (points.length < this.minRequiredPoints || points.length > this.maxRequiredPoints) {
                throw new Error(`${this.constructor.name} requires at least ${this.minRequiredPoints} points`);
            }
            // Handle edge cases
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            const { grid, width, height } = this.constructGrid(points);
            // Map t to grid coordinates more accurately
            const gridT = Math.max(0, Math.min(1, t)); // Clamp t between 0 and 1
            const totalCells = (width) * (height);
            const position = gridT * totalCells;
            // Convert to 2D coordinates ensuring we hit corners at t=0 and t=1
            const x = Math.min(position % width, width - 0.001);
            const y = Math.min(Math.floor(position / width), height - 0.001);
            return this.interpolatePoint(x, y, grid, width, height);
        }
        /**
         * Constructs a 2D grid from the input points preserving original positions
         */
        constructGrid(points) {
            const gridSize = Math.ceil(Math.sqrt(points.length));
            const width = gridSize - 1;
            const height = gridSize - 1;
            // Initialize empty grid
            const grid = Array(gridSize).fill(null)
                .map(() => Array(gridSize).fill(null));
            // Fill grid with points in row-major order
            for (let i = 0; i < points.length; i++) {
                const x = i % gridSize;
                const y = Math.floor(i / gridSize);
                grid[y][x] = points[i];
            }
            // Fill empty cells with nearest neighbor values
            this.fillEmptyCells(grid);
            return { grid, width, height };
        }
        /**
         * Fills empty cells in the grid with nearest neighbor values
         */
        fillEmptyCells(grid) {
            for (let y = 0; y < grid.length; y++) {
                for (let x = 0; x < grid[y].length; x++) {
                    if (!grid[y][x]) {
                        grid[y][x] = this.findNearestPoint(x, y, grid);
                    }
                }
            }
        }
        /**
         * Finds the nearest non-null point in the grid
         */
        findNearestPoint(x, y, grid) {
            let nearest = null;
            let minDist = Infinity;
            for (let py = 0; py < grid.length; py++) {
                for (let px = 0; px < grid[py].length; px++) {
                    if (grid[py][px]) {
                        const dist = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
                        if (dist < minDist) {
                            minDist = dist;
                            nearest = grid[py][px];
                        }
                    }
                }
            }
            return nearest;
        }
        /**
         * Interpolates a point in the grid using bilinear interpolation
         */
        interpolatePoint(x, y, grid, width, height) {
            const x1 = Math.floor(x);
            const x2 = Math.min(x1 + 1, width);
            const y1 = Math.floor(y);
            const y2 = Math.min(y1 + 1, height);
            const fx = x - x1;
            const fy = y - y1;
            const c11 = grid[y1][x1];
            const c12 = grid[y2][x1];
            const c21 = grid[y1][x2];
            const c22 = grid[y2][x2];
            // Interpolate along x first
            const i1 = c11.scale(1 - fx).add(c21.scale(fx));
            const i2 = c12.scale(1 - fx).add(c22.scale(fx));
            // Then interpolate along y
            return i1.scale(1 - fy).add(i2.scale(fy));
        }
    }

    class LinearInterpolator {
        minRequiredPoints = 2;
        maxRequiredPoints = Infinity;
        /**
         * Interpolates between a sequence of points using linear interpolation
         * @param points Array of vectors to interpolate between
         * @param t Interpolation parameter in range [0, 1]
         * @returns Interpolated vector
         */
        interpolate(points, t) {
            if (points.length < this.minRequiredPoints || points.length > this.maxRequiredPoints) {
                throw new Error(`${this.constructor.name} requires between ${this.minRequiredPoints} and ${this.maxRequiredPoints} points`);
            }
            // Handle edge cases
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            // Find the segment containing t
            const scaledT = t * (points.length - 1);
            const index = Math.floor(scaledT);
            const localT = scaledT - index;
            // Ensure we don't exceed array bounds
            const nextIndex = Math.min(index + 1, points.length - 1);
            // Perform linear interpolation between adjacent points
            const start = points[index];
            const end = points[nextIndex];
            return start.add(end.subtract(start).scale(localT));
        }
    }

    class SmoothstepInterpolator {
        minRequiredPoints = 2;
        maxRequiredPoints = Infinity;
        order;
        constructor(order = 2) {
            this.order = order;
        }
        interpolate(points, t) {
            if (points.length < this.minRequiredPoints) {
                throw new Error(`${this.constructor.name} Requires at least ${this.minRequiredPoints} points for interpolation`);
            }
            // Handle edge cases
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            // Normalize t to [0, 1] based on number of segments
            const numSegments = points.length - 1;
            const segmentIndex = Math.min(Math.floor(t * numSegments), numSegments - 1);
            const segmentT = (t * numSegments) % 1;
            const start = points[segmentIndex];
            const end = points[segmentIndex + 1];
            const smoothT = this.smoothstep(segmentT, this.order);
            return start.add(end.subtract(start).scale(smoothT));
        }
        smoothstep(t, order) {
            t = Math.max(0, Math.min(1, t));
            let result = t;
            for (let i = 0; i < order; i++) {
                result = result * result * (3 - 2 * result);
            }
            return result;
        }
    }

    var index$g = /*#__PURE__*/Object.freeze({
        __proto__: null,
        BilinearInterpolator: BilinearInterpolator,
        LinearInterpolator: LinearInterpolator,
        SmoothstepInterpolator: SmoothstepInterpolator
    });

    /**
     * Gradient vector generator for Perlin noise
     */
    class GradientGenerator {
        vectors;
        constructor(dimension, count) {
            this.vectors = Array.from({ length: count }, () => {
                // Generate random unit vectors for gradients
                const coords = new Float64Array(dimension);
                for (let i = 0; i < dimension; i++) {
                    coords[i] = Math.random() * 2 - 1;
                }
                const vec = new (Vector.forDimension(dimension))(coords);
                return vec.normalize();
            });
        }
        getGradient(index) {
            return this.vectors[index % this.vectors.length];
        }
    }
    /**
     * PerlinInterpolator implements smooth interpolation using Perlin noise
     * This creates a smooth path that passes through the control points while
     * adding natural-looking variation between them.
     */
    class PerlinInterpolator {
        gradientGen;
        options;
        minRequiredPoints = 2;
        maxRequiredPoints = Infinity;
        constructor(options = {}) {
            this.options = {
                closed: options.closed ?? false,
                tension: options.tension ?? 1.0,
                bias: options.bias ?? 0.0,
                continuity: options.continuity ?? 1.0
            };
            // Initialize gradient generator with reasonable number of gradients
            this.gradientGen = new GradientGenerator(2, 256);
        }
        /**
         * Implements Perlin's fade function for smooth interpolation
         * f(t) = 6t^5 - 15t^4 + 10t^3
         */
        fade(t) {
            return t * t * t * (t * (t * 6 - 15) + 10);
        }
        /**
         * Compute dot product of distance and gradient vectors
         */
        gradientDot(hash, x, y) {
            const gradient = this.gradientGen.getGradient(hash);
            return x * gradient.get(0) + y * gradient.get(1);
        }
        interpolate(points, t) {
            if (points.length < this.minRequiredPoints) {
                throw new Error(`${this.constructor.name} requires at least ${this.minRequiredPoints} points`);
            }
            // Handle edge cases
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            // Handle wrapping for closed curves
            const numPoints = points.length;
            if (this.options.closed) {
                t = ((t % 1) + 1) % 1; // Ensure t is in [0, 1]
            }
            else {
                t = Math.max(0, Math.min(1, t)); // Clamp t to [0, 1]
            }
            // Find the segment we're interpolating
            const segment = Math.floor(t * (numPoints - 1));
            const localT = (t * (numPoints - 1)) % 1;
            const p0 = points[segment];
            const p1 = points[Math.min(segment + 1, numPoints - 1)];
            // Generate noise based on segment index and local t
            const noiseScale = this.options.tension;
            const fadeT = this.fade(localT);
            // Calculate base interpolation
            const base = p0.scale(1 - fadeT).add(p1.scale(fadeT));
            // Add Perlin noise variation
            const noise = this.calculateNoiseOffset(segment, localT);
            const noiseVector = new (Vector.forDimension(p0.dimension))(Array.from({ length: p0.dimension }, (_) => noise * noiseScale));
            // Combine base interpolation with noise
            return base.add(noiseVector);
        }
        /**
         * Calculate noise offset for the given segment and t value
         */
        calculateNoiseOffset(segment, t) {
            const x = segment + t;
            const y = this.options.bias; // Use bias as additional dimension for variation
            // Calculate grid cell coordinates
            const x0 = Math.floor(x);
            const y0 = Math.floor(y);
            // Relative coordinates within the cell
            const dx = x - x0;
            const dy = y - y0;
            // Calculate dot products for corners
            const n00 = this.gradientDot(this.hash(x0, y0), dx, dy);
            const n10 = this.gradientDot(this.hash(x0 + 1, y0), dx - 1, dy);
            const n01 = this.gradientDot(this.hash(x0, y0 + 1), dx, dy - 1);
            const n11 = this.gradientDot(this.hash(x0 + 1, y0 + 1), dx - 1, dy - 1);
            // Interpolate between the corners
            const fadeX = this.fade(dx);
            const fadeY = this.fade(dy);
            const nx0 = n00 * (1 - fadeX) + n10 * fadeX;
            const nx1 = n01 * (1 - fadeX) + n11 * fadeX;
            // Final noise value
            return nx0 * (1 - fadeY) + nx1 * fadeY;
        }
        /**
         * Simple hash function for consistent gradient selection
         */
        hash(x, y) {
            const h = (x * 73856093) ^ (y * 19349663);
            return Math.abs(h);
        }
    }

    var index$f = /*#__PURE__*/Object.freeze({
        __proto__: null,
        PerlinInterpolator: PerlinInterpolator
    });

    /**
     * ASpline implements a B-spline interpolation with an additional alpha parameter
     * that controls the shape of the curve through a custom weighting function.
     */
    class ASpline {
        maxRequiredPoints = Infinity;
        degree;
        alpha;
        closed;
        // Cache for knots to avoid regenerating when points length hasn't changed
        cachedKnots = null;
        constructor({ degree = 3, alpha = 0.5, closed = false } = {}) {
            if (degree < 1)
                throw new Error('Degree must be at least 1');
            if (alpha <= 0)
                throw new Error('Alpha must be positive');
            this.degree = degree;
            this.alpha = alpha;
            this.closed = closed;
        }
        get minRequiredPoints() {
            return this.degree + 1;
        }
        /**
         * Generates a knot vector appropriate for the spline degree and number of points
         */
        getKnots(numPoints) {
            // Return cached knots if available and valid
            if (this.cachedKnots?.length === numPoints) {
                return this.cachedKnots.knots;
            }
            const knots = Array.from({ length: numPoints + this.degree + 1 }, (_, i) => i);
            // Cache the result
            this.cachedKnots = {
                length: numPoints,
                knots
            };
            return knots;
        }
        /**
         * Finds the knot span index containing the given parameter value
         */
        findSpanIndex(knots, t, numPoints) {
            const n = numPoints - 1;
            const p = this.degree;
            if (t >= knots[n + 1])
                return n;
            if (t <= knots[p])
                return p;
            // Binary search for the correct span
            let low = p;
            let high = n + 1;
            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                if (t >= knots[mid] && t < knots[mid + 1]) {
                    return mid;
                }
                if (t < knots[mid]) {
                    high = mid - 1;
                }
                else {
                    low = mid + 1;
                }
            }
            // Shouldn't reach here if t is properly bounded
            throw new Error('Failed to find valid knot span');
        }
        /**
         * Computes the basis functions and their derivatives at parameter value t
         */
        basisFunctions(knots, span, t) {
            const p = this.degree;
            const left = new Float64Array(p + 1);
            const right = new Float64Array(p + 1);
            const N = new Float64Array(p + 1);
            N[0] = 1.0;
            for (let j = 1; j <= p; j++) {
                left[j] = t - knots[span + 1 - j];
                right[j] = knots[span + j] - t;
                let saved = 0.0;
                for (let r = 0; r < j; r++) {
                    const temp = N[r] / (right[r + 1] + left[j - r]);
                    N[r] = saved + right[r + 1] * temp;
                    saved = left[j - r] * temp;
                }
                N[j] = saved;
            }
            return N;
        }
        /**
         * The alpha function that controls the shape of the curve
         * through custom basis function weighting
         */
        aFunction(t) {
            return Math.pow(Math.sin(Math.PI * t / 2), 2 * this.alpha);
        }
        /**
         * Implements the Interpolator interface method to compute a point
         * on the curve at parameter value t
         */
        interpolate(points, t) {
            if (points.length < this.minRequiredPoints) {
                throw new Error(`${this.constructor.name} requires at least ${this.minRequiredPoints} control points, got ${points.length} points`);
            }
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            // Handle closed curves by wrapping points if needed
            const effectivePoints = this.closed
                ? [...points, ...points.slice(0, this.degree)]
                : points;
            // Get or generate knots
            const knots = this.getKnots(effectivePoints.length);
            // Clamp t to [0,1] and map to knot domain
            const tClamped = Math.max(0, Math.min(1, t));
            const tKnot = knots[0] + (knots[knots.length - 1] - knots[0]) * tClamped;
            // Find the knot span and compute basis functions
            const span = this.findSpanIndex(knots, tKnot, effectivePoints.length);
            const basis = this.basisFunctions(knots, span, tKnot);
            // Initialize result vector using a zero array
            const dimension = effectivePoints[0].dimension;
            const resultArray = new Float64Array(dimension);
            let weightSum = 0;
            // Compute weighted sum of control points
            for (let i = 0; i <= this.degree; i++) {
                const point = effectivePoints[span - this.degree + i];
                const weight = basis[i] * this.aFunction(basis[i]);
                for (let d = 0; d < dimension; d++) {
                    resultArray[d] += point.get(d) * weight;
                }
                weightSum += weight;
            }
            // Normalize by weight sum
            for (let d = 0; d < dimension; d++) {
                resultArray[d] /= weightSum;
            }
            // Create new vector using same constructor as input points
            return new effectivePoints[0].constructor(resultArray);
        }
    }

    class BSpline {
        controlPoints;
        degree;
        knots;
        maxRequiredPoints = Infinity;
        constructor(degree) {
            this.degree = degree;
            this.controlPoints = [];
            this.knots = [];
        }
        /**
         * The minimum number of points required for interpolation
         * For a B-spline, this is degree + 1
         */
        get minRequiredPoints() {
            return this.degree + 1;
        }
        generateKnots(numPoints) {
            this.knots.length = 0;
            // Clamp the ends
            for (let i = 0; i < this.degree + 1; i++) {
                this.knots.push(0);
            }
            // Internal knots
            for (let i = 1; i < numPoints - this.degree; i++) {
                this.knots.push(i / (numPoints - this.degree));
            }
            // End clamp
            for (let i = 0; i < this.degree + 1; i++) {
                this.knots.push(1);
            }
        }
        basisFunction(i, degree, t) {
            if (degree === 0) {
                return (t >= this.knots[i] && t < this.knots[i + 1]) ? 1 : 0;
            }
            let value = 0;
            const leftDenom = this.knots[i + degree] - this.knots[i];
            if (leftDenom !== 0) {
                value += ((t - this.knots[i]) / leftDenom) *
                    this.basisFunction(i, degree - 1, t);
            }
            const rightDenom = this.knots[i + degree + 1] - this.knots[i + 1];
            if (rightDenom !== 0) {
                value += ((this.knots[i + degree + 1] - t) / rightDenom) *
                    this.basisFunction(i + 1, degree - 1, t);
            }
            return value;
        }
        interpolate(points, t) {
            if (points.length < this.minRequiredPoints) {
                throw new Error(`${this.constructor.name} interpolation requires at least ${this.minRequiredPoints} points, ` +
                    `but got ${points.length} points`);
            }
            // Handle edge cases
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            // Update control points and regenerate knots if needed
            if (this.controlPoints.length !== points.length ||
                !this.controlPoints.every((p, i) => p.equals(points[i]))) {
                this.controlPoints.length = 0;
                this.controlPoints.push(...points);
                this.generateKnots(points.length);
            }
            // Clamp t to [0, 1]
            t = Math.max(0, Math.min(1, t));
            // Handle edge case for t = 1
            if (t === 1) {
                t = 1 - Number.EPSILON;
            }
            // Calculate basis functions
            const basisValues = new Array(points.length);
            for (let i = 0; i < points.length; i++) {
                basisValues[i] = this.basisFunction(i, this.degree, t);
            }
            // Calculate interpolated point
            let result = points[0].scale(basisValues[0]);
            for (let i = 1; i < points.length; i++) {
                result = result.add(points[i].scale(basisValues[i]));
            }
            return result;
        }
        /**
         * Helper method to get uniformly spaced points along the curve
         */
        getPoints(points, numPoints) {
            const result = [];
            for (let i = 0; i < numPoints; i++) {
                const t = i / (numPoints - 1);
                result.push(this.interpolate(points, t));
            }
            return result;
        }
    }

    /**
     * Implements uniform B-Spline interpolation of degree k
     * @template D - Number of dimensions
     */
    class UniformBSplineInterpolator {
        maxRequiredPoints = Infinity;
        degree;
        /**
         * Creates a new uniform B-Spline interpolator
         * @param options - Configuration options for the B-Spline
         */
        constructor(options) {
            this.degree = options.degree;
        }
        /**
         * Number of points needed for interpolation
         */
        get minRequiredPoints() {
            return this.degree + 1;
        }
        /**
         * Generates a uniform knot vector for given number of control points
         */
        generateKnots(numPoints) {
            const n = numPoints - 1; // number of control points minus 1
            const m = n + this.degree + 1; // number of knots minus 1
            const knots = new Array(m + 1);
            for (let i = 0; i <= m; i++) {
                if (i < this.degree + 1) {
                    knots[i] = 0;
                }
                else if (i > n) {
                    knots[i] = 1;
                }
                else {
                    knots[i] = (i - this.degree) / (n - this.degree + 1);
                }
            }
            return knots;
        }
        /**
         * Evaluates the basis function value for the i-th basis function of degree p at parameter t
         */
        basisFunction(i, p, t, knots) {
            if (p === 0) {
                return (t >= knots[i] && t < knots[i + 1]) ? 1 : 0;
            }
            const left = this.basisFunctionHelper(i, p, t, true, knots);
            const right = this.basisFunctionHelper(i, p, t, false, knots);
            return left + right;
        }
        /**
         * Helper function for calculating parts of the basis function
         */
        basisFunctionHelper(i, p, t, isLeft, knots) {
            const j = isLeft ? i : i + 1;
            const denominator = knots[i + p + (isLeft ? 0 : 1)] - knots[j];
            if (denominator === 0) {
                return 0;
            }
            const numerator = isLeft ? t - knots[i] : knots[i + p + 1] - t;
            const coefficient = numerator / denominator;
            return coefficient * this.basisFunction(isLeft ? i : i + 1, p - 1, t, knots);
        }
        /**
         * Interpolates the B-Spline at parameter value t
         * @param points - Control points defining the spline
         * @param t - Parameter value in range [0, 1]
         * @returns Interpolated point on the spline
         */
        interpolate(points, t) {
            if (points.length < this.minRequiredPoints) {
                throw new Error(`${this.constructor.name} needs at least ${this.minRequiredPoints} control points for degree ${this.degree}`);
            }
            // Handle edge cases
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            // Generate knot vector for these points
            const knots = this.generateKnots(points.length);
            // Initialize result vector with zeros
            const result = new Float64Array(points[0].dimension);
            // Calculate basis function values and accumulate result
            for (let i = 0; i < points.length; i++) {
                const basis = this.basisFunction(i, this.degree, t, knots);
                const point = points[i];
                for (let d = 0; d < result.length; d++) {
                    result[d] += basis * point.get(d);
                }
            }
            return new points[0].constructor(result);
        }
        /**
         * Creates a uniform B-Spline interpolator of specified degree
         * @param options - Configuration options for the B-Spline
         * @returns New B-Spline interpolator instance
         */
        static create(options) {
            return new UniformBSplineInterpolator(options);
        }
    }

    class CubicPolynomial {
        p0;
        p1;
        m0;
        m1;
        constructor(p0, p1, m0, m1) {
            this.p0 = p0;
            this.p1 = p1;
            this.m0 = m0;
            this.m1 = m1;
        }
        evaluate(t) {
            // Hermite basis functions
            const h00 = 2 * t * t * t - 3 * t * t + 1;
            const h10 = t * t * t - 2 * t * t + t;
            const h01 = -2 * t * t * t + 3 * t * t;
            const h11 = t * t * t - t * t;
            // Compute the point using Hermite interpolation
            return this.p0.scale(h00)
                .add(this.m0.scale(h10))
                .add(this.p1.scale(h01))
                .add(this.m1.scale(h11));
        }
    }
    class CardinalSplineInterpolator {
        minRequiredPoints = 2;
        maxRequiredPoints = Infinity;
        tension;
        constructor(options) {
            this.tension = options?.tension ?? 0.5;
        }
        get requiredPoints() {
            return 2; // Cardinal spline requires at least 2 points
        }
        interpolate(points, t) {
            if (points.length < this.minRequiredPoints) {
                throw new Error(`${this.constructor.name} requires at least ${this.minRequiredPoints} control points`);
            }
            // Handle edge cases
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            const segments = this.computeSegments(points);
            const segmentCount = segments.length;
            const scaledT = t * segmentCount;
            const segmentIndex = Math.min(Math.floor(scaledT), segmentCount - 1);
            const localT = scaledT - segmentIndex;
            return segments[segmentIndex].evaluate(localT);
        }
        computeSegments(points) {
            const segments = [];
            const n = points.length;
            // Helper function to get tangent at a point
            const getTangent = (i) => {
                const prev = points[Math.max(0, i - 1)];
                const next = points[Math.min(n - 1, i + 1)];
                return next.subtract(prev).scale(this.tension);
            };
            // Compute cubic polynomials for each segment
            for (let i = 0; i < n - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const m0 = getTangent(i);
                const m1 = getTangent(i + 1);
                segments.push(new CubicPolynomial(p0, p1, m0, m1));
            }
            return segments;
        }
    }

    /**
     * Cosine Interpolation
     * Implements smooth interpolation between two points using a cosine function
     */
    class CosineInterpolator {
        /**
         * Number of points required for cosine interpolation
         * Cosine interpolation works between two points
         */
        minRequiredPoints = 2;
        maxRequiredPoints = 2;
        /**
         * Interpolates between two points using cosine interpolation
         * @param points Array containing exactly two points to interpolate between
         * @param t Interpolation parameter in range [0,1]
         * @throws Error if points array doesn't contain exactly 2 points
         * @returns Interpolated vector
         */
        interpolate(points, t) {
            if (points.length !== this.minRequiredPoints) {
                throw new Error(`${this.constructor.name} requires exactly ${this.minRequiredPoints} points, got ${points.length}`);
            }
            // Handle edge cases
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            const [start, end] = points;
            // Transform t using cosine function for smooth interpolation
            const cosT = (1 - Math.cos(t * Math.PI)) / 2;
            // Perform the interpolation: start + (end - start) * cosT
            return start.add(end.subtract(start).scale(cosT));
        }
    }

    /**
     * A single segment interpolator using Kochanek-Bartels method
     */
    class KochanekBartelsSegment {
        calculateTangent(prev, curr, next, tension, continuity, bias, isStart) {
            const oneMinusT = (1 - tension) / 2;
            const oneMinusC = (1 - continuity) / 2;
            const onePlusC = (1 + continuity) / 2;
            const oneMinusB = (1 - bias) / 2;
            const onePlusB = (1 + bias) / 2;
            let inTangent;
            let outTangent;
            if (isStart) {
                inTangent = curr.subtract(prev).scale(oneMinusT * onePlusC * onePlusB);
                outTangent = next.subtract(curr).scale(oneMinusT * oneMinusC * oneMinusB);
            }
            else {
                inTangent = curr.subtract(prev).scale(oneMinusT * oneMinusC * onePlusB);
                outTangent = next.subtract(curr).scale(oneMinusT * onePlusC * oneMinusB);
            }
            return inTangent.add(outTangent).scale(0.5);
        }
        interpolateSegment(p0, p1, previousPoint, nextPoint, t, options) {
            const m0 = this.calculateTangent(previousPoint, p0, p1, options.tension, options.continuity, options.bias, true);
            const m1 = this.calculateTangent(p0, p1, nextPoint, options.tension, options.continuity, options.bias, false);
            // Hermite basis functions
            const t2 = t * t;
            const t3 = t2 * t;
            const h00 = 2 * t3 - 3 * t2 + 1;
            const h10 = t3 - 2 * t2 + t;
            const h01 = -2 * t3 + 3 * t2;
            const h11 = t3 - t2;
            // Interpolate using Hermite basis
            return p0.scale(h00)
                .add(m0.scale(h10))
                .add(p1.scale(h01))
                .add(m1.scale(h11));
        }
    }
    /**
     * Kochanek-Bartels interpolator implementing the Strategy pattern
     */
    class KochanekBartelsInterpolator {
        minRequiredPoints = 2;
        maxRequiredPoints = Infinity;
        segmentInterpolator;
        constructor() {
            this.segmentInterpolator = new KochanekBartelsSegment();
        }
        interpolate(points, t) {
            if (points.length < this.minRequiredPoints) {
                throw new Error(`${this.constructor.name} requires at least ${this.minRequiredPoints} points`);
            }
            // Handle edge cases
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            // Handle interpolation options with defaults
            const options = {
                tension: 0,
                continuity: 0,
                bias: 0,
                closed: false
            };
            // Calculate effective number of segments
            const numSegments = options.closed ? points.length : points.length - 1;
            // Convert t to segment index and local parameter
            const scaledT = t * numSegments;
            const segmentIndex = Math.min(Math.floor(scaledT), numSegments - 1);
            const localT = scaledT - segmentIndex;
            // Get points for current segment
            const p0 = points[segmentIndex];
            const p1 = points[(segmentIndex + 1) % points.length];
            // Get surrounding points for tangent calculation
            const previousPoint = segmentIndex === 0
                ? (options.closed ? points[points.length - 1] : p0)
                : points[segmentIndex - 1];
            const nextPoint = (segmentIndex + 2) >= points.length
                ? (options.closed ? points[0] : p1)
                : points[segmentIndex + 2];
            return this.segmentInterpolator.interpolateSegment(p0, p1, previousPoint, nextPoint, localT, options);
        }
    }

    // Main interpolator class
    class NUBSInterpolator {
        maxRequiredPoints = Infinity;
        degree;
        knots;
        constructor(options) {
            this.degree = options.degree;
            this.knots = []; // Will be initialized in interpolate()
        }
        get minRequiredPoints() {
            return this.degree + 1;
        }
        validateInputs(points, knots) {
            if (points.length < this.minRequiredPoints) {
                throw new Error(`${this.constructor.name} requires at least ${this.minRequiredPoints} control points for the specified degree ${this.degree}`);
            }
            if (knots) {
                const requiredKnots = points.length + this.degree + 1;
                if (knots.length !== requiredKnots) {
                    throw new Error(`${this.constructor.name} requires at least ${requiredKnots} knots`);
                }
                // Validate knot vector is non-decreasing
                for (let i = 1; i < knots.length; i++) {
                    if (knots[i] < knots[i - 1]) {
                        throw new Error('Knot vector must be non-decreasing');
                    }
                }
            }
        }
        findKnotSpan(knots, t) {
            if (t === knots[knots.length - 1]) {
                return knots.length - this.degree - 2;
            }
            let low = this.degree;
            let high = knots.length - this.degree - 1;
            let mid = Math.floor((low + high) / 2);
            while (t < knots[mid] || t >= knots[mid + 1]) {
                if (t < knots[mid]) {
                    high = mid;
                }
                else {
                    low = mid;
                }
                mid = Math.floor((low + high) / 2);
            }
            return mid;
        }
        basisFunctions(knots, span, t) {
            const N = new Array(this.degree + 1).fill(0);
            const left = new Array(this.degree + 1).fill(0);
            const right = new Array(this.degree + 1).fill(0);
            N[0] = 1.0;
            for (let j = 1; j <= this.degree; j++) {
                left[j] = t - knots[span + 1 - j];
                right[j] = knots[span + j] - t;
                let saved = 0.0;
                for (let r = 0; r < j; r++) {
                    const temp = N[r] / (right[r + 1] + left[j - r]);
                    N[r] = saved + right[r + 1] * temp;
                    saved = left[j - r] * temp;
                }
                N[j] = saved;
            }
            return N;
        }
        interpolate(points, t) {
            const knots = this.knots.length === 0 ?
                NUBSUtils.createUniformKnots(points.length, this.degree) :
                this.knots;
            this.validateInputs(points, knots);
            // Handle edge cases
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            // Clamp parameter to valid range
            t = Math.max(knots[this.degree], Math.min(t, knots[knots.length - this.degree - 1]));
            const span = this.findKnotSpan(knots, t);
            const basis = this.basisFunctions(knots, span, t);
            // Initialize result vector with zeros
            let result = points[span - this.degree].scale(0);
            // Compute point
            for (let i = 0; i <= this.degree; i++) {
                const scaled = points[span - this.degree + i].scale(basis[i]);
                result = result.add(scaled);
            }
            return result;
        }
    }
    // Utility class for NUBS-related helper methods
    class NUBSUtils {
        static createUniformKnots(numControlPoints, degree) {
            const numKnots = numControlPoints + degree + 1;
            const knots = new Array(numKnots);
            for (let i = 0; i < numKnots; i++) {
                if (i < degree + 1) {
                    knots[i] = 0;
                }
                else if (i >= numKnots - degree - 1) {
                    knots[i] = 1;
                }
                else {
                    knots[i] = (i - degree) / (numControlPoints - degree);
                }
            }
            return knots;
        }
        static createInterpolator(degree, knots) {
            return new NUBSInterpolator({ degree, knots });
        }
        static createClamped(degree) {
            return new NUBSInterpolator({ degree });
        }
    }

    // BSpline basis calculator - now a standalone utility class
    class BSplineCalculator {
        knots;
        degree;
        constructor(knots, degree) {
            this.knots = knots;
            this.degree = degree;
        }
        // Evaluate basis function N_{i,p}(u)
        evaluateBasis(i, p, u) {
            if (p === 0) {
                return (u >= this.knots[i] && u < this.knots[i + 1]) ? 1 : 0;
            }
            const left = (u - this.knots[i]) / (this.knots[i + p] - this.knots[i]);
            const right = (this.knots[i + p + 1] - u) / (this.knots[i + p + 1] - this.knots[i + 1]);
            return (left * this.evaluateBasis(i, p - 1, u)) +
                (right * this.evaluateBasis(i + 1, p - 1, u));
        }
        // Find span containing u
        findSpan(u) {
            const n = this.knots.length - this.degree - 2;
            if (u >= this.knots[n + 1])
                return n;
            if (u <= this.knots[this.degree])
                return this.degree;
            let low = this.degree;
            let high = n + 1;
            let mid = Math.floor((low + high) / 2);
            while (u < this.knots[mid] || u >= this.knots[mid + 1]) {
                if (u < this.knots[mid]) {
                    high = mid;
                }
                else {
                    low = mid;
                }
                mid = Math.floor((low + high) / 2);
            }
            return mid;
        }
    }
    class NURBSInterpolator {
        bspline;
        config;
        constructor(config) {
            this.config = config;
            this.bspline = new BSplineCalculator(config.knots, config.degree);
        }
        get minRequiredPoints() {
            return this.config.weights.length;
        }
        get maxRequiredPoints() {
            return this.config.weights.length;
        }
        interpolate(points, t) {
            if (points.length !== this.minRequiredPoints) {
                throw new Error(`Expected ${this.minRequiredPoints} points, got ${points.length}`);
            }
            // Handle edge cases
            if (t <= 0)
                return points[0].clone();
            if (t >= 1)
                return points[points.length - 1].clone();
            const span = this.bspline.findSpan(t);
            let numerator = new Float64Array(points[0].dimension);
            let denominator = 0;
            // Calculate weighted sum of control points
            for (let i = 0; i <= this.config.degree; i++) {
                const basis = this.bspline.evaluateBasis(span - this.config.degree + i, this.config.degree, t);
                const weight = this.config.weights[span - this.config.degree + i];
                const weightedBasis = basis * weight;
                const controlPoint = points[span - this.config.degree + i];
                for (let j = 0; j < controlPoint.dimension; j++) {
                    numerator[j] += controlPoint.get(j) * weightedBasis;
                }
                denominator += weightedBasis;
            }
            // Divide through by weights sum
            for (let i = 0; i < numerator.length; i++) {
                numerator[i] /= denominator;
            }
            // Create and return new vector with calculated coordinates
            return new points[0].constructor(numerator);
        }
        // Factory method for creating a uniform NURBS interpolator
        static createUniform(numPoints, degree) {
            const weights = new Array(numPoints).fill(1);
            const knotsCount = numPoints + degree + 1;
            const knots = new Array(knotsCount).fill(0);
            // Create a uniform knot vector
            for (let i = 0; i < knotsCount; i++) {
                if (i < degree + 1) {
                    knots[i] = 0;
                }
                else if (i >= knotsCount - degree - 1) {
                    knots[i] = 1;
                }
                else {
                    knots[i] = (i - degree) / (knotsCount - 2 * degree - 1);
                }
            }
            return new NURBSInterpolator({
                weights,
                knots,
                degree
            });
        }
    }
    // Example usage:
    /*
    const interpolator = NURBSInterpolator.createUniform(5, 3);
    const points = [
        Vector.forDimension(2).zero(),
        // ... more points ...
    ];
    const result = interpolator.interpolate(points, 0.5);
    */

    var index$e = /*#__PURE__*/Object.freeze({
        __proto__: null,
        ASpline: ASpline,
        BSpline: BSpline,
        CardinalSplineInterpolator: CardinalSplineInterpolator,
        CosineInterpolator: CosineInterpolator,
        KochanekBartelsInterpolator: KochanekBartelsInterpolator,
        NUBSInterpolator: NUBSInterpolator,
        NURBSInterpolator: NURBSInterpolator,
        UniformBSplineInterpolator: UniformBSplineInterpolator
    });

    var index$d = /*#__PURE__*/Object.freeze({
        __proto__: null,
        cubic: index$h,
        linear: index$g,
        miscellaneous: index$f,
        spline: index$e
    });

    /**
     * Build a cumulative-probability array from a probability array.
     * Assumes `probs` are non-negative and sum to ~1 (does not renormalize).
     * The final entry is clamped to 1 to absorb floating-point drift so that
     * any value in [0, 1) returned by rng.random() will find an index.
     */
    function buildCumulative(probs) {
        const cum = new Array(probs.length);
        let running = 0;
        for (let i = 0; i < probs.length; i++) {
            running += probs[i];
            cum[i] = running;
        }
        cum[cum.length - 1] = 1;
        return cum;
    }
    /**
     * Binary search: find the smallest index i such that cum[i] >= target.
     * Used both for sampling (target = rng.random()) and quantile (target = p).
     */
    function searchCumulative(cum, target) {
        let lo = 0;
        let hi = cum.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (cum[mid] < target)
                lo = mid + 1;
            else
                hi = mid;
        }
        return lo;
    }
    /**
     * Normalize and validate a weight vector into probabilities.
     * Throws on empty input, negative/NaN entries, or non-positive total mass.
     */
    function normalizeProbs(weights) {
        if (weights.length === 0) {
            throw new Error("Probability vector must be non-empty.");
        }
        let total = 0;
        for (const w of weights) {
            if (!Number.isFinite(w) || w < 0) {
                throw new Error(`Invalid probability weight: ${w}`);
            }
            total += w;
        }
        if (total <= 0) {
            throw new Error("Probability vector must have positive total mass.");
        }
        const out = new Array(weights.length);
        for (let i = 0; i < weights.length; i++)
            out[i] = weights[i] / total;
        return out;
    }
    /**
     * Apply temperature to a probability vector: p_i' ∝ p_i^(1/T).
     *
     *   - T = 1  : identity (returns a copy).
     *   - T -> 0 : collapses to a one-hot on the argmax. We treat T below
     *              a small epsilon as exactly zero to avoid 0^Infinity issues.
     *   - large T: approaches uniform via the normal formula.
     *
     * Computed in log-space for numerical stability with small probabilities.
     * Ties at the argmax are broken by index (first wins) under T -> 0.
     */
    function applyTemperature(probs, temperature) {
        if (!Number.isFinite(temperature) || temperature < 0) {
            throw new Error(`Temperature must be a non-negative finite number, got ${temperature}`);
        }
        if (temperature === 1)
            return probs.slice();
        if (temperature < 1e-12) {
            let bestIdx = 0;
            let bestVal = -Infinity;
            for (let i = 0; i < probs.length; i++) {
                if (probs[i] > bestVal) {
                    bestVal = probs[i];
                    bestIdx = i;
                }
            }
            const out = new Array(probs.length).fill(0);
            out[bestIdx] = 1;
            return out;
        }
        const invT = 1 / temperature;
        const logs = probs.map(p => (p > 0 ? Math.log(p) * invT : -Infinity));
        let maxLog = -Infinity;
        for (const l of logs)
            if (l > maxLog)
                maxLog = l;
        if (!Number.isFinite(maxLog)) {
            throw new Error("Cannot apply temperature to an all-zero distribution.");
        }
        const unnorm = logs.map(l => Math.exp(l - maxLog));
        let sum = 0;
        for (const u of unnorm)
            sum += u;
        return unnorm.map(u => u / sum);
    }
    /**
     * Sample an index from a cumulative array using a single rng draw.
     */
    function sampleIndex(cum, rng) {
        return searchCumulative(cum, rng.random());
    }
    /**
     * Shannon entropy in bits. Zero-probability terms contribute 0.
     */
    function shannonEntropyBits(probs) {
        const ln2 = Math.LN2;
        let h = 0;
        for (const p of probs) {
            if (p > 0)
                h -= (p * Math.log(p)) / ln2;
        }
        return h;
    }
    /**
     * log of the binomial coefficient C(n, k), computed via log-gamma.
     * Numerically stable for large n.
     */
    function logBinomCoeff(n, k) {
        if (k < 0 || k > n)
            return -Infinity;
        return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
    }
    /**
     * Lanczos approximation to log Gamma. Accurate to ~1e-14 for positive arguments.
     */
    function logGamma(z) {
        if (z < 0.5) {
            // Reflection formula: Γ(z)Γ(1-z) = π / sin(πz)
            return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
        }
        z -= 1;
        const g = 7;
        const c = [
            0.99999999999980993,
            676.5203681218851,
            -1259.1392167224028,
            771.32342877765313,
            -176.61502916214059,
            12.507343278686905,
            -0.13857109526572012,
            9.9843695780195716e-6,
            1.5056327351493116e-7,
        ];
        let x = c[0];
        for (let i = 1; i < g + 2; i++)
            x += c[i] / (z + i);
        const t = z + g + 0.5;
        return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
    }
    /** log of the regular Beta function B(a, b). */
    function logBeta(a, b) {
        return logGamma(a) + logGamma(b) - logGamma(a + b);
    }

    /**
     * Generic categorical (a.k.a. Multinoulli) distribution over an arbitrary
     * finite support of states.
     *
     * The state type S may be anything usable as a Map key. For primitives
     * (string, number, boolean) this means structural equality; for object
     * references it means reference equality. If you need value equality on
     * objects, dedupe / canonicalize your support before constructing.
     */
    class CategoricalDistribution {
        support;
        probs;
        cum;
        index;
        /**
         * @param support  The finite list of states. Must be non-empty and contain
         *                 no duplicate keys (as compared by Map equality).
         * @param weights  Non-negative weights, one per state. Will be normalized.
         *                 Defaults to uniform.
         */
        constructor(support, weights) {
            if (support.length === 0) {
                throw new Error("Categorical support must be non-empty.");
            }
            const w = weights ?? new Array(support.length).fill(1);
            if (w.length !== support.length) {
                throw new Error(`Weights length ${w.length} does not match support length ${support.length}.`);
            }
            const probs = normalizeProbs(w);
            const idx = new Map();
            for (let i = 0; i < support.length; i++) {
                if (idx.has(support[i])) {
                    throw new Error(`Duplicate state in categorical support at index ${i}.`);
                }
                idx.set(support[i], i);
            }
            this.support = support.slice();
            this.probs = probs;
            this.cum = buildCumulative(probs);
            this.index = idx;
        }
        sample(rng) {
            return this.support[sampleIndex(this.cum, rng)];
        }
        pmf(state) {
            const i = this.index.get(state);
            return i === undefined ? 0 : this.probs[i];
        }
        withTemperature(temperature) {
            const tempered = applyTemperature(this.probs, temperature);
            return new CategoricalDistribution(this.support, tempered);
        }
        entropy() {
            return shannonEntropyBits(this.probs);
        }
        /** Expose the underlying probability vector (defensive copy). */
        probabilities() {
            return this.probs.slice();
        }
    }
    /**
     * Bernoulli distribution over {false, true}.
     *
     * Note: the support is unordered as far as ICategoricalDistribution is
     * concerned -- if you want an ordered {0, 1} version you can construct
     * a BinomialDistribution(1, p) from the ordinal module instead.
     */
    class BernoulliDistribution {
        support = [false, true];
        p;
        /** @param p probability of `true`. Must be in [0, 1]. */
        constructor(p) {
            if (!Number.isFinite(p) || p < 0 || p > 1) {
                throw new Error(`Bernoulli p must be in [0, 1], got ${p}`);
            }
            this.p = p;
        }
        sample(rng) {
            return rng.random() < this.p;
        }
        pmf(state) {
            return state ? this.p : 1 - this.p;
        }
        withTemperature(temperature) {
            const tempered = applyTemperature([1 - this.p, this.p], temperature);
            return new BernoulliDistribution(tempered[1]);
        }
        entropy() {
            return shannonEntropyBits([1 - this.p, this.p]);
        }
    }

    var categorical = /*#__PURE__*/Object.freeze({
        __proto__: null,
        BernoulliDistribution: BernoulliDistribution,
        CategoricalDistribution: CategoricalDistribution
    });

    /**
     * Implementation of the Beta-Binomial compound probability distribution.
     *
     * @description
     * The Beta-Binomial distribution is a compound probability distribution where the probability parameter
     * p of a Binomial distribution follows a Beta distribution. This distribution is commonly used in Bayesian
     * statistics and modeling overdispersed binomial data.
     *
     * @summary
     * This class provides methods to sample from the distribution and compute its probability mass function (PMF)
     * and cumulative distribution function (CDF). The implementation uses various numerical methods including
     * the Lanczos approximation for gamma functions and the Marsaglia-Tsang method for gamma sampling.
     *
     * @example
     * ```typescript
     * // Create a Beta-Binomial distribution with n=10 trials and Beta(2,3) prior
     * const dist = new BetaBinomialDistribution(10, 2, 3);
     *
     * // Generate a random sample
     * const sample = dist.sample();
     *
     * // Calculate probability of exactly 4 successes
     * const probability = dist.pdf(4);
     *
     * // Calculate probability of 4 or fewer successes
     * const cumulativeProbability = dist.cdf(4);
     * ```
     *
     * @remarks
     * The Beta-Binomial distribution is particularly useful when the success probability in a binomial setting
     * is not fixed but follows a Beta distribution. This makes it suitable for modeling situations with
     * overdispersion relative to the binomial distribution.
     *
     * Key properties of this implementation:
     * - Uses efficient numerical methods for sampling and computation
     * - Handles edge cases and parameter validation
     * - Provides both discrete (PMF) and cumulative (CDF) probability calculations
     */
    let BetaBinomialDistribution$1 = class BetaBinomialDistribution {
        alpha;
        beta;
        n;
        /**
         * Creates a new Beta-Binomial distribution instance.
         *
         * @param n - The number of trials in the binomial component
         * @param alpha - The first shape parameter of the Beta distribution (must be positive)
         * @param beta - The second shape parameter of the Beta distribution (must be positive)
         *
         * @throws {Error} If n is negative or not an integer
         * @throws {Error} If alpha or beta are not positive
         *
         * @remarks
         * The parameters alpha and beta control the shape of the underlying Beta distribution:
         * - Larger values of both alpha and beta lead to less variance in p
         * - alpha/(alpha + beta) is the expected value of p
         * - When alpha = beta, the distribution is symmetric
         */
        constructor(n, alpha, beta) {
            if (n < 0 || !Number.isInteger(n)) {
                throw new Error('n must be a non-negative integer');
            }
            if (alpha <= 0 || beta <= 0) {
                throw new Error('alpha and beta must be positive');
            }
            this.n = n;
            this.alpha = alpha;
            this.beta = beta;
        }
        /**
         * Generates a random sample from the Beta-Binomial distribution.
         *
         * @returns A random integer between 0 and n inclusive
         *
         * @remarks
         * The sampling process occurs in two steps:
         * 1. Sample p from Beta(alpha, beta)
         * 2. Sample from Binomial(n, p)
         *
         * This hierarchical sampling reflects the compound nature of the distribution.
         */
        sample(rng) {
            const p = this.sampleBeta(rng, this.alpha, this.beta);
            return this.sampleBinomial(rng, this.n, p);
        }
        /**
         * Calculates the probability mass function (PMF) at a given point.
         *
         * @param k - The point at which to calculate the PMF
         * @returns The probability P(X = k) where X follows this Beta-Binomial distribution
         *
         * @remarks
         * The PMF is calculated using the formula:
         * P(X = k) = Choose(n,k) * Beta(k + alpha, n - k + beta) / Beta(alpha, beta)
         *
         * The computation is performed in log space for numerical stability.
         */
        pdf(k) {
            if (k < 0 || k > this.n || !Number.isInteger(k)) {
                return 0;
            }
            const numerator = this.logChoose(this.n, k) +
                this.logBeta(k + this.alpha, this.n - k + this.beta);
            const denominator = this.logBeta(this.alpha, this.beta);
            return Math.exp(numerator - denominator);
        }
        /**
         * Calculates the cumulative distribution function (CDF) at a given point.
         *
         * @param x - The point at which to calculate the CDF
         * @returns The probability P(X ≤ x) where X follows this Beta-Binomial distribution
         *
         * @remarks
         * The CDF is calculated by summing the PMF from 0 to floor(x).
         * This method may be computationally intensive for large values of n.
         */
        cdf(x) {
            if (x < 0)
                return 0;
            if (x >= this.n)
                return 1;
            let sum = 0;
            const k_max = Math.floor(x);
            for (let k = 0; k <= k_max; k++) {
                sum += this.pdf(k);
            }
            return sum;
        }
        /**
         * Computes the logarithm of the Beta function.
         *
         * @param a - First parameter
         * @param b - Second parameter
         * @returns log(Beta(a,b))
         *
         * @remarks
         * Calculated as log(Gamma(a)) + log(Gamma(b)) - log(Gamma(a+b))
         * using the logGamma approximation.
         */
        logBeta(a, b) {
            return this.logGamma(a) + this.logGamma(b) - this.logGamma(a + b);
        }
        /**
         * Computes the logarithm of the Gamma function using the Lanczos approximation.
         *
         * @param x - Input value
         * @returns log(Gamma(x))
         *
         * @remarks
         * Uses the Lanczos approximation with g=5 and n=6 coefficients.
         * This approximation is accurate to about 15 decimal places.
         */
        logGamma(x) {
            const c = [76.18009172947146, -86.50532032941677,
                24.01409824083091, -1.231739572450155,
                0.1208650973866179e-2, -0.5395239384953e-5];
            let sum = 0.99999999999980993;
            for (let i = 0; i < 6; i++) {
                sum += c[i] / (x + i);
            }
            const ser = sum;
            const y = x + 5.5;
            return Math.log(2.5066282746310005 * ser) + (x + 0.5) * Math.log(y) - y;
        }
        /**
         * Computes the logarithm of the binomial coefficient (n choose k).
         *
         * @param n - Number of items
         * @param k - Number of items to choose
         * @returns log(C(n,k))
         *
         * @remarks
         * Calculated using the relation to gamma functions:
         * C(n,k) = Gamma(n+1)/(Gamma(k+1)*Gamma(n-k+1))
         */
        logChoose(n, k) {
            if (k < 0 || k > n)
                return -Infinity;
            return this.logGamma(n + 1) - this.logGamma(k + 1) - this.logGamma(n - k + 1);
        }
        /**
         * Generates a random sample from a Beta distribution.
         *
         * @param alpha - First shape parameter
         * @param beta - Second shape parameter
         * @returns A random value between 0 and 1
         *
         * @remarks
         * Uses the ratio of gamma variates method:
         * If X ~ Gamma(alpha) and Y ~ Gamma(beta), then X/(X+Y) ~ Beta(alpha,beta)
         */
        sampleBeta(rng, alpha, beta) {
            const x = this.sampleGamma(rng, alpha);
            const y = this.sampleGamma(rng, beta);
            return x / (x + y);
        }
        /**
         * Generates a random sample from a Gamma distribution using the Marsaglia-Tsang method.
         *
         * @param shape - The shape parameter
         * @returns A random positive value
         *
         * @remarks
         * For shape < 1, uses transformation of Gamma(shape + 1).
         * For shape ≥ 1, uses Marsaglia-Tsang method with acceptance-rejection.
         */
        sampleGamma(rng, shape) {
            if (shape < 1) {
                const u = rng.random();
                return this.sampleGamma(rng, 1 + shape) * Math.pow(u, 1 / shape);
            }
            const d = shape - 1 / 3;
            const c = 1 / Math.sqrt(9 * d);
            while (true) {
                let x = this.sampleNormal(rng);
                let v = 1 + c * x;
                v = v * v * v;
                if (v > 0) {
                    const u = rng.random();
                    const x2 = x * x;
                    if (u < 1 - 0.0331 * x2 * x2 ||
                        Math.log(u) < 0.5 * x2 + d * (1 - v + Math.log(v))) {
                        return d * v;
                    }
                }
            }
        }
        /**
         * Generates a random sample from a Binomial distribution.
         *
         * @param n - Number of trials
         * @param p - Success probability for each trial
         * @returns Number of successes (integer between 0 and n)
         *
         * @remarks
         * Uses direct simulation of n Bernoulli trials.
         * For large n, more efficient methods could be implemented.
         */
        sampleBinomial(rng, n, p) {
            let sum = 0;
            for (let i = 0; i < n; i++) {
                if (rng.random() < p) {
                    sum++;
                }
            }
            return sum;
        }
        /**
         * Generates a random sample from a standard normal distribution.
         *
         * @returns A random value from N(0,1)
         *
         * @remarks
         * Uses the Box-Muller transform.
         * This method generates one value but discards the second one.
         */
        sampleNormal(rng) {
            const u1 = rng.random();
            const u2 = rng.random();
            return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        }
    };

    /**
     * Implementation of the Beta probability distribution.
     *
     * @description
     * The Beta distribution is a family of continuous probability distributions defined on the
     * interval [0, 1] parameterized by two positive shape parameters, denoted by alpha (α) and
     * beta (β). It is particularly useful for modeling random variables that are constrained to
     * take values between 0 and 1, such as proportions or probabilities.
     *
     * @summary
     * Provides methods for sampling from a Beta distribution and computing its probability
     * density function (PDF) and cumulative distribution function (CDF).
     *
     * @example
     * ```typescript
     * // Create a Beta distribution with α=2 and β=3
     * const beta = new BetaDistribution(2, 3);
     *
     * // Generate a random sample
     * const sample = beta.sample();
     *
     * // Calculate PDF at x=0.5
     * const density = beta.pdf(0.5);
     *
     * // Calculate CDF at x=0.5
     * const cumulative = beta.cdf(0.5);
     * ```
     *
     * @remarks
     * - The implementation uses rejection sampling for generating random values
     * - The PDF calculation handles edge cases at x=0 and x=1
     * - The CDF is computed using the incomplete beta function with a continued fraction method
     * - All computations use numerically stable algorithms where possible
     */
    class BetaDistribution {
        alpha;
        beta;
        normalization;
        /**
         * Creates a new Beta distribution with the specified shape parameters.
         *
         * @param alpha - The first shape parameter (α > 0)
         * @param beta - The second shape parameter (β > 0)
         * @throws {Error} If either alpha or beta is not positive
         *
         * @example
         * ```typescript
         * // Create a symmetric Beta distribution
         * const symmetricBeta = new BetaDistribution(2, 2);
         *
         * // Create a right-skewed Beta distribution
         * const rightSkewed = new BetaDistribution(5, 2);
         * ```
         */
        constructor(alpha, beta) {
            if (alpha <= 0 || beta <= 0) {
                throw new Error('Alpha and beta parameters must be positive');
            }
            this.alpha = alpha;
            this.beta = beta;
            this.normalization = this.logBeta(alpha, beta);
        }
        /**
         * Generates a random sample from the Beta distribution.
         *
         * @description
         * Uses rejection sampling to generate random values from the Beta distribution.
         * The method continues sampling until a valid value is obtained.
         *
         * @returns A random value from the Beta distribution in the range [0, 1]
         *
         * @example
         * ```typescript
         * const beta = new BetaDistribution(2, 3);
         * const samples = Array(1000).fill(0).map(() => beta.sample());
         * ```
         *
         * @remarks
         * The rejection sampling method used here is efficient for most parameter values
         * but might be slower for extreme values of alpha and beta.
         */
        sample(rng) {
            while (true) {
                const u = rng.random();
                const v = rng.random();
                const x = Math.pow(u, 1 / this.alpha);
                const y = Math.pow(v, 1 / this.beta);
                const sum = x + y;
                if (sum <= 1) {
                    return x / sum;
                }
            }
        }
        /**
         * Calculates the probability density function (PDF) at a given point.
         *
         * @description
         * Computes the value of the Beta probability density function at the specified point.
         * Special cases at x=0 and x=1 are handled separately to ensure numerical stability.
         *
         * @param x - The point at which to evaluate the PDF (0 ≤ x ≤ 1)
         * @returns The value of the PDF at point x
         *
         * @example
         * ```typescript
         * const beta = new BetaDistribution(2, 3);
         * const density = beta.pdf(0.5); // Get density at x=0.5
         * ```
         *
         * @remarks
         * The PDF is calculated using the formula:
         * f(x; α, β) = (x^(α-1) * (1-x)^(β-1)) / B(α, β)
         * where B(α, β) is the Beta function.
         */
        pdf(x) {
            if (x < 0 || x > 1) {
                return 0;
            }
            if (x === 0) {
                return this.alpha > 1 ? 0 : this.alpha === 1 ? Math.exp(-this.normalization) : Infinity;
            }
            if (x === 1) {
                return this.beta > 1 ? 0 : this.beta === 1 ? Math.exp(-this.normalization) : Infinity;
            }
            return Math.exp((this.alpha - 1) * Math.log(x) +
                (this.beta - 1) * Math.log(1 - x) -
                this.normalization);
        }
        /**
         * Calculates the cumulative distribution function (CDF) at a given point.
         *
         * @description
         * Computes the probability that a random variable from this Beta distribution
         * takes a value less than or equal to x.
         *
         * @param x - The point at which to evaluate the CDF (0 ≤ x ≤ 1)
         * @returns The value of the CDF at point x
         *
         * @example
         * ```typescript
         * const beta = new BetaDistribution(2, 3);
         * const probability = beta.cdf(0.5); // P(X ≤ 0.5)
         * ```
         *
         * @remarks
         * Uses the incomplete Beta function implementation for CDF calculation.
         * The computation is numerically stable for most parameter values.
         */
        cdf(x) {
            if (x <= 0)
                return 0;
            if (x >= 1)
                return 1;
            return this.incompleteBeta(x, this.alpha, this.beta);
        }
        /**
         * Calculates the logarithm of the Beta function.
         *
         * @param alpha - First parameter of the Beta function
         * @param beta - Second parameter of the Beta function
         * @returns The natural logarithm of the Beta function B(α, β)
         *
         * @remarks
         * Computed using the relationship between Beta and Gamma functions:
         * B(α, β) = Γ(α)Γ(β)/Γ(α+β)
         */
        logBeta(alpha, beta) {
            return this.logGamma(alpha) + this.logGamma(beta) - this.logGamma(alpha + beta);
        }
        /**
         * Calculates the logarithm of the Gamma function.
         *
         * @description
         * Implements the Lanczos approximation for computing the natural logarithm
         * of the Gamma function.
         *
         * @param x - The point at which to evaluate log(Γ(x))
         * @returns The natural logarithm of Γ(x)
         *
         * @remarks
         * Uses the Lanczos approximation with g=7 and n=9.
         * Reflection formula is used for x < 0.5 to maintain accuracy.
         */
        logGamma(x) {
            const p = [
                676.5203681218851,
                -1259.1392167224028,
                771.32342877765313,
                -176.61502916214059,
                12.507343278686905,
                -0.13857109526572012,
                9.9843695780195716e-6,
                1.5056327351493116e-7
            ];
            if (x < 0.5) {
                return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * x)) - this.logGamma(1 - x);
            }
            x -= 1;
            let a = 0.99999999999980993;
            for (let i = 0; i < p.length; i++) {
                a += p[i] / (x + i + 1);
            }
            const t = x + p.length - 0.5;
            return Math.log(Math.sqrt(2 * Math.PI)) + (x + 0.5) * Math.log(t) - t + Math.log(a);
        }
        /**
         * Calculates the incomplete Beta function.
         *
         * @description
         * Implements the continued fraction method for computing the incomplete Beta function,
         * which is used in calculating the cumulative distribution function.
         *
         * @param x - The upper limit of integration (0 ≤ x ≤ 1)
         * @param a - First shape parameter
         * @param b - Second shape parameter
         * @returns The value of the incomplete Beta function B(x; a, b)
         *
         * @remarks
         * - Uses Lentz's method for evaluating the continued fraction
         * - Maximum number of iterations is set to 200
         * - Convergence tolerance is set to 1e-10
         */
        incompleteBeta(x, a, b) {
            if (x === 0)
                return 0;
            if (x === 1)
                return 1;
            const lBeta = this.logBeta(a, b);
            const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lBeta) / a;
            const betaCF = (a, b, x) => {
                const maxIterations = 200;
                const epsilon = 1e-10;
                let c = 1;
                let d = 1 - (a + b) * x / (a + 1);
                if (Math.abs(d) < epsilon)
                    d = epsilon;
                d = 1 / d;
                let h = d;
                for (let m = 1; m <= maxIterations; m++) {
                    const aold = a + 2 * m - 1;
                    const numer = m * (b - m) * x;
                    const denom = (aold + 2 * m) * (a + 2 * m);
                    d = 1 + numer / (denom * d);
                    if (Math.abs(d) < epsilon)
                        d = epsilon;
                    c = 1 + numer / (denom * c);
                    if (Math.abs(c) < epsilon)
                        c = epsilon;
                    d = 1 / d;
                    h *= d * c;
                    if (Math.abs(d * c - 1) < epsilon) {
                        return h;
                    }
                }
                return h;
            };
            return front * betaCF(a, b, x);
        }
    }

    /**
     * Implementation of the Dirichlet distribution, a family of continuous multivariate
     * probability distributions.
     *
     * @description
     * The Dirichlet distribution is a multivariate generalization of the Beta distribution.
     * It is commonly used as a prior distribution in Bayesian statistics, particularly in
     * Bayesian mixture models and Latent Dirichlet Allocation.
     *
     * @summary
     * - Generates random samples from the Dirichlet distribution
     * - Calculates probability density function (PDF)
     * - Uses Lanczos approximation for gamma function calculations
     * - Implements sampling through gamma distribution method
     *
     * @example
     * ```typescript
     * // Create a 3-dimensional Dirichlet distribution with parameters [1.0, 2.0, 3.0]
     * const dirichlet = new DirichletDistribution([1.0, 2.0, 3.0]);
     *
     * // Generate a random sample
     * const sample = dirichlet.sample();  // returns [0.2, 0.3, 0.5]
     *
     * // Calculate PDF at a point
     * const density = dirichlet.pdf([0.3, 0.3, 0.4]);  // returns probability density
     * ```
     *
     * @remarks
     * - All concentration parameters must be positive
     * - Samples are guaranteed to sum to 1
     * - Implementation uses numerical approximations for gamma function
     * - CDF is not implemented as it lacks a closed-form solution
     */
    class DirichletDistribution {
        alpha;
        B; // Normalization constant (multivariate beta function)
        /**
         * Creates a new Dirichlet distribution with the specified concentration parameters.
         *
         * @description
         * Initializes a Dirichlet distribution with given concentration parameters and
         * pre-calculates the normalization constant (multivariate beta function).
         *
         * @param alpha - Array of concentration parameters defining the shape of the distribution
         *
         * @throws {Error} If fewer than 2 parameters are provided
         * @throws {Error} If any concentration parameter is non-positive
         *
         * @example
         * ```typescript
         * // Create a symmetric Dirichlet with 3 dimensions
         * const symmetric = new DirichletDistribution([1.0, 1.0, 1.0]);
         *
         * // Create an asymmetric Dirichlet
         * const asymmetric = new DirichletDistribution([0.5, 2.0, 1.5]);
         * ```
         *
         * @remarks
         * - Higher alpha values lead to more concentrated distributions
         * - Alpha values < 1 push density toward the corners of the simplex
         * - Alpha values > 1 push density toward the center
         */
        constructor(alpha) {
            if (alpha.length < 2) {
                throw new Error('Dirichlet distribution requires at least 2 dimensions');
            }
            if (alpha.some(a => a <= 0)) {
                throw new Error('All concentration parameters must be positive');
            }
            this.alpha = alpha;
            this.B = this.calculateMultivariateBeta(alpha);
        }
        /**
         * Calculates the multivariate beta function for normalization.
         *
         * @description
         * Computes B(α) = ∏Γ(αᵢ)/Γ(Σαᵢ) using the Lanczos approximation for gamma functions.
         *
         * @param alpha - Array of concentration parameters
         * @returns The value of the multivariate beta function
         *
         * @remarks
         * This is an internal method used for normalizing the probability density function.
         */
        calculateMultivariateBeta(alpha) {
            const sumAlpha = alpha.reduce((a, b) => a + b, 0);
            const numerator = alpha.reduce((prod, a) => prod * this.gamma(a), 1);
            const denominator = this.gamma(sumAlpha);
            return numerator / denominator;
        }
        /**
         * Implements the gamma function using Lanczos approximation.
         *
         * @description
         * Provides a numerical approximation of the gamma function using the Lanczos
         * approximation method with 8 coefficients.
         *
         * @param z - Input value for gamma function
         * @returns Approximated gamma function value
         *
         * @remarks
         * - Uses reflection formula for z < 0.5
         * - Accurate to about 15 decimal places
         */
        gamma(z) {
            // Lanczos approximation coefficients
            const p = [
                676.5203681218851,
                -1259.1392167224028,
                771.32342877765313,
                -176.61502916214059,
                12.507343278686905,
                -0.13857109526572012,
                9.9843695780195716e-6,
                1.5056327351493116e-7
            ];
            if (z < 0.5) {
                // Reflection formula
                return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));
            }
            z -= 1;
            let x = 0.99999999999980993;
            for (let i = 0; i < p.length; i++) {
                x += p[i] / (z + i + 1);
            }
            const t = z + p.length - 0.5;
            return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
        }
        /**
         * Generates a random sample from the Dirichlet distribution.
         *
         * @description
         * Uses the gamma distribution method to generate random samples. Generates
         * independent gamma variates and normalizes them to obtain a Dirichlet sample.
         *
         * @returns An array representing a point on the probability simplex
         *
         * @example
         * ```typescript
         * const dirichlet = new DirichletDistribution([1.0, 1.0, 1.0]);
         * const sample1 = dirichlet.sample();  // e.g., [0.3, 0.4, 0.3]
         * const sample2 = dirichlet.sample();  // e.g., [0.2, 0.5, 0.3]
         * ```
         *
         * @remarks
         * - Uses acceptance-rejection sampling for gamma variates
         * - Guarantees that components sum to 1
         * - Each call generates a new independent sample
         */
        sample(rng) {
            // Generate gamma samples
            const gammas = this.alpha.map(a => {
                // Use gamma distribution sampling
                // This is a simple implementation - could be improved
                let shape = a;
                let scale = 1;
                // Basic gamma sampling using acceptance-rejection
                let d = shape - 1 / 3;
                let c = 1 / Math.sqrt(9 * d);
                while (true) {
                    let x = 0;
                    let v = 0;
                    let u = 0;
                    do {
                        x = this.normalSample(rng);
                        v = 1 + c * x;
                    } while (v <= 0);
                    v = v * v * v;
                    u = rng.random();
                    if (u < 1 - 0.331 * x * x * x * x)
                        return scale * d * v;
                    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v)))
                        return scale * d * v;
                }
            });
            // Normalize to get Dirichlet sample
            const sum = gammas.reduce((a, b) => a + b, 0);
            return gammas.map(g => g / sum);
        }
        /**
         * Generates a sample from the standard normal distribution.
         *
         * @description
         * Implements the Box-Muller transform to generate normally distributed random numbers.
         *
         * @returns A random sample from N(0,1)
         *
         * @remarks
         * Used internally for gamma distribution sampling
         */
        normalSample(rng) {
            let u = 0;
            let v = 0;
            while (u === 0)
                u = rng.random();
            while (v === 0)
                v = rng.random();
            return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        }
        /**
         * Calculates the probability density function at a given point.
         *
         * @description
         * Computes f(x|α) = 1/B(α) ∏xᵢ^(αᵢ-1) for a point on the probability simplex.
         *
         * @param x - Point at which to evaluate the PDF
         * @returns The probability density at point x
         *
         * @throws {Error} If the dimension of x doesn't match the distribution
         *
         * @example
         * ```typescript
         * const dirichlet = new DirichletDistribution([2.0, 2.0, 2.0]);
         * const density = dirichlet.pdf([0.3, 0.3, 0.4]);
         * ```
         *
         * @remarks
         * - Returns 0 for points not on the probability simplex
         * - Higher values indicate higher probability density
         */
        pdf(x) {
            if (x.length !== this.alpha.length) {
                throw new Error('Dimension mismatch');
            }
            if (!this.isValidSimplex(x)) {
                return 0;
            }
            let prod = 1;
            for (let i = 0; i < x.length; i++) {
                prod *= Math.pow(x[i], this.alpha[i] - 1);
            }
            return prod / this.B;
        }
        /**
         * Validates if a point lies on the probability simplex.
         *
         * @description
         * Checks if components are non-negative and sum to 1 within numerical precision.
         *
         * @param x - Point to validate
         * @returns True if the point is valid, false otherwise
         *
         * @remarks
         * Uses a tolerance of 1e-10 for floating-point comparisons
         */
        isValidSimplex(x) {
            const sum = x.reduce((a, b) => a + b, 0);
            return Math.abs(sum - 1) < 1e-10 && x.every(xi => xi >= 0 && xi <= 1);
        }
        /**
         * Placeholder for the cumulative distribution function.
         *
         * @description
         * The CDF for the Dirichlet distribution has no closed-form expression.
         *
         * @param _x - Point at which to evaluate the CDF
         * @throws {Error} Always throws as this is not implemented
         *
         * @remarks
         * For applications requiring the CDF, numerical methods must be used
         */
        cdf(_x) {
            throw new Error('Dirichlet CDF not implemented - no closed form exists');
        }
    }

    /**
     * Implementation of the exponential probability distribution.
     *
     * @description
     * The exponential distribution models the time between events in a Poisson point process,
     * i.e., a process in which events occur continuously and independently at a constant average rate.
     * It is characterized by a single parameter λ (lambda), which is the rate parameter.
     *
     * @summary
     * Provides methods for sampling from the distribution and computing various statistical properties
     * including PDF, CDF, mean, variance, and standard deviation.
     *
     * @remarks
     * - The exponential distribution has the memoryless property
     * - It is the continuous analog of the geometric distribution
     * - Often used to model the time until an event occurs, such as:
     *   - The time until a radioactive particle decays
     *   - The time between arrivals in a Poisson process
     *   - The lifetime of electronic components
     *
     * @example
     * ```typescript
     * // Create a new exponential distribution with rate λ = 0.5
     * const dist = new ExponentialDistribution(0.5);
     *
     * // Generate a random sample
     * const sample = dist.sample();
     *
     * // Calculate probability density at x = 2
     * const density = dist.pdf(2);
     *
     * // Calculate cumulative probability at x = 2
     * const cumulative = dist.cdf(2);
     *
     * // Get statistical properties
     * console.log(dist.mean);            // 2
     * console.log(dist.variance);        // 4
     * console.log(dist.standardDeviation); // 2
     * ```
     */
    class ExponentialDistribution {
        rate;
        /**
         * Creates a new exponential distribution with the given rate parameter.
         *
         * @description
         * Initializes an exponential distribution with rate parameter λ (lambda).
         * The rate parameter represents the number of events per unit time in the corresponding Poisson process.
         *
         * @param rate - The rate parameter (λ) of the distribution
         * @throws {Error} If rate is not positive (must be > 0)
         *
         * @example
         * ```typescript
         * // Create distribution with rate λ = 2 (average of 2 events per unit time)
         * const dist = new ExponentialDistribution(2);
         * ```
         *
         * @remarks
         * The rate parameter is the reciprocal of the mean: λ = 1/μ
         */
        constructor(rate) {
            if (rate <= 0) {
                throw new Error('Rate parameter must be positive');
            }
            this.rate = rate;
        }
        /**
         * Generates a random value from this exponential distribution.
         *
         * @description
         * Uses the inverse transform sampling method to generate random samples.
         * The method works by inverting the CDF: F⁻¹(u) = -ln(1-u)/λ, where u is uniform on (0,1).
         *
         * @returns A random number following this exponential distribution
         *
         * @example
         * ```typescript
         * const rng = NativeRandom();
         * const dist = new ExponentialDistribution(0.5);
         * const samples = Array(1000).fill(0).map(() => dist.sample(rng));
         * ```
         *
         * @remarks
         * This method is theoretically exact but may have small numerical errors
         * due to floating-point arithmetic and the random number generator used.
         */
        sample(rng) {
            const u = rng.random();
            return -Math.log(1 - u) / this.rate;
        }
        /**
         * Calculates the probability density function (PDF) at x.
         *
         * @description
         * The PDF for the exponential distribution is:
         * f(x) = λe^(-λx) for x ≥ 0
         * f(x) = 0 for x < 0
         *
         * @param x - The point at which to evaluate the PDF
         * @returns The probability density at x
         *
         * @example
         * ```typescript
         * const dist = new ExponentialDistribution(0.5);
         * console.log(dist.pdf(2));  // Probability density at x = 2
         * ```
         *
         * @remarks
         * The PDF represents the relative likelihood of a random variable taking
         * on a specific value. It is always non-negative but can exceed 1.
         */
        pdf(x) {
            if (x < 0) {
                return 0;
            }
            return this.rate * Math.exp(-this.rate * x);
        }
        /**
         * Calculates the cumulative distribution function (CDF) at x.
         *
         * @description
         * The CDF for the exponential distribution is:
         * F(x) = 1 - e^(-λx) for x ≥ 0
         * F(x) = 0 for x < 0
         *
         * @param x - The point at which to evaluate the CDF
         * @returns The cumulative probability at x
         *
         * @example
         * ```typescript
         * const dist = new ExponentialDistribution(0.5);
         * console.log(dist.cdf(2));  // Probability that a random value is ≤ 2
         * ```
         *
         * @remarks
         * The CDF gives the probability that a random value from this distribution
         * will be less than or equal to x. It is always between 0 and 1.
         */
        cdf(x) {
            if (x < 0) {
                return 0;
            }
            return 1 - Math.exp(-this.rate * x);
        }
        /**
         * Gets the mean (expected value) of the distribution.
         *
         * @description
         * For an exponential distribution with rate λ, the mean is 1/λ.
         *
         * @returns The mean value (1/λ)
         *
         * @example
         * ```typescript
         * const dist = new ExponentialDistribution(0.5);
         * console.log(dist.mean);  // 2
         * ```
         *
         * @remarks
         * The mean represents the average time between events in the corresponding
         * Poisson process.
         */
        get mean() {
            return 1 / this.rate;
        }
        /**
         * Gets the variance of the distribution.
         *
         * @description
         * For an exponential distribution with rate λ, the variance is 1/λ².
         *
         * @returns The variance value (1/λ²)
         *
         * @example
         * ```typescript
         * const dist = new ExponentialDistribution(0.5);
         * console.log(dist.variance);  // 4
         * ```
         *
         * @remarks
         * The variance measures the spread of the distribution around its mean.
         * It has squared units relative to the original data.
         */
        get variance() {
            return 1 / (this.rate * this.rate);
        }
        /**
         * Gets the standard deviation of the distribution.
         *
         * @description
         * For an exponential distribution with rate λ, the standard deviation is 1/λ.
         *
         * @returns The standard deviation value (1/λ)
         *
         * @example
         * ```typescript
         * const dist = new ExponentialDistribution(0.5);
         * console.log(dist.standardDeviation);  // 2
         * ```
         *
         * @remarks
         * The standard deviation is the square root of the variance and has the same
         * units as the original data. For the exponential distribution, it equals the mean.
         */
        get standardDeviation() {
            return 1 / this.rate;
        }
    }

    /**
     * Implementation of the Gamma probability distribution.
     *
     * @description
     * The Gamma distribution is a continuous probability distribution with two parameters:
     * alpha (shape) and beta (scale). It's commonly used to model waiting times, rainfall
     * amounts, and other positive-valued random phenomena.
     *
     * @summary
     * This implementation uses the Marsaglia and Tsang method for random number generation
     * and includes methods for calculating probability density function (PDF) and cumulative
     * distribution function (CDF). The gamma function is computed using the Lanczos approximation.
     *
     * @remarks
     * - The implementation handles both alpha ≥ 1 and alpha < 1 cases
     * - For alpha < 1, it uses a transformation method
     * - The CDF is calculated using series expansion of the lower incomplete gamma function
     * - All calculations maintain high numerical precision
     *
     * @example
     * ```typescript
     * // Create a Gamma distribution with shape=2 and scale=1.5
     * const gamma = new GammaDistribution(2, 1.5);
     *
     * const rng = new NativeRandom();
     * // Generate a random sample
     * const sample = gamma.sample(rng);
     *
     * // Calculate PDF at x=2.5
     * const density = gamma.pdf(2.5);
     *
     * // Calculate CDF at x=2.5
     * const probability = gamma.cdf(2.5);
     * ```
     */
    class GammaDistribution {
        alpha; // shape parameter
        beta; // scale parameter
        /**
         * Creates a new Gamma distribution instance.
         *
         * @param alpha - The shape parameter (must be positive)
         * @param beta - The scale parameter (must be positive)
         * @throws {Error} If either alpha or beta is non-positive
         *
         * @example
         * ```typescript
         * const gamma = new GammaDistribution(2, 1.5);
         * ```
         */
        constructor(alpha, beta) {
            if (alpha <= 0 || beta <= 0) {
                throw new Error('Shape (alpha) and scale (beta) parameters must be positive');
            }
            this.alpha = alpha;
            this.beta = beta;
        }
        /**
         * Generates a random sample from the Gamma distribution.
         *
         * @description
         * Uses the Marsaglia and Tsang method for alpha ≥ 1, and applies a transformation
         * for alpha < 1 cases. The method is optimized for both speed and accuracy.
         *
         * @returns A random number from the Gamma distribution
         *
         * @example
         * ```typescript
         * const gamma = new GammaDistribution(2, 1.5);
         * const rng = new NativeRandom()
         * const randomValue = gamma.sample(rng);
         * ```
         */
        sample(rng) {
            if (this.alpha < 1) {
                const r = GammaDistribution.generateGamma(rng, this.alpha + 1, this.beta);
                const u = rng.random();
                return r * Math.pow(u, 1 / this.alpha);
            }
            return GammaDistribution.generateGamma(rng, this.alpha, this.beta);
        }
        /**
         * Calculates the probability density function (PDF) at a given point.
         *
         * @param x - The point at which to calculate the PDF
         * @returns The probability density at point x
         *
         * @remarks
         * The PDF is calculated using the formula:
         * f(x) = (x^(α-1) * e^(-x/β)) / (β^α * Γ(α))
         * where Γ is the gamma function
         *
         * @example
         * ```typescript
         * const gamma = new GammaDistribution(2, 1.5);
         * const density = gamma.pdf(2.5);
         * ```
         */
        pdf(x) {
            if (x < 0)
                return 0;
            const numerator = Math.pow(x, this.alpha - 1) * Math.exp(-x / this.beta);
            const denominator = Math.pow(this.beta, this.alpha) * this.gamma(this.alpha);
            return numerator / denominator;
        }
        /**
         * Calculates the cumulative distribution function (CDF) at a given point.
         *
         * @param x - The point at which to calculate the CDF
         * @returns The probability that a random variable is less than or equal to x
         *
         * @remarks
         * The CDF is calculated using the regularized incomplete gamma function:
         * F(x) = γ(α, x/β) / Γ(α)
         * where γ is the lower incomplete gamma function and Γ is the gamma function
         *
         * @example
         * ```typescript
         * const gamma = new GammaDistribution(2, 1.5);
         * const probability = gamma.cdf(2.5);
         * ```
         */
        cdf(x) {
            if (x < 0)
                return 0;
            return this.lowerIncompleteGamma(this.alpha, x / this.beta) / this.gamma(this.alpha);
        }
        /**
         * Generates a gamma-distributed random number using the Marsaglia and Tsang method.
         *
         * @param alpha - Shape parameter
         * @param beta - Scale parameter
         * @returns A gamma-distributed random number
         *
         * @remarks
         * This implementation uses the Marsaglia and Tsang method which is both efficient
         * and accurate. It uses a combination of rejection sampling and transformation
         * techniques to generate gamma-distributed random numbers.
         *
         * @private
         */
        static generateGamma(rng, alpha, beta) {
            const d = alpha - 1 / 3;
            const c = 1 / Math.sqrt(9 * d);
            while (true) {
                let x;
                let v;
                do {
                    x = GammaDistribution.normalRandom(rng);
                    v = 1 + c * x;
                } while (v <= 0);
                v = v * v * v;
                const u = rng.random();
                if (u < 1 - 0.0331 * x * x * x * x) {
                    return d * v * beta;
                }
                if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
                    return d * v * beta;
                }
            }
        }
        /**
         * Generates a standard normal random number using the Box-Muller transform.
         *
         * @returns A random number from the standard normal distribution
         *
         * @remarks
         * Uses the Box-Muller transform to convert uniform random numbers to
         * normally distributed random numbers.
         *
         * @private
         */
        static normalRandom(rng) {
            const u1 = rng.random();
            const u2 = rng.random();
            return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        }
        /**
         * Calculates the gamma function using the Lanczos approximation.
         *
         * @param z - The input value
         * @returns The gamma function value at z
         *
         * @remarks
         * This implementation uses the Lanczos approximation with g=7 and n=9.
         * It provides accurate results for a wide range of input values.
         * For z < 0.5, it uses the reflection formula.
         *
         * @private
         */
        gamma(z) {
            const p = [
                676.5203681218851,
                -1259.1392167224028,
                771.32342877765313,
                -176.61502916214059,
                12.507343278686905,
                -0.13857109526572012,
                9.9843695780195716e-6,
                1.5056327351493116e-7
            ];
            if (z < 0.5) {
                return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));
            }
            z -= 1;
            let x = 0.99999999999980993;
            for (let i = 0; i < p.length; i++) {
                x += p[i] / (z + i + 1);
            }
            const t = z + p.length - 0.5;
            return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
        }
        /**
         * Calculates the lower incomplete gamma function using series expansion.
         *
         * @param s - The shape parameter
         * @param x - The upper limit of integration
         * @returns The lower incomplete gamma function value
         *
         * @remarks
         * Uses a series expansion approach with a specified precision (epsilon)
         * and maximum number of iterations. The series is terminated when the
         * desired precision is reached or the maximum iterations are exceeded.
         *
         * @private
         */
        lowerIncompleteGamma(s, x) {
            if (x <= 0)
                return 0;
            const maxIterations = 1000;
            const epsilon = 1e-10;
            let sum = 0;
            let term = 1 / s;
            let n = 1;
            while (Math.abs(term) > epsilon && n < maxIterations) {
                sum += term;
                term *= x / (s + n);
                n++;
            }
            return Math.pow(x, s) * Math.exp(-x) * sum;
        }
    }

    /**
     * Implements the hypergeometric probability distribution, which describes the probability
     * of obtaining exactly k successes in n draws without replacement from a population
     * of size N containing K success states.
     *
     * @description
     * The hypergeometric distribution models sampling without replacement where we're
     * interested in the number of successes in a sample drawn from a finite population
     * containing both success and failure states. Unlike the binomial distribution,
     * the probability of success changes with each draw as items are not replaced.
     *
     * @summary
     * Common applications include:
     * - Card game probability calculations
     * - Quality control sampling
     * - Population sampling surveys
     * - Genetic studies
     *
     * @example
     * ```typescript
     * // Calculate probability of drawing 2 hearts when drawing 5 cards from a standard deck
     * const deck = new HypergeometricDistribution(52, 13, 5);
     * const probability = deck.pdf(2);
     * console.log(probability); // Probability of drawing exactly 2 hearts
     *
     * // Generate a random sample
     * const numHeartsDrawn = deck.sample();
     * ```
     *
     * @remarks
     * - All input parameters must be non-negative integers
     * - The number of success states (K) cannot exceed the population size (N)
     * - The number of draws (n) cannot exceed the population size (N)
     * - The implementation uses combinations calculations optimized for numerical stability
     */
    let HypergeometricDistribution$1 = class HypergeometricDistribution {
        N; // Population size
        K; // Number of success states in population
        n; // Number of draws
        /**
         * Creates a new instance of the hypergeometric distribution.
         *
         * @param populationSize - The total size of the population (N)
         * @param successStates - The number of success states in the population (K)
         * @param draws - The number of draws from the population (n)
         *
         * @throws {Error} If any parameters are not integers
         * @throws {Error} If any parameters are negative
         * @throws {Error} If successStates exceeds populationSize
         * @throws {Error} If draws exceeds populationSize
         *
         * @example
         * ```typescript
         * // Modeling drawing 5 cards from a standard deck, looking for hearts
         * const dist = new HypergeometricDistribution(52, 13, 5);
         * ```
         */
        constructor(populationSize, successStates, draws) {
            if (!Number.isInteger(populationSize) || !Number.isInteger(successStates) || !Number.isInteger(draws)) {
                throw new Error('All parameters must be integers');
            }
            if (populationSize < 0 || successStates < 0 || draws < 0) {
                throw new Error('All parameters must be non-negative');
            }
            if (successStates > populationSize) {
                throw new Error('Success states cannot exceed population size');
            }
            if (draws > populationSize) {
                throw new Error('Number of draws cannot exceed population size');
            }
            this.N = populationSize;
            this.K = successStates;
            this.n = draws;
        }
        /**
         * Calculates the binomial coefficient (n choose k), representing the number of ways
         * to choose k items from n items without regard to order.
         *
         * @param n - The total number of items
         * @param k - The number of items to choose
         * @returns The binomial coefficient value
         *
         * @remarks
         * Implementation uses an iterative approach optimized for numerical stability
         * by minimizing intermediate values and reducing overflow risk.
         */
        combinations(n, k) {
            if (k < 0 || k > n)
                return 0;
            if (k > n - k)
                k = n - k;
            let result = 1;
            for (let i = 0; i < k; i++) {
                result *= (n - i);
                result /= (i + 1);
            }
            return result;
        }
        /**
         * Generates a random value from the hypergeometric distribution using
         * inverse transform sampling.
         *
         * @returns A random number of successes following the hypergeometric distribution
         *
         * @remarks
         * The implementation uses inverse transform sampling, which may be slower than
         * other methods but provides exact sampling from the distribution.
         *
         * @example
         * ```typescript
         * const dist = new HypergeometricDistribution(52, 13, 5);
         * const randomDraw = dist.sample(); // Random number of hearts in 5 cards
         * ```
         */
        sample(rng) {
            const u = rng.random();
            let sum = 0;
            let k = Math.max(0, this.n - (this.N - this.K));
            const maxK = Math.min(this.n, this.K);
            while (k <= maxK) {
                sum += this.pdf(k);
                if (sum >= u) {
                    return k;
                }
                k++;
            }
            return maxK; // Fallback in case of numerical precision issues
        }
        /**
         * Calculates the probability mass function (PMF) at point k.
         *
         * @param k - The number of successes to calculate probability for
         * @returns The probability of exactly k successes
         *
         * @remarks
         * The PMF is calculated using the formula:
         * P(X = k) = C(K,k) * C(N-K,n-k) / C(N,n)
         * where C(a,b) represents the binomial coefficient.
         *
         * @example
         * ```typescript
         * const dist = new HypergeometricDistribution(52, 13, 5);
         * const probExactlyTwoHearts = dist.pdf(2);
         * ```
         */
        pdf(k) {
            if (!Number.isInteger(k))
                return 0;
            if (k < Math.max(0, this.n - (this.N - this.K)) || k > Math.min(this.n, this.K)) {
                return 0;
            }
            const numerator = this.combinations(this.K, k) *
                this.combinations(this.N - this.K, this.n - k);
            const denominator = this.combinations(this.N, this.n);
            return numerator / denominator;
        }
        /**
         * Calculates the cumulative distribution function (CDF) at point k.
         *
         * @param k - The point up to which to calculate cumulative probability
         * @returns The probability of k or fewer successes
         *
         * @remarks
         * The CDF is calculated by summing the PMF values from 0 to k:
         * P(X ≤ k) = Σ P(X = i) for i from 0 to k
         *
         * @example
         * ```typescript
         * const dist = new HypergeometricDistribution(52, 13, 5);
         * const probTwoOrFewerHearts = dist.cdf(2);
         * ```
         */
        cdf(k) {
            if (k < 0)
                return 0;
            if (k >= this.n)
                return 1;
            let sum = 0;
            const floorK = Math.floor(k);
            for (let i = 0; i <= floorK; i++) {
                sum += this.pdf(i);
            }
            return sum;
        }
        /**
         * Calculates the expected value (mean) of the distribution.
         *
         * @returns The mean of the distribution
         *
         * @remarks
         * The mean is calculated using the formula:
         * E(X) = n * (K/N)
         * This represents the expected number of successes in n draws.
         *
         * @example
         * ```typescript
         * const dist = new HypergeometricDistribution(52, 13, 5);
         * const expectedHearts = dist.mean(); // Expected number of hearts in 5 cards
         * ```
         */
        mean() {
            return this.n * (this.K / this.N);
        }
        /**
         * Calculates the variance of the distribution.
         *
         * @returns The variance of the distribution
         *
         * @remarks
         * The variance is calculated using the formula:
         * Var(X) = n * (K/N) * ((N-K)/N) * ((N-n)/(N-1))
         * This represents the expected squared deviation from the mean.
         *
         * @example
         * ```typescript
         * const dist = new HypergeometricDistribution(52, 13, 5);
         * const varianceHearts = dist.variance(); // Variance of hearts in 5 cards
         * ```
         */
        variance() {
            return this.n * (this.K / this.N) *
                ((this.N - this.K) / this.N) *
                ((this.N - this.n) / (this.N - 1));
        }
    };

    /**
     * Implementation of the Lévy distribution, a continuous probability distribution that describes random variables
     * whose values are normally distributed but cannot be negative.
     *
     * @description
     * The Lévy distribution is a special case of the inverse-gamma distribution and is often used in physics
     * and probability theory. It describes random motions where the distribution of jump sizes follows an inverse
     * power law. The distribution is stable and exhibits heavy tails.
     *
     * @summary
     * Provides methods for sampling from the distribution and computing its PDF and CDF.
     * Implements the IContinuousDistribution interface for consistent usage across the library.
     *
     * @remarks
     * - The distribution is defined for x > μ where μ is the location parameter
     * - It has heavy tails and infinite mean and variance
     * - The implementation uses approximations for the inverse error function in sampling
     * - All methods are numerically stable for typical parameter values
     *
     * @example
     * ```typescript
     * // Create a standard Lévy distribution (μ=0, c=1)
     * const levy = new LevyDistribution();
     *
     * // Create a Lévy distribution with custom parameters
     * const customLevy = new LevyDistribution(2.0, 0.5);
     *
     * // Generate random samples
     * const rng = new NativeRandom();
     * const sample = customLevy.sample(rng);
     *
     * // Calculate PDF and CDF
     * const density = customLevy.pdf(3.0);
     * const cumulative = customLevy.cdf(3.0);
     * ```
     */
    class LevyDistribution {
        mu; // location parameter
        c; // scale parameter
        /**
         * Creates a new instance of the Lévy distribution.
         *
         * @param mu - The location parameter (default: 0). This parameter shifts the distribution along the x-axis.
         * @param c - The scale parameter (default: 1). Must be positive. Controls the spread of the distribution.
         * @throws {Error} When the scale parameter c is not positive.
         *
         * @example
         * ```typescript
         * // Standard Lévy distribution
         * const levy1 = new LevyDistribution();
         *
         * // Shifted Lévy distribution
         * const levy2 = new LevyDistribution(1.0, 1.0);
         * ```
         */
        constructor(mu = 0, c = 1) {
            if (c <= 0) {
                throw new Error('Scale parameter c must be positive');
            }
            this.mu = mu;
            this.c = c;
        }
        /**
         * Generates a random sample from the Lévy distribution using inverse transform sampling.
         *
         * @description
         * Uses the inverse CDF method with approximations for the inverse complementary error function.
         * The implementation uses a combination of normal distribution approximation for small values
         * and asymptotic approximation for large values.
         *
         * @returns A random number following the Lévy distribution with the specified parameters.
         *
         * @example
         * ```typescript
         * const levy = new LevyDistribution(0, 1);
         * const rng = new NativeRandom();
         * const samples = Array(1000).fill(0).map(() => levy.sample(rng));
         * ```
         */
        sample(rng) {
            const u = rng.random();
            const z = Math.sqrt(-2 * Math.log(1 - u));
            return this.mu + this.c / (2 * Math.pow(z, 2));
        }
        /**
         * Calculates the probability density function (PDF) at a given point.
         *
         * @param x - The point at which to evaluate the PDF
         * @returns The probability density at point x
         *
         * @description
         * The PDF of the Lévy distribution is defined as:
         * f(x) = sqrt(c/(2π)) * exp(-c/(2(x-μ))) / ((x-μ)^(3/2))
         * for x > μ, and 0 otherwise.
         *
         * @example
         * ```typescript
         * const levy = new LevyDistribution(0, 1);
         * const density = levy.pdf(2.0); // Evaluates PDF at x=2.0
         * ```
         */
        pdf(x) {
            if (x <= this.mu) {
                return 0;
            }
            const z = (x - this.mu) / this.c;
            return Math.sqrt(this.c / (2 * Math.PI)) *
                Math.exp(-1 / (2 * z)) /
                (this.c * Math.pow(z, 3 / 2));
        }
        /**
         * Calculates the cumulative distribution function (CDF) at a given point.
         *
         * @param x - The point at which to evaluate the CDF
         * @returns The probability that a random variable from this distribution is less than or equal to x
         *
         * @description
         * The CDF of the Lévy distribution is defined as:
         * F(x) = erfc(sqrt(c/(2(x-μ))))
         * for x > μ, and 0 otherwise.
         * Uses an approximation of the complementary error function (erfc).
         *
         * @example
         * ```typescript
         * const levy = new LevyDistribution(0, 1);
         * const probability = levy.cdf(2.0); // P(X ≤ 2.0)
         * ```
         */
        cdf(x) {
            if (x <= this.mu) {
                return 0;
            }
            return this.erfc(Math.sqrt(this.c / (2 * (x - this.mu))));
        }
        /**
         * Calculates the complementary error function (erfc) using an approximation.
         *
         * @param x - Input value
         * @returns Approximation of erfc(x)
         *
         * @description
         * Uses the approximation from Numerical Recipes for computing erfc(x).
         * The approximation is accurate to ~7 decimal places.
         *
         * @remarks
         * This is a private helper method used internally by the CDF calculation.
         * The approximation coefficients are from Numerical Recipes (Press et al.).
         */
        erfc(x) {
            const z = Math.abs(x);
            const t = 1.0 / (1.0 + 0.5 * z);
            const r = t * Math.exp(-z * z - 1.26551223 +
                t * (1.00002368 +
                    t * (0.37409196 +
                        t * (0.09678418 +
                            t * (-0.18628806 +
                                t * (0.27886807 +
                                    t * (-1.13520398 +
                                        t * (1.48851587 +
                                            t * (-0.82215223 +
                                                t * 0.17087277)))))))));
            return x >= 0 ? r : 2.0 - r;
        }
        /**
         * Gets the location parameter (μ) of the distribution.
         *
         * @returns The location parameter
         *
         * @example
         * ```typescript
         * const levy = new LevyDistribution(1.0, 1.0);
         * console.log(levy.location); // Outputs: 1.0
         * ```
         */
        get location() {
            return this.mu;
        }
        /**
         * Gets the scale parameter (c) of the distribution.
         *
         * @returns The scale parameter
         *
         * @example
         * ```typescript
         * const levy = new LevyDistribution(0, 2.0);
         * console.log(levy.scale); // Outputs: 2.0
         * ```
         */
        get scale() {
            return this.c;
        }
    }

    /**
     * Implements a log-normal probability distribution, where the logarithm of the random variable
     * follows a normal (Gaussian) distribution.
     *
     * @description
     * The log-normal distribution is a continuous probability distribution of a random variable whose
     * logarithm is normally distributed. If X is log-normally distributed, then Y = ln(X) has a normal
     * distribution. A log-normal distribution results when the variable is the product of many independent,
     * positive, random variables.
     *
     * @summary
     * Provides methods for sampling from a log-normal distribution and computing its properties including
     * PDF, CDF, mean, variance, and mode. Uses the Box-Muller transform for generating random samples.
     *
     * @remarks
     * - All methods assume input parameters are finite numbers
     * - The implementation uses the Box-Muller transform for generating random samples
     * - The CDF calculation uses an approximation of the error function (erf)
     * - The distribution is only defined for positive real numbers
     *
     * @example
     * ```typescript
     * // Create a log-normal distribution with μ = 0 and σ = 1
     * const dist = new LogNormalDistribution(0, 1);
     *
     * // Generate a random sample
     * const sample = dist.sample();
     *
     * // Calculate PDF at x = 2
     * const density = dist.pdf(2);
     *
     * // Calculate CDF at x = 2
     * const probability = dist.cdf(2);
     * ```
     */
    class LogNormalDistribution {
        mu;
        sigma;
        /**
         * Creates a new log-normal distribution with specified parameters.
         *
         * @param mu - The location parameter μ (mean of the underlying normal distribution)
         * @param sigma - The scale parameter σ (standard deviation of the underlying normal distribution)
         * @throws {Error} If sigma is not positive
         *
         * @remarks
         * The parameters μ and σ are the mean and standard deviation of the underlying normal distribution,
         * not of the log-normal distribution itself.
         *
         * @example
         * ```typescript
         * // Standard log-normal distribution
         * const standard = new LogNormalDistribution(0, 1);
         *
         * // Custom parameters
         * const custom = new LogNormalDistribution(1.5, 0.5);
         * ```
         */
        constructor(mu = 0, sigma = 1) {
            if (sigma <= 0) {
                throw new Error('sigma must be positive');
            }
            this.mu = mu;
            this.sigma = sigma;
        }
        /**
         * Generates a random sample from the log-normal distribution.
         *
         * @returns A random number from the log-normal distribution
         *
         * @description
         * Uses the Box-Muller transform to generate normally distributed random numbers,
         * then transforms them to follow the log-normal distribution.
         *
         * @remarks
         * The Box-Muller transform generates pairs of independent standard normal random variables.
         * We only use one of the pair in this implementation.
         */
        sample(rng) {
            const u1 = rng.random();
            const u2 = rng.random();
            const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            return Math.exp(this.mu + this.sigma * z);
        }
        /**
         * Calculates the probability density function (PDF) at a given point.
         *
         * @param x - The point at which to calculate the PDF
         * @returns The value of the PDF at x
         *
         * @description
         * The PDF of a log-normal distribution is given by:
         * f(x) = 1/(x σ √(2π)) * exp(-(ln(x) - μ)²/(2σ²))
         *
         * @remarks
         * Returns 0 for x ≤ 0 as the log-normal distribution is only defined for positive real numbers.
         *
         * @example
         * ```typescript
         * const dist = new LogNormalDistribution(0, 1);
         * const density = dist.pdf(2.5); // Returns the probability density at x = 2.5
         * ```
         */
        pdf(x) {
            if (x <= 0)
                return 0;
            const logX = Math.log(x);
            const numerator = Math.exp(-Math.pow(logX - this.mu, 2) / (2 * this.sigma * this.sigma));
            const denominator = x * this.sigma * Math.sqrt(2 * Math.PI);
            return numerator / denominator;
        }
        /**
         * Calculates the cumulative distribution function (CDF) at a given point.
         *
         * @param x - The point at which to calculate the CDF
         * @returns The probability that a random variable from this distribution is less than or equal to x
         *
         * @description
         * The CDF of a log-normal distribution is given by:
         * F(x) = 1/2 * [1 + erf((ln(x) - μ)/(σ√2))]
         *
         * @remarks
         * Uses an approximation of the error function (erf) for the calculation.
         * Returns 0 for x ≤ 0 as the log-normal distribution is only defined for positive real numbers.
         *
         * @example
         * ```typescript
         * const dist = new LogNormalDistribution(0, 1);
         * const probability = dist.cdf(2.5); // Returns P(X ≤ 2.5)
         * ```
         */
        cdf(x) {
            if (x <= 0)
                return 0;
            const logX = Math.log(x);
            const z = (logX - this.mu) / (this.sigma * Math.sqrt(2));
            return 0.5 * (1 + this.erf(z));
        }
        /**
         * Calculates the error function (erf) using a polynomial approximation.
         *
         * @param x - The point at which to calculate the error function
         * @returns The value of erf(x)
         *
         * @description
         * Uses Abramowitz and Stegun's polynomial approximation for the error function.
         * Maximum error of this approximation is 1.5×10⁻⁷.
         *
         * @remarks
         * This is a private helper method used in CDF calculations.
         * The approximation is accurate to within 1.5×10⁻⁷ absolute error.
         */
        erf(x) {
            const a1 = 0.254829592;
            const a2 = -0.284496736;
            const a3 = 1.421413741;
            const a4 = -1.453152027;
            const a5 = 1.061405429;
            const p = 0.3275911;
            const sign = x >= 0 ? 1 : -1;
            x = Math.abs(x);
            const t = 1.0 / (1.0 + p * x);
            const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
            return sign * y;
        }
        /**
         * Calculates the mean (expected value) of the distribution.
         *
         * @returns The mean of the distribution
         *
         * @description
         * For a log-normal distribution, the mean is given by:
         * E[X] = exp(μ + σ²/2)
         *
         * @example
         * ```typescript
         * const dist = new LogNormalDistribution(1, 0.5);
         * const expectedValue = dist.mean();
         * ```
         */
        mean() {
            return Math.exp(this.mu + (this.sigma * this.sigma) / 2);
        }
        /**
         * Calculates the variance of the distribution.
         *
         * @returns The variance of the distribution
         *
         * @description
         * For a log-normal distribution, the variance is given by:
         * Var[X] = [exp(σ²) - 1] * exp(2μ + σ²)
         *
         * @example
         * ```typescript
         * const dist = new LogNormalDistribution(1, 0.5);
         * const variance = dist.variance();
         * ```
         */
        variance() {
            const expSigmaSq = Math.exp(this.sigma * this.sigma);
            return Math.exp(2 * this.mu + this.sigma * this.sigma) * (expSigmaSq - 1);
        }
        /**
         * Calculates the mode (most frequent value) of the distribution.
         *
         * @returns The mode of the distribution
         *
         * @description
         * For a log-normal distribution, the mode is given by:
         * mode = exp(μ - σ²)
         *
         * @example
         * ```typescript
         * const dist = new LogNormalDistribution(1, 0.5);
         * const mostFrequentValue = dist.mode();
         * ```
         */
        mode() {
            return Math.exp(this.mu - this.sigma * this.sigma);
        }
    }

    /**
     * Implements a Logistic probability distribution with location and scale parameters.
     *
     * @description
     * The Logistic distribution is a continuous probability distribution that resembles
     * the normal distribution in shape but has heavier tails (higher kurtosis).
     * It is used in various fields including growth modeling, demographic studies,
     * and logistic regression.
     *
     * @summary
     * This class provides methods to work with the Logistic distribution including:
     * - Sampling random values
     * - Computing probability density (PDF)
     * - Computing cumulative distribution (CDF)
     * - Calculating statistical properties (mean, variance, median)
     *
     * @remarks
     * The Logistic distribution is defined by two parameters:
     * - μ (location): Determines the median and mean of the distribution
     * - s (scale): Determines the variance and overall spread
     *
     * The PDF is given by: f(x) = exp(-(x-μ)/s) / (s * (1 + exp(-(x-μ)/s))^2)
     * The CDF is given by: F(x) = 1 / (1 + exp(-(x-μ)/s))
     *
     * @example
     * ```typescript
     * // Create a standard logistic distribution (μ=0, s=1)
     * const logistic = new LogisticDistribution();
     *
     * // Create a logistic distribution with custom parameters
     * const custom = new LogisticDistribution(2, 0.5);
     *
     * // Generate random samples
     * const rng = new NativeRandom();
     * const sample = logistic.sample(rng);
     *
     * // Compute probabilities
     * const density = logistic.pdf(1.5);
     * const cumulative = logistic.cdf(1.5);
     * ```
     */
    class LogisticDistribution {
        location;
        scale;
        /**
         * Creates a new Logistic Distribution instance.
         *
         * @param location - The location parameter μ (default: 0)
         *                  Represents the median of the distribution
         * @param scale - The scale parameter s (default: 1)
         *               Must be positive, proportional to standard deviation
         *
         * @throws {Error} If scale parameter is not positive
         *
         * @remarks
         * The scale parameter is related to the standard deviation σ by:
         * σ = s * π / √3
         *
         * @example
         * ```typescript
         * // Standard logistic distribution
         * const std = new LogisticDistribution();
         *
         * // Custom parameters
         * const custom = new LogisticDistribution(1.5, 2);
         * ```
         */
        constructor(location = 0, scale = 1) {
            if (scale <= 0) {
                throw new Error('Scale parameter must be positive');
            }
            this.location = location;
            this.scale = scale;
        }
        /**
         * Generates a random sample from the logistic distribution.
         *
         * @description
         * Uses the inverse CDF method: F^(-1)(U) where U is uniform(0,1)
         *
         * @returns A random number from the distribution
         *
         * @remarks
         * The implementation uses the inverse transform sampling method:
         * 1. Generate U ~ Uniform(0,1)
         * 2. Return μ + s * ln(U/(1-U))
         *
         * @example
         * ```typescript
         * const logistic = new LogisticDistribution(0, 1);
         * const rng = new NativeRandom();
         * const sample = logistic.sample(rng);
         * ```
         */
        sample(rng) {
            const u = rng.random();
            return this.location + this.scale * Math.log(u / (1 - u));
        }
        /**
         * Calculates the probability density function (PDF) at point x.
         *
         * @param x - The point at which to evaluate the PDF
         * @returns The probability density at point x
         *
         * @description
         * Computes the value of the probability density function:
         * f(x) = exp(-(x-μ)/s) / (s * (1 + exp(-(x-μ)/s))^2)
         *
         * @remarks
         * The PDF represents the relative likelihood of the random variable
         * taking on a specific value x.
         *
         * @example
         * ```typescript
         * const logistic = new LogisticDistribution(0, 1);
         * const density = logistic.pdf(0.5);  // Density at x=0.5
         * ```
         */
        pdf(x) {
            const z = (x - this.location) / this.scale;
            const exp_z = Math.exp(-z);
            return exp_z / (this.scale * Math.pow(1 + exp_z, 2));
        }
        /**
         * Calculates the cumulative distribution function (CDF) at point x.
         *
         * @param x - The point at which to evaluate the CDF
         * @returns The cumulative probability at point x
         *
         * @description
         * Computes the probability that a random variable from this distribution
         * takes on a value less than or equal to x:
         * F(x) = 1 / (1 + exp(-(x-μ)/s))
         *
         * @remarks
         * The CDF represents the probability that a random draw from the
         * distribution will be less than or equal to x.
         *
         * @example
         * ```typescript
         * const logistic = new LogisticDistribution(0, 1);
         * const prob = logistic.cdf(0.5);  // P(X ≤ 0.5)
         * ```
         */
        cdf(x) {
            const z = (x - this.location) / this.scale;
            return 1 / (1 + Math.exp(-z));
        }
        /**
         * Gets the mean (expected value) of the distribution.
         *
         * @returns The mean of the distribution
         *
         * @description
         * For the logistic distribution, the mean equals the location parameter μ.
         *
         * @remarks
         * The mean represents the center of mass of the probability distribution.
         *
         * @example
         * ```typescript
         * const logistic = new LogisticDistribution(2, 1);
         * const mean = logistic.getMean();  // Returns 2
         * ```
         */
        getMean() {
            return this.location;
        }
        /**
         * Gets the variance of the distribution.
         *
         * @returns The variance of the distribution
         *
         * @description
         * For the logistic distribution, variance = (s^2 * π^2) / 3,
         * where s is the scale parameter.
         *
         * @remarks
         * The variance measures the spread of the distribution around its mean.
         *
         * @example
         * ```typescript
         * const logistic = new LogisticDistribution(0, 1);
         * const variance = logistic.getVariance();  // Returns π²/3
         * ```
         */
        getVariance() {
            return (Math.pow(this.scale, 2) * Math.pow(Math.PI, 2)) / 3;
        }
        /**
         * Gets the median of the distribution.
         *
         * @returns The median of the distribution
         *
         * @description
         * For the logistic distribution, the median equals the location parameter μ.
         *
         * @remarks
         * The median represents the value that divides the distribution
         * into two equal probability areas.
         *
         * @example
         * ```typescript
         * const logistic = new LogisticDistribution(2, 1);
         * const median = logistic.getMedian();  // Returns 2
         * ```
         */
        getMedian() {
            return this.location;
        }
        /**
         * Gets the current parameters of the distribution.
         *
         * @returns An object containing the location and scale parameters
         *
         * @description
         * Returns the parameters that define this instance of the distribution.
         *
         * @example
         * ```typescript
         * const logistic = new LogisticDistribution(2, 1);
         * const params = logistic.getParameters();
         * // params = { location: 2, scale: 1 }
         * ```
         */
        getParameters() {
            return {
                location: this.location,
                scale: this.scale
            };
        }
    }

    /**
     * Implementation of the Maxwell-Boltzmann distribution, which describes the speed
     * distribution of particles in an ideal gas at thermal equilibrium.
     *
     * @description
     * The Maxwell-Boltzmann distribution models the probability distribution of molecular
     * speeds in idealized gases. This implementation provides methods for sampling from
     * the distribution and calculating its probability density function (PDF) and
     * cumulative distribution function (CDF).
     *
     * @summary
     * Provides sampling and probability calculations for the Maxwell-Boltzmann distribution
     * with a given scale parameter.
     *
     * @remarks
     * The implementation uses the acceptance-rejection method for sampling and includes
     * accurate approximations for special functions like the error function (erf).
     * The distribution is parameterized by a scale parameter 'a' which is related to
     * the physical parameters through: a = sqrt(kB * T / m), where:
     * - kB is the Boltzmann constant
     * - T is the absolute temperature
     * - m is the particle mass
     *
     * @example
     * ```typescript
     * // Calculate scale parameter for hydrogen at room temperature
     * const kB = 1.380649e-23;  // Boltzmann constant in J/K
     * const T = 300;            // Temperature in Kelvin
     * const m = 1.6735575e-27;  // Mass of hydrogen atom in kg
     * const a = Math.sqrt(kB * T / m);
     *
     * // Create distribution instance
     * const distribution = new MaxwellBoltzmannDistribution(a);
     *
     * // Generate a random speed
     * const speed = distribution.sample();
     *
     * // Calculate probability density at 1000 m/s
     * const density = distribution.pdf(1000);
     * ```
     */
    class MaxwellBoltzmannDistribution {
        a;
        /**
         * Creates a new Maxwell-Boltzmann distribution with the specified scale parameter.
         *
         * @param a - The scale parameter of the distribution (a = sqrt(kB * T / m))
         * @throws {Error} If the scale parameter is not positive
         *
         * @remarks
         * The scale parameter 'a' determines the shape and scale of the distribution.
         * It must be positive and is typically calculated from physical parameters.
         *
         * @example
         * ```typescript
         * const a = Math.sqrt(1.380649e-23 * 300 / 1.6735575e-27);
         * const distribution = new MaxwellBoltzmannDistribution(a);
         * ```
         */
        constructor(a) {
            if (a <= 0) {
                throw new Error('Scale parameter must be positive');
            }
            this.a = a;
        }
        /**
         * Generates a random sample from the Maxwell-Boltzmann distribution.
         *
         * @returns A non-negative random number representing a speed from the distribution
         *
         * @description
         * Uses the acceptance-rejection method with Box-Muller transformation to generate
         * random samples. This implementation generates three normally distributed random
         * variables and computes their magnitude to obtain a Maxwell-Boltzmann distributed value.
         *
         * @remarks
         * The implementation uses the Box-Muller transformation and an additional random
         * variable to ensure the correct three-dimensional nature of the distribution.
         * This method is more efficient than direct rejection sampling.
         *
         * @example
         * ```typescript
         * const distribution = new MaxwellBoltzmannDistribution(1000);
         * const rng = new NativeRandom();
         * const randomSpeed = distribution.sample(rng);
         * ```
         */
        sample(rng) {
            while (true) {
                const u1 = rng.random();
                const u2 = rng.random();
                const u3 = rng.random();
                const x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                const y = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
                const z = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u2);
                const r = Math.sqrt(x * x + y * y + z * z);
                return r * this.a;
            }
        }
        /**
         * Calculates the probability density function (PDF) at a given point.
         *
         * @param x - The point at which to calculate the PDF
         * @returns The probability density at point x
         *
         * @description
         * Computes the probability density using the formula:
         * PDF(x) = sqrt(2/π) * (x²/a³) * exp(-x²/(2a²))
         *
         * @remarks
         * The PDF is zero for negative values of x, reflecting the physical
         * impossibility of negative speeds. The function reaches its maximum
         * at x = a * sqrt(2).
         *
         * @example
         * ```typescript
         * const distribution = new MaxwellBoltzmannDistribution(1000);
         * const density = distribution.pdf(1500); // Probability density at 1500 m/s
         * ```
         */
        pdf(x) {
            if (x < 0)
                return 0;
            const a2 = this.a * this.a;
            return Math.sqrt(2 / Math.PI) *
                (x * x) / (this.a * this.a * this.a) *
                Math.exp(-(x * x) / (2 * a2));
        }
        /**
         * Calculates the cumulative distribution function (CDF) at a given point.
         *
         * @param x - The point at which to calculate the CDF
         * @returns The cumulative probability at point x
         *
         * @description
         * Computes the cumulative probability using the formula:
         * CDF(x) = erf(x/(a*sqrt(2))) - sqrt(2/π) * (x/a) * exp(-x²/(2a²))
         *
         * @remarks
         * The CDF represents the probability that a random sample from the
         * distribution will be less than or equal to x. It approaches 1 as
         * x approaches infinity and is 0 for negative x.
         *
         * @example
         * ```typescript
         * const distribution = new MaxwellBoltzmannDistribution(1000);
         * const probability = distribution.cdf(2000); // Probability of speed <= 2000 m/s
         * ```
         */
        cdf(x) {
            if (x < 0)
                return 0;
            const z = x / (this.a * Math.sqrt(2));
            return this.erf(z) -
                Math.sqrt(2 / Math.PI) * (x / this.a) * Math.exp(-(x * x) / (2 * this.a * this.a));
        }
        /**
         * Calculates the error function (erf) using the Abramowitz and Stegun approximation.
         *
         * @param x - The point at which to calculate the error function
         * @returns The value of erf(x)
         *
         * @description
         * Implements the error function using a polynomial approximation that provides
         * accurate results with a maximum error of 1.5×10⁻⁷.
         *
         * @remarks
         * This implementation uses the Abramowitz and Stegun approximation 7.1.26.
         * The approximation has a relative error less than 2.5×10⁻⁵ in absolute value.
         *
         * @private
         */
        erf(x) {
            const p = 0.3275911;
            const a1 = 0.254829592;
            const a2 = -0.284496736;
            const a3 = 1.421413741;
            const a4 = -1.453152027;
            const a5 = 1.061405429;
            const sign = x < 0 ? -1 : 1;
            x = Math.abs(x);
            const t = 1.0 / (1.0 + p * x);
            const y = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
            return sign * (1 - y * Math.exp(-x * x));
        }
    }

    /**
     * Implements a Negative Binomial probability distribution
     *
     * @description
     * The Negative Binomial distribution models the number of successes in a sequence of independent
     * Bernoulli trials before a specified number of failures occurs. Each trial has the same probability
     * of success.
     *
     * @summary
     * This implementation provides methods for sampling from the distribution and computing probability
     * mass function (PMF) and cumulative distribution function (CDF) values. It also includes utility
     * methods for calculating the distribution's mean and variance.
     *
     * @remarks
     * The implementation uses:
     * - Inverse transform sampling for generating random samples
     * - Numerically stable methods for computing binomial coefficients
     * - Efficient algorithms for PMF and CDF calculations
     *
     * @example
     * ```typescript
     * // Create a distribution with 5 failures and 0.3 probability of success
     * const nb = new NegativeBinomialDistribution(5, 0.3);
     *
     * // Generate a random sample
     * const rng = new NativeRandom();
     * const sample = nb.sample(rng);
     *
     * // Calculate probability at x=3
     * const probability = nb.pdf(3);
     *
     * // Calculate cumulative probability up to x=3
     * const cumulativeProbability = nb.cdf(3);
     * ```
     */
    class NegativeBinomialDistribution {
        r; // Number of failures until stopping
        p; // Probability of success on each trial
        /**
         * Creates a new Negative Binomial distribution instance
         *
         * @description
         * Initializes a new Negative Binomial distribution with specified parameters for
         * number of failures and probability of success.
         *
         * @param r - Number of failures until stopping (must be positive)
         * @param p - Probability of success on each trial (must be between 0 and 1)
         *
         * @throws {Error} If r is not positive or p is not between 0 and 1
         *
         * @example
         * ```typescript
         * // Create distribution with 5 failures and 0.3 probability of success
         * const dist = new NegativeBinomialDistribution(5, 0.3);
         * ```
         */
        constructor(r, p) {
            if (r <= 0)
                throw new Error('r must be positive');
            if (p <= 0 || p >= 1)
                throw new Error('p must be between 0 and 1');
            this.r = r;
            this.p = p;
        }
        /**
         * Generates a random sample from the distribution
         *
         * @description
         * Uses inverse transform sampling to generate a random value following
         * the Negative Binomial distribution.
         *
         * @returns A random number from the distribution representing the number of successes
         *
         * @remarks
         * The implementation simulates individual Bernoulli trials until the required
         * number of failures is reached, which ensures accurate sampling even for
         * extreme parameter values.
         *
         * @example
         * ```typescript
         * const dist = new NegativeBinomialDistribution(5, 0.3);
         * const randomValue = dist.sample();
         * ```
         */
        sample(rng) {
            let failures = 0;
            let successes = 0;
            while (failures < this.r) {
                const trial = rng.random();
                if (trial < this.p) {
                    successes++;
                }
                else {
                    failures++;
                }
            }
            return successes;
        }
        /**
         * Calculates the probability mass function (PMF) at a given point
         *
         * @description
         * Computes the probability mass function value for a specific number of successes k.
         * The PMF is given by: C(k+r-1,k) * p^k * (1-p)^r
         * where C(n,k) is the binomial coefficient.
         *
         * @param k - The number of successes to calculate the probability for
         * @returns The probability of exactly k successes
         *
         * @remarks
         * - Returns 0 for negative or non-integer values of k
         * - Uses numerically stable methods for calculating binomial coefficients
         *
         * @example
         * ```typescript
         * const dist = new NegativeBinomialDistribution(5, 0.3);
         * const probability = dist.pdf(3); // Probability of exactly 3 successes
         * ```
         */
        pdf(k) {
            if (k < 0 || !Number.isInteger(k))
                return 0;
            const coefficient = this.binomialCoefficient(k + this.r - 1, k);
            const probability = Math.pow(this.p, k) * Math.pow(1 - this.p, this.r);
            return coefficient * probability;
        }
        /**
         * Calculates the cumulative distribution function (CDF) at a given point
         *
         * @description
         * Computes the cumulative probability up to and including k successes by summing
         * the PMF values from 0 to k.
         *
         * @param k - The number of successes to calculate the cumulative probability for
         * @returns The probability of k or fewer successes
         *
         * @remarks
         * - Returns 0 for negative values of k
         * - For non-integer k, calculates CDF up to floor(k)
         *
         * @example
         * ```typescript
         * const dist = new NegativeBinomialDistribution(5, 0.3);
         * const cumulativeProbability = dist.cdf(3); // P(X ≤ 3)
         * ```
         */
        cdf(k) {
            if (k < 0)
                return 0;
            let sum = 0;
            for (let i = 0; i <= Math.floor(k); i++) {
                sum += this.pdf(i);
            }
            return sum;
        }
        /**
         * Calculates the binomial coefficient C(n,k)
         *
         * @description
         * Computes the binomial coefficient (n choose k) using a numerically stable method
         * suitable for large numbers.
         *
         * @param n - The total number of items
         * @param k - The number of items to choose
         * @returns The binomial coefficient C(n,k)
         *
         * @remarks
         * - Uses symmetry to reduce computation for large k
         * - Returns 0 for invalid inputs (k < 0 or k > n)
         * - Returns 1 for edge cases (k = 0 or k = n)
         *
         * @private
         */
        binomialCoefficient(n, k) {
            if (k < 0 || k > n)
                return 0;
            if (k === 0 || k === n)
                return 1;
            if (k > n - k)
                k = n - k; // Use symmetry for smaller k
            let result = 1;
            for (let i = 1; i <= k; i++) {
                result *= (n + 1 - i);
                result /= i;
            }
            return result;
        }
        /**
         * Calculates the mean (expected value) of the distribution
         *
         * @description
         * Computes the theoretical mean of the Negative Binomial distribution
         * using the formula: (r*p)/(1-p)
         *
         * @returns The mean of the distribution
         *
         * @example
         * ```typescript
         * const dist = new NegativeBinomialDistribution(5, 0.3);
         * const mean = dist.getMean(); // Expected number of successes
         * ```
         */
        getMean() {
            return (this.r * this.p) / (1 - this.p);
        }
        /**
         * Calculates the variance of the distribution
         *
         * @description
         * Computes the theoretical variance of the Negative Binomial distribution
         * using the formula: (r*p)/(1-p)^2
         *
         * @returns The variance of the distribution
         *
         * @example
         * ```typescript
         * const dist = new NegativeBinomialDistribution(5, 0.3);
         * const variance = dist.getVariance(); // Variance of the number of successes
         * ```
         */
        getVariance() {
            return (this.r * this.p) / Math.pow(1 - this.p, 2);
        }
    }

    /**
     * Implementation of a Normal (Gaussian) distribution with configurable mean and standard deviation.
     *
     * @description
     * This class provides methods for working with the Normal distribution, including:
     * - Generating random samples using the Box-Muller transform
     * - Calculating probability density (PDF)
     * - Calculating cumulative distribution (CDF)
     * - Error function approximation (erf)
     *
     * @summary
     * The Normal distribution is a continuous probability distribution that is symmetric
     * about its mean, showing the familiar bell-shaped curve. It is fully characterized
     * by its mean (μ) and standard deviation (σ).
     *
     * @example
     * ```typescript
     * // Create a standard normal distribution (μ=0, σ=1)
     * const standardNormal = new NormalDistribution();
     *
     * // Create a normal distribution with μ=10 and σ=2
     * const myNormal = new NormalDistribution(10, 2);
     *
     * // Generate random samples
     * const sample1 = myNormal.sample();
     * const sample2 = myNormal.sample();
     *
     * // Calculate probability density at x=11
     * const density = myNormal.pdf(11);
     *
     * // Calculate cumulative probability up to x=12
     * const cumulative = myNormal.cdf(12);
     * ```
     *
     * @remarks
     * - The Box-Muller transform is used for generating random samples, which provides
     *   high-quality normally distributed random numbers.
     * - The CDF implementation uses the error function (erf) approximation from
     *   Abramowitz and Stegun, with a maximum error of 1.5×10−7.
     * - All calculations maintain numerical stability and accuracy within typical ranges
     *   of parameters.
     */
    class NormalDistribution {
        mean;
        standardDeviation;
        variance;
        // Constants for the Box-Muller transform
        hasSpare = false;
        spare = 0;
        /**
         * Creates a new Normal distribution instance.
         *
         * @param mean - The mean (μ) of the distribution, representing its center
         * @param standardDeviation - The standard deviation (σ) of the distribution, representing its spread
         *
         * @throws {Error} If standardDeviation is less than or equal to 0
         *
         * @example
         * ```typescript
         * // Standard normal distribution
         * const std = new NormalDistribution();
         *
         * // Custom normal distribution
         * const custom = new NormalDistribution(5, 2.5);
         * ```
         *
         * @remarks
         * The default parameters (mean = 0, standardDeviation = 1) create a standard
         * normal distribution.
         */
        constructor(mean = 0, standardDeviation = 1) {
            if (standardDeviation <= 0) {
                throw new Error('Standard deviation must be positive');
            }
            this.mean = mean;
            this.standardDeviation = standardDeviation;
            this.variance = standardDeviation * standardDeviation;
        }
        /**
         * Generates a random sample from the distribution using the Box-Muller transform.
         *
         * @returns A random number from this normal distribution
         *
         * @example
         * ```typescript
         * const normal = new NormalDistribution(10, 2);
         * const rng = new NativeRandom();
         * const sample = normal.sample(rng);
         * ```
         *
         * @remarks
         * The Box-Muller transform generates two independent standard normal samples at
         * once. For efficiency, one sample is cached for the next call. This approach
         * provides both performance and high-quality random samples.
         */
        sample(rng) {
            if (this.hasSpare) {
                this.hasSpare = false;
                return this.spare * this.standardDeviation + this.mean;
            }
            let u, v, s;
            do {
                u = rng.random() * 2 - 1;
                v = rng.random() * 2 - 1;
                s = u * u + v * v;
            } while (s >= 1 || s === 0);
            s = Math.sqrt(-2.0 * Math.log(s) / s);
            this.spare = v * s;
            this.hasSpare = true;
            return (u * s * this.standardDeviation + this.mean);
        }
        /**
         * Calculates the probability density function (PDF) at a given point.
         *
         * @param x - The point at which to calculate the PDF
         * @returns The probability density at point x
         *
         * @example
         * ```typescript
         * const normal = new NormalDistribution(0, 1);
         * const density = normal.pdf(0); // Returns ~0.3989 (peak of standard normal)
         * ```
         *
         * @remarks
         * The PDF for a normal distribution is:
         * f(x) = (1 / (σ√(2π))) * e^(-(x-μ)²/(2σ²))
         * where μ is the mean and σ is the standard deviation
         */
        pdf(x) {
            const exponent = -Math.pow(x - this.mean, 2) / (2 * this.variance);
            return Math.exp(exponent) / (Math.sqrt(2 * Math.PI * this.variance));
        }
        /**
         * Calculates the cumulative distribution function (CDF) at a given point.
         *
         * @param x - The point at which to calculate the CDF
         * @returns The probability that a random sample will be less than or equal to x
         *
         * @example
         * ```typescript
         * const normal = new NormalDistribution(0, 1);
         * const probability = normal.cdf(0); // Returns 0.5 (median of standard normal)
         * ```
         *
         * @remarks
         * The CDF is calculated using the error function (erf):
         * F(x) = 0.5 * (1 + erf((x-μ)/(σ√2)))
         * This implementation uses an approximation of erf with high accuracy.
         */
        cdf(x) {
            return 0.5 * (1 + this.erf((x - this.mean) / (this.standardDeviation * Math.SQRT2)));
        }
        /**
         * Approximates the error function (erf) using the Abramowitz and Stegun method.
         *
         * @param x - The input value
         * @returns The error function value at x
         *
         * @remarks
         * This is a private helper method implementing the error function approximation
         * from Abramowitz and Stegun (1964). The maximum error of this approximation
         * is 1.5×10^-7, making it suitable for most practical applications.
         *
         * The implementation uses the formula:
         * erf(x) = 1 - (((((a₅t + a₄)t + a₃)t + a₂)t + a₁)t + a₀)t * e^(-x²)
         * where t = 1/(1 + px)
         */
        erf(x) {
            const sign = x >= 0 ? 1 : -1;
            x = Math.abs(x);
            const a1 = 0.254829592;
            const a2 = -0.284496736;
            const a3 = 1.421413741;
            const a4 = -1.453152027;
            const a5 = 1.061405429;
            const p = 0.3275911;
            const t = 1.0 / (1.0 + p * x);
            const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
            return sign * y;
        }
    }

    /**
     * Implementation of the Pareto probability distribution.
     *
     * @description
     * The Pareto distribution is a power-law probability distribution commonly used to model
     * phenomena in economics, social sciences, geophysics, and many other scientific fields.
     * It is named after Italian civil engineer, economist, and sociologist Vilfredo Pareto.
     *
     * @summary
     * This class provides methods for sampling from a Pareto distribution and computing its
     * statistical properties including PDF, CDF, mean, and variance.
     *
     * @remarks
     * The Pareto distribution is characterized by two parameters:
     * - α (alpha): shape parameter that determines the concentration of the distribution
     * - xm: scale parameter that specifies the minimum possible value of the distribution
     *
     * The distribution is only defined for x ≥ xm and has the following properties:
     * - Heavy-tailed: probability decreases as a power law
     * - Infinite mean when α ≤ 1
     * - Infinite variance when α ≤ 2
     *
     * @example
     * ```typescript
     * // Create a new Pareto distribution with α = 3 and xm = 1
     * const pareto = new ParetoDistribution(3, 1);
     *
     * // Generate a random sample
     * const rng = new NativeRandom();
     * const sample = pareto.sample(rng);
     *
     * // Calculate probability density at x = 2
     * const density = pareto.pdf(2);
     *
     * // Calculate cumulative probability at x = 2
     * const cumulative = pareto.cdf(2);
     * ```
     */
    class ParetoDistribution {
        alpha; // Shape parameter
        xm; // Scale parameter (minimum value)
        /**
         * Creates a new Pareto distribution instance.
         *
         * @param alpha - Shape parameter controlling the tail weight of the distribution
         * @param xm - Scale parameter defining the minimum possible value
         *
         * @throws {Error} If alpha ≤ 0 or xm ≤ 0
         *
         * @remarks
         * Both parameters must be strictly positive. The shape parameter alpha determines
         * how quickly the tail of the distribution decays, with smaller values producing
         * heavier tails.
         *
         * @example
         * ```typescript
         * // Create a Pareto distribution with shape α = 2 and minimum value xm = 1
         * const pareto = new ParetoDistribution(2, 1);
         * ```
         */
        constructor(alpha, xm) {
            if (alpha <= 0)
                throw new Error("Shape parameter (alpha) must be positive");
            if (xm <= 0)
                throw new Error("Scale parameter (xm) must be positive");
            this.alpha = alpha;
            this.xm = xm;
        }
        /**
         * Generates a random sample from the Pareto distribution.
         *
         * @returns A random number following the Pareto distribution
         *
         * @remarks
         * Uses the inverse transform sampling method:
         * F^(-1)(u) = xm * (1 - u)^(-1/alpha) where u is uniform(0,1)
         *
         * @example
         * ```typescript
         * const pareto = new ParetoDistribution(3, 1);
         * const rng = new NativeRandom();
         * const randomValue = pareto.sample(rng);
         * ```
         */
        sample(rng) {
            const u = rng.random();
            return this.xm / Math.pow(1 - u, 1 / this.alpha);
        }
        /**
         * Calculates the probability density function (PDF) at a given point.
         *
         * @param x - The point at which to calculate the PDF
         * @returns The probability density at point x
         *
         * @remarks
         * The PDF is calculated as:
         * f(x) = (α * xm^α) / x^(α+1) for x ≥ xm
         * f(x) = 0 for x < xm
         *
         * @example
         * ```typescript
         * const pareto = new ParetoDistribution(3, 1);
         * const density = pareto.pdf(2); // Calculate density at x = 2
         * ```
         */
        pdf(x) {
            if (x < this.xm)
                return 0;
            const numerator = this.alpha * Math.pow(this.xm, this.alpha);
            const denominator = Math.pow(x, this.alpha + 1);
            return numerator / denominator;
        }
        /**
         * Calculates the cumulative distribution function (CDF) at a given point.
         *
         * @param x - The point at which to calculate the CDF
         * @returns The cumulative probability at point x
         *
         * @remarks
         * The CDF is calculated as:
         * F(x) = 1 - (xm/x)^α for x ≥ xm
         * F(x) = 0 for x < xm
         *
         * @example
         * ```typescript
         * const pareto = new ParetoDistribution(3, 1);
         * const cumulative = pareto.cdf(2); // Calculate probability P(X ≤ 2)
         * ```
         */
        cdf(x) {
            if (x < this.xm)
                return 0;
            return 1 - Math.pow(this.xm / x, this.alpha);
        }
        /**
         * Calculates the expected value (mean) of the distribution.
         *
         * @returns The mean of the distribution
         *
         * @remarks
         * The mean is calculated as:
         * E[X] = (α * xm)/(α - 1) for α > 1
         * E[X] = ∞ for α ≤ 1
         *
         * When α ≤ 1, the mean is infinite due to the heavy tail of the distribution.
         *
         * @example
         * ```typescript
         * const pareto = new ParetoDistribution(3, 1);
         * const expectedValue = pareto.mean();
         * ```
         */
        mean() {
            if (this.alpha <= 1)
                return Infinity;
            return (this.alpha * this.xm) / (this.alpha - 1);
        }
        /**
         * Calculates the variance of the distribution.
         *
         * @returns The variance of the distribution
         *
         * @remarks
         * The variance is calculated as:
         * Var[X] = (xm^2 * α) / ((α-1)^2 * (α-2)) for α > 2
         * Var[X] = ∞ for 1 < α ≤ 2
         * Var[X] = undefined for α ≤ 1
         *
         * The variance:
         * - Is undefined when α ≤ 1 (mean doesn't exist)
         * - Is infinite when 1 < α ≤ 2 (second moment doesn't exist)
         * - Has a finite value when α > 2
         *
         * @example
         * ```typescript
         * const pareto = new ParetoDistribution(3, 1);
         * const varianceValue = pareto.variance();
         * ```
         */
        variance() {
            if (this.alpha <= 1)
                return NaN;
            if (this.alpha <= 2)
                return Infinity;
            const numerator = Math.pow(this.xm, 2) * this.alpha;
            const denominator = Math.pow(this.alpha - 1, 2) * (this.alpha - 2);
            return numerator / denominator;
        }
    }

    /**
     * A Permuted Congruential Generator (PCG) based implementation of the Normal (Gaussian) distribution.
     *
     * @description
     * This class implements a normal distribution using PCG as the underlying random number generator.
     * It provides methods for sampling from the distribution and calculating probability densities.
     * The implementation uses the Box-Muller transform for generating normally distributed random numbers
     * and includes methods for calculating both PDF and CDF values.
     *
     * @summary
     * PCG-based Normal Distribution with Box-Muller transform sampling.
     *
     * @remarks
     * The implementation uses the Box-Muller transform which is computationally efficient and produces
     * high-quality normally distributed random numbers. The PCG random number generator provides
     * excellent statistical properties and a long period.
     *
     * The error function (erf) implementation uses the Abramowitz and Stegun approximation formula
     * which provides accuracy to about 7 decimal places.
     *
     * @example
     * ```typescript
     * // Create a normal distribution with mean 0 and standard deviation 1
     * const normal = new PCGNormalDistribution(0, 1);
     *
     * // Generate a random sample
     * const rng = new NativeRandom()
     * const sample = normal.sample(rng);
     *
     * // Calculate probability density at x = 0
     * const density = normal.pdf(0);
     *
     * // Calculate cumulative probability at x = 1.96
     * const probability = normal.cdf(1.96); // ≈ 0.975
     * ```
     */
    class PCGNormalDistribution {
        mean;
        standardDeviation;
        /**
         * Creates a new PCG-based Normal Distribution.
         *
         * @param mean - The mean (μ) of the distribution
         * @param standardDeviation - The standard deviation (σ) of the distribution
         *
         * @throws {Error} If standardDeviation is less than or equal to 0
         *
         * @remarks
         * The seed parameter can be used to create reproducible sequences of random numbers.
         * If no seed is provided, a random seed will be generated.
         */
        constructor(mean, standardDeviation) {
            this.mean = mean;
            this.standardDeviation = standardDeviation;
            if (standardDeviation <= 0) {
                throw new Error('Standard deviation must be positive');
            }
        }
        /**
         * Generates a random sample from the normal distribution.
         *
         * @returns A random number from the normal distribution
         *
         * @description
         * Uses the Box-Muller transform to convert uniform random numbers into
         * normally distributed random numbers. The algorithm generates two independent
         * standard normal random variables, but only returns one for efficiency.
         *
         * @remarks
         * The Box-Muller transform uses the following steps:
         * 1. Generate two independent uniform random numbers u1, u2
         * 2. Transform them using: z0 = sqrt(-2 ln(u1)) * cos(2π * u2)
         * 3. Scale and shift the result using the mean and standard deviation
         */
        sample(rng) {
            const u1 = rng.random();
            const u2 = rng.random();
            const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            return z0 * this.standardDeviation + this.mean;
        }
        /**
         * Calculates the probability density function (PDF) at a given point.
         *
         * @param x - The point at which to calculate the PDF
         * @returns The probability density at point x
         *
         * @description
         * Implements the normal distribution PDF formula:
         * f(x) = (1 / (σ√(2π))) * e^(-(x-μ)²/(2σ²))
         * where μ is the mean and σ is the standard deviation
         *
         * @example
         * ```typescript
         * const normal = new PCGNormalDistribution(0, 1);
         * const density = normal.pdf(0); // Returns ≈ 0.3989
         * ```
         */
        pdf(x) {
            const variance = this.standardDeviation * this.standardDeviation;
            return (1 / Math.sqrt(2 * Math.PI * variance)) *
                Math.exp(-Math.pow(x - this.mean, 2) / (2 * variance));
        }
        /**
         * Calculates the cumulative distribution function (CDF) at a given point.
         *
         * @param x - The point at which to calculate the CDF
         * @returns The probability that a random variable is less than or equal to x
         *
         * @description
         * Calculates the probability that a random variable from this distribution
         * takes on a value less than or equal to x. Uses the error function (erf)
         * to compute the cumulative probability.
         *
         * @example
         * ```typescript
         * const normal = new PCGNormalDistribution(0, 1);
         * const probability = normal.cdf(1.96); // Returns ≈ 0.975
         * ```
         */
        cdf(x) {
            return 0.5 * (1 + this.erf((x - this.mean) / (this.standardDeviation * Math.sqrt(2))));
        }
        /**
         * Approximates the error function using the Abramowitz and Stegun formula.
         *
         * @param x - The input value
         * @returns The error function value at x
         *
         * @description
         * Implements the Abramowitz and Stegun approximation for the error function.
         * This approximation has a maximum error of 1.5×10^-7.
         *
         * @remarks
         * The coefficients used in this approximation are:
         * - a1 = 0.254829592
         * - a2 = -0.284496736
         * - a3 = 1.421413741
         * - a4 = -1.453152027
         * - a5 = 1.061405429
         * - p = 0.3275911
         *
         * @private
         */
        erf(x) {
            const sign = Math.sign(x);
            x = Math.abs(x);
            const a1 = 0.254829592;
            const a2 = -0.284496736;
            const a3 = 1.421413741;
            const a4 = -1.453152027;
            const a5 = 1.061405429;
            const p = 0.3275911;
            const t = 1.0 / (1.0 + p * x);
            const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
            return sign * y;
        }
    }

    /**
     * Implementation of the Poisson probability distribution.
     *
     * @description
     * The Poisson distribution is a discrete probability distribution that expresses the probability
     * of a given number of events occurring in a fixed interval of time or space if these events
     * occur with a known constant mean rate (λ) and independently of the time since the last event.
     *
     * @summary
     * - Implements the IContinuousDistribution interface
     * - Provides methods for sampling, PDF, and CDF calculations
     * - Uses numerically stable methods for calculations
     * - Supports parameter updates post-initialization
     *
     * @remarks
     * This implementation uses the inverse transform sampling method for generating random values
     * and provides numerically stable methods for calculating probabilities. The implementation
     * is suitable for both small and large values of lambda, though computational precision may
     * become a factor for very large values (lambda > 100).
     *
     * @example
     * ```typescript
     * // Create a Poisson distribution with average 5 events per interval
     * const poisson = new PoissonDistribution(5);
     *
     * // Generate a random sample
     * const rng = new NativeRandom();
     * const sample = poisson.sample(rng);
     *
     * // Calculate probability of exactly 3 events
     * const prob = poisson.pdf(3);
     *
     * // Calculate probability of 3 or fewer events
     * const cumProb = poisson.cdf(3);
     * ```
     */
    class PoissonDistribution {
        lambda;
        /**
         * Creates a new Poisson distribution with the specified rate parameter.
         *
         * @description
         * Initializes a new instance of the Poisson distribution with a given rate parameter lambda,
         * representing the average number of events in the interval.
         *
         * @param lambda - The average number of events in the interval (must be positive)
         *
         * @throws {Error} Throws if lambda is not positive
         *
         * @example
         * ```typescript
         * // Create distribution with average of 3 events
         * const dist = new PoissonDistribution(3);
         * ```
         */
        constructor(lambda) {
            if (lambda <= 0) {
                throw new Error('Lambda must be positive');
            }
            this.lambda = lambda;
        }
        /**
         * Generates a random value from the Poisson distribution.
         *
         * @description
         * Implements the inverse transform sampling method to generate random values
         * following the Poisson distribution with parameter lambda.
         *
         * @returns A random non-negative integer drawn from the Poisson distribution
         *
         * @remarks
         * This implementation uses the inverse transform sampling method, which is
         * generally efficient for small to medium values of lambda. For very large
         * values of lambda, other methods might be more appropriate.
         *
         * @example
         * ```typescript
         * const dist = new PoissonDistribution(5);
         * const rng = new NativeRandom();
         * const randomValue = dist.sample(rng); // Returns random count of events
         * ```
         */
        sample(rng) {
            const L = Math.exp(-this.lambda);
            let k = 0;
            let p = 1;
            do {
                k++;
                p *= rng.random();
            } while (p > L);
            return k - 1;
        }
        /**
         * Calculates the probability mass function (PMF) at a given point.
         *
         * @description
         * Computes P(X = k) = (λ^k * e^-λ) / k! for the Poisson distribution
         *
         * @param x - The point at which to calculate the probability (must be non-negative integer)
         * @returns The probability that the random variable equals x
         *
         * @remarks
         * Returns 0 for non-integer or negative values of x, as the Poisson
         * distribution is only defined for non-negative integers.
         *
         * @example
         * ```typescript
         * const dist = new PoissonDistribution(3);
         * const probOfTwo = dist.pdf(2); // P(X = 2) when λ = 3
         * ```
         */
        pdf(x) {
            if (x < 0 || !Number.isInteger(x)) {
                return 0;
            }
            const k = Math.floor(x);
            return (Math.pow(this.lambda, k) * Math.exp(-this.lambda)) / this.factorial(k);
        }
        /**
         * Calculates the cumulative distribution function (CDF) at a given point.
         *
         * @description
         * Computes P(X ≤ x) by summing the PMF from 0 to floor(x)
         *
         * @param x - The point at which to calculate the cumulative probability
         * @returns The probability that the random variable is less than or equal to x
         *
         * @remarks
         * For non-integer x, returns the probability up to floor(x).
         * This implementation may be computationally intensive for large values of x.
         *
         * @example
         * ```typescript
         * const dist = new PoissonDistribution(3);
         * const probUpToTwo = dist.cdf(2); // P(X ≤ 2) when λ = 3
         * ```
         */
        cdf(x) {
            if (x < 0) {
                return 0;
            }
            let sum = 0;
            const kMax = Math.floor(x);
            for (let k = 0; k <= kMax; k++) {
                sum += this.pdf(k);
            }
            return sum;
        }
        /**
         * Calculates the factorial of a non-negative integer.
         *
         * @description
         * Implements an iterative approach to calculate n! that is more numerically
         * stable than recursive methods.
         *
         * @param n - The number to calculate factorial for
         * @returns The factorial of n
         *
         * @throws {Error} Throws if n is negative
         *
         * @remarks
         * This implementation is optimized for numerical stability rather than
         * performance. For very large n, consider using Stirling's approximation
         * or logarithmic methods.
         *
         * @private
         */
        factorial(n) {
            if (n < 0) {
                throw new Error('Factorial is not defined for negative numbers');
            }
            if (n <= 1) {
                return 1;
            }
            let result = 1;
            for (let i = 2; i <= n; i++) {
                result *= i;
            }
            return result;
        }
        /**
         * Gets the current lambda parameter of the distribution.
         *
         * @returns The current value of lambda
         *
         * @example
         * ```typescript
         * const dist = new PoissonDistribution(3);
         * const currentLambda = dist.getLambda(); // Returns 3
         * ```
         */
        getLambda() {
            return this.lambda;
        }
        /**
         * Updates the lambda parameter of the distribution.
         *
         * @description
         * Allows modification of the distribution's rate parameter after initialization
         *
         * @param lambda - The new rate parameter (must be positive)
         * @throws {Error} Throws if lambda is not positive
         *
         * @example
         * ```typescript
         * const dist = new PoissonDistribution(3);
         * dist.setLambda(5); // Updates to average of 5 events
         * ```
         */
        setLambda(lambda) {
            if (lambda <= 0) {
                throw new Error('Lambda must be positive');
            }
            this.lambda = lambda;
        }
    }

    /**
     * Implements a power law probability distribution with the form p(x) ∝ x^(-α) for x ≥ xmin
     *
     * @description
     * A power law distribution (also known as Pareto distribution) is a probability distribution
     * where the relative probability of observing a value decreases as a power of that value.
     * This implementation provides methods for sampling from the distribution and computing
     * various statistical properties.
     *
     * @summary
     * Power law distributions appear in many natural and social phenomena, including:
     * - Word frequencies in natural languages
     * - City population sizes
     * - Earthquake magnitudes
     * - Income distributions
     *
     * @remarks
     * - The distribution is only defined for α > 1 (to ensure normalizability)
     * - The mean is only defined for α > 2
     * - The variance is only defined for α > 3
     * - Sampling uses inverse transform sampling method
     *
     * @example
     * ```typescript
     * // Create a power law distribution with α=2.5 and xmin=1
     * const dist = new PowerLawDistribution(2.5, 1);
     *
     * // Generate random samples
     * const rng = new NativeRandom();
     * const sample = dist.sample(rng);
     *
     * // Calculate probability density at x=2
     * const density = dist.pdf(2);
     *
     * // Get statistical properties
     * const mean = dist.getMean();
     * const variance = dist.getVariance();
     * ```
     */
    class PowerLawDistribution {
        alpha; // Power law exponent
        xmin; // Minimum value of x
        normalization; // Normalization constant
        /**
         * Creates a new power law distribution instance
         *
         * @description
         * Initializes a power law distribution with given parameters and
         * pre-computes the normalization constant for efficiency
         *
         * @param alpha - The power law exponent determining the shape of the distribution
         * @param xmin - The minimum value where the distribution starts (default: 1)
         *
         * @throws {Error} If alpha ≤ 1 (distribution would not be normalizable)
         * @throws {Error} If xmin ≤ 0 (distribution must be positive)
         *
         * @remarks
         * The normalization constant is computed as C = (α-1)xmin^(α-1)
         */
        constructor(alpha, xmin = 1) {
            if (alpha <= 1) {
                throw new Error('Alpha must be greater than 1 for the distribution to be normalizable');
            }
            if (xmin <= 0) {
                throw new Error('xmin must be positive');
            }
            this.alpha = alpha;
            this.xmin = xmin;
            this.normalization = (alpha - 1) * Math.pow(xmin, alpha - 1);
        }
        /**
         * Generates a random sample from the power law distribution
         *
         * @description
         * Uses inverse transform sampling method to generate random values
         * following the power law distribution
         *
         * @returns A random number following the power law distribution
         *
         * @remarks
         * The inverse CDF formula used is: F^(-1)(u) = xmin * (1-u)^(-1/(alpha-1))
         * where u is a uniform random number between 0 and 1
         *
         * @example
         * ```typescript
         * const dist = new PowerLawDistribution(2.5);
         * const rng = new NativeRandom();
         * const samples = Array(1000).fill(0).map(() => dist.sample(rng));
         * ```
         */
        sample(rng) {
            const u = rng.random();
            return this.xmin * Math.pow(1 - u, -1 / (this.alpha - 1));
        }
        /**
         * Calculates the probability density function at a given point
         *
         * @description
         * Computes p(x) = C * x^(-alpha) where C is the normalization constant
         *
         * @param x - The point at which to evaluate the probability density
         * @returns The probability density at point x
         *
         * @remarks
         * Returns 0 for all x < xmin since the distribution is only defined
         * for x ≥ xmin
         *
         * @example
         * ```typescript
         * const dist = new PowerLawDistribution(2.5);
         * const density = dist.pdf(2); // Get probability density at x=2
         * ```
         */
        pdf(x) {
            if (x < this.xmin) {
                return 0;
            }
            return this.normalization * Math.pow(x, -this.alpha);
        }
        /**
         * Calculates the cumulative distribution function at a given point
         *
         * @description
         * Computes F(x) = P(X ≤ x) = 1 - (x/xmin)^(1-alpha)
         *
         * @param x - The point at which to evaluate the CDF
         * @returns The probability that a random variable is less than or equal to x
         *
         * @remarks
         * Returns 0 for all x < xmin since the distribution is only defined
         * for x ≥ xmin
         *
         * @example
         * ```typescript
         * const dist = new PowerLawDistribution(2.5);
         * const probability = dist.cdf(2); // Get P(X ≤ 2)
         * ```
         */
        cdf(x) {
            if (x < this.xmin) {
                return 0;
            }
            return 1 - Math.pow(x / this.xmin, 1 - this.alpha);
        }
        /**
         * Calculates the expected value (mean) of the distribution
         *
         * @description
         * Computes E[X] = (α-1)xmin/(α-2) for the power law distribution
         *
         * @returns The mean of the distribution
         * @throws {Error} If alpha ≤ 2 (mean is undefined)
         *
         * @remarks
         * The mean only exists for α > 2. For α ≤ 2, the expected value
         * is infinite or undefined.
         *
         * @example
         * ```typescript
         * const dist = new PowerLawDistribution(2.5);
         * const mean = dist.getMean(); // Get expected value
         * ```
         */
        getMean() {
            if (this.alpha <= 2) {
                throw new Error('Mean is undefined for alpha <= 2');
            }
            return (this.alpha - 1) * this.xmin / (this.alpha - 2);
        }
        /**
         * Calculates the variance of the distribution
         *
         * @description
         * Computes Var(X) = xmin²(α-1)/((α-3)(α-2)²) for the power law distribution
         *
         * @returns The variance of the distribution
         * @throws {Error} If alpha ≤ 3 (variance is undefined)
         *
         * @remarks
         * The variance only exists for α > 3. For α ≤ 3, the variance
         * is infinite or undefined.
         *
         * @example
         * ```typescript
         * const dist = new PowerLawDistribution(3.5);
         * const variance = dist.getVariance(); // Get variance
         * ```
         */
        getVariance() {
            if (this.alpha <= 3) {
                throw new Error('Variance is undefined for alpha <= 3');
            }
            const numerator = this.xmin * this.xmin * (this.alpha - 1);
            const denominator = (this.alpha - 3) * (this.alpha - 2) * (this.alpha - 2);
            return numerator / denominator;
        }
    }

    /**
     * Implements the Rice probability distribution, which models the distance to the origin
     * of a two-dimensional vector when its components follow independent Gaussian distributions
     * with different means but equal variances.
     *
     * @description
     * The Rice distribution, also known as the Rician distribution, is commonly used in:
     * - Signal processing for modeling amplitudes of signals with both random and deterministic components
     * - MRI image analysis for modeling magnitude data
     * - Communications theory for modeling signal fading
     *
     * @summary
     * This implementation provides methods for sampling from the distribution and computing
     * its probability density function (PDF) and cumulative distribution function (CDF).
     * It uses efficient numerical methods including series expansions for special functions.
     *
     * @remarks
     * - All numerical computations use series expansions with appropriate convergence criteria
     * - Special functions (Bessel, Marcum Q) are implemented using stable numerical methods
     * - The sampling method uses the Box-Muller transform for generating normal variates
     *
     * @example
     * ```typescript
     * // Create a Rice distribution with ν = 1.5 and σ = 1
     * const rice = new RiceDistribution(1.5, 1);
     *
     * // Generate a random sample
     * const sample = rice.sample();
     *
     * // Compute PDF at x = 2
     * const density = rice.pdf(2);
     *
     * // Compute CDF at x = 2
     * const probability = rice.cdf(2);
     * ```
     */
    class RiceDistribution {
        nu; // Peak parameter (distance)
        sigma; // Scale parameter
        sigma2; // Sigma squared (cached for performance)
        /**
         * Creates a new Rice distribution instance with specified parameters.
         *
         * @param nu - Peak parameter (distance) representing the distance from the origin
         *            to the mean value of the underlying bivariate normal distribution
         * @param sigma - Scale parameter representing the standard deviation of the
         *               underlying normal distributions
         *
         * @throws {Error} If nu is negative or sigma is non-positive
         *
         * @remarks
         * The parameters must satisfy:
         * - nu ≥ 0 (non-negative peak parameter)
         * - sigma > 0 (positive scale parameter)
         *
         * @example
         * ```typescript
         * // Create Rice distribution with ν = 2 and σ = 0.5
         * const rice = new RiceDistribution(2, 0.5);
         * ```
         */
        constructor(nu, sigma) {
            if (nu < 0)
                throw new Error("nu must be >= 0");
            if (sigma <= 0)
                throw new Error("sigma must be > 0");
            this.nu = nu;
            this.sigma = sigma;
            this.sigma2 = sigma * sigma;
        }
        /**
         * Generates a random sample from the Rice distribution.
         *
         * @returns A non-negative random value following the Rice distribution
         *
         * @description
         * Uses the method of transforming Gaussian random variables by:
         * 1. Generating two independent standard normal random variables
         * 2. Scaling them by sigma
         * 3. Adding nu to the first component
         * 4. Computing the magnitude of the resulting vector
         *
         * @remarks
         * The Box-Muller transform is used for generating normal random variables.
         * This method provides exact sampling from the Rice distribution.
         *
         * @example
         * ```typescript
         * const rice = new RiceDistribution(1, 1);
         * const rng = new NativeRandom();
         * const samples = Array.from({length: 1000}, () => rice.sample(rng));
         * ```
         */
        sample(rng) {
            // Generate two independent standard normal random variables
            const u1 = this.normalRandom(rng);
            const u2 = this.normalRandom(rng);
            // Transform to Rice distribution
            const x = this.sigma * u1 + this.nu;
            const y = this.sigma * u2;
            // Return the magnitude
            return Math.sqrt(x * x + y * y);
        }
        /**
         * Calculates the probability density function (PDF) at a given point.
         *
         * @param x - The point at which to evaluate the PDF
         * @returns The value of the PDF at point x
         *
         * @description
         * The Rice PDF is given by:
         * f(x|ν,σ) = (x/σ²)exp(-(x² + ν²)/(2σ²))I₀((xν)/σ²)
         * where I₀ is the modified Bessel function of the first kind, order 0
         *
         * @remarks
         * - Returns 0 for negative inputs
         * - Uses series expansion for computing the modified Bessel function
         * - Optimized to minimize numerical overflow/underflow
         *
         * @example
         * ```typescript
         * const rice = new RiceDistribution(1, 1);
         * const density = rice.pdf(1.5); // Compute density at x = 1.5
         * ```
         */
        pdf(x) {
            if (x < 0)
                return 0;
            const exp1 = -(x * x + this.nu * this.nu) / (2 * this.sigma2);
            const exp2 = (x * this.nu) / this.sigma2;
            return (x / this.sigma2) *
                Math.exp(exp1) *
                this.modifiedBessel0(exp2);
        }
        /**
         * Calculates the cumulative distribution function (CDF) at a given point.
         *
         * @param x - The point at which to evaluate the CDF
         * @returns The probability that a random variable from this distribution is ≤ x
         *
         * @description
         * The Rice CDF is computed using the Marcum Q-function:
         * F(x|ν,σ) = 1 - Q₁(ν/σ, x/σ)
         * where Q₁ is the Marcum Q-function of order 1
         *
         * @remarks
         * - Returns 0 for negative inputs
         * - Uses series expansion for computing the Marcum Q-function
         * - Accuracy may decrease for very large values of ν/σ
         *
         * @example
         * ```typescript
         * const rice = new RiceDistribution(1, 1);
         * const probability = rice.cdf(2); // P(X ≤ 2)
         * ```
         */
        cdf(x) {
            if (x <= 0)
                return 0;
            const q = this.nu / this.sigma;
            const r = x / this.sigma;
            return 1 - this.marcumQ1(q, r);
        }
        /**
         * Generates a standard normal random variable using Box-Muller transform.
         *
         * @returns A random sample from the standard normal distribution
         *
         * @remarks
         * Uses rejection sampling to handle numerical stability near the origin
         *
         * @private
         */
        normalRandom(rng) {
            let u1, u2;
            do {
                u1 = rng.random() * 2 - 1;
                u2 = rng.random() * 2 - 1;
            } while (u1 * u1 + u2 * u2 >= 1);
            const radius = Math.sqrt(-2 * Math.log(u1 * u1 + u2 * u2));
            return radius * u1;
        }
        /**
         * Calculates the modified Bessel function of the first kind, order 0.
         *
         * @param x - The point at which to evaluate the function
         * @returns The value of I₀(x)
         *
         * @remarks
         * Uses series expansion with error-controlled termination
         *
         * @private
         */
        modifiedBessel0(x) {
            let sum = 1;
            let term = 1;
            const maxIterations = 50;
            for (let k = 1; k < maxIterations; k++) {
                term *= (x * x) / (4 * k * k);
                sum += term;
                if (term < 1e-10)
                    break;
            }
            return sum;
        }
        /**
         * Calculates the Marcum Q-function of order 1.
         *
         * @param a - First parameter
         * @param b - Second parameter
         * @returns The value of Q₁(a,b)
         *
         * @remarks
         * Uses series expansion with convergence monitoring
         *
         * @private
         */
        marcumQ1(a, b) {
            if (a === 0)
                return Math.exp(-b * b / 2);
            let sum = 0;
            const maxIterations = 50;
            let term = 1;
            let factorial = 1;
            for (let k = 0; k < maxIterations; k++) {
                if (k > 0) {
                    term *= (a * a) / (2 * k);
                    factorial *= k;
                }
                sum += term * this.incompleteGamma(k + 1, b * b / 2) / factorial;
                if (term < 1e-10)
                    break;
            }
            return sum * Math.exp(-((a * a) + b * b) / 2);
        }
        /**
         * Calculates the incomplete gamma function.
         *
         * @param s - Shape parameter
         * @param x - Upper limit of integration
         * @returns The value of γ(s,x)
         *
         * @remarks
         * Uses series expansion with error monitoring
         *
         * @private
         */
        incompleteGamma(s, x) {
            let sum = 0;
            let term = 1;
            for (let k = 0; k < 50; k++) {
                if (k > 0) {
                    term *= x / (s + k);
                }
                sum += term;
                if (term < 1e-10)
                    break;
            }
            return Math.pow(x, s) * Math.exp(-x) * sum;
        }
    }

    /**
     * Implements a continuous uniform probability distribution over a finite interval [min, max).
     *
     * @description
     * The uniform distribution, also known as a rectangular distribution, is a continuous
     * probability distribution that has constant probability over a specified interval.
     * All intervals of the same length within the distribution's support have the same
     * probability.
     *
     * @summary
     * Provides methods for sampling random values and computing probability metrics
     * for a uniform distribution over a specified range.
     *
     * @example
     * ```typescript
     * // Create a uniform distribution between 0 and 1
     * const dist = new UniformDistribution(0, 1);
     *
     * // Generate a random
     * const rng = new NativeRandom();
     * const randomValue = dist.sample(rng); // Returns number in [0,1)
     *
     * // Calculate probability density at a point
     * const density = dist.pdf(0.5); // Returns 1.0
     *
     * // Calculate cumulative probability
     * const cumProb = dist.cdf(0.7); // Returns 0.7
     * ```
     *
     * @remarks
     * - The implementation uses half-open intervals [min, max) for consistency with
     *   JavaScript's rng.random() behavior
     * - The probability density function (PDF) is constant within the interval
     * - The cumulative distribution function (CDF) grows linearly within the interval
     * - Memory usage is O(1) as only the range bounds are stored
     */
    class UniformDistribution {
        min;
        max;
        range;
        /**
         * Creates a new uniform distribution with specified bounds.
         *
         * @description
         * Initializes a uniform distribution over the interval [min, max).
         * Validates that min is strictly less than max to ensure a valid probability distribution.
         *
         * @param min - The lower bound of the distribution (inclusive)
         * @param max - The upper bound of the distribution (exclusive)
         *
         * @throws {Error} If min is greater than or equal to max
         *
         * @example
         * ```typescript
         * // Create uniform distribution over [1,5)
         * const dist = new UniformDistribution(1, 5);
         * ```
         *
         * @remarks
         * The constructor precomputes the range (max - min) to optimize subsequent
         * calculations of samples and probabilities.
         */
        constructor(min, max) {
            if (min >= max) {
                throw new Error('min must be less than max');
            }
            this.min = min;
            this.max = max;
            this.range = max - min;
        }
        /**
         * Generates a random sample from the distribution.
         *
         * @description
         * Returns a pseudorandom number from the uniform distribution using
         * rng.random() scaled to the distribution's range.
         *
         * @returns A random number between min (inclusive) and max (exclusive)
         *
         * @example
         * ```typescript
         * const dist = new UniformDistribution(10, 20);
         * const sample = dist.sample(); // Returns number in [10,20)
         * ```
         *
         * @remarks
         * The quality of the random samples depends on the underlying
         * rng.random() implementation provided by the JavaScript runtime.
         */
        sample(rng) {
            return this.min + rng.random() * this.range;
        }
        /**
         * Calculates the probability density function (PDF) at a given point.
         *
         * @description
         * Returns the probability density at point x. For a uniform distribution,
         * this is 1/(max-min) within the interval [min,max), and 0 outside it.
         *
         * @param x - The point at which to evaluate the PDF
         * @returns The probability density at x
         *
         * @example
         * ```typescript
         * const dist = new UniformDistribution(0, 2);
         * const density1 = dist.pdf(1);    // Returns 0.5
         * const density2 = dist.pdf(-1);   // Returns 0
         * const density3 = dist.pdf(2.5);  // Returns 0
         * ```
         *
         * @remarks
         * The PDF is discontinuous at the boundaries of the interval.
         * All points within the interval have equal probability density.
         */
        pdf(x) {
            if (x < this.min || x >= this.max) {
                return 0;
            }
            return 1 / this.range;
        }
        /**
         * Calculates the cumulative distribution function (CDF) at a given point.
         *
         * @description
         * Returns the probability that a random value from the distribution is
         * less than or equal to x. For a uniform distribution, this grows
         * linearly from 0 to 1 over the interval [min,max).
         *
         * @param x - The point at which to evaluate the CDF
         * @returns The probability that a random value is less than or equal to x
         *
         * @example
         * ```typescript
         * const dist = new UniformDistribution(0, 4);
         * const prob1 = dist.cdf(-1);  // Returns 0
         * const prob2 = dist.cdf(2);   // Returns 0.5
         * const prob3 = dist.cdf(5);   // Returns 1
         * ```
         *
         * @remarks
         * - Returns 0 for all x < min
         * - Returns 1 for all x ≥ max
         * - Grows linearly between min and max
         */
        cdf(x) {
            if (x < this.min) {
                return 0;
            }
            if (x >= this.max) {
                return 1;
            }
            return (x - this.min) / this.range;
        }
    }

    /**
     * Implementation of the Von Mises distribution, also known as the circular normal distribution.
     * This distribution is the circular analog of the normal distribution for angular data.
     *
     * @description
     * The Von Mises distribution is a continuous probability distribution on a circle. It is the
     * circular analog of the normal distribution and is widely used in directional statistics,
     * particularly for modeling angles, wind directions, and other circular data.
     *
     * @summary
     * Provides methods for sampling from the distribution and computing its probability density
     * function (PDF) and cumulative distribution function (CDF). The implementation uses the
     * acceptance-rejection method for sampling and numerical integration for the CDF.
     *
     * @remarks
     * - The distribution is parameterized by μ (mu, location parameter) and κ (kappa, concentration parameter)
     * - For κ = 0, the distribution reduces to a uniform distribution on the circle
     * - As κ increases, the distribution becomes more concentrated around μ
     * - All angles are handled in radians and normalized to the range [-π, π]
     *
     * @example
     * ```typescript
     * // Create a Von Mises distribution with mean direction π/4 and concentration 2
     * const dist = new VonMises(Math.PI/4, 2);
     *
     * // Generate a random sample
     * const sample = dist.sample();
     *
     * // Calculate PDF at a point
     * const density = dist.pdf(Math.PI/6);
     *
     * // Calculate CDF at a point
     * const cumulative = dist.cdf(Math.PI/3);
     * ```
     */
    class VonMisesDistribution {
        mu; // Location parameter (mean direction)
        kappa; // Concentration parameter
        normalizationConstant;
        /**
         * Creates a new Von Mises distribution with specified parameters.
         *
         * @param mu - Location parameter (mean direction) in radians. Determines the center of the distribution.
         * @param kappa - Concentration parameter (must be >= 0). Controls how concentrated the distribution
         *               is around the mean direction. Larger values indicate stronger concentration.
         *
         * @throws {Error} If kappa is negative
         *
         * @remarks
         * The normalization constant is computed using a polynomial approximation of the modified
         * Bessel function of the first kind, order 0 (I₀).
         *
         * @example
         * ```typescript
         * // Create distribution centered at 0 with concentration 1
         * const defaultDist = new VonMises();
         *
         * // Create distribution centered at π/2 with high concentration
         * const concentratedDist = new VonMises(Math.PI/2, 10);
         * ```
         */
        constructor(mu = 0, kappa = 1) {
            if (kappa < 0) {
                throw new Error('Concentration parameter kappa must be non-negative');
            }
            this.mu = mu;
            this.kappa = kappa;
            this.normalizationConstant = 1 / (2 * Math.PI * this.modifiedBesselI0(kappa));
        }
        /**
         * Generates a random sample from the Von Mises distribution.
         *
         * @returns A random angle in radians from the distribution, normalized to [-π, π]
         *
         * @remarks
         * Uses the acceptance-rejection method based on Best and Fisher's algorithm.
         * For very small concentration parameters (κ < 1e-3), approximates with a uniform distribution.
         *
         * @example
         * ```typescript
         * const dist = new VonMises(Math.PI/4, 2);
         * const rng = new NativeRandom();
         * const samples = Array(1000).fill(0).map(() => dist.sample(rng));
         * ```
         */
        sample(rng) {
            if (this.kappa < 1e-3) {
                return 2 * Math.PI * rng.random() - Math.PI;
            }
            const a = 1 + Math.sqrt(1 + 4 * this.kappa * this.kappa);
            const b = (a - Math.sqrt(2 * a)) / (2 * this.kappa);
            const r = (1 + b * b) / (2 * b);
            while (true) {
                const u1 = rng.random();
                const z = Math.cos(Math.PI * u1);
                const f = (1 + r * z) / (r + z);
                const c = this.kappa * (r - f);
                const u2 = rng.random();
                if (c * (2 - c) - u2 > 0 || Math.log(c / u2) + 1 - c >= 0) {
                    const u3 = rng.random();
                    const theta = Math.acos(f);
                    const result = u3 < 0.5 ? theta : -theta;
                    return this.normalizeAngle(result + this.mu);
                }
            }
        }
        /**
         * Calculates the probability density function (PDF) of the Von Mises distribution.
         *
         * @param x - The point at which to calculate the PDF (in radians)
         * @returns The probability density at point x
         *
         * @remarks
         * The PDF is given by: f(x) = (1/(2πI₀(κ))) * exp(κcos(x-μ))
         * where I₀(κ) is the modified Bessel function of the first kind, order 0
         *
         * @example
         * ```typescript
         * const dist = new VonMises(0, 1);
         * const density = dist.pdf(Math.PI/4); // Density at π/4 radians
         * ```
         */
        pdf(x) {
            const normalizedX = this.normalizeAngle(x - this.mu);
            return this.normalizationConstant * Math.exp(this.kappa * Math.cos(normalizedX));
        }
        /**
         * Calculates the cumulative distribution function (CDF) of the Von Mises distribution.
         *
         * @param x - The point at which to calculate the CDF (in radians)
         * @returns The probability that a random sample is less than or equal to x
         *
         * @remarks
         * - The CDF is computed using numerical integration (trapezoidal rule) as there is no closed form
         * - The accuracy depends on the number of points used in the numerical integration
         * - The current implementation uses 1000 points for the integration
         *
         * @example
         * ```typescript
         * const dist = new VonMises(0, 1);
         * const probability = dist.cdf(Math.PI/2); // P(X ≤ π/2)
         * ```
         */
        cdf(x) {
            const normalizedX = this.normalizeAngle(x - this.mu);
            const numPoints = 1000;
            const dx = normalizedX / numPoints;
            let sum = 0;
            for (let i = 1; i < numPoints; i++) {
                const xi = i * dx;
                sum += this.pdf(xi + this.mu);
            }
            return dx * (0.5 * this.pdf(this.mu) + sum + 0.5 * this.pdf(x));
        }
        /**
         * Calculates the modified Bessel function of the first kind, order 0 (I₀).
         *
         * @param x - The point at which to evaluate the function
         * @returns The value of I₀(x)
         *
         * @remarks
         * Uses polynomial approximation for improved performance:
         * - For |x| < 3.75, uses a power series expansion
         * - For |x| ≥ 3.75, uses a semi-asymptotic expansion
         *
         * @private
         */
        modifiedBesselI0(x) {
            const ax = Math.abs(x);
            if (ax < 3.75) {
                const y = x / 3.75;
                const y2 = y * y;
                return 1 + y2 * (3.5156229 + y2 * (3.0899424 + y2 * (1.2067492
                    + y2 * (0.2659732 + y2 * (0.0360768 + y2 * 0.0045813)))));
            }
            const y = 3.75 / ax;
            return Math.exp(ax) / Math.sqrt(ax) * (0.39894228 + y * (0.01328592
                + y * (0.00225319 + y * (-0.00157565 + y * (0.00916281
                    + y * (-0.02057706 + y * (0.02635537 + y * (-0.01647633
                        + y * 0.00392377))))))));
        }
        /**
         * Normalizes an angle to the range [-π, π].
         *
         * @param x - The angle to normalize (in radians)
         * @returns The normalized angle in the range [-π, π]
         *
         * @remarks
         * Uses modulo arithmetic and adjustments to ensure the result lies in [-π, π]
         *
         * @private
         */
        normalizeAngle(x) {
            x = x % (2 * Math.PI);
            if (x > Math.PI) {
                x -= 2 * Math.PI;
            }
            else if (x < -Math.PI) {
                x += 2 * Math.PI;
            }
            return x;
        }
    }

    /**
     * Implementation of the Weibull probability distribution.
     *
     * @description
     * The Weibull distribution is a continuous probability distribution named after Swedish mathematician
     * Waloddi Weibull. It's commonly used in reliability engineering, failure analysis, and weather forecasting.
     * This implementation provides methods for sampling, probability density calculation (PDF), cumulative
     * distribution (CDF), and statistical moments (mean and variance).
     *
     * @summary
     * Implements the Weibull distribution with shape parameter k and scale parameter λ (lambda).
     * Provides sampling, PDF, CDF, mean, and variance calculations.
     *
     * @remarks
     * - The shape parameter k > 0 determines the shape of the distribution
     * - The scale parameter λ > 0 determines the scale of the distribution
     * - Uses the Lanczos approximation for gamma function calculations
     * - Implements inverse transform sampling for random number generation
     *
     * @example
     * ```typescript
     * // Create a Weibull distribution with shape k=2 (Rayleigh distribution) and scale λ=1
     * const weibull = new WeibullDistribution(2, 1);
     *
     * // Generate a random sample
     * const rng = new NativeRandom();
     * const sample = weibull.sample(rng);
     *
     * // Calculate probability density at x=1
     * const density = weibull.pdf(1);
     *
     * // Calculate cumulative probability at x=1
     * const cumulative = weibull.cdf(1);
     *
     * // Get distribution statistics
     * const expectedValue = weibull.mean();
     * const varianceValue = weibull.variance();
     * ```
     */
    class WeibullDistribution {
        k; // shape parameter
        lambda; // scale parameter
        /**
         * Creates a new Weibull distribution instance.
         *
         * @param shape - The shape parameter (k > 0)
         * @param scale - The scale parameter (λ > 0)
         * @throws {Error} When shape or scale parameters are not positive
         *
         * @example
         * ```typescript
         * // Create a Weibull distribution with k=2 and λ=1
         * const weibull = new WeibullDistribution(2, 1);
         * ```
         */
        constructor(shape, scale) {
            if (shape <= 0 || scale <= 0) {
                throw new Error('Shape and scale parameters must be positive');
            }
            this.k = shape;
            this.lambda = scale;
        }
        /**
         * Generates a random sample from the Weibull distribution.
         *
         * @description
         * Uses the inverse transform sampling method to generate random variates.
         * The method uses the inverse of the CDF applied to a uniform random number.
         *
         * @returns A random number following the Weibull distribution
         *
         * @example
         * ```typescript
         * const weibull = new WeibullDistribution(2, 1);
         * const randomValue = weibull.sample();
         * ```
         */
        sample(rng) {
            const u = rng.random();
            return this.lambda * Math.pow(-Math.log(1 - u), 1 / this.k);
        }
        /**
         * Calculates the probability density function (PDF) at point x.
         *
         * @description
         * The PDF formula for the Weibull distribution is:
         * f(x; k, λ) = (k/λ) * (x/λ)^(k-1) * e^(-(x/λ)^k) for x ≥ 0
         *
         * @param x - The point at which to calculate the density
         * @returns The probability density at point x
         *
         * @example
         * ```typescript
         * const weibull = new WeibullDistribution(2, 1);
         * const density = weibull.pdf(1.5); // Calculate density at x=1.5
         * ```
         */
        pdf(x) {
            if (x < 0)
                return 0;
            const term1 = this.k / this.lambda;
            const term2 = Math.pow(x / this.lambda, this.k - 1);
            const term3 = Math.exp(-Math.pow(x / this.lambda, this.k));
            return term1 * term2 * term3;
        }
        /**
         * Calculates the cumulative distribution function (CDF) at point x.
         *
         * @description
         * The CDF formula for the Weibull distribution is:
         * F(x; k, λ) = 1 - e^(-(x/λ)^k) for x ≥ 0
         *
         * @param x - The point at which to calculate the cumulative probability
         * @returns The cumulative probability at point x
         *
         * @example
         * ```typescript
         * const weibull = new WeibullDistribution(2, 1);
         * const probability = weibull.cdf(1.5); // Calculate P(X ≤ 1.5)
         * ```
         */
        cdf(x) {
            if (x < 0)
                return 0;
            return 1 - Math.exp(-Math.pow(x / this.lambda, this.k));
        }
        /**
         * Calculates the mean (expected value) of the distribution.
         *
         * @description
         * The mean formula for the Weibull distribution is:
         * E[X] = λ * Γ(1 + 1/k)
         * where Γ is the gamma function
         *
         * @returns The mean of the distribution
         *
         * @example
         * ```typescript
         * const weibull = new WeibullDistribution(2, 1);
         * const expectedValue = weibull.mean();
         * ```
         */
        mean() {
            return this.lambda * this.gamma(1 + 1 / this.k);
        }
        /**
         * Calculates the variance of the distribution.
         *
         * @description
         * The variance formula for the Weibull distribution is:
         * Var[X] = λ^2 * [Γ(1 + 2/k) - (Γ(1 + 1/k))^2]
         * where Γ is the gamma function
         *
         * @returns The variance of the distribution
         *
         * @example
         * ```typescript
         * const weibull = new WeibullDistribution(2, 1);
         * const varianceValue = weibull.variance();
         * ```
         */
        variance() {
            const term1 = this.gamma(1 + 2 / this.k);
            const term2 = Math.pow(this.gamma(1 + 1 / this.k), 2);
            return Math.pow(this.lambda, 2) * (term1 - term2);
        }
        /**
         * Approximates the gamma function using the Lanczos approximation.
         *
         * @description
         * Implements the Lanczos approximation algorithm for computing the gamma function.
         * This is a private helper method used in calculating distribution statistics.
         *
         * @param z - The input value for the gamma function
         * @returns The approximated gamma function value
         *
         * @remarks
         * - Uses the reflection formula for z < 0.5
         * - Implements the Lanczos approximation with 8 coefficients
         * - Accuracy is typically sufficient for statistical calculations
         */
        gamma(z) {
            const p = [
                676.5203681218851,
                -1259.1392167224028,
                771.32342877765313,
                -176.61502916214059,
                12.507343278686905,
                -0.13857109526572012,
                9.9843695780195716e-6,
                1.5056327351493116e-7
            ];
            if (z < 0.5) {
                return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));
            }
            z -= 1;
            let x = 0.99999999999980993;
            for (let i = 0; i < p.length; i++) {
                x += p[i] / (z + i + 1);
            }
            const t = z + p.length - 0.5;
            return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
        }
    }

    var index$c = /*#__PURE__*/Object.freeze({
        __proto__: null,
        BetaBinomialDistribution: BetaBinomialDistribution$1,
        BetaDistribution: BetaDistribution,
        DirichletDistribution: DirichletDistribution,
        ExponentialDistribution: ExponentialDistribution,
        GammaDistribution: GammaDistribution,
        HypergeometricDistribution: HypergeometricDistribution$1,
        LevyDistribution: LevyDistribution,
        LogNormalDistribution: LogNormalDistribution,
        LogisticDistribution: LogisticDistribution,
        MaxwellBoltzmannDistribution: MaxwellBoltzmannDistribution,
        NegativeBinomialDistribution: NegativeBinomialDistribution,
        NormalDistribution: NormalDistribution,
        PCGNormalDistribution: PCGNormalDistribution,
        ParetoDistribution: ParetoDistribution,
        PoissonDistribution: PoissonDistribution,
        PowerLawDistribution: PowerLawDistribution,
        RiceDistribution: RiceDistribution,
        UniformDistribution: UniformDistribution,
        VonMisesDistribution: VonMisesDistribution,
        WeibullDistribution: WeibullDistribution
    });

    /**
     * Generic ordinal distribution over an explicit ordered support.
     *
     * This is the "fallback" implementation: any IOrdinalDistribution can be
     * re-expressed as one of these by enumerating its PMF over its support.
     * Tempering of any of the parametric ordinals below returns one of these
     * (since e.g. a tempered Binomial is no longer Binomial in general).
     *
     * The support array is taken to be already in ascending rank order; the
     * constructor does not sort it. This lets you use non-numeric S types
     * (e.g. "low" | "medium" | "high") where the ordering is implicit in the
     * array order.
     */
    class OrdinalDistribution {
        support;
        probs;
        cum;
        index;
        constructor(orderedSupport, weights) {
            if (orderedSupport.length === 0) {
                throw new Error("Ordinal support must be non-empty.");
            }
            const w = weights ?? new Array(orderedSupport.length).fill(1);
            if (w.length !== orderedSupport.length) {
                throw new Error(`Weights length ${w.length} does not match support length ${orderedSupport.length}.`);
            }
            const probs = normalizeProbs(w);
            const idx = new Map();
            for (let i = 0; i < orderedSupport.length; i++) {
                if (idx.has(orderedSupport[i])) {
                    throw new Error(`Duplicate state in ordinal support at index ${i}.`);
                }
                idx.set(orderedSupport[i], i);
            }
            this.support = orderedSupport.slice();
            this.probs = probs;
            this.cum = buildCumulative(probs);
            this.index = idx;
        }
        sample(rng) {
            return this.support[sampleIndex(this.cum, rng)];
        }
        pmf(state) {
            const i = this.index.get(state);
            return i === undefined ? 0 : this.probs[i];
        }
        cdf(state) {
            const i = this.index.get(state);
            if (i === undefined) {
                throw new Error("cdf() called on a state not in support.");
            }
            return this.cum[i];
        }
        quantile(p) {
            if (!Number.isFinite(p) || p < 0 || p > 1) {
                throw new Error(`quantile argument must be in [0, 1], got ${p}`);
            }
            // p = 0 should return the lowest-rank state with nonzero mass;
            // searchCumulative with target 0 returns index 0, which is correct
            // unless probs[0] = 0. Adjust by skipping leading zero-mass states.
            if (p === 0) {
                for (let i = 0; i < this.probs.length; i++) {
                    if (this.probs[i] > 0)
                        return this.support[i];
                }
            }
            return this.support[searchCumulative(this.cum, p)];
        }
        withTemperature(temperature) {
            const tempered = applyTemperature(this.probs, temperature);
            return new OrdinalDistribution(this.support, tempered);
        }
        entropy() {
            return shannonEntropyBits(this.probs);
        }
        probabilities() {
            return this.probs.slice();
        }
    }
    // ---------------------------------------------------------------------------
    // Helper: enumerate a parametric ordinal's PMF into a generic OrdinalDistribution.
    // Used by withTemperature on all parametric ordinals below.
    // ---------------------------------------------------------------------------
    function temperedAsGeneric(support, pmfValues, temperature) {
        const tempered = applyTemperature(pmfValues, temperature);
        return new OrdinalDistribution(support, tempered);
    }
    // ---------------------------------------------------------------------------
    // Binomial(n, p) over {0, 1, ..., n}.
    // ---------------------------------------------------------------------------
    class BinomialDistribution {
        n;
        p;
        support;
        probs;
        cum;
        constructor(n, p) {
            if (!Number.isInteger(n) || n < 0) {
                throw new Error(`Binomial n must be a non-negative integer, got ${n}`);
            }
            if (!Number.isFinite(p) || p < 0 || p > 1) {
                throw new Error(`Binomial p must be in [0, 1], got ${p}`);
            }
            this.n = n;
            this.p = p;
            const support = new Array(n + 1);
            const probs = new Array(n + 1);
            if (p === 0) {
                for (let k = 0; k <= n; k++) {
                    support[k] = k;
                    probs[k] = k === 0 ? 1 : 0;
                }
            }
            else if (p === 1) {
                for (let k = 0; k <= n; k++) {
                    support[k] = k;
                    probs[k] = k === n ? 1 : 0;
                }
            }
            else {
                const logP = Math.log(p);
                const log1mP = Math.log1p(-p);
                for (let k = 0; k <= n; k++) {
                    support[k] = k;
                    const logPmf = logBinomCoeff(n, k) + k * logP + (n - k) * log1mP;
                    probs[k] = Math.exp(logPmf);
                }
            }
            this.support = support;
            this.probs = probs;
            this.cum = buildCumulative(probs);
        }
        sample(rng) {
            return sampleIndex(this.cum, rng);
        }
        pmf(k) {
            if (!Number.isInteger(k) || k < 0 || k > this.n)
                return 0;
            return this.probs[k];
        }
        cdf(k) {
            if (!Number.isInteger(k)) {
                throw new Error("cdf() requires an integer state for Binomial.");
            }
            if (k < 0)
                return 0;
            if (k >= this.n)
                return 1;
            return this.cum[k];
        }
        quantile(p) {
            if (!Number.isFinite(p) || p < 0 || p > 1) {
                throw new Error(`quantile argument must be in [0, 1], got ${p}`);
            }
            if (p === 0)
                return 0;
            return searchCumulative(this.cum, p);
        }
        withTemperature(temperature) {
            return temperedAsGeneric(this.support, this.probs, temperature);
        }
        entropy() {
            return shannonEntropyBits(this.probs);
        }
    }
    // ---------------------------------------------------------------------------
    // Hypergeometric(N, K, n) over {max(0, n+K-N), ..., min(n, K)}.
    // Convention: N = population size, K = number of successes in population,
    // n = number of draws (without replacement). PMF on k successes drawn.
    //
    // For simplicity the support array spans 0..min(n, K); states outside the
    // theoretical support have PMF 0 (handled naturally).
    // ---------------------------------------------------------------------------
    class HypergeometricDistribution {
        N;
        K;
        n;
        support;
        probs;
        cum;
        kMin;
        constructor(N, K, n) {
            if (!Number.isInteger(N) || N < 0) {
                throw new Error(`Hypergeometric N must be a non-negative integer, got ${N}`);
            }
            if (!Number.isInteger(K) || K < 0 || K > N) {
                throw new Error(`Hypergeometric K must be an integer in [0, N], got ${K}`);
            }
            if (!Number.isInteger(n) || n < 0 || n > N) {
                throw new Error(`Hypergeometric n must be an integer in [0, N], got ${n}`);
            }
            this.N = N;
            this.K = K;
            this.n = n;
            const kMin = Math.max(0, n + K - N);
            const kMax = Math.min(n, K);
            this.kMin = kMin;
            const size = kMax - kMin + 1;
            const support = new Array(size);
            const probs = new Array(size);
            const logDen = logBinomCoeff(N, n);
            for (let i = 0; i < size; i++) {
                const k = kMin + i;
                support[i] = k;
                const logNum = logBinomCoeff(K, k) + logBinomCoeff(N - K, n - k);
                probs[i] = Math.exp(logNum - logDen);
            }
            // Renormalize defensively against floating-point drift.
            const normalized = normalizeProbs(probs);
            this.support = support;
            this.probs = normalized;
            this.cum = buildCumulative(normalized);
        }
        sample(rng) {
            return this.support[sampleIndex(this.cum, rng)];
        }
        pmf(k) {
            if (!Number.isInteger(k))
                return 0;
            const i = k - this.kMin;
            if (i < 0 || i >= this.probs.length)
                return 0;
            return this.probs[i];
        }
        cdf(k) {
            if (!Number.isInteger(k)) {
                throw new Error("cdf() requires an integer state for Hypergeometric.");
            }
            if (k < this.kMin)
                return 0;
            const i = k - this.kMin;
            if (i >= this.cum.length)
                return 1;
            return this.cum[i];
        }
        quantile(p) {
            if (!Number.isFinite(p) || p < 0 || p > 1) {
                throw new Error(`quantile argument must be in [0, 1], got ${p}`);
            }
            if (p === 0)
                return this.support[0];
            return this.support[searchCumulative(this.cum, p)];
        }
        withTemperature(temperature) {
            return temperedAsGeneric(this.support, this.probs, temperature);
        }
        entropy() {
            return shannonEntropyBits(this.probs);
        }
    }
    // ---------------------------------------------------------------------------
    // Beta-binomial(n, alpha, beta) over {0, 1, ..., n}.
    // PMF: C(n, k) * B(k + alpha, n - k + beta) / B(alpha, beta).
    // ---------------------------------------------------------------------------
    class BetaBinomialDistribution {
        n;
        alpha;
        beta;
        support;
        probs;
        cum;
        constructor(n, alpha, beta) {
            if (!Number.isInteger(n) || n < 0) {
                throw new Error(`BetaBinomial n must be a non-negative integer, got ${n}`);
            }
            if (!Number.isFinite(alpha) || alpha <= 0) {
                throw new Error(`BetaBinomial alpha must be a positive finite number, got ${alpha}`);
            }
            if (!Number.isFinite(beta) || beta <= 0) {
                throw new Error(`BetaBinomial beta must be a positive finite number, got ${beta}`);
            }
            this.n = n;
            this.alpha = alpha;
            this.beta = beta;
            const support = new Array(n + 1);
            const probs = new Array(n + 1);
            const logDen = logBeta(alpha, beta);
            for (let k = 0; k <= n; k++) {
                support[k] = k;
                const logPmf = logBinomCoeff(n, k) +
                    logBeta(k + alpha, n - k + beta) -
                    logDen;
                probs[k] = Math.exp(logPmf);
            }
            const normalized = normalizeProbs(probs);
            this.support = support;
            this.probs = normalized;
            this.cum = buildCumulative(normalized);
        }
        sample(rng) {
            return sampleIndex(this.cum, rng);
        }
        pmf(k) {
            if (!Number.isInteger(k) || k < 0 || k > this.n)
                return 0;
            return this.probs[k];
        }
        cdf(k) {
            if (!Number.isInteger(k)) {
                throw new Error("cdf() requires an integer state for BetaBinomial.");
            }
            if (k < 0)
                return 0;
            if (k >= this.n)
                return 1;
            return this.cum[k];
        }
        quantile(p) {
            if (!Number.isFinite(p) || p < 0 || p > 1) {
                throw new Error(`quantile argument must be in [0, 1], got ${p}`);
            }
            if (p === 0)
                return 0;
            return searchCumulative(this.cum, p);
        }
        withTemperature(temperature) {
            return temperedAsGeneric(this.support, this.probs, temperature);
        }
        entropy() {
            return shannonEntropyBits(this.probs);
        }
    }
    function linkInverse(z, link) {
        switch (link) {
            case "logit":
                return 1 / (1 + Math.exp(-z));
            case "probit":
                return standardNormalCdf(z);
            case "cloglog":
                return 1 - Math.exp(-Math.exp(z));
        }
    }
    /**
     * Φ(z) for the standard normal, via the error function.
     * Abramowitz & Stegun 7.1.26 with sign handling -- accurate to ~1.5e-7.
     * Sufficient for category-probability construction.
     */
    function standardNormalCdf(z) {
        return 0.5 * (1 + erf(z / Math.SQRT2));
    }
    function erf(x) {
        const sign = x < 0 ? -1 : 1;
        const ax = Math.abs(x);
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;
        const t = 1 / (1 + p * ax);
        const y = 1 -
            ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
        return sign * y;
    }
    class CumulativeLinkDistribution {
        support;
        link;
        thresholds;
        eta;
        probs;
        cum;
        index;
        /**
         * @param orderedSupport  K category labels in ascending rank order.
         * @param thresholds      K-1 cutpoints, strictly increasing.
         * @param eta             Linear predictor (default 0). Higher eta shifts
         *                        mass toward higher categories.
         * @param link            Inverse link function (default "logit").
         */
        constructor(orderedSupport, thresholds, eta = 0, link = "logit") {
            const K = orderedSupport.length;
            if (K < 2) {
                throw new Error("CumulativeLink requires at least 2 categories.");
            }
            if (thresholds.length !== K - 1) {
                throw new Error(`Expected ${K - 1} thresholds for ${K} categories, got ${thresholds.length}.`);
            }
            for (let i = 1; i < thresholds.length; i++) {
                if (!(thresholds[i] > thresholds[i - 1])) {
                    throw new Error("Thresholds must be strictly increasing.");
                }
            }
            if (!Number.isFinite(eta)) {
                throw new Error(`eta must be finite, got ${eta}`);
            }
            // F_k = link^{-1}(threshold_k - eta), for k = 1..K-1.
            // Category probs: p_1 = F_1; p_k = F_k - F_{k-1}; p_K = 1 - F_{K-1}.
            const F = thresholds.map(c => linkInverse(c - eta, link));
            const probs = new Array(K);
            probs[0] = F[0];
            for (let k = 1; k < K - 1; k++)
                probs[k] = F[k] - F[k - 1];
            probs[K - 1] = 1 - F[K - 2];
            // Clamp tiny negative values from floating-point and renormalize.
            for (let i = 0; i < probs.length; i++) {
                if (probs[i] < 0 && probs[i] > -1e-12)
                    probs[i] = 0;
            }
            const normalized = normalizeProbs(probs);
            const idx = new Map();
            for (let i = 0; i < orderedSupport.length; i++) {
                if (idx.has(orderedSupport[i])) {
                    throw new Error(`Duplicate state in support at index ${i}.`);
                }
                idx.set(orderedSupport[i], i);
            }
            this.support = orderedSupport.slice();
            this.thresholds = thresholds.slice();
            this.eta = eta;
            this.link = link;
            this.probs = normalized;
            this.cum = buildCumulative(normalized);
            this.index = idx;
        }
        sample(rng) {
            return this.support[sampleIndex(this.cum, rng)];
        }
        pmf(state) {
            const i = this.index.get(state);
            return i === undefined ? 0 : this.probs[i];
        }
        cdf(state) {
            const i = this.index.get(state);
            if (i === undefined) {
                throw new Error("cdf() called on a state not in support.");
            }
            return this.cum[i];
        }
        quantile(p) {
            if (!Number.isFinite(p) || p < 0 || p > 1) {
                throw new Error(`quantile argument must be in [0, 1], got ${p}`);
            }
            if (p === 0) {
                for (let i = 0; i < this.probs.length; i++) {
                    if (this.probs[i] > 0)
                        return this.support[i];
                }
            }
            return this.support[searchCumulative(this.cum, p)];
        }
        withTemperature(temperature) {
            return temperedAsGeneric(this.support, this.probs, temperature);
        }
        entropy() {
            return shannonEntropyBits(this.probs);
        }
    }

    var ordinal = /*#__PURE__*/Object.freeze({
        __proto__: null,
        BetaBinomialDistribution: BetaBinomialDistribution,
        BinomialDistribution: BinomialDistribution,
        CumulativeLinkDistribution: CumulativeLinkDistribution,
        HypergeometricDistribution: HypergeometricDistribution,
        OrdinalDistribution: OrdinalDistribution
    });

    var index$b = /*#__PURE__*/Object.freeze({
        __proto__: null,
        categorical: categorical,
        continuous: index$c,
        ordinal: ordinal
    });

    class BaseRandom {
        /**
         * Generates a random number between 0 (inclusive) and 1 (exclusive).
         * Uses crypto.getRandomValues when available for cryptographic security,
         * falls back to xoshiro128** algorithm otherwise.
         *
         * @returns A floating-point number between 0 (inclusive) and 1 (exclusive)
         */
        random() {
            throw Error('random method has not been implemented');
        }
        /**
         * Generates a random integer between min (inclusive) and max (exclusive).
         *
         * @param min - The lower bound (inclusive)
         * @param max - The upper bound (exclusive)
         * @returns A random integer in the specified range
         * @throws {Error} If min or max are not integers, or if max <= min
         */
        randInt(min, max) {
            if (!Number.isInteger(min) || !Number.isInteger(max)) {
                throw new Error('randInt requires integer arguments');
            }
            if (max <= min) {
                throw new Error('max must be greater than min');
            }
            const range = max - min;
            const value = Math.floor(this.random() * range);
            return min + value;
        }
        /**
         * Generates a random floating-point number between min (inclusive) and max (exclusive).
         *
         * @param min - The lower bound (inclusive)
         * @param max - The upper bound (exclusive)
         * @returns A random float in the specified range
         * @throws {Error} If max <= min
         */
        randFloat(min, max) {
            if (max <= min) {
                throw new Error('max must be greater than min');
            }
            const range = max - min;
            return min + (this.random() * range);
        }
        /**
         * Generates a random boolean value with the specified probability of being true.
         *
         * @param probability - The probability of returning true (default: 0.5)
         * @returns A random boolean value
         * @throws {Error} If probability is not between 0 and 1
         */
        randBool(probability = 0.5) {
            if (probability < 0 || probability > 1) {
                throw new Error('probability must be between 0 and 1');
            }
            return this.random() < probability;
        }
        /**
         * Randomly selects a single element from the given array.
         *
         * @template T - The type of elements in the array
         * @param array - The array to choose from
         * @param weights - Optional array of weights corresponding to each element
         * @returns A randomly selected element from the array
         * @throws {Error} If the array is empty
         */
        choice(array, weights) {
            if (array.length === 0) {
                throw new Error('Cannot choose from an empty array');
            }
            if (weights) {
                return this.weightedChoice(array, weights);
            }
            const index = this.randInt(0, array.length);
            return array[index];
        }
        weightedChoice(array, weights) {
            if (weights.length !== array.length) {
                throw new Error('Weights array must have the same length as the input array');
            }
            if (weights.some(w => w < 0)) {
                throw new Error('Weights must be non-negative');
            }
            // Calculate cumulative weights
            const cumWeights = [];
            let sum = 0;
            for (const weight of weights) {
                sum += weight;
                cumWeights.push(sum);
            }
            if (sum === 0) {
                throw new Error('Sum of weights must be positive');
            }
            // Generate random value between 0 and total weight sum
            const rand = this.random() * sum;
            // Binary search to find the selected index
            let left = 0;
            let right = cumWeights.length - 1;
            while (left < right) {
                const mid = Math.floor((left + right) / 2);
                if (cumWeights[mid] < rand) {
                    left = mid + 1;
                }
                else {
                    right = mid;
                }
            }
            return array[left];
        }
        /**
         * Randomly selects multiple elements from the given array.
         *
         * @template T - The type of elements in the array
         * @param array - The array to choose from
         * @param count - The number of elements to select
         * @param allowRepetition - Whether to allow the same element to be selected multiple times (default: true)
         * @param weights - Optional array of weights corresponding to each element
         * @returns An array of randomly selected elements
         * @throws {Error} If the array is empty, count is negative, or if requesting more items than available without repetition
         */
        choices(array, count, allowRepetition = true, weights) {
            if (array.length === 0) {
                throw new Error('Cannot choose from an empty array');
            }
            if (count < 0) {
                throw new Error('Count must be non-negative');
            }
            if (!allowRepetition && count > array.length) {
                throw new Error('Cannot choose more items than available without repetition');
            }
            if (weights && weights.length !== array.length) {
                throw new Error('Weights array must have the same length as the input array');
            }
            if (allowRepetition) {
                return Array.from({ length: count }, () => this.choice(array, weights));
            }
            else {
                if (weights) {
                    // For selection without repetition with weights, we need a special approach
                    const result = [];
                    const remainingIndices = Array.from({ length: array.length }, (_, i) => i);
                    const remainingWeights = [...(weights || [])];
                    for (let i = 0; i < count; i++) {
                        // Choose an index based on remaining weights
                        const selectedIdx = this.choice(remainingIndices, remainingWeights);
                        result.push(array[selectedIdx]);
                        // Remove the selected index and weight
                        const indexToRemove = remainingIndices.indexOf(selectedIdx);
                        remainingIndices.splice(indexToRemove, 1);
                        remainingWeights.splice(indexToRemove, 1);
                    }
                    return result;
                }
                const shuffled = this.shuffle([...array]);
                return shuffled.slice(0, count);
            }
        }
        /**
         * Randomly shuffles the elements of an array using the Fisher-Yates algorithm.
         * Modifies the array in place and returns it.
         *
         * @template T - The type of elements in the array
         * @param array - The array to shuffle
         * @returns The shuffled array (same reference as input)
         */
        shuffle(array) {
            // Fisher-Yates shuffle algorithm
            for (let i = array.length - 1; i > 0; i--) {
                const j = this.randInt(0, i + 1);
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
    }

    /**
     * Implementation of a N-dimensional Linear Congruential Generator (LCG) for pseudo-random number generation.
     *
     * The LCG uses the recurrence relation:
     * X_(n+1) = (a * X_n + c) mod m
     *
     * Where:
     * - a is the multiplier
     * - c is the increment
     * - m is the modulus
     * - X_n is the current state
     *
     * This implementation uses 64-bit integers for high-quality random number generation with
     * a long period of 2^64.
     *
     * @implements {IRandom}
     */
    class LCGRandom extends BaseRandom {
        state;
        _seed;
        a = 6364136223846793005n;
        c = 1442695040888963407n;
        MASK64 = 0xffffffffffffffffn;
        constructor(seed = Date.now()) {
            super();
            this._seed = seed;
            this.state = BigInt(seed);
        }
        get seed() { return this._seed; }
        setSeed(seed) {
            this._seed = seed;
            this.state = BigInt(seed);
        }
        random() {
            this.state = (this.a * this.state + this.c) & this.MASK64;
            // Take top 53 bits for uniform double coverage
            return Number(this.state >> 11n) / 0x20000000000000;
        }
    }

    /**
     * Implementation of the Mersenne Twister pseudo-random number generator (MT19937).
     *
     * The Mersenne Twister is a pseudo-random number generator (PRNG) that generates
     * high-quality pseudo-random integers with a very long period of 2^19937 - 1.
     * This implementation follows the MT19937 variant, which is the most widely used
     * version of the algorithm.
     *
     * @implements {IRandom}
     * @see {@link http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html} Original implementation
     */
    class MersenneTwister extends BaseRandom {
        /** Period parameter N (degree of recurrence) */
        static N = 624;
        /** Period parameter M (middle word offset) */
        static M = 397;
        /** Constant vector a for twist matrix */
        static MATRIX_A = 0x9908b0df;
        /** Most significant w-r bits mask */
        static UPPER_MASK = 0x80000000;
        /** Least significant r bits mask */
        static LOWER_MASK = 0x7fffffff;
        /** State vector array storing the internal state of the generator */
        mt;
        /** Current index in the state vector array */
        mti;
        /** Current seed value */
        _seed;
        /**
         * Creates a new instance of the Mersenne Twister PRNG.
         *
         * @param seed - Initial seed value for the generator. Defaults to current timestamp.
         */
        constructor(seed = Date.now()) {
            super();
            this.mt = new Array(MersenneTwister.N);
            this.mti = 0;
            this._seed = seed;
            this.setSeed(seed);
        }
        /**
         * Gets the current seed value used by the generator.
         *
         * @returns The current seed value.
         */
        get seed() {
            return this._seed;
        }
        /**
         * Initializes the generator with a new seed value.
         *
         * @param seed - The new seed value to initialize the generator with.
         */
        setSeed(seed) {
            this._seed = seed >>> 0; // Convert to unsigned 32-bit
            this.mt[0] = this._seed;
            for (this.mti = 1; this.mti < MersenneTwister.N; this.mti++) {
                const s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
                this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) +
                    (s & 0x0000ffff) * 1812433253) + this.mti;
                this.mt[this.mti] >>>= 0;
            }
            this.mti = MersenneTwister.N; // Initialize to N for first random() call
        }
        /**
         * Generates a random 32-bit integer using the Mersenne Twister algorithm.
         *
         * @private
         * @returns A random 32-bit unsigned integer.
         */
        int32() {
            let y;
            const mag01 = [0x0, MersenneTwister.MATRIX_A];
            // Generate N words at a time
            if (this.mti >= MersenneTwister.N) {
                let kk;
                // If setSeed() has not been called, initialize with default seed
                if (this.mti === MersenneTwister.N + 1) {
                    this.setSeed(5489);
                }
                for (kk = 0; kk < MersenneTwister.N - MersenneTwister.M; kk++) {
                    y = (this.mt[kk] & MersenneTwister.UPPER_MASK) |
                        (this.mt[kk + 1] & MersenneTwister.LOWER_MASK);
                    this.mt[kk] = this.mt[kk + MersenneTwister.M] ^ (y >>> 1) ^ mag01[y & 0x1];
                }
                for (; kk < MersenneTwister.N - 1; kk++) {
                    y = (this.mt[kk] & MersenneTwister.UPPER_MASK) |
                        (this.mt[kk + 1] & MersenneTwister.LOWER_MASK);
                    this.mt[kk] = this.mt[kk + (MersenneTwister.M - MersenneTwister.N)] ^
                        (y >>> 1) ^ mag01[y & 0x1];
                }
                y = (this.mt[MersenneTwister.N - 1] & MersenneTwister.UPPER_MASK) |
                    (this.mt[0] & MersenneTwister.LOWER_MASK);
                this.mt[MersenneTwister.N - 1] = this.mt[MersenneTwister.M - 1] ^
                    (y >>> 1) ^ mag01[y & 0x1];
                this.mti = 0;
            }
            y = this.mt[this.mti++];
            // Tempering transformation
            y ^= (y >>> 11);
            y ^= (y << 7) & 0x9d2c5680;
            y ^= (y << 15) & 0xefc60000;
            y ^= (y >>> 18);
            return y >>> 0; // Convert to unsigned 32-bit
        }
        /**
         * Generates a random floating-point number in the range [0, 1).
         *
         * @returns A random number between 0 (inclusive) and 1 (exclusive).
         */
        random() {
            return this.int32() * (1.0 / 4294967296.0); // Divide by 2^32
        }
    }

    /**
     * Mulberry32 — small, fast, well-distributed 32-bit seeded PRNG. We only
     * need it to shuffle small arrays and produce reproducible streams, so
     * cryptographic strength is irrelevant; reproducibility from a 32-bit
     * seed is what matters.
     *
     * This class is a full {@link IRandom} implementation built on top of the
     * Mulberry32 core. The underlying generator state is a single 32-bit
     * integer, which makes seeding cheap and the stream perfectly
     * reproducible across runs and platforms.
     */
    class Mulberry32 {
        /**
         * Internal 32-bit state. We keep it as a regular number and coerce
         * back to int32 with `| 0` after each step to stay in the same
         * numeric domain the original Mulberry32 reference uses.
         */
        state;
        /** The seed last passed to the constructor or {@link setSeed}. */
        _seed;
        constructor(seed = (Date.now() ^ (Math.random() * 0x100000000)) | 0) {
            this._seed = seed | 0;
            // Nudge the seed off zero so seed=0 doesn't yield a degenerate stream.
            this.state = this._seed ^ 0x9e3779b9;
        }
        get seed() {
            return this._seed;
        }
        setSeed(seed) {
            this._seed = seed | 0;
            this.state = this._seed ^ 0x9e3779b9;
        }
        // ---- IRandomCore -------------------------------------------------------
        /**
         * Core Mulberry32 step. Returns a float in [0, 1).
         *
         * Implementation note: this is inlined rather than delegated to a
         * closure (as in the original snippet) so the state lives on `this`
         * and {@link setSeed} can reset it cleanly.
         */
        random() {
            this.state = (this.state + 0x6d2b79f5) | 0;
            let t = this.state;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }
        // ---- IRandomRange ------------------------------------------------------
        /**
         * Random integer in [min, max). Uses Math.floor on a scaled draw,
         * which is unbiased given that {@link random} returns a uniform
         * float in [0, 1).
         */
        randInt(min, max) {
            if (max <= min) {
                throw new RangeError(`randInt: max (${max}) must be greater than min (${min})`);
            }
            const lo = Math.ceil(min);
            const hi = Math.floor(max);
            return lo + Math.floor(this.random() * (hi - lo));
        }
        randFloat(min, max) {
            if (max <= min) {
                throw new RangeError(`randFloat: max (${max}) must be greater than min (${min})`);
            }
            return min + this.random() * (max - min);
        }
        // ---- IRandomBoolean ----------------------------------------------------
        /**
         * Random boolean. `probability` is the chance of returning `true`,
         * defaulting to 0.5 for a fair coin. Values outside [0, 1] are
         * clamped so callers get the obvious behavior (always-true /
         * always-false) instead of a silently broken distribution.
         */
        randBool(probability = 0.5) {
            if (probability <= 0)
                return false;
            if (probability >= 1)
                return true;
            return this.random() < probability;
        }
        // ---- IRandomArray ------------------------------------------------------
        choice(array, weights) {
            if (array.length === 0) {
                throw new RangeError("choice: cannot pick from an empty array");
            }
            if (weights === undefined) {
                return array[this.randInt(0, array.length)];
            }
            if (weights.length !== array.length) {
                throw new RangeError(`choice: weights.length (${weights.length}) must equal array.length (${array.length})`);
            }
            return array[this.weightedIndex(weights)];
        }
        /**
         * Choose `count` items from `array`.
         *
         * - With repetition (default): each pick is independent. O(count).
         * - Without repetition: uses a partial Fisher–Yates over a copy of
         *   indices so we never pick the same slot twice. O(array.length).
         *   Weights without repetition use the standard "draw, remove,
         *   renormalize" approach.
         */
        choices(array, count, allowRepetition = true, weights) {
            if (count < 0 || !Number.isFinite(count)) {
                throw new RangeError(`choices: count (${count}) must be a non-negative finite number`);
            }
            if (weights !== undefined && weights.length !== array.length) {
                throw new RangeError(`choices: weights.length (${weights.length}) must equal array.length (${array.length})`);
            }
            if (allowRepetition) {
                const out = new Array(count);
                for (let i = 0; i < count; i++) {
                    out[i] = this.choice(array, weights);
                }
                return out;
            }
            if (count > array.length) {
                throw new RangeError(`choices: cannot pick ${count} unique items from an array of length ${array.length}`);
            }
            if (weights === undefined) {
                // Partial Fisher–Yates on an index buffer. Avoids mutating
                // the caller's array and avoids allocating per-pick.
                const indices = Array.from({ length: array.length }, (_, i) => i);
                const out = new Array(count);
                for (let i = 0; i < count; i++) {
                    const j = this.randInt(i, indices.length);
                    const tmp = indices[i];
                    indices[i] = indices[j];
                    indices[j] = tmp;
                    out[i] = array[indices[i]];
                }
                return out;
            }
            // Weighted, no repetition: copy weights, zero out as we pick.
            const w = weights.slice();
            const out = new Array(count);
            for (let i = 0; i < count; i++) {
                const idx = this.weightedIndex(w);
                out[i] = array[idx];
                w[idx] = 0;
            }
            return out;
        }
        /**
         * Fisher–Yates shuffle in place. Returns the same array for
         * chaining convenience.
         */
        shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = this.randInt(0, i + 1);
                const tmp = array[i];
                array[i] = array[j];
                array[j] = tmp;
            }
            return array;
        }
        // ---- internals ---------------------------------------------------------
        /**
         * Sample an index from a weight array proportional to each weight.
         * Negative or non-finite weights are treated as zero. Throws if the
         * total weight is zero (no valid choice exists).
         */
        weightedIndex(weights) {
            let total = 0;
            for (let i = 0; i < weights.length; i++) {
                const wi = weights[i];
                if (Number.isFinite(wi) && wi > 0)
                    total += wi;
            }
            if (total <= 0) {
                throw new RangeError("weightedIndex: total weight must be positive");
            }
            let r = this.random() * total;
            for (let i = 0; i < weights.length; i++) {
                const wi = weights[i];
                if (!Number.isFinite(wi) || wi <= 0)
                    continue;
                r -= wi;
                if (r < 0)
                    return i;
            }
            // Floating-point slop fallback: return last index with positive weight.
            for (let i = weights.length - 1; i >= 0; i--) {
                if (Number.isFinite(weights[i]) && weights[i] > 0)
                    return i;
            }
            // Unreachable given the total > 0 check above.
            throw new RangeError("weightedIndex: no positive weight found");
        }
    }

    /**
     * A native implementation of the random number generator interface using JavaScript's
     * built-in Math.random() function.
     *
     * @remarks
     * This implementation provides a wrapper around JavaScript's native Math.random()
     * functionality. While it implements the IRandom interface and includes seed-related
     * methods, it's important to note that the underlying Math.random() cannot actually
     * be seeded. The seed value is stored only for interface compliance.
     *
     * @implements {IRandom}
     */
    class NativeRandom extends BaseRandom {
        /** @private The stored seed value (note: does not affect Math.random()) */
        _seed;
        /**
         * Creates a new instance of the Native random number generator.
         *
         * @param seed - Optional seed value. If not provided, current timestamp is used.
         * @remarks While the seed is stored, it does not affect the random number generation
         * as Math.random() cannot be seeded.
         */
        constructor(seed) {
            super();
            this._seed = seed ?? Date.now();
        }
        /**
         * Gets the current seed value.
         *
         * @returns The current seed value
         * @remarks This is stored for interface compliance but does not affect
         * the random number generation.
         */
        get seed() {
            return this._seed;
        }
        /**
         * Sets a new seed value.
         *
         * @param seed - The new seed value to set
         * @remarks This method is provided for interface compliance but does not affect
         * the random number generation as Math.random() cannot be seeded.
         */
        setSeed(seed) {
            this._seed = seed;
        }
        /**
         * Generates a random number between 0 (inclusive) and 1 (exclusive).
         *
         * @returns A pseudo-random decimal number in [0, 1)
         * @remarks This is a direct wrapper around Math.random()
         */
        random() {
            return Math.random();
        }
    }

    /**
     * Implementation of PCG (Permuted Congruential Generator), a family of simple fast
     * space-efficient statistically good algorithms for random number generation.
     * Based on the PCG-Random paper by Melissa O'Neill.
     *
     * @remarks
     * PCG generators are based on a simple pattern that yields high-quality random bits:
     * - Use a linear congruential generator (LCG) as a state-transition function
     * - Use an output function (based on state) that permutes/transforms the output to achieve better statistical properties
     *
     * This implementation specifically uses the PCG-XSH-RR variant which:
     * - Uses an LCG with 64-bit state
     * - Applies xorshift high and random rotation operations for the output function
     *
     * @see {@link http://www.pcg-random.org/} For more information about PCG random number generation
     */
    class PCGRandom extends BaseRandom {
        state;
        _seed;
        inc = 0xda3e39cb94b95bdbn;
        MULT = 0x5851f42d4c957f2dn;
        MASK64 = 0xffffffffffffffffn;
        constructor(seed = Date.now()) {
            super();
            this._seed = seed;
            this.state = 0n;
            this.setSeed(seed);
        }
        get seed() { return this._seed; }
        setSeed(seed) {
            this._seed = seed;
            this.state = 0n;
            this._next();
            this.state = (this.state + BigInt(seed)) & this.MASK64;
            this._next();
        }
        _next() {
            const oldState = this.state;
            this.state = (oldState * this.MULT + this.inc) & this.MASK64;
            const xorShifted = Number((((oldState >> 18n) ^ oldState) >> 27n) & 0xffffffffn) >>> 0;
            const rot = Number(oldState >> 59n) & 31;
            return ((xorShifted >>> rot) | (xorShifted << ((-rot) & 31))) >>> 0;
        }
        random() {
            return this._next() / 0x100000000;
        }
    }

    /**
     * Implementation of a XORShift pseudo-random number generator.
     * This class provides a fast and reasonably high-quality random number generation
     * using the XORShift algorithm, which is significantly faster than Math.random()
     * while still maintaining good statistical properties.
     *
     * @implements {IRandom}
     * @example
     * ```typescript
     * const rng = new XORShiftRandom(12345); // Create with seed
     * const randomNumber = rng.random(); // Get number between 0 and 1
     * const diceRoll = rng.randInt(1, 7); // Get number between 1 and 6
     * ```
     */
    class XORShiftRandom extends BaseRandom {
        state;
        _seed;
        constructor(seed = Date.now()) {
            super();
            this._seed = seed;
            this.state = (seed >>> 0) || 0x9E3779B9; // guard against zero
            for (let i = 0; i < 10; i++)
                this.xorshift();
        }
        get seed() { return this._seed; }
        setSeed(seed) {
            this._seed = seed;
            this.state = (seed >>> 0) || 0x9E3779B9;
            for (let i = 0; i < 10; i++)
                this.xorshift();
        }
        xorshift() {
            let x = this.state;
            x ^= x << 13;
            x ^= x >>> 17;
            x ^= x << 5;
            this.state = x >>> 0;
            return this.state;
        }
        random() {
            return this.xorshift() / 0x100000000;
        }
    }

    var index$a = /*#__PURE__*/Object.freeze({
        __proto__: null,
        LCGRandom: LCGRandom,
        MersenneTwister: MersenneTwister,
        Mulberry32: Mulberry32,
        NativeRandom: NativeRandom,
        PCGRandom: PCGRandom,
        XORShiftRandom: XORShiftRandom
    });

    var index$9 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        distribution: index$b,
        generator: index$a
    });

    /**
     * Computes the cosine similarity between two vectors.
     * Measures the cosine of the angle between vectors: (a·b)/(‖a‖‖b‖)
     * Value of 1 means same direction, -1 opposite direction, 0 orthogonal.
     *
     * Measures how similar two vectors are in direction, regardless of their magnitudes.
     * The result ranges from -1 to 1, where:
     * - 1 means vectors point in the same direction
     * - 0 means vectors are perpendicular
     * - -1 means vectors point in opposite directions
     *
     * Practical applications:
     * - Measuring similarity between document vectors in text analysis
     * - Comparing user preferences in recommendation systems
     * - Finding similar directions in computer vision
     * - Determining how aligned two vectors are
     *
     * @typeParam D - Vector dimension
     * @param b - Vector to compare with
     * @defaultValue epsilon = 1e-10 for internal calculations
     * @param epsilon - Tolerance for floating-point comparisons (default: 1e-10)
     * @returns Value in range [-1, 1] where:
     *          1: Vectors point in same direction
     *          0: Vectors are perpendicular
     *          -1: Vectors point in opposite directions
     * @throws {Error} If vectors have different dimensions
     *
     * @example
     * ```typescript
     * // Two vectors pointing roughly the same way
     * const v1 = new Vector2D([3, 1]);
     * const v2 = new Vector2D([5, 2]);
     * const similarity = v1.cosineSimilarity(v2);  // Close to 1
     *
     * // Two perpendicular vectors
     * const v3 = new Vector2D([1, 0]);
     * const v4 = new Vector2D([0, 1]);
     * const similarity2 = v3.cosineSimilarity(v4);  // 0
     * ```
     *
     * @example Natural Language Processing
     * ```typescript
     * // Word embeddings (768D vectors from BERT)
     * type WordVector = Vector<768>;
     * const word1 = new WordVector(bertEmbed("king"));
     * const word2 = new WordVector(bertEmbed("queen"));
     * const word3 = new WordVector(bertEmbed("banana"));
     *
     * // Compare semantic similarity
     * const similarity1 = word1.cosineSimilarity(word2);  // ≈ 0.85 (high)
     * const similarity2 = word1.cosineSimilarity(word3);  // ≈ 0.02 (low)
     * ```
     *
     * @example Recommendation System
     * ```typescript
     * // User preference vectors (1000 features)
     * type UserPrefs = Vector<1000>;
     * const user1 = new UserPrefs(features1);
     * const user2 = new UserPrefs(features2);
     *
     * // Find similar users
     * const matchScore = user1.cosineSimilarity(user2);
     * if (matchScore > 0.8) {
     *     console.log("Users have very similar preferences");
     * }
     * ```
     *
     *
     */
    function cosineSimilarity(a, b) {
        Vector.ensureSameDimension(a, b, 'cosineSimilarity');
        const dot = a.dot(b);
        const norms = a.length() * b.length();
        if (norms < Vector.EPSILON) {
            throw new Error('Cannot compute cosine similarity with zero vector');
        }
        return dot / norms;
    }
    /**
     * Computes the Jaccard similarity between vectors.
     * Treats vectors as sets where non-zero elements indicate presence.
     * Calculated as: |A∩B|/|A∪B|
     *
     * Calculates similarity between vectors that represent sets.
     * The Jaccard similarity is perfect for:
     * - Comparing document word sets
     * - Analyzing user interaction patterns
     * - Finding similar items in recommendation systems
     * - Detecting plagiarism or duplicate content
     *
     * Example:
     * ```typescript
     * // Movie genres in two films (1 = has genre, 0 = doesn't)
     * // [action, comedy, drama, scifi, romance]
     * const movie1 = new Vector5D([1, 1, 0, 0, 1]);
     * const movie2 = new Vector5D([1, 1, 0, 1, 0]);
     *
     * // How similar are the movies by genre?
     * const similarity = movie1.jaccardSimilarity(movie2);
     * // 0.5 means they share half their genres
     * ```
     *
     * @param b - The vector to compute similarity with
     * @returns The Jaccard similarity in range [0, 1]
     */
    function jaccardSimilarity(a, b) {
        Vector.ensureSameDimension(a, b, 'jaccard similarity');
        let intersection = 0;
        let union = 0;
        a.forEach((v, i) => {
            const thisNonZero = Math.abs(v) > Vector.EPSILON;
            const bNonZero = Math.abs(b.get(i)) > Vector.EPSILON;
            if (thisNonZero && bNonZero)
                intersection++;
            if (thisNonZero || bNonZero)
                union++;
        });
        return union === 0 ? 0 : intersection / union;
    }
    /**
     * Computes the Dice coefficient between vectors.
     * Similar to Jaccard but gives more weight to agreements.
     * Calculated as: 2|A∩B|/(|A|+|B|)
     *
     * Measures set-based similarity between vectors, treating non-zero elements as set members.
     * The Dice coefficient is useful for:
     * - Comparing text documents
     * - Image segmentation evaluation
     * - Bioinformatics sequence comparison
     * - Pattern matching
     *
     * Unlike Jaccard similarity, it gives double weight to agreements.
     *
     * Example:
     * ```typescript
     * // Document 1 word presence (1 if word exists, 0 if not)
     * const doc1 = new Vector4D([1, 1, 0, 1]);
     * // Document 2 word presence
     * const doc2 = new Vector4D([1, 0, 1, 1]);
     * // How similar are the documents?
     * const similarity = doc1.diceCoefficient(doc2);
     * // 0.75 - quite similar (3 matching terms out of 4)
     * ```
     *
     * @param b - The vector to compute similarity with
     * @returns The Dice coefficient in range [0, 1]
     */
    function diceCoefficient(a, b) {
        Vector.ensureSameDimension(a, b, 'dice coefficient');
        let intersection = 0;
        let sumCardinalities = 0;
        a.forEach((v, i) => {
            const thisNonZero = Math.abs(v) > Vector.EPSILON;
            const bNonZero = Math.abs(b.get(i)) > Vector.EPSILON;
            if (thisNonZero && bNonZero)
                intersection++;
            if (thisNonZero)
                sumCardinalities++;
            if (bNonZero)
                sumCardinalities++;
        });
        return sumCardinalities === 0 ? 0 : (2 * intersection) / sumCardinalities;
    }
    /**
     * Computes the Pearson correlation coefficient between two vectors.
     * Measures linear correlation: +1 perfect positive, -1 perfect negative, 0 no linear correlation.
     * Calculated using standardized covariance.
     *
     * Measures similarity between vectors for machine learning and data analysis.
     * Pearson correlation shows how linearly related two vectors are:
     * - 1: Perfect positive correlation
     * - 0: No linear correlation
     * - -1: Perfect negative correlation
     *
     * Common applications:
     * - Analyzing relationships in data
     * - Comparing user ratings in recommendation systems
     * - Feature selection in machine learning
     * - Signal processing
     *
     * Example:
     * ```typescript
     * // User 1's ratings for movies [1,2,3,4,5]
     * const user1 = new Vector5D([5, 4, 5, 4, 5]);
     * // User 2's ratings for same movies
     * const user2 = new Vector5D([4, 5, 5, 4, 4]);
     * // How similar are their preferences?
     * const similarity = user1.pearsonCorrelation(user2);
     * // High positive value indicates similar taste
     * ```
     *
     * @param b - The vector to compute correlation with
     * @returns The Pearson correlation coefficient in range [-1, 1]
     */
    function pearsonCorrelation(a, b) {
        Vector.ensureSameDimension(a, b, 'pearson correlation');
        const n = a.dimension;
        // Calculate means
        const meanX = a.sum() / n;
        const meanY = b.sum() / n;
        // Calculate correlation
        let numerator = 0;
        let denomX = 0;
        let denomY = 0;
        a.forEach((v, i) => {
            const diffX = v - meanX;
            const diffY = b.get(i) - meanY;
            numerator += diffX * diffY;
            denomX += diffX * diffX;
            denomY += diffY * diffY;
        });
        const denominator = Math.sqrt(denomX * denomY);
        return denominator < Vector.EPSILON ? 0 : numerator / denominator;
    }
    /**
     * Computes the Spearman rank correlation coefficient.
     * Measures monotonic relationships by correlating the ranks of values.
     * Less sensitive to outliers than Pearson correlation.
     *
     * Calculates rank-based correlation, less sensitive to outliers than Pearson.
     * Spearman correlation is excellent for:
     * - Analyzing ordered data (rankings, ratings)
     * - Detecting any monotonic relationship (not just linear)
     * - Comparing preferences in recommendation systems
     * - Robust statistical analysis
     *
     * Example:
     * ```typescript
     * // Movie rankings by two critics (1 = best)
     * const critic1 = new Vector5D([1, 2, 3, 4, 5]);
     * const critic2 = new Vector5D([2, 1, 3, 5, 4]);
     *
     * // How similar are their rankings?
     * const agreement = critic1.spearmanCorrelation(critic2);
     * // High positive value means similar ranking patterns
     * // even if absolute ranks differ
     * ```
     *
     * @param b - The vector to compute correlation with
     * @returns The Spearman correlation coefficient in range [-1, 1]
     */
    function spearmanCorrelation(a, b) {
        Vector.ensureSameDimension(a, b, 'spearman correlation');
        const n = a.dimension;
        // Convert to ranks
        const getRanks = (arr) => {
            const indexed = Array.from(arr).map((v, i) => ({ value: v, index: i }));
            indexed.sort((a, b) => a.value - b.value);
            const ranks = new Array(n);
            for (let i = 0; i < n; i++) {
                ranks[indexed[i].index] = i + 1;
            }
            // Handle ties by averaging ranks
            let i = 0;
            while (i < n - 1) {
                let j = i + 1;
                while (j < n && indexed[j].value === indexed[i].value)
                    j++;
                if (j - i > 1) {
                    const avgRank = (i + j) / 2 + 1;
                    for (let k = i; k < j; k++) {
                        ranks[indexed[k].index] = avgRank;
                    }
                }
                i = j;
            }
            return ranks;
        };
        const ranksX = getRanks(a.toArray());
        const ranksY = getRanks(b.toArray());
        // Calculate correlation of ranks
        let sumDiffSquared = 0;
        for (let i = 0; i < n; i++) {
            const diff = ranksX[i] - ranksY[i];
            sumDiffSquared += diff * diff;
        }
        return 1 - (6 * sumDiffSquared) / (n * (n * n - 1));
    }
    /**
     * Computes the Tanimoto coefficient (extended Jaccard similarity).
     * Generalization of Jaccard similarity for real-valued vectors.
     * Calculated as: (a·b)/(‖a‖² + ‖b‖² - a·b)
     *
     * The Tanimoto coefficient extends Jaccard similarity to real-valued vectors.
     * It's particularly useful for:
     * - Chemical similarity searches
     * - Feature vector comparison in machine learning
     * - Image similarity detection
     * - Pattern recognition with continuous values
     *
     * Example:
     * ```typescript
     * // Chemical compound features (concentrations)
     * const compound1 = new Vector3D([0.5, 0.3, 0.2]);
     * const compound2 = new Vector3D([0.4, 0.4, 0.2]);
     *
     * // How similar are the compounds?
     * const similarity = compound1.tanimotoCoefficient(compound2);
     * // Value close to 1 indicates similar composition
     * ```
     *
     * @param b - The vector to compute similarity with
     * @returns The Tanimoto coefficient in range [0, 1]
     */
    function tanimotoCoefficient(a, b) {
        Vector.ensureSameDimension(a, b, 'tanimoto coefficient');
        const dotProduct = a.dot(b);
        const sumSquaresA = a.dot(a);
        const sumSquaresB = b.dot(b);
        return dotProduct / (sumSquaresA + sumSquaresB - dotProduct);
    }
    /**
     * Computes the Hamming distance between two vectors.
     * Counts the number of positions at which vectors differ.
     * Treats vectors as binary (non-zero elements considered as 1).
     *
     * Measures the number of positions where vectors differ.
     * Hamming distance is essential for:
     * - Error detection in data transmission
     * - DNA sequence comparison
     * - Pattern recognition
     * - Hash code comparison
     *
     * Example:
     * ```typescript
     * // Error checking codes (binary vectors)
     * const transmitted = new Vector8D([1,0,1,1,0,0,1,0]);
     * const received = new Vector8D([1,0,1,0,0,0,1,1]);
     *
     * // How many bits were corrupted?
     * const errors = transmitted.hammingDistance(received);  // 2 errors
     *
     * // DNA sequence comparison (A=00, C=01, G=10, T=11)
     * const dna1 = new Vector6D([0,0, 0,1, 1,0]);  // ACG
     * const dna2 = new Vector6D([0,0, 1,1, 1,0]);  // ATG
     * const mutations = dna1.hammingDistance(dna2);  // 1 mutation
     * ```
     *
     * @param b - The vector to compute distance with
     * @returns The number of positions where vectors differ
     */
    function hammingDistance(a, b) {
        Vector.ensureSameDimension(a, b, 'hamming distance');
        let differences = 0;
        a.forEach((v, i) => {
            const thisNonZero = Math.abs(v) > Vector.EPSILON;
            const bNonZero = Math.abs(b.get(i)) > Vector.EPSILON;
            if (thisNonZero !== bNonZero)
                differences++;
        });
        return differences;
    }
    /**
     * Computes the Jensen-Shannon divergence between two probability distributions.
     * Symmetric measure of similarity between distributions.
     * Square root of JSD is a metric (unlike KL divergence).
     *
     * Calculates similarity between probability distributions or normalized data vectors.
     * Jensen-Shannon divergence is useful for:
     * - Comparing probability distributions
     * - Analyzing text document similarity
     * - Comparing image histograms
     * - Measuring differences between machine learning models
     *
     * It's symmetric and always gives a meaningful distance, unlike KL divergence.
     *
     * Example:
     * ```typescript
     * // Distribution of words in document 1 (must sum to 1)
     * const doc1 = new Vector3D([0.6, 0.3, 0.1]);
     * // Distribution of words in document 2
     * const doc2 = new Vector3D([0.4, 0.4, 0.2]);
     * // How different are the documents?
     * const difference = doc1.jensenShannonDivergence(doc2);
     * // Lower values indicate more similar distributions
     * ```
     *
     * @param b - The vector representing second probability distribution
     * @returns The Jensen-Shannon divergence (always non-negative)
     * @throws Error if vectors don't sum to 1 (not valid probability distributions)
     */
    function jensenShannonDivergence(a, b) {
        Vector.ensureSameDimension(a, b, 'jensen-shannon divergence');
        // First ensure both vectors sum to 1 (approximately)
        const thisSum = a.reduce((sum, val) => sum + val, 0);
        const bSum = b.reduce((sum, val) => sum + val, 0);
        if (Math.abs(thisSum - 1) > Vector.EPSILON || Math.abs(bSum - 1) > Vector.EPSILON) {
            throw new Error('Vectors must represent probability distributions (sum to 1)');
        }
        let divergence = 0;
        a.forEach((p, i) => {
            const q = b.get(i);
            if (p > Vector.EPSILON && q > Vector.EPSILON) {
                const m = (p + q) / 2;
                divergence += p * Math.log2(p / m) / 2;
                divergence += q * Math.log2(q / m) / 2;
            }
            else if (p > Vector.EPSILON) {
                divergence += p * Math.log2(2) / 2;
            }
            else if (q > Vector.EPSILON) {
                divergence += q * Math.log2(2) / 2;
            }
        });
        return divergence;
    }
    /**
     * Computes the Bhattacharyya distance between two probability distributions.
     * Measures similarity between probability distributions.
     * Related to the amount of overlap between distributions.
     *
     * Measures similarity between probability distributions.
     * The Bhattacharyya distance is valuable for:
     * - Comparing image histograms
     * - Pattern recognition
     * - Feature selection
     * - Statistical classification
     *
     * Example:
     * ```typescript
     * // Color distributions in two image regions
     * const hist1 = new Vector3D([0.6, 0.3, 0.1]);  // RGB distribution
     * const hist2 = new Vector3D([0.4, 0.5, 0.1]);
     *
     * // How different are the color patterns?
     * const diff = hist1.bhattacharyyaDistance(hist2);
     * // Smaller values indicate more similar distributions
     *
     * // Can use for image segmentation:
     * if (diff < threshold) {
     *     console.log("Regions likely part of same object");
     * }
     * ```
     *
     * @param b - The vector representing second probability distribution
     * @returns The Bhattacharyya distance (always non-negative)
     * @throws Error if vectors don't sum to 1 (not valid probability distributions)
     */
    function bhattacharyyaDistance(a, b) {
        Vector.ensureSameDimension(a, b, 'bhattacharyya distance');
        // Ensure both vectors sum to 1 (approximately)
        const thisSum = a.reduce((sum, val) => sum + val, 0);
        const bSum = b.reduce((sum, val) => sum + val, 0);
        if (Math.abs(thisSum - 1) > Vector.EPSILON || Math.abs(bSum - 1) > Vector.EPSILON) {
            throw new Error('Vectors must represent probability distributions (sum to 1)');
        }
        let coefficient = 0;
        a.forEach((v, i) => coefficient += Math.sqrt(v * b.get(i)));
        return -Math.log(coefficient);
    }

    var similarity = /*#__PURE__*/Object.freeze({
        __proto__: null,
        bhattacharyyaDistance: bhattacharyyaDistance,
        cosineSimilarity: cosineSimilarity,
        diceCoefficient: diceCoefficient,
        hammingDistance: hammingDistance,
        jaccardSimilarity: jaccardSimilarity,
        jensenShannonDivergence: jensenShannonDivergence,
        pearsonCorrelation: pearsonCorrelation,
        spearmanCorrelation: spearmanCorrelation,
        tanimotoCoefficient: tanimotoCoefficient
    });

    var index$8 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        algorithms: algorithms,
        interpolation: index$d,
        metricSpace: metricSpace,
        random: index$9,
        similarity: similarity
    });

    /**
     * @module BlueNoise
     * @description
     * A module implementing Mitchell's Best Candidate algorithm for generating Blue Noise distributions.
     * Blue Noise is characterized by a roughly even distribution of points with minimal clumping, making
     * it useful for:
     * - Texture synthesis and dithering
     * - Sampling patterns for anti-aliasing
     * - Procedural object placement
     * - Point cloud generation
     *
     * The implementation uses a generic approach that works in any dimension, though it's most commonly
     * used in 2D and 3D spaces.
     *
     * @example
     * ```typescript
     * // Create a 2D blue noise generator with 1000 samples
     * const generator = new BlueNoiseGenerator(2, 1000, customRNG);
     *
     * // Configure the generator
     * generator.configure({
     *   frequency: 1.5,
     *   amplitude: 1.0,
     *   candidateCount: 15
     * });
     *
     * // Generate and get samples
     * const samples = generator.getSamples();
     *
     * // Evaluate noise at a point
     * const point = new Vector2D([0.5, 0.5]);
     * const noiseValue = generator.evaluate(point);
     * ```
     */
    /**
     * @class BlueNoiseGenerator
     * @template D - The number of dimensions for the noise space
     * @implements {ConfigurableNoiseGenerator<D>}
     * @description
     * Generates blue noise using Mitchell's Best Candidate algorithm. This algorithm creates a distribution
     * of points with approximately equal spacing between neighboring points, resulting in a high-quality
     * sampling pattern with blue noise spectral characteristics.
     *
     * The generator maintains a set of sample points and uses a candidate-based approach to place new points,
     * ensuring good spatial distribution. Each new point is chosen by generating multiple candidates and
     * selecting the one with the largest minimum distance to existing points.
     *
     * @example
     * ```typescript
     * // Create a 3D blue noise generator
     * const generator = new BlueNoiseGenerator(3, 512, randomNumberGenerator);
     *
     * // Set the seed for reproducibility
     * generator.seed(12345);
     *
     * // Get generated sample points
     * const samples = generator.getSamples();
     * ```
     */
    class BlueNoiseGenerator {
        dimensions;
        sampleCount;
        /**
         * @property {Vector<D>[]} private samples
         * @description Stores the generated blue noise sample points
         */
        samples = [];
        /**
         * @property {number} private frequency
         * @description Controls the spatial frequency of the noise pattern
         * Higher values result in more tightly packed samples
         */
        frequency = 1.0;
        /**
         * @property {number} private amplitude
         * @description Controls the intensity range of the noise values
         * Values are scaled to [-amplitude, amplitude]
         */
        amplitude = 1.0;
        /**
         * @property {number} private candidateCount
         * @description Number of candidates to generate when placing each new point
         * Higher values produce better quality but slower generation
         */
        candidateCount = 10;
        /**
         * @property {number} private minDistance
         * @description Minimum allowed distance between points
         * Calculated based on frequency and sample count
         */
        minDistance = 0.1;
        rng;
        /**
         * @constructor
         * @param dimensions - The number of dimensions for the noise space
         * @param sampleCount - The number of samples to generate (default: 4096)
         * @param rng - Random number generator implementing IRandomCore & IRandomArray interfaces
         *
         * @throws {Error} If dimensions is less than 1
         * @throws {Error} If sampleCount is less than 1
         */
        constructor(dimensions, sampleCount = 4096, rng) {
            this.dimensions = dimensions;
            this.sampleCount = sampleCount;
            this.VectorClass = Vector.forDimension(dimensions);
            this.rng = rng;
        }
        VectorClass;
        /**
         * @method seed
         * @param {number} seed - The seed value for the random number generator
         * @description
         * Seeds the random number generator to create reproducible noise patterns.
         * The same seed will always produce the same distribution of points.
         *
         * @example
         * ```typescript
         * const generator = new BlueNoiseGenerator(2, 1000, rng);
         * generator.seed(12345);  // Make pattern reproducible
         * ```
         */
        seed(seed) {
            this.rng.setSeed(seed);
        }
        /**
         * @method configure
         * @param {NoiseOptions & { candidateCount?: number }} options - Configuration options
         * @description
         * Configures the noise generator parameters. Available options include:
         * - frequency: Controls spatial frequency of the pattern
         * - amplitude: Controls range of output values
         * - candidateCount: Number of candidates per point placement
         *
         * The minimum distance between points is automatically calculated based on
         * the frequency and total number of samples.
         *
         * @example
         * ```typescript
         * generator.configure({
         *   frequency: 2.0,    // Double the spatial frequency
         *   amplitude: 0.5,    // Halve the output range
         *   candidateCount: 20 // More candidates for better quality
         * });
         * ```
         */
        configure(options) {
            this.frequency = options.frequency ?? this.frequency;
            this.amplitude = options.amplitude ?? this.amplitude;
            this.candidateCount = options.candidateCount ?? this.candidateCount;
            this.minDistance = 1 / (this.frequency * Math.sqrt(this.sampleCount));
        }
        /**
         * @method private generateSamples
         * @description
         * Generates the initial set of blue noise samples using Mitchell's Best
         * Candidate algorithm:
         * 1. Places first point randomly
         * 2. For each subsequent point:
         *    - Generates multiple candidate positions
         *    - Computes minimum distance to existing points for each candidate
         *    - Selects candidate with largest minimum distance
         * 3. Continues until reaching desired sample count
         *
         * This approach ensures points are well-distributed while maintaining
         * the blue noise spectral characteristics.
         */
        generateSamples() {
            this.samples = [];
            // Add first sample randomly
            this.samples.push(this.generateRandomPoint());
            // Generate remaining samples
            while (this.samples.length < this.sampleCount) {
                let bestCandidate = null;
                let bestDistance = -Infinity;
                // Generate and test multiple candidates
                for (let i = 0; i < this.candidateCount; i++) {
                    const candidate = this.generateRandomPoint();
                    const minDist = this.getMinimumDistance(candidate);
                    if (minDist > bestDistance) {
                        bestDistance = minDist;
                        bestCandidate = candidate;
                    }
                }
                if (bestCandidate) {
                    this.samples.push(bestCandidate);
                }
            }
        }
        /**
         * @method private generateRandomPoint
         * @returns {Vector<D>} A random point in the D-dimensional unit space
         * @description
         * Generates a random point with coordinates in [0,1] for each dimension.
         * Uses the provided random number generator to ensure reproducibility
         * when seeded.
         */
        generateRandomPoint() {
            const coords = new Float64Array(this.dimensions);
            for (let i = 0; i < this.dimensions; i++) {
                coords[i] = this.rng.random(); // Using IRandom interface
            }
            return new this.VectorClass(coords);
        }
        /**
         * @method private getMinimumDistance
         * @param {Vector<D>} point - The point to check
         * @returns {number} Distance to nearest existing sample
         * @description
         * Calculates the minimum toroidal distance between a point and all
         * existing samples. Uses toroidal distance to handle wrapping at
         * boundaries, ensuring seamless tiling.
         */
        getMinimumDistance(point) {
            if (this.samples.length === 0)
                return Infinity;
            // Use array of distances and get minimum
            return Math.min(...this.samples.map(sample => this.toroidalDistance(point, sample)));
        }
        /**
         * @method private toroidalDistance
         * @param {Vector<D>} a - First point
         * @param {Vector<D>} b - Second point
         * @returns {number} Toroidal distance between points
         * @description
         * Computes the shortest distance between two points in a toroidal space
         * (wrapping around boundaries). This ensures consistent sample spacing
         * across boundaries and enables seamless tiling of the noise pattern.
         */
        toroidalDistance(a, b) {
            let sumSquares = 0;
            for (let i = 0; i < this.dimensions; i++) {
                let diff = Math.abs(a.get(i) - b.get(i));
                diff = Math.min(diff, 1 - diff); // Wrap around
                sumSquares += diff * diff;
            }
            return Math.sqrt(sumSquares);
        }
        /**
         * @method evaluate
         * @param {Vector<D>} point - The point at which to evaluate the noise
         * @returns {number} Noise value in range [-amplitude, amplitude]
         * @description
         * Evaluates the blue noise function at a given point in space. The value
         * is determined by the distance to the nearest sample point:
         * - Returns amplitude when on a sample point
         * - Returns -amplitude at points furthest from any sample
         * - Smoothly interpolates between these extremes
         *
         * If samples haven't been generated yet, this method will trigger generation.
         *
         * @example
         * ```typescript
         * const point = new Vector2D([0.5, 0.5]);
         * const value = generator.evaluate(point);
         * ```
         */
        evaluate(point) {
            // Generate samples if not already generated
            if (this.samples.length === 0) {
                this.generateSamples();
            }
            // Find distance to nearest sample
            const distance = this.getMinimumDistance(point);
            // Convert distance to noise value
            // Returns 1 when point is on a sample, -1 when furthest from samples
            const normalizedDistance = Math.min(distance / this.minDistance, 1);
            return this.amplitude * (1 - 2 * normalizedDistance);
        }
        /**
         * @method getSamples
         * @returns {Vector<D>[]} Array of sample points
         * @description
         * Returns a copy of the generated sample points. If samples haven't been
         * generated yet, this method will trigger generation.
         *
         * The samples are returned as an array of D-dimensional vectors, each
         * representing a point in the noise space.
         *
         * @example
         * ```typescript
         * const samples = generator.getSamples();
         * for (const point of samples) {
         *   console.log(`Sample at (${point.toString()})`);
         * }
         * ```
         */
        getSamples() {
            if (this.samples.length === 0) {
                this.generateSamples();
            }
            return [...this.samples];
        }
        /**
         * @method resample
         * @param {number} percentage - Percentage of points to resample (0 to 1)
         * @description
         * Randomly resamples a portion of the existing points while maintaining
         * blue noise characteristics. This is useful for:
         * - Creating variation in the pattern
         * - Adjusting the distribution over time
         * - Animated noise effects
         *
         * For each resampled point, multiple candidates are generated and the best
         * one is chosen, similar to the initial generation process.
         *
         * @example
         * ```typescript
         * // Resample 20% of the points
         * generator.resample(0.2);
         * ```
         */
        resample(percentage) {
            if (this.samples.length === 0) {
                this.generateSamples();
                return;
            }
            const numToResample = Math.floor(this.samples.length * percentage);
            const indices = Array.from({ length: this.samples.length }, (_, i) => i);
            // Use IRandom shuffle to select random indices
            this.rng.shuffle(indices);
            // Resample selected points
            for (let i = 0; i < numToResample; i++) {
                const idx = indices[i];
                let bestCandidate = null;
                let bestDistance = -Infinity;
                // Remove the point we're resampling temporarily
                const removedPoint = this.samples[idx];
                this.samples[idx] = this.samples[this.samples.length - 1];
                this.samples.pop();
                // Generate and test candidates
                for (let j = 0; j < this.candidateCount; j++) {
                    const candidate = this.generateRandomPoint();
                    const minDist = this.getMinimumDistance(candidate);
                    if (minDist > bestDistance) {
                        bestDistance = minDist;
                        bestCandidate = candidate;
                    }
                }
                // Add best candidate back
                this.samples.push(bestCandidate || removedPoint);
            }
        }
        /**
         * @method valueToColor
         * @static
         * @param {number} value - Noise value in range [-1, 1]
         * @returns {string} RGB color string
         * @throws {Error} If value is outside [-1, 1] range
         * @description
         * Converts a noise value to a grayscale color string for visualization.
         * - -1 maps to black (rgb(0,0,0))
         * - 1 maps to white (rgb(255,255,255))
         * - Values in between are linearly interpolated
         *
         * @example
         * ```typescript
         * const color = BlueNoiseGenerator.valueToColor(0.5);
         * // Use color in canvas/SVG rendering
         * context.fillStyle = color;
         * ```
         */
        static valueToColor(value) {
            if (value < -1 || value > 1) {
                throw Error(`value (${value}) must be in range [-1, 1]`);
            }
            const normalized = (value + 1) / 2; // Convert from [-1,1] to [0,1]
            const intensity = Math.floor(normalized * 255);
            return `rgb(${intensity},${intensity},${intensity})`;
        }
    }

    /**
     * Generates a divergence-free vector field by taking the generalized cross
     * product of the gradients of (D - 1) independent scalar noise fields:
     *
     *   2D: c(p) = perp(grad f(p))                          -- the classic
     *                                              "stream function" construction
     *   3D: c(p) = grad f1(p) x grad f2(p)                  -- DeWolf's construction
     *   nD: c(p) = grad f1(p) x grad f2(p) x ... x grad f_(n-1)(p)  -- general case
     *
     * Why this is divergence-free, not just "tends to look swirly": the cross
     * product of (D - 1) vectors in D-space is, by construction, orthogonal to
     * every vector being crossed. Each grad f_i is itself a gradient, and
     * gradients are curl-free. Crossing curl-free fields together this way
     * produces a field whose divergence is identically zero everywhere -- not
     * approximately, by construction. That's what keeps anything advected
     * through this field (particles, ink, smoke trails) from pooling at
     * sources or draining into sinks; it only ever swirls.
     *
     * This deliberately uses finite differences on `evaluate(point)` rather
     * than any noise-specific analytic gradient, so it works with *any*
     * `NoiseGenerator<D>` -- Perlin, Simplex, Worley, a composite stack,
     * whatever you hand it -- at the cost of 2 extra `evaluate` calls per
     * dimension, per potential, per sample.
     *
     * The dimensional generality (2D/3D/nD all handled by the same formula) is
     * possible because `Vector.cross` implements the generalized cross
     * product: `first.cross(...rest)` is the 2D perpendicular when `rest` is
     * empty, the textbook 3D cross product when `rest` has one vector, and
     * the determinant-based nD generalization otherwise. (This relies on the
     * `types.ts` fix to `cross()`'s general branch -- see the patched file.)
     *
     * @example
     * ```typescript
     * const Vec2 = Vector.forDimension(2);
     * const potential = new SimplexNoise();           // any NoiseGenerator<2>
     * const flow = new CurlNoiseField([potential], 2, { amplitude: 1.5 });
     * const direction = flow.evaluate(new Vec2([10, 20])); // Vector<2>, divergence-free
     * ```
     */
    class CurlNoiseField {
        potentials;
        dimension;
        epsilon;
        amplitude;
        /**
         * @param potentials Exactly (dimension - 1) independent scalar noise
         *   fields. "Independent" just means decorrelated from each other --
         *   the usual approach is the same noise class seeded differently, or
         *   sampled with a fixed coordinate offset per field, rather than
         *   reaching for different algorithms per field.
         * @param dimension The dimensionality D of the space this field lives
         *   in. Passed explicitly (rather than inferred) because it's needed
         *   up front to validate `potentials.length`.
         */
        constructor(potentials, dimension, options = {}) {
            this.potentials = potentials;
            this.dimension = dimension;
            if (dimension < 2) {
                throw new Error(`CurlNoiseField requires dimension >= 2 (no divergence-free field exists in 1D), got ${dimension}`);
            }
            const expected = dimension - 1;
            if (potentials.length !== expected) {
                throw new Error(`CurlNoiseField in ${dimension}D requires exactly ${expected} potential field(s) ` +
                    `(the cross product needs D-1 gradients), got ${potentials.length}`);
            }
            this.epsilon = options.epsilon ?? 1e-3;
            this.amplitude = options.amplitude ?? 1;
        }
        /** Convenience constructor for the common 2D, single-potential case. */
        static planar(potential, options) {
            return new CurlNoiseField([potential], 2, options);
        }
        /** Convenience constructor for the common 3D, two-potential case. */
        static volumetric(potentials, options) {
            return new CurlNoiseField(potentials, 3, options);
        }
        evaluate(point) {
            const gradients = this.potentials.map(field => this.gradient(field, point));
            const [first, ...rest] = gradients;
            return first.cross(...rest).scale(this.amplitude);
        }
        /** Re-seeds every underlying potential field that supports seeding. */
        seed(seed) {
            this.potentials.forEach((field, i) => field.seed?.(seed + i));
        }
        /** Central-difference estimate of the gradient of `field` at `point`. */
        gradient(field, point) {
            const VecCtor = point.constructor;
            const coords = point.toArray();
            const grad = new Float64Array(this.dimension);
            for (let i = 0; i < this.dimension; i++) {
                const forward = Float64Array.from(coords);
                const backward = Float64Array.from(coords);
                forward[i] += this.epsilon;
                backward[i] -= this.epsilon;
                const fPlus = field.evaluate(new VecCtor(forward));
                const fMinus = field.evaluate(new VecCtor(backward));
                grad[i] = (fPlus - fMinus) / (2 * this.epsilon);
            }
            return new VecCtor(grad);
        }
    }

    /**
     * Default decorrelation offsets, taken directly from the reference
     * Bitangent Noise implementation (Wu, 2021): arbitrary fixed constants,
     * large and irrational-looking enough that sampling the same noise at
     * `p` and `p + offset` doesn't line up with its own periodicity.
     */
    const DEFAULT_OFFSET_3D = [31.416, -47.853, 12.679];
    const DEFAULT_OFFSET_4D = [31.416, -47.853, 12.679, 113.408];
    /**
     * Re-evaluates an existing `NoiseGenerator<D>` at a fixed coordinate
     * offset from whatever point it's asked about. This is the "second
     * independent potential field" Bitangent Noise needs, without requiring a
     * second noise *instance* -- same noise, sampled somewhere else far
     * enough away to be effectively decorrelated from the first sample.
     */
    class OffsetNoise {
        base;
        offset;
        constructor(base, offset) {
            this.base = base;
            this.offset = offset;
        }
        evaluate(point) {
            const VecCtor = point.constructor;
            const coords = point.toArray();
            const shifted = new Float64Array(coords.length);
            for (let i = 0; i < coords.length; i++)
                shifted[i] = coords[i] + this.offset[i];
            return this.base.evaluate(new VecCtor(shifted));
        }
        seed(seed) {
            this.base.seed?.(seed);
        }
    }
    /**
     * Bitangent Noise, 3D case. Invented independently twice -- by Ivan
     * DeWolf in 2005, and again (unknowingly) by Yuwen Wu in 2021, who gave
     * it this name. A divergence-free vector field built from ONE underlying
     * scalar noise function, sampled at two different points, rather than
     * from two separately-configured potential fields:
     *
     *   c(p) = grad(noise)(p) x grad(noise)(p + offset)
     *
     * This is exactly the math `CurlNoiseField.volumetric` already
     * implements -- the cross product of two gradients is divergence-free
     * regardless of where those gradients came from -- wired up to reuse a
     * single noise instance at a fixed offset instead of requiring two
     * unrelated potential fields. That reuse is the entire contribution of
     * Bitangent Noise over plain curl noise: one generator to configure and
     * seed instead of two.
     *
     * Honest caveat: the actual performance win described in the original
     * article comes from computing both gradients *analytically* while
     * sharing the underlying simplex-lattice traversal between them (each
     * lattice corner gets two hashed gradients instead of one, in the same
     * pass) -- bringing the cost to about 1.3x a single simplex noise call.
     * That requires hooking into a noise generator's internals and isn't
     * something a generic `NoiseGenerator<D>.evaluate` wrapper can do. This
     * class gets the *construction* right -- one noise function, sampled
     * twice, crossed -- at the finite-difference cost of `CurlNoiseField`,
     * not the shader-level optimized cost from the original article.
     *
     * @example
     * ```typescript
     * const Vec3 = Vector.forDimension(3);
     * const noise = new SimplexNoise();         // any NoiseGenerator<3>
     * const flow = new BitangentNoise3D(noise);
     * const direction = flow.evaluate(new Vec3([1, 2, 3])); // divergence-free
     * ```
     */
    class BitangentNoise3D {
        noise;
        field;
        constructor(noise, offset = DEFAULT_OFFSET_3D, options = {}) {
            this.noise = noise;
            this.field = CurlNoiseField.volumetric([noise, new OffsetNoise(noise, offset)], options);
        }
        evaluate(point) {
            return this.field.evaluate(point);
        }
        /** Re-seeds the single underlying noise function (both samples share it). */
        seed(seed) {
            this.noise.seed?.(seed);
        }
    }
    /**
     * Bitangent Noise, 4D ("spatiotemporal") case. Input is a 4D point
     * (x, y, z, w) -- conventionally w is time -- but the OUTPUT stays a
     * 3-vector: a spatial velocity field that evolves smoothly as w changes,
     * rather than a full divergence-free 4-vector.
     *
     * Mechanically: take only the spatial (x, y, z) partial derivatives of
     * each 4D potential -- project away the dw component of the 4D gradient
     * -- then cross those two 3-vectors. Each projected gradient is still
     * curl-free as a function of (x, y, z) *at fixed w* (it's literally
     * grad_xyz of a scalar function of (x, y, z, w) with w held constant), so
     * the div(grad(a) x grad(b)) = 0 identity still applies -- just
     * restricted to the spatial subspace. The result is a 3D flow field with
     * zero spatial divergence at every instant, animated by w.
     *
     * This is deliberately NOT the same thing as `CurlNoiseField<4>`, which
     * would need 3 potentials and produce a full divergence-free 4-vector.
     * This needs only 1 potential (sampled twice) and produces a 3-vector --
     * the shape you actually want for "noise that animates over time but
     * stays a 3D velocity field at each frame."
     *
     * @example
     * ```typescript
     * const Vec4 = Vector.forDimension(4);
     * const noise = new SimplexNoise(); // any NoiseGenerator<4>
     * const flow = new BitangentNoise4D(noise);
     * const direction = flow.evaluate(new Vec4([1, 2, 3, t])); // Vector<3>
     * ```
     */
    class BitangentNoise4D {
        noise;
        offset;
        epsilon;
        amplitude;
        constructor(noise, offset = DEFAULT_OFFSET_4D, options = {}) {
            this.noise = noise;
            this.offset = offset;
            this.epsilon = options.epsilon ?? 1e-3;
            this.amplitude = options.amplitude ?? 1;
        }
        evaluate(point) {
            const a = this.spatialGradient(this.noise, point);
            const b = this.spatialGradient(this.noise, this.shift(point, this.offset));
            return a.cross(b).scale(this.amplitude);
        }
        /** Re-seeds the single underlying noise function (both samples share it). */
        seed(seed) {
            this.noise.seed?.(seed);
        }
        shift(point, offset) {
            const VecCtor = point.constructor;
            const coords = point.toArray();
            const shifted = new Float64Array(4);
            for (let i = 0; i < 4; i++)
                shifted[i] = coords[i] + offset[i];
            return new VecCtor(shifted);
        }
        /**
         * Central-difference estimate of just the spatial (x, y, z) part of
         * grad(field) at `point`. The w/time partial is never computed -- it
         * isn't part of the output, so there's no reason to pay for it.
         */
        spatialGradient(field, point) {
            const VecCtor4 = point.constructor;
            const Vec3 = Vector.forDimension(3);
            const coords = point.toArray();
            const grad = new Float64Array(3);
            for (let i = 0; i < 3; i++) {
                const forward = Float64Array.from(coords);
                const backward = Float64Array.from(coords);
                forward[i] += this.epsilon;
                backward[i] -= this.epsilon;
                const fPlus = field.evaluate(new VecCtor4(forward));
                const fMinus = field.evaluate(new VecCtor4(backward));
                grad[i] = (fPlus - fMinus) / (2 * this.epsilon);
            }
            return new Vec3(grad);
        }
    }

    // =========================================================================
    // CompositeNoiseGenerator
    // =========================================================================
    /**
     * Composes multiple `NoiseGenerator<D>` instances into one. Generators
     * are registered by `name`, which is the identity used for `remove`,
     * `update`, and `has`. Names let you have multiple instances of the
     * same noise type (e.g. two Worley layers with different distance
     * metrics) without ambiguity.
     *
     * The combination strategy is a function — `CompositeNoiseGenerator`
     * doesn't bake in "weighted average" the way `FBMNoise` did. Use one
     * of the static combiners or supply your own.
     *
     * @example
     * ```typescript
     * // Marble: smooth simplex + cellular worley
     * const marble = new CompositeNoiseGenerator(2);
     * marble.add('base',   simplex, 0.7);
     * marble.add('veins',  worley,  0.3);
     * marble.evaluate(point); // weighted average by default
     *
     * // Pick a different combiner
     * const rocky = new CompositeNoiseGenerator(2, CompositeNoiseGenerator.max);
     * rocky.add('a', simplex, 1);
     * rocky.add('b', worley,  1);
     * ```
     */
    class CompositeNoiseGenerator {
        entries = new Map();
        dim;
        combiner;
        /**
         * @param dimension The fixed dimensionality of this composite. All
         *                  added generators must accept `Vector<D>` of this
         *                  dimension. (We can't check the generator's
         *                  dimension directly — that's enforced when its
         *                  `evaluate` rejects mismatched points.)
         * @param combiner  How to merge per-generator values. Defaults to
         *                  `weightedAverage`.
         */
        constructor(dimension, combiner = CompositeNoiseGenerator.weightedAverage) {
            if (!Number.isInteger(dimension) || dimension < 1) {
                throw new Error(`CompositeNoiseGenerator dimension must be a positive integer, got ${dimension}`);
            }
            this.dim = dimension;
            this.combiner = combiner;
        }
        // ---------------------------------------------------------------------
        // Collection API
        // ---------------------------------------------------------------------
        /**
         * Register a generator under `name`. Throws if `name` is already
         * taken — use `update` to change an existing entry's weight, or
         * `remove` then `add` to swap the generator itself.
         */
        add(name, generator, weight) {
            if (this.entries.has(name)) {
                throw new Error(`CompositeNoiseGenerator already has a generator named "${name}"`);
            }
            if (!Number.isFinite(weight)) {
                throw new Error(`weight must be finite, got ${weight}`);
            }
            this.entries.set(name, { generator, weight });
        }
        /** Remove the entry named `name`. Returns true if something was removed. */
        remove(name) {
            return this.entries.delete(name);
        }
        /**
         * Change the weight of an existing entry. Throws if `name` is not
         * present — `update` is for modifying, not for inserting.
         */
        update(name, weight) {
            const entry = this.entries.get(name);
            if (!entry) {
                throw new Error(`CompositeNoiseGenerator has no generator named "${name}"`);
            }
            if (!Number.isFinite(weight)) {
                throw new Error(`weight must be finite, got ${weight}`);
            }
            entry.weight = weight;
        }
        has(name) {
            return this.entries.has(name);
        }
        clear() {
            this.entries.clear();
        }
        /** Read-only count for diagnostics / iteration. */
        get size() {
            return this.entries.size;
        }
        /**
         * Swap the combiner without rebuilding the composite. Useful for
         * comparing strategies on the same set of layers.
         */
        setCombiner(combiner) {
            this.combiner = combiner;
        }
        // ---------------------------------------------------------------------
        // NoiseGenerator<D>
        // ---------------------------------------------------------------------
        evaluate(point) {
            if (this.entries.size === 0) {
                throw new Error('CompositeNoiseGenerator has no generators; add at least one before evaluating');
            }
            if (point.dimension !== this.dim) {
                throw new Error(`CompositeNoiseGenerator<${this.dim}>: point has dimension ${point.dimension}`);
            }
            // Materialize values and weights in matching order. Map
            // iteration order is insertion order, which is the natural
            // contract here — combiners that care about order (e.g. an
            // "overlay last on top" combiner) get a predictable sequence.
            const values = [];
            const weights = [];
            for (const { generator, weight } of this.entries.values()) {
                values.push(generator.evaluate(point));
                weights.push(weight);
            }
            return this.combiner(values, weights);
        }
        /**
         * Forwards seeding to every registered generator that supports it.
         * Generators without a `seed` method are skipped.
         */
        seed(seed) {
            for (const { generator } of this.entries.values()) {
                if (generator.seed)
                    generator.seed(seed);
            }
        }
        // ---------------------------------------------------------------------
        // Static combiners
        // ---------------------------------------------------------------------
        /**
         * Classic weighted average, normalized by the sum of |weights| so
         * the output stays in [-1, 1] regardless of weight magnitudes.
         * Zero total weight → 0.
         */
        static weightedAverage(values, weights) {
            let total = 0;
            let totalAbsWeight = 0;
            for (let i = 0; i < values.length; i++) {
                total += values[i] * weights[i];
                totalAbsWeight += Math.abs(weights[i]);
            }
            if (totalAbsWeight === 0)
                return 0;
            const result = total / totalAbsWeight;
            // Clamp guard against fp drift; mathematically already in range.
            return result < -1 ? -1 : result > 1 ? 1 : result;
        }
        /**
         * Minimum across all values. Weights act as a gate: entries with
         * `weight === 0` are excluded from the min (so you can mute a layer
         * without removing it). All-zero weights → 0.
         *
         * Useful for "carve" effects — wherever any layer dips low, the
         * output dips low.
         */
        static min(values, weights) {
            let result = Infinity;
            let any = false;
            for (let i = 0; i < values.length; i++) {
                if (weights[i] === 0)
                    continue;
                if (values[i] < result)
                    result = values[i];
                any = true;
            }
            return any ? result : 0;
        }
        /**
         * Maximum across all values. Same weight-as-gate semantics as
         * `min`. Useful for "ridge" effects — wherever any layer peaks,
         * the output peaks.
         */
        static max(values, weights) {
            let result = -Infinity;
            let any = false;
            for (let i = 0; i < values.length; i++) {
                if (weights[i] === 0)
                    continue;
                if (values[i] > result)
                    result = values[i];
                any = true;
            }
            return any ? result : 0;
        }
        /**
         * Product of all values. Weight acts as an exponent on each value
         * via `sign(v) * |v|^|w|`, which keeps results in [-1, 1] for
         * |w| ≥ 0 (since |v| ≤ 1). A weight of 1 leaves a value unchanged;
         * weight 2 squashes it toward 0; weight 0 makes it contribute 1
         * (i.e. effectively removed).
         *
         * Useful for masking: multiply a base noise by a `clamp01`-shaped
         * mask layer to suppress regions.
         */
        static multiply(values, weights) {
            let result = 1;
            for (let i = 0; i < values.length; i++) {
                const v = values[i];
                const w = Math.abs(weights[i]);
                if (w === 0) {
                    // contributes 1 — no-op
                    continue;
                }
                // Preserve sign, raise magnitude to weight.
                const mag = Math.pow(Math.abs(v), w);
                result *= v < 0 ? -mag : mag;
            }
            // Product of values in [-1, 1] is in [-1, 1]; clamp for fp safety.
            return result < -1 ? -1 : result > 1 ? 1 : result;
        }
        /**
         * Median of the values, ignoring weights entirely. Robust against
         * outlier layers — one extreme layer can't dominate the result.
         *
         * For even counts, returns the average of the two middle values.
         */
        static median(values, _weights) {
            const n = values.length;
            if (n === 0)
                return 0;
            // Sort a copy — don't mutate the input.
            const sorted = values.slice().sort((a, b) => a - b);
            const mid = n >> 1;
            return n % 2 === 1
                ? sorted[mid]
                : (sorted[mid - 1] + sorted[mid]) / 2;
        }
    }

    /**
     * Maximum number of neighborhood cells to enumerate before refusing to evaluate.
     * 3^D grows quickly: D=4 → 81, D=6 → 729, D=8 → 6561. Past this we should be
     * using a different algorithm (e.g. bitmask-based feature point lookup).
     */
    const MAX_NEIGHBOR_CELLS = 10_000;
    /**
     * Default upper bound on cached feature points. The cache is a pure performance
     * optimization — eviction never affects output, since feature points are a pure
     * function of (seed, cell coordinates).
     */
    const DEFAULT_CACHE_CAPACITY = 16_384;
    /**
     * Default normalizers mapping cell-space distance to [0, 1]. These are the
     * *practical* worst-case distances from a query point to its nearest jittered
     * feature point in the 3^D neighborhood — NOT the diameter of the 3^D block.
     *
     * Reasoning: every cell holds exactly one feature point, and a query at the
     * worst corner of its containing cell sees feature points in adjacent cells
     * jittered (in the worst case) toward the *opposite* corner of those cells.
     * The resulting nearest-distance worst case is approximately:
     *   - Euclidean: sqrt(D) / 2   (half the unit-cell diagonal)
     *   - Manhattan: D / 2
     *   - Chebyshev: 1 / 2
     *
     * These bounds are tight enough that evaluate() spans most of [-1, 1] in
     * practice. They aren't strict mathematical upper bounds (jitter is in [0, 1),
     * so feature points sit *inside* cells, not on far corners — but a defensive
     * clamp in evaluate() handles the occasional slight overshoot).
     */
    const DEFAULT_MAX_DISTANCE_NORMALIZER = {
        euclidean: (d) => Math.sqrt(d) / 2,
        manhattan: (d) => d / 2,
        chebyshev: (_d) => 0.5,
    };
    /**
     * A cellular noise generator that places one jittered feature point per grid cell.
     *
     * Output is a pure function of (seed, query point): given the same seed, evaluating
     * the same coordinate always returns the same value, regardless of evaluation order
     * or whether other points have been evaluated first. This is achieved by hashing
     * cell coordinates with the seed to derive jitter, rather than drawing from a
     * stateful PRNG.
     *
     * The cache is bounded (LRU eviction) so this is safe to use for unbounded terrain
     * generation. Eviction is purely a performance trade-off; correctness is unaffected.
     *
     * @template D - Number of dimensions (compile-time positive integer)
     *
     * @example
     * ```typescript
     * const noise = new JitteredGridNoise<2>(2, { seed: 1337, frequency: 4 });
     * const v = noise.evaluate(new (Vector.forDimension(2))([0.5, 0.5])); // in [-1, 1]
     * ```
     */
    class JitteredGridNoise {
        dimension;
        VectorClass;
        _seed;
        frequency = 1;
        amplitude = 1;
        distanceMetric;
        /**
         * Per-axis maximum distance (in cell units) used to normalize evaluate() into
         * [-1, 1]. Set automatically for built-in metrics; configurable for custom ones.
         */
        maxNeighborhoodDistance;
        /** LRU cache: key = cell-key string, value = feature point. Insertion order = LRU order. */
        featurePointCache;
        cacheCapacity;
        constructor(dimension, options = {}) {
            if (!Number.isInteger(dimension) || dimension < 1) {
                throw new Error(`Dimension must be a positive integer, got ${dimension}`);
            }
            if (Math.pow(3, dimension) > MAX_NEIGHBOR_CELLS) {
                throw new Error(`Dimension ${dimension} requires ${Math.pow(3, dimension)} neighbor lookups ` +
                    `per evaluation, exceeding the safety limit of ${MAX_NEIGHBOR_CELLS}.`);
            }
            this.dimension = dimension;
            this.VectorClass = Vector.forDimension(dimension);
            this._seed = (options.seed ?? 0) | 0;
            this.cacheCapacity = options.cacheCapacity ?? DEFAULT_CACHE_CAPACITY;
            const minRequiredCapacity = Math.pow(3, dimension);
            if (this.cacheCapacity < minRequiredCapacity) {
                // A single evaluate() touches 3^D neighbor cells. If the cache
                // can't hold them all, we'd evict and re-hash feature points
                // *within* one evaluation, defeating the cache entirely.
                throw new Error(`cacheCapacity must be at least 3^dimension (${minRequiredCapacity}) ` +
                    `to avoid intra-evaluation thrashing, got ${this.cacheCapacity}`);
            }
            this.featurePointCache = new Map();
            this.distanceMetric = options.distanceMetric ?? euclideanDistance;
            this.maxNeighborhoodDistance =
                options.maxNeighborhoodDistance ?? DEFAULT_MAX_DISTANCE_NORMALIZER.euclidean(dimension);
            this.configure(options);
        }
        // ---------------------------------------------------------------------
        // Configuration
        // ---------------------------------------------------------------------
        configure(options) {
            if (options.frequency !== undefined) {
                if (!(options.frequency > 0) || !Number.isFinite(options.frequency)) {
                    throw new Error(`frequency must be a positive finite number, got ${options.frequency}`);
                }
                this.frequency = options.frequency;
                // NOTE: do NOT clear featurePointCache here. The cache stores
                // feature points in *cell-space*, where one cell == 1 unit
                // regardless of frequency. Frequency only scales the query
                // coordinates on the way in and the returned distances on the
                // way out; the cached cell→point mapping is invariant.
            }
            if (options.amplitude !== undefined) {
                if (!(options.amplitude > 0) || !Number.isFinite(options.amplitude)) {
                    throw new Error(`amplitude must be a positive finite number, got ${options.amplitude}`);
                }
                this.amplitude = options.amplitude;
            }
            // octaves/persistence/lacunarity belong to fractal composition, not the
            // base cellular generator. Silently ignore them; FractalNoiseGenerator
            // is the right place to apply them.
        }
        /**
         * Set the distance metric. The `maxNeighborhoodDistance` is left unchanged,
         * which means swapping to a metric with a different scale (e.g. Euclidean
         * → Manhattan) without also updating the normalizer will silently squash
         * or saturate evaluate() output.
         *
         * Prefer either:
         *   - the `for*` factory methods (`forEuclidean`, `forManhattan`, ...),
         *     which configure metric + normalizer together; or
         *   - {@link setDistanceMetricWithNormalizer}, which sets both atomically.
         *
         * This single-argument form exists to satisfy the {@link CellularNoiseGenerator}
         * interface; it is not the recommended entry point.
         */
        setDistanceMetric(metric) {
            this.distanceMetric = metric;
        }
        /**
         * Set the distance metric and its companion normalization constant
         * atomically. This is the safe way to swap metrics at runtime.
         *
         * `maxNeighborhoodDistance` is the practical worst-case distance from any
         * point in a unit cell to a jittered feature point in the 3^D neighborhood,
         * in cell units. For Lp metrics with p ≥ 1 in D dimensions a good starting
         * point is `D^(1/p) / 2`.
         */
        setDistanceMetricWithNormalizer(metric, maxNeighborhoodDistance) {
            if (!(maxNeighborhoodDistance > 0) || !Number.isFinite(maxNeighborhoodDistance)) {
                throw new Error(`maxNeighborhoodDistance must be a positive finite number, got ${maxNeighborhoodDistance}`);
            }
            this.distanceMetric = metric;
            this.maxNeighborhoodDistance = maxNeighborhoodDistance;
        }
        seed(seed) {
            this._seed = seed | 0;
            this.featurePointCache.clear();
        }
        get currentSeed() {
            return this._seed;
        }
        // ---------------------------------------------------------------------
        // Evaluation
        // ---------------------------------------------------------------------
        /**
         * Evaluate the noise at `point`. Returns a value in [-1, 1] where 1 is on
         * top of a feature point and -1 is the farthest possible from one.
         *
         * The mapping is `1 - 2 * (d / dmax)` where `d` is the distance to the
         * nearest feature point in *cell-space* (i.e. independent of `frequency`)
         * and `dmax` is the theoretical worst-case distance for the configured
         * metric. The result is then scaled by `amplitude`.
         */
        evaluate(point) {
            this.assertSameDimension(point);
            const distCellSpace = this.nearestDistanceCellSpace(point, 1)[0];
            const normalized = 1 - 2 * (distCellSpace / this.maxNeighborhoodDistance);
            // Clamp defensively: a custom metric with a too-small dmax could go out of range.
            const clamped = normalized < -1 ? -1 : normalized > 1 ? 1 : normalized;
            return clamped * this.amplitude;
        }
        /**
         * Distances to the `count` nearest feature points, in *world space*
         * (i.e. divided by frequency, scaled by amplitude). Sorted ascending.
         */
        getNearestFeaturePoints(point, count) {
            this.assertSameDimension(point);
            if (!Number.isInteger(count) || count < 1) {
                throw new Error(`count must be a positive integer, got ${count}`);
            }
            const cellSpace = this.nearestDistanceCellSpace(point, count);
            // Convert cell-space → world-space (÷frequency) and apply amplitude.
            const out = new Array(cellSpace.length);
            for (let i = 0; i < cellSpace.length; i++) {
                out[i] = (cellSpace[i] / this.frequency) * this.amplitude;
            }
            return out;
        }
        /**
         * Core nearest-neighbor search. Operates in cell-space (frequency = 1) so
         * results are directly comparable to `maxNeighborhoodDistance`. Uses a
         * bounded max-heap to keep only the k smallest distances rather than
         * sorting all 3^D candidates.
         */
        nearestDistanceCellSpace(point, count) {
            // Transform query point into cell-space.
            const cellSpaceCoords = new Float64Array(this.dimension);
            for (let i = 0; i < this.dimension; i++) {
                cellSpaceCoords[i] = point.get(i) * this.frequency;
            }
            const cellSpacePoint = new this.VectorClass(cellSpaceCoords);
            // Cell containing the query point.
            const baseCell = new Int32Array(this.dimension);
            for (let i = 0; i < this.dimension; i++) {
                baseCell[i] = Math.floor(cellSpaceCoords[i]);
            }
            // Max-heap of size up to `count`, holding the smallest distances seen.
            const heap = new MaxHeap(count);
            const offset = new Int32Array(this.dimension);
            const neighborCell = new Int32Array(this.dimension);
            this.forEachNeighborOffset(offset, 0, () => {
                for (let i = 0; i < this.dimension; i++) {
                    neighborCell[i] = baseCell[i] + offset[i];
                }
                const fp = this.getFeaturePointInCellSpace(neighborCell);
                const d = this.distanceMetric(cellSpacePoint, fp);
                heap.offer(d);
            });
            return heap.drainAscending();
        }
        /** Recursively enumerate every offset in {-1, 0, 1}^D, calling `cb` per leaf. */
        forEachNeighborOffset(offset, axis, cb) {
            if (axis === this.dimension) {
                cb();
                return;
            }
            for (let delta = -1; delta <= 1; delta++) {
                offset[axis] = delta;
                this.forEachNeighborOffset(offset, axis + 1, cb);
            }
        }
        // ---------------------------------------------------------------------
        // Feature points (deterministic, hash-based)
        // ---------------------------------------------------------------------
        /**
         * Get the feature point for `cellCoords` *in cell-space*. Cached by cell key
         * with LRU eviction. Cache is purely a performance optimization — the
         * underlying jitter is deterministic from (seed, cellCoords).
         */
        getFeaturePointInCellSpace(cellCoords) {
            const key = cellKeyOf(cellCoords);
            const existing = this.featurePointCache.get(key);
            if (existing !== undefined) {
                // Refresh LRU position.
                this.featurePointCache.delete(key);
                this.featurePointCache.set(key, existing);
                return existing;
            }
            const coords = new Float64Array(this.dimension);
            for (let axis = 0; axis < this.dimension; axis++) {
                coords[axis] = cellCoords[axis] + jitter01(this._seed, cellCoords, axis);
            }
            const fp = new this.VectorClass(coords);
            if (this.featurePointCache.size >= this.cacheCapacity) {
                // Evict oldest. Map preserves insertion order, so the first key is LRU.
                const oldest = this.featurePointCache.keys().next().value;
                if (oldest !== undefined)
                    this.featurePointCache.delete(oldest);
            }
            this.featurePointCache.set(key, fp);
            return fp;
        }
        assertSameDimension(point) {
            if (point.dimension !== this.dimension) {
                throw new Error(`Point dimension ${point.dimension} does not match generator dimension ${this.dimension}`);
            }
        }
        // ---------------------------------------------------------------------
        // Convenience factories for built-in metrics
        // ---------------------------------------------------------------------
        static forEuclidean(dimension, options = {}) {
            return new JitteredGridNoise(dimension, {
                ...options,
                distanceMetric: euclideanDistance,
                maxNeighborhoodDistance: options.maxNeighborhoodDistance ?? DEFAULT_MAX_DISTANCE_NORMALIZER.euclidean(dimension),
            });
        }
        static forManhattan(dimension, options = {}) {
            return new JitteredGridNoise(dimension, {
                ...options,
                distanceMetric: DistanceMetrics.manhattan(),
                maxNeighborhoodDistance: options.maxNeighborhoodDistance ?? DEFAULT_MAX_DISTANCE_NORMALIZER.manhattan(dimension),
            });
        }
        static forChebyshev(dimension, options = {}) {
            return new JitteredGridNoise(dimension, {
                ...options,
                distanceMetric: DistanceMetrics.chebyshev(),
                maxNeighborhoodDistance: options.maxNeighborhoodDistance ?? DEFAULT_MAX_DISTANCE_NORMALIZER.chebyshev(dimension),
            });
        }
    }
    // =========================================================================
    // Hashing — the heart of determinism
    // =========================================================================
    /**
     * Mix seed, cell coordinates, and axis index into one 32-bit hash. Based on
     * PCG / xxHash-style mixing — fast, good avalanche, no PRNG state required.
     * Output range is [0, 2^32).
     *
     * `axis` is folded in both before the coordinate loop (seeds the accumulator)
     * AND after it (perturbs the final mix). Mixing it only at the start would
     * mean the only difference between axis-0 and axis-1 outputs is a fixed
     * pre-image into the same deterministic mixing function, which gives weaker
     * inter-axis independence than this generator's correctness story claims.
     */
    function hashCell(seed, cellCoords, axis) {
        // Seed the accumulator from seed and axis.
        let h = (seed | 0) ^ (0x9e3779b1 + axis * 0x85ebca6b) | 0;
        // Mix in each cell coordinate.
        for (let i = 0; i < cellCoords.length; i++) {
            h = Math.imul(h ^ cellCoords[i], 0x85ebca6b);
            h = (h ^ (h >>> 13)) | 0;
            h = Math.imul(h, 0xc2b2ae35);
            h = (h ^ (h >>> 16)) | 0;
        }
        // Re-introduce axis post-mix so each axis takes an independent diffusion path.
        h = (h ^ Math.imul(axis | 0, 0x27d4eb2f)) | 0;
        // Final mix.
        h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
        h = (h ^ (h >>> 13)) | 0;
        h = Math.imul(h, 0xc2b2ae35);
        h = (h ^ (h >>> 16)) >>> 0; // unsigned
        return h;
    }
    /** Deterministic jitter in [0, 1) for (seed, cell, axis). 24-bit precision. */
    function jitter01(seed, cellCoords, axis) {
        return (hashCell(seed, cellCoords, axis) >>> 8) / 0x1000000;
    }
    function cellKeyOf(cellCoords) {
        // Comma-separated; negative numbers are unambiguous.
        let s = String(cellCoords[0]);
        for (let i = 1; i < cellCoords.length; i++)
            s += ',' + cellCoords[i];
        return s;
    }
    // =========================================================================
    // Distance metrics
    // =========================================================================
    function euclideanDistance(a, b) {
        if (a.dimension !== b.dimension)
            throw new Error('Vectors must have same dimension');
        let sumSq = 0;
        for (let i = 0; i < a.dimension; i++) {
            const d = a.get(i) - b.get(i);
            sumSq += d * d;
        }
        return Math.sqrt(sumSq);
    }
    const DistanceMetrics = {
        euclidean: () => euclideanDistance,
        manhattan: () => (a, b) => {
            if (a.dimension !== b.dimension)
                throw new Error('Vectors must have same dimension');
            let sum = 0;
            for (let i = 0; i < a.dimension; i++)
                sum += Math.abs(a.get(i) - b.get(i));
            return sum;
        },
        chebyshev: () => (a, b) => {
            if (a.dimension !== b.dimension)
                throw new Error('Vectors must have same dimension');
            let max = 0;
            for (let i = 0; i < a.dimension; i++) {
                const d = Math.abs(a.get(i) - b.get(i));
                if (d > max)
                    max = d;
            }
            return max;
        },
        /**
         * Minkowski distance with power `p ≥ 1`. Note: when using this with
         * JitteredGridNoise, you must also call `setMaxNeighborhoodDistance` with
         * the appropriate normalization constant for the chosen `p` (or evaluate()
         * may not span [-1, 1]).
         */
        minkowski: (p) => {
            if (!(p >= 1) || !Number.isFinite(p)) {
                throw new Error(`Minkowski power must be a finite number ≥ 1, got ${p}`);
            }
            const invP = 1 / p;
            return (a, b) => {
                if (a.dimension !== b.dimension)
                    throw new Error('Vectors must have same dimension');
                let sum = 0;
                for (let i = 0; i < a.dimension; i++) {
                    sum += Math.pow(Math.abs(a.get(i) - b.get(i)), p);
                }
                return Math.pow(sum, invP);
            };
        },
    };
    // =========================================================================
    // Bounded max-heap for k-smallest selection
    // =========================================================================
    /**
     * Fixed-capacity max-heap of numbers. Used to keep only the k smallest
     * distances during nearest-neighbor search: when the heap is full, a new
     * value replaces the root iff it is smaller than the root.
     */
    class MaxHeap {
        capacity;
        heap = [];
        constructor(capacity) {
            this.capacity = capacity;
        }
        offer(value) {
            if (this.heap.length < this.capacity) {
                this.heap.push(value);
                this.siftUp(this.heap.length - 1);
            }
            else if (value < this.heap[0]) {
                this.heap[0] = value;
                this.siftDown(0);
            }
        }
        /** Returns contents in ascending order. Destructive. */
        drainAscending() {
            // Repeated extract-max gives descending; reverse for ascending.
            const out = new Array(this.heap.length);
            for (let i = this.heap.length - 1; i >= 0; i--) {
                out[i] = this.heap[0];
                const last = this.heap.pop();
                if (this.heap.length > 0) {
                    this.heap[0] = last;
                    this.siftDown(0);
                }
            }
            return out;
        }
        siftUp(i) {
            while (i > 0) {
                const parent = (i - 1) >> 1;
                if (this.heap[i] > this.heap[parent]) {
                    [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
                    i = parent;
                }
                else
                    break;
            }
        }
        siftDown(i) {
            const n = this.heap.length;
            for (;;) {
                const l = 2 * i + 1, r = 2 * i + 2;
                let largest = i;
                if (l < n && this.heap[l] > this.heap[largest])
                    largest = l;
                if (r < n && this.heap[r] > this.heap[largest])
                    largest = r;
                if (largest === i)
                    break;
                [this.heap[i], this.heap[largest]] = [this.heap[largest], this.heap[i]];
                i = largest;
            }
        }
    }

    // =========================================================================
    // OctaveNoiseGenerator
    // =========================================================================
    /**
     * Layers a single base noise on top of itself at geometrically
     * increasing frequencies and decreasing amplitudes — classical
     * fractal Brownian motion (fBm).
     *
     * This is *self-similar* layering: every octave is the same generator
     * sampled at a different scale. For *heterogeneous* layering (e.g.
     * mixing a Simplex base with a Worley detail layer), use
     * `CompositeNoiseGenerator` instead. The two compose freely:
     *
     *   - An `OctaveNoiseGenerator` whose base is a `CompositeNoiseGenerator`
     *     gives you fractal layering of a composed noise.
     *   - A `CompositeNoiseGenerator` containing several
     *     `OctaveNoiseGenerator`s gives you a mix of independently-octaved
     *     noises.
     *
     * Output is normalized by the sum of amplitudes so the result stays in
     * approximately [−1, 1] regardless of octave count or persistence,
     * with a clamp as fp safety.
     *
     * Allocation note
     * ---------------
     * Each octave scales the input point once, which allocates a new
     * Vector. That's one allocation per octave per `evaluate`. Negligible
     * next to the work inside any real base noise (especially Worley's
     * cell scan or Simplex's gradient lookups).
     */
    class OctaveNoiseGenerator {
        dim;
        base;
        frequency = 1;
        amplitude = 1;
        octaves = 1;
        persistence = 0.5;
        lacunarity = 2;
        /**
         * @param dimension Fixed dimensionality D. Must match `base`.
         * @param base      The noise to layer. Should itself be a
         *                  single-octave generator — if it has its own
         *                  internal octave loop, the two will multiply
         *                  confusingly.
         * @param options   Optional initial fBm parameters.
         */
        constructor(dimension, base, options) {
            if (!Number.isInteger(dimension) || dimension < 1) {
                throw new Error(`OctaveNoiseGenerator dimension must be a positive integer, got ${dimension}`);
            }
            this.dim = dimension;
            this.base = base;
            if (options)
                this.configure(options);
        }
        // ---------------------------------------------------------------------
        // NoiseGenerator<D>
        // ---------------------------------------------------------------------
        evaluate(point) {
            if (point.dimension !== this.dim) {
                throw new Error(`OctaveNoiseGenerator<${this.dim}>: point has dimension ${point.dimension}`);
            }
            let total = 0;
            let normalizer = 0;
            let amp = 1;
            let freq = this.frequency;
            for (let o = 0; o < this.octaves; o++) {
                const scaled = point.scale(freq);
                total += amp * this.base.evaluate(scaled);
                normalizer += amp;
                amp *= this.persistence;
                freq *= this.lacunarity;
            }
            const normalized = normalizer > 0 ? total / normalizer : 0;
            const result = this.amplitude * normalized;
            return result < -1 ? -1 : result > 1 ? 1 : result;
        }
        /** Forwards to the base generator if it supports seeding. */
        seed(seed) {
            if (this.base.seed)
                this.base.seed(seed);
        }
        // ---------------------------------------------------------------------
        // Configuration
        // ---------------------------------------------------------------------
        configure(options) {
            if (options.frequency !== undefined) {
                if (!Number.isFinite(options.frequency) || options.frequency <= 0) {
                    throw new Error(`frequency must be > 0, got ${options.frequency}`);
                }
                this.frequency = options.frequency;
            }
            if (options.amplitude !== undefined) {
                if (!Number.isFinite(options.amplitude)) {
                    throw new Error(`amplitude must be finite, got ${options.amplitude}`);
                }
                this.amplitude = options.amplitude;
            }
            if (options.octaves !== undefined) {
                if (!Number.isInteger(options.octaves) || options.octaves < 1) {
                    throw new Error(`octaves must be a positive integer, got ${options.octaves}`);
                }
                this.octaves = options.octaves;
            }
            if (options.persistence !== undefined) {
                if (!Number.isFinite(options.persistence)) {
                    throw new Error(`persistence must be finite, got ${options.persistence}`);
                }
                this.persistence = options.persistence;
            }
            if (options.lacunarity !== undefined) {
                if (!Number.isFinite(options.lacunarity) || options.lacunarity <= 0) {
                    throw new Error(`lacunarity must be > 0, got ${options.lacunarity}`);
                }
                this.lacunarity = options.lacunarity;
            }
        }
        /**
         * Swap the wrapped base noise without rebuilding the generator.
         * Useful for A/B comparing different base noises with identical
         * octave settings.
         */
        set(base) {
            this.base = base;
        }
    }

    // =========================================================================
    // PerlinFadeInterpolator
    // =========================================================================
    /**
     * Scalar interpolator that applies Perlin's improved quintic fade
     * (6t^5 − 15t^4 + 10t^3) to t before performing a linear blend.
     *
     * The fade curve is C² continuous at t=0 and t=1, which is what makes
     * gradient noise visually smooth — without it, the field has visible
     * grid-aligned creases under shading.
     *
     * Implements `NoiseInterpolator` so it can be swapped for a plain linear
     * blend, a cubic (3t^2 − 2t^3) Hermite smoothstep, a cosine fade, or any
     * other fade-then-lerp scheme without touching the noise core.
     */
    class PerlinFadeInterpolator {
        interpolate(a, b, t) {
            const u = t * t * t * (t * (t * 6 - 15) + 10);
            return a + u * (b - a);
        }
    }
    // =========================================================================
    // PerlinNoise — single-octave gradient noise only
    // =========================================================================
    /**
     * N-dimensional Perlin Noise (single octave).
     *
     * Direct generalization of Ken Perlin's "Improving Noise" (2002,
     * https://cs.nyu.edu/~perlin/noise/) to arbitrary dimension D. Multi-
     * octave / fractal Brownian motion is intentionally NOT handled here —
     * wrap an instance of this class in `FBMNoise<D>` for that.
     *
     * Algorithm sketch (per evaluation point p ∈ ℝ^D):
     *   1. Locate the integer lattice cell containing p:
     *        i_k = ⌊p_k⌋,  f_k = p_k − i_k       (k = 0..D-1)
     *   2. For each of the 2^D corners, compute g · d, where g is a
     *      pseudo-random gradient selected by hashing the corner's integer
     *      coordinates and d is the offset from that corner to p.
     *   3. D-linearly interpolate the 2^D corner values along each axis,
     *      delegating each pairwise blend (including any fade) to a
     *      `NoiseInterpolator`.
     *
     * Gradient set
     * ------------
     * Perlin's 3-D paper uses the 12 mid-edge vectors of the cube — vectors
     * with exactly two non-zero components, each ±1. The natural N-D
     * generalization is the same construction in arbitrary D, giving
     * 2·D·(D−1) gradients. The dot product g·d collapses to a signed sum of
     * two coordinates of d, so no D-vector is allocated per corner.
     *
     * Composability
     * -------------
     * - `IRandomCore` injection: any seedable PRNG can drive the
     *   permutation. Defaults to `Mulberry32`. Swap in xoshiro/PCG/etc.
     *   without modifying this file.
     * - `NoiseInterpolator` injection: defaults to `PerlinFadeInterpolator`,
     *   but can be swapped for any scalar fade-and-blend.
     *
     * Output range
     * ------------
     * On a unit cell, |g·d| ≤ √(D/2). We divide by √(D/2) so a single octave
     * lands in approximately [−1, 1]. A final clamp guards floating-point
     * slack from the fade.
     */
    class PerlinNoise {
        // --- Configuration ----------------------------------------------------
        dim;
        frequency = 1;
        amplitude = 1;
        /** 1 / sqrt(D/2): scales raw output to ~[−1, 1]. */
        singleOctaveNorm;
        // --- Injected collaborators ------------------------------------------
        rng;
        interpolator;
        // --- Permutation table (rebuilt on seed) -----------------------------
        /** Length-512 doubled permutation, values in [0, 255]. */
        perm;
        // --- Gradient table (precomputed for the given D) --------------------
        /**
         * Each gradient is encoded as [i, j, sign_i, sign_j]: the two
         * non-zero axes (i ≤ j) and their ±1 signs. Avoids allocating a full
         * D-vector per gradient — the dot product with offset d becomes
         * `sign_i * d[i] + sign_j * d[j]`.
         */
        gradients;
        // --- Scratch buffers (re-used per evaluate call) ---------------------
        intCoords;
        fracCoords;
        cornerCoords;
        cornerOffset;
        cornerValues;
        /**
         * @param dimension     Fixed dimensionality D.
         * @param options.seed  Optional seed (default 0). Ignored if `rng`
         *                      is passed — the caller's RNG is used as-is.
         * @param options.rng   Optional `IRandomCore` driving the permutation
         *                      table. Defaults to `Mulberry32`.
         * @param options.interpolator
         *                      Optional `NoiseInterpolator` for the fade-
         *                      and-blend step. Defaults to
         *                      `PerlinFadeInterpolator`.
         * @param options.noise Optional initial parameters. Only `frequency`
         *                      and `amplitude` are honored — octave-shape
         *                      knobs belong on `FBMNoise`.
         */
        constructor(dimension, options = {}) {
            if (!Number.isInteger(dimension) || dimension < 1) {
                throw new Error(`PerlinNoise dimension must be a positive integer, got ${dimension}`);
            }
            this.dim = dimension;
            this.singleOctaveNorm = 1 / Math.sqrt(dimension / 2);
            this.intCoords = new Int32Array(dimension);
            this.fracCoords = new Float64Array(dimension);
            this.cornerCoords = new Int32Array(dimension);
            this.cornerOffset = new Float64Array(dimension);
            const cornerCount = 1 << dimension;
            if (dimension > 20) {
                throw new Error(`PerlinNoise: D=${dimension} is impractical (2^D=${cornerCount} corners per evaluation). ` +
                    `Consider Simplex noise for high dimensions.`);
            }
            this.cornerValues = new Float64Array(cornerCount);
            this.gradients = PerlinNoise.buildGradientTable(dimension);
            this.rng = options.rng ?? new Mulberry32(options.seed ?? 0);
            this.interpolator =
                options.interpolator ?? new PerlinFadeInterpolator();
            if (options.noise)
                this.configure(options.noise);
            // Build the permutation from the RNG's *current* state. If a
            // pre-seeded RNG was passed, we don't second-guess it.
            this.perm = PerlinNoise.buildPermutation(this.rng);
        }
        // ---------------------------------------------------------------------
        // Public API
        // ---------------------------------------------------------------------
        /**
         * Evaluate single-octave Perlin noise at `point`. Result is in
         * [−1, 1] (modulo the configured `amplitude`, which is then clamped).
         */
        evaluate(point) {
            if (point.dimension !== this.dim) {
                throw new Error(`PerlinNoise<${this.dim}>: point has dimension ${point.dimension}`);
            }
            return clamp11(this.amplitude * this.sampleSingleOctave(point, this.frequency));
        }
        /**
         * Re-seed the underlying RNG and rebuild the permutation table. Same
         * seed ⇒ identical output, given the same RNG implementation.
         */
        seed(seed) {
            this.rng.setSeed(seed);
            this.perm = PerlinNoise.buildPermutation(this.rng);
        }
        configure(options) {
            if (options.frequency !== undefined) {
                if (!Number.isFinite(options.frequency) || options.frequency <= 0) {
                    throw new Error(`frequency must be > 0, got ${options.frequency}`);
                }
                this.frequency = options.frequency;
            }
            if (options.amplitude !== undefined) {
                if (!Number.isFinite(options.amplitude)) {
                    throw new Error(`amplitude must be finite, got ${options.amplitude}`);
                }
                this.amplitude = options.amplitude;
            }
            // octaves/persistence/lacunarity are intentionally ignored. They
            // belong on the FBMNoise wrapper.
        }
        /**
         * Returns the gradient vector selected at the given integer lattice
         * point. Mainly for inspection — the inner loop of `evaluate` uses
         * the encoded form directly to skip allocation.
         */
        getGradient(point) {
            if (point.dimension !== this.dim) {
                throw new Error(`PerlinNoise<${this.dim}>: point has dimension ${point.dimension}`);
            }
            const integerCoords = new Int32Array(this.dim);
            for (let k = 0; k < this.dim; k++) {
                integerCoords[k] = Math.floor(point.get(k));
            }
            const g = this.gradients[this.cornerHash(integerCoords) % this.gradients.length];
            const out = new Float64Array(this.dim);
            out[g[0]] = g[2];
            out[g[1]] = g[3];
            return new point.constructor(out);
        }
        // ---------------------------------------------------------------------
        // Core: single-octave noise sample
        // ---------------------------------------------------------------------
        sampleSingleOctave(point, freq) {
            const D = this.dim;
            // Step 1: scaled coordinates → integer base + fractional. Note
            // that fade is now applied *inside* the interpolator, so we no
            // longer pre-compute a fade table.
            for (let k = 0; k < D; k++) {
                const x = point.get(k) * freq;
                const i = Math.floor(x);
                this.intCoords[k] = i;
                this.fracCoords[k] = x - i;
            }
            // Step 2: gradient·offset for each of the 2^D corners. Bit `k`
            // of `c` selects low (0) or high (1) corner along axis k.
            const cornerCount = 1 << D;
            for (let c = 0; c < cornerCount; c++) {
                for (let k = 0; k < D; k++) {
                    const bit = (c >> k) & 1;
                    this.cornerCoords[k] = this.intCoords[k] + bit;
                    this.cornerOffset[k] = this.fracCoords[k] - bit;
                }
                const g = this.gradients[this.cornerHash(this.cornerCoords) % this.gradients.length];
                this.cornerValues[c] =
                    g[2] * this.cornerOffset[g[0]] +
                        g[3] * this.cornerOffset[g[1]];
            }
            // Step 3: D-linear interpolation. Fold the 2^D buffer in halves,
            // one axis per pass, delegating each pairwise blend to the
            // injected NoiseInterpolator (which is responsible for any fade).
            let stride = 1;
            for (let k = 0; k < D; k++) {
                const t = this.fracCoords[k];
                const blockStride = stride << 1;
                for (let base = 0; base < cornerCount; base += blockStride) {
                    for (let off = 0; off < stride; off++) {
                        const lo = this.cornerValues[base + off];
                        const hi = this.cornerValues[base + off + stride];
                        this.cornerValues[base + off] =
                            this.interpolator.interpolate(lo, hi, t);
                    }
                }
                stride = blockStride;
            }
            return this.cornerValues[0] * this.singleOctaveNorm;
        }
        // ---------------------------------------------------------------------
        // Hashing
        // ---------------------------------------------------------------------
        /**
         * Fold D integer coordinates through the permutation table. Each
         * coordinate is masked to [0,255]; `& 0xff` correctly handles
         * negatives under JS's unsigned bitwise semantics.
         */
        cornerHash(coords) {
            let h = 0;
            const p = this.perm;
            for (let k = 0; k < this.dim; k++) {
                h = p[(h + (coords[k] & 0xff)) & 0xff];
            }
            return h;
        }
        // ---------------------------------------------------------------------
        // Static helpers
        // ---------------------------------------------------------------------
        /**
         * Build the 2·D·(D−1) gradient table for dimension D. For D=1 this
         * degenerates to {−1, +1} encoded as (axis 0, axis 0, ±1, 0) — the
         * second term contributes nothing because its sign is 0.
         */
        static buildGradientTable(d) {
            if (d === 1) {
                return [
                    [0, 0, +1, 0],
                    [0, 0, -1, 0],
                ];
            }
            const out = [];
            for (let i = 0; i < d; i++) {
                for (let j = i + 1; j < d; j++) {
                    out.push([i, j, +1, +1]);
                    out.push([i, j, +1, -1]);
                    out.push([i, j, -1, +1]);
                    out.push([i, j, -1, -1]);
                }
            }
            return out;
        }
        /**
         * Build the classic 256-entry permutation, then duplicate to length
         * 512. Driven by an arbitrary `IRandomCore` so any PRNG can be used.
         */
        static buildPermutation(rng) {
            const base = new Uint8Array(256);
            for (let i = 0; i < 256; i++)
                base[i] = i;
            // Fisher–Yates
            for (let i = 255; i > 0; i--) {
                const j = Math.floor(rng.random() * (i + 1));
                const tmp = base[i];
                base[i] = base[j];
                base[j] = tmp;
            }
            const doubled = new Uint8Array(512);
            doubled.set(base, 0);
            doubled.set(base, 256);
            return doubled;
        }
    }
    // =========================================================================
    // Helpers
    // =========================================================================
    function clamp11(x) {
        return x < -1 ? -1 : x > 1 ? 1 : x;
    }

    // =========================================================================
    // SimplexNoise — single-octave gradient noise only
    // =========================================================================
    /**
     * N-dimensional Simplex Noise (single octave) for D ∈ {2, 3, 4}.
     *
     * Implementation of Ken Perlin's simplex noise following the standard
     * reference formulation (see Gustavson, "Simplex noise demystified",
     * 2005). Multi-octave / fractal Brownian motion is intentionally NOT
     * handled here — wrap an instance in `OctaveNoiseGenerator<D>` for
     * that, exactly as you would with `PerlinNoise<D>`.
     *
     * Why single-octave only
     * ----------------------
     * Embedding an octave loop inside the noise itself duplicates
     * `OctaveNoiseGenerator`'s job and prevents clean composition with
     * `CompositeNoiseGenerator` (each composed layer would be running its
     * own fBm). Single-octave keeps responsibilities clean and matches
     * `PerlinNoise<D>`.
     *
     * Algorithm sketch (per evaluation point p ∈ ℝ^D, D ∈ {2,3,4}):
     *   1. Skew p into a coordinate system where the simplex shape becomes
     *      an axis-aligned unit cube cell.
     *   2. Locate the integer lattice cell and unskew the cell origin back
     *      to regular space; compute the offset from that origin to p.
     *   3. Determine which of D! simplex sub-cells contains p by sorting
     *      the offset coordinates in descending order — this gives a path
     *      of D unit steps from the origin corner to the opposite corner.
     *   4. For each of the D+1 corners on that path, hash the corner's
     *      integer coordinates through a seeded permutation to pick a
     *      gradient, compute a radially-falling contribution, and sum.
     *   5. Scale by the standard per-D normalization constant.
     *
     * Output range
     * ------------
     * Result is approximately [-1, 1]. A final clamp guards floating-point
     * slack.
     */
    class SimplexNoise {
        frequency = 1.0;
        amplitude = 1.0;
        dimension;
        VectorClass;
        rng;
        /** Length-512 doubled permutation, values in [0, 255]. */
        perm;
        // Skew / unskew factors per dimension (Gustavson)
        static SKEWING_FACTORS = {
            2: 0.5 * (Math.sqrt(3.0) - 1.0),
            3: 1.0 / 3.0,
            4: (Math.sqrt(5.0) - 1.0) / 4.0,
        };
        static UNSKEWING_FACTORS = {
            2: (3.0 - Math.sqrt(3.0)) / 6.0,
            3: 1.0 / 6.0,
            4: (5.0 - Math.sqrt(5.0)) / 20.0,
        };
        /**
         * Per-dimension output scaling. Standard literature constants that
         * bring raw simplex output into approximately [-1, 1].
         */
        static OUTPUT_SCALE = {
            2: 70.0,
            3: 32.0,
            4: 27.0,
        };
        /** Squared radius of each corner's influence sphere. */
        static CORNER_RADIUS_SQ = {
            2: 0.5,
            3: 0.6,
            4: 0.6,
        };
        /**
         * Fixed gradient set per dimension. Each row is a unit-ish vector
         * with small integer components. Hashing into this table is what
         * gives each integer lattice cell its own gradient.
         *
         * 2D: 8 directions (axis-aligned + diagonals).
         * 3D: 12 mid-edge vectors of a cube.
         * 4D: 32 vectors with one zero component and three ±1s.
         */
        static GRADIENTS = {
            2: [
                [1, 1], [-1, 1], [1, -1], [-1, -1],
                [1, 0], [-1, 0], [0, 1], [0, -1],
            ],
            3: [
                [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
                [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
                [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
            ],
            4: [
                [0, 1, 1, 1], [0, 1, 1, -1], [0, 1, -1, 1], [0, 1, -1, -1],
                [0, -1, 1, 1], [0, -1, 1, -1], [0, -1, -1, 1], [0, -1, -1, -1],
                [1, 0, 1, 1], [1, 0, 1, -1], [1, 0, -1, 1], [1, 0, -1, -1],
                [-1, 0, 1, 1], [-1, 0, 1, -1], [-1, 0, -1, 1], [-1, 0, -1, -1],
                [1, 1, 0, 1], [1, 1, 0, -1], [1, -1, 0, 1], [1, -1, 0, -1],
                [-1, 1, 0, 1], [-1, 1, 0, -1], [-1, -1, 0, 1], [-1, -1, 0, -1],
                [1, 1, 1, 0], [1, 1, -1, 0], [1, -1, 1, 0], [1, -1, -1, 0],
                [-1, 1, 1, 0], [-1, 1, -1, 0], [-1, -1, 1, 0], [-1, -1, -1, 0],
            ],
        };
        skewFactor;
        unskewFactor;
        outputScale;
        cornerRadiusSq;
        gradients;
        // Scratch buffers reused per evaluate
        intCoords;
        fracCoords;
        cornerInt;
        cornerOffset;
        cornerStep;
        constructor(dimension, rng) {
            if (![2, 3, 4].includes(dimension)) {
                throw new Error(`SimplexNoise only supports 2, 3, or 4 dimensions. Got: ${dimension}`);
            }
            this.dimension = dimension;
            this.VectorClass = Vector.forDimension(dimension);
            this.rng = rng;
            const d = dimension;
            this.skewFactor = SimplexNoise.SKEWING_FACTORS[d];
            this.unskewFactor = SimplexNoise.UNSKEWING_FACTORS[d];
            this.outputScale = SimplexNoise.OUTPUT_SCALE[d];
            this.cornerRadiusSq = SimplexNoise.CORNER_RADIUS_SQ[d];
            this.gradients = SimplexNoise.GRADIENTS[d];
            this.intCoords = new Int32Array(d);
            this.fracCoords = new Float64Array(d);
            this.cornerInt = new Int32Array(d);
            this.cornerOffset = new Float64Array(d);
            this.cornerStep = new Int32Array(d);
            this.perm = SimplexNoise.buildPermutation(this.rng);
        }
        seed(seed) {
            this.rng.setSeed(seed);
            this.perm = SimplexNoise.buildPermutation(this.rng);
        }
        configure(options) {
            if (options.frequency !== undefined) {
                if (!Number.isFinite(options.frequency) || options.frequency <= 0) {
                    throw new Error(`frequency must be > 0, got ${options.frequency}`);
                }
                this.frequency = options.frequency;
            }
            if (options.amplitude !== undefined) {
                if (!Number.isFinite(options.amplitude)) {
                    throw new Error(`amplitude must be finite, got ${options.amplitude}`);
                }
                this.amplitude = options.amplitude;
            }
            // octaves/persistence/lacunarity are intentionally ignored. They
            // belong on the OctaveNoiseGenerator wrapper.
        }
        evaluate(point) {
            if (point.dimension !== this.dimension) {
                throw new Error(`SimplexNoise<${this.dimension}>: point has dimension ${point.dimension}`);
            }
            const D = this.dimension;
            // Step 1: scaled coordinates, then skew into simplex grid.
            let coordSum = 0;
            for (let k = 0; k < D; k++) {
                const x = point.get(k) * this.frequency;
                this.fracCoords[k] = x; // temporarily holds scaled coord
                coordSum += x;
            }
            const skew = coordSum * this.skewFactor;
            // Integer base cell in skewed space.
            let intSum = 0;
            for (let k = 0; k < D; k++) {
                const i = Math.floor(this.fracCoords[k] + skew);
                this.intCoords[k] = i;
                intSum += i;
            }
            // Unskew back: offset from cell origin in real space.
            const unskew = intSum * this.unskewFactor;
            for (let k = 0; k < D; k++) {
                // fracCoords currently holds the *scaled* point coordinate;
                // (intCoords[k] - unskew) is the cell origin in real space.
                this.fracCoords[k] = this.fracCoords[k] - (this.intCoords[k] - unskew);
            }
            // Step 2: determine simplex traversal — sort axis indices by
            // fractional offset descending. Walk from corner 0 to corner D
            // by setting one extra axis to 1 at each step, in that order.
            // Use a tiny insertion sort: D is at most 4.
            const order = [0, 1, 2, 3].slice(0, D);
            // sort by fracCoords descending
            for (let a = 1; a < D; a++) {
                const key = order[a];
                const keyVal = this.fracCoords[key];
                let b = a - 1;
                while (b >= 0 && this.fracCoords[order[b]] < keyVal) {
                    order[b + 1] = order[b];
                    b--;
                }
                order[b + 1] = key;
            }
            // Step 3: accumulate contributions from each of D+1 corners.
            for (let k = 0; k < D; k++)
                this.cornerStep[k] = 0;
            let total = 0;
            const r2 = this.cornerRadiusSq;
            for (let corner = 0; corner <= D; corner++) {
                // After the loop we've added `corner` unit steps in the
                // sorted axis order. The offset from THIS corner back to
                // the sample point, in real (unskewed) space, is:
                //   d_k = frac_k - cornerStep_k + corner * G
                // where G is the unskew factor (because each axis step in
                // skewed space corresponds to an offset of G in real
                // space along every axis).
                const cornerUnskew = corner * this.unskewFactor;
                let lenSq = 0;
                for (let k = 0; k < D; k++) {
                    const d = this.fracCoords[k] - this.cornerStep[k] + cornerUnskew;
                    this.cornerOffset[k] = d;
                    lenSq += d * d;
                }
                let t = r2 - lenSq;
                if (t > 0) {
                    // Hash this corner's integer lattice coordinates to pick a gradient
                    let hashCoords = 0;
                    for (let k = 0; k < D; k++) {
                        this.cornerInt[k] = this.intCoords[k] + this.cornerStep[k];
                        hashCoords = this.perm[(hashCoords + (this.cornerInt[k] & 0xff)) & 0xff];
                    }
                    const g = this.gradients[hashCoords % this.gradients.length];
                    // gradient · offset
                    let dot = 0;
                    for (let k = 0; k < D; k++)
                        dot += g[k] * this.cornerOffset[k];
                    t *= t; // t^2
                    total += t * t * dot; // t^4 * (g·d)
                }
                // Advance one step along the simplex path for the next corner.
                if (corner < D) {
                    this.cornerStep[order[corner]] += 1;
                }
            }
            const raw = total * this.outputScale;
            const result = this.amplitude * raw;
            return result < -1 ? -1 : result > 1 ? 1 : result;
        }
        /**
         * Returns the gradient vector assigned to the integer lattice cell
         * containing `point`. Mainly for inspection.
         */
        getGradient(point) {
            if (point.dimension !== this.dimension) {
                throw new Error(`SimplexNoise<${this.dimension}>: point has dimension ${point.dimension}`);
            }
            const D = this.dimension;
            let coordSum = 0;
            for (let k = 0; k < D; k++)
                coordSum += point.get(k) * this.frequency;
            const skew = coordSum * this.skewFactor;
            let h = 0;
            for (let k = 0; k < D; k++) {
                const i = Math.floor(point.get(k) * this.frequency + skew);
                h = this.perm[(h + (i & 0xff)) & 0xff];
            }
            const g = this.gradients[h % this.gradients.length];
            return new this.VectorClass(g.slice());
        }
        /**
         * Build the classic 256-entry permutation, then duplicate to length
         * 512. Driven by the injected RNG so the same seed gives the same
         * permutation.
         */
        static buildPermutation(rng) {
            const base = new Uint8Array(256);
            for (let i = 0; i < 256; i++)
                base[i] = i;
            // Fisher–Yates
            for (let i = 255; i > 0; i--) {
                const j = Math.floor(rng.random() * (i + 1));
                const tmp = base[i];
                base[i] = base[j];
                base[j] = tmp;
            }
            const doubled = new Uint8Array(512);
            doubled.set(base, 0);
            doubled.set(base, 256);
            return doubled;
        }
    }

    /**
     * A cellular noise generator that implements Worley noise (also known as
     * Voronoi noise) — **single octave only**.
     *
     * @description
     * Worley noise was introduced by Steven Worley in 1996. It generates
     * cellular-looking patterns by computing distances to randomly placed
     * feature points: for each evaluation point, find the nearest feature
     * points and combine their distances into a noise value. This produces
     * organic patterns useful for stone, water, and cellular textures.
     *
     * @summary
     * This implementation supports:
     * - Multiple distance metrics (Euclidean, Manhattan, Chebyshev)
     * - Multi-dimensional noise generation (2D, 3D)
     * - Deterministic seeding for reproducible results
     *
     * Multi-octave / fractal Brownian motion is intentionally NOT handled
     * here. For fBm, wrap an instance in `OctaveNoiseGenerator<D>`, exactly
     * as you would with `PerlinNoise<D>` or `SimplexNoise<D>`. This keeps
     * `WorleyNoise` composable with `CompositeNoiseGenerator` without an
     * octave loop running inside each composed layer.
     *
     * @example
     * ```typescript
     * // Single-octave Worley
     * const noise = new WorleyNoise(2, rng);
     * noise.configure({ frequency: 1.0, amplitude: 1.0 });
     * const value = noise.evaluate(new Vector2([0.5, 0.5]));
     *
     * // Fractal Worley via OctaveNoiseGenerator
     * const fractal = new OctaveNoiseGenerator(2, noise, {
     *   octaves: 4, persistence: 0.5, lacunarity: 2.0,
     * });
     * ```
     *
     * @remark
     * The implementation uses a grid-based approach to efficiently locate
     * nearest feature points: each cell holds one feature point and only
     * the cell containing the query plus its immediate neighbors are
     * searched. This gives O(1) work per evaluation regardless of total
     * space size.
     */
    class WorleyNoise {
        frequency = 1;
        amplitude = 1;
        distanceMetric;
        VectorClass;
        rng;
        featurePoints;
        /**
         * Creates a new Worley noise generator for the specified dimension.
         *
         * @param dimension - The number of dimensions for the noise (2 or 3)
         * @param random - Random number generator implementation
         * @throws {Error} If dimension is not 2 or 3
         */
        constructor(dimension, random) {
            this.VectorClass = Vector.forDimension(dimension);
            this.rng = random;
            this.featurePoints = new Map();
            // Default to Euclidean distance
            this.distanceMetric = this.euclideanDistance;
        }
        /**
         * Sets the seed for the random number generator.
         *
         * @param seed - The seed value for the RNG
         * @remarks
         * Setting a seed ensures reproducible noise patterns. The same seed
         * with the same parameters always generates the same pattern.
         */
        seed(seed) {
            this.rng.setSeed(seed);
            this.featurePoints.clear();
        }
        /**
         * Calculates the Euclidean distance between two points.
         *
         * @param a - First point
         * @param b - Second point
         * @returns The Euclidean distance between points a and b
         * @private
         */
        euclideanDistance(a, b) {
            return a.subtract(b).length();
        }
        /**
         * Sets the distance metric used for calculating distances between points.
         *
         * @param metric - Function that takes two Vector<D> parameters and returns their distance
         * @example
         * ```typescript
         * // Use Manhattan distance instead of default Euclidean
         * noise.setDistanceMetric(noise.manhattanDistance);
         * ```
         */
        setDistanceMetric(metric) {
            this.distanceMetric = metric;
        }
        /**
         * Converts a point's coordinates to cell coordinates based on current frequency.
         *
         * @param point - The point to convert
         * @returns Array of cell coordinates
         * @private
         */
        getCellCoordinates(point) {
            const coords = [];
            for (let i = 0; i < point.dimension; i++) {
                coords.push(Math.floor(point.get(i) * this.frequency));
            }
            return coords;
        }
        /**
         * Generates a unique string key for cell coordinates.
         *
         * @param coords - Array of cell coordinates
         * @returns String key representing the cell coordinates
         * @private
         */
        getCellKey(coords) {
            return coords.join(',');
        }
        /**
         * Generates or retrieves feature points for a given cell.
         *
         * @param cellCoords - The cell coordinates
         * @returns Array of feature points for the cell
         * @private
         * @remarks
         * Feature points are cached in the featurePoints map for reuse.
         */
        generateFeaturePointsForCell(cellCoords) {
            const key = this.getCellKey(cellCoords);
            if (this.featurePoints.has(key)) {
                return this.featurePoints.get(key);
            }
            const points = [];
            const numPoints = 1; // Can be adjusted for different noise patterns
            for (let i = 0; i < numPoints; i++) {
                const coords = new Float64Array(cellCoords.length);
                for (let j = 0; j < cellCoords.length; j++) {
                    coords[j] = (cellCoords[j] + this.rng.random()) / this.frequency;
                }
                points.push(new this.VectorClass(coords));
            }
            this.featurePoints.set(key, points);
            return points;
        }
        /**
         * Gets the coordinates of all neighboring cells.
         *
         * @param cellCoords - The cell coordinates
         * @returns Array of neighboring cell coordinates
         * @private
         * @remarks
         * Includes all 8 neighbors for 2D or 26 neighbors for 3D, plus the cell itself.
         */
        getNeighborCells(cellCoords) {
            const neighbors = [];
            const dim = cellCoords.length;
            // Generate all neighboring cell coordinates
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (dim === 2) {
                        neighbors.push([cellCoords[0] + i, cellCoords[1] + j]);
                    }
                    else if (dim === 3) {
                        for (let k = -1; k <= 1; k++) {
                            neighbors.push([
                                cellCoords[0] + i,
                                cellCoords[1] + j,
                                cellCoords[2] + k,
                            ]);
                        }
                    }
                }
            }
            return neighbors;
        }
        /**
         * Finds the distances to the nearest feature points.
         *
         * @param point - The point to find nearest feature points for
         * @param count - Number of nearest feature points to find
         * @returns Array of distances to the nearest feature points, sorted ascending
         */
        getNearestFeaturePoints(point, count) {
            const cellCoords = this.getCellCoordinates(point);
            const neighborCells = this.getNeighborCells(cellCoords);
            const distances = [];
            // Collect feature points from current and neighboring cells
            for (const cell of neighborCells) {
                const featurePoints = this.generateFeaturePointsForCell(cell);
                for (const featurePoint of featurePoints) {
                    const distance = this.distanceMetric(point, featurePoint);
                    distances.push(distance);
                }
            }
            // Sort distances and return the nearest 'count' points
            return distances.sort((a, b) => a - b).slice(0, count);
        }
        /**
         * Evaluates the noise value at the given point (single octave).
         *
         * @param point - The point to evaluate noise at
         * @returns Noise value in the range [-1, 1]
         * @example
         * ```typescript
         * const value = noise.evaluate(new Vector2([0.5, 0.5]));
         * ```
         * @remarks
         * Uses the classic `F2 - F1` formulation (difference between the
         * distances to the second-nearest and nearest feature points),
         * mapped from approximately [0, 1] to [-1, 1]. For multi-octave
         * fractal output, wrap this in `OctaveNoiseGenerator`.
         */
        evaluate(point) {
            const scaledPoint = point.scale(this.frequency);
            const [f1, f2] = this.getNearestFeaturePoints(scaledPoint, 2);
            // F2 - F1 gives more interesting patterns than just F1.
            // Raw range is roughly [0, 1]; map to [-1, 1] and scale by amplitude.
            const raw = (f2 - f1) * 2 - 1;
            const result = this.amplitude * raw;
            return result < -1 ? -1 : result > 1 ? 1 : result;
        }
        /**
         * Configures the noise generator parameters.
         *
         * @param options - Configuration options
         * @param options.frequency - Base frequency of the noise (must be > 0)
         * @param options.amplitude - Base amplitude of the noise (must be finite)
         * @remarks
         * `octaves`, `persistence`, and `lacunarity` are intentionally
         * ignored. They belong on `OctaveNoiseGenerator`, which can wrap
         * this generator for fractal output.
         */
        configure(options) {
            if (options.frequency !== undefined) {
                if (!Number.isFinite(options.frequency) || options.frequency <= 0) {
                    throw new Error(`frequency must be > 0, got ${options.frequency}`);
                }
                this.frequency = options.frequency;
            }
            if (options.amplitude !== undefined) {
                if (!Number.isFinite(options.amplitude)) {
                    throw new Error(`amplitude must be finite, got ${options.amplitude}`);
                }
                this.amplitude = options.amplitude;
            }
            // octaves/persistence/lacunarity are intentionally ignored. They
            // belong on the OctaveNoiseGenerator wrapper.
        }
    }

    var index$7 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        BitangentNoise3D: BitangentNoise3D,
        BitangentNoise4D: BitangentNoise4D,
        BlueNoiseGenerator: BlueNoiseGenerator,
        CompositeNoiseGenerator: CompositeNoiseGenerator,
        CurlNoiseField: CurlNoiseField,
        JitteredGridNoise: JitteredGridNoise,
        OctaveNoiseGenerator: OctaveNoiseGenerator,
        OffsetNoise: OffsetNoise,
        PerlinNoise: PerlinNoise,
        SimplexNoise: SimplexNoise,
        WorleyNoise: WorleyNoise
    });

    /**
     * Packs non-overlapping circles with arbitrary radii into a 2D region via
     * grid-accelerated dart-throwing. For each circle in input order, a random
     * position is sampled up to `maxAttempts` times; the first position that
     * avoids every existing circle is accepted.
     *
     * **Ordering matters.** Large circles are harder to place, so packing
     * largest-first typically achieves much higher density. The packer does not
     * sort — pass radii in the order you want them tried.
     *
     * **Uniform-radius case.** If all your circles have the same radius, use
     * `PoissonDiskSampler` with `minDistance = 2*r` instead. It's both simpler
     * and achieves better fill via its annulus-around-parent strategy.
     *
     * @example
     * ```typescript
     * const V2 = Vector.forDimension(2);
     * const packer = new CirclePacker({
     *     bounds: { min: new V2([0, 0]), max: new V2([100, 100]) },
     * });
     * const radii = [20, 15, 15, 10, 10, 10, 5, 5, 5, 5]; // sorted largest-first
     * const { distribution, unplaced } = packer.pack(radii);
     * // distribution.elements: Placement<2, Circle>[]
     * ```
     */
    class CirclePacker {
        bounds;
        maxAttempts;
        rng;
        fullyContained;
        initialCircles;
        VectorClass;
        constructor(config) {
            if (config.bounds.min.dimension !== 2 || config.bounds.max.dimension !== 2) {
                throw new Error('CirclePacker requires 2D bounds');
            }
            for (let i = 0; i < 2; i++) {
                if (config.bounds.max.get(i) <= config.bounds.min.get(i)) {
                    throw new Error(`bounds.max[${i}] (${config.bounds.max.get(i)}) must exceed bounds.min[${i}] (${config.bounds.min.get(i)})`);
                }
            }
            this.bounds = config.bounds;
            this.maxAttempts = config.maxAttempts ?? 30;
            this.fullyContained = config.fullyContained ?? true;
            this.initialCircles = config.initialCircles ?? [];
            this.VectorClass = config.bounds.min.constructor;
            for (const c of this.initialCircles) {
                if (c.radius <= 0 || !Number.isFinite(c.radius)) {
                    throw new Error(`initial circle has invalid radius: ${c.radius}`);
                }
                if (c.position.dimension !== 2) {
                    throw new Error('initial circle position must be 2D');
                }
                if (!this.isInBounds(c.position, c.radius)) {
                    throw new Error(`initial circle at (${c.position.get(0)}, ${c.position.get(1)}) with radius ${c.radius} is out of bounds`);
                }
            }
            const rngCore = config.rng;
            this.rng = rngCore ? () => rngCore.random() : Math.random;
        }
        /**
         * Pack circles with the given radii. Returns the resulting distribution
         * and any radii that could not be placed. Does not mutate the packer —
         * each call is an independent packing.
         */
        pack(radii) {
            for (let i = 0; i < radii.length; i++) {
                if (radii[i] <= 0 || !Number.isFinite(radii[i])) {
                    throw new Error(`radii[${i}] is invalid: ${radii[i]}`);
                }
            }
            // Determine the largest radius we'll ever have to accommodate, from
            // both initial circles and the incoming list. This sets cell size and
            // the neighborhood scan radius.
            let rMax = 0;
            for (const r of radii)
                if (r > rMax)
                    rMax = r;
            for (const c of this.initialCircles)
                if (c.radius > rMax)
                    rMax = c.radius;
            const elements = [];
            const unplaced = [];
            if (rMax === 0) {
                // No circles to pack, no initial circles — empty distribution.
                return { distribution: { elements, bounds: this.bounds }, unplaced };
            }
            // Grid setup. cellSize = rMax means any two circles' centers that
            // conflict must sit in cells within ±ceil((r + rMax)/cellSize) + 1 of
            // each other — for r ≤ rMax, at most ±3. Each cell holds a list of
            // element indices since many small circles can share a cell.
            const cellSize = rMax;
            const extentX = this.bounds.max.get(0) - this.bounds.min.get(0);
            const extentY = this.bounds.max.get(1) - this.bounds.min.get(1);
            const gridW = Math.max(1, Math.ceil(extentX / cellSize));
            const gridH = Math.max(1, Math.ceil(extentY / cellSize));
            const grid = new Array(gridW * gridH);
            for (let i = 0; i < grid.length; i++)
                grid[i] = [];
            const addCircle = (position, radius) => {
                const idx = elements.length;
                elements.push({ id: idx, position, shape: { radius } });
                const cx = Math.min(gridW - 1, Math.max(0, Math.floor((position.get(0) - this.bounds.min.get(0)) / cellSize)));
                const cy = Math.min(gridH - 1, Math.max(0, Math.floor((position.get(1) - this.bounds.min.get(1)) / cellSize)));
                grid[cy * gridW + cx].push(idx);
            };
            // Initial circles are trusted; we only checked bounds in the constructor.
            for (const c of this.initialCircles) {
                addCircle(c.position, c.radius);
            }
            // Pack requested radii in input order.
            for (let i = 0; i < radii.length; i++) {
                const r = radii[i];
                let placed = false;
                for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
                    const pos = this.sampleRandomPosition(r);
                    if (this.canPlace(pos, r, elements, grid, gridW, gridH, cellSize, rMax)) {
                        addCircle(pos, r);
                        placed = true;
                        break;
                    }
                }
                if (!placed)
                    unplaced.push(r);
            }
            return { distribution: { elements, bounds: this.bounds }, unplaced };
        }
        isInBounds(position, radius) {
            const margin = this.fullyContained ? radius : 0;
            for (let i = 0; i < 2; i++) {
                const v = position.get(i);
                if (v < this.bounds.min.get(i) + margin)
                    return false;
                if (v > this.bounds.max.get(i) - margin)
                    return false;
            }
            return true;
        }
        sampleRandomPosition(radius) {
            const margin = this.fullyContained ? radius : 0;
            const coords = new Float64Array(2);
            for (let i = 0; i < 2; i++) {
                const lo = this.bounds.min.get(i) + margin;
                const hi = this.bounds.max.get(i) - margin;
                coords[i] = lo + this.rng() * (hi - lo);
            }
            return new this.VectorClass(coords);
        }
        /**
         * True if a circle of `radius` at `position` conflicts with no existing
         * circle. Checks a neighborhood large enough to catch any circle whose
         * extent could reach the candidate, given that cells may contain circles
         * positioned anywhere within them.
         */
        canPlace(position, radius, elements, grid, gridW, gridH, cellSize, rMax) {
            // +1 accounts for the fact that centers may lie anywhere within their
            // cell — two cells at offset N are still up to N+1 cell-widths apart
            // in the worst case along one axis.
            const checkRadius = Math.ceil((radius + rMax) / cellSize) + 1;
            const cx = Math.floor((position.get(0) - this.bounds.min.get(0)) / cellSize);
            const cy = Math.floor((position.get(1) - this.bounds.min.get(1)) / cellSize);
            const px = position.get(0);
            const py = position.get(1);
            for (let dy = -checkRadius; dy <= checkRadius; dy++) {
                const gy = cy + dy;
                if (gy < 0 || gy >= gridH)
                    continue;
                for (let dx = -checkRadius; dx <= checkRadius; dx++) {
                    const gx = cx + dx;
                    if (gx < 0 || gx >= gridW)
                        continue;
                    const cell = grid[gy * gridW + gx];
                    for (let k = 0; k < cell.length; k++) {
                        const other = elements[cell[k]];
                        const ox = other.position.get(0) - px;
                        const oy = other.position.get(1) - py;
                        const distSq = ox * ox + oy * oy;
                        const minDist = radius + other.shape.radius;
                        if (distSq < minDist * minDist)
                            return false;
                    }
                }
            }
            return true;
        }
    }

    // ─── Implementation ──────────────────────────────────────────────────────────
    /**
     * 2D bin packer using the MaxRects algorithm (Jylänki, 2010). Packs arbitrary
     * rectangles into one or more fixed-size bins, producing a `SpatialDistribution`
     * per bin with placements anchored at top-left in bin-local coordinates.
     *
     * Complexity is roughly O(n · m²) per bin where n is the item count and m is
     * the number of maximal free rectangles (typically O(n) in the worst case).
     * Fine for hundreds to a few thousand items; for larger batches consider a
     * skyline or guillotine packer.
     *
     * @example
     * ```typescript
     * const packer = new BinPacker({ binSize: { width: 256, height: 256 } });
     * const { bins, unplaced } = packer.pack([
     *     { width: 64, height: 64 },
     *     { width: 100, height: 50 },
     *     // ...
     * ]);
     * // bins[0].elements: Placement<2, Rectangle>[]
     * // bins[0].bounds:   { min: (0,0), max: (256,256) }
     * ```
     */
    class BinPacker {
        binW;
        binH;
        heuristic;
        sortBy;
        maxBins;
        VectorClass;
        binMin;
        binMax;
        constructor(config) {
            const { width, height } = config.binSize;
            if (!(width > 0) || !Number.isFinite(width)) {
                throw new Error('binSize.width must be a positive finite number');
            }
            if (!(height > 0) || !Number.isFinite(height)) {
                throw new Error('binSize.height must be a positive finite number');
            }
            if (config.maxBins !== undefined && config.maxBins < 0) {
                throw new Error('maxBins must be non-negative');
            }
            this.binW = width;
            this.binH = height;
            this.heuristic = config.heuristic ?? 'BSSF';
            this.sortBy = config.sortBy ?? 'maxSide';
            this.maxBins = config.maxBins ?? Infinity;
            this.VectorClass = Vector.forDimension(2);
            // Bounds are shared across all emitted distributions — both identical
            // and immutable, so aliasing is safe.
            this.binMin = new this.VectorClass([0, 0]);
            this.binMax = new this.VectorClass([this.binW, this.binH]);
        }
        /**
         * Pack items into bins. Items that don't fit any bin (either because they
         * exceed `binSize` or because `maxBins` is exhausted) are returned in
         * `unplaced`.
         *
         * Placement IDs are the original indices from `items`, preserving item
         * identity across internal sorting.
         */
        pack(items) {
            // Preserve original indices so Placement.id reflects input order even
            // after we sort internally.
            const indexed = items.map((item, originalIndex) => ({ item, originalIndex }));
            this.sortItems(indexed);
            const bins = [];
            const unplaced = [];
            for (const { item, originalIndex } of indexed) {
                if (!(item.width > 0) || !(item.height > 0)) {
                    throw new Error(`items[${originalIndex}] has non-positive dimensions (${item.width}×${item.height})`);
                }
                // Items larger than a bin can never fit — fast-fail.
                if (item.width > this.binW || item.height > this.binH) {
                    unplaced.push(item);
                    continue;
                }
                let placed = false;
                for (const bin of bins) {
                    if (this.tryPlace(bin, item, originalIndex)) {
                        placed = true;
                        break;
                    }
                }
                if (!placed && bins.length < this.maxBins) {
                    const newBin = this.createBin();
                    // A fresh bin is guaranteed to fit anything ≤ binSize, but we
                    // still go through tryPlace to record the placement uniformly.
                    if (this.tryPlace(newBin, item, originalIndex)) {
                        bins.push(newBin);
                        placed = true;
                    }
                }
                if (!placed)
                    unplaced.push(item);
            }
            return {
                bins: bins.map(bin => ({
                    elements: bin.placements,
                    bounds: { min: this.binMin, max: this.binMax },
                })),
                unplaced,
            };
        }
        // ─── Internals ───────────────────────────────────────────────────────────
        createBin() {
            return {
                placements: [],
                freeRects: [{ x: 0, y: 0, width: this.binW, height: this.binH }],
            };
        }
        sortItems(items) {
            switch (this.sortBy) {
                case 'none': return;
                case 'area':
                    items.sort((a, b) => b.item.width * b.item.height - a.item.width * a.item.height);
                    return;
                case 'maxSide':
                    items.sort((a, b) => Math.max(b.item.width, b.item.height) - Math.max(a.item.width, a.item.height));
                    return;
                case 'height':
                    items.sort((a, b) => b.item.height - a.item.height);
                    return;
                case 'width':
                    items.sort((a, b) => b.item.width - a.item.width);
                    return;
            }
        }
        /**
         * Find the best free rect for `item` under the active heuristic, place it
         * there, and update the free-rect list. Returns false if no free rect fits.
         */
        tryPlace(bin, item, originalIndex) {
            let bestScore1 = Infinity;
            let bestScore2 = Infinity;
            let bestIdx = -1;
            for (let i = 0; i < bin.freeRects.length; i++) {
                const fr = bin.freeRects[i];
                if (fr.width < item.width || fr.height < item.height)
                    continue;
                const [s1, s2] = this.score(fr, item);
                if (s1 < bestScore1 || (s1 === bestScore1 && s2 < bestScore2)) {
                    bestScore1 = s1;
                    bestScore2 = s2;
                    bestIdx = i;
                }
            }
            if (bestIdx === -1)
                return false;
            const target = bin.freeRects[bestIdx];
            const px = target.x;
            const py = target.y;
            bin.placements.push({
                id: originalIndex,
                position: new this.VectorClass([px, py]),
                shape: item,
            });
            this.splitAndPrune(bin.freeRects, px, py, item.width, item.height);
            return true;
        }
        /**
         * Score a free rect / item pair. Primary score tie-broken by secondary.
         * Lower is better.
         */
        score(fr, item) {
            const leftoverW = fr.width - item.width;
            const leftoverH = fr.height - item.height;
            switch (this.heuristic) {
                case 'BSSF':
                    return [Math.min(leftoverW, leftoverH), Math.max(leftoverW, leftoverH)];
                case 'BLSF':
                    return [Math.max(leftoverW, leftoverH), Math.min(leftoverW, leftoverH)];
                case 'BAF':
                    return [fr.width * fr.height - item.width * item.height,
                        Math.min(leftoverW, leftoverH)];
                case 'BL':
                    // Minimize the bottom edge of the placement, break ties by x.
                    return [fr.y + item.height, fr.x];
            }
        }
        /**
         * Clip every free rect against the placed item. A rect overlapping the
         * placement is removed and replaced by up to 4 maximal strips (above,
         * below, left, right) of the original. Afterward, any free rect fully
         * contained within another is dropped.
         */
        splitAndPrune(freeRects, x, y, w, h) {
            const x2 = x + w;
            const y2 = y + h;
            for (let i = freeRects.length - 1; i >= 0; i--) {
                const fr = freeRects[i];
                // Disjoint? Leave it alone.
                if (x >= fr.x + fr.width || x2 <= fr.x ||
                    y >= fr.y + fr.height || y2 <= fr.y)
                    continue;
                freeRects.splice(i, 1);
                // Strip above the placement (inside fr)
                if (y > fr.y) {
                    freeRects.push({ x: fr.x, y: fr.y, width: fr.width, height: y - fr.y });
                }
                // Strip below
                if (y2 < fr.y + fr.height) {
                    freeRects.push({
                        x: fr.x, y: y2,
                        width: fr.width,
                        height: fr.y + fr.height - y2
                    });
                }
                // Strip left
                if (x > fr.x) {
                    freeRects.push({ x: fr.x, y: fr.y, width: x - fr.x, height: fr.height });
                }
                // Strip right
                if (x2 < fr.x + fr.width) {
                    freeRects.push({
                        x: x2, y: fr.y,
                        width: fr.x + fr.width - x2,
                        height: fr.height
                    });
                }
            }
            // Prune fully-contained rects. Iterate backwards so splicing is cheap
            // and doesn't skip elements.
            for (let i = freeRects.length - 1; i >= 0; i--) {
                for (let j = 0; j < freeRects.length; j++) {
                    if (i === j)
                        continue;
                    if (this.isContained(freeRects[i], freeRects[j])) {
                        freeRects.splice(i, 1);
                        break;
                    }
                }
            }
        }
        isContained(a, b) {
            return a.x >= b.x && a.y >= b.y &&
                a.x + a.width <= b.x + b.width &&
                a.y + a.height <= b.y + b.height;
        }
    }

    /**
     * Two-dimensional rectangle packer using the MAXRECTS algorithm
     * (Jylänki, 2010: *A Thousand Ways to Pack the Bin*).
     *
     * Given a bin and a list of rectangles, places as many as possible without
     * overlap. Typical density on packable inputs is 80–95% depending on input
     * size variance.
     *
     * @example
     * ```typescript
     * const V2 = Vector.forDimension(2);
     * const packer = new RectanglePacker({
     *     bounds: { min: new V2([0, 0]), max: new V2([256, 256]) },
     *     allowRotation: true,
     * });
     * const { distribution, unplaced } = packer.pack([
     *     { id: 'sprite-a', width: 64, height: 32 },
     *     { id: 'sprite-b', width: 48, height: 48 },
     *     // ...
     * ]);
     * ```
     */
    class RectanglePacker {
        binWidth;
        binHeight;
        minX;
        minY;
        allowRotation;
        heuristic;
        sortInput;
        VectorClass;
        bounds;
        constructor(config) {
            const { min, max } = config.bounds;
            if (min.dimension !== 2 || max.dimension !== 2) {
                throw new Error('bounds must be 2-dimensional');
            }
            const width = max.get(0) - min.get(0);
            const height = max.get(1) - min.get(1);
            if (width <= 0 || height <= 0) {
                throw new Error('bounds.max must exceed bounds.min on both axes');
            }
            if (!Number.isFinite(width) || !Number.isFinite(height)) {
                throw new Error('bounds must have finite extent');
            }
            this.binWidth = width;
            this.binHeight = height;
            this.minX = min.get(0);
            this.minY = min.get(1);
            this.allowRotation = config.allowRotation ?? false;
            this.heuristic = config.heuristic ?? 'best-short-side';
            this.sortInput = config.sortInput ?? true;
            this.VectorClass = min.constructor;
            this.bounds = config.bounds;
        }
        /**
         * Pack the given items into the bin, producing placements and the list of
         * items that couldn't fit. Does not mutate the input array.
         */
        pack(items) {
            for (const item of items) {
                if (!Number.isFinite(item.width) || !Number.isFinite(item.height)) {
                    throw new Error(`Item has non-finite dimensions: ${JSON.stringify(item)}`);
                }
                if (item.width <= 0 || item.height <= 0) {
                    throw new Error(`Item has non-positive dimensions: ${JSON.stringify(item)}`);
                }
            }
            // Tag each item with its original index so we can default id to it
            // even after sorting.
            const tagged = items.map((item, originalIndex) => ({ item, originalIndex }));
            if (this.sortInput) {
                tagged.sort((a, b) => Math.max(b.item.width, b.item.height) -
                    Math.max(a.item.width, a.item.height));
            }
            const freeRects = [
                { x: 0, y: 0, width: this.binWidth, height: this.binHeight },
            ];
            const placements = [];
            const unplaced = [];
            for (const { item, originalIndex } of tagged) {
                const fit = this.findBestFit(freeRects, item.width, item.height);
                if (fit === null) {
                    unplaced.push(item);
                    continue;
                }
                const placedWidth = fit.rotated ? item.height : item.width;
                const placedHeight = fit.rotated ? item.width : item.height;
                placements.push({
                    id: item.id ?? originalIndex,
                    position: new this.VectorClass([
                        this.minX + fit.x,
                        this.minY + fit.y,
                    ]),
                    shape: {
                        width: placedWidth,
                        height: placedHeight,
                        rotated: fit.rotated,
                    },
                });
                this.splitFreeRects(freeRects, fit.x, fit.y, placedWidth, placedHeight);
                this.pruneNonMaximal(freeRects);
            }
            return {
                distribution: { elements: placements, bounds: this.bounds },
                unplaced,
            };
        }
        // ─── Fit selection ───────────────────────────────────────────────────────
        findBestFit(freeRects, width, height) {
            let bestPrimary = Infinity;
            let bestSecondary = Infinity;
            let bestX = 0;
            let bestY = 0;
            let bestRotated = false;
            let found = false;
            const tryFit = (free, w, h, rotated) => {
                if (free.width < w || free.height < h)
                    return;
                const { primary, secondary } = this.scoreFit(free, w, h);
                if (primary < bestPrimary ||
                    (primary === bestPrimary && secondary < bestSecondary)) {
                    bestPrimary = primary;
                    bestSecondary = secondary;
                    bestX = free.x;
                    bestY = free.y;
                    bestRotated = rotated;
                    found = true;
                }
            };
            for (const free of freeRects) {
                tryFit(free, width, height, false);
                if (this.allowRotation && width !== height) {
                    tryFit(free, height, width, true);
                }
            }
            return found ? { x: bestX, y: bestY, rotated: bestRotated } : null;
        }
        scoreFit(free, width, height) {
            const leftoverX = free.width - width;
            const leftoverY = free.height - height;
            const shortSide = Math.min(leftoverX, leftoverY);
            const longSide = Math.max(leftoverX, leftoverY);
            switch (this.heuristic) {
                case 'best-short-side':
                    return { primary: shortSide, secondary: longSide };
                case 'best-long-side':
                    return { primary: longSide, secondary: shortSide };
                case 'best-area':
                    return {
                        primary: free.width * free.height - width * height,
                        secondary: shortSide,
                    };
                case 'bottom-left':
                    // Prefer lowest top edge (free.y + height), then leftmost.
                    return { primary: free.y + height, secondary: free.x };
            }
        }
        // ─── Free-rect bookkeeping ───────────────────────────────────────────────
        /**
         * Replace every free rect intersecting the placed rect with up to four
         * sub-rects covering the portions of the original that remain free.
         * Non-intersecting free rects are preserved unchanged.
         */
        splitFreeRects(freeRects, px, py, pw, ph) {
            const pRight = px + pw;
            const pTop = py + ph;
            // Walk backwards so we can splice in place.
            for (let i = freeRects.length - 1; i >= 0; i--) {
                const free = freeRects[i];
                const fRight = free.x + free.width;
                const fTop = free.y + free.height;
                // No overlap: leave free rect in place.
                if (px >= fRight || pRight <= free.x || py >= fTop || pTop <= free.y) {
                    continue;
                }
                // Overlap: remove this free rect and push up to four replacements.
                freeRects.splice(i, 1);
                if (px > free.x) {
                    freeRects.push({
                        x: free.x,
                        y: free.y,
                        width: px - free.x,
                        height: free.height,
                    });
                }
                if (pRight < fRight) {
                    freeRects.push({
                        x: pRight,
                        y: free.y,
                        width: fRight - pRight,
                        height: free.height,
                    });
                }
                if (py > free.y) {
                    freeRects.push({
                        x: free.x,
                        y: free.y,
                        width: free.width,
                        height: py - free.y,
                    });
                }
                if (pTop < fTop) {
                    freeRects.push({
                        x: free.x,
                        y: pTop,
                        width: free.width,
                        height: fTop - pTop,
                    });
                }
            }
        }
        /**
         * Remove any free rect that is contained in another. Duplicates collapse
         * to a single survivor. Skipping already-redundant rects when testing
         * containment is what makes duplicate handling work correctly — without
         * it, two identical rects would each mark the other as redundant and both
         * would be dropped.
         */
        pruneNonMaximal(freeRects) {
            const redundant = new Array(freeRects.length).fill(false);
            for (let i = 0; i < freeRects.length; i++) {
                if (redundant[i])
                    continue;
                for (let j = 0; j < freeRects.length; j++) {
                    if (i === j || redundant[j])
                        continue;
                    if (this.contains(freeRects[j], freeRects[i])) {
                        redundant[i] = true;
                        break;
                    }
                }
            }
            // Filter in place: compact survivors, then truncate.
            let write = 0;
            for (let read = 0; read < freeRects.length; read++) {
                if (!redundant[read]) {
                    freeRects[write++] = freeRects[read];
                }
            }
            freeRects.length = write;
        }
        contains(outer, inner) {
            return (outer.x <= inner.x &&
                outer.y <= inner.y &&
                outer.x + outer.width >= inner.x + inner.width &&
                outer.y + outer.height >= inner.y + inner.height);
        }
    }

    /**
     * @fileoverview Strip packing: arrange rectangles in a fixed-width strip to
     * minimize total height, via the skyline bottom-left heuristic.
     */
    /**
     * Packs axis-aligned rectangles into a strip of fixed width, minimizing total
     * height. Uses the skyline bottom-left heuristic: maintain the upper contour
     * of placed rectangles as a list of horizontal segments, and for each new
     * rectangle pick the candidate position minimizing y, with x as tiebreaker.
     *
     * Coordinates: (0, 0) is the bottom-left of the strip; x grows right, y grows
     * upward. A placement's `position` is the rectangle's bottom-left corner.
     *
     * The returned `SpatialDistribution.bounds.max.y` is the total height of the
     * packing. Placement IDs are the indices of rectangles in the original input
     * array, so callers can correlate results back to their own data regardless
     * of the sort strategy.
     *
     * @example
     * ```typescript
     * const packer = new StripPacker({ stripWidth: 100 });
     * const { distribution, unplaced } = packer.pack([
     *   { width: 40, height: 20 },
     *   { width: 30, height: 50 },
     *   { width: 70, height: 15 },
     * ]);
     * const totalHeight = distribution.bounds!.max.get(1);
     * for (const p of distribution.elements) {
     *   const originalIndex = p.id as number;
     *   const [x, y] = [p.position.get(0), p.position.get(1)];
     *   // p.shape is the rectangle as provided
     * }
     * ```
     */
    class StripPacker {
        stripWidth;
        sortFn;
        VectorClass;
        constructor(config) {
            if (!(config.stripWidth > 0) || !Number.isFinite(config.stripWidth)) {
                throw new Error(`stripWidth must be a positive finite number, got ${config.stripWidth}`);
            }
            this.stripWidth = config.stripWidth;
            this.sortFn = StripPacker.resolveSort(config.sort ?? 'height-desc');
            this.VectorClass = Vector.forDimension(2);
        }
        /**
         * Pack the given rectangles into the strip.
         *
         * @param items Rectangles to pack. Any rectangle with width greater than
         *   `stripWidth` is returned in the `unplaced` array.
         * @returns `distribution` containing all placed rectangles plus the
         *   bounding box of the packing, and `unplaced` listing anything that
         *   didn't fit.
         * @throws If any rectangle has non-positive or non-finite dimensions.
         */
        pack(items) {
            for (const r of items) {
                if (!(r.width > 0) || !Number.isFinite(r.width) ||
                    !(r.height > 0) || !Number.isFinite(r.height)) {
                    throw new Error(`Rectangle must have positive finite width and height: ${JSON.stringify(r)}`);
                }
            }
            // Preserve original indices across sort so placement.id stays tied to
            // the caller's input order.
            const indexed = items.map((rect, id) => ({ rect, id }));
            if (this.sortFn) {
                const fn = this.sortFn;
                // Stable tiebreaker on id keeps output deterministic across engines
                // whose Array.sort is not guaranteed stable for small arrays.
                indexed.sort((a, b) => fn(a.rect, b.rect) || a.id - b.id);
            }
            const skyline = [{ x: 0, y: 0, width: this.stripWidth }];
            const placements = [];
            const unplaced = [];
            let maxHeight = 0;
            for (const { rect, id } of indexed) {
                if (rect.width > this.stripWidth) {
                    unplaced.push(rect);
                    continue;
                }
                const pos = this.findBestPosition(skyline, rect.width);
                if (pos === null) {
                    // Unreachable given the width check above, but defensive:
                    // we'd only get null if no skyline start could fit the rect.
                    unplaced.push(rect);
                    continue;
                }
                placements.push({
                    id,
                    position: new this.VectorClass([pos.x, pos.y]),
                    shape: rect,
                });
                this.updateSkyline(skyline, pos.x, pos.y + rect.height, rect.width);
                const top = pos.y + rect.height;
                if (top > maxHeight)
                    maxHeight = top;
            }
            return {
                distribution: {
                    elements: placements,
                    bounds: {
                        min: new this.VectorClass([0, 0]),
                        max: new this.VectorClass([this.stripWidth, maxHeight]),
                    },
                },
                unplaced,
            };
        }
        /**
         * Bottom-left: scan every skyline segment as a candidate left edge, pick
         * the one minimizing the resulting y, ties broken by smaller x. Only
         * segment boundaries need be considered — within a segment, y is constant,
         * so any leftward shift to a boundary can only improve the x tiebreaker.
         */
        findBestPosition(skyline, width) {
            let best = null;
            for (let i = 0; i < skyline.length; i++) {
                const x = skyline[i].x;
                // Segments are sorted by x ascending, so once we run out of width
                // on the right, no later starting position can fit either.
                if (x + width > this.stripWidth)
                    break;
                const y = this.computeY(skyline, i, width);
                if (y === null)
                    continue;
                if (best === null || y < best.y || (y === best.y && x < best.x)) {
                    best = { x, y };
                }
            }
            return best;
        }
        /**
         * The y at which a rect of `width` would sit if its left edge aligned
         * with `skyline[start].x` — the max y across every segment the rect spans.
         * Returns null if `width` exceeds the remaining strip from `start`.
         */
        computeY(skyline, start, width) {
            let remaining = width;
            let maxY = 0;
            let i = start;
            while (remaining > 0 && i < skyline.length) {
                if (skyline[i].y > maxY)
                    maxY = skyline[i].y;
                remaining -= skyline[i].width;
                i++;
            }
            return remaining > 0 ? null : maxY;
        }
        /**
         * Raise the skyline to account for a newly placed rectangle: replace the
         * segments covered by [x, x+width] with one flat-top segment at newY,
         * preserving any uncovered portion of the last consumed segment.
         */
        updateSkyline(skyline, x, newY, width) {
            let i = 0;
            while (i < skyline.length && skyline[i].x < x)
                i++;
            // Invariant: skyline[i].x === x (we only place at segment boundaries).
            let j = i;
            let covered = 0;
            while (j < skyline.length && covered < width) {
                covered += skyline[j].width;
                j++;
            }
            const overflow = covered - width;
            const inserted = [{ x, y: newY, width }];
            if (overflow > 0) {
                // The last consumed segment extended past our right edge; keep
                // the uncovered remainder at its original y.
                inserted.push({
                    x: x + width,
                    y: skyline[j - 1].y,
                    width: overflow,
                });
            }
            skyline.splice(i, j - i, ...inserted);
            // Coalesce adjacent segments with equal y so the skyline stays compact.
            for (let k = skyline.length - 1; k > 0; k--) {
                if (skyline[k].y === skyline[k - 1].y) {
                    skyline[k - 1].width += skyline[k].width;
                    skyline.splice(k, 1);
                }
            }
        }
        static resolveSort(s) {
            if (typeof s === 'function')
                return s;
            switch (s) {
                case 'none': return null;
                case 'height-desc': return (a, b) => b.height - a.height;
                case 'width-desc': return (a, b) => b.width - a.width;
                case 'area-desc': return (a, b) => b.width * b.height - a.width * a.height;
                case 'perimeter-desc': return (a, b) => (b.width + b.height) - (a.width + a.height);
                case 'max-side-desc':
                    return (a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height);
                default: {
                    const _exhaustive = s;
                    throw new Error(`Unknown sort strategy: ${String(_exhaustive)}`);
                }
            }
        }
    }

    var index$6 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        BinPacker: BinPacker,
        CirclePacker: CirclePacker,
        RectanglePacker: RectanglePacker,
        StripPacker: StripPacker
    });

    /**
     * Poisson-disk sampling in D dimensions via Bridson's algorithm (2007).
     *
     * Produces a set of points inside `bounds` such that no two points are closer
     * than `minDistance`, with points distributed as densely as that constraint
     * allows. Runs in O(n) where n is the number of samples produced.
     *
     * @example
     * ```typescript
     * const Vector2 = Vector.forDimension(2);
     * const sampler = new PoissonDiskSampler<2>({
     *     bounds: { min: new Vector2([0, 0]), max: new Vector2([100, 100]) },
     *     minDistance: 5,
     * });
     * const distribution = sampler.generate();
     * // distribution.elements: Placement<2, void>[] — roughly 400 points
     * ```
     */
    class PoissonDiskSampler {
        bounds;
        minDistance;
        outerAnnulusRadius;
        maxAttempts;
        rng;
        densityFn;
        initialPoints;
        dimension;
        cellSize;
        gridSize;
        gridStrides;
        totalCells;
        neighborhoodRadius;
        VectorClass;
        // Reused scratch buffers to avoid allocations in hot loops
        scratchCell;
        scratchOffsets;
        constructor(config) {
            if (config.minDistance <= 0 || !Number.isFinite(config.minDistance)) {
                throw new Error('minDistance must be a positive finite number');
            }
            const dim = config.bounds.min.dimension;
            if (dim !== config.bounds.max.dimension) {
                throw new Error('bounds.min and bounds.max must have matching dimensions');
            }
            for (let i = 0; i < dim; i++) {
                if (config.bounds.max.get(i) <= config.bounds.min.get(i)) {
                    throw new Error(`bounds.max[${i}] (${config.bounds.max.get(i)}) must exceed bounds.min[${i}] (${config.bounds.min.get(i)})`);
                }
            }
            if (config.densityFunction && (config.maxDensityMultiplier === undefined || config.maxDensityMultiplier < 1)) {
                throw new Error('When densityFunction is provided, maxDensityMultiplier must be set to a value ≥ 1');
            }
            this.bounds = config.bounds;
            this.minDistance = config.minDistance;
            this.maxAttempts = config.maxAttempts ?? 30;
            this.densityFn = config.densityFunction;
            this.initialPoints = config.initialPoints ?? [];
            this.dimension = dim;
            this.VectorClass = config.bounds.min.constructor;
            const rngCore = config.rng;
            this.rng = rngCore ? () => rngCore.random() : Math.random;
            // Cell size r/√D guarantees at most one sample per cell (a cell's
            // diagonal equals r, so any two points in the same cell are within r).
            this.cellSize = this.minDistance / Math.sqrt(this.dimension);
            // Neighborhood radius in cells. Uniform case: ±2 suffices. With
            // density modulation, the required distance can reach
            // minDistance * maxMultiplier, which spans ceil(maxMultiplier * √D)
            // cells; we add 1 for safety against floor() boundary effects.
            const maxMultiplier = config.maxDensityMultiplier ?? 1;
            this.neighborhoodRadius = Math.max(2, Math.ceil(maxMultiplier * Math.sqrt(this.dimension)) + 1);
            // Candidates are drawn from [minDistance, 2·minDistance·maxMultiplier].
            // In sparse regions the required pairwise distance can exceed 2·minDistance,
            // so the outer radius must scale with maxMultiplier for the algorithm to
            // ever seed those regions from adjacent denser ones. In the uniform case
            // (maxMultiplier = 1) this collapses to Bridson's original [r, 2r].
            this.outerAnnulusRadius = 2 * this.minDistance * maxMultiplier;
            this.gridSize = new Array(this.dimension);
            let total = 1;
            for (let i = 0; i < this.dimension; i++) {
                const extent = config.bounds.max.get(i) - config.bounds.min.get(i);
                this.gridSize[i] = Math.ceil(extent / this.cellSize);
                total *= this.gridSize[i];
            }
            this.totalCells = total;
            this.gridStrides = new Array(this.dimension);
            this.gridStrides[0] = 1;
            for (let i = 1; i < this.dimension; i++) {
                this.gridStrides[i] = this.gridStrides[i - 1] * this.gridSize[i - 1];
            }
            this.scratchCell = new Int32Array(this.dimension);
            this.scratchOffsets = new Int32Array(this.dimension);
        }
        /**
         * Produce a Poisson-disk-distributed set of points.
         *
         * @param maxCount Optional cap on the number of points returned. Useful
         *   for progressive generation or memory-bounded use. If omitted, the
         *   sampler runs until saturation.
         */
        generate(maxCount = Infinity) {
            const elements = [];
            const grid = new Int32Array(this.totalCells).fill(-1);
            const active = [];
            const addPoint = (p) => {
                const idx = elements.length;
                elements.push({ id: idx, position: p, shape: undefined });
                grid[this.cellIndex(p)] = idx;
                active.push(idx);
            };
            // Seed with provided points if any are valid; otherwise pick one at random.
            for (const p of this.initialPoints) {
                if (elements.length >= maxCount)
                    break;
                if (this.inBounds(p) && this.isValidCandidate(p, elements, grid)) {
                    addPoint(p);
                }
            }
            if (elements.length === 0 && maxCount > 0) {
                addPoint(this.randomPointInBounds());
            }
            // Main loop: grow from active frontier until every active sample has
            // been given `maxAttempts` chances to spawn a neighbor.
            while (active.length > 0 && elements.length < maxCount) {
                const activeSlot = Math.floor(this.rng() * active.length);
                const parent = elements[active[activeSlot]].position;
                let found = false;
                for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
                    const candidate = this.sampleAnnulus(parent);
                    if (this.inBounds(candidate) && this.isValidCandidate(candidate, elements, grid)) {
                        addPoint(candidate);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    // Swap-remove: this active sample is "exhausted."
                    active[activeSlot] = active[active.length - 1];
                    active.pop();
                }
            }
            return { elements, bounds: this.bounds };
        }
        // ─── Geometry helpers ────────────────────────────────────────────────────
        cellIndex(p) {
            let idx = 0;
            for (let i = 0; i < this.dimension; i++) {
                const c = Math.floor((p.get(i) - this.bounds.min.get(i)) / this.cellSize);
                idx += c * this.gridStrides[i];
            }
            return idx;
        }
        inBounds(p) {
            for (let i = 0; i < this.dimension; i++) {
                const v = p.get(i);
                if (v < this.bounds.min.get(i) || v >= this.bounds.max.get(i))
                    return false;
            }
            return true;
        }
        randomPointInBounds() {
            const coords = new Float64Array(this.dimension);
            for (let i = 0; i < this.dimension; i++) {
                const lo = this.bounds.min.get(i);
                const hi = this.bounds.max.get(i);
                coords[i] = lo + this.rng() * (hi - lo);
            }
            return new this.VectorClass(coords);
        }
        /**
         * Uniformly sample a point from the spherical annulus of radii [r, 2r]
         * around `center`, where r = minDistance. Uniform in position space (not
         * in (radius, angle) space) so that the density of candidates doesn't
         * skew toward the inner boundary in higher dimensions.
         */
        sampleAnnulus(center) {
            // Direction: uniform on the unit (D-1)-sphere via normalized Gaussians.
            const coords = new Float64Array(this.dimension);
            let lengthSq = 0;
            for (let i = 0; i < this.dimension; i++) {
                coords[i] = this.gaussian();
                lengthSq += coords[i] * coords[i];
            }
            const len = Math.sqrt(lengthSq) || 1;
            // Radius: CDF ∝ r^D, so r = (rMin^D + u(rMax^D − rMin^D))^(1/D).
            const u = this.rng();
            const rD = Math.pow(this.minDistance, this.dimension);
            const rMaxD = Math.pow(this.outerAnnulusRadius, this.dimension);
            const radius = Math.pow(rD + u * (rMaxD - rD), 1 / this.dimension);
            const scale = radius / len;
            for (let i = 0; i < this.dimension; i++) {
                coords[i] = center.get(i) + coords[i] * scale;
            }
            return new this.VectorClass(coords);
        }
        gaussian() {
            // Box-Muller. We discard the second sample for simplicity; if this
            // ever shows up in a profile, cache it across calls.
            let u = 0, v = 0;
            while (u === 0)
                u = this.rng();
            while (v === 0)
                v = this.rng();
            return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        }
        /**
         * Reject a candidate if any existing sample lies within the required
         * distance. Only checks cells within ±2 of the candidate's cell in each
         * axis — farther cells are provably out of range given cellSize = r/√D.
         */
        isValidCandidate(candidate, elements, grid) {
            const candidateCell = this.scratchCell;
            for (let i = 0; i < this.dimension; i++) {
                candidateCell[i] = Math.floor((candidate.get(i) - this.bounds.min.get(i)) / this.cellSize);
            }
            const localScale = this.densityFn ? Math.max(1, this.densityFn(candidate)) : 1;
            const offsets = this.scratchOffsets;
            const R = this.neighborhoodRadius;
            for (let i = 0; i < this.dimension; i++)
                offsets[i] = -R;
            // Walk the D-dimensional [-R..R]^D neighborhood via a mixed-radix counter.
            while (true) {
                let cellIdx = 0;
                let inGrid = true;
                for (let i = 0; i < this.dimension; i++) {
                    const c = candidateCell[i] + offsets[i];
                    if (c < 0 || c >= this.gridSize[i]) {
                        inGrid = false;
                        break;
                    }
                    cellIdx += c * this.gridStrides[i];
                }
                if (inGrid) {
                    const existingIdx = grid[cellIdx];
                    if (existingIdx !== -1) {
                        const existing = elements[existingIdx].position;
                        const existingScale = this.densityFn
                            ? Math.max(1, this.densityFn(existing))
                            : 1;
                        // Symmetric constraint: use the larger of the two local radii.
                        const required = this.minDistance * Math.max(localScale, existingScale);
                        if (this.distanceSquared(candidate, existing) < required * required) {
                            return false;
                        }
                    }
                }
                // Increment the counter (base 2R+1, digits −R..R).
                let carry = true;
                for (let i = 0; i < this.dimension && carry; i++) {
                    offsets[i]++;
                    if (offsets[i] > R)
                        offsets[i] = -R;
                    else
                        carry = false;
                }
                if (carry)
                    break;
            }
            return true;
        }
        distanceSquared(a, b) {
            let sum = 0;
            for (let i = 0; i < this.dimension; i++) {
                const d = a.get(i) - b.get(i);
                sum += d * d;
            }
            return sum;
        }
    }

    var index$5 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        PoissonDiskSampler: PoissonDiskSampler
    });

    var index$4 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        noise: index$7,
        packing: index$6,
        sampling: index$5
    });

    class AbstractTilingAlgorithm {
        state;
        config;
        matchingRules;
        constructor(config) {
            this.config = config;
            this.matchingRules = config.matchingRules || [];
            this.state = {
                tiles: new Map(),
                boundary: [],
                generation: 0,
                metadata: {
                    gridWidth: config.bounds.width,
                    gridHeight: config.bounds.height
                }
            };
        }
        validate() {
            // Default implementation of validation logic
            return true;
        }
        getCurrentState() {
            return this.state;
        }
    }
    // Events that can occur during tiling generation
    var TilingEvent;
    (function (TilingEvent) {
        TilingEvent["ITERATION_COMPLETE"] = "iteration_complete";
        TilingEvent["CONSTRAINT_VIOLATION"] = "constraint_violation";
        TilingEvent["SUBSTITUTION_APPLIED"] = "substitution_applied";
        TilingEvent["TILING_COMPLETE"] = "tiling_complete";
        TilingEvent["ERROR"] = "error";
    })(TilingEvent || (TilingEvent = {}));
    // --- Optional: shared event hooks parallel to your tiling events ----------
    var VoronoiEvent;
    (function (VoronoiEvent) {
        VoronoiEvent["DIAGRAM_COMPUTED"] = "diagram_computed";
        VoronoiEvent["ITERATION_COMPLETE"] = "iteration_complete";
        VoronoiEvent["CONVERGED"] = "converged";
        VoronoiEvent["DEGENERACY_DETECTED"] = "degeneracy_detected";
        VoronoiEvent["ERROR"] = "error";
    })(VoronoiEvent || (VoronoiEvent = {}));

    /**
     * Ammann-Beenker Tiling Implementation
     *
     * Tiles:
     *   - "triangle" : 45-45-90 right isosceles triangle. Vertices [A, B, C] with
     *                  the right angle at A and 45° vertices at B, C.
     *                  At unit edge length: |AB| = |AC| = 1, |BC| = √2.
     *   - "rhomb"    : 45-135 rhombus, all four edges of equal length.
     *                  Vertices [V0, V1, V2, V3] in CCW order with acute (45°)
     *                  corners at V0 and V2; V1, V3 are obtuse (135°).
     *
     * The substitution operates as inflate-then-subdivide. Each tile is treated as
     * if it had edge length δ = 1 + √2 (the silver ratio), subdivided into unit
     * children, and then everything is rescaled by δ so that successive generations
     * keep edge length constant and the patch grows. This is the standard way to
     * present the Ammann-Beenker substitution; it makes each generation drawable at
     * a uniform scale and lets the bounding region grow geometrically.
     *
     * Substitution counts:
     *   - triangle  → 3 triangles + 2 rhombs
     *   - rhomb     → 4 triangles + 3 rhombs
     *
     * Triangle handedness is tracked explicitly via metadata.chirality ∈ {+1, -1}.
     * +1 is "right-handed" (CCW vertex order [A, B, C] with B 90° CCW from C
     * around A); -1 is its mirror. The substitution emits both handednesses.
     *
     * The square + rhomb form (the prettier picture) is recovered after rendering
     * by pairing each triangle with its mirror partner along the shared hypotenuse,
     * which always reconstitutes a unit square.
     */
    const Vec2 = Vector.forDimension(2);
    const v2$1 = (x, y) => new Vec2([x, y]);
    const SQRT2 = Math.sqrt(2);
    const DELTA = 1 + SQRT2; // silver ratio (linear inflation factor)
    const INV_DELTA = 1 / DELTA; // = √2 - 1
    /* ------------------------------------------------------------------ *
     * Tile
     * ------------------------------------------------------------------ */
    class AmmannBeenkerTile {
        vertices;
        tileType;
        metadata;
        constructor(vertices, tileType, metadata) {
            const expected = tileType === 'triangle' ? 3 : 4;
            if (vertices.length !== expected) {
                throw new Error(`AmmannBeenkerTile of type ${tileType} expects ${expected} vertices, got ${vertices.length}`);
            }
            this.vertices = vertices;
            this.tileType = tileType;
            this.metadata = metadata;
        }
        transform(matrix) {
            // Determinant tells us if the affine map flips orientation; if so, flip
            // the tracked chirality and reverse the winding so vertex 0 is still
            // canonical (right-angle for triangles, acute for rhombs).
            const det = transformDeterminant(matrix);
            const newVerts = this.vertices.map(v => matrix.transform(v));
            const newMeta = this.metadata ? { ...this.metadata } : undefined;
            if (det < 0) {
                newVerts.reverse();
                if (this.tileType === 'triangle' && newMeta) {
                    const c = newMeta.chirality;
                    if (c === 1 || c === -1)
                        newMeta.chirality = -c;
                }
                // Reversing a 4-cycle [V0,V1,V2,V3] gives [V3,V2,V1,V0]; rotate by
                // one to restore the acute-at-index-0 invariant for rhombs.
                if (this.tileType === 'rhomb') {
                    newVerts.push(newVerts.shift());
                }
            }
            return new AmmannBeenkerTile(newVerts, this.tileType, newMeta);
        }
        clone() {
            return new AmmannBeenkerTile(this.vertices.map(v => v.clone()), this.tileType, this.metadata ? { ...this.metadata } : undefined);
        }
    }
    /* ------------------------------------------------------------------ *
     * Affine transform (rotation, uniform scale, translation, optional flip)
     * Stored as the full 9-element 3x3 row-major matrix so composition is
     * exact and reflections are first-class.
     * ------------------------------------------------------------------ */
    function transformDeterminant(m) {
        const e = m.elements;
        return e[0] * e[4] - e[1] * e[3];
    }
    class AmmannBeenkerTransform {
        elements;
        constructor(elements) {
            if (elements.length !== 9) {
                throw new Error(`Expected 9 matrix elements, got ${elements.length}`);
            }
            this.elements = elements;
        }
        /** Identity. */
        static identity() {
            return new AmmannBeenkerTransform(new Float64Array([1, 0, 0, 0, 1, 0, 0, 0, 1]));
        }
        /** Pure translation. */
        static translation(tx, ty) {
            return new AmmannBeenkerTransform(new Float64Array([1, 0, tx, 0, 1, ty, 0, 0, 1]));
        }
        /** Rotation about the origin by `angle` radians. */
        static rotation(angle) {
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            return new AmmannBeenkerTransform(new Float64Array([c, -s, 0, s, c, 0, 0, 0, 1]));
        }
        /** Uniform scale about the origin. */
        static scale(s) {
            return new AmmannBeenkerTransform(new Float64Array([s, 0, 0, 0, s, 0, 0, 0, 1]));
        }
        /** Reflection across the line through the origin at angle `angle`. */
        static reflection(angle) {
            const c = Math.cos(2 * angle);
            const s = Math.sin(2 * angle);
            return new AmmannBeenkerTransform(new Float64Array([c, s, 0, s, -c, 0, 0, 0, 1]));
        }
        transform(vector) {
            const e = this.elements;
            const x = vector.get(0);
            const y = vector.get(1);
            return v2$1(e[0] * x + e[1] * y + e[2], e[3] * x + e[4] * y + e[5]);
        }
        compose(other) {
            // (this ∘ other)(p) = this(other(p))  →  result = this · other
            const a = this.elements;
            const b = other.elements;
            const r = new Float64Array(9);
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    let sum = 0;
                    for (let k = 0; k < 3; k++)
                        sum += a[i * 3 + k] * b[k * 3 + j];
                    r[i * 3 + j] = sum;
                }
            }
            return new AmmannBeenkerTransform(r);
        }
        inverse() {
            // 3x3 inverse for an affine matrix [[A b];[0 1]]: [[A⁻¹ -A⁻¹b];[0 1]].
            const e = this.elements;
            const a = e[0], b = e[1], tx = e[2];
            const c = e[3], d = e[4], ty = e[5];
            const det = a * d - b * c;
            if (Math.abs(det) < 1e-14) {
                throw new Error('AmmannBeenkerTransform.inverse: singular matrix');
            }
            const invDet = 1 / det;
            const ia = d * invDet;
            const ib = -b * invDet;
            const ic = -c * invDet;
            const id = a * invDet;
            const itx = -(ia * tx + ib * ty);
            const ity = -(ic * tx + id * ty);
            return new AmmannBeenkerTransform(new Float64Array([
                ia, ib, itx,
                ic, id, ity,
                0, 0, 1
            ]));
        }
    }
    /* ------------------------------------------------------------------ *
     * Matching rule
     *
     * Geometric edge-length match plus the rigid-or-mirror transform that
     * places tile2's edge against tile1's edge with the tiles on opposite
     * sides. Mirror tiles are handled by emitting a reflected transform when
     * the two tile orientations disagree.
     * ------------------------------------------------------------------ */
    class AmmannBeenkerMatchingRule {
        static EPSILON = 1e-9;
        space;
        constructor(space = new EuclideanSpace()) {
            this.space = space;
        }
        canMatch(tile1, tile2, edge) {
            const e1 = this.getEdge(tile1, edge);
            const e2 = this.getEdge(tile2, edge);
            const len1 = this.space.distance(e1.start, e1.end);
            const len2 = this.space.distance(e2.start, e2.end);
            return Math.abs(len1 - len2) < AmmannBeenkerMatchingRule.EPSILON;
        }
        getMatchingTransform(tile1, tile2, edge) {
            const e1 = this.getEdge(tile1, edge);
            const e2 = this.getEdge(tile2, edge);
            const angle1 = Math.atan2(e1.end.get(1) - e1.start.get(1), e1.end.get(0) - e1.start.get(0));
            const angle2 = Math.atan2(e2.end.get(1) - e2.start.get(1), e2.end.get(0) - e2.start.get(0));
            // Place tile2's edge along tile1's edge, oriented opposite (so the
            // tiles lie on opposite sides of the shared edge).
            const targetAngle = angle1 + Math.PI;
            // Need a rigid motion that sends e2.start → e1.end and aligns directions.
            // If tile2 has the opposite handedness to tile1, compose with a
            // reflection across e2 first so the tile ends up on the correct side.
            const sameHandedness = tileChirality(tile1) === tileChirality(tile2);
            const sx = e2.start.get(0);
            const sy = e2.start.get(1);
            const ex = e1.end.get(0);
            const ey = e1.end.get(1);
            if (sameHandedness) {
                const rot = targetAngle - angle2;
                const c = Math.cos(rot), s = Math.sin(rot);
                const tx = ex - (c * sx - s * sy);
                const ty = ey - (s * sx + c * sy);
                return new AmmannBeenkerTransform(new Float64Array([
                    c, -s, tx,
                    s, c, ty,
                    0, 0, 1
                ]));
            }
            // Opposite handedness: build a reflection that sends e2 onto e1
            // (with appropriate orientation) directly.
            // Reflect across the line through e1's midpoint at angle (angle1 + π/2)
            // doesn't generally work; instead, compose: translate e2.start to
            // origin, reflect across X axis (flips handedness), rotate to target,
            // translate to e1.end.
            const T1 = AmmannBeenkerTransform.translation(-sx, -sy);
            const Rneg = AmmannBeenkerTransform.rotation(-angle2);
            const F = new AmmannBeenkerTransform(new Float64Array([
                1, 0, 0,
                0, -1, 0,
                0, 0, 1
            ]));
            const R = AmmannBeenkerTransform.rotation(targetAngle);
            const T2 = AmmannBeenkerTransform.translation(ex, ey);
            return T2.compose(R).compose(F).compose(Rneg).compose(T1);
        }
        getEdge(tile, edge) {
            const v = tile.vertices;
            return { start: v[edge % v.length], end: v[(edge + 1) % v.length] };
        }
    }
    function tileChirality(t) {
        if (t.tileType !== 'triangle')
            return 1;
        const m = t.metadata;
        return m && m.chirality === -1 ? -1 : 1;
    }
    /* ------------------------------------------------------------------ *
     * Substitution
     *
     * Implementation strategy: work in the canonical frame of the parent
     * tile (axis-aligned, origin at the canonical anchor), emit child tiles
     * in canonical coordinates, then map them back into world space via the
     * parent's frame transform composed with a uniform scale by δ.
     *
     * The δ scale is the inflation step that keeps generation-N tiles at the
     * same edge length as generation-0 (instead of shrinking by 1/δ each
     * round). This is the standard inflate-then-subdivide pipeline.
     * ------------------------------------------------------------------ */
    class AmmannBeenkerSubstitutionRule {
        /** Linear inflation factor per generation. */
        getScaleFactor() { return DELTA; }
        substitute(tile) {
            if (tile.tileType === 'triangle')
                return this.substituteTriangle(tile);
            if (tile.tileType === 'rhomb')
                return this.substituteRhomb(tile);
            throw new Error(`Unknown tile type: ${tile.tileType}`);
        }
        /**
         * Triangle subdivision.
         *
         * Parent triangle has unit edges (legs 1, hypotenuse √2). We "inflate" it
         * mentally to a δ-edge triangle, subdivide into unit children, then the
         * parent→world map plus a δ-scale takes the unit children back to the
         * parent's actual size in the world. Operationally this is just: compute
         * the subdivision of a δ-triangle in canonical coordinates and apply the
         * frame-of-parent map.
         *
         * Canonical δ-triangle frame: A = (0,0), B = (δ, 0), C = (0, δ).
         * Right angle at A; B and C are the 45° corners.
         *
         * Subdivision points (all at unit distance from each other where edges meet):
         *   b3 = √2 along AB         = (√2, 0)
         *   c3 = √2 along AC         = (0, √2)
         *   b1 = unit step along BC from B = B + (C-B)/(δ√2)
         *   c1 = unit step along BC from C = C + (B-C)/(δ√2)
         *   b2 = A + ((B-A)+(C-A))/(δ√2)   (interior, dist 1 from A along bisector)
         *
         * Children (chirality preserved from parent):
         *   rhomb     [B, b1, b2, b3]
         *   rhomb     [C, c3, b2, c1]
         *   triangle  [b2, c1, b1]                 (right angle at b2; same chirality)
         *   triangle  [b2, b3, A]                  (right angle at b2; same chirality)
         *   triangle  [b2, A, c3]                  (right angle at b2; OPPOSITE chirality)
         */
        substituteTriangle(tile) {
            const chirality = tileChirality(tile);
            const frame = triangleFrame(tile, chirality);
            // Canonical δ-triangle vertices (chirality = +1 form; we apply `frame`
            // which already encodes any reflection if chirality was -1).
            const A = v2$1(0, 0);
            const B = v2$1(DELTA, 0);
            const C = v2$1(0, DELTA);
            const lerp = (P, Q, t) => P.add(Q.subtract(P).scale(t));
            const b3 = lerp(A, B, SQRT2 / DELTA);
            const c3 = lerp(A, C, SQRT2 / DELTA);
            const b1 = lerp(B, C, 1 / (DELTA * SQRT2));
            const c1 = lerp(C, B, 1 / (DELTA * SQRT2));
            const b2 = A.add(B.subtract(A).add(C.subtract(A)).scale(1 / (DELTA * SQRT2)));
            // Map canonical points into world coordinates through the parent frame.
            const W = (p) => frame.transform(p);
            // Build children. The frame transform may include a reflection if the
            // parent had chirality -1; AmmannBeenkerTile.transform handles that by
            // flipping winding and toggling stored chirality, but here we are
            // constructing tiles directly in world coordinates, so we set
            // chirality explicitly to the parent's, except for the one "mirror"
            // child which is opposite by construction.
            const sameC = { chirality };
            const oppC = { chirality: (-chirality) };
            const tris = [
                new AmmannBeenkerTile([W(b2), W(c1), W(b1)], 'triangle', { ...sameC }),
                new AmmannBeenkerTile([W(b2), W(b3), W(A)], 'triangle', { ...sameC }),
                new AmmannBeenkerTile([W(b2), W(A), W(c3)], 'triangle', { ...oppC }),
            ];
            // Rhombs: V0 = acute, V1 = obtuse, V2 = acute, V3 = obtuse, CCW.
            // [B, b1, b2, b3]: B is acute (45° at the parent corner B), b2 is
            // acute (the interior point), b1 and b3 are obtuse (135°).
            const rhombs = [
                new AmmannBeenkerTile([W(B), W(b1), W(b2), W(b3)], 'rhomb'),
                new AmmannBeenkerTile([W(C), W(c3), W(b2), W(c1)], 'rhomb'),
            ];
            // Ensure rhombs are CCW (the canonical layout above is right-handed;
            // a chirality=-1 frame includes a reflection, in which case the
            // emitted rhombs come out CW and we rewind).
            for (const r of rhombs)
                ensureRhombCCW(r);
            for (const t of tris)
                ensureTriangleCCW(t);
            return [...rhombs, ...tris];
        }
        /**
         * Rhomb subdivision.
         *
         * Parent rhomb has unit edges. Inflate to edge δ; subdivide into 3 rhombs
         * + 4 triangles in a canonical frame; world-map.
         *
         * Canonical δ-rhomb frame: long diagonal along +x, centred at origin.
         *   V0 = (-L/2, 0)   (acute)
         *   V1 = ( 0,  +S/2) (obtuse)
         *   V2 = (+L/2, 0)   (acute)
         *   V3 = ( 0,  -S/2) (obtuse)
         * where L = δ·√(2+√2) and S = δ·√(2−√2) are the parent diagonals.
         *
         * Subdivision: cut the long diagonal at unit distance from each acute
         * corner (giving P0 and P1), and place a unit rhomb (same orientation
         * as parent) at the centre. The four flanking triangles fill the gap
         * between the corner-rhombs, the central rhomb, and the parent edges.
         *
         *   R0a = V0 + (V1-V0)/δ      (unit point on edge V0-V1)
         *   R0b = V0 + (V3-V0)/δ      (unit point on edge V0-V3)
         *   R2a = V2 + (V1-V2)/δ      (unit point on edge V2-V1)
         *   R2b = V2 + (V3-V2)/δ      (unit point on edge V2-V3)
         *
         *   P0  = V0 + d̂                (unit step along long diag from V0)
         *   P1  = V2 - d̂                (unit step along long diag from V2)
         *
         *   Q1, Q3 = central unit-rhomb obtuse corners on the short-diag axis.
         *
         * Children (3 rhombs + 4 triangles).
         */
        substituteRhomb(tile) {
            const frame = rhombFrame(tile);
            // Diagonals of the parent at edge length δ.
            const L = DELTA * Math.sqrt(2 + SQRT2);
            const S = DELTA * Math.sqrt(2 - SQRT2);
            const V0 = v2$1(-L / 2, 0);
            const V1 = v2$1(0, S / 2);
            const V2 = v2$1(L / 2, 0);
            const V3 = v2$1(0, -S / 2);
            const lerp = (P, Q, t) => P.add(Q.subtract(P).scale(t));
            const R0a = lerp(V0, V1, INV_DELTA);
            const R0b = lerp(V0, V3, INV_DELTA);
            const R2a = lerp(V2, V1, INV_DELTA);
            const R2b = lerp(V2, V3, INV_DELTA);
            const P0 = lerp(V0, V2, 1 / L); // distance 1 from V0
            const P1 = lerp(V0, V2, 1 - 1 / L); // distance 1 from V2
            // Central unit rhomb: same orientation as parent, centred at origin.
            const sUnit = Math.sqrt(2 - SQRT2); // unit-rhomb short diagonal
            const Q1 = v2$1(0, sUnit / 2);
            const Q3 = v2$1(0, -sUnit / 2);
            const W = (p) => frame.transform(p);
            // Three rhombs. CCW ordering: V0(acute) -> R0a(obtuse,upper) ->
            // P0(acute) -> R0b(obtuse,lower) for the V0-corner rhomb.
            const r0 = new AmmannBeenkerTile([W(V0), W(R0a), W(P0), W(R0b)], 'rhomb');
            // V2-corner rhomb: V2(acute) -> R2b(obtuse,lower) -> P1(acute) -> R2a(obtuse,upper)
            // walks CCW (the orientation flips because we're approaching from the
            // opposite side of the long diagonal).
            const r2 = new AmmannBeenkerTile([W(V2), W(R2b), W(P1), W(R2a)], 'rhomb');
            const rc = new AmmannBeenkerTile([W(P0), W(Q1), W(P1), W(Q3)], 'rhomb');
            // Four triangles. Each is right-isosceles with unit legs; the right
            // angle is at the vertex shared with the central rhomb's acute
            // corners (P0 or P1). Chirality alternates upper/lower.
            const tUL = new AmmannBeenkerTile([W(P0), W(R0a), W(Q1)], 'triangle', { chirality: 1 });
            const tLL = new AmmannBeenkerTile([W(P0), W(Q3), W(R0b)], 'triangle', { chirality: -1 });
            const tUR = new AmmannBeenkerTile([W(P1), W(Q1), W(R2a)], 'triangle', { chirality: -1 });
            const tLR = new AmmannBeenkerTile([W(P1), W(R2b), W(Q3)], 'triangle', { chirality: 1 });
            const out = [r0, r2, rc, tUL, tLL, tUR, tLR];
            for (const t of out) {
                if (t.tileType === 'rhomb')
                    ensureRhombCCW(t);
                else
                    ensureTriangleCCW(t);
            }
            return out;
        }
    }
    /* ------------------------------------------------------------------ *
     * Frame helpers
     *
     * For each tile we compute the affine map that takes the canonical
     * δ-tile frame (used for clean subdivision math) into world coordinates.
     * The map is rigid + uniform-scale + (optional) reflection.
     * ------------------------------------------------------------------ */
    function triangleFrame(tile, chirality) {
        // Parent (unit-edge) vertices in world.
        const [A, B, C] = tile.vertices;
        // Canonical δ-frame has A=(0,0), B=(δ,0), C=(0,δ) when chirality=+1.
        // For chirality=-1 we use B=(δ,0), C=(0,-δ) which is the reflection.
        // The frame transform sends canonical points to world points.
        //
        // World vectors:
        //   AB_world = B - A
        //   AC_world = C - A
        // We want T such that T(0,0)=A, T(δ,0)=B, T(0,δ)=C    (chirality +1)
        //                  or T(0,0)=A, T(δ,0)=B, T(0,-δ)=C   (chirality -1)
        //
        // Linear part columns are AB_world/δ and ±AC_world/δ; translation is A.
        const ABx = (B.get(0) - A.get(0)) / DELTA;
        const ABy = (B.get(1) - A.get(1)) / DELTA;
        const ACx = (C.get(0) - A.get(0)) / DELTA;
        const ACy = (C.get(1) - A.get(1)) / DELTA;
        if (chirality === 1) {
            return new AmmannBeenkerTransform(new Float64Array([
                ABx, ACx, A.get(0),
                ABy, ACy, A.get(1),
                0, 0, 1
            ]));
        }
        // Chirality -1: canonical C is (0,-δ), so the y-column is -AC_world/δ
        // applied to (0,-δ) ⇒ AC_world. Equivalent matrix:
        return new AmmannBeenkerTransform(new Float64Array([
            ABx, -ACx, A.get(0),
            ABy, -ACy, A.get(1),
            0, 0, 1
        ]));
    }
    function rhombFrame(tile) {
        // Parent vertices V0 (acute), V1 (obtuse), V2 (acute), V3 (obtuse).
        // Canonical frame: long diagonal along +x, centre at origin, V0 at -L/2.
        // Build the rigid map that places centre at midpoint(V0,V2) and aligns
        // canonical +x with the world V0→V2 direction. The scale is implicit in
        // the diagonal lengths; the canonical L equals world V0→V2 distance, so
        // the linear map is a pure rotation.
        const V0 = tile.vertices[0];
        const V1 = tile.vertices[1];
        const V2 = tile.vertices[2];
        const cx = (V0.get(0) + V2.get(0)) / 2;
        const cy = (V0.get(1) + V2.get(1)) / 2;
        // World direction of the long diagonal.
        const dx = V2.get(0) - cx;
        const dy = V2.get(1) - cy;
        const longLen = Math.hypot(dx, dy);
        const ux = dx / longLen; // unit vector along long diagonal in world
        const uy = dy / longLen;
        // Short-axis world direction: should align with canonical +y, i.e. point
        // toward V1. The canonical short axis is +y, so its world image is the
        // 90°-CCW rotation of the long-axis world vector — but only if the parent
        // is wound CCW. If V1 is on the CW side of the V0→V2 ray, we need the
        // opposite y-axis (a reflection). Detect that and flip the y column.
        const midToV1x = V1.get(0) - cx;
        const midToV1y = V1.get(1) - cy;
        // 2D cross product of long-axis (ux,uy) with mid→V1: positive = V1 is on
        // the CCW side, which is what we want.
        const cross = ux * midToV1y - uy * midToV1x;
        const sign = cross >= 0 ? 1 : -1;
        return new AmmannBeenkerTransform(new Float64Array([
            ux, -uy * sign, cx,
            uy, ux * sign, cy,
            0, 0, 1
        ]));
    }
    /* ------------------------------------------------------------------ *
     * Winding helpers
     * ------------------------------------------------------------------ */
    function signedArea(verts) {
        let s = 0;
        for (let i = 0; i < verts.length; i++) {
            const a = verts[i];
            const b = verts[(i + 1) % verts.length];
            s += a.get(0) * b.get(1) - b.get(0) * a.get(1);
        }
        return s / 2;
    }
    function ensureTriangleCCW(t) {
        if (signedArea(t.vertices) < 0) {
            // Reverse v[1] and v[2] only; vertex 0 stays the right-angle anchor,
            // and reversing those two flips chirality.
            const tmp = t.vertices[1];
            t.vertices[1] = t.vertices[2];
            t.vertices[2] = tmp;
            if (t.metadata && (t.metadata.chirality === 1 || t.metadata.chirality === -1)) {
                t.metadata.chirality = -t.metadata.chirality;
            }
        }
    }
    function ensureRhombCCW(t) {
        if (signedArea(t.vertices) < 0) {
            // Reverse winding while preserving "vertex 0 is acute". Reversing
            // [V0,V1,V2,V3] gives [V3,V2,V1,V0]; rotate by 1 to get [V0,V3,V2,V1].
            const v = t.vertices;
            t.vertices = [v[0], v[3], v[2], v[1]];
        }
    }
    /* ------------------------------------------------------------------ *
     * Tiling algorithm
     * ------------------------------------------------------------------ */
    class AmmannBeenkerTilingAlgorithm extends AbstractTilingAlgorithm {
        substitutionRule;
        initialEdgeLength = 1;
        constructor(config) {
            super(config);
            this.substitutionRule = new AmmannBeenkerSubstitutionRule();
        }
        /**
         * Build an 8-rhomb star centred at the origin: eight unit rhombs sharing
         * the central vertex, rotated 45° around the centre. Edge length is
         * chosen so the star fits the configured bounds; subsequent generations
         * preserve edge length and the patch grows outward by a factor of δ each
         * iteration.
         *
         * @param _prototypes unused — initial pattern is fixed.
         */
        initialize(_prototypes = []) {
            const initialTiles = new Map();
            const center = v2$1(0, 0);
            // Star "long radius" = long diagonal of one unit rhomb, scaled by edge.
            const longDiagFactor = Math.sqrt(2 + SQRT2);
            const targetRadius = Math.min(this.config.bounds.width, this.config.bounds.height) / 2;
            const edge = targetRadius / longDiagFactor;
            this.initialEdgeLength = edge;
            for (let i = 0; i < 8; i++) {
                const a0 = i * Math.PI / 4;
                const a1 = (i + 1) * Math.PI / 4;
                const e0 = v2$1(Math.cos(a0) * edge, Math.sin(a0) * edge);
                const e1 = v2$1(Math.cos(a1) * edge, Math.sin(a1) * edge);
                const far = e0.add(e1);
                // V0 (acute, centre) -> V1 (obtuse, e0) -> V2 (acute, far) -> V3 (obtuse, e1).
                // Going CCW requires e0 to be the "earlier" angle; with a0 < a1
                // and the rhomb spanning the wedge a0..a1, going centre → e0 →
                // far → e1 walks CCW around the rhomb. ✓
                const tile = new AmmannBeenkerTile([center.clone(), e0, far, e1], 'rhomb');
                ensureRhombCCW(tile); // belt-and-braces
                initialTiles.set(`r0-${i}`, tile);
            }
            this.state = {
                tiles: initialTiles,
                boundary: this.calculateBoundary(Array.from(initialTiles.values())),
                generation: 0,
                metadata: {
                    initialEdgeLength: edge,
                    edgeLength: edge,
                    inflationPerGen: DELTA
                }
            };
        }
        /**
         * Inflate-then-subdivide: scale all current tiles by δ about the origin,
         * then replace each tile with its substitution children. The scale step
         * is what keeps child edge length equal to parent edge length so the
         * patch grows instead of shrinking.
         */
        generateNextIteration() {
            const inflate = AmmannBeenkerTransform.scale(DELTA);
            const newTiles = new Map();
            let counter = 0;
            for (const [, tile] of this.state.tiles) {
                const inflated = tile.transform(inflate);
                const children = this.substitutionRule.substitute(inflated);
                const gen = this.state.generation + 1;
                for (const child of children) {
                    newTiles.set(`g${gen}-${counter++}`, child);
                }
            }
            const gen = this.state.generation + 1;
            this.state = {
                tiles: newTiles,
                boundary: this.calculateBoundary(Array.from(newTiles.values())),
                generation: gen,
                metadata: {
                    initialEdgeLength: this.initialEdgeLength,
                    edgeLength: this.initialEdgeLength, // constant by design
                    inflationPerGen: DELTA,
                    patchRadiusFactor: Math.pow(DELTA, gen)
                }
            };
            return this.state;
        }
        createInitialState() {
            return { tiles: new Map(), boundary: [], generation: 0, metadata: {} };
        }
        /* ----- boundary / convex hull ----- */
        calculateBoundary(tiles) {
            const vertices = tiles.flatMap(t => t.vertices);
            const unique = dedupVertices(vertices);
            const hull = convexHullAndrew(unique);
            // Return clones so downstream mutation can't corrupt our tile data.
            return hull.map(p => p.clone());
        }
    }
    /* ------------------------------------------------------------------ *
     * Geometric utilities
     * ------------------------------------------------------------------ */
    /** O(n) deduplication via grid hashing. */
    function dedupVertices(verts) {
        const EPS = 1e-9;
        const seen = new Map();
        for (const v of verts) {
            const kx = Math.round(v.get(0) / EPS);
            const ky = Math.round(v.get(1) / EPS);
            const key = `${kx},${ky}`;
            if (!seen.has(key))
                seen.set(key, v);
        }
        return Array.from(seen.values());
    }
    /**
     * Andrew's monotone chain convex hull. O(n log n), and unlike the Graham scan
     * it doesn't choke on collinear points or coincident "anchor" cases.
     */
    function convexHullAndrew(points) {
        if (points.length <= 1)
            return points.slice();
        const sorted = points.slice().sort((a, b) => {
            const ax = a.get(0), bx = b.get(0);
            if (ax !== bx)
                return ax - bx;
            return a.get(1) - b.get(1);
        });
        const cross = (o, a, b) => (a.get(0) - o.get(0)) * (b.get(1) - o.get(1)) -
            (a.get(1) - o.get(1)) * (b.get(0) - o.get(0));
        const lower = [];
        for (const p of sorted) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
                lower.pop();
            }
            lower.push(p);
        }
        const upper = [];
        for (let i = sorted.length - 1; i >= 0; i--) {
            const p = sorted[i];
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
                upper.pop();
            }
            upper.push(p);
        }
        lower.pop();
        upper.pop();
        return lower.concat(upper);
    }

    /**
     * Penrose Tiling Implementation (P3 - rhombus tiling)
     *
     * Uses the standard Robinson half-rhomb (triangle) deflation. Each tile is a
     * triangle of one of two types:
     *   - "thick" : the acute golden gnomon (36°-72°-72°). Half of a thick rhomb.
     *   - "thin"  : the obtuse golden gnomon (36°-36°-108°). Half of a thin rhomb.
     *
     * Two mirror-image triangles of the same type meet along their long edges to
     * form a complete rhomb. Storing tiles as half-rhombs (triangles) is the
     * canonical representation used by virtually every working Penrose
     * implementation, because the deflation rules cleanly subdivide triangles but
     * not whole rhombs.
     *
     * Vertex convention (matches the standard Preshing reference algorithm):
     *   thick: vertices [A, B, C] with A the 36° apex, |AB| = |AC| = phi*|BC|
     *   thin : vertices [A, B, C] with B the 108° apex, |AB| = |BC|, |AC| longest
     *
     * The substitution rule subdivides each triangle by the inverse golden ratio,
     * producing 2 children for thick tiles and 3 children for thin tiles.
     *
     * @module PenroseTiling
     */
    const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const INV_PHI = 1 / PHI; // = phi - 1
    /**
     * A single Penrose half-rhomb (Robinson triangle).
     *
     * vertices.length === 3.
     * tileType is "thick" (acute, 36-72-72) or "thin" (obtuse, 36-36-108).
     */
    class PenroseTile {
        vertices;
        tileType;
        metadata;
        constructor(vertices, tileType, metadata) {
            if (vertices.length !== 3) {
                throw new Error(`PenroseTile expects 3 vertices, got ${vertices.length}`);
            }
            this.vertices = vertices;
            this.tileType = tileType;
            this.metadata = metadata;
        }
        transform(matrix) {
            const newVertices = this.vertices.map(v => matrix.transform(v));
            return new PenroseTile(newVertices, this.tileType, this.metadata);
        }
        clone() {
            return new PenroseTile(this.vertices.map(v => v.clone()), this.tileType, this.metadata ? { ...this.metadata } : undefined);
        }
    }
    /**
     * Edge-length matching rule for Penrose half-rhomb tiles.
     *
     * Note: full Penrose matching rules require oriented edge labels (the classic
     * arrow / colored-arc decorations) to enforce aperiodicity. Edge-length
     * matching is necessary but not sufficient. For substitution-based generation
     * (used by `PenroseTilingAlgorithm`), aperiodicity is enforced structurally by
     * the deflation rules themselves, so this rule is here for completeness.
     */
    class PenroseMatchingRule {
        static EPSILON = 1e-10;
        space;
        constructor(space = new EuclideanSpace()) {
            this.space = space;
        }
        canMatch(tile1, tile2, edge) {
            const e1 = this.getEdge(tile1, edge);
            const e2 = this.getEdge(tile2, edge);
            const length1 = this.space.distance(e1.start, e1.end);
            const length2 = this.space.distance(e2.start, e2.end);
            return Math.abs(length1 - length2) < PenroseMatchingRule.EPSILON;
        }
        getMatchingTransform(tile1, tile2, edge) {
            const e1 = this.getEdge(tile1, edge);
            const e2 = this.getEdge(tile2, edge);
            // Place tile2 on the opposite side of the shared edge: e2.start should
            // map to e1.end and e2.end to e1.start (i.e. reverse the direction).
            const angle1 = Math.atan2(e1.end.get(1) - e1.start.get(1), e1.end.get(0) - e1.start.get(0));
            const angle2 = Math.atan2(e2.end.get(1) - e2.start.get(1), e2.end.get(0) - e2.start.get(0));
            const rotationAngle = angle1 + Math.PI - angle2;
            // Rotate about the origin, then translate so that e2.start lands on
            // e1.end. Closed form for an affine rot+translate that maps point p
            // to target q while rotating by theta is: T = q - R(theta) * p.
            const cos = Math.cos(rotationAngle);
            const sin = Math.sin(rotationAngle);
            const sx = e2.start.get(0);
            const sy = e2.start.get(1);
            const tx = e1.end.get(0) - (cos * sx - sin * sy);
            const ty = e1.end.get(1) - (sin * sx + cos * sy);
            const Vector2 = Vector.forDimension(2);
            return new PenroseTransform(new Vector2([tx, ty]), rotationAngle);
        }
        getEdge(tile, edge) {
            const v = tile.vertices;
            return { start: v[edge % v.length], end: v[(edge + 1) % v.length] };
        }
    }
    /**
     * 2D affine transform (rotation + translation), stored as a 3x3 row-major
     * homogeneous matrix.
     */
    class PenroseTransform {
        elements;
        constructor(translation, rotation) {
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            this.elements = new Float64Array([
                cos, -sin, translation.get(0),
                sin, cos, translation.get(1),
                0, 0, 1
            ]);
        }
        transform(vector) {
            const x = vector.get(0);
            const y = vector.get(1);
            const Vector2 = Vector.forDimension(2);
            return new Vector2([
                this.elements[0] * x + this.elements[1] * y + this.elements[2],
                this.elements[3] * x + this.elements[4] * y + this.elements[5]
            ]);
        }
        compose(other) {
            // Returns this * other (apply 'other' first, then 'this').
            const a = this.elements;
            const b = other.elements;
            const result = new Float64Array(9);
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    let sum = 0;
                    for (let k = 0; k < 3; k++) {
                        sum += a[i * 3 + k] * b[k * 3 + j];
                    }
                    result[i * 3 + j] = sum;
                }
            }
            const Vector2 = Vector.forDimension(2);
            return new PenroseTransform(new Vector2([result[2], result[5]]), Math.atan2(result[3], result[0]));
        }
        inverse() {
            // For a pure rotation+translation R*t, the inverse is R^T applied to -t.
            const cos = this.elements[0];
            const sin = this.elements[3];
            const tx = this.elements[2];
            const ty = this.elements[5];
            const invTx = -(cos * tx + sin * ty);
            const invTy = -(-sin * tx + cos * ty);
            const invRotation = -Math.atan2(sin, cos);
            const Vector2 = Vector.forDimension(2);
            return new PenroseTransform(new Vector2([invTx, invTy]), invRotation);
        }
    }
    /**
     * Standard Robinson half-rhomb deflation rules.
     *
     * thick (acute, 36-72-72) with vertices [A, B, C], A is the 36° apex:
     *   P = A + (B - A) / phi
     *   -> [thick: (C, P, B), thin: (P, C, A)]
     *
     * thin (obtuse, 36-36-108) with vertices [A, B, C], B is the 108° apex:
     *   Q = B + (A - B) / phi
     *   R = B + (C - B) / phi
     *   -> [thin: (R, C, A), thin: (Q, R, B), thick: (R, Q, A)]
     *
     * Each application scales linear dimensions by 1/phi.
     */
    class PenroseSubstitutionRule {
        substitute(tile) {
            if (tile.tileType === 'thick')
                return this.substituteThick(tile);
            if (tile.tileType === 'thin')
                return this.substituteThin(tile);
            throw new Error(`Unknown tile type: ${tile.tileType}`);
        }
        /** Linear inflation factor. Deflation scales by 1/phi. */
        getScaleFactor() {
            return PHI;
        }
        substituteThick(tile) {
            const [A, B, C] = tile.vertices;
            // P = A + (B - A) / phi
            const P = A.add(B.subtract(A).scale(INV_PHI));
            return [
                new PenroseTile([C.clone(), P.clone(), B.clone()], 'thick'),
                new PenroseTile([P.clone(), C.clone(), A.clone()], 'thin'),
            ];
        }
        substituteThin(tile) {
            const [A, B, C] = tile.vertices;
            // Q = B + (A - B) / phi ; R = B + (C - B) / phi
            const Q = B.add(A.subtract(B).scale(INV_PHI));
            const R = B.add(C.subtract(B).scale(INV_PHI));
            return [
                new PenroseTile([R.clone(), C.clone(), A.clone()], 'thin'),
                new PenroseTile([Q.clone(), R.clone(), B.clone()], 'thin'),
                new PenroseTile([R.clone(), Q.clone(), A.clone()], 'thick'),
            ];
        }
    }
    /**
     * Generates a Penrose P3 tiling by repeated deflation of an initial "sun"
     * wheel of 10 thick half-rhombs arranged around the origin.
     */
    class PenroseTilingAlgorithm extends AbstractTilingAlgorithm {
        substitutionRule;
        constructor(config) {
            super(config);
            this.substitutionRule = new PenroseSubstitutionRule();
        }
        /**
         * Builds the standard 10-triangle wheel around the origin. Every other
         * triangle is mirrored so that adjacent triangles meet along matching
         * edges (forming complete thick rhombs).
         *
         * @param _prototypes unused — initial pattern is fixed
         */
        initialize(_prototypes = []) {
            const Vector2 = Vector.forDimension(2);
            const initialTiles = new Map();
            const radius = this.config.bounds.width / 4;
            const center = new Vector2([0, 0]);
            for (let i = 0; i < 10; i++) {
                // Two adjacent rim points 36° apart.
                const angle1 = ((2 * i - 1) * Math.PI) / 10;
                const angle2 = ((2 * i + 1) * Math.PI) / 10;
                let B = new Vector2([radius * Math.cos(angle1), radius * Math.sin(angle1)]);
                let C = new Vector2([radius * Math.cos(angle2), radius * Math.sin(angle2)]);
                // Mirror every other triangle so adjacent pairs form complete rhombs.
                if (i % 2 === 0) {
                    const tmp = B;
                    B = C;
                    C = tmp;
                }
                // A is the 36° apex at the centre.
                const tile = new PenroseTile([center.clone(), B, C], 'thick');
                initialTiles.set(`initial_${i}`, tile);
            }
            this.state = {
                tiles: initialTiles,
                boundary: this.calculateBoundary(Array.from(initialTiles.values())),
                generation: 0,
                metadata: {}
            };
        }
        generateNextIteration() {
            const newTiles = new Map();
            let tileCount = 0;
            for (const [id, tile] of this.state.tiles) {
                const substituted = this.substitutionRule.substitute(tile);
                for (const newTile of substituted) {
                    newTiles.set(`${id}_${tileCount++}`, newTile);
                }
            }
            this.state = {
                tiles: newTiles,
                boundary: this.calculateBoundary(Array.from(newTiles.values())),
                generation: this.state.generation + 1,
                metadata: {
                    scaleFactor: Math.pow(this.substitutionRule.getScaleFactor(), this.state.generation + 1)
                }
            };
            return this.state;
        }
        createInitialState() {
            return { tiles: new Map(), boundary: [], generation: 0, metadata: {} };
        }
        /* ----- boundary / convex hull helpers ----- */
        calculateBoundary(tiles) {
            const vertices = tiles.flatMap(t => t.vertices);
            const unique = this.removeDuplicateVertices(vertices);
            return this.computeConvexHull(unique);
        }
        computeConvexHull(points) {
            if (points.length <= 3)
                return points.slice();
            let anchor = points[0];
            for (const p of points) {
                if (p.get(1) < anchor.get(1) ||
                    (p.get(1) === anchor.get(1) && p.get(0) < anchor.get(0))) {
                    anchor = p;
                }
            }
            const sorted = points
                .filter(p => p !== anchor)
                .sort((a, b) => {
                const angleA = Math.atan2(a.get(1) - anchor.get(1), a.get(0) - anchor.get(0));
                const angleB = Math.atan2(b.get(1) - anchor.get(1), b.get(0) - anchor.get(0));
                if (angleA === angleB) {
                    return this.squaredDistance(anchor, a) - this.squaredDistance(anchor, b);
                }
                return angleA - angleB;
            });
            const hull = [anchor];
            if (sorted.length === 0)
                return hull;
            hull.push(sorted[0]);
            if (sorted.length === 1)
                return hull;
            hull.push(sorted[1]);
            for (let i = 2; i < sorted.length; i++) {
                while (hull.length >= 2 &&
                    !this.isCounterClockwise(hull[hull.length - 2], hull[hull.length - 1], sorted[i])) {
                    hull.pop();
                }
                hull.push(sorted[i]);
            }
            return hull;
        }
        squaredDistance(a, b) {
            const dx = b.get(0) - a.get(0);
            const dy = b.get(1) - a.get(1);
            return dx * dx + dy * dy;
        }
        isCounterClockwise(p1, p2, p3) {
            const cross = (p2.get(0) - p1.get(0)) * (p3.get(1) - p1.get(1)) -
                (p2.get(1) - p1.get(1)) * (p3.get(0) - p1.get(0));
            return cross > 0;
        }
        removeDuplicateVertices(vertices) {
            const EPSILON = 1e-10;
            const unique = [];
            for (const v of vertices) {
                let dup = false;
                for (const u of unique) {
                    if (Math.abs(v.get(0) - u.get(0)) < EPSILON &&
                        Math.abs(v.get(1) - u.get(1)) < EPSILON) {
                        dup = true;
                        break;
                    }
                }
                if (!dup)
                    unique.push(v);
            }
            return unique;
        }
        getBoundingBox(points) {
            if (points.length === 0)
                return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
            let minX = points[0].get(0), maxX = minX;
            let minY = points[0].get(1), maxY = minY;
            for (const p of points) {
                const x = p.get(0), y = p.get(1);
                if (x < minX)
                    minX = x;
                if (x > maxX)
                    maxX = x;
                if (y < minY)
                    minY = y;
                if (y > maxY)
                    maxY = y;
            }
            return { minX, maxX, minY, maxY };
        }
        /**
         * Discards tiles fully outside the configured bounds.
         *
         * Note: the initial wheel is centred at (0,0), so this clips against the
         * rectangle [0,width]x[0,height]. Callers wanting a centred crop should
         * translate first.
         */
        optimizeTiling() {
            const w = this.config.bounds.width;
            const h = this.config.bounds.height;
            const newTiles = new Map();
            for (const [id, tile] of this.state.tiles) {
                const box = this.getBoundingBox(tile.vertices);
                if (box.maxX >= 0 && box.minX <= w && box.maxY >= 0 && box.minY <= h) {
                    newTiles.set(id, tile);
                }
            }
            this.state.tiles = newTiles;
            this.state.boundary = this.calculateBoundary(Array.from(newTiles.values()));
        }
    }

    var index$3 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        AmmannBeenkerMatchingRule: AmmannBeenkerMatchingRule,
        AmmannBeenkerSubstitutionRule: AmmannBeenkerSubstitutionRule,
        AmmannBeenkerTile: AmmannBeenkerTile,
        AmmannBeenkerTilingAlgorithm: AmmannBeenkerTilingAlgorithm,
        AmmannBeenkerTransform: AmmannBeenkerTransform,
        PenroseMatchingRule: PenroseMatchingRule,
        PenroseSubstitutionRule: PenroseSubstitutionRule,
        PenroseTile: PenroseTile,
        PenroseTilingAlgorithm: PenroseTilingAlgorithm,
        PenroseTransform: PenroseTransform
    });

    /**
     * Concrete 2D vector class. `Vector<2>` is abstract (no `dimensions` set);
     * `Vector.forDimension(2)` produces a usable constructor.
     */
    const Vec2D = Vector.forDimension(2);
    /** Convenience constructor for 2D points / vectors. */
    const v2 = (x, y) => new Vec2D([x, y]);

    /**
     * Generic tile implementation. Concrete tessellations build instances of this
     * directly — they don't need their own subclasses.
     */
    class BaseTile {
        vertices;
        tileType;
        metadata;
        constructor(vertices, tileType, metadata) {
            this.vertices = vertices;
            this.tileType = tileType;
            this.metadata = metadata;
        }
        transform(matrix) {
            const newVerts = this.vertices.map(v => matrix.transform(v));
            const newMeta = this.metadata ? { ...this.metadata } : undefined;
            return new BaseTile(newVerts, this.tileType, newMeta);
        }
        clone() {
            const newVerts = this.vertices.map(v => v2(v.get(0), v.get(1)));
            const newMeta = this.metadata ? { ...this.metadata } : undefined;
            return new BaseTile(newVerts, this.tileType, newMeta);
        }
        /** Geometric centroid (arithmetic mean of vertices). */
        centroid() {
            let sx = 0;
            let sy = 0;
            for (const v of this.vertices) {
                sx += v.get(0);
                sy += v.get(1);
            }
            const n = this.vertices.length;
            return v2(sx / n, sy / n);
        }
    }

    /**
     * Default edge length used when the config does not specify one.
     */
    const DEFAULT_EDGE_LENGTH = 20;
    /**
     * Abstract base for the three regular tessellations of the Euclidean plane:
     * triangular, square, and hexagonal. These are the only edge-to-edge tilings
     * by a single regular polygon (Schläfli symbols {3,6}, {4,4}, {6,3}).
     *
     * Iteration model
     * ---------------
     * The tiling is grown outward from the centre of the bounded region in
     * concentric "rings" of grid cells:
     *
     *   - Iteration 0 places the seed tile (the cell at grid coordinates (0,0)).
     *   - Iteration N (>0) places every grid cell at Chebyshev distance N from
     *     the origin whose centroid lies inside the viewport bounds.
     *
     * Generation halts naturally once a ring contributes zero in-bounds tiles
     * AND the ring radius exceeds the viewport's diagonal extent — by then no
     * larger ring can possibly produce in-bounds tiles either.
     *
     * Coordinate system
     * -----------------
     * SVG-style: x increases to the right, y increases downward. Tile vertices
     * are listed in clockwise order under that convention, matching the contract
     * on `Tile.vertices`.
     */
    class RegularTilingAlgorithm extends AbstractTilingAlgorithm {
        edgeLength;
        origin;
        prototype = null;
        /** Tracks how far out we've already grown, so generateNextIteration is incremental. */
        currentRing = -1;
        constructor(config) {
            super(config);
            const params = config.parameters ?? {};
            this.edgeLength = typeof params.edgeLength === 'number' && params.edgeLength > 0
                ? params.edgeLength
                : DEFAULT_EDGE_LENGTH;
            this.origin = v2(config.bounds.width / 2, config.bounds.height / 2);
        }
        initialize(prototypes) {
            this.prototype = prototypes.length > 0 ? prototypes[0] : null;
            this.state = this.createInitialState();
            this.currentRing = -1;
            this.placeRing(0);
            this.currentRing = 0;
            this.state.generation = 0;
        }
        generateNextIteration() {
            const max = this.config.maxIterations;
            if (max !== undefined && this.currentRing + 1 >= max) {
                return this.state;
            }
            const nextRing = this.currentRing + 1;
            const placed = this.placeRing(nextRing);
            this.currentRing = nextRing;
            this.state.generation = nextRing;
            // If this ring contributed nothing AND we've already exceeded the
            // bounding box's diagonal in tile-units, no future ring can succeed.
            // Mark generation as terminal by leaving currentRing where it is.
            if (placed === 0 && this.ringExceedsBounds(nextRing)) {
                this.state.metadata.complete = true;
            }
            return this.state;
        }
        createInitialState() {
            return {
                tiles: new Map(),
                boundary: [],
                generation: 0,
                metadata: {
                    gridWidth: this.config.bounds.width,
                    gridHeight: this.config.bounds.height,
                    edgeLength: this.edgeLength,
                    tileType: this.tileTypeName(),
                    complete: false,
                },
            };
        }
        /**
         * Place every grid cell on ring `n` (Chebyshev distance n from origin)
         * whose centroid is within bounds. Returns the count of tiles placed.
         */
        placeRing(n) {
            let placed = 0;
            for (const cell of this.cellsOnRing(n)) {
                const key = this.cellKey(cell);
                if (this.state.tiles.has(key))
                    continue;
                const tile = this.makeTileAtCell(cell);
                if (!this.tileCentroidInBounds(tile))
                    continue;
                this.state.tiles.set(key, tile);
                placed++;
            }
            return placed;
        }
        /**
         * Yields every integer cell coordinate on the square shell of radius n.
         * For n=0 this is just (0,0). For n>0 it walks the perimeter of the
         * [-n, n] × [-n, n] grid square. Triangular tilings override this to
         * also enumerate the orientation bit.
         */
        *cellsOnRing(n) {
            if (n === 0) {
                yield [0, 0];
                return;
            }
            // top and bottom edges, full width
            for (let c = -n; c <= n; c++) {
                yield [-n, c];
                yield [n, c];
            }
            // left and right edges, excluding corners (already emitted)
            for (let r = -n + 1; r <= n - 1; r++) {
                yield [r, -n];
                yield [r, n];
            }
        }
        tileCentroidInBounds(tile) {
            let sx = 0;
            let sy = 0;
            for (const v of tile.vertices) {
                sx += v.get(0);
                sy += v.get(1);
            }
            const n = tile.vertices.length;
            const cx = sx / n;
            const cy = sy / n;
            return cx >= 0 && cx <= this.config.bounds.width
                && cy >= 0 && cy <= this.config.bounds.height;
        }
        ringExceedsBounds(n) {
            // Conservative: once n * edgeLength exceeds the viewport diagonal,
            // no ring at radius >= n can produce an in-bounds tile.
            const diag = Math.hypot(this.config.bounds.width, this.config.bounds.height);
            return n * this.edgeLength > diag;
        }
    }
    /* --------------------------------------------------------------------- */
    /*  Square tiling — Schläfli {4, 4}                                       */
    /* --------------------------------------------------------------------- */
    /**
     * Regular square tiling. Edges are axis-aligned. Tile (row, col) occupies
     * the cell [col*s, (col+1)*s] × [row*s, (row+1)*s] in centred coordinates,
     * where s is the edge length.
     *
     * Vertex order (clockwise in SVG/y-down coords):
     *   v0 = top-left, v1 = top-right, v2 = bottom-right, v3 = bottom-left.
     */
    class SquareTiling extends RegularTilingAlgorithm {
        tileTypeName() {
            return 'square';
        }
        cellKey(cell) {
            return `${cell[0]},${cell[1]}`;
        }
        makeTileAtCell(cell) {
            const [row, col] = cell;
            const s = this.edgeLength;
            const x0 = this.origin.get(0) + col * s - s / 2;
            const y0 = this.origin.get(1) + row * s - s / 2;
            const verts = [
                v2(x0, y0), // top-left
                v2(x0 + s, y0), // top-right
                v2(x0 + s, y0 + s), // bottom-right
                v2(x0, y0 + s), // bottom-left
            ];
            return new BaseTile(verts, 'square', { row, col });
        }
    }
    /* --------------------------------------------------------------------- */
    /*  Hexagonal tiling — Schläfli {6, 3}                                    */
    /* --------------------------------------------------------------------- */
    /**
     * Regular hexagonal tiling using "pointy-top" orientation with offset rows.
     *
     * For circumradius R = edgeLength:
     *   - hex width  = √3 · R
     *   - hex height = 2 · R
     *   - vertical step between rows = 1.5 · R
     *   - odd rows are shifted right by (√3 · R) / 2
     *
     * Vertex order (clockwise, y-down): starts at top apex and proceeds
     *   top → upper-right → lower-right → bottom → lower-left → upper-left.
     */
    class HexagonalTiling extends RegularTilingAlgorithm {
        tileTypeName() {
            return 'hexagon';
        }
        cellKey(cell) {
            return `${cell[0]},${cell[1]}`;
        }
        makeTileAtCell(cell) {
            const [row, col] = cell;
            const R = this.edgeLength;
            const sqrt3 = Math.sqrt(3);
            const hexW = sqrt3 * R;
            const rowOffset = ((row % 2) + 2) % 2 === 1 ? hexW / 2 : 0;
            const cx = this.origin.get(0) + col * hexW + rowOffset;
            const cy = this.origin.get(1) + row * 1.5 * R;
            // Six vertices, clockwise from the top apex (angle = -90°),
            // stepping by 60°. With y increasing downward, sin must be negated
            // so that "up" really is up on screen.
            const verts = [];
            for (let i = 0; i < 6; i++) {
                const angle = -Math.PI / 2 + i * Math.PI / 3;
                verts.push(v2(cx + R * Math.cos(angle), cy + R * Math.sin(angle)));
            }
            return new BaseTile(verts, 'hexagon', { row, col });
        }
    }
    /* --------------------------------------------------------------------- */
    /*  Triangular tiling — Schläfli {3, 6}                                   */
    /* --------------------------------------------------------------------- */
    /**
     * Regular triangular tiling. Equilateral triangles alternate between
     * up-pointing (apex at top) and down-pointing (apex at bottom). Two
     * adjacent triangles in the same row form a rhombus.
     *
     * For edge length s, triangle height h = s · √3 / 2. Within row r,
     * the kth triangle occupies horizontal span [k·s/2, (k+2)·s/2]. A
     * triangle at (row r, col c) is up-pointing iff (r + c) is even.
     *
     * Cells are encoded as [row, col, orientation] where orientation
     *   0 = up-pointing, 1 = down-pointing.
     */
    class TriangularTiling extends RegularTilingAlgorithm {
        tileTypeName() {
            return 'triangle';
        }
        cellKey(cell) {
            return `${cell[0]},${cell[1]},${cell[2]}`;
        }
        /**
         * Override the ring iterator to also yield the orientation bit: each
         * (row, col) on the shell yields exactly one triangle, with orientation
         * forced by the parity of (row + col).
         */
        *cellsOnRing(n) {
            for (const cell of super.cellsOnRing(n)) {
                const [row, col] = cell;
                const orientation = ((row + col) % 2 + 2) % 2 === 0 ? 0 : 1;
                yield [row, col, orientation];
            }
        }
        makeTileAtCell(cell) {
            const [row, col, orientation] = cell;
            const s = this.edgeLength;
            const h = s * Math.sqrt(3) / 2;
            // Anchor: top-left of the row's strip in centred coordinates.
            const baseX = this.origin.get(0) + col * (s / 2);
            const topY = this.origin.get(1) + row * h;
            const botY = topY + h;
            let verts;
            if (orientation === 0) {
                // Up-pointing: apex on top, base on bottom.
                // Clockwise (y-down): apex → bottom-right → bottom-left.
                verts = [
                    v2(baseX + s / 2, topY), // apex
                    v2(baseX + s, botY), // bottom-right
                    v2(baseX, botY), // bottom-left
                ];
            }
            else {
                // Down-pointing: base on top, apex on bottom.
                // Clockwise (y-down): top-left → top-right → apex.
                verts = [
                    v2(baseX, topY), // top-left
                    v2(baseX + s, topY), // top-right
                    v2(baseX + s / 2, botY), // apex
                ];
            }
            return new BaseTile(verts, 'triangle', { row, col, orientation });
        }
    }

    var index$2 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        HexagonalTiling: HexagonalTiling,
        RegularTilingAlgorithm: RegularTilingAlgorithm,
        SquareTiling: SquareTiling,
        TriangularTiling: TriangularTiling
    });

    var index$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        regular: index$2
    });

    var index = /*#__PURE__*/Object.freeze({
        __proto__: null,
        tessellation: index$1,
        tiling: index$3
    });

    exports.composition = index$m;
    exports.core = index$n;
    exports.distribution = index$4;
    exports.layout = index$k;
    exports.lindenmayer = index$i;
    exports.math = index$8;
    exports.pattern = index;

}));
//# sourceMappingURL=index.umd.js.map
