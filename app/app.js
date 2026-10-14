"use strict";
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const boardEl = document.getElementById("board");
const modeEl = document.getElementById("mode");
const msg = document.getElementById("msg");
const tally = { X: 0, O: 0, D: 0 };

let board, turn, done, round = 0;

const buttons = Array.from({ length: 9 }, (_, i) => {
  const b = document.createElement("button");
  b.dataset.i = i;
  b.addEventListener("click", () => play(i));
  boardEl.append(b);
  return b;
});

function winner(b) {
  for (const l of LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return { who: b[l[0]], line: l };
  return b.every(Boolean) ? { who: "D", line: [] } : null;
}

/** Minimax with depth, so the computer wins fast and loses slow. */
function minimax(b, player, depth) {
  const w = winner(b);
  if (w) return { score: w.who === "O" ? 10 - depth : w.who === "X" ? depth - 10 : 0 };
  let best = { score: player === "O" ? -Infinity : Infinity, move: -1 };
  b.forEach((v, i) => {
    if (v) return;
    b[i] = player;
    const { score } = minimax(b, player === "O" ? "X" : "O", depth + 1);
    b[i] = null;
    if (player === "O" ? score > best.score : score < best.score) best = { score, move: i };
  });
  return best;
}

function computerMove() {
  const free = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  // Easy plays the best move half the time and a random one otherwise.
  if (modeEl.value === "easy" && Math.random() < 0.5) return free[Math.floor(Math.random() * free.length)];
  return minimax([...board], "O", 0).move;
}

function play(i) {
  if (done || board[i]) return;
  if (modeEl.value !== "friend" && turn === "O") return;
  place(i);
  if (!done && modeEl.value !== "friend") {
    boardEl.setAttribute("aria-busy", "true");
    const thisRound = round;
    setTimeout(() => {
      if (thisRound !== round) return; // a new round started meanwhile
      place(computerMove());
      boardEl.removeAttribute("aria-busy");
    }, 350);
  }
}

function place(i) {
  board[i] = turn;
  const w = winner(board);
  if (w) {
    done = true;
    tally[w.who]++;
    w.line.forEach((j) => buttons[j].classList.add("win"));
    msg.textContent = w.who === "D" ? "It's a draw." : modeEl.value === "friend" ? `${w.who} wins!` : w.who === "X" ? "You win!" : "The computer wins.";
  } else {
    turn = turn === "X" ? "O" : "X";
    msg.textContent = modeEl.value === "friend" ? `${turn}'s turn` : turn === "X" ? "Your turn" : "Thinking…";
  }
  render();
}

function render() {
  buttons.forEach((b, i) => {
    b.textContent = board[i] || "";
    b.classList.toggle("x", board[i] === "X");
    b.classList.toggle("o", board[i] === "O");
    b.setAttribute("aria-label", board[i] ? `${board[i]}` : `Empty square ${i + 1}`);
  });
  document.getElementById("sx").textContent = tally.X;
  document.getElementById("so").textContent = tally.O;
  document.getElementById("sd").textContent = tally.D;
}

function newRound() {
  board = Array(9).fill(null);
  round++;
  boardEl.removeAttribute("aria-busy");
  turn = "X";
  done = false;
  buttons.forEach((b) => b.classList.remove("win"));
  msg.textContent = modeEl.value === "friend" ? "X's turn" : "Your turn";
  render();
}

document.getElementById("new").addEventListener("click", newRound);
modeEl.addEventListener("change", newRound);
document.getElementById("reset").addEventListener("click", () => {
  tally.X = tally.O = tally.D = 0;
  render();
});
newRound();
