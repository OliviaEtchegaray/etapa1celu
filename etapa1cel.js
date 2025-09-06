let video,poseNet,poses=[],smoothPoses=[],glitchTimer=0,mobileAlertShown=false,isMobile=/Mobi|Android/i.test(navigator.userAgent);

function setup(){
  createCanvas(windowWidth,windowHeight);
  video=createCapture(VIDEO);
  video.size(windowWidth,windowHeight);
  video.hide();
  if(isMobile&&!mobileAlertShown){alert("Tocá la pantalla para activar la cámara y ver tu silueta transformada.");mobileAlertShown=true}
  poseNet=ml5.poseNet(video);
  poseNet.on('pose',(results)=>{poses=results;if(smoothPoses.length===0&&poses.length>0){for(let i=0;i<poses.length;i++){smoothPoses.push(poses[i].pose.keypoints.map(kp=>({x:kp.position.x,y:kp.position.y})))}}});
  textFont('Arial');textSize(16);fill(255,0,0);
}

function draw(){
  background(0,50);
  push();translate(width,0);scale(-1,1);
  tint(255,50);image(video,0,0,width,height);
  const partes=['nose','leftShoulder','rightShoulder','leftWrist','rightWrist','leftHip','rightHip','leftAnkle','rightAnkle'];
  for(let i=0;i<poses.length;i++){
    let pose=poses[i].pose;
    if(!smoothPoses[i]){smoothPoses[i]=pose.keypoints.map(kp=>({x:kp.position.x,y:kp.position.y}))}
    for(let j=0;j<pose.keypoints.length;j++){
      let kp=pose.keypoints[j];if(!partes.includes(kp.part))continue;
      smoothPoses[i][j].x=lerp(smoothPoses[i][j].x,kp.position.x,0.4);
      smoothPoses[i][j].y=lerp(smoothPoses[i][j].y,kp.position.y,0.4);
      if(kp.score>0.2){
        fill(255,0,0);noStroke();ellipse(smoothPoses[i][j].x,smoothPoses[i][j].y,12,12);
        push();scale(-1,1);text(`${traducirParte(kp.part)} (${Math.floor(smoothPoses[i][j].x)},${Math.floor(smoothPoses[i][j].y)})`,-smoothPoses[i][j].x-5,smoothPoses[i][j].y-5);pop();
      }
    }
    stroke(255,0,0);strokeWeight(2);
    const lines=[['nose','leftShoulder'],['nose','rightShoulder'],['leftShoulder','leftWrist'],['rightShoulder','rightWrist'],['leftHip','leftAnkle'],['rightHip','rightAnkle']];
    for(let [aName,bName] of lines){
      let a=pose.keypoints.findIndex(kp=>kp.part===aName);
      let b=pose.keypoints.findIndex(kp=>kp.part===bName);
      if(pose.keypoints[a].score>0.2&&pose.keypoints[b].score>0.2){line(smoothPoses[i][a].x,smoothPoses[i][a].y,smoothPoses[i][b].x,smoothPoses[i][b].y)}
    }
  }
  if(millis()-glitchTimer>1500){for(let k=0;k<5;k++){drawStar(random(width),random(height),5,30,12)}glitchTimer=millis()}
  if(isMobile){textSize(32);fill(255,0,0);textAlign(RIGHT,BOTTOM);scale(-1,1);text("@estreiia_",-10,height-10)}
  pop();
}

function drawStar(cx,cy,spikes,outer,inner){
  let angle=TWO_PI/spikes;
  let halfAngle=angle/2;beginShape();noFill();stroke(255,0,0);strokeWeight(2);
  for(let a=0;a<TWO_PI;a+=angle){let sx=cx+cos(a)*outer;let sy=cy+sin(a)*outer;vertex(sx,sy);sx=cx+cos(a+halfAngle)*inner;sy=cy+sin(a+halfAngle)*inner;vertex(sx,sy)}endShape(CLOSE);
}

function traducirParte(parte){switch(parte){case'nose':return'Cabeza';case'leftShoulder':return'Brazo Izquierdo';case'rightShoulder':return'Brazo Derecho';case'leftWrist':return'Mano Izquierda';case'rightWrist':return'Mano Derecha';case'leftHip':return'Pierna Izquierda';case'rightHip':return'Pierna Derecha';case'leftAnkle':return'Pie Izquierdo';case'rightAnkle':return'Pie Derecho';default:return parte}}

function windowResized(){resizeCanvas(windowWidth,windowHeight);video.size(windowWidth,windowHeight)}
