let viewMode = 'magnesium';
let Mechan = 'IDW';
let table;
let currentDatasetLabel = 'Post-Treatment';
let userRadius = 10;
let paddingLat = 0.003;
let paddingLon = 0.003;
let pointdraw = true;
let IDWdraw = false;
let pointrediustoggle = true;
let pointcolortoggle = false;
let filenames = ['data2.csv', 'data3.csv'];
let labeltext = 4;
let needsUpdate = true;
let userest = 6400;
let blendmode = 0;

let lat = [], lon = [], cal = [], mag = [], tit = [];
let calcium = [], magnesium = [], titanium = [];
let x = [], y = [];

let minLat, maxLat, minLon, maxLon;
let minCal, maxCal, minMag, maxMag, minTit, maxTit;
let globalMinCal = Infinity, globalMaxCal = -Infinity;
let globalMinMag = Infinity, globalMaxMag = -Infinity;
let globalMinTit = Infinity, globalMaxTit = -Infinity;

let colorMap = [];
let estimationGrid = [];


function setup() {
  createCanvas(800, 600);
  background(255);


  createButton('Pre-Treatment').mousePressed(() => {needsUpdate = true; loadNewData(filenames[0])});
  createButton('Post-Treatment').mousePressed(() => {needsUpdate = true; loadNewData(filenames[1])});

  let btnCalcium = createButton('Calcium');
  btnCalcium.position(240, height + 12);
  btnCalcium.mousePressed(() => setView('calcium'));

  let btnMagnesium = createButton('Magnesium');
  btnMagnesium.position(305, height + 12);
  btnMagnesium.mousePressed(() => setView('magnesium'));

  let btnTitanium = createButton('Titanium');
  btnTitanium.position(392, height + 12);
  btnTitanium.mousePressed(() => setView('titanium'));

  let btnOverlay = createButton('Overlay');
  btnOverlay.position(460, height + 12);
  btnOverlay.mousePressed(() => setView('overlay'));


  radiusBox = createInput(userRadius.toString(), 'number');
  radiusBox.position(200, height + 40);
  radiusBox.size(60);

  radiusButton = createButton('Submit Radius');
  radiusButton.position(300, height + 40);
  radiusButton.mousePressed(() => {
    const val = parseFloat(radiusBox.value());
    if (!isNaN(val) && val > 0) {
      userRadius = val;
      needsUpdate = true;
      radiusLabel.html(`Radius to interpolate: ${userRadius}px`);
      drawVisualization();
    } else {
      radiusLabel.html('❌ Invalid Radius');
    }
  });
  radiusLabel = createP(`Radius to interpolate: ${userRadius}px`);
  radiusLabel.position(10, height + 25);


  estBox = createInput(userest.toString(), 'number');
  estBox.position(650, height + 80);
  estBox.size(60);

  estButton = createButton('Submit Sm. Factor');
  estButton.position(730, height + 80);
  estButton.mousePressed(() => {
    const val = parseFloat(estBox.value());
    if (!isNaN(val) && val > 0) {
      userest = val;
      needsUpdate = true;
      estLabel.html(`Smoothing Factor: ${userest}px`);
      drawVisualization();
    } else {
      estLabel.html('❌ Invalid');
    }
  });
  estLabel = createP(`Smoothing Factor: ${userest}px`);
  estLabel.position(450, height + 65);

  paddingLatBox = createInput(paddingLat.toString(), 'number');
  paddingLatBox.position(230, height + 80);
  paddingLatBox.size(60);

  paddingLatButton = createButton('Submit Padding');
  paddingLatButton.position(330, height + 100);
  paddingLatButton.mousePressed(() => {
    const val = parseFloat(paddingLatBox.value());
    if (!isNaN(val) && val >= 0) {
      paddingLat = val;
      needsUpdate = true;
      paddingLatLabel.html(`Padding in Latitude: ${paddingLat}px`);
    } else {
      paddingLatLabel.html('❌ Invalid Padding');
    }
    const val2 = parseFloat(paddingLonBox.value());
    if (!isNaN(val2) && val2 >= 0) {
      paddingLon = val2;
      paddingLonLabel.html(`Padding in Longitude: ${paddingLon}px`);
      setupData();
    } else {
      paddingLonLabel.html('❌ Invalid Padding');
    }
  });

  paddingLatLabel = createP(`Padding in Latitude: ${paddingLat}px`);
  paddingLatLabel.position(10, height + 65);

  paddingLonBox = createInput(paddingLon.toString(), 'number');
  paddingLonBox.position(230, height + 120);
  paddingLonBox.size(60);

  paddingLonLabel = createP(`Padding in Longitude: ${paddingLon}px`);
  paddingLonLabel.position(10, height + 105);

  let btnPoints = createButton('Points');
  btnPoints.position(550, height + 12);
  btnPoints.mousePressed(() => {
  pointdraw = !pointdraw;
  drawVisualization();
  });
  
  let btnView = createButton('Switch Between all points/selective radius interpolation');
  btnView.position(605, height + 12);
  btnView.mousePressed(() => {
  IDWdraw = !IDWdraw;
  needsUpdate = true;
  drawVisualization();
  });

  let btnPointsr = createButton('Points radius toggle');
  btnPointsr.position(605, height + 40);
  btnPointsr.mousePressed(() => {
  pointrediustoggle = !pointrediustoggle;
  drawVisualization();
  });

  let btnPointsc = createButton('Points color toggle');
  btnPointsc.position(745, height + 40);
  btnPointsc.mousePressed(() => {
  pointcolortoggle = !pointcolortoggle;
  drawVisualization();
  });

  let btnRiceA = createButton('Load Rice: Site A');
  btnRiceA.position(width+20, 20);
  btnRiceA.mousePressed(() => {
  labeltext = 0;
  filenames = ['data.csv', 'data1.csv']
  computeGlobalMinMax(filenames, () => {
    loadNewData(filenames[0]);
  });
  });

  let btnRiceAc = createButton('Load Rice: Site A [control]');
  btnRiceAc.position(width+20, 50);
  btnRiceAc.mousePressed(() => {
  labeltext = 1;
  filenames = ['data4.csv', 'data5.csv']
  computeGlobalMinMax(filenames, () => {
    loadNewData(filenames[0]);
  });
  });

  let btnRiceB = createButton('Load Rice: Site B');
  btnRiceB.position(width+20, 90);
  btnRiceB.mousePressed(() => {
  labeltext = 2;
  filenames = ['data - Copy.csv', 'data1 - Copy.csv']
  computeGlobalMinMax(filenames, () => {
    loadNewData(filenames[0]);
  });
  });

  let btnRiceBc = createButton('Load Rice: Site B [control]');
  btnRiceBc.position(width+20, 120);
  btnRiceBc.mousePressed(() => {
  labeltext = 3;
  filenames = ['data4 - Copy.csv', 'data5 - Copy.csv']
  computeGlobalMinMax(filenames, () => {
    loadNewData(filenames[0]);
  });
  });

  let btnTea = createButton('Load Tea');
  btnTea.position(width+20, 160);
  btnTea.mousePressed(() => {
  labeltext = 4;
  filenames = ['data2.csv', 'data3.csv']
  computeGlobalMinMax(filenames, () => {
    loadNewData(filenames[0]);
  });
  });

  let btnTeac = createButton('Load Tea [control]');
  btnTeac.position(width+20, 190);
  btnTeac.mousePressed(() => {
  labeltext = 5;
  filenames = ['data6.csv', 'data7.csv']
  computeGlobalMinMax(filenames, () => {
    loadNewData(filenames[0]);
  });
  });

  let btndist = createButton('Distance Smoothen');
  btndist.position(500, height+120);
  btndist.mousePressed(() => {
  blendmode = 0;
  needsUpdate = true;
  drawVisualization();
  });

  let btnneig = createButton('Neighbors based smoothen');
  btnneig.position(650, height+120);
  btnneig.mousePressed(() => {
  blendmode = 1;
  needsUpdate = true;
  drawVisualization();
  });

  let btndnn = createButton('distance and neighbors smoothen');
  btndnn.position(560, height+145);
  btndnn.mousePressed(() => {
  blendmode = 2;
  needsUpdate = true;
  drawVisualization();
  });



  // Color map setup
  const rainbowHex = [
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

  computeGlobalMinMax(filenames, () => {
    loadNewData(filenames[0]);
  });
}

function computeGlobalMinMax(files, callback) {
  let pending = files.length;
  if(pending === 2){
    globalMinCal = Infinity, globalMaxCal = -Infinity;
    globalMinMag = Infinity, globalMaxMag = -Infinity;
    globalMinTit = Infinity, globalMaxTit = -Infinity;
  }
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

      if (--pending === 0) callback();
    });
  });
}

function loadNewData(filename) {
  loadTable(filename, 'csv', 'header', (newTable) => {
    table = newTable;
    currentDatasetLabel = (filename === filenames[0]) ? 'Pre-Treatment' : 'Post-Treatment';
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
    x[i] = map(lon[i], minLon-paddingLat, maxLon+paddingLat, 0, width);
    y[i] = map(lat[i], maxLat+paddingLon, minLat-paddingLon, 0, height);

    calcium[i] = map(cal[i], globalMinCal, globalMaxCal, 0, 511);
    magnesium[i] = map(mag[i], globalMinMag, globalMaxMag, 0, 511);
    titanium[i] = map(tit[i], globalMinTit, globalMaxTit, 0, 511);
  }

let screenPoints = x.map((xi, i) => [xi, y[i]]);
convexHull = computeConvexHull(screenPoints);

  drawVisualization();
}

let convexHull = [];

function computeConvexHull(points) {
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

  if(IDWdraw){
    drawIDW();
  }
  else{
    if (needsUpdate) {
    computeEstimationGrid(1, userRadius);
    needsUpdate = false;
  }

  drawIDW2();
  }
  if(pointdraw)
    drawPoints();
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
  
  noFill();
  stroke(0);
  strokeWeight(2);
  rect(0, 0, width - 1, height - 1);


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
      fill(calcium[i], magnesium[i], titanium[i]);
      ellipse(x[i], y[i], 8);
      continue;
    }
    if(pointcolortoggle)
      fill(colorMap[colIndex]);
    else
      fill(0,0,0);
    if(pointrediustoggle)
      ellipse(x[i], y[i], radius);
    else
      ellipse(x[i],y[i], 8);
  }
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function estimateAtAdaptiveMLS(xPos, yPos, mode) {
  const SIGMA2 = userest;
  const EPSILON = 1e-6;

  let nearestDistSq = Infinity;

  let A = [];
  let b = [];

  let waSum = 0;
  let waVal = 0;

  let dataArray;
  if (mode === 'calcium') dataArray = cal;
  else if (mode === 'magnesium') dataArray = mag;
  else if (mode === 'titanium') dataArray = tit;
  else return null;

  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - xPos;
    const dy = y[i] - yPos;
    const dSq = dx*dx + dy*dy;
    if (dSq < nearestDistSq) nearestDistSq = dSq;

    const w = Math.exp(-dSq / (SIGMA2));
    if (w < EPSILON) continue;

    waVal += dataArray[i] * w;
    waSum += w;

    A.push([
      w * 1,
      w * dx,
      w * dy,
      w * dx * dx,
      w * dx * dy,
      w * dy * dy
    ]);
    b.push(dataArray[i] * w);
  }

  if (waSum === 0) return null;

  const nearestDist = Math.sqrt(nearestDistSq);
  const alpha = 1.0 - constrain(map(nearestDist, 50, 180, 0, 1), 0, 1);

  function solveLS(A, b) {
    if (A.length < 6) return null;
    try {
      const AT = math.transpose(A);
      const ATA = math.multiply(AT, A);
      const ATb = math.multiply(AT, b);
      const c = math.lusolve(ATA, ATb);
      return c[0][0];
    } catch {
      return null;
    }
  }

  const waEstimate = waVal / waSum;
  const mlsEstimate = solveLS(A, b);
  const blended = (1 - alpha) * waEstimate + alpha * (mlsEstimate ?? waEstimate);

  function clampVal(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  if (mode === 'calcium') {
    return clampVal(blended, globalMinCal, globalMaxCal);
  } else if (mode === 'magnesium') {
    return clampVal(blended, globalMinMag, globalMaxMag);
  } else if (mode === 'titanium') {
    return clampVal(blended, globalMinTit, globalMaxTit);
  }
  
  return null;
}

function drawIDW(step = 1) {
  loadPixels();

  for (let yPos = 0; yPos < height; yPos += step) {
    for (let xPos = 0; xPos < width; xPos += step) {
      if (!isInsideConvexHull(xPos, yPos, convexHull)) continue;

      const est = estimateAtAdaptiveMLS(xPos, yPos, viewMode); // est is a number
      if (est === null || est === undefined) {
        set(xPos, yPos, color(200)); // fallback gray
        continue;
      }

      let col;
      if (viewMode === 'calcium') {
        let t = map(Math.log(est), Math.log(globalMinCal), Math.log(globalMaxCal), 0, 1);
        let idx = constrain(int(t * 511), 0, 511);
        col = colorMap[idx];
      } else if (viewMode === 'magnesium') {
        let t = map(Math.log(est), Math.log(globalMinMag), Math.log(globalMaxMag), 0, 1);
        let idx = constrain(int(t * 511), 0, 511);
        col = colorMap[idx];
      } else if (viewMode === 'titanium') {
        let t = map(Math.log(est), Math.log(globalMinTit), Math.log(globalMaxTit), 0, 1);
        let idx = constrain(int(t * 511), 0, 511);
        col = colorMap[idx];
      } else {
        let c = estimateAtAdaptiveMLS(xPos, yPos, 'calcium');
        let m = estimateAtAdaptiveMLS(xPos, yPos, 'magnesium');
        let ti = estimateAtAdaptiveMLS(xPos, yPos, 'titanium');
        let r = map(c, globalMinCal, globalMaxCal, 0, 255);
        let g = map(m, globalMinMag, globalMaxMag, 0, 255);
        let b = map(ti, globalMinTit, globalMaxTit, 0, 255);
        col = color(r, g, b);
      }

      set(xPos, yPos, col);
    }
  }

  updatePixels();
}

function drawLegend(concMin, concMax, title = "Concentration (ppm)") {
  const legendWidth = 200;
  const legendHeight = 12;
  const padding = 16;

  const legendX = width - legendWidth - padding;
  const legendY = height - legendHeight - padding - 28;

  for (let i = 0; i < legendWidth; i++) {
    let t = i / (legendWidth - 1);
    let idx = int(t * (colorMap.length - 1));
    fill(colorMap[idx]);
    noStroke();
    rect(legendX + i, legendY, 1, legendHeight);
  }

  noFill();
  stroke(0);
  rect(legendX, legendY, legendWidth, legendHeight);

  let numTicks = 6;
  textSize(9);
  fill(0);
  noStroke();
  for (let i = 0; i <= numTicks; i++) {
    let logT = i / numTicks;
    let logVal = lerp(Math.log(concMin), Math.log(concMax), logT);
    let val = Math.exp(logVal);
    let xTick = legendX + logT * legendWidth;
    textAlign(CENTER, TOP);
    text(val.toFixed(1), xTick, legendY + legendHeight + 2);
  }

  textAlign(CENTER, BOTTOM);
  textSize(10);
  text(title, legendX + legendWidth / 2, legendY - 4);
}

function drawRadiusLegend(concMin, concMax, radiusMin = 5, radiusMax = 30) {
  const radY = 65;
  const radX = 60;

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

function drawAnnotation() {
  let label = '\n';
  if(labeltext === 0)
    label = 'RICE Site A :\n';
  else if(labeltext === 1)
    label = 'RICE Site A [control] :\n';
  else if(labeltext === 2)
    label = 'RICE Site B :\n';
  else if(labeltext === 3)
    label = 'RICE Site B [control] :\n';
  else if(labeltext === 4)
    label = 'TEA :\n';
  else
    label = 'TEA [control] :\n';
  
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
  textFont('Helvetica');

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

function estimateAtAdaptiveMLS2(xPos, yPos, nearbyInfo) {
  const indices = nearbyInfo.indices;
  const numNeighbors = indices.length;
  const SIGMA2 = userest;

  function gaussianWeight(dx, dy) {
    let distSq = dx*dx + dy*dy;
    return Math.exp(-distSq / (SIGMA2));
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
      return coeffs[0];
    } catch (err) {
      return null;
    }
  }

  function smoothBlend(val1, val2, blend) {
    return (1 - blend) * val1 + blend * val2;
  }

  let fd = (numNeighbors >= 6) ? 2: 1;
  let waCal = weightedAverage(cal);
  let mlsCal = buildMatrixFit(cal, fd);

  let waMag = weightedAverage(mag);
  let mlsMag = buildMatrixFit(mag, fd);

  let waTit = weightedAverage(tit);
  let mlsTit = buildMatrixFit(tit, fd);

  if ([waCal, waMag, waTit].some(v => v == null || isNaN(v))) {
    return null;
  }

  const WA_FACTOR_THRESHOLD = 2;
  const MAX_BLEND_NEIGHBORS = 10;
  let neighborFactor = constrain(map(numNeighbors, WA_FACTOR_THRESHOLD, MAX_BLEND_NEIGHBORS, 0, 1), 0, 1);
  let distanceFactor = 1.0 - constrain(map(nearbyInfo.nearestDistance, 10, userRadius*9/10, 0, 1), 0, 1);
  
  let alpha;
  if(blendmode === 0)
    alpha = distanceFactor;
  else if(blendmode === 1)
    alpha = neighborFactor;
  else
    alpha = (neighborFactor + distanceFactor)/2;


  let estCal = smoothBlend(waCal, mlsCal, alpha);
  let estMag = smoothBlend(waMag, mlsMag, alpha);
  let estTit = smoothBlend(waTit, mlsTit, alpha);

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

  return {
    calcium: clamp(estCal, globalMinCal, globalMaxCal),
    magnesium: clamp(estMag, globalMinMag, globalMaxMag),
    titanium: clamp(estTit, globalMinTit, globalMaxTit)
  };
}

function computeEstimationGrid(step = 1, baseRadius = 120) {
  estimationGrid = [];

  for (let yPos = 0; yPos < height; yPos += step) {
    let row = [];
    for (let xPos = 0; xPos < width; xPos += step) {
      if (!isInsideConvexHull(xPos, yPos, convexHull)) {
        row.push('outside'); // Tag explicitly
        continue;
      }

      let nearbyInfo = findNearbyPointsWithContext(xPos, yPos, baseRadius);
      let est = (nearbyInfo.indices.length > 5) ? estimateAtAdaptiveMLS2(xPos, yPos, nearbyInfo) : null;
      row.push(est);
    }
    estimationGrid.push(row);
  }
}

function drawIDW2(step = 1) {
  loadPixels();
  for (let y = 0; y < estimationGrid.length; y++) {
    for (let x = 0; x < estimationGrid[y].length; x++) {
      let est = estimationGrid[y][x];
      let xPos = x * step;
      let yPos = y * step;

      if (est === 'outside') {
        set(xPos, yPos, color(255)); // pure white for outside
        continue;
      }

      if (!est) {
        set(xPos, yPos, color(200)); // gray fallback for failed estimate
        continue;
      }

      let col;
      if (viewMode === 'calcium') {
        let t = map(Math.log(est.calcium), Math.log(globalMinCal), Math.log(globalMaxCal), 0, 1);
        col = colorMap[constrain(int(t * 511), 0, 511)];
      } else if (viewMode === 'magnesium') {
        let t = map(Math.log(est.magnesium), Math.log(globalMinMag), Math.log(globalMaxMag), 0, 1);
        col = colorMap[constrain(int(t * 511), 0, 511)];
      } else if (viewMode === 'titanium') {
        let t = map(Math.log(est.titanium), Math.log(globalMinTit), Math.log(globalMaxTit), 0, 1);
        col = colorMap[constrain(int(t * 511), 0, 511)];
      } else {
        let r = map(est.calcium, globalMinCal, globalMaxCal, 0, 255);
        let g = map(est.magnesium, globalMinMag, globalMaxMag, 0, 255);
        let b = map(est.titanium, globalMinTit, globalMaxTit, 0, 255);
        col = color(r, g, b);
      }

      set(xPos, yPos, col);
    }
  }
  updatePixels();
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

