const SAMPLE_FREQ = 44100 // sample frequency in Hz
const WINDOW_SIZE = 32768 // window size of the DFT in samples
const WINDOW_STEP = 16384 // step size of window
const WINDOW_T_LEN = WINDOW_SIZE / SAMPLE_FREQ // length of the window in seconds
const SAMPLE_T_LENGTH = 1 / SAMPLE_FREQ //length between two samples in seconds
const CONCERT_PITCH = 440;
const ALL_NOTES = ["A","A#","B","C","C#","D","D#","E","F","F#","G","G#"];

Number.prototype.mod = function(n) {
  return ((this%n)+n)%n;
};

var streamRunning = false;


document.getElementById("btn").addEventListener("click", () => {
  if(streamRunning){

    //set streamRunning to off
    streamRunning = false;
  }else{
    //start tuner app
    startTuner();
    //set streamRunning to on
    streamRunning = true;
  }
  var btnn = document.getElementById("btn");
  btnn.remove();
});

function startTuner(){
  "use strict";

  var input_data = [];
  // FFT(bufferSize, sampleRate)
  // var fft = new FFT(2048, 44100);
  // fft.forward(signal);
  // var spectrum = fft.spectrum;
  var fft = new FFT(32768, SAMPLE_FREQ);
  var max_freq=0;
  var closest_note = "";
  var closest_pitch = 440;
  var spectrum = [];
  var canvas = document.querySelector("#canCtxSimple");
  canvas.width = canvas.getBoundingClientRect().width;
  canvas.height = canvas.getBoundingClientRect().height;
  var canCtxSimple = canvas.getContext("2d");
  var WIDTH = canvas.width;
  var HEIGHT = canvas.height;
  canCtxSimple.fillStyle = '#000000';
  canCtxSimple.fillRect(0, 0, WIDTH, HEIGHT);

  async function soundAllowed(stream){
    streamRunning = true;
    window.persistAudioStream = stream;
    var audioContent = new AudioContext({sampleRate: SAMPLE_FREQ});
    var audioStream = audioContent.createMediaStreamSource(stream);

    //audioWorklet
    await audioContent.audioWorklet.addModule('/audioWorkletNode.js');
    const soundProcNode = new AudioWorkletNode(audioContent, 'sound-processor');

    audioStream.connect(soundProcNode);
    soundProcNode.connect(audioContent.destination);

    soundProcNode.port.onmessage = do_processing;
  }
  
  function do_processing(e){
    // console.log(e);
    input_data = input_data.concat(e.data);
    if ( input_data.length >= WINDOW_SIZE ) {
      fft.forward(input_data.slice(0,WINDOW_SIZE));
      spectrum = fft.spectrum;
      //suppress mains hum
      for(var ii =0;ii<(62/(SAMPLE_FREQ/WINDOW_SIZE));ii++){
        spectrum[ii] = 0;
      }
      
      const indexOfMaxValue = spectrum.indexOf(Math.max(...spectrum));
      max_freq = indexOfMaxValue * (SAMPLE_FREQ/WINDOW_SIZE);
      
      input_data = input_data.slice(WINDOW_STEP,input_data.length);

      var a = find_closest_note(max_freq);
      closest_note = a[0];
      closest_pitch = a[1];

      drawit();
    }
  }
  var drawit = function () {
    //Clear canvas
    canCtxSimple.fillStyle = '#000000';
    canCtxSimple.fillRect(0, 0, WIDTH, HEIGHT);
  
    // Draw pitch fraction
    canCtxSimple.lineWidth = 2;
    canCtxSimple.fillStyle = 'rgb(255, 255, 255)';
    canCtxSimple.strokeStyle = 'rgb(255, 255, 255)';
    canCtxSimple.font="32px century-gothic";
    canCtxSimple.textAlign = "center";
    canCtxSimple.fillText(Math.round(closest_pitch).toString()+"Hz" , 0.70*WIDTH, HEIGHT*0.5+28);
    canCtxSimple.beginPath();
      canCtxSimple.moveTo(0.65*WIDTH, 0.5*HEIGHT);
      canCtxSimple.lineTo(0.75*WIDTH, 0.5*HEIGHT);
    canCtxSimple.stroke();
    canCtxSimple.fillText(Math.round(max_freq).toString()+"Hz", 0.70*WIDTH, HEIGHT*0.5-25);
  
    //Draw circle with note
    canCtxSimple.lineWidth = 6;
    canCtxSimple.strokeStyle = '#ffffff';
    canCtxSimple.beginPath();
    canCtxSimple.arc(0.50*WIDTH, 0.5*HEIGHT, 115, 0, 2 * Math.PI, false);
    canCtxSimple.fillStyle = (Math.round(closest_pitch) == Math.round(max_freq) ? 'green' : '#ff0a0a');
    canCtxSimple.fill();
    canCtxSimple.stroke();
  
    //Draw arrows
    canCtxSimple.strokeStyle = '#ff0a0a';
    canCtxSimple.lineWidth = 8;
    //Upper arrow
    if (Math.round(closest_pitch) < Math.round(max_freq)) {
      canCtxSimple.beginPath();
      canCtxSimple.moveTo(0.45*WIDTH, 0.2*HEIGHT);
      canCtxSimple.lineTo(0.5*WIDTH, 0.13*HEIGHT);
      canCtxSimple.lineTo(0.55*WIDTH, 0.2*HEIGHT);
      canCtxSimple.stroke();
    }
    //Lower arrow
    if (Math.round(closest_pitch) > Math.round(max_freq)) {
      canCtxSimple.beginPath();
      canCtxSimple.moveTo(0.45*WIDTH, 0.8*HEIGHT);
      canCtxSimple.lineTo(0.5*WIDTH, 0.87*HEIGHT);
      canCtxSimple.lineTo(0.55*WIDTH, 0.8*HEIGHT);
      canCtxSimple.stroke();
    }
  
    //Draw note
    canCtxSimple.textBaseline = "middle";
    canCtxSimple.fillStyle = 'rgb(255, 255, 255)';
    canCtxSimple.font="55px century-gothic";
    canCtxSimple.textAlign = "center";
    canCtxSimple.fillText(closest_note.toString(), 0.5*WIDTH, HEIGHT*0.5);
  
    //Draw Mini spectrum
  //   var miniSpecRelY = 0.65;
  //   var miniSpecRelX = 0.65;
  //   var miniSpecRelWidth = 0.3;
  //   canCtxSimple.strokeStyle = 'rgb(255, 255, 255)';
  //   canCtxSimple.beginPath();
  //   canCtxSimple.lineWidth = 1;
  //   canCtxSimple.moveTo(miniSpecRelX*WIDTH, HEIGHT*miniSpecRelY);
  //   canCtxSimple.lineTo((miniSpecRelX+miniSpecRelWidth)*WIDTH, HEIGHT*miniSpecRelY);
  //   canCtxSimple.stroke();
  //   canCtxSimple.beginPath();
  //   //(48000/32768)
  //   var sliceWidth = WIDTH * (miniSpecRelWidth) / 3000;
  //   var x = WIDTH*miniSpecRelX;
  
  //   let maxValHPS = Math.max(...spectrum);
  //   for (let j=0; j < spectrum.length; j++) {
  //     spectrum[j] /= maxValHPS;
  //   }
  
  //   for(var i = 0; i < 3000; i++) {
  //     var v = spectrum[i]*0.7;
  //     var y = HEIGHT - (v * HEIGHT/2) - HEIGHT*(1-miniSpecRelY);
  //     if(i === 0) {
  //       canCtxSimple.moveTo(x, y);
  //     } else {
  //       canCtxSimple.lineTo(x, y);
  //     }
  //     x += sliceWidth;
  //   }
  //   canCtxSimple.stroke();
  }

  async function soundNotAllowed(e){
    console.log(e)
  }


  navigator.getUserMedia = (navigator.getUserMedia
    || navigator.mozGetUserMedia
    || navigator.webkitGetUserMedia
    || navigator.msGetUserMedia);
  navigator.mediaDevices.getUserMedia({audio:true})
  .then(function(stream) {
    /* use the stream */
    soundAllowed(stream);
  })
  .catch(function(err) {
    /* handle the error */
    soundNotAllowed(stream);
  });
}

function find_closest_note(pitch){
  const i = Math.round( Math.log2( pitch/CONCERT_PITCH ) * 12);
  let closest_note = ALL_NOTES[i.mod(12)] + (4 + Math.sign(i) * parseInt( (9+Math.abs(i))/12 ) ).toString();
  let closest_pitch = CONCERT_PITCH*2**(i/12);
  return [closest_note, closest_pitch];
}
