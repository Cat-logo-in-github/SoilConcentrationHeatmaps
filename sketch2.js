let table;
let lat = [], lon = [], cal = [], mag = [], tit = [];
let minLat, maxLat, minLon, maxLon;
let minCal, maxCal, minMag, maxMag, minTit, maxTit;

let viewMode = 'calcium';
let view3D = true; // 3D view by default

function preload() {
  table = loadTable('data.csv', 'csv', 'header');
}

function setup() {
  createCanvas(800, 600, WEBGL);
  angleMode(DEGREES);

  createButton('Pre-Treatment').mousePressed(() => loadNewData('data.csv'));
  createButton('Post-Treatment').mousePressed(() => loadNewData('data1.csv'));
  createButton('Calcium').mousePressed(() => setView('calcium'));
  createButton('Magnesium').mousePressed(() => setView('magnesium'));
  createButton('Titanium').mousePressed(() => setView('titanium'));

  setupData();
}

function loadNewData(filename) {
  loadTable(filename, 'csv', 'header', (newTable) => {
    table = newTable;
    setupData();
  });
}

function setView(mode) {
  viewMode = mode;
}

function setupData() {
  lat = [];
  lon = [];
  cal = [];
  mag = [];
  tit = [];

  minLat = Infinity; maxLat = -Infinity;
  minLon = Infinity; maxLon = -Infinity;
  minCal = Infinity; maxCal = -Infinity;
  minMag = Infinity; maxMag = -Infinity;
  minTit = Infinity; maxTit = -Infinity;

  for (let i = 0; i < table.getRowCount(); i++) {
    lat[i] = parseFloat(table.getString(i, 'latitude'));
    lon[i] = parseFloat(table.getString(i, 'longitude'));
    cal[i] = parseFloat(table.getString(i, 'calcium'));
    mag[i] = parseFloat(table.getString(i, 'magnesium'));
    tit[i] = parseFloat(table.getString(i, 'titanium'));

    minCal = min(minCal, cal[i]);
    maxCal = max(maxCal, cal[i]);
    minMag = min(minMag, mag[i]);
    maxMag = max(maxMag, mag[i]);
    minTit = min(minTit, tit[i]);
    maxTit = max(maxTit, tit[i]);

    minLat = min(minLat, lat[i]);
    maxLat = max(maxLat, lat[i]);
    minLon = min(minLon, lon[i]);
    maxLon = max(maxLon, lon[i]);
  }
}

function draw() {
  background(240);
  orbitControl();
  ambientLight(150);
  directionalLight(255, 255, 255, -1, -1, -1);

  draw3DHeightmap();
}

function draw3DHeightmap(step = 5, radius = 100) {
  let cols = floor(width / step);
  let rows = floor(height / step);
  let surface = [];
  let valid = [];
  let heightBoost = 3;
  let minHeight = 255;

  // Interpolate heights on grid
  for (let j = 0; j <= rows; j++) {
    surface[j] = [];
    valid[j] = [];
    for (let i = 0; i <= cols; i++) {
      let px = i * step;
      let py = j * step;
      let est = estimateAt(px, py, 2, radius);

      if (!est) {
        valid[j][i] = false;
        surface[j][i] = null;
      } else {
        let h = 0;
        if (viewMode === 'calcium') h = map(est.calcium, minCal, maxCal, 0, 255);
        else if (viewMode === 'magnesium') h = map(est.magnesium, minMag, maxMag, 0, 255);
        else if (viewMode === 'titanium') h = map(est.titanium, minTit, maxTit, 0, 255);

        surface[j][i] = h;
        valid[j][i] = true;

        if (h < minHeight) minHeight = h;
      }
    }
  }

  push();
  scale(0.5);
  rotateX(60);
  rotateZ(45);
  translate(-cols * step / 2, -rows * step / 2, 0);

  // Ground plane
  push();
  fill(200);
  noStroke();
  translate((cols * step) / 2, (rows * step) / 2, 0);
  rotateX(HALF_PI);
  plane(cols * step, rows * step);
  pop();

  // Heightmap mesh (triangles)
  for (let y = 0; y < rows; y++) {
    beginShape(TRIANGLE_STRIP);
    for (let x = 0; x <= cols; x++) {
      if (valid[y][x] && valid[y + 1] && valid[y + 1][x]) {
        let h1 = surface[y][x];
        let h2 = surface[y + 1][x];

        let col1, col2;
        if (viewMode === 'calcium') {
          col1 = color(h1, 0, 0, 160);
          col2 = color(h2, 0, 0, 160);
        } else if (viewMode === 'magnesium') {
          col1 = color(0, h1, 0, 160);
          col2 = color(0, h2, 0, 160);
        } else if (viewMode === 'titanium') {
          col1 = color(0, 0, h1, 160);
          col2 = color(0, 0, h2, 160);
        } else {
          col1 = color(h1, h1, h1, 160);
          col2 = color(h2, h2, h2, 160);
        }

        noStroke();
        fill(col1);
        vertex(x * step, y * step, (h1 - minHeight) * heightBoost);
        fill(col2);
        vertex(x * step, (y + 1) * step, (h2 - minHeight) * heightBoost);
      }
    }
    endShape();
  }

  // Draw data points aligned with surface
  push();
  noStroke();
  fill(255, 255, 0, 200);

  for (let i = 0; i < lat.length; i++) {
    // Map lat/lon to grid coords (px, py) within heightmap's grid system
    let pxGrid = map(lon[i], minLon, maxLon, 0, cols * step);
    let pyGrid = map(lat[i], maxLat, minLat, 0, rows * step); // inverted y-axis to match grid

    let xIndex = constrain(floor(pxGrid / step), 0, cols);
    let yIndex = constrain(floor(pyGrid / step), 0, rows);

    let heightVal;
    if (surface[yIndex] && surface[yIndex][xIndex] !== null) {
      heightVal = surface[yIndex][xIndex];
    } else {
      if (viewMode === 'calcium') heightVal = map(cal[i], minCal, maxCal, 0, 255);
      else if (viewMode === 'magnesium') heightVal = map(mag[i], minMag, maxMag, 0, 255);
      else if (viewMode === 'titanium') heightVal = map(tit[i], minTit, maxTit, 0, 255);
      else heightVal = 0;
    }

    let pz = (heightVal - minHeight) * heightBoost;

    push();
    translate(pxGrid, pyGrid, pz);
    sphere(3);
    pop();
  }

  pop();
  pop();
}

// IDW estimation function unchanged
function estimateAt(xPos, yPos, power = 2, radius = 100) {
  let weightedCal = 0, weightedMag = 0, weightedTit = 0;
  let totalWeight = 0;

  for (let i = 0; i < lat.length; i++) {
    // Map lat/lon to grid coords for distance calc:
    let px = map(lon[i], minLon, maxLon, 0, width);
    let py = map(lat[i], maxLat, minLat, 0, height);

    let dx = px - xPos;
    let dy = py - yPos;
    let distSq = dx * dx + dy * dy;

    if (distSq === 0) {
      return {
        calcium: cal[i],
        magnesium: mag[i],
        titanium: tit[i]
      };
    }

    let dist = sqrt(distSq);
    if (dist > radius) continue;

    let weight = 1 / Math.pow(dist, power);
    weightedCal += cal[i] * weight;
    weightedMag += mag[i] * weight;
    weightedTit += tit[i] * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return null;

  return {
    calcium: weightedCal / totalWeight,
    magnesium: weightedMag / totalWeight,
    titanium: weightedTit / totalWeight
  };
}
