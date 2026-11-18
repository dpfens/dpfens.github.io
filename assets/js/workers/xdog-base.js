importScripts('/assets/js/libs/homemade/dogpack/index.umd.min.js');

// 1. Fixed parameter name to 'e' to match internal usage
self.addEventListener('message', async (e) => {
    const { preprocess, mode, params, data } = e.data;
    const processor = mode === 'xdog' ? new self.DogPack.dog.XDoG(params) : new self.DogPack.dog.FDoG(params);
    const grayscale = await applyPreprocessing(self.DogPack.utilities.imageDataToLuminance(data), preprocess);
    const result = await processor.process(grayscale);
    self.postMessage({ data: self.DogPack.utilities.luminanceToImageData(result) });
});

// Apply preprocessing
function applyPreprocessing(grayscale, mode) {
    // 3. Fixed: Removed DOM-dependent 'preprocessMode.value' and variable redeclaration
    if (!mode || mode === 'none') return grayscale;
    
    const preprocessFn = self.DogPack.preprocess.PreprocessingPresets[mode];
    if (preprocessFn) {
        return preprocessFn(grayscale);
    }
    return grayscale;
}