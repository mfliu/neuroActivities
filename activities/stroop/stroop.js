// Max number of trials per session 
const MaxTrials = 500;
// List of words to choose from
// TODO: Add more words
// List of colors to choose from. Note that these double as word options.
const ColorNames = ['green', 'red', 'blue', 'yellow']; 

// Task state variables 
var state = {
  running: false,
  numTrials: 0,
  currentColor: null,
  currentWord: null,
  startTime: null,
  correct: null,
  canvas: document.getElementById('stroopCanvas'),
  figure: document.getElementById('figure')
};

// Data variables
var data = {
  // For CSV file
  colors: [],
  words: [],
  reported: [],
  reactionTimes: [],

  // For plotting
  congruent: [],
  incongruent: [],
  incorrect: [],
};

function startSession() {
  state.running = true;
  Plotly.newPlot( state.figure, [{
    x: ["Congruent", "Incongruent"],
    y: [0, 0],
    type: 'bar'
    }],
    {
      yaxis: {
        title: "Reaction Time (ms)"
      },
    }
  );
  newTrial();
}

function newTrial() {
  
  if (state.numTrials > MaxTrials) {
    endSession();
  }

  // Randomly select a word
  state.currentWord = ColorNames[Math.floor(Math.random() * ColorNames.length)];
 
  // Randomly select a color
  state.currentColor = ColorNames[Math.floor(Math.random() * ColorNames.length)];
  
  // Display the word in the color
  //const wordDisplay = document.getElementById('wordDisplay');
  //wordDisplay.innerText = state.currentWord;
  //wordDisplay.style.color = state.currentColor;
  presentationScreen(state.currentWord, state.currentColor);
  state.startTime = new Date();
}

// Dispatch the keypress handler
document.onkeypress = function(e) {
  const char = parseInt(String.fromCharCode(event.which || event.keyCode));
  checkAnswer(char);
}

// Screens
function presentationScreen(text, color) {
  let context = state.canvas.getContext("2d");
  context.fillStyle = "black";
  context.fillRect(0, 0, state.canvas.width, state.canvas.height);
  context.font = "100px Consolas";
  context.fillStyle = color;
  context.textAlign = "center";
  context.fillText(text, state.canvas.width/2, state.canvas.height/2+25);
}

// Check if the answer was correct
function checkAnswer(answerIdx) {
  const trialTime = (new Date()) - state.startTime;
  
  data.colors.push(state.currentColor);
  data.words.push(state.currentWord);
  data.reported.push(ColorNames[answerIdx-1]);
  data.reactionTimes.push(trialTime);

  if(ColorNames[answerIdx-1] === state.currentColor) {
    //const rightWrong = document.getElementById('rightWrong');
    //rightWrong.innerText = "Correct";
    //const reactionTime = document.getElementById('reactionTime');
    //reactionTime.innerText = "Reaction Time: ".concat(trialTime.toString(), " ms");
    state.correct = true;
    if (state.currentColor === state.currentWord) {
      data.congruent.push(trialTime);
    }
    else {
      data.incongruent.push(trialTime);
    }
  }
  else {
    // TODO: Display failure somehow
    //const rightWrong = document.getElementById('rightWrong');
    //rightWrong.innerText = "Incorrect";
    //const reactionTime = document.getElementById('reactionTime');
    //reactionTime.innerText = "";
    state.correct = false;
    data.incorrect.push(trialTime);
  }
  plotData();
  state.numTrials += 1;
  //console.log(state.numTrials);
  newTrial();
}

function plotData() {
  // Plot data 
  var congruentMean = data.congruent.reduce((a,b) => a+b, 0.0) / data.congruent.length;
  var incongruentMean = data.incongruent.reduce((a,b) => a+b, 0.0) / data.incongruent.length;
  
  Plotly.react(figure,  [{
    x: ["Congruent", "Incongruent"],
    y: [congruentMean, incongruentMean],
    type: 'bar'
    }]);
  
  newTrial();
}

function endSession() {
  state.running = false;
  saveButton = document.getElementById("saveButton").style.visibility = "visible";
}

function saveData() {
  // Save data to CSV
  var rows = [["word", "color", "reported", "reactionTime"]];
  console.log(data.words.length.toString());
  console.log(data.reactionTimes.length.toString());
  console.log(state.numTrials.toString());
  for (let i=0; i < state.numTrials; i++) {
    let trialData = [data.words[i], data.colors[i], 
      data.reported[i], data.reactionTimes[i].toString()];
    rows.push(trialData);
  }
  let csvContent = "data:text/csv;charset=utf-8,"; 
  rows.forEach(function(rowArray) {
    let row = rowArray.join(",");
    csvContent += row + "\r\n";
  });
  var encodedURI = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedURI);
  link.setAttribute("download", "stroop_data.csv");
  document.body.appendChild(link);
  link.click();
}
