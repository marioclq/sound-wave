const canvas = document.getElementById("soundCanvas");
const ctx = canvas.getContext("2d");

const frequencySlider = document.getElementById("frequency");
const frequencyValue = document.getElementById("frequencyValue");
const amplitudeSlider = document.getElementById("amplitude");
const amplitudeValue = document.getElementById("amplitudeValue");
const playPauseButton = document.getElementById("playPause");
const resetButton = document.getElementById("reset");
const moveSourceButton = document.getElementById("moveSource");
const soundToggle = document.getElementById("soundToggle");

let frequency = frequencySlider.value;
let amplitude = amplitudeSlider.value;
let isPlaying = true;
let time = 0;
let sourceX = 50;
let sourceY = canvas.height / 2;
let receiverX = 750;
let receiverY = canvas.height / 2;
let sourceSpeed = 1;
let isMovingSource = false;
let isSoundEnabled = false;
let dragTarget = null;

let newWidth = 50;
let newHeight = 50;

let sourceIcon = new Image();
sourceIcon.src = "speaker.svg";
let receiverIcon = new Image();
receiverIcon.src = "user.svg";

// Web Audio API setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const oscillator = audioCtx.createOscillator();
const gainNode = audioCtx.createGain();

oscillator.type = "sine";
oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
gainNode.gain.setValueAtTime(amplitude / 100, audioCtx.currentTime);

oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);

oscillator.start();
audioCtx.suspend();

frequencySlider.addEventListener("input", (e) => {
  frequency = e.target.value;
  frequencyValue.textContent = frequency;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
});

amplitudeSlider.addEventListener("input", (e) => {
  amplitude = e.target.value;
  amplitudeValue.textContent = amplitude;
  gainNode.gain.setValueAtTime(amplitude / 100, audioCtx.currentTime);
});

playPauseButton.addEventListener("click", () => {
  isPlaying = !isPlaying;
  playPauseButton.textContent = isPlaying ? "Pausa" : "Reproducir";
  if (isPlaying) {
    if (isSoundEnabled) {
      audioCtx.resume();
    }
  } else {
    audioCtx.suspend();
  }
});

resetButton.addEventListener("click", () => {
  time = 0;
  sourceX = 50;
  draw();
});

moveSourceButton.addEventListener("click", () => {
  isMovingSource = !isMovingSource;
  moveSourceButton.textContent = isMovingSource
    ? "Parar Emisor"
    : "Mover Emisor";
});

soundToggle.addEventListener("change", (e) => {
  isSoundEnabled = e.target.checked;
  if (isSoundEnabled && isPlaying) {
    audioCtx.resume();
  } else {
    audioCtx.suspend();
  }
});

canvas.addEventListener("mousedown", (e) => {
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;

  if (Math.hypot(mouseX - sourceX, mouseY - sourceY) < 10) {
    dragTarget = "source";
  } else if (Math.hypot(mouseX - receiverX, mouseY - receiverY) < 10) {
    dragTarget = "receiver";
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (dragTarget) {
    if (dragTarget === "source") {
      sourceX = e.offsetX;
      sourceY = e.offsetY;
    } else if (dragTarget === "receiver") {
      receiverX = e.offsetX;
      receiverY = e.offsetY;
    }
    draw();
  }
});

canvas.addEventListener("mouseup", () => {
  dragTarget = null;
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.arc(sourceX, sourceY, 10, 0, Math.PI * 2);
  ctx.fill();

  // Dibujar el emisor
  ctx.drawImage(
      sourceIcon,
      sourceX - newWidth / 2,
      sourceY - newHeight / 2,
      newWidth,
      newHeight
  );

  // Dibujar el círculo del receptor
  ctx.beginPath();
  ctx.arc(receiverX, receiverY, 10, 0, Math.PI * 2);
  ctx.fill();

  // Dibujar el receptor
  ctx.drawImage(
      receiverIcon,
      receiverX - newWidth / 2,
      receiverY - newHeight / 2,
      newWidth,
      newHeight
  );

  // Dibujar ondas
  for (let i = 0; i < 10; i++) {
    ctx.strokeStyle = `rgba(0, 0, 0, ${0.5 - i * 0.05})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const radius = i * 100 + (time % 100);
    ctx.arc(sourceX, sourceY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Dibujar escala
  ctx.fillStyle = "black";
  ctx.font = "12px Arial";
  for (let i = 0; i <= 5; i++) {
    ctx.fillText(`${i}m`, i * 160, canvas.height - 10);
  }
}
function updateVolumeBasedOnDistance() {
  const distance = Math.sqrt(
    Math.pow(sourceX - receiverX, 2) + Math.pow(sourceY - receiverY, 2)
  );
  const maxDistance = canvas.width;
  const volume = 1 - Math.min(distance / maxDistance, 1);
  gainNode.gain.value = volume;
}

function animate() {
  if (isPlaying) {
    time += 1;
    if (isMovingSource) {
      sourceX += sourceSpeed;
      if (sourceX > canvas.width) {
        sourceX = 0;
      }
    }

    updateVolumeBasedOnDistance(); // Actualizar el volumen basado en la distancia
    const distance = Math.hypot(sourceX - receiverX, sourceY - receiverY);
    const attenuation = 1 / (1 + distance / 100);
    gainNode.gain.value *= attenuation;
  }
  draw();
  requestAnimationFrame(animate);
}

sourceIcon.onload = () => {
  receiverIcon.onload = () => {
    draw();
  };
};

animate();
