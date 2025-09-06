let video, faceapi, detections=[];
let stars=[];
let state="full"; // full, text, glitch, webcamFull
let timer=0, msgIndex=0;
let mobileAlertShown=false;
let isMobile=/Mobi|Android/i.test(navigator.userAgent);

let message=`Decís que tus secretos son tuyos,
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
pero lo íntimo se filtra en cada click,
en cada pausa antes de enviar un mensaje,
en la respiración frente a la cámara encendida.
¿Dónde termina lo privado
cuando lo humano se convierte en dato?
¿A quién le pertenece tu intimidad
cuando se traduce en patrones,
en predicciones,
en capital para una máquina que no olvida?`;

let displayedText="";

function setup(){
  createCanvas(windowWidth,windowHeight);
  if(!isMobile){
    background(255);
    fill(0);
    textSize(32);
    textAlign(CENTER,CENTER);
    text("Para vivir la experiencia completa, usá un dispositivo móvil",width/2,height/2);
    noLoop();
    return;
  }

  video=createCapture(VIDEO);
  video.size(windowWidth,windowHeight);
  video.hide();

  if(!mobileAlertShown){
    alert("Tocá la pantalla para activar cámara y ver tu silueta transformada.");
    mobileAlertShown=true;
  }

  const faceOptions={withLandmarks:true,withExpressions:true,withDescriptors:false};
  faceapi=ml5.faceApi(video,faceOptions,()=>faceapi.detect(gotFaces));

  textFont('Arial');
  textSize(24);
  textAlign(LEFT,TOP);
  timer=millis();
}

function gotFaces(err,result){
  if(result)detections=result;
  faceapi.detect(gotFaces);
}

function draw(){
  if(!isMobile) return;

  background(255);

  // generar estrellas
  if(frameCount%5===0) stars.push({x:random(width),y:random(height),spikes:5,outer:20,inner:8});
  for(let s of stars) drawStar(s.x,s.y,s.spikes,s.outer,s.inner);
  if(stars.length>300) stars.splice(0,stars.length-300);

  if(state==="full"){
    image(video,0,0,width,height);
    if(millis()-timer>5000){state="text";msgIndex=0;displayedText="";timer=millis();}
  }
  else if(state==="text"){
    // webcam esquina
    let w=width*0.25,h=height*0.25;
    image(video,width-w-20,20,w,h);

    // escribir mensaje tipo máquina
    if(msgIndex<message.length && millis()-timer>50){
      displayedText+=message[msgIndex];
      msgIndex++;
      timer=millis();
    }

    fill(0);textAlign(LEFT,TOP);text(displayedText,20,height*0.05,width*0.7,height*0.9);

    // glitch 2s después de terminar
    if(msgIndex>=message.length && millis()-timer>2000){
      state="glitch";
      timer=millis();
    }
  }
  else if(state==="glitch"){
    let w=width*0.25,h=height*0.25;
    image(video,width-w-20,20,w,h);
    // glitch al texto
    for(let i=0;i<50;i++) drawStar(random(width),random(height),5,25,10);
    fill(255,0,0);
    text(displayedText,20,height*0.05,width*0.7,height*0.9);
    if(millis()-timer>2000){state="webcamFull";timer=millis();}
  }
  else if(state==="webcamFull"){
    // webcam pantalla completa con estrella en rostro
    image(video,0,0,width,height);
    for(let d of detections){
      if(d.landmarks){
        let pts=d.landmarks.positions;
        let cx=(pts[30]._x+pts[27]._x)/2;
        let cy=(pts[30]._y+pts[27]._y)/2;
        drawStar(cx,cy,5,40,20);
      }
    }
    if(millis()-timer>3000){state="full";timer=millis();displayedText="";msgIndex=0;stars=[];}
  }

  // handle siempre abajo
  textAlign(CENTER,BOTTOM);
  fill(255,0,0);
  text("@estreiia_",width/2,height-10);
}

function drawStar(cx,cy,spikes,outer,inner){
  let angle=TWO_PI/spikes,halfAngle=angle/2;
  beginShape();
  noFill();
  stroke(255,0,0);
  strokeWeight(2);
  for(let a=0;a<TWO_PI;a+=angle){
    let sx=cx+cos(a)*outer;
    let sy=cy+sin(a)*outer;
    vertex(sx,sy);
    sx=cx+cos(a+halfAngle)*inner;
    sy=cy+sin(a+halfAngle)*inner;
    vertex(sx,sy);
  }
  endShape(CLOSE);
}

function mousePressed(){
  if(!isMobile) return;
  if(state==="full"){state="text";msgIndex=0;displayedText="";timer=millis();}
  else{state="full";timer=millis();displayedText="";msgIndex=0;}
}

function windowResized(){resizeCanvas(windowWidth,windowHeight);if(video) video.size(windowWidth,windowHeight);}
