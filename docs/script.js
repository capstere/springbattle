// --- KONFIGURATION ---
const puzzles = [
  {
    prompt: '1: Vigenère – avkryptera “ujvjs kfcej” med nyckeln PENTA',
    answer: 'kamp',
    type: 'text'
  },
  {
    prompt: '2: Ange talet bakom mörkret',
    answer: '17',
    type: 'stego',
    img: 'assets/stego.png'
  },
  {
    prompt: '3: Ange sångtitel',
    answer: 'editpir',
    type: 'audio',
    src: 'assets/p3-chorus-rev.mp3'
  },
  {
    prompt: '4: Tajma svar med primtal',
    answer: null, // beräknas dynamiskt
    type: 'prime'
  },
  {
    prompt: '5:  Ange ordet.',
    answer: 'kramp',
    type: 'qr',
    data: 'kramp'
  }
];

// --- GLOBALA VARIABLER ---
let current = 0,
    startTime = null,
    timerId = null;

const app       = document.getElementById('app'),
      timerEl   = document.getElementById('timer'),
      audioC    = document.getElementById('audio-correct'),
      audioW    = document.getElementById('audio-wrong');

const audioCtx           = new (window.AudioContext||window.webkitAudioContext)(),
      bufferSources = { puzzle: null };

// --- INIT ---
window.onload = () => {
  const saved = localStorage.getItem('chiffer_start'),
        idx   = localStorage.getItem('chiffer_current');
  if (saved) {
    startTime = +saved;
    timerId   = setInterval(updateTimer, 500);
    showPuzzle(idx ? +idx : 0);
  } else {
    renderIntro();
  }
};

// --- RENDER INTRO ---
function renderIntro() {
  clearInterval(timerId);
  localStorage.removeItem('chiffer_start');
  localStorage.removeItem('chiffer_current');
  timerEl.textContent = '00:00';
  app.innerHTML = `
    <div class="card">
       <p>Välkommen till VÅRKAMP online!</p>
      <button id="start">Starta VÅRKAMP<sup>5</sup></button>
    </div>`;
  document.getElementById('start').onclick = () => {
    startTime = Date.now();
    localStorage.setItem('chiffer_start', startTime);
    localStorage.setItem('chiffer_current', '0');
    timerId = setInterval(updateTimer, 500);
    showPuzzle(0);
  };
}

// --- TIMER ---
function updateTimer() {
  const diff = Date.now() - startTime,
        m    = Math.floor(diff / 60000),
        s    = Math.floor((diff % 60000) / 1000),
        mm   = String(m).padStart(2, '0'),
        ss   = String(s).padStart(2, '0');
  timerEl.textContent = `${mm}:${ss}`;
}

// --- VISA GÅTA ---
function showPuzzle(i) {
  current = i;
  localStorage.setItem('chiffer_current', String(i));
  const p = puzzles[i];
  app.innerHTML = `<div class="card"><div class="prompt">${p.prompt}</div></div>`;
  const card = app.querySelector('.card');

  // Stego
  if (p.type === 'stego') {
    const img = document.createElement('img');
    img.src = p.img; img.style.filter = 'brightness(0)';
    img.onclick = () => img.style.filter = '';
    card.appendChild(img);
  }

  // Audio‑reverse
  if (p.type === 'audio') {
    fetch(p.src)
      .then(r => r.arrayBuffer())
      .then(raw => audioCtx.decodeAudioData(raw))
      .then(decoded => {
        decoded.getChannelData(0).reverse();
        playPuzzleAudio(decoded);
        addReplayButton(decoded);
      });
  }

  // Prime (ingen extra UI)
  // QR
  if (p.type === 'qr') {
    const div = document.createElement('div');
    div.id = 'qrcode'; card.appendChild(div);
    new QRCode(div, { text: p.data, width: 150, height: 150 });
  }

  // Input + knapp
  const inp = document.createElement('input');
  inp.id = 'ans';
  inp.placeholder = 'Svara här';
  const btn = document.createElement('button');
  btn.textContent = 'Skicka';
  card.append(inp, btn);

  btn.onclick = () => {
    // Stoppa puzzle-ljud vid svar
    stopPuzzleAudio();

    let ans = inp.value.trim().toLowerCase();
    if (p.type === 'prime') {
      const m = Math.floor((Date.now() - startTime) / 60000);
      p.answer = isPrime(m) ? m : null;
    }
    if (String(ans) === String(p.answer)) {
      audioC.currentTime = 0;
      audioC.play();
      if (i + 1 < puzzles.length) showPuzzle(i + 1);
      else finish();
    } else {
      audioW.currentTime = 0;
      audioW.play();
      alert('Fel – försök igen!');
    }
  };
}

// --- AVSLUTA ---
function finish() {
  clearInterval(timerId);
  localStorage.removeItem('chiffer_start');
  localStorage.removeItem('chiffer_current');
  stopPuzzleAudio();
  app.innerHTML = `
    <div class="card">
      <h2>Grattis!</h2>
      <p>Slutlösenordet är: <strong>KRAMP123</strong></p>
    </div>`;
}

// --- LJUDHANTERING ---
function playPuzzleAudio(buffer) {
  stopPuzzleAudio();
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.connect(audioCtx.destination);
  src.start();
  bufferSources.puzzle = src;
}

function addReplayButton(buffer) {
  const btn = document.createElement('button');
  btn.textContent = '⏪ Spela om';
  btn.onclick = () => playPuzzleAudio(buffer);
  app.querySelector('.card').appendChild(btn);
}

function stopPuzzleAudio() {
  const src = bufferSources.puzzle;
  if (src) {
    try { src.stop(); } catch (_) {}
    bufferSources.puzzle = null;
  }
}

// --- PRIMTALSHJÄLP ---
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}