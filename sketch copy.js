let viewMode = 'magnesium';
let Mechan = 'IDW';
let table;
let currentDatasetLabel = 'Post-Treatment';


let lat = [], lon = [], cal = [], mag = [], tit = [];
let calcium = [], magnesium = [], titanium = [];
let x = [], y = [];

let minLat, maxLat, minLon, maxLon;
let minCal, maxCal, minMag, maxMag, minTit, maxTit;
let globalMinCal = Infinity, globalMaxCal = -Infinity;
let globalMinMag = Infinity, globalMaxMag = -Infinity;
let globalMinTit = Infinity, globalMaxTit = -Infinity;

let colorMap = [];



function log(x) {
  return Math.log(x);
}

function setup() {
  createCanvas(800, 600);
  background(255);


  createButton('Pre-Treatment').mousePressed(() => loadNewData('data2.csv'));
  createButton('Post-Treatment').mousePressed(() => loadNewData('data3.csv'));

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
  computeGlobalMinMax(['data2.csv', 'data3.csv'], () => {
    loadNewData('data2.csv');  // default dataset
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
    currentDatasetLabel = (filename === 'data2.csv') ? 'Pre-Treatment' : 'Post-Treatment';
    setupData();
  });
}

function setupData() {
  // Reset arrays
  lat = [], lon = [], cal = [], mag = [], tit = [];
  calcium = [], magnesium = [], titanium = [];
  x = [], y = [];

  // Reset bounds
  minLat = Infinity; maxLat = -Infinity;
  minLon = Infinity; maxLon = -Infinity;

  // Parse data and compute bounds
  for (let i = 0; i < table.getRowCount(); i++) {
    lat[i] = parseFloat(table.getString(i, 'latitude'));
    lon[i] = parseFloat(table.getString(i, 'longitude'));
    cal[i] = parseFloat(table.getString(i, 'calcium'));
    mag[i] = parseFloat(table.getString(i, 'magnesium'));
    tit[i] = parseFloat(table.getString(i, 'titanium'));

    minLat = min(minLat, lat[i]); maxLat = max(maxLat, lat[i]);
    minLon = min(minLon, lon[i]); maxLon = max(maxLon, lon[i]);
  }

  // Map data values to canvas coordinates and color indices (linear)
  for (let i = 0; i < table.getRowCount(); i++) {
    x[i] = map(lon[i], minLon-0.001, maxLon+0.001, 0, width);
    y[i] = map(lat[i], maxLat+0.001, minLat-0.001, 0, height);  // Y is inverted

    calcium[i] = map(cal[i], globalMinCal, globalMaxCal, 0, 511);
    magnesium[i] = map(mag[i], globalMinMag, globalMaxMag, 0, 511);
    titanium[i] = map(tit[i], globalMinTit, globalMaxTit, 0, 511);
  }

  // After x[], y[] are filled
let screenPoints = x.map((xi, i) => [xi, y[i]]);
convexHull = computeConvexHull(screenPoints);

  drawVisualization();
}

let convexHull = [];

function computeConvexHull(points) {
  // Andrew's monotone chain algorithm
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  let lower = [];
  for (let p of points) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }

  let upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    let p = points[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);

  function cross(o, a, b) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  }
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

  drawIDW();
  drawPoints();
  /*if (viewMode === 'calcium') {
    drawLegend(globalMinCal, globalMaxCal, "Calcium (ppm)");
    drawRadiusLegend(globalMinCal, globalMaxCal);
  } else if (viewMode === 'magnesium') {
    drawLegend(globalMinMag, globalMaxMag, "Magnesium (ppm)");
    drawRadiusLegend(globalMinMag, globalMaxMag);
  } else if (viewMode === 'titanium') {
    drawLegend(globalMinTit, globalMaxTit, "Titanium (ppm)");
    drawRadiusLegend(globalMinTit, globalMaxTit);
  }*/

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
    let val, t, colIndex, radius;

    if (viewMode === 'calcium') {
      val = cal[i];
      t = map(val, globalMinCal, globalMaxCal, 0, 1);
      colIndex = constrain(int(t * 511), 0, 511);
      radius = map(val, globalMinCal, globalMaxCal, 5, 30);
      fill(colorMap[colIndex]);
    } else if (viewMode === 'magnesium') {
      val = mag[i];
      t = map(val, globalMinMag, globalMaxMag, 0, 1);
      colIndex = constrain(int(t * 511), 0, 511);
      radius = map(val, globalMinMag, globalMaxMag, 5, 30);
      fill(colorMap[colIndex]);
    } else if (viewMode === 'titanium') {
      val = tit[i];
      t = map(val, globalMinTit, globalMaxTit, 0, 1);
      colIndex = constrain(int(t * 511), 0, 511);
      radius = map(val, globalMinTit, globalMaxTit, 5, 30);
      fill(colorMap[colIndex]);
    } else {
      // Overlay mode: RGB directly from linear-mapped values
      fill(calcium[i], magnesium[i], titanium[i]);
      ellipse(x[i], y[i], 8);
      continue;
    }

    fill(0,0,0);
    ellipse(x[i], y[i], radius);
  }
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function estimateAtAdaptiveMLS(xPos, yPos, nearbyInfo) {
  const indices = nearbyInfo.indices;
  const numNeighbors = indices.length;
  const SIGMA2 = 800;

  function gaussianWeight(dx, dy) {
    let distSq = dx*dx + dy*dy;
    return Math.exp(-distSq / (2 * SIGMA2));
  }

  function weightedAverage(values) {
    let weightedSum = 0;
    let totalWeight = 0;

    for (let i of indices) {
      let dx = x[i] - xPos;
      let dy = y[i] - yPos;
      let w = gaussianWeight(dx, dy);

      weightedSum += values[i] * w;
      totalWeight += w;
    }

    if (totalWeight === 0) return null;
    return weightedSum / totalWeight;
  }

  function buildMatrixFit(values, degree) {
    let A = [], b = [];

    for (let i of indices) {
      let dx = x[i] - xPos;
      let dy = y[i] - yPos;
      let w = gaussianWeight(dx, dy);

      // Only include terms we care about: intercept, dx, dy, dx², dx·dy, dy²
      let row = (degree === 2)
        ? [1 * w, dx * w, dy * w, dx * dx * w, dx * dy * w, dy * dy * w]
        : [1 * w, dx * w, dy * w];

      A.push(row);
      b.push(values[i] * w);
    }

    try {
      const AT = math.transpose(A);
      const ATA = math.multiply(AT, A);
      const ATb = math.multiply(AT, b);
      const coeffs = math.lusolve(ATA, ATb).flat();
      return coeffs[0]; // Only return intercept
    } catch (err) {
      return null;
    }
  }

  function smoothBlend(val1, val2, blend) {
    return (1 - blend) * val1 + blend * val2;
  }

  let fd = (numNeighbors >= 6) ? 2: 1;
  // Compute both estimates
  let waCal = weightedAverage(cal);
  let mlsCal = buildMatrixFit(cal, fd);

  let waMag = weightedAverage(mag);
  let mlsMag = buildMatrixFit(mag, fd);

  let waTit = weightedAverage(tit);
  let mlsTit = buildMatrixFit(tit, fd);

  if ([waCal, waMag, waTit].some(v => v == null || isNaN(v))) {
    return null;
  }

  // Blend factor based on density
  const WA_FACTOR_THRESHOLD = 2;
  const MAX_BLEND_NEIGHBORS = 10;
  let neighborFactor = constrain(map(numNeighbors, WA_FACTOR_THRESHOLD, MAX_BLEND_NEIGHBORS, 0, 1), 0, 1);
  let distanceFactor = 1.0 - constrain(map(nearbyInfo.nearestDistance, 10, 90, 0, 1), 0, 1);
  let alpha = (neighborFactor + distanceFactor)/2;


  // Apply blending
  let estCal = smoothBlend(waCal, mlsCal, alpha);
  let estMag = smoothBlend(waMag, mlsMag, alpha);
  let estTit = smoothBlend(waTit, mlsTit, alpha);

  // 🔒 Clamp to **local neighborhood range** (not global!)
  function clampToLocal(value, valuesArray) {
    let localMin = Math.min(...valuesArray);
    let localMax = Math.max(...valuesArray);
    return clamp(value, localMin, localMax);
  }

  const calLocal = indices.map(i => cal[i]);
  const magLocal = indices.map(i => mag[i]);
  const titLocal = indices.map(i => tit[i]);

  estCal = clampToLocal(estCal, calLocal);
  estMag = clampToLocal(estMag, magLocal);
  estTit = clampToLocal(estTit, titLocal);

  // 🔒 Then clamp to global bounds (just in case)
  return {
    calcium: clamp(estCal, globalMinCal, globalMaxCal),
    magnesium: clamp(estMag, globalMinMag, globalMaxMag),
    titanium: clamp(estTit, globalMinTit, globalMaxTit)
  };
}

function drawIDW(step = 1, baseRadius = 120) {
  loadPixels(); // Prepare for pixel manipulation

  for (let yPos = 0; yPos < height; yPos += step) {
    for (let xPos = 0; xPos < width; xPos += step) {
      if (!isInsideConvexHull(xPos, yPos, convexHull)) continue;

      // Find neighbors and determine density
      let nearbyInfo = findNearbyPointsWithContext(xPos, yPos, baseRadius);

      // CASE 1: No neighbors — paint gray
      if (nearbyInfo.densityStatus === 'no neighbors') {
        set(xPos, yPos, color(200)); // gray for sparse regions
        continue;
      }

      // CASE 2: Very close — paint exact value of nearest point
      /*if (nearbyInfo.densityStatus === 'very close') {
        const i = nearbyInfo.nearestIndex;
        let col;

        if (viewMode === 'calcium') {
          let t = map(Math.log(cal[i]), Math.log(globalMinCal), Math.log(globalMaxCal), 0, 1);
          let idx = constrain(int(t * 511), 0, 511);
          col = colorMap[idx];
        } else if (viewMode === 'magnesium') {
          let t = map(Math.log(mag[i]), Math.log(globalMinMag), Math.log(globalMaxMag), 0, 1);
          let idx = constrain(int(t * 511), 0, 511);
          col = colorMap[idx];
        } else if (viewMode === 'titanium') {
          let t = map(Math.log(tit[i]), Math.log(globalMinTit), Math.log(globalMaxTit), 0, 1);
          let idx = constrain(int(t * 511), 0, 511);
          col = colorMap[idx];
        } else {
          // Overlay RGB
          let r = map(cal[i], globalMinCal, globalMaxCal, 0, 255);
          let g = map(mag[i], globalMinMag, globalMaxMag, 0, 255);
          let b = map(tit[i], globalMinTit, globalMaxTit, 0, 255);
          col = color(r, g, b);
        }

        set(xPos, yPos, col);
        continue;
      }*/

      // CASE 3: Normal — run MLS
      
      let est = estimateAtAdaptiveMLS(xPos, yPos, nearbyInfo);
      if (!est) {
        set(xPos, yPos, color(200)); // fallback gray
        continue;
      }

      let col;
      if (viewMode === 'calcium') {
        let t = map(Math.log(est.calcium), Math.log(globalMinCal), Math.log(globalMaxCal), 0, 1);
        let idx = constrain(int(t * 511), 0, 511);
        col = colorMap[idx];
      } else if (viewMode === 'magnesium') {
        let t = map(Math.log(est.magnesium), Math.log(globalMinMag), Math.log(globalMaxMag), 0, 1);
        let idx = constrain(int(t * 511), 0, 511);
        col = colorMap[idx];
      } else if (viewMode === 'titanium') {
        let t = map(Math.log(est.titanium), Math.log(globalMinTit), Math.log(globalMaxTit), 0, 1);
        let idx = constrain(int(t * 511), 0, 511);
        col = colorMap[idx];
      } else {
        // Overlay RGB
        let r = map(est.calcium, globalMinCal, globalMaxCal, 0, 255);
        let g = map(est.magnesium, globalMinMag, globalMaxMag, 0, 255);
        let b = map(est.titanium, globalMinTit, globalMaxTit, 0, 255);
        col = color(r, g, b);
      }

      set(xPos, yPos, col);
    }
  }

  updatePixels(); // Apply changes

  
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

function findNearbyPointsWithContext(xPos, yPos, baseRadius = 180, scale = 1.0) {
  let indices = [];
  let adaptiveRadius = baseRadius * scale;
  let rSq = adaptiveRadius * adaptiveRadius;
  let minDistSq = Infinity;
  let nearestIndex = -1;

  for (let i = 0; i < x.length; i++) {
    let dx = x[i] - xPos;
    let dy = y[i] - yPos;
    let distSq = dx * dx + dy * dy;
    if (distSq <= rSq) {
      indices.push(i);
      if (distSq < minDistSq) {
        minDistSq = distSq;
        nearestIndex = i;
      }
    }
  }

  let nearestDistance = (minDistSq < Infinity) ? Math.sqrt(minDistSq) : null;
  let densityStatus;

  if (nearestDistance == null) {
    densityStatus = "no neighbors";
  } else if (nearestDistance < 10) {
    densityStatus = "very close";
  } else if (nearestDistance < 90) {
    densityStatus = "moderate";
  } else {
    densityStatus = "sparse";
  }

  return {
    indices,
    nearestIndex,
    nearestDistance,
    densityStatus
  };
}

function drawAnnotation() {
  let label = 'TEA [control] :\n';
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

function isInsideConvexHull(xp, yp, hull, epsilon = 0.5) {
  let sign = 0;
  for (let i = 0; i < hull.length; i++) {
    let [x1, y1] = hull[i];
    let [x2, y2] = hull[(i + 1) % hull.length];
    let cross = (x2 - x1) * (yp - y1) - (y2 - y1) * (xp - x1);
    if (Math.abs(cross) < epsilon) continue;
    if (sign === 0) sign = Math.sign(cross);
    else if (Math.sign(cross) !== sign) return false;
  }
  return true;
}





