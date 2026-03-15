const state = {
  currentSquare: 67,
  step: 7,
  operation: "subtract",
  answerSquare: 60,
  score: 0,
  locked: false
};

const board = document.getElementById("board");
const token = document.getElementById("caterpillar-token");
const currentSquareElement = document.getElementById("current-square");
const promptTextElement = document.getElementById("prompt-text");
const scoreValueElement = document.getElementById("score-value");
const feedbackElement = document.getElementById("feedback");
const speakButton = document.getElementById("speak-button");
const nextButton = document.getElementById("next-button");

function buildBoard() {
  const fragment = document.createDocumentFragment();

  for (let number = 1; number <= 100; number += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "square";
    button.dataset.number = String(number);
    button.setAttribute("aria-label", `Square ${number}`);
    button.textContent = String(number);
    button.addEventListener("click", () => handleSquareTap(number));
    fragment.appendChild(button);
  }

  board.appendChild(fragment);
}

function getSquareElement(number) {
  return board.querySelector(`[data-number="${number}"]`);
}

function updateBoardHighlights() {
  for (const square of board.children) {
    square.classList.remove("current", "correct-target", "wrong-choice");
  }

  const currentSquare = getSquareElement(state.currentSquare);
  if (currentSquare) {
    currentSquare.classList.add("current");
  }
}

function updateText() {
  currentSquareElement.textContent = String(state.currentSquare);
  promptTextElement.textContent = state.operation === "add"
    ? `Add ${state.step}`
    : `Take away ${state.step}`;
  scoreValueElement.textContent = String(state.score);
}

function sayPrompt() {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(
    `Start on ${state.currentSquare}. ${state.operation === "add" ? "Add" : "Take away"} ${state.step}.`
  );
  utterance.rate = 0.9;
  utterance.pitch = 1.15;
  utterance.lang = "en-GB";
  window.speechSynthesis.speak(utterance);
}

function setFeedback(message, tone) {
  feedbackElement.textContent = message;
  feedbackElement.classList.remove("correct", "wrong");
  if (tone) {
    feedbackElement.classList.add(tone);
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createPuzzle() {
  const operation = Math.random() >= 0.5 ? "add" : "subtract";

  if (operation === "add") {
    const currentSquare = randomInt(1, 90);
    const maxStep = Math.min(10, 100 - currentSquare);
    const step = randomInt(1, maxStep);
    return {
      currentSquare,
      operation,
      step,
      answerSquare: currentSquare + step
    };
  }

  const currentSquare = randomInt(11, 100);
  const maxStep = Math.min(10, currentSquare - 1);
  const step = randomInt(1, maxStep);
  return {
    currentSquare,
    operation,
    step,
    answerSquare: currentSquare - step
  };
}

function positionToken(squareNumber) {
  const square = getSquareElement(squareNumber);
  if (!square) {
    return;
  }

  const boardRect = board.getBoundingClientRect();
  const squareRect = square.getBoundingClientRect();
  const left = squareRect.left - boardRect.left + (squareRect.width / 2);
  const top = squareRect.top - boardRect.top + (squareRect.height / 2);

  token.style.left = `${left}px`;
  token.style.top = `${top}px`;
}

function pulseChoice(squareNumber, className) {
  const square = getSquareElement(squareNumber);
  if (!square) {
    return;
  }
  square.classList.add(className);
  window.setTimeout(() => square.classList.remove(className), 540);
}

function animateTo(squareNumber) {
  state.locked = true;
  token.classList.remove("wiggle");
  positionToken(squareNumber);
  token.classList.add("wiggle");

  window.setTimeout(() => {
    state.currentSquare = squareNumber;
    state.locked = false;
    updateBoardHighlights();
    positionToken(state.currentSquare);
    loadNextPuzzleFromCurrentSquare();
  }, 720);
}

function loadNextPuzzleFromCurrentSquare() {
  const remainingUp = 100 - state.currentSquare;
  const remainingDown = state.currentSquare - 1;

  let operation = "add";
  if (remainingUp === 0) {
    operation = "subtract";
  } else if (remainingDown === 0) {
    operation = "add";
  } else {
    operation = Math.random() >= 0.5 ? "add" : "subtract";
  }

  const maxStep = operation === "add"
    ? Math.min(10, remainingUp)
    : Math.min(10, remainingDown);

  state.operation = operation;
  state.step = randomInt(1, maxStep);
  state.answerSquare = operation === "add"
    ? state.currentSquare + state.step
    : state.currentSquare - state.step;

  updateText();
  setFeedback("Lovely. Now solve the next move.", "correct");
}

function resetPuzzle() {
  Object.assign(state, createPuzzle());
  state.locked = false;
  updateText();
  updateBoardHighlights();
  setFeedback("Tap the square where the caterpillar should land.", "");
  positionToken(state.currentSquare);
}

function handleSquareTap(number) {
  if (state.locked) {
    return;
  }

  if (number === state.answerSquare) {
    state.score += 1;
    updateText();
    pulseChoice(number, "correct-target");
    setFeedback("Yes. The caterpillar is moving there.", "correct");
    animateTo(number);
    return;
  }

  pulseChoice(number, "wrong-choice");
  setFeedback("Not quite. Try again.", "wrong");
}

window.addEventListener("resize", () => {
  positionToken(state.currentSquare);
});

speakButton.addEventListener("click", sayPrompt);
nextButton.addEventListener("click", resetPuzzle);

buildBoard();
updateText();
updateBoardHighlights();
positionToken(state.currentSquare);
setFeedback("Tap the square where the caterpillar should land.", "");
