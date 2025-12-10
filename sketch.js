// -------------------------------------------------------
// SMART RGB LAMP UI — Neo-Glow + Glassmorphism Hybrid
// -------------------------------------------------------

let port;
let writer;

let mode = "auto";
let selectedColor = "#ff0000";
let effect = "static";
let colorInput;

// -------------------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();

  let connectBtn = createButton("🔌 Connect to Arduino");
  connectBtn.position(20, 20);
  connectBtn.style("padding", "10px 22px");
  connectBtn.style("font-size", "16px");
  connectBtn.style("border", "none");
  connectBtn.style("outline", "none");
  connectBtn.style("cursor", "pointer");
  connectBtn.style("border-radius", "8px");
  connectBtn.style("background", "linear-gradient(135deg, #3a86ff, #8338ec)");
  connectBtn.style("color", "white");
  connectBtn.style("box-shadow", "0 0 12px rgba(138, 43, 226, 0.6)");
  connectBtn.mousePressed(connectPort);
}

async function connectPort() {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    writer = port.writable.getWriter();
    console.log("Serial Connected!");
  } catch (err) {
    console.log("Serial Connection Failed", err);
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

// -------------------------------------------------------
function draw() {
  drawBackground();
  drawUI();
}

// -------------------------------------------------------
// GRADIENT + NEON BACKGROUND
// -------------------------------------------------------
function drawBackground() {
  let c1 = color("#0d0d0d");
  let c2 = color("#1a1a40");

  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(0, y, width, y);
  }

  noStroke();
  fill(255, 50, 150, 70);
  ellipse(width * 0.25, height * 0.3, 300, 300);

  fill(80, 120, 255, 65);
  ellipse(width * 0.75, height * 0.7, 350, 350);
}

// -------------------------------------------------------
function drawUI() {
  fill(255, 255, 255, 18);
  stroke(255, 255, 255, 30);
  strokeWeight(1.2);
  rect(width / 2 - 260, 90, 520, 520, 25);

  fill(255);
  noStroke();
  textAlign(CENTER);
  textSize(32);
  text("Smart RGB Lamp Control", width / 2, 140);

  drawModeButtons();

  if (mode === "manual") {
    drawColorPicker();
    drawEffectButtons();
  }
}

// -------------------------------------------------------
// MODE BUTTONS
// -------------------------------------------------------
function drawModeButtons() {
  drawButton(width / 2 - 130, 200, 120, 55, "AUTO", mode === "auto");
  drawButton(width / 2 + 10, 200, 120, 55, "MANUAL", mode === "manual");
}

function drawButton(x, y, w, h, label, active) {
  push();
  drawingContext.shadowBlur = active ? 18 : 0;
  drawingContext.shadowColor = active ? "rgba(255,0,120,0.7)" : "transparent";
  fill(active ? "rgba(255,0,120,0.45)" : "rgba(255,255,255,0.15)");
  noStroke();
  rect(x, y, w, h, 15);
  pop();

  fill(255);
  textSize(18);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2);
}

// -------------------------------------------------------
// COLOR PICKER
// -------------------------------------------------------
function drawColorPicker() {
  fill(255);
  textSize(20);
  text("Choose LED Color", width / 2, 290);

  if (!colorInput) {
    colorInput = createColorPicker("#ff0000");
    colorInput.position(width / 2 - 55, 315);
    colorInput.size(120);
    colorInput.style("border-radius", "10px");
    colorInput.style("border", "2px solid rgba(255,255,255,0.3)");
    colorInput.style("box-shadow", "0 0 12px rgba(255,0,120,0.4)");
    colorInput.input(sendManualColor);
  }
}

// ------------------- UPDATED: send color + re-send effect -----------------
function sendManualColor() {
  selectedColor = this.value();

  let r = unhex(selectedColor.substring(1, 3));
  let g = unhex(selectedColor.substring(3, 5));
  let b = unhex(selectedColor.substring(5, 7));

  sendToArduino(`RGB:${r},${g},${b}\n`);

  // ⭐ Important fix: re-send current effect so it keeps working
  sendToArduino(`EFFECT:${effect.toUpperCase()}\n`);
}

// -------------------------------------------------------
// EFFECT BUTTONS
// -------------------------------------------------------
function drawEffectButtons() {
  fill(255);
  textSize(20);
  text("Lighting Effects", width / 2, 400);

  drawEffectButton(width / 2 - 180, 430, "Static", "static");
  drawEffectButton(width / 2 - 60, 430, "Breathing", "breathing");
  drawEffectButton(width / 2 + 60, 430, "Heartbeat", "heartbeat");
  drawEffectButton(width / 2 + 180, 430, "Strobe", "strobe");
}

function drawEffectButton(x, y, label, value) {
  let active = (effect === value);

  push();
  drawingContext.shadowBlur = active ? 20 : 0;
  drawingContext.shadowColor = active ? "rgba(60,150,255,0.8)" : "transparent";

  fill(active ? "rgba(60,150,255,0.35)" : "rgba(255,255,255,0.15)");
  rect(x - 50, y, 100, 45, 12);
  pop();

  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text(label, x, y + 23);
}

// -------------------------------------------------------
// Mouse Interaction
// -------------------------------------------------------
function mousePressed() {

  // AUTO / MANUAL toggle
  if (mouseInside(width / 2 - 130, 200, 120, 55)) {
    mode = "auto";
    sendToArduino("AUTO\n");
  }

  if (mouseInside(width / 2 + 10, 200, 120, 55)) {
    mode = "manual";
    sendToArduino("MANUAL\n");
  }

  // --- EFFECTS WORK IN MANUAL MODE NOW ---
  if (mode === "manual") {

    // Static
    if (mouseInside(width / 2 - 230, 430, 100, 45)) {
      effect = "static";
      sendEffect("STATIC");
    }

    // Breathing
    if (mouseInside(width / 2 - 110, 430, 100, 45)) {
      effect = "breathing";
      sendEffect("BREATH");
    }

    // Heartbeat
    if (mouseInside(width / 2 + 10, 430, 100, 45)) {
      effect = "heartbeat";
      sendEffect("HEART");
    }

    // Strobe
    if (mouseInside(width / 2 + 130, 430, 100, 45)) {
      effect = "strobe";
      sendEffect("STROBE");
    }
  }
}

function sendEffect(name) {
  effect = name.toLowerCase();
  sendToArduino(`EFFECT:${name}\n`);
}

function mouseInside(x, y, w, h) {
  return mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
}

// -------------------------------------------------------
function sendToArduino(msg) {
  if (writer) {
    writer.write(new TextEncoder().encode(msg));
    console.log("Sent:", msg);
  }
}
