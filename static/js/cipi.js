
var mic, recorder, soundfile;
var avglvl = [];
var nv,pnv;
var startmillis;
var spectrum;
var spectogram = [];
var spec_width = 1024;
var spec_height = 1024;
var pg;
var cc = 1;
var continous = false;
var interim = false;
let speak;
var hwlength = 500; //panjang hotword.
//var url = 'http://localhost:5000/reply';
//var tenor = 'http://localhost:5000/tenor';
var key = '&k=M59QNHFYGEQQ';
var query = '&q=';
var result;
var listening;
var speaking;
const emo_regex = /(<emo="[a-z\s\D]*">)/gm;
var gifme;
var sit;
let poseNet;
let poses = [];

function setup() {
    createCanvas(100,100).parent('canvascontainer');

    mic = new p5.AudioIn();
    mic.start();
    amp = new p5.Amplitude();
    pixelDensity(1);
    recorder = new p5.SoundRecorder();
    recorder.setInput(mic);
    soundfile = new p5.SoundFile();
    
    fft = new p5.FFT();
    fft.setInput(mic);

    spechR = new p5.SpeechRec('id-ID',speechRecogCB);
    speak = new p5.Speech();
    speak.setLang("id-ID");
    speak.setPitch(0.62);
    speak.setRate(0.86);

    // button1 = createButton('Record').parent('buttons');
    // button1.mousePressed(startRecord);

    // button2 = createButton('Stop').parent('buttons');
    // button2.mousePressed(stopRecord);

    // button3 = createButton('Play').parent('buttons');
    // button3.mousePressed(playRecord);

    // button4 = createButton('Speech').parent('buttons');
    // button4.mousePressed(goStartRecognize);

    // button5 = createButton('Ngomong').parent('buttons');
    // button5.mousePressed(goSpeak);

    // button6 = createButton('postdata').parent('buttons');
    // button6.mousePressed(getReply)
    pg = createImage(256,256);


    video = createCapture(VIDEO);
    //video.size(width, height);


    // Create a new poseNet method with a single detection
    poseNet = ml5.poseNet(video, modelReady);
    // This sets up an event that fills the global variable "poses"
    // with an array every time new poses are detected
    poseNet.on('pose', function(results) {
    poses = results;
    });    
    video.hide();
}

function modelReady() {
    select('#status').html('Model Loaded');
  }

let stateCheck = setInterval(() => {
    if (document.readyState === 'complete') {
        clearInterval(stateCheck);
        getReplyCMD("intro");
    }
}, 100);

function getResult(result){
    //parsing reply to get EMO tag.
    window.replyresult = result;
    var str = result.reply;
    console.log(str);
    var rslt = emo_regex.exec(str);
    if (rslt) {
        str = str.replace(rslt[0],"");
        rslt = rslt[0];
        rslt = rslt.split("\"")[1];
        getTenor(rslt);
    }
    emo_regex.exec("");  //reset regex
    console.log(str);
    select("#reply").html(str);
    goSpeak(str);
}

function displayGIF(result) {
    window.clearInterval(sit);
    console.log(result);
    window.datagif = result;
    var pick = Math.floor(Math.random() * 20);  
    console.log(pick);
    select("#emo").html("");
    var gifme = createImg(window.datagif.results[pick].media[0].gif.url).parent("#emo");
    var sit = window.setTimeout(function () {select("#emo").html("");} ,8000);
}

function getTenor(pic) {
    postData = { key: 'M59QNHFYGEQQ' , query: pic };
    console.log('postdata:',postData);
    httpPost(tenor,'json',postData,displayGIF,funcError);
}

function funcError(){
    console.log("Error retrieving chat.")
}

function getReplyCMD(pesan) {
    postData = { message: pesan, username: "irzaip"};
    httpPost(url, 'json', postData, getResult, funcError);
}

function getReply() {
    var pesan = select('#transcribe').html().toLowerCase();
    postData = { message: pesan, username: "irzaip"};
    httpPost(url, 'json', postData, getResult, funcError);
}

function goSpeak(spk) {
    speaking = true;
    speak.onEnd = function () { speaking=false; }
    speak.speak(spk);
}

function goStartRecognize(){
    if (!listening) {
        try {
            spechR.start(continous, interim);
            select("#status").html("Recognizing..");
        }
        catch(err) {
            null;
        }
    }
}

function speechRecogCB() {
    if (spechR.resultValue) {
        var recog = spechR.resultString;
        select("#transcribe").html(recog.toLowerCase());
        select('#status').html('Listening...');
        getReply();
        listening = false;
    }
}

function draw(){
    background(255);
    fill(255,0,255);
    vol = mic.getLevel();

    if (pg) {
        imageMode(CENTER);
        image(pg,0,0,256,256,0,0,256,256);
        filename = 'blo'+cc+'.bmp';
    }        

    translate(50,50);
    push();
    bal = fft.g;
    diam = map(vol, 0, 0.3, 10, 200);
    ellipse(0, 0, diam, diam);
    pop();

    if (select('#status').html() === 'Listening...') {
        fill(55,0,55);
    }
    else {
        fill(0,200,0)
    }
    
    ellipse(0,0, nv, nv)

    
    translate(-45,-50)
    push()
    //FFT GRAPH
    var spectrum = fft.analyze(256);
    // noStroke();
    // fill(0,255,0); // spectrum is green
    // for (var i = 0; i< spectrum.length; i++){
    // var x = map(i, 0, spectrum.length, 0, width);
    // var h = -height + map(spectrum[i], 0, 255, height, 0);
    // rect(x, height, width / spectrum.length, h );}

    if (recorder.recording) {
        spectogram.push(spectrum);
    }

    //GRAFIK untuk waveform
    var waveform = fft.waveform();
    noFill();
    beginShape();
    stroke(255,0,0); // waveform is red
    strokeWeight(1);
    for (var i = 0; i< waveform.length; i++){
        var x = map(i, 0, waveform.length, 0, width * 2);
        var y = map( waveform[i], -1, 1, 0, height);
        vertex(x,y);
    }
    endShape();

    pop();

    //Deteksi perubahan energy.
    nv = fft.getEnergy(400,2600);
    if (nv - pnv > 3 & !listening & !speaking) { 
        //startRecord(); 
        goStartRecognize();
    }
    pnv = nv;

    //matikan recorder setelah hwlength
    if (recorder.recording & millis() - startmillis > hwlength) { 
        //stopRecord(); 
        drawspec(spectogram);    
    }
    drawpose();
    //if (poses) { console.log(poses);};
// this is POSENET-
}


function drawpose() {
    //imageMode(CORNER);
    //image(video, 0, 0, width, height);

    // We can call both functions to draw all keypoints and the skeletons
    drawKeypoints();
    //drawSkeleton();
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        let pose = poses[i].pose;
        for (let j = 0; j < pose.keypoints.length; j++) {
        // A keypoint is an object describing a body part (like rightArm or leftShoulder)
        let keypoint = pose.keypoints[j];
        // Only draw an ellipse is the pose probability is bigger than 0.2
        if (poses[0].pose.keypoints[0].score > 0.2) {
            console.log("nose detected");
        }
        }
    }
}
  

function drawspec(spectogram) {
    imageMode(CORNERS);
    pg.loadPixels();
    for (var y=0; y < spectogram.length; y++){
        if (y < spectogram.length) { var draw_spec = spectogram[y] }
        for (var x=0; x < 256; x++){
            pg.set(y,x,color(draw_spec[x],draw_spec[x]))
        }
    }
    pg.updatePixels();
    console.log(pg)
}

function startRecord() {
    startmillis = millis();
    if (!recorder.recording & !soundfile.isPlaying()) {
        recorder.record(soundfile);
        console.log("Recording...");
        select("#status").html("Recording bro...");
    }
}

function stopRecord(){
    if (recorder.recording) {
        recorder.stop();
        console.log("Stopping..");
        select("#status").html("Listening...");
        //playRecord();
    }
}

function playRecord() {
    if (!recorder.recording) {
        soundfile.playMode('restart');
        soundfile.play();
        console.log("Playing...");
    }
}

