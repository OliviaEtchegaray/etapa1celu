let video, faceapi, detections = [];
let state = "face"; 
let timer = 0, msgIndex = 0;
let displayedText = "";
let camX = 0, camY = 0, targetX = 0, targetY = 0;
let camScale = 1, targetScale = 1;
let showArrow = false;

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

  const faceOptions = { withLandmarks: true, withExpressions:false, withDescriptors:false };
  faceapi = ml5.faceApi(video, faceOptions, () => faceapi.detect(gotFaces));

  textFont('Arial');
  textSize(36);
  fill(255,0,0);
  textAlign(LEFT,TOP);
  timer = millis();
}

function gotFaces(err, result){
  if(result) detections = result;
  faceapi.detect(gotFaces);
}

function draw(){
  background(state==="text" ? 255 : 0);

  // transición cámara
  camScale = lerp(camScale,targetScale,0.05);
  camX = lerp(camX,targetX,0.05);
  camY = lerp(camY,targetY,0.05);

  push();
  translate(camX,camY);
  scale(camScale);
  image(video,0,0,width,height);
  if(state==="face") drawFaceDetection();
  pop();

  if(state==="face"){
    if(millis()-timer>3000){ // después de 3s desliza
      targetScale = 0.25;
      targetX = width*0.65;
      targetY = height*0.65;
      state="text";
      msgIndex = 0;
      displayedText="";
      timer = millis();
      showArrow = true;
    }
  }

  // modo texto
  if(state==="text"){
    textSize(40);
    fill(0);
    textAlign(LEFT,TOP);
    if(msgIndex < message.length && millis()-timer>15){
      displayedText += message[msgIndex];
      msgIndex++;
      timer = millis();
    }
    text(displayedText,20,height*0.05,width*0.7,height*0.9);

    // flecha para volver a cámara
    if(showArrow){
      fill(255,0,0);
      noStroke();
      triangle(width-60,height/2-20,width-20,height/2,width-60,height/2+20);
    }
  }

  // usuario abajo
  textAlign(CENTER,BOTTOM);
  textSize(24);
  fill(255,0,0);
  text("@estreiia_",width/2,height-10);
}

function drawFaceDetection(){
  for(let d of detections){
    if(d.landmarks){
      let pts = d.landmarks.positions;
      fill(0,0,0,0);
      stroke(255,0,0);
      strokeWeight(2);

      // zonas importantes
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
        rect(x1-10,y1-10,w,h);
      }
    }
  }
}

function mousePressed(){
  if(state==="text" && mouseX>width-80 && mouseX<width-10 && mouseY>height/2-30 && mouseY<height/2+30){
    // clic en flecha: volver a cámara
    state="face";
    targetScale = 1;
    targetX = 0;
    targetY = 0;
    showArrow = false;
    timer = millis();
  }
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);
}
