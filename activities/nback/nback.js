const MaxTrials = 500;
const PossibleCues = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nbackRange = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const TrialsPerNback = Math.floor(MaxTrials/nbackRange.length);

// Task state variables 
var state = {
  started: false,
  taskState: null,
  numTrialsThisN: 0,
  nbackIdx: 0,
  cueText: null,
  canvas: document.getElementById("nbackCanvas"),
  figure: document.getElementById('figure')
};

// Data variables
var data = {
  // For CSV file
  nback: [],
  cue: [],
  reported: [],

  // For plotting
  numCorrect: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  numTrialsPerN: [0, 0, 0, 0, 0, 0, 0, 0, 0]
};

async function startSession() {
  if(state.started) {
    return;
  }

  state.started = true;
  Plotly.newPlot( state.figure, [
    { 
      x: nbackRange, 
      y: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      type: 'bar'
    }],
    {
      xaxis: {
        title: "N Back"
      },
      yaxis: {
        title: "Proportion Missed"
      },
    }
  );
  
  instructionScreen(nbackRange[state.nbackIdx]);
  await sleep(2000);
  newTrial();
}

async function newTrial() {
  if (state.taskState === "done") {
    return;
  }

  if (state.numTrialsThisN >= TrialsPerNback) {
    if (nbackRange[state.nbackIdx] === 10) {
      endSession();
    }
    state.nbackIdx += 1;
    state.numTrialsThisN = 0;
    instructionScreen(nbackRange[state.nbackIdx]);
    state.taskState = "instruction";
    await sleep(2000);
  }
  
  generateCue();
  state.taskState = "cue";
  await sleep(1000);
  plotData();
  newTrial();
  
}

// Sleep helper function 
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Screens 
function instructionScreen(nBack) {
  let context = state.canvas.getContext("2d");
  context.fillStyle = "black";
  context.fillRect(0, 0, state.canvas.width, state.canvas.height);
  context.font = "100px Consolas";
  context.fillStyle = "white";
  context.textAlign = "center";
  context.fillText(nBack.toString().concat("-Back"), 
        state.canvas.width/2-25, state.canvas.height/2+25);
}

function generateCue() {
  let matchTrial = Math.random() < 0.5;
  if (matchTrial && data.cue.length >= nbackRange[state.nbackIdx]) {
    state.cueText = data.cue[data.cue.length-nbackRange[state.nbackIdx]];
    data.cue.push(state.cueText);
    data.nback.push(nbackRange[state.nbackIdx]);
    data.reported.push(0);
    data.numTrialsPerN[state.nbackIdx] += 1;
    state.numTrialsThisN += 1;
  }
  else {
    let randIdx = Math.floor(Math.random() * PossibleCues.length);
    state.cueText = PossibleCues.charAt(randIdx);
    data.nback.push(nbackRange[state.nbackIdx]);
    data.cue.push(state.cueText);
    data.reported.push(0);
  }
  let context = state.canvas.getContext("2d");
  context.fillStyle = "black";
  context.fillRect(0, 0, state.canvas.width, state.canvas.height);
  context.font = "100px Consolas";
  context.fillStyle = "white";
  context.textAlign = "center";
  context.fillText(state.cueText, state.canvas.width/2-25, state.canvas.height/2+25);
}

// Dispatch the keypress handler
document.onkeypress = function(e) {
  if (state.taskState === "cue") {
    const char = String.fromCharCode(event.which);
    if (char === " ") {
      data.reported[data.reported.length-1] = 1; 
      //console.log(data.cue, nbackRange[state.nbackIdx], data.reported);
      checkAnswer(char);
    }
  }
}

function checkAnswer(answer) {
  if (state.cueText === data.cue[data.cue.length-nbackRange[state.nbackIdx]-1]) {
    data.numCorrect[state.nbackIdx] = data.numCorrect[state.nbackIdx] + 1;   
  }
  
}

function plotData() {
  let numWrong = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
  for (let i = 0; i < data.numTrialsPerN.length; i++) {
    numWrong[i] = (data.numTrialsPerN[i] - data.numCorrect[i]) / data.numTrialsPerN[i];
  }
  console.log(numWrong);
  Plotly.react(state.figure, [
    { 
      x: nbackRange, 
      y: numWrong,
      type: 'bar',
    }],
    {
      xaxis: {
        title: "N Back"
      },
      yaxis: {
        title: "Proportion Missed"
      },
    }
  );
}


function endSession() {
  state.started = false;
  state.taskState = "done";
  saveButton = document.getElementById("saveButton").style.visibility = "visible";
}

function saveData() {
  console.log(data.nback.length, data.cue.length, data.reported.length);
  var rows = [["nback", "cue", "reported"]];
  for (let i=0; i < data.cue.length; i++) {
    let trialData = [data.nback[i], data.cue[i], data.reported[i]]; 
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
  link.setAttribute("download", "nback_data.csv");
  document.body.appendChild(link);
  link.click();
}


