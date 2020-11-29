const MaxTrials = 500;
const cueTypes = ["exogenous", "endogenous"];
const stimLocations = ["left", "right"];

// Task state variables 
var state = {
  started: false,
  taskState: null,
  numTrials: 0,
  cueType: null,
  cueLoc: null,
  stimLoc: null,
  stimTime: null,
  canvas: document.getElementById("posnerCanvas"),
  figure: document.getElementById('figure')
};

// Data variables
var data = {
  // For CSV file
  cueType: [],
  cueLocation: [],
  stimulusLocation: [],
  reactionTime: [],

  // For plotting
  endoValid: [],
  endoInvalid: [],
  exoValid: [],
  exoInvalid: []
};

function startSession() {
  if(state.started) {
    return;
  }

  state.started = true;
  Plotly.newPlot( state.figure, [
    { 
      x: ["Valid", "Invalid"], 
      y: [0, 0],
      type: 'bar',
      name: "Exogenous"
    },
    {
      x: ["Valid", "Invalid"], 
      y: [0, 0],
      type: 'bar',
      name: "Endogenous"
    }],
    {
      yaxis: {
        title: "Reaction Time (ms)"
      },
    }
  );

  newTrial();
}

async function newTrial() {
  if (state.numTrials > MaxTrials) {
    endSession();
  }
 
  let cueType = cueTypes[Math.floor(Math.random() * cueTypes.length)];
  state.stimLoc = stimLocations[Math.floor(Math.random() * stimLocations.length)];
  state.cueLoc = stimLocations[Math.floor(Math.random() * stimLocations.length)];
  state.cueType = cueType;
  
  if (state.taskState === "done") {
    await sleep(500);
  }

  fixationScreen();
  state.taskState = "fixation";
  await sleep(1000);
  
  cueScreen();
  state.taskState = "cue";
  await sleep(2000);
  
  fixationScreen();
  state.taskState = "interStim";
  await sleep(1000);
  
  stimulusScreen();
  state.taskState = "stimulus";
}

// Sleep helper function 
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Screens 
function fixationScreen() {
  let context = state.canvas.getContext("2d");
  context.fillStyle = "black";
  context.fillRect(0, 0, state.canvas.width, state.canvas.height);
  fixationTarget("+"); 
  leftRegion(5);
  rightRegion(5);  
}

function cueScreen() {
  let context = state.canvas.getContext("2d");
  context.fillStyle = "black";
  context.fillRect(0, 0, state.canvas.width, state.canvas.height);
  if (state.cueType == "exogenous") {
    fixationTarget("+");
    if (state.cueLoc === "left") {
      leftRegion(15);
      rightRegion(5);
    }
    else if (state.cueLoc === "right") {
      rightRegion(15); 
      leftRegion(5);
    }
  }
  else if (state.cueType == "endogenous") {
    let direction;
    if (state.cueLoc === "left") {
      direction = "<=";
    }
    else if (state.cueLoc === "right") {
      direction = "=>";
    }
    leftRegion(5);
    rightRegion(5);
    fixationTarget(direction);
  }
  
}

function stimulusScreen() {
  stimulusTarget(state.stimLoc);
  let d = new Date();
  state.stimTime = d.getTime();
}

// Dispatch the keypress handler
document.onkeypress = function(e) {
  
  if (state.taskState === "stimulus") {
    const char = String.fromCharCode(event.which);
    checkAnswer(char);
  }
}

function checkAnswer(answer) {
  if (state.taskState === "stimulus") {
    state.taskState = "done";
    state.numTrials += 1;

    let d = new Date();  
    let trialTime = d.getTime() - state.stimTime;
    data.cueType.push(state.cueType);
    data.cueLocation.push(state.cueLoc);
    data.stimulusLocation.push(state.stimLoc);
    data.reactionTime.push(trialTime);
    
    if (state.cueType === "endogenous") {
      if (state.stimLoc === state.cueLoc) {
        data.endoValid.push(trialTime);
      }
      else {
        data.endoInvalid.push(trialTime);
      }
    }
    else {
      if (state.stimLoc === state.cueLoc) {
        data.exoValid.push(trialTime);
      }
      else {
        data.exoInvalid.push(trialTime);
      }
    }
    plotData();
    newTrial();
  }
}

function plotData() {
  let endoInvalidMean = data.endoInvalid.reduce((a,b) => a+b, 0.0) / data.endoInvalid.length;
  let endoValidMean = data.endoValid.reduce((a,b) => a+b, 0.0) / data.endoValid.length;
  let exoInvalidMean = data.exoInvalid.reduce((a,b) => a+b, 0.0) / data.exoInvalid.length;
  let exoValidMean = data.exoValid.reduce((a,b) => a+b, 0.0) / data.exoValid.length;
  Plotly.react(state.figure, [
    { 
      x: ["Valid", "Invalid"], 
      y: [exoValidMean, exoInvalidMean],
      type: 'bar',
      name: "Exogenous"
    },
    {
      x: ["Valid", "Invalid"], 
      y: [endoValidMean, endoInvalidMean],
      type: 'bar',
      name: "Endogenous"
    }],
    {
      yaxis: {
        title: "Reaction Time (ms)"
      },
    }
  );
}


function endSession() {
  state.started = false;
  saveButton = document.getElementById("saveButton").style.visibility = "visible";
}

function saveData() {
  var rows = [["cueType", "cueLocation", "stimLocation", "reactionTime"]];
  for (let i=0; i < state.numTrials; i++) {
    let trialData = [data.cueType[i], data.cueLocation[i],
      data.stimulusLocation[i], data.reactionTime[i]]; 
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
  link.setAttribute("download", "posnerAttention_data.csv");
  document.body.appendChild(link);
  link.click();
}

// Graphics helper functions 
function fixationTarget(text) {
  let context = state.canvas.getContext("2d");
  context.font = "100px Consolas";
  context.fillStyle = "white";
  context.textAlign = "center";
  context.fillText(text, state.canvas.width/2, state.canvas.height/2+25);
}

function leftRegion(lw) {
  let context = state.canvas.getContext("2d");
  context.beginPath();
  context.rect(state.canvas.width/4-150, state.canvas.height/2-85, 150, 150);
  context.lineWidth = lw;
  context.strokeStyle = "white";
  context.stroke();
}

function rightRegion(lw) {
  let context = state.canvas.getContext("2d");
  context.beginPath();
  context.rect(3*state.canvas.width/4, state.canvas.height/2-85, 150, 150);
  context.lineWidth = lw;
  context.strokeStyle = "white";
  context.stroke();
}

function stimulusTarget(loc) {
  let context = state.canvas.getContext("2d");
  context.font = "150px Consolas";
  context.fillStyle = "white";
  context.textAlign = "center";
  if (loc === "left") {
    context.fillText("*", state.canvas.width/4-75, state.canvas.height/2+60);
  }
  else {
    context.fillText("*", 3*state.canvas.width/4+75, state.canvas.height/2+60);
  }
}


