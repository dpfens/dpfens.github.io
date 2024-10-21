importScripts('xmeans.js');

self.addEventListener('message', function(event) {
    const minK = event.data.minK;
    const maxK = event.data.maxK;
    const maxIterations = event.data.maxIterations;
    const data = event.data.data;
    const splitThreshold = event.data.splitThreshold || 0.05;
    const distanceThreshold = event.data.distanceThreshold || 1;
    var kmeansClusterer = new XMeans(minK, maxK, deltaE2000, {maxIterations: maxIterations, splitThreshold: splitThreshold, distanceThreshold: distanceThreshold}),
            results = kmeansClusterer.transform(data, {kDTree: false});
        results.daviesBouldinIndices = kmeansClusterer.daviesBouldinIndex(results);
        results.calinskiHarabaszIndex = kmeansClusterer.calinskiHarabaszIndex(data, results);
        results.clusterDistances = kmeansClusterer.meanDistanceBetweenCentroids(results.clusters);
        results.intraClusterDistances = kmeansClusterer.meanDistanceWithinClusters(results.clusters);
    self.postMessage(results);
});


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

    const l1 = labA[0],
        a1 = labA[1],
        b1 = labA[2],
        l2 = labB[0],
        a2 = labB[1],
        b2 = labB[2];

    // missing utility functions added to Math Object
    Math.rad2deg = function(rad) {
        return 360 * rad / (2 * Math.PI);
    };
    Math.deg2rad = function(deg) {
        return (2 * Math.PI * deg) / 360;
    };
    
    const avgL = (l1 + l2) / 2;
    const c1 = Math.sqrt(Math.pow(a1, 2) + Math.pow(b1, 2));
    const c2 = Math.sqrt(Math.pow(a2, 2) + Math.pow(b2, 2));
    const avgC = (c1 + c2) / 2;
    const g = (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7)))) / 2;

    const a1p = a1 * (1 + g);
    const a2p = a2 * (1 + g);

    const c1p = Math.sqrt(Math.pow(a1p, 2) + Math.pow(b1, 2));
    const c2p = Math.sqrt(Math.pow(a2p, 2) + Math.pow(b2, 2));

    const avgCp = (c1p + c2p) / 2;

    let h1p = Math.rad2deg(Math.atan2(b1, a1p));
    if (h1p < 0) {
        h1p = h1p + 360;
    }

    let h2p = Math.rad2deg(Math.atan2(b2, a2p));
    if (h2p < 0) {
        h2p = h2p + 360;
    }

    const avghp = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + 360) / 2 : (h1p + h2p) / 2;

    const t = 1 - 0.17 * Math.cos(Math.deg2rad(avghp - 30)) + 0.24 * Math.cos(Math.deg2rad(2 * avghp)) + 0.32 * Math.cos(Math.deg2rad(3 * avghp + 6)) - 0.2 * Math.cos(Math.deg2rad(4 * avghp - 63));

    let deltahp = h2p - h1p;
    if (Math.abs(deltahp) > 180) {
        if (h2p <= h1p) {
            deltahp += 360;
        } else {
            deltahp -= 360;
        }
    }

    const deltalp = l2 - l1;
    const deltacp = c2p - c1p;

    deltahp = 2 * Math.sqrt(c1p * c2p) * Math.sin(Math.deg2rad(deltahp) / 2);

    const sl = 1 + ((0.015 * Math.pow(avgL - 50, 2)) / Math.sqrt(20 + Math.pow(avgL - 50, 2)));
    const sc = 1 + 0.045 * avgCp;
    const sh = 1 + 0.015 * avgCp * t;

    const deltaro = 30 * Math.exp(-(Math.pow((avghp - 275) / 25, 2)));
    const rc = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
    const rt = -rc * Math.sin(2 * Math.deg2rad(deltaro));

    options = options || {};

    /*
     * kl (lightness) weighting factor ( 0.0 <= kC <= 2.0)
     * Increasing kL amplifies the importance of lightness differences.
     * This can be useful for applications where subtle lightness variations are crucial, like in textile or paint industries.
     * Conversely, lowering kL downplays lightness changes, which might be beneficial for web design where screen brightness can affect perceived lightness. 
     * */
    const kl = Math.min(
            Math.max(
                options.kl || 1.0,
                0.0),
            2.0
        );
    /*
     * kC (chroma) weighting factor ( 0.0 <= kC <= 2.0)
     * Adjusting kC modifies the influence of chroma (color saturation) in the calculation.
     * Raising kC highlights chroma differences, making vibrant colors stand out more.
     * Lowering it reduces the impact of chroma variations, potentially minimizing the appearance of color shifts due to factors like lighting or viewing angle. 
     * */
    const kc = Math.min(
            Math.max(
                options.kl || 1.0,
                0.0),
            2.0
        );
    /*
     * kH (hue) weighting factor ( 0.0 <= kC <= 2.0)
     * Modifying kH alters the emphasis on hue (color tint) differences.Modifying kH alters the emphasis on hue (color tint) differences.
     * This is rarely used in practical applications due to the complexity of hue calculations and its potentially limited impact on perceived color changes in most contexts.
     * */
    const kh = Math.min(
            Math.max(
                options.kl || 1.0,
                0.0),
            2.0
        );

    const deltaE = Math.sqrt(Math.pow(deltalp / (kl * sl), 2) + Math.pow(deltacp / (kc * sc), 2) + Math.pow(deltahp / (kh * sh), 2) + rt * (deltacp / (kc * sc)) * (deltahp / (kh * sh)));
    return deltaE;
}

/**
 * Called the Just Noticeable difference threshold.
 * Represents the smallest color difference that a typical observer can perceive under specific viewing conditions.
 * For Delta E 2000, a JND value of around 1 is generally accepted. This means a Delta E 2000 difference of 1 or
 * less is often considered imperceptible to most people.
 */
deltaE2000.JND = 1.0;

function deltaE94Approximate(labA, labB){
    /**
     * calculates the perceptual distance between colors in CIELAB
     */
    var deltaL = labA[0] - labB[0];
    var deltaA = labA[1] - labB[1];
    var deltaB = labA[2] - labB[2];
    var c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
    var c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
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

function deltaE94(labA, labB, options) {
    options = options || {};
    const L1 = labA[0],
        L2 = labB[0],
        a1 = labA[1],
        a2 = labB[1],
        b1 = labB[2],
        b2 = labB[2],
        K1 = 0.045,
        K2 = 0.015;

    // Calculate C1, C2, and h1, h2
    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const h1 = Math.atan2(b1, a1);  // Assuming radians
    const h2 = Math.atan2(b2, a2);

    // Calculate delta L, C, and H
    const deltaL = L2 - L1;
    const deltaC = C2 - C1;
    const deltaH = h2 - h1;

    // Calculate delta H prime
    const deltaHPrime = 2 * Math.sqrt(C1 * C2) * Math.sin(deltaH / 2);

    // Calculate CIEDE2000 terms
    const LBar = (L1 + L2) / 2;
    const CBar = (C1 + C2) / 2;
    const SL = 1 + ((0.015 * (LBar - 50) * (LBar - 50)) / (20 + (LBar - 50) * (LBar - 50)));
    const SC = 1 + 0.045 * CBar;
    const T = 1 - 0.17 * Math.cos(h1 - h2) + 0.24 * Math.cos(2 * h1) + 0.32 * Math.cos(3 * h1) - 0.2 * Math.cos(4 * h1);

    // Calculate the final delta E 94 value
    const deltaE = Math.sqrt(
        (deltaL / (K1 * SL)) ** 2 +
        (deltaC / (K2 * SC)) ** 2 +
        (deltaHPrime / (K2 * SC * T)) ** 2
    );

    return deltaE;
}

function deltaE74(labA, labB) {
    var sum = 0.0,
        dimensions = 3;
    for (var i = 0; i < dimensions; i++) {
        sum += Math.pow(labB[i] - labA[i], 2.0);
    }
    return Math.sqrt(sum);
}
/**
 * Just Noticeable Difference (JND) threshold
 * defined at 2.3 on
 * https://en.wikipedia.org/wiki/Color_difference#CIE76
 * */
deltaE74.JND = 2.3;