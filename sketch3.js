let viewMode = 'overlay';
let Mechan = 'IDW';
let table;
let currentDatasetLabel = 'Pre-Treatment';


let lat = [], lon = [], cal = [], mag = [], tit = [];
let calcium = [], magnesium = [], titanium = [];
let x = [], y = [];

let minLat, maxLat, minLon, maxLon;
let minCal, maxCal, minMag, maxMag, minTit, maxTit;
let globalMinCal = 1220, globalMaxCal = 7968;
let globalMinMag = 4220, globalMaxMag = 12894;
let globalMinTit = 2096, globalMaxTit = 7382;


let colorMap = [];

function log(x) {
  return Math.log(x);
}


function setup() {
  createCanvas(800, 600);
  background(255);


  createButton('Pre-Treatment').mousePressed(() => loadNewData('data4.csv'));
  createButton('Post-Treatment').mousePressed(() => loadNewData('data5.csv'));

  createButton('Calcium').mousePressed(() => setView('calcium'));
  createButton('Magnesium').mousePressed(() => setView('magnesium'));
  createButton('Titanium').mousePressed(() => setView('titanium'));
  createButton('Overlay').mousePressed(() => setView('overlay'));

  createButton('Points').mousePressed(() => setMech('points'));
  createButton('Gaussian Map').mousePressed(() => setMech('IDW'));

  // Color map setup
  let rainbowHex = [
    '#8B00FF', '#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'
  ];
  let rainbow = rainbowHex.map(c => color(c));
  colorMap = [];
  for (let i = 0; i < 512; i++) {
    let t = i / 511;
    let idx = floor(t * (rainbow.length - 1));
    let nextIdx = min(idx + 1, rainbow.length - 1);
    let localT = (t * (rainbow.length - 1)) % 1;
    colorMap.push(lerpColor(rainbow[idx], rainbow[nextIdx], localT));
  }

  // 🟡 Load both CSVs first, then load initial view
  computeGlobalMinMax(['data4.csv', 'data5.csv'], () => {
    loadNewData('data4.csv');  // default dataset
  });
}

function computeGlobalMinMax(files, callback) {
  let pending = files.length;

  files.forEach(filename => {
    loadTable(filename, 'csv', 'header', (table) => {
      for (let i = 0; i < table.getRowCount(); i++) {
        let c = parseFloat(table.getString(i, 'calcium'));
        let m = parseFloat(table.getString(i, 'magnesium'));
        let t = parseFloat(table.getString(i, 'titanium'));

        globalMinCal = min(globalMinCal, c); globalMaxCal = max(globalMaxCal, c);
        globalMinMag = min(globalMinMag, m); globalMaxMag = max(globalMaxMag, m);
        globalMinTit = min(globalMinTit, t); globalMaxTit = max(globalMaxTit, t);
      }

      if (--pending === 0) callback(); // only call when all are loaded
    });
  });
}

function loadNewData(filename) {
  loadTable(filename, 'csv', 'header', (newTable) => {
    table = newTable;
    currentDatasetLabel = (filename === 'data4.csv') ? 'Pre-Treatment' : 'Post-Treatment';
    setupData();
  });
}


function setupData() {
  lat = [], lon = [], cal = [], mag = [], tit = [];
  calcium = [], magnesium = [], titanium = [];
  x = [], y = [];

  minLat = Infinity; maxLat = -Infinity;
  minLon = Infinity; maxLon = -Infinity;

  for (let i = 0; i < table.getRowCount(); i++) {
    lat[i] = parseFloat(table.getString(i, 'latitude'));
    lon[i] = parseFloat(table.getString(i, 'longitude'));
    cal[i] = parseFloat(table.getString(i, 'calcium'));
    mag[i] = parseFloat(table.getString(i, 'magnesium'));
    tit[i] = parseFloat(table.getString(i, 'titanium'));

    minLat = min(minLat, lat[i]); maxLat = max(maxLat, lat[i]);
    minLon = min(minLon, lon[i]); maxLon = max(maxLon, lon[i]);
  }

  for (let i = 0; i < table.getRowCount(); i++) {
  x[i] = map(lon[i], minLon - 0.001, maxLon + 0.001, 0, width);
  y[i] = map(lat[i], maxLat + 0.001, minLat - 0.001, 0, height);

  // Apply log scale mapping
  calcium[i] = map(
    log(cal[i]),
    log(globalMinCal),
    log(globalMaxCal),
    0,
    511
  );

  magnesium[i] = map(
    log(mag[i]),
    log(globalMinMag),
    log(globalMaxMag),
    0,
    511
  );

  titanium[i] = map(
    log(tit[i]),
    log(globalMinTit),
    log(globalMaxTit),
    0,
    511
  );
}


  drawVisualization();
}

function setMech(mode) {
  Mechan = mode;
  drawVisualization();
}

function setView(mode) {
  viewMode = mode;
  drawVisualization();
}

function drawVisualization() {
  background(255);


  if (Mechan === 'IDW') {
    drawIDW();
    drawPoints();
  } else if (Mechan === 'points') {
    drawPoints();
  }
  if (viewMode === 'calcium') {
    drawLegend(globalMinCal, globalMaxCal, "Calcium (ppm)");
    drawRadiusLegend(globalMinCal, globalMaxCal);
  } else if (viewMode === 'magnesium') {
    drawLegend(globalMinMag, globalMaxMag, "Magnesium (ppm)");
    drawRadiusLegend(globalMinMag, globalMaxMag);
  } else if (viewMode === 'titanium') {
    drawLegend(globalMinTit, globalMaxTit, "Titanium (ppm)");
    drawRadiusLegend(globalMinTit, globalMaxTit);
  }

  drawAnnotation();
 
  // Draw canvas border
noFill();
stroke(0); // black border
strokeWeight(2); // thickness of the border
rect(0, 0, width - 1, height - 1); // draw border just inside the canvas edges


   console.log('Global Min/Max Values:');
  console.log('Calcium:   min =', globalMinCal, ', max =', globalMaxCal);
  console.log('Magnesium: min =', globalMinMag, ', max =', globalMaxMag);
  console.log('Titanium:  min =', globalMinTit, ', max =', globalMaxTit);
}

function drawPoints() {
  noStroke();

  for (let i = 0; i < lat.length; i++) {
    let val, colIndex, radius;

    if (viewMode === 'calcium') {
      val = cal[i];
      let logVal = Math.log(val);
      let t = map(logVal, Math.log(globalMinCal), Math.log(globalMaxCal), 0, 1);
      colIndex = constrain(int(t * 511), 0, 511);
      radius = map(val, globalMinCal, globalMaxCal, 5, 30);
    } else if (viewMode === 'magnesium') {
      val = mag[i];
      let logVal = Math.log(val);
      let t = map(logVal, Math.log(globalMinMag), Math.log(globalMaxMag), 0, 1);
      colIndex = constrain(int(t * 511), 0, 511);
      radius = map(val, globalMinMag, globalMaxMag, 5, 30);
    } else if (viewMode === 'titanium') {
      val = tit[i];
      let logVal = Math.log(val);
      let t = map(logVal, Math.log(globalMinTit), Math.log(globalMaxTit), 0, 1);
      colIndex = constrain(int(t * 511), 0, 511);
      radius = map(val, globalMinTit, globalMaxTit, 5, 30);
    } else {
      // Overlay mode: use RGB from individual mapped arrays
      fill(calcium[i], magnesium[i], titanium[i]);
      ellipse(x[i], y[i], 8);
      continue;
    }

    fill(0,0,0);
    ellipse(x[i], y[i], radius);
  }
}


function estimateAtKDE(xPos, yPos, nearbyIndices) {
  let weighted = { calcium: 0, magnesium: 0, titanium: 0 };
  let totalWeight = 0;

  for (let i of nearbyIndices) {
    let dx = x[i] - xPos;
    let dy = y[i] - yPos;
    let distSq = dx * dx + dy * dy;

    let weight = Math.exp(-distSq / (3 * 400)); // fixed Gaussian kernel width (sigma^2)
    weighted.calcium += cal[i] * weight;
    weighted.magnesium += mag[i] * weight;
    weighted.titanium += tit[i] * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return null;

  return {
    calcium: weighted.calcium / totalWeight,
    magnesium: weighted.magnesium / totalWeight,
    titanium: weighted.titanium / totalWeight
  };
}


function drawIDW(power = 2, baseRadius = 140, step = 2) {
  noStroke();

  for (let yPos = 0; yPos < height; yPos += step) {
    for (let xPos = 0; xPos < width; xPos += step) {
      let neighbors = findNearbyPoints(xPos, yPos, baseRadius);
      if (neighbors.length < 1) continue; // Require at least 2 neighbors

      let est = estimateAtKDE(xPos, yPos, neighbors);
      if (!est) continue;

      let val, t;

      if (viewMode === 'calcium') {
        let logVal = Math.log(est.calcium);
        t = map(logVal, Math.log(globalMinCal), Math.log(globalMaxCal), 0, 1);
      } else if (viewMode === 'magnesium') {
        let logVal = Math.log(est.magnesium);
        t = map(logVal, Math.log(globalMinMag), Math.log(globalMaxMag), 0, 1);
      } else if (viewMode === 'titanium') {
        let logVal = Math.log(est.titanium);
        t = map(logVal, Math.log(globalMinTit), Math.log(globalMaxTit), 0, 1);
      } else {
        // Overlay: use linear RGB mapping (not log-based for now)
        let r = map(est.calcium, globalMinCal, globalMaxCal, 0, 255);
        let g = map(est.magnesium, globalMinMag, globalMaxMag, 0, 255);
        let b = map(est.titanium, globalMinTit, globalMaxTit, 0, 255);
        fill(r, g, b, 180);
        rect(xPos, yPos, step, step);
        continue;
      }

      let idx = constrain(int(t * 511), 0, 511);
      fill(colorMap[idx]);
      rect(xPos, yPos, step, step);
    }
  }
}

function drawLegend(concMin, concMax, title = "Concentration (ppm)") {
  const legendWidth = 200;
  const legendHeight = 12;
  const padding = 16;

  const legendX = width - legendWidth - padding;
  const legendY = height - legendHeight - padding - 28;

  // Color gradient bar
  for (let i = 0; i < legendWidth; i++) {
    let t = i / (legendWidth - 1);
    let idx = int(t * (colorMap.length - 1));
    fill(colorMap[idx]);
    noStroke();
    rect(legendX + i, legendY, 1, legendHeight);
  }

  // Outline
  noFill();
  stroke(0);
  rect(legendX, legendY, legendWidth, legendHeight);

  // Log-scale tick marks
  let numTicks = 6;
  textSize(9);
  fill(0);
  noStroke();
  for (let i = 0; i <= numTicks; i++) {
    let logT = i / numTicks;
    let logVal = lerp(Math.log(concMin), Math.log(concMax), logT);
    let val = Math.exp(logVal); // convert back to normal scale
    let xTick = legendX + logT * legendWidth;
    textAlign(CENTER, TOP);
    text(val.toFixed(1), xTick, legendY + legendHeight + 2);
  }

  // Title
  textAlign(CENTER, BOTTOM);
  textSize(10);
  text(title, legendX + legendWidth / 2, legendY - 4);
}


function drawRadiusLegend(concMin, concMax, radiusMin = 5, radiusMax = 30) {
  const radY = 65;
  const radX = 60;

  // Log-distributed sample values
  let logMin = Math.log(concMin);
  let logMax = Math.log(concMax);
  let sampleVals = [];

  for (let i = 0; i <= 4; i++) {
    let logV = lerp(logMin, logMax, i / 4);
    sampleVals.push(Math.exp(logV));
  }

  textAlign(CENTER, BOTTOM);
  textSize(10);
  fill(0);
  text("Radius ~ Concentration", radX + 100, radY - 22);

  sampleVals.forEach((v, i) => {
    let t = map(v, concMin, concMax, 0, 1);
    let r = lerp(radiusMin, radiusMax, t);
    let x = radX + i * 45;
    fill(160);
    stroke(0);
    ellipse(x, radY, r);
    noStroke();
    fill(0);
    textAlign(CENTER, TOP);
    text(`${v.toFixed(1)}`, x, radY + r / 2 + 5);
  });
}


function findNearbyPoints(xPos, yPos, radius) {
  let indices = [];
  let rSq = radius * radius;
  for (let i = 0; i < x.length; i++) {
    let dx = x[i] - xPos;
    let dy = y[i] - yPos;
    if (dx * dx + dy * dy <= rSq) {
      indices.push(i);
    }
  }
  return indices;
}

function drawAnnotation() {
  let label = 'Site: A [control]\n';
  let elementMap = {
    'calcium': 'Calcium',
    'magnesium': 'Magnesium',
    'titanium': 'Titanium',
    'overlay': 'Overlay (RGB)'
  };

  label += `Element: ${elementMap[viewMode] || 'N/A'}\n`;
  label += `Dataset: ${currentDatasetLabel}`;

  textAlign(LEFT, BOTTOM);
  textSize(14);
  textLeading(18);
  fill(0);
  noStroke();
  textStyle(BOLD);
  textFont('Helvetica'); // or 'Georgia', 'Arial', or 'sans-serif'

  text(label, 16, height - 16);
}





