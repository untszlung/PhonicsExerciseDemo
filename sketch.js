wordlist = [

  ['BOG', ['b', 'o', 'g']],
  ['DAG', ['d', 'a', 'g']],
  ['BAD', ['b', 'a', 'd']],
  ['DOG', ['d', 'o', 'g']],
  ['POT', ['p', 'o', 't']],
  ['SHARE', ['sh', 'air']],
  ['DISH', ['d', 'i', 'sh']],
  ['SHIP', ['sh', 'i', 'p']],
  ['SHEEP', ['sh', 'ee', 'p']],
   ['SHUT', ['sh', 'u', 't']],
  ['SUN', ['s', 'u', 'n']],
  ['BUS', ['b', 'u', 's']]
];

// 3 speakers training data
//const URL = "https://teachablemachine.withgoogle.com/models/E1cMzu4nQ/";

//miss lam data
const URL = "https://teachablemachine.withgoogle.com/models/RhDcUFCz3/";

let recognizer;
let classLabels;
let IsRecongnizing = false;
let accuminatedPhonicsResults = [];
let phonciesResultCount = 1;

let result_history = "";
let PreviewPhonicsResult = '';

let sortedTop3TempPhonicsResults = '';
let sortTopPhonicsResultList = [];


let sortTopPhonicsResults = "";
let sortPhonicsResults = "";

let isShowDigestedResults;
let isShowRawResults;

let currentWordIndex = 0;
let isCurrentWordFinish = true;

let phonemeIndex = 0;



  let minPhnoicsRecognitionIteration = 1
  let overlapFactor =0.9;
let maxTopKPhonicsResult =6;

async function createModel() {
  const checkpointURL = URL + "model.json"; // model topology
  const metadataURL = URL + "metadata.json"; // model metadata

  console.log('model loading');
  sortTopPhonicsResults = 'phonics model loading ...';
  
  const recognizer = speechCommands.create(
    "BROWSER_FFT", // fourier transform type, not useful to change
    undefined, // speech commands vocabulary feature, not useful for your models
    checkpointURL,
    metadataURL);

 // console.log("model loaded");
  // check that model and metadata are loaded via HTTPS requests.
  await recognizer.ensureModelLoaded();

  return recognizer;
}

async function init() {
  recognizer = await createModel();
  classLabels = recognizer.wordLabels(); // get class labels
  //console.log(recognizer.modelInputShape());



  // listen() takes two arguments:
  // 1. A callback function that is invoked anytime a word is recognized.
  // 2. A configuration object with adjustable fields
  startListening();
  console.log('start listening');
   sortTopPhonicsResults = 'start listening ...';
  // Stop the recognition in 5 seconds.
  // setTimeout(() => recognizer.stopListening(), 5000);
}


function startListening() {
  recognizer.listen(result => {
    //const scores = result.scores; // probability of prediction for each class
    // render the probability scores per class

    let myMap = [];


    //Sort the recognized result
    for (let i = 0; i < classLabels.length; i++) {
      const classPrediction = classLabels[i] + ": " + result.scores[i].toFixed(2);


      myMap.push([classLabels[i], result.scores[i].toFixed(2) * 100]);
    }
    const phonicsResults = myMap.sort((a, b) => b[1] - a[1]);



    let label = '[';
    for (let i = 0; i < 3; i++) {
      label = label + `${phonicsResults[i][0]}(${phonicsResults[i][1].toFixed(0)})%, `;
      if ((phonicsResults[0][0] != 'Background Noise') && (phonicsResults[0][0] != 'unknown')) {



        accuminatedPhonicsResults.push([phonicsResults[i][0], phonicsResults[i][1].toFixed(0)]);
        //console.log('accuminatedPhonicsResults: ' + accuminatedPhonicsResults);

        //console.log(i + ': ' + refinedPhonicsResultsMap);
      }
    }
    label = label + ']';



    if ((phonicsResults[0][0] != 'Background Noise') && (phonicsResults[0][0] != 'unknown')) {
      result_history = result_history + label + ',';

    }


    // check ending point of the utterance
    if (IsRecongnizing == false) {
      if ((PreviewPhonicsResult == 'Background Noise') && (phonicsResults[0][0] != 'Background Noise')) {
        IsRecongnizing = true;
      }

    } else {
      if (phonicsResults[0][0] == 'Background Noise') {
        if (result_history != '') {

          //console.log('accuminatedPhonicsResults.length: ' + accuminatedPhonicsResults.length / 3);
          //if(accuminatedPhonicsResults.length >= phonicsResultsSamplingWindowSize * 3){
          //let countPhonicsResultList = [];

          let sortPhonicsResultList = [];
          sortTopPhonicsResultList = [];

          //sorted the phonics result
          sortPhonicsResultList = sortPhonicsResult(accuminatedPhonicsResults, accuminatedPhonicsResults.length / 3);
          //console.log(`sortPhonicsResultList: ${sortPhonicsResultList}`);
          sortPhonicsResults = "";

          //console.log('sortPhonicsResultList.length: ' + sortPhonicsResultList.length);

          
          

          
          for (let i = 0; i < sortPhonicsResultList.length; i++) {
            if ((sortPhonicsResultList[i][2] >= 1) && ((sortPhonicsResultList[i][0] != 'Background Noise') && (sortPhonicsResultList[i][0] != 'unknown'))) {
              // sortPhonicsResults = sortPhonicsResults + `${sortPhonicsResultList[i][0]}(${sortPhonicsResultList[i][1]}%)(${sortPhonicsResultList[i][2]}), `;
              sortTopPhonicsResultList.push([sortPhonicsResultList[i][0], sortPhonicsResultList[i][1], sortPhonicsResultList[i][2]]);
            }
          }

          sortTopPhonicsResultList = sortTopPhonicsResultList.sort((a, b) => b[1] - a[1]);

          //show finalize result, 
          sortTopPhonicsResults = "";
          let maxTopKPhonicsResultCount = 0;
          if (sortTopPhonicsResultList.length > maxTopKPhonicsResult) {
            maxTopKPhonicsResultCount = maxTopKPhonicsResult;
          } else {
            maxTopKPhonicsResultCount = sortTopPhonicsResultList.length;
          }
          for (let i = 0; i < maxTopKPhonicsResultCount; i++) {
            //if (sortTopPhonicsResultList[i][2] >= 3){
            sortTopPhonicsResults = sortTopPhonicsResults + `${sortTopPhonicsResultList[i][0]}(${sortTopPhonicsResultList[i][1]}%)(${sortTopPhonicsResultList[i][2]}),   `;

            //}
          }


          if (maxTopKPhonicsResultCount > 0) {
           
             console.log(`${phonciesResultCount}. sortTopPhonicsResults:  ${sortTopPhonicsResults}`)
             sortTopPhonicsResults = `${phonciesResultCount}. ${sortTopPhonicsResults}`;
            phonciesResultCount++;
           
      
          }


          //     if (document.getElementById("digestedResults").checked == true) {

          //show a results by counting and sorting of recognized phonics
          for (let i = 0; i < sortPhonicsResultList.length; i++) {
            sortPhonicsResults = sortPhonicsResults + `${sortPhonicsResultList[i][0]}(${sortPhonicsResultList[i][1]}%)(${sortPhonicsResultList[i][2]}), `;
          }
          console.log(`--sortPhonicsResults: ${sortPhonicsResults}`);
         
      
          //console.log("result history:" + result_history);
        

          result_history = '';
          IsRecongnizing = false;

          accuminatedPhonicsResults = [];
        }


      }

    }

    PreviewPhonicsResult = phonicsResults[0][0];
   
  }, {
    includeSpectrogram: true, // in case listen should return result.spectrogram
    probabilityThreshold: 0.10,
    invokeCallbackOnNoiseAndUnknown: false,
    overlapFactor: `${overlapFactor}` // probably want between 0.5 and 0.75. More info in README
  });

}

function stopListening() {
  recognizer.stopListening();
}

function sortPhonicsResult(InputPhonicsResults, phonicsResultsSamplingWindowSize) {
  // sample the phoncis results by sliding windows
  // let phonicsResultsSamplingWindowSize = 1;
  let accuminatedPhonicsResultThershold = 3;
  let offset = 0;
  let tempphonicsResultsCount = 1;
  let OutputPhonicsResult = [];

  if (InputPhonicsResults.length >= phonicsResultsSamplingWindowSize * 3) {
    //count all recongized phonics result by sliding windows
    for (let j = 0; j <= ((InputPhonicsResults.length - phonicsResultsSamplingWindowSize * 3)); j = j + 3) {
      //let countPhonicsResultList = [];
      let tempphonicsResults = [];
      for (let k = 0; k < phonicsResultsSamplingWindowSize * 3; k++) {
        let isResultExist = false;

        // count the recongized phonices result
        for (let i = 0; i < tempphonicsResults.length; i++) {


          //if the result already exist , compare and update highet confident score
          if (tempphonicsResults[i][0] == InputPhonicsResults[k + offset][0]) {
            //console.log(`-${tempphonicsResults[i][0]}${tempphonicsResults[i][1]}   == ${InputPhonicsResults[k+offset][0]}${InputPhonicsResults[k+offset][1]} k:${k} offset:${offset} tempphonicsResults: ${tempphonicsResults}`);  
            if (InputPhonicsResults[k + offset][1] - tempphonicsResults[i][1] > 0) {

              //console.log(`--${tempphonicsResults[i][0]}${tempphonicsResults[i][1]}   == ${InputPhonicsResults[k+offset][0]}${InputPhonicsResults[k+offset][1]} k:${k} offset:${offset} tempphonicsResults: ${tempphonicsResults}`);         
              tempphonicsResults[i][1] = InputPhonicsResults[k + offset][1];

            }
            tempphonicsResults[i][2]++;
            isResultExist = true;
            break;

          }
        }

        //add to a phonics result if it doesn't exist
        if (isResultExist == false) {
          // console.log(`InputPhonicsResults[k+offset][0]:${InputPhonicsResults[k+offset][0]} k:${k} offset:${offset}`);

          tempphonicsResults.push([InputPhonicsResults[k + offset][0], InputPhonicsResults[k + offset][1], 1]);
        }
      }

      //sort the count of phonics result
      const sortedTempPhonicsResults = tempphonicsResults.sort((a, b) => b[2] - a[2]);

      OutputPhonicsResult = sortedTempPhonicsResults;
       sortedTop3TempPhonicsResults = '';

      //Get the top 3 confident score result
      for (let m = 0; m < 3; m++) {
        sortedTop3TempPhonicsResults = sortedTop3TempPhonicsResults + `${sortedTempPhonicsResults[m][0]}(${sortedTempPhonicsResults[m][1]}%)(${sortedTempPhonicsResults[m][2]}), `;
      }
     // console.log(`${tempphonicsResultsCount}. ${sortedTop3TempPhonicsResults}`);
      tempphonicsResultsCount++;
      offset = offset + 3;
    }
  }

  //console.log(`OutputPhonicsResult.length: ${OutputPhonicsResult.length}`);
  return OutputPhonicsResult;
}

function setup() {
  //Initialise the recognizer
  init();

  createCanvas(windowWidth, windowHeight-100);


  checkbox = createCheckbox('Mic ON/OFF', true);
  checkbox.changed(micONOFF);

  checkbox1 = createCheckbox('Digested Results', false);
  checkbox1.changed(showDigestedResults);
  isShowDigestedResults = false;

  checkbox2 = createCheckbox('Raw Results', false);
  checkbox2.changed(showRawResults);
  isShowRawResults = false;
  
  nextWordbutton = createButton('Next word');
  nextWordbutton.position(windowWidth-100, windowHeight-80);
  nextWordbutton.mousePressed(changeNextWord);
}

function changeNextWord(){
    if(1<wordlist.length-currentWordIndex){
             currentWordIndex++;
             phonemeIndex=0;
          }
          else{
            currentWordIndex=0;
            phonemeIndex=0;
          }
}

function micONOFF() {
  if (this.checked()) {
    console.log('mic on');
    startListening();
  } else {
    console.log('mic off');
    stopListening();
  }
}

function showDigestedResults() {
  if (this.checked()) {
    isShowDigestedResults = true;
    console.log('enable digested results');
    
  } else {
    isShowDigestedResults = false;
    console.log('disable digested results');
  }
}

function showRawResults() {
  if (this.checked()) {
    isShowRawResults = true;
    console.log('enable digested results');
    
  } else {
    isShowRawResults = false;
    console.log('disable digested results');
  }
}

function draw() {
  background(255);


  

  var red = [255, 0, 0];
  var black = [0,0,0];
 
  


  
  if(isCurrentWordFinish == true){

    //match the recoginzed result
  
    for (let i=0;i<sortTopPhonicsResultList.length;i++){
      if (sortTopPhonicsResultList[i][0] == wordlist[currentWordIndex][1][phonemeIndex]){
        console.log(`sortTopPhonicsResultList[${i}][0] = ${sortTopPhonicsResultList[i][0]} wordlist[${currentWordIndex}][1][${phonemeIndex}]=${wordlist[currentWordIndex][1][phonemeIndex]}`);
      
        phonemeIndex++;
        break;
       
      }
    }
  }
  
  //
  textSize(80);
 
    var pos_x = (width - textWidth(wordlist[currentWordIndex][0]))/2;

    fill( black );
  text(wordlist[currentWordIndex][0], pos_x, 100);

  
  
  textSize(40);

  push();
  let wordPhonincs = '';
  for (let i = 0; i < wordlist[currentWordIndex][1].length; i++) {
    wordPhonincs = wordPhonincs + `{${wordlist[currentWordIndex][1][i]}}`;
    if (wordlist[currentWordIndex][1].length != i + 1) {
      wordPhonincs = wordPhonincs + ' ';
    }
  }
 
  var pos_x = (width - textWidth(wordPhonincs))/2;
  for (let i = 0; i < wordlist[currentWordIndex][1].length; i++) {
    
  
     var w = textWidth(`{${wordlist[currentWordIndex][1][i]}} `);
          if (i!=phonemeIndex){
          fill( black );
          
      }else{
          fill( red );
      }
      
     text( `{${wordlist[currentWordIndex][1][i]}}`, pos_x, 150);
    pos_x += w;
  }
  pop();
   
  //pos_x = (width - textWidth(wordPhonincs))/2;
  //text(wordPhonincs, pos_x, 150);
  
  push();
  textAlign(CENTER);
  textSize(20);

  text(sortTopPhonicsResults, 10, 190, width-20);
  
  textSize(12);

  if (isShowDigestedResults == true){
    if(sortPhonicsResults != ''){
      text('<disgested results>', 10, 250, width-20);
      text(sortPhonicsResults, 10, 265, width-20);
    }
  }
  
  if (isShowRawResults == true){
    if (result_history!= ''){
    text('<raw results>', 10, 310, width-20);
    text(result_history, 10, 335, width-20);
    }
  }
  pop();
  
  //check the ending phonics of current word
   if(wordlist[currentWordIndex][1].length==phonemeIndex){
     console.log(`wordlist[currentWordIndex][1].length=${wordlist[currentWordIndex][1].length} phonemeIndex=${phonemeIndex}`);
           console.log(`currentWordIndex: ${currentWordIndex} wordlist.length-1=${wordlist.length-1}`);
          if(1<wordlist.length-currentWordIndex){
             currentWordIndex++;
             phonemeIndex=0;
          }
          else{
            currentWordIndex=0;
            phonemeIndex=0;
          }
    }
  
  sortTopPhonicsResultList = [];
  //sortedTop3TempPhonicsResults=[];

}
