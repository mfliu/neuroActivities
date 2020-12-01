const BaselineTrials = 5;
const VMRTrials = 15;
const WashoutTrials = 10;
const Rotation = 30; // degrees

// Task state variables 
var state = {
  running: false,
  taskState: null,
  trialType: null,
  numTrials: 0,
  trialStart: null,
  canvas: document.getElementById("vmrCanvas"),
  figure: document.getElementById('figure')
};

// Data variables
var data = {
  trialNum: [],
  trialPhase:[], 
  trialType: [],
  time: [],
  cursorX: [],
  cursorY: [],
  handX: [],
  handY:[]
  // For plotting
};

function startSession() {
  Plotly.newPlot( state.figure, [{
    x: [], 
    y: [],
    }],
    {
      xaxis: {
        title: "X Position"
      },
      yaxis: {
        title: "Y Position"
      },
    }
  );
  state.canvas.style.cursor = 'none';
  state.running = true;
  baseGraphics();
  newTrial();
}

async function newTrial() {
  
  if (state.numTrials > BaselineTrials + VMRTrials + WashoutTrials) {
    endSession();
  }
  
  // Determine trial type
  if (state.numTrials < BaselineTrials) {
    state.trialType = "baseline";
  }
  else if (state.numTrials < BaselineTrials + VMRTrials) {
    state.trialType = "vmr";
  }
  else {
    state.trialType = "washout";
  }

  // Start trial
  state.running = true;
  state.taskState = "startTarget";
  let d = new Date();
  state.trialStart = d.getTime();
}

// Sleep helper function 
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Collect data helper function -- append data to arrays for each timestep
function appendData(handX, handY, cursorX, cursorY) {
  data.trialNum.push(state.numTrials);
  data.trialPhase.push(state.taskState);
  data.trialType.push(state.trialType);
  let d = new Date();
  data.time.push(d.getTime() - state.trialStart);
  data.cursorX.push(cursorX);
  data.cursorY.push(cursorY);
  data.handX.push(handX);
  data.handY.push(handY);
}

// Base Graphics
function baseGraphics() {
  let context = state.canvas.getContext("2d");
  // Background
  context.fillStyle = "gainsboro";
  context.fillRect(0, 0, state.canvas.width, state.canvas.height);
  
  // Start 
  context.beginPath();
  context.arc(state.canvas.width/2, state.canvas.height-25, 20, 0, 2*Math.PI);
  context.fillStyle = "gray";
  context.fill();
  context.linewidth = 0;
  context.stroke();
  
  // Target
  context.beginPath();
  context.arc(state.canvas.width/2, 25, 20, 0, 2*Math.PI);
  context.fillStyle = "seagreen";
  context.fill();
  context.linewidth = 0;
  context.stroke();
}

// Mouse move handler 
state.canvas.onmousemove = function(e) {
  if (state.running == false) {
    return;
  }
  baseGraphics();
  let context = state.canvas.getContext("2d");
  if (state.taskState != "runTrial") {
    context.beginPath();
    context.arc(e.offsetX, e.offsetY, 5, 0, 2*Math.PI);
    context.fillStyle = "gold";
    context.fill();
    context.linewidth = 1;
    context.stroke;
    
    //appendData(e.offsetX, e.offsetY, e.offsetX, e.offsetY);
  }
  
  if (startCheck(e.offsetX, e.offsetY) === true) {
      state.taskState = "runTrial";
  }
  
  runTrial(e.offsetX, e.offsetY);
  
}

// Check if mouse is in start target for 0.5s 
function startCheck(posX, posY) {
  let radius = Math.sqrt(Math.pow((state.canvas.height-25) - posY, 2) +
                Math.pow(posX - state.canvas.width/2, 2));
  if (radius < 20) {
    return true;
  }
  return false;
}

function targetCheck(posX, posY) {
  let radius = Math.sqrt(Math.pow(25 - posY, 2) +
                Math.pow(posX - state.canvas.width/2, 2));
  if (radius < 20) {
    return true;
  }
  return false;
}

// Run the trial
function runTrial(posX, posY) {
  if (state.taskState != "runTrial") {
    return;
  }
  let xPos;
  let yPos;
  if (state.trialType === "vmr") {
    let radius = Math.sqrt(Math.pow((state.canvas.height-25) - posY, 2) +
                Math.pow(posX - state.canvas.width/2, 2))
    let theta = Math.atan2((state.canvas.height-25)-posY, posX - state.canvas.width / 2);
    if (Math.abs(posX - state.canvas.width/2) <= 0.0001) {
      theta = Math.PI/2;
    }
    let thetaShift = theta - (Rotation * Math.PI/180);
    xPos = radius * Math.cos(thetaShift) + state.canvas.width/2;
    yPos = (state.canvas.height-25) - (radius * Math.sin(thetaShift));
  }
  else {
    xPos = posX;
    yPos = posY;
  }
  let context = state.canvas.getContext("2d");
  context.beginPath();
  context.arc(xPos, yPos, 5, 0, 2*Math.PI);
  context.fillStyle = "dodgerblue";
  context.fill();
  context.linewidth = 1;
  context.stroke;
  
  appendData(posX, posY, xPos, yPos);
  
  if (targetCheck(xPos, yPos) === true) {
    state.taskState = "completedTrial";
    appendData(posX, posY, xPos, yPos);
    endTrial();
  }
}

async function endTrial() {
  baseGraphics();
  plotData();
  state.running = false;
  state.numTrials += 1;
  await sleep(500);
  newTrial();
}

function plotData() {
  let startIdx = data.trialNum.indexOf(state.numTrials);
  let endIdx = data.trialNum.lastIndexOf(state.numTrials);
  let trialX = data.cursorX.slice(startIdx, endIdx);
  let trialY = data.cursorY.slice(startIdx, endIdx);
  let plotColor;
  let opacity;
  if (state.trialType === "baseline") {
    plotColor = 'black';
    plotName = "BL".concat(state.numTrials.toString());
  }
  else if (state.trialType === "vmr") {
    plotColor = 'blue';
    opacity = (state.numTrials - BaselineTrials)/VMRTrials;
    plotName = "VMR".concat(state.numTrials-BaselineTrials.toString());
  }
  else if (state.trialType === "washout") {
    plotColor = 'pink';
    opacity = (state.numTrials - VMRTrials)/WashoutTrials;
    plotName = "WO".concat(state.numTrials-VMRTrials.toString());
  }
  console.log(opacity);
  Plotly.plot(figure,  [{
    x: trialX,
    y: trialY,
    opacity: opacity,
    name: plotName,
    line: {
      color: plotColor,
    }
    }],
    {
      xaxis: {
        title: "X Position"
      },
      yaxis: {
        title: "Y Position"
      },
    }
  );
}


function endSession() {
  state.taskState = "done";
  saveButton = document.getElementById("saveButton").style.visibility = "visible";
}

function saveData() {
  var rows = [["trialNum", "trialPhase", "trialType", "time",
                "cursorX", "cursorY", "handX", "handY"]];
  for (let i=0; i < data.trialNum.length; i++) {
    let trialData = [data.trialNum[i], data.trialPhase[i], data.trialType[i],
                      data.time[i], data.cursorX[i], data.cursorY[i],
                      data.handX[i], data.handY[i]]; 
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
  link.setAttribute("download", "vmr_data.csv");
  document.body.appendChild(link);
  link.click();
}
