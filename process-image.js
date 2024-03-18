let handwriting = [];
let minX, maxX, minY, maxY;
let handwritingDims = [];
let aspectRatio;
let enlargedImage;
let imageOffset;
let yRange, xRange;
let variableCount;
let similarWords;
let words = '';
let searchString = '';
let slider;
let sliderValue;
let square;
let letterBlockStates = [];
let squareList = []
let letter;
let letterBlocksText = []

function processImage() {


    let croppedImage = originalPainting.get(boxLeft,boxTop,boxWidth,boxHeight);

    if (invert === '1'){
         croppedImage.filter(INVERT);
    }
    //image(croppedImage, 0, 0)
    croppedImage.filter(THRESHOLD, thresholdLevel);

    // calculate the scaling factors to fit the image within the canvas while preserving the aspect ratio
    let scaleToFit = Math.min(canvas.width / croppedImage.width, canvas.height / croppedImage.height);

    // create a new image to draw the enlarged image onto
    enlargedImage = createImage(croppedImage.width * scaleToFit, croppedImage.height * scaleToFit);
    enlargedImage.copy(croppedImage, 0, 0, croppedImage.width, croppedImage.height, 0, 0, enlargedImage.width, enlargedImage.height);

    enlargedImage.loadPixels();

    //image(enlargedImage, 0, 0)

    handwriting = []
    for (let i = 0; i < enlargedImage.width; i++) {
         for (let j = 0; j < enlargedImage.height; j++) {
             let index = (i + j * enlargedImage.width) * 4;

             let threshold = 50;
             if (enlargedImage.pixels[index] < threshold) {
                 smooth(true);
                 stroke(0);
                 strokeWeight(1);
                 let x = i - enlargedImage.width/2;
                 let y = j - enlargedImage.height/2;
                 //point(x, y);
                 handwriting.push({ x, y });
             }}
     }

    // calculate the aspect ratio
    let { minX, maxX, minY, maxY } = calculateMinMax();
    xRange = abs(maxX-minX);
    yRange = abs(maxY-minY);
    aspectRatio = xRange/yRange;

    // Adjust percentage of points
    let reductionPercentage = 0; 
    let targetLength = Math.ceil(handwriting.length * (1 - reductionPercentage / 100));
    let reducedHandwriting = handwriting.filter((item, index) => index % Math.ceil(handwriting.length / targetLength) === 0);
    handwriting = reducedHandwriting;

    updateHandwritingBuffer();
    drawInscription()  
}

function calculateMinMax() {
    if (handwriting.length === 0) {
        return;
    }

    let minX = handwriting[0].x;
    let maxX = handwriting[0].x;
    let minY = handwriting[0].y;
    let maxY = handwriting[0].y;

    // Iterate through the array to find min and max values
    for (let point of handwriting) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
    }
    return { minX, maxX, minY, maxY};
}

function updateHandwritingBuffer() {
    newWidth = windowWidth - formWidth;
    newHeight = windowHeight;

    if (!handwritingBuffer) {
        handwritingBuffer = createGraphics(newWidth,newHeight);
    }
    
    handwritingBuffer.background(255);
    handwritingBuffer.noFill();
    handwritingBuffer.strokeWeight(5);
    handwritingBuffer.stroke(0);

    // // calculate the aspect ratio
    let { minX, maxX, minY, maxY } = calculateMinMax();
    let xRange = abs(maxX-minX);
    let yRange = abs(maxY-minY);
    let largestDim = Math.max(xRange, yRange);
    aspectRatio = xRange/yRange

    let newMaxY, newMinY, newMaxX, newMinX;

    if (largestDim === xRange) {  //  width is the largest dimension
        imageOffset = (newHeight - yRange) / 2;
        newMaxY = maxY * aspectRatio;
        newMinY = minY * aspectRatio;

        for (let point of handwriting) {
            //let currentStrokeWeight = Math.floor(Math.random() * 10);
            let currentStrokeWeight = 5
            handwritingBuffer.strokeWeight(currentStrokeWeight);
            handwritingBuffer.stroke(0);
            

            let rotatedX = point.x * Math.cos(angle) - point.y * Math.sin(angle);
            let rotatedY = point.x * Math.sin(angle) + point.y * Math.cos(angle);

            let normalizedX = map(rotatedX, minX, maxX, 0, canvas.width);
            let normalizedY = map(rotatedY, minY, maxY, 0 + imageOffset, canvas.width/aspectRatio + imageOffset);    
     
            handwritingBuffer.point(normalizedX, normalizedY);
        }


    } else if (largestDim === yRange) { //  height is the largest dimension
        imageOffset = (newHeight - yRange) / 2.5;
        newMaxX = maxX * aspectRatio;
        newMinX = minX * aspectRatio;

        for (let point of handwriting) {
            let currentStrokeWeight = Math.floor(Math.random() * 10);
            handwritingBuffer.strokeWeight(currentStrokeWeight);
            handwritingBuffer.stroke(0);

            let normalizedX = map(point.x, minX, maxX, 0, canvas.width);
            let normalizedY = map(point.y, minY, maxY, 0 + imageOffset, canvas.width/aspectRatio + imageOffset);    
            handwritingBuffer.point(normalizedX, normalizedY);
        }

    } else {
        
        console.log('There is no clear distinction between width and height.');
    }
    image(handwritingBuffer, 0, 0, newWidth, newHeight);
}


function updateBufferSize() {
    formWidth = document.getElementById('form').offsetWidth;
    let bufferWidth = windowWidth - formWidth;
    let bufferHeight = windowHeight;
    updateHandwritingBuffer();

    if (!handwritingBuffer || handwritingBuffer.width !== bufferWidth || handwritingBuffer.height !== bufferHeight) {
         handwritingBuffer = createGraphics(bufferWidth, bufferHeight);
         updateHandwritingBuffer();
    }
}

function drawInscription() {
    illegibleText = illegibleText || "&nbsp;[illegible text]&nbsp;";

    let regularText = inscriptionText || ''; 
    let pattern = /\(Illegible Text\)/;
    let parts = regularText.split(pattern);

    // clear existing content of the 'inscription' element
    let header = document.getElementById('inscription');
    header.innerHTML = '';

    // define styles
    let greenStyle = 'color: black; background-color: #24FF00; border: 3px solid #24FF00; border-radius: 0px;';
    let defaultStyle = 'font-size: 23px; line-height: 1.4; margin: 0px 0;';
    let headerStyle = 'font-size: 12px; font-style: italic; margin: 3px 0; color: #A6A6A6;';

    // concatenate the strings with different styles
    let htmlContent = `<p style="${defaultStyle}">`;
    htmlContent += `<span style="${defaultStyle}">${parts[0]}</span>`;
    htmlContent += `<span style="${greenStyle}">${illegibleText}</span>`;
    htmlContent += `<span style="${defaultStyle}">${parts[1]}</span>`;
    htmlContent += '</p>';
    header.innerHTML = htmlContent;
    
    // letter blocks

    if (illegibleText != "&nbsp;[illegible text]&nbsp;") {
        let letterBlocks = document.getElementById('letterBlocks'); // Select the div element by its id
        letterBlocks.innerHTML = '';
        letterBlocks.innerHTML += '<hr>';
        letterBlocks.innerHTML += `<span style="${headerStyle}">${"Toggle letters below to generate similar words"}</span>`;
        letterBlocks.innerHTML += '<br>';
        letterBlocks.innerHTML += '<br>';
        let squareSize = 30; // Set the size of each square
        let spacing = 5; // Set the spacing between squares
        
        squareList = []
        for (let i = 0; i < sortedClassificationLabels.length; i++) { // Loop to draw 10 squares
            letter = sortedClassificationLabels[i].label;
            square = document.createElement('div');
            square.style.width = square.style.height = `${squareSize}px`;
            square.style.cursor = 'pointer';
            square.style.display = 'inline-block';
            square.style.marginRight = `${spacing}px`;
            square.style.marginBottom = `${spacing}px`;
            square.style.textAlign = 'center'; // Center the text horizontally
            square.style.lineHeight = `${squareSize}px`; // Center the text vertically
            if (letterBlocksText[i] === '?') {
                square.style.backgroundColor = '#24FF00'; // Set color to green
                square.innerText = '?'
            } else {
                square.style.backgroundColor = '#D9D9D9'; // Set color to blue
                square.innerText = letter;
            }
            squareList.push(square)
            letterBlocks.appendChild(square);
            letterBlocksText[i] = letter
        }

        similarWords = similarWords || "&nbsp;"

        if (similarWords != "&nbsp;" && words.length != 0){
            console.log('there are words!')
            let output = '';
            for (let i = 0; i < words.length; i++) {
                 let obj = words[i];
                 let word = obj.word
                 for (let j = 0; j < word.length; j++) {
                     if (searchString[j] === '?') {
                        output += `<span class="colorText">${word[j]}</span>`; // Add class="green" 
                     } else {
                        output += word[j];
                     }
                 }
                 if (i !== words.length - 1) {
                     output += ', ';
                 }
             }
             similarWords = output
             console.log('similarWords', similarWords)
             letterBlocks.innerHTML += '<p>';
             letterBlocks.innerHTML += `<span>${similarWords}</span>`;
             letterBlocks.innerHTML += '</p>';
             letterBlocks.innerHTML += '<br>';

        }

        let eventListenersAdded = new Array(squareList.length).fill(false);

        for (let i = 0; i < squareList.length; i++) {
            // Check if an event listener has already been added to the square
            if (!eventListenersAdded[i]) {
                squareList[i].addEventListener('click', () => {
                    console.log('click!')
                    letterBlockStates[i] = !letterBlockStates[i]; // Toggle state
                    squareList[i].style.backgroundColor = letterBlockStates[i] ? '#24FF00' : '#D9D9D9'; // Change color based on state
                    squareList[i].innerText = letterBlockStates[i] ? '?' : sortedClassificationLabels[i].label; // Change text based on state
                    if (squareList[i].innerText === '?') {
                        letterBlocksText[i] = '?'
                    } else {
                        letterBlocksText[i] = sortedClassificationLabels[i].label
                    } 
                    searchString = letterBlocksText.join("");
                    getResults(searchString)
                });  
                // Set the flag to true to indicate that an event listener has been added
                eventListenersAdded[i] = true; 
            }
        }
}
}

//document.getElementById("submission-button").addEventListener("click", () => getResults());
async function getResults(searchString) {
    try {
        words = await fetchWords(searchString);
        console.log("Words matching the pattern:", words.map(word => word.word));
        similarWords = words.map(word => word.word);
        drawInscription()
    } catch (error) {
        similarWords = 'There are no similar words for this pattern.';
        console.error('Error:', error);
    }
}

async function fetchWords(pattern) {
    const apiUrl = `https://api.datamuse.com/words?sp=${pattern}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.length === 0) {
            console.log('no matches!')
        } else {
            console.log('data', data)
            return data;
        }
     } catch (error) {
         console.error('Error fetching data:', error);
         return [];
     }
}

