// Konfiguration av gåtorna
const puzzles = [
  {
    prompt: '1: Vigenère – avkryptera “ujvjs kfcej” med nyckeln PENTA',
    answer: 'kamp',
    type: 'text'
  },
  {
    prompt: '2: I mörkret står svaret',
    answer: '17',
    type: 'stego',
    img: 'assets/stego.png'
  },
  {
    prompt: '3: Vad heter låtentitel?',
    // du har redan en baklängesfil, vi vänder den tillbaka
    answer: 'editpir',
    type: 'audio',
    src: 'assets/p3-chorus-rev.mp3'
  },
  {
    prompt: '4: Tajma svaret med närmsta primtalet',
    answer: null, // beräknas dynamiskt
    type: 'prime'
  },
  {
    prompt: '5: QR – scanna koden (base64) och dekoda för att få ordet',
    answer: 'kramp',
    type: 'qr',
    data: btoa('kramp') // kodar 'kramp' till base64
  }
];

let current = 0,
    startTime = null,
    timerId = null;

const app = document.getElementById('app'),
      timerEl = document.getElementById('timer'),
      audioC = document.getElementById('audio-correct'),
      audioW = document.getElementById('audio-wrong');

// Återställ vid reload
window.onload = () => {
  const saved = localStorage.getItem('chiffer_start');
  const idx   = localStorage.getItem('chiffer_current');
  if (saved) {
    startTime = parseInt(saved,10);
    timerId = setInterval(updateTimer, 500);
    showPuzzle(idx ? +idx : 0);
  } else {
    renderIntro();
  }
};

function renderIntro() {
  clearInterval(timerId);
  localStorage.removeItem('chiffer_start');
  localStorage.removeItem('chiffer_current');
  timerEl.textContent = '00:00';
  app.innerHTML = `
    <div class="card">
      <p>Webbkamp<sup>5</sup></p>
      <button id="start">Starta</button>
    </div>`;
  document.getElementById('start').onclick = () => {
    startTime = Date.now();
    localStorage.setItem('chiffer_start', startTime);
    localStorage.setItem('chiffer_current', '0');
    timerId = setInterval(updateTimer, 500);
    showPuzzle(0);
  };
}

function updateTimer() {
  const d = Date.now() - startTime,
        m = Math.floor(d/60000),
        s = Math.floor((d%60000)/1000),
        mm = String(m).padStart(2,'0'),
        ss = String(s).padStart(2,'0');
  timerEl.textContent = `${mm}:${ss}`;
}

function showPuzzle(i) {
  current = i;
  localStorage.setItem('chiffer_current', String(i));
  const p = puzzles[i];
  app.innerHTML = `<div class="card"><div class="prompt">${p.prompt}</div></div>`;
  const card = app.querySelector('.card');

  // 2: Stego‑bild
  if (p.type === 'stego') {
    const img = document.createElement('img');
    img.src = p.img;
    img.style.filter = 'brightness(0)';
    img.onclick = () => img.style.filter = '';
    card.appendChild(img);
  }

  // 3: Audio‑reverse (hämtar buffern och vänder tillbaka)
  if (p.type === 'audio') {
    let bufferCopy = null;
    fetch(p.src)
      .then(r => r.arrayBuffer())
      .then(raw => {
        const ac = new AudioContext();
        ac.decodeAudioData(raw, decoded => {
          // vänd tillbaka
          for (let c=0; c<decoded.numberOfChannels; c++)
            decoded.getChannelData(c).reverse();
          bufferCopy = decoded;
          playAudioBuffer(bufferCopy);
          addReplayButton(bufferCopy);
        });
      });
  }

  // 4: Primtal
  if (p.type === 'prime') {
    // ingenting visuellt här, bara input
  }

  // 5: QR + base64
  if (p.type === 'qr') {
    const div = document.createElement('div');
    div.id = 'qrcode';
    card.appendChild(div);
    new QRCode(div, { text: p.data, width:150, height:150 });
  }

  // Input + knapp för alla typer
  const inp = document.createElement('input');
  inp.id = 'ans';
  inp.placeholder = 'Svar här';
  const btn = document.createElement('button');
  btn.textContent = 'Skicka';
  card.append(inp, btn);

  btn.onclick = () => {
    let ans = inp.value.trim().toLowerCase();
    // beräkna dynamiskt primtal
    if (p.type === 'prime') {
      const elapsedMin = Math.floor((Date.now() - startTime)/60000);
      p.answer = nearestPrime(elapsedMin);
    }
    if (ans === String(p.answer)) {
      audioC.play();
      if (i+1 < puzzles.length) showPuzzle(i+1);
      else finish();
    } else {
      audioW.play();
      alert('Fel – försök igen!');
    }
  };
}

// Spela upp decoded audio
function playAudioBuffer(buf) {
  const ac = new AudioContext();
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.connect(ac.destination);
  src.start();
}

// Knapp för att spela igen
function addReplayButton(buf) {
  const btn = document.createElement('button');
  btn.textContent = 'yalpeR';
  btn.onclick = () => playAudioBuffer(buf);
  app.querySelector('.card').appendChild(btn);
}

function finish() {
  clearInterval(timerId);
  localStorage.removeItem('chiffer_start');
  localStorage.removeItem('chiffer_current');
  app.innerHTML = `
    <div class="card">
      <h2>Grattis!</h2>
      <p>Slutlösenordet är: <strong>KRAMP123</strong></p>
    </div>`;
}

// Hjälp: närmaste primtal
function nearestPrime(n) {
  const primes = [];
  const isPrime = x => {
    if (x < 2) return false;
    for (let i=2; i*i<=x; i++) if (x%i===0) return false;
    return true;
  };
  for (let i=2; i<=389; i++) if (isPrime(i)) primes.push(i);
  return primes.reduce((best, p) => {
    return Math.abs(p-n) < Math.abs(best-n) ? p : best;
  }, primes[0]);
}
