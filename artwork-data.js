let recordUrl, apiUrl, imageUrl, paintingUrl, inscriptionText, artistName, artDate, artTitle, thresholdLevel, boxTop, boxLeft, boxHeight, boxWidth, angle, invert;
let num = 0;

function getNextRecord() {
  canvas.background(255);
  graphicsBuffer = createGraphics(28, 28).background(0).parent('canvasSection');
  illegibleText = "&nbsp;[illegible text]&nbsp;";

  num = (num % 10) + 1;
  getArtData(num)
  document.getElementById('figCaption').innerHTML = '';
  
  setTimeout(addArtwork, 500);
  setTimeout(processImage, 1000);
  handwritingBuffer = createGraphics(canvas.width, canvas.height);
  reset()
}

function getArtData(rowNum) {
    fetch('https://raw.githubusercontent.com/shannonvv/met-illegible-text/main/data/artwork-data.csv')
    // fetch('/data/artwork-data.csv')
      .then(response => response.text())
      .then(csvData => {
        const lines = csvData.split('\n');
        //let row = rowNum;
        let row = 1;
  
        if (row < lines.length) {
          // Split the row into fields
          const fields = lines[row].split(',');

          // Assign the cell data to variables
          [recordUrl, apiUrl, imageUrl, paintingUrl, inscriptionText, artistName, artDate, artTitle, thresholdLevel, boxLeft, boxTop, boxWidth, boxHeight, angle, invert] = fields.map(field => field.trim());
          
          // parse numeric fields to integers
          // [boxLeft, boxTop, boxWidth, boxHeight] = [boxLeft, boxTop, boxWidth, boxHeight].map(val => Math.round(parseInt(val)));
        
        } else {
          console.error("Row index out of range");
        };
      })
      .catch(error => console.error('Error fetching the file:', error));
}