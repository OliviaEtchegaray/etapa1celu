let video, faceapi, detections = [];
let stars = [];
let state = "face"; 
let timer = 0, msgIndex = 0;
let displayedText = "";
let glitchTimer = 0;

// cámara en transición
let camScale = 1.0, targetScale = 1.0; 
let camX = 0, camY = 0, targetX = 0, targetY = 0;

let message = `Decís que tus secretos son tuyos,
pero cada palabra que no compartís también deja huella.
el algoritmo interpreta lo que callás,
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
  faceapi = ml5.faceApi(video, faceOptions, () => faceapi.detect(gotFaces));

  textFont('Arial');
  textSize(36);
  fill(255,0,0);
  textAlign(LEFT,TOP);
  timer = millis();
}

function gotFaces(err, result){
  if(result) detections = result;
  if(state === "face") faceapi.detect(gotFaces);
}

function draw(){
  background(state === "face" ? 0 : 30);

  // transición cámara
  camScale = lerp(camScale, targetScale, 0.05);
  camX = lerp(camX, targetX, 0.05);
  camY = lerp(camY, targetY, 0.05);

  push();
  translate(camX, camY);
  scale(camScale);

  if(state === "face"){
    // cámara con detección de puntos
    image(video,0,0,width,height);
    drawFaceDetection();
  } else {
    // glitch de video por toda la pantalla
    drawFullScreenGlitch();
  }

  pop();

  // ESTRELLAS EN MODO TEXTO
  if(state === "text"){
    if(frameCount % 3 === 0) 
      stars.push({x:random(width), y:random(height), spikes:5, outer:25, inner:10});
    for(let s of stars) drawStar(s.x, s.y, s.spikes, s.outer, s.inner);
    if(stars.length > 400) stars.splice(0,stars.length-400);
  }

  // MODO FACE → cambiar a texto
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
    // texto tipo máquina de escribir, más grande y rápido
    textSize(42);
    fill(0);
    textAlign(LEFT,TOP);
    if(msgIndex < message.length && millis()-timer > 12){ // más rápido
      displayedText += message[msgIndex];
      msgIndex++;
      timer = millis();
    }
    text(displayedText,20,height*0.05,width*0.7,height*0.9);

    // glitch + CONFESIONARIO
    if(msgIndex >= message.length){
      if(millis()-timer > 2000){
        if(millis()-glitchTimer > 100){
          for(let i=0;i<10;i++) drawStar(random(width),random(height),5,25,10);
          glitchTimer=millis();
        }
        textAlign(CENTER,CENTER);
        textSize(48);
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

  // @estreiia_ fijo abajo
  textAlign(CENTER,BOTTOM);
  textSize(32);
  fill(255,0,0);
  text("@estreiia_", width/2, height-10);
}

// -------- DETECCIÓN DE ROSTRO --------
function drawFaceDetection(){
  for(let d of detections){
    if(d.landmarks){
      let pts = d.landmarks.positions;

      // puntos en rojo (sin invertir)
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
        ellipse(p._x, p._y, 8, 8); 
        text(`${nombre} (${int(p._x)},${int(p._y)})`, p._x+12, p._y);
      }
    }
  }
}

// -------- FUNCIONES AUXILIARES --------
function drawStar(cx,cy,spikes,outer,inner){
  let angle=TWO_PI/spikes, halfAngle=angle/2;
  beginShape();
  noFill();stroke(255,0,0);strokeWeight(2);
  for(let a=0;a<TWO_PI;a+=angle){
    let sx=cx+cos(a)*outer, sy=cy+sin(a)*outer; vertex(sx,sy);
    sx=cx+cos(a+halfAngle)*inner; sy=cy+sin(a+halfAngle)*inner; vertex(sx,sy);
  }
  endShape(CLOSE);
}

function drawFullScreenGlitch(){
  // duplicar la captura varias veces con desplazamientos y escalas aleatorias
  for(let i=0;i<5;i++){
    let dx = random(-50,50);
    let dy = random(-50,50);
    let sc = random(0.9,1.1);
    push();
    translate(dx,dy);
    scale(sc);
    tint(random(150,255), random(150,255), random(150,255), 150);
    image(video,0,0,width,height);
    pop();
  }
}

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
