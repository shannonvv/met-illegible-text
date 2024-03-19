let canvas;
let formWidth;
let originalWindowWidth = window.innerWidth;
let originalWindowHeight = window.innerHeight;
let drawing = false; 
let charDropDown;
let pattern;
let finalConfidenceLevels = [];

// model 
const labels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "d", "e", "f", "g", "h", "n", "q", "r", "t"]
const MODEL_URL = 'model/model.json'

// artwork data
let handwritingBuffer;
let illegibleText = "&nbsp;[illegible text]&nbsp;";
let originalPainting;

// bounding boxes
let normalizedYRects = [];
let normalizedXRects = [];
let normalizedWRects = [];
let normalizedHRects = [];
let labelDim = 20; // width & height of the bounding box label
let startX, startY; // top bounding box coordinates
let lastItem;
let selectedRectangle;
let selectedRectangles = [];

// input for classifier
let sampledImage;

// classification results
let sortedClassificationLabels = [];

// synth
let confidenceLevel;
let finalClassificationLabels = [];

function preload() {
    getArtData(6)
    // only urls with 'https://collectionapi.metmuseum.org' work
}

function setup() {
    formWidth = document.getElementById('form').offsetWidth;
    canvas = createCanvas(windowWidth - formWidth, windowHeight);
    canvas.background(255);
    canvas.parent('canvasSection');

    graphicsBuffer = createGraphics(28, 28).background(0).parent('canvasSection');
       
    setTimeout(function() { 
        addArtwork()
    }, 500);

    setTimeout(function() { 
        processImage()
    }, 1000);

    //let inputImage = createGraphics(64, 64);
}

function addArtwork() {
    if (typeof paintingUrl !== 'string') {
        return;
    }

    loadImage(paintingUrl, function(img) {
        originalPainting = img;
        let originalPaintingWidth = originalPainting.width;
        let originalPaintingHeight = originalPainting.height;
        let paintingAspectRatio = originalPaintingWidth / originalPaintingHeight
        let scaledBoxTop, scaledBoxLeft, scaledBoxHeight, scaledBoxWidth;

        if (originalPaintingWidth > originalPaintingHeight) {
            let scaledPaintingWidth = 280;
            let scaledPaintingRatio = scaledPaintingWidth / originalPaintingWidth
            scaledBoxTop = Math.round(boxTop * scaledPaintingRatio);
            scaledBoxLeft = Math.round(boxLeft * scaledPaintingRatio);
            scaledBoxHeight = Math.round(boxHeight * scaledPaintingRatio);
            scaledBoxWidth = Math.round(boxWidth * scaledPaintingRatio);
        } else {
            let scaledPaintingHeight = 280;
            let scaledPaintingWidth = scaledPaintingHeight * paintingAspectRatio;
            let scaledPaintingRatio = scaledPaintingWidth / originalPaintingWidth
            let paintingYOffset =  (scaledPaintingHeight - scaledPaintingWidth)/2
            scaledBoxTop = Math.round(boxTop * scaledPaintingRatio);
            scaledBoxLeft = Math.round(boxLeft * scaledPaintingRatio + paintingYOffset);
            scaledBoxHeight = Math.round(boxHeight * scaledPaintingRatio);
            scaledBoxWidth = Math.round(boxWidth * scaledPaintingRatio);
        }

        let paintingImage = document.getElementById('paintingImage');
        paintingImage.src = paintingUrl;

        let boundingBox = document.getElementById('boundingBox');
        boundingBox.style.width = scaledBoxWidth + 'px';
        boundingBox.style.height = scaledBoxHeight + 'px';
        boundingBox.style.left =  scaledBoxLeft + 'px';
        boundingBox.style.top = scaledBoxTop + 'px';
    });
        
    // create an anchor element for the painting thumbnail caption
    let linkElement = document.createElement('a');
    linkElement.href = recordUrl || 'https://www.metmuseum.org/art/collection/search?'; // Use recordUrl if available, otherwise default URL
    linkElement.target = '_blank';
    linkElement.textContent = `Visit The Met’s digital collections to learn more about ${artTitle} by ${artistName}, ${artDate}.`;
    
    // Create a text node for the arrow symbol
    let arrowNode = document.createTextNode('\u2192'); // Unicode character code for right arrow

    // concatenate the paragraph elements
    let paragraph = document.createElement('p');
    paragraph.appendChild(arrowNode); // Append arrow symbol
    paragraph.appendChild(document.createTextNode(' ')); // Add space after arrow
    paragraph.appendChild(linkElement);
    
    let figCaption = document.getElementById('figCaption');
    figCaption.appendChild(paragraph);
}


function draw() {
    if (mouseIsPressed &&  canvas.width > 0 && canvas.height > 0){
        drawBoundingBox();
    }
}

function reset() {
    selectedRectangles = [];
    finalClassificationLabels = [];
    sortedClassificationLabels = [];
    normalizedYRects = [];
    normalizedXRects = [];
    normalizedWRects = [];
    normalizedHRects = [];

    // Clear the graphics buffer
    graphicsBuffer.clear();
    charDropDown.src = graphicsBuffer.canvas.toDataURL();
    updateHandwritingBuffer();
}

// map confidence level to synth frequency values
function mapValue(value, inMin, inMax, outMin, outMax) {
    return Math.floor((value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);
}

function drawBoundingBox() {
    let currentWidth = window.innerWidth;

    let inputImages = [];
    let rectangles = [];
    
    let newRect = {
        startX: startX,
        startY: startY,
        width: mouseX-startX,
        height: mouseY-startY,
        winScale: currentWidth
      }

      rectangles.push(newRect);


    if (drawing) {

        let rectWidth = mouseX-newRect.startX;
        let rectHeight = mouseY-newRect.startY;
        background(255)
        noFill();
        stroke(0, 255, 0);
        updateHandwritingBuffer()
        
        if (selectedRectangle) {
            for (let i = 0; i < selectedRectangles.length; i++) {
                stroke(0, 255, 0);
                rect(selectedRectangles[i].startX, selectedRectangles[i].startY, selectedRectangles[i].width, selectedRectangles[i].height);
                
                // draw bounding box labels
                fill(0,255,0)
                rect(selectedRectangles[i].startX, selectedRectangles[i].startY-labelDim, labelDim, labelDim)
        
                // draw bounding box label text
                fill(0)
                textSize(15)
                let classLabel = finalClassificationLabels[i]
                text(classLabel, selectedRectangles[i].startX + labelDim/5, selectedRectangles[i].startY-labelDim/4);
                noFill() 
        }}
        
        // draw bounding rectangle
        rect(rectangles[0].startX, rectangles[0].startY, mouseX-rectangles[0].startX, mouseY-rectangles[0].startY);
        
        // draw labels
        fill(0, 255, 0);
        rect(rectangles[0].startX, rectangles[0].startY-labelDim, labelDim, labelDim);

        //draw classification label
        fill(0);
        textSize(15);
        if (classificationLabels.length > 0) {
            lastClassLabel = classificationLabels[classificationLabels.length -1]
            text(lastClassLabel, rectangles[0].startX + labelDim/5, rectangles[0].startY-labelDim/4);
        }
        
        // let newinputImage = inputImage.copy(canvas, startX, startY, rectWidth, rectHeight, 0, 0, width, height);

        // get the pixels inside of the final bounding box position
        selectedRectangle = rectangles[0];
        sampledImage = get(startX, startY, rectWidth, rectHeight);
        if (sampledImage.width > 1) {
            createPaddedImage(sampledImage);
        };
        inputImages.push(sampledImage);
        lastItem = inputImages[inputImages.length - 1];
        
        // clear the list of bounding boxes 
        rectangles = [];
}}


function createPaddedImage(sampledImage) {
    if (sampledImage.width <= 0 || sampledImage.height <= 0) {
        return;
    }
    
    let originalWidth = sampledImage.width;
    let originalHeight = sampledImage.height;
    let maxDimension = Math.max(originalWidth, originalHeight);
    let scaleFactor = 28 / maxDimension;
    let newWidth = Math.round(originalWidth * scaleFactor);
    let newHeight = Math.round(originalHeight * scaleFactor);

    // Calculate the position to draw the scaled image with padding
    let offsetX = Math.round((graphicsBuffer.width - newWidth) / 2);
    let offsetY = Math.round((graphicsBuffer.height - newHeight) / 2);

    // Draw the scaled image on a graphics buffer
    graphicsBuffer.background(0);
    graphicsBuffer.stroke(0);

    // Create a copy of the image to avoid modifying the original
    let invertedPaddedInput = createImage(sampledImage.width, sampledImage.height);
    invertedPaddedInput.copy(sampledImage, 0, 0, sampledImage.width, sampledImage.height, 0, 0, sampledImage.width, sampledImage.height);
    invertedPaddedInput.resize(formWidth, formWidth);

    invertedPaddedInput.loadPixels();

    for (let y = 0; y < invertedPaddedInput.height; y++) {
        for (let x = 0; x < invertedPaddedInput.width; x++) {
            let index = (x + y * invertedPaddedInput.width) * 4; // RGBA

            // Check if the pixel is non-black
            if (invertedPaddedInput.pixels[index] !== 0 || invertedPaddedInput.pixels[index + 1] !== 0 || invertedPaddedInput.pixels[index + 2] !== 0) {
                // Transform non-black pixels to black
                invertedPaddedInput.pixels[index] = 0;
                invertedPaddedInput.pixels[index + 1] = 0;
                invertedPaddedInput.pixels[index + 2] = 0;
            } else {
                // Transform black pixels to white
                invertedPaddedInput.pixels[index] = 255;
                invertedPaddedInput.pixels[index + 1] = 255;
                invertedPaddedInput.pixels[index + 2] = 255;
            }
        }
    }
    invertedPaddedInput.updatePixels();
    invertedPaddedInput.filter(THRESHOLD);
    invertedPaddedInput.filter(ERODE);

    graphicsBuffer.image(invertedPaddedInput, offsetX, offsetY, newWidth, newHeight);
}
   
function mousePressed() {
    startX = mouseX;
    startY = mouseY;

    if (startX < canvas.width) {
        drawing = true;
        runPrediction();

}}
  
function mouseReleased() {
    startX = mouseX;
    startY = mouseY;
    
    drawing = false;  
    
    // add label to the selectedRectangle
    if (selectedRectangle && startX < canvas.width) {
        fill(0,255,0);
        stroke(0,255,0);

        if (canvas.width > 0 && canvas.height > 0){
            createPaddedImage(lastItem);
            selectedRectangles.push(selectedRectangle);

            if (selectedRectangles.length > normalizedYRects.length) {
                let bufferYOffset = ((window.innerHeight-yRange)/2);
                let lastRect = selectedRectangles[selectedRectangles.length - 1];

                normalizedYRects.push(lastRect.startY - bufferYOffset);
                normalizedXRects.push(lastRect.startX);
                normalizedWRects.push(lastRect.width);
                normalizedHRects.push(lastRect.height);
            }
        }

        setTimeout(function() {
            let chosenLabel = classificationLabels[classificationLabels.length-1];
            finalClassificationLabels.push(chosenLabel);
            finalConfidenceLevels.push(confidenceLevels[classificationLabels.length-1])
    
            if (sortedClassificationLabels) {
                sortedClassificationLabels = selectedRectangles.map(rect => ({
                    startX: rect.startX,
                    label: finalClassificationLabels[selectedRectangles.indexOf(rect)]
                })).sort((a, b) => a.startX - b.startX);
            };   

            for (let i = 0; i < selectedRectangles.length; i++) {
                noFill(); 
                stroke(0, 255, 0);
                rect(selectedRectangles[i].startX, selectedRectangles[i].startY, selectedRectangles[i].width, selectedRectangles[i].height);
                
                // draw the label boxes
                fill(0,255,0);
                rect(selectedRectangles[i].startX, selectedRectangles[i].startY-labelDim, labelDim, labelDim);
        
                // draw the labels
                fill(0);
                textSize(15);
                let classLabel = finalClassificationLabels[i];
                text(classLabel, selectedRectangles[i].startX + labelDim/5, selectedRectangles[i].startY-labelDim/4);
                noFill(); 
            }
    
            illegibleText = "";
            for (let i = 0; i < sortedClassificationLabels.length; i++) {
                illegibleText += '\n' + sortedClassificationLabels[i].label
            }
            drawInscription()    
        }, 500); // 500 milliseconds
        }
}


function updatedSelectedRectDims() {    
    let bufferYOffset = (window.innerHeight - yRange) / 2;
    let xWidth = windowWidth-formWidth;
    let xBufferScaleFactor = xRange/xWidth;

    for (let i = 0; i < selectedRectangles.length; i++) {
        let xRatio = (window.innerWidth-formWidth) / (selectedRectangles[i].winScale-formWidth);

        selectedRectangles[i].startX = normalizedXRects[i] * xRatio;
        selectedRectangles[i].startY = bufferYOffset + (normalizedYRects[i] / xBufferScaleFactor);
        selectedRectangles[i].width = normalizedWRects[i] * xRatio;
        selectedRectangles[i].height = normalizedHRects[i]/xBufferScaleFactor;

        // bounding box
        stroke(0,255,0);
        noFill();
        rect(selectedRectangles[i].startX, selectedRectangles[i].startY, selectedRectangles[i].width, selectedRectangles[i].height);
        
        // label box
        fill(0,255,0);
        rect(selectedRectangles[i].startX, selectedRectangles[i].startY  - labelDim, labelDim, labelDim);
            
        // label
        fill(0);
        textSize(15);
        let classLabel = finalClassificationLabels[i];
        text(classLabel, selectedRectangles[i].startX + labelDim/5, selectedRectangles[i].startY - labelDim/4);
        noFill();
    }
}

// function createDropdownMenu(x, y, selectedLetter) {
//     // Define the letters of the alphabet
//     const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

//     // Create a dropdown menu
//     let dropdown = createSelect();
//     dropdown.position(x, y - labelDim); // Adjust the position as needed
//     dropdown.style("background-color", "#ff0000"); // Set background color
//     dropdown.style("border", "1px solid #000"); // Set border
//     dropdown.style("font-size", "12px"); // Set font size

//     // Add options for each letter
//     letters.forEach(letter => {
//         dropdown.option(letter);
//     });

//     // Set the selected option based on the selectedLetter parameter
//     dropdown.selected(selectedLetter);
// };

function windowResized() {
    resizeCanvas(windowWidth - formWidth, windowHeight);
    //handwritingBuffer = createGraphics(canvas.width, canvas.height);
    updateHandwritingBuffer()
    if (selectedRectangle) {
          updatedSelectedRectDims()
    }
}

function showTab(tabName) {
    // Hide all content elements
    let contents = document.querySelectorAll('.content');
    contents.forEach(content => {
      content.classList.remove('active');
    });
  
    // Show the content corresponding to the selected tab
    let contentToShow = document.getElementById(tabName + '-content');
    contentToShow.classList.add('active');
  
    // Remove 'selected' class from all tabs
    let tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.classList.remove('selected');
    });
  
    // Add 'selected' class to the clicked tab
    let selectedTab = document.getElementById(tabName + '-tab');
    selectedTab.classList.add('selected');
  }

document.getElementById("resetButton").addEventListener("click", () => reset());
document.getElementById("nextButton").addEventListener("click", () => getNextRecord());
