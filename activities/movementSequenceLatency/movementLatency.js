// Track state during trials

var TrialTime = null;
// Dispatch the keypress handler
document.onkeydown = function(e) {
  if (UserSequence.length == 0) {
    TrialTime = (new Date()) - StartTime;
  }
  if (event.key == "ArrowLeft") {
    UserSequence = UserSequence.concat('\u2190');
  }
  else if (event.key == "ArrowUp"){
    UserSequence = UserSequence.concat('\u2191');
  }
  else if (event.key == "ArrowRight") {
    UserSequence = UserSequence.concat('\u2192');
  }
  else if (event.key == "ArrowDown") {
    UserSequence = UserSequence.concat('\u2193');
  }
  
  if (UserSequence.length == SequenceLength) {
    checkAnswer(UserSequence, TrialTime);
  }
}

// List of directions
const Arrows = ['\u2190', '\u2191', '\u2192', '\u2193']; //Left, Up, Right, Down
//const Arrows = ['u', 'd', 'l', 'r'];
var SequenceLength = null;
var Sequence = "";
var UserSequence = "";
var StartTime = null;

// Check if the answer was correct
function checkAnswer(answer, keyTime) {
  console.log(answer);
  if (answer == Sequence) {
    reactionTime = document.getElementById("reactionTime");
    reactionTime.innerText = "Match! Time to first keypress: ".concat(keyTime.toString(), " ms");
  }
  else {
    reactionTime.innerText = "Wrong Sequence Entered";
  }
    
  // NOTE: You may not want to automatically start a new trial here
  // You might want some delay or manual trial start
 //newTrial();
}

// Make a new trial instance
function newTrial() {
    
  // Randomly select a sequence length from 1-5
  SequenceLength = Math.floor(Math.random() * 5) + 1;
  Sequence = "";
  UserSequence = "";
  // Generate sequence
  for (i = 0; i < SequenceLength; i++) {
    Sequence = Sequence.concat(Arrows[Math.floor(Math.random() * Arrows.length)]);
  }
  console.log(Sequence);
  // Display the sequence
  const wordDisplay = document.getElementById('sequenceDisplay');
  wordDisplay.innerText = Sequence;
  const reactionTime = document.getElementById("reactionTime");
  reactionTime.innerText = "";
  StartTime = new Date();
}
