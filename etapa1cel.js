let video, faceapi, detections=[];
let stars=[];
let state="full";
let timer=0, glitchTimer=0, msgIndex=0;
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
pero lo íntimo se filtra en cada clic,
en cada pausa antes de enviar un mensaje,
en la respiración frente a la cámara encendida.
¿Dónde termina lo privado
cuando lo humano se convierte en dato?
¿A quién le pertenece tu intimidad
cuando se traduce en patrones,
en predicciones,
en capital para una máquina que no olvida?`;

let displayedText="";
let mobileAlertShown=false;
let isMobile=/Mobi|Android/i.test(navigator.userAgent);

function setup(){
  createCanvas(windowWidth,windowHeight);
  video=createCapture(VIDEO);
  video.size(windowWidth,windowHeight);
  video.hide();

  if(!mobileAlertShown){
    alert("Tocá la pantalla para activar cámara y ver tu silueta.");
    mobileAlertShown=true;
  }

  const faceOptions={withLandmarks:true,withExpressions:true,withDescriptors:false};
  faceapi=ml5.faceApi(video,faceOptions,()=>faceapi.detect(gotFaces));

  textFont('Arial');
  textSize(32);
  fill(0);
  textAlign(LEFT,TOP);
  timer=millis();
}

function gotFaces(err,result){
  if(result)detections=result;
  faceapi.detect(gotFaces); // detección constante
}

function draw(){
  background(255);

  // generar estrellas de fondo
  if(frameCount%5===0) stars.push({x:random(width),y:random(height),spikes:5,outer:20,inner:8});
  for(let s of stars) drawStar(s.x,s.y,s.spikes,s.outer,s.inner);
  if(stars.length>300) stars.splice(0,stars.length-300);

  if(state==="full"){
    image(video,0,0,width,height);
    if(millis()-glitchTimer>1500){for(let i=0;i<3;i++) drawStar(random(width),random(height),5,25,10); glitchTimer=millis()}
    if(millis()-timer>5000){state="text"; msgIndex=0; displayedText=""; timer=millis();}
  } 
  else if(state==="text"){
    let w=width*0.25,h=height*0.25;
    image(video,width-w-20,20,w,h);

    // escribir más rápido y más grande
    if(msgIndex<message.length && millis()-timer>25){
      displayedText+=message[msgIndex];
      msgIndex++;
      timer=millis();
    }

    fill(0); textSize(32);
    textAlign(LEFT,TOP);
    text(displayedText,20,height*0.05,width*0.7,height*0.9);

    if(msgIndex>=message.length && millis()-timer>15000){
      for(let i=0;i<50;i++){drawStar(random(width),random(height),5,25,10)}
      fill(255,0,0);
      text(displayedText,20,height*0.05,width*0.7,height*0.9);
      if(millis()-timer>16000){state="full"; timer=millis(); displayedText=""; msgIndex=0; stars=[];}
    }
  }

  // estrella en rostro constante
  for(let d of detections){
    if(d.landmarks){
      let pts=d.landmarks.positions;
      let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
      for(let p of pts){if(p._x<minX) minX=p._x;if(p._x>maxX) maxX=p._x;if(p._y<minY) minY=p._y;if(p._y>maxY) maxY=p._y;}
      let cx=(minX+maxX)/2, cy=(minY+maxY)/2;
      let w=maxX-minX, h=maxY-minY;
      drawStar(cx,cy,5,w*0.6,h*0.6); // estrella tipo filtro rostro
      noStroke(); fill(255,0,0); textSize(24);
      textAlign(LEFT);
      text(`Sonrisa:${nf(d.expressions.happy,1,2)} Tristeza:${nf(d.expressions.sad,1,2)} Enojo:${nf(d.expressions.angry,1,2)}`,20,height-60);
    }
  }

  // handle siempre abajo
  textAlign(CENTER,BOTTOM);
  fill(255,0,0);
  text("@estreiia_",width/2,height-10);
}

function drawStar(cx,cy,spikes,outer,inner){
  let angle=TWO_PI/spikes,halfAngle=angle/2;
  beginShape(); noFill(); stroke(255,0,0); strokeWeight(2);
  for(let a=0;a<TWO_PI;a+=angle){
    let sx=cx+cos(a)*outer; let sy=cy+sin(a)*outer; vertex(sx,sy);
    sx=cx+cos(a+halfAngle)*inner; sy=cy+sin(a+halfAngle)*inner; vertex(sx,sy);
  }
  endShape(CLOSE);
}

function mousePressed(){
  if(state==="full"){state="text"; msgIndex=0; displayedText=""; timer=millis();}
  else if(state==="text"){state="full"; timer=millis(); displayedText=""; msgIndex=0;}
}

function windowResized(){resizeCanvas(windowWidth,windowHeight); video.size(windowWidth,windowHeight);}
