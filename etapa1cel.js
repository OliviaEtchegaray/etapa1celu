let video, faceapi, detections = [];
let stars = [];
let state = "face"; 
let timer = 0, msgIndex = 0;
let displayedText = "";
let glitchTimer = 0;

// cámara en transición
let camScale = 1.0, targetScale = 1.0; 
let camX = 0, camY = 0, targetX = 0, targetY = 0;

let sensorActive = true; // controla si el sensor detecta rostros

let message = `Decís que tus secretos son tuyos,
pero cada palabra que no compartís también deja huella.
El algoritmo interpreta lo que callás,
deduce lo que ocultás,
predice lo que nunca dijiste.
Las fotos que borraste,
los mensajes eliminados,
las confesiones que nunca escribiste,
son espejos invisibles que alguien, en algún servidor,
ya convirtió en estadística.
Creemos que elegimos qué mostrar y qué esconder,
pero lo íntimo se filtra en cada clic,
en cada pausa antes de enviar un mensaje,
en la respiración frente a la cámara encendida.
¿Dónde termina lo privado
cuando lo humano se convierte en dato?
¿A quién le pertenece tu intimidad
cuando se traduce en patrones,
en predicciones,
en capital para una máquina que no olvida?`;

function setup(){
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();

  const faceOptions = { withLandmarks: true, withExpressions: false, withDescriptors: false };
  faceapi = ml5.faceApi(video, faceOptions, () => {
    if(sensorActive) faceapi.detect(gotFaces);
  });

  textFont('Arial');
  textSize(28);
  fill(255,0,0);
  textAlign(LEFT,TOP);
  timer = millis();
}

function gotFaces(err, result){
  if(result) detections = result;
  if(sensorActive) faceapi.detect(gotFaces);
}

function draw(){
  background(state === "face" ? 0 : 255);

  // verificar tamaño de cámara para activar/desactivar sensor
  sensorActive = (width*targetScale > 200 && height*targetScale > 150); // threshold ajustable

  if(state === "text"){
    if(frameCount % 5 === 0) 
      stars.push({x:random(width), y:random(height), spikes:5, outer:20, inner:8});
    for(let s of stars) drawStar(s.x, s.y, s.spikes, s.outer, s.inner);
    if(stars.length > 300) stars.splice(0, stars.length-300);
  }

  camScale = lerp(camScale, targetScale, 0.05);
  camX = lerp(camX, targetX, 0.05);
  camY = lerp(camY, targetY, 0.05);

  // cámara en espejo
  push();
  translate(width,0);
  scale(-1,1);
  translate(camX, camY);
  scale(camScale);
  image(video,0,0,width,height);
  if(sensorActive && state === "face") drawFaceDetection(); // solo si sensor activo
  pop();

  drawFaceLabels();   // etiquetas legibles sin espejo

  if(state === "face"){
    if(millis()-timer > 5000){ 
      state="text"; 
      msgIndex=0; 
      displayedText=""; 
      timer=millis(); 
      targetScale=0.25;
      targetX = width*0.65; 
      targetY = height*0.65; 
    }
  } else if(state === "text"){
    drawConfessionalText();
  }
}

// --- dibujo de puntos y marcos (profesional) ---
function drawFaceDetection(){
  for(let d of detections){
    if(d.landmarks){
      let pts = d.landmarks.positions;

      stroke(255,0,0,180);
      strokeWeight(3);
      noFill();

      let areas = [
        {name:"Ojo izquierdo", idx:[36,39]},
        {name:"Ojo derecho", idx:[42,45]},
        {name:"Nariz", idx:[27,30]},
        {name:"Boca", idx:[48,54]},
        {name:"Frente", idx:[19,24]},
        {name:"Oreja izq", idx:[0,0]},
        {name:"Oreja der", idx:[16,16]},
        {name:"Barbilla", idx:[8,8]}
      ];

      for(let area of areas){
        let x1 = pts[area.idx[0]]._x;
        let y1 = pts[area.idx[0]]._y;
        let x2 = pts[area.idx[1]]._x;
        let y2 = pts[area.idx[1]]._y;
        let w = max(10,abs(x2-x1)+20);
        let h = max(10,abs(y2-y1)+20);
        rect(x1-10,y1-10,w,h,8); // borde redondeado para look moderno
      }

      // puntos importantes
      fill(255,0,0);
      noStroke();
      for(let p of pts){
        ellipse(p._x,p._y,6,6);
      }
    }
  }
}

// --- etiquetas legibles ---
function drawFaceLabels(){
  for(let d of detections){
    if(d.landmarks){
      let pts = d.landmarks.positions;
      fill(255,0,0);
      noStroke();
      textSize(28);
      textAlign(LEFT,CENTER);

      let nombres = {
        "Ojo izquierdo":36,
        "Ojo derecho":45,
        "Nariz":30,
        "Boca":62,
        "Oreja izq":0,
        "Oreja der":16,
        "Barbilla":8,
        "Frente":27
      };

      for(let [nombre, idx] of Object.entries(nombres)){
        let p = pts[idx];
        let mirroredX = width - p._x;
        text(`${nombre} (${int(p._x)},${int(p._y)})`, mirroredX+12, p._y);
      }
    }
  }
}

// --- texto confesionario ---
function drawConfessionalText(){
  textSize(48);
  fill(0);
  textAlign(LEFT,TOP);

  if(msgIndex < message.length && millis()-timer > 10){
    displayedText += message[msgIndex];
    msgIndex++;
    timer = millis();
  }
  text(displayedText,20,height*0.05,width*0.7,height*0.9);

  if(msgIndex >= message.length){
    if(millis()-timer > 2000){
      if(millis()-glitchTimer > 100){
        for(let i=0;i<10;i++) drawStar(random(width),random(height),5,25,10);
        glitchTimer=millis();
      }
      textAlign(CENTER,CENTER);
      textSize(60);
      fill(255,0,0);
      text("CONFESIONARIO ALGORÍTMICO",width/2,height/2);

      if(millis()-timer > 4000){
        state="face";
        timer=millis();
        targetScale=1.0;
        targetX=0;
        targetY=0;
      }
    }
  }
}

// --- estrellas ---
function drawStar(cx,cy,spikes,outer,inner){
  let angle=TWO_PI/spikes, halfAngle=angle/2;
  beginShape();
  noFill();
  stroke(255,0,0);
  strokeWeight(2);
  for(let a=0;a<TWO_PI;a+=angle){
    let sx=cx+cos(a)*outer, sy=cy+sin(a)*outer; vertex(sx,sy);
    sx=cx+cos(a+halfAngle)*inner; sy=cy+sin(a+halfAngle)*inner; vertex(sx,sy);
  }
  endShape(CLOSE);
}

// --- interacción ---
function mousePressed(){
  if(state==="face"){
    state="text"; msgIndex=0; displayedText=""; timer=millis();
    targetScale=0.25;
    targetX=width*0.65;
    targetY=height*0.65;
  }
  else if(state==="text"){
    state="face"; timer=millis();
    targetScale=1.0;
    targetX=0;
    targetY=0;
  }
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);
}
