const MaxTrials = 500;
const numDots = 100;
const dotSpeed = 100;
const directions = [-1, 1]; 
// Coherence as proportion of points moving to the right. All other (1-proportion) dots are moving
// to the left
const coherenceList = [0.0, 0.40, 0.45, 0.5, 0.55, 0.60, 1.0];

// Task state variables 
var state = {
  taskState: null,
  numTrials: 0,
  currentCoherence: null,
  startTime: null,
  correct: null,
  canvas: document.getElementById("dotCanvas"),
  figure: document.getElementById('figure')
};

// Data variables
var data = {
  // For CSV file
  coherences: [],
  reported: [],

  // For plotting
  coh0: [],
  coh40: [],
  coh45: [],
  coh50: [],
  coh55: [],
  coh60: [],
  coh100: []
};

function startSession() {
  Plotly.newPlot( state.figure, [{
    x: coherenceList, 
    y: [0, 0, 0, 0, 0, 0, 0],
    }],
    {
      xaxis: {
        title: "Proportion Dots Moving Right"
      },
      yaxis: {
        title: "Proportion Trials Selected Right"
      },
    }
  );
  newTrial();
}

async function newTrial() {
    
  if (state.numTrials > MaxTrials) {
    endSession();
  }
  
  // Randomly select a coherence
  state.currentCoherence = coherenceList[Math.floor(Math.random() * coherenceList.length)];

  fixationScreen(); // 2s 
  await sleep(2000);
  await movingDots(); // 3s 
  responseScreen();
}

// Sleep helper function 
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Graphics control functions 
function fixationScreen() {
  state.taskState = "fixation";
  let context = state.canvas.getContext("2d");
  context.fillStyle = "black";
  context.fillRect(0, 0, state.canvas.width, state.canvas.height);
  context.font = "100px Consolas";
  context.fillStyle = "white";
  context.textAlign = "center";
  context.fillText("+", state.canvas.width/2, state.canvas.height/2+25);
}

// Draw one dot
function dot(x, y, radius, dir) {
  this.centerX = x;
  this.centerY = y;
  this.radius = radius;
  this.direction = dir;
  this.draw = function() {
    let context = state.canvas.getContext("2d");
    context.beginPath();
    context.arc(this.centerX, this.centerY, this.radius, 0, 2*Math.PI);
    context.fillStyle = "white";
    context.fill();
    context.linewidth = 0;
    context.stroke();
  }
}

// Draw all dots and animate them
async function movingDots() {
  state.taskState = "dots";
  let context = state.canvas.getContext("2d");
  context.fillStyle = "black";
  context.fillRect(0, 0, state.canvas.width, state.canvas.height);
  
  let allDots = []
  for (let i = 0; i < numDots; i++) {
    let centerX = Math.random() * state.canvas.width; // + state.canvas.width/4;
    let centerY = Math.random() * state.canvas.height;
    if (i < numDots * state.currentCoherence) {
      oneDot = new dot(centerX, centerY, 2.0, 1.0);    
      oneDot.draw();
    }
    else {
      oneDot = new dot(centerX, centerY, 2.0, -1.0);
      oneDot.draw();
    }
    allDots.push(oneDot);
  }
  
  let d = new Date();
  let startTime = d.getTime();
  let prevTime = d.getTime();
  
  while (d.getTime() - startTime < 3000) {
    d = new Date();
    let dt = (d.getTime() - prevTime) / 1000.0;
    let context = state.canvas.getContext("2d");
    context.fillStyle = "black";
    context.fillRect(0, 0, state.canvas.width, state.canvas.height);
    for (let i = 0; i < allDots.length; i++) {
      oneDot = allDots[i];
      let newX = oneDot.centerX + oneDot.direction * dotSpeed * dt;
      if (newX < 0 || newX > state.canvas.width) {
        newX = Math.random() * state.canvas.width;
        newY = Math.random() * state.canvas.height;
        oneDot.centerY = newY;
      }
      oneDot.centerX = newX;
      oneDot.draw();
    }

    prevTime = d.getTime();
    await sleep(110);
  }
}

function responseScreen() {
  state.taskState = "response";
  let context = state.canvas.getContext("2d");
  context.fillStyle = "black";
  context.fillRect(0, 0, state.canvas.width, state.canvas.height);
  context.font = "100px Consolas";
  context.fillStyle = "green";
  context.textAlign = "center";
  context.fillText("+", state.canvas.width/2, state.canvas.height/2+25);
}

// Dispatch the keypress handler
document.onkeypress = function(e) {
  if (state.taskState === "response") {
    const char = String.fromCharCode(event.which);
    checkAnswer(char);
  }
}

function checkAnswer(answer) {
  data.coherences.push(state.currentCoherence);
  let listName = "coh".concat((Math.round(state.currentCoherence * 100)).toString());
  if (answer === "l") {
    data.reported.push("Left");
    data[listName].push(0.0);
  }
  else if (answer === "r") {
    data.reported.push("Right");
    data[listName].push(1.0);
  }
  plotData();
  state.numTrials += 1;
  newTrial();  
}

function plotData() {
  var dataPoints = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
  for (let i = 0; i < coherenceList.length; i++) {
    let listName = "coh".concat((Math.round(coherenceList[i] * 100)).toString());
    if (data[listName].length > 0) {
      dataPoints[i] = data[listName].reduce((a,b) => a+b, 0.0) / data[listName].length;
    }
  }
  Plotly.react(figure,  [{
    x: coherenceList,
    y: dataPoints,
    }]);
}


function endSession() {
  state.taskState = "done";
  saveButton = document.getElementById("saveButton").style.visibility = "visible";
}

function saveData() {
  var rows = [["coherenceRight", "reported"]];
  for (let i=0; i < state.numTrials; i++) {
    let trialData = [data.coherences[i], data.reported[i]]; 
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
  link.setAttribute("download", "movingDot_data.csv");
  document.body.appendChild(link);
  link.click();
}
