import { 
    XDoG,
    FDoG,
    imageDataToGrayscale, 
    grayscaleToImageData,
    PreprocessingPresetsWebGL,
    tauToP
} from '/assets/js/libs/homemade/xdog/index.js';

// 1. Fixed parameter name to 'e' to match internal usage
self.addEventListener('message', async (e) => {
    const { preprocess, mode, params, data } = e.data;
    const processor = mode === 'xdog' ? new XDoG(params) : new FDoG(params);
    const grayscale = applyPreprocessing(imageDataToGrayscale(data), preprocess);
    const result = await processor.process(grayscale);
    self.postMessage({ data: grayscaleToImageData(result) });
});

// Apply preprocessing
function applyPreprocessing(grayscale, mode) {
    // 3. Fixed: Removed DOM-dependent 'preprocessMode.value' and variable redeclaration
    if (!mode || mode === 'none') return grayscale;
    
    const preprocessFn = PreprocessingPresetsWebGL[mode];
    if (preprocessFn) {
        return preprocessFn(grayscale);
    }
    return grayscale;
}