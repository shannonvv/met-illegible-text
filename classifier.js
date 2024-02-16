let classificationLabels = []; 


function convertImageToTensor(pixelData) {
    // Translate pixel values into a list
    const pixelList = [];
    for (let i = 0; i < pixelData.length; i += 4) {
        const r = pixelData[i + 1];
        pixelList.push(r,r,r,255);
    }

    //console.log('Pixel Length', pixelList.length);

    // Ensure that the length of pixelList is equal to (1 * width * height)
    if (pixelList.length !== (4 * 56 * 56)) {
        console.error("Invalid pixel data length");
        return null;
    }

    // Create ImageData object for grayscale
    const image = new ImageData(new Uint8ClampedArray(pixelList), 56, 56);

    // Convert ImageData to TensorFlow tensor
    const result = tf.browser.fromPixels(image, 1);

    // Reshape the tensor to (1, 56, 56, 1)
    const reshapedTensor = result.reshape([1, 56, 56, 1]);

    return reshapedTensor;
}

function runPrediction() {
    // Convert P5.js Image to Tensor
    graphicsBuffer.loadPixels();
    const pixelData = graphicsBuffer.pixels;
    const imageTensor = convertImageToTensor(pixelData);

    // Preprocess the image
    const normalizedInput = imageTensor.div(255.0);

    // Reshape and flatten the Tensor
    const flattenedInput = normalizedInput.reshape([1, 56, 56, 1]);

    // Load the model
    tf.loadLayersModel('model/model.json').then(function (model) {
        
        // Make the prediction using reshapedTensor
        const result = model.predict(flattenedInput);
        const resultValues = result.dataSync();
        const maxIndex = resultValues.indexOf(Math.max(...resultValues));
        const maxLabel = labels[maxIndex];
        confidenceLevel = Math.max(...resultValues)

        classificationLabels.push(maxLabel);

        illegibleText = "";

        if (drawing) {
            runPrediction();
        } else {
            return
        }

    }).catch(error => console.error(error));
}