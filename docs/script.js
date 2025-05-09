// Konfiguration av gåtorna
const puzzles = [
  {
    prompt: 'Gåta 1: Vigenère – avkryptera “ujvjs kfcej” med nyckeln PENTA',
    answer: 'kamp',
    type: 'text'
  },
  {
    prompt: 'Gåta 2: Steno – tryck på bilden för att se texten',
    answer: '17',
    type: 'stego',
    img: 'assets/stego.png'
  },
  {
    prompt: 'Gåta 3: Audio reverse – vilken sång hör du?',
    answer: 'editpir',
    type: 'audio',
    src: 'assets/p3-chorus-rev.mp3'
  },
  {
    prompt: 'Gåta 4: Blend – klicka fyra gånger för att visa',
    answer: 'yxa',
    type: 'blend'
  },
  {
    prompt: 'Gåta 5: QR – scanna koden nedan och skriv ordet',
    answer: 'kramp',
    type: 'qr'
  }
];

let current = 0, startTime, timerId;
const app = document.getElementById('app'),
      timerEl = document.getElementById('timer'),
      audioC = document.getElementById('audio-correct'),
      audioW = document.getElementById('audio-wrong');

// Starta spelet
window.onload = () => renderIntro();

function renderIntro() {
  clearInterval(timerId);
  app.innerHTML = `
    <div class="card">
      <p>Välkommen till din personliga chiffer‑femkamp! Lös alla fem gåtor så fort du kan.</p>
      <button id="start">Starta tävlingen</button>
    </div>`;
  document.getElementById('start').onclick = () => {
    startTime = Date.now();
    timerId = setInterval(updateTimer, 500);
    showPuzzle(0);
  };
}

function updateTimer() {
  const diff = Date.now() - startTime,
        mm = String(Math.floor(diff/60000)).padStart(2,'0'),
        ss = String(Math.floor((diff%60000)/1000)).padStart(2,'0');
  timerEl.textContent = `${mm}:${ss}`;
}

function showPuzzle(i) {
  current = i;
  const p = puzzles[i];
  app.innerHTML = `<div class="card"><div class="prompt">${p.prompt}</div></div>`;
  const card = app.querySelector('.card');

  // Stego: gömd bild som avslöjas vid tryck
  if (p.type === 'stego') {
    const img = document.createElement('img');
    img.src = p.img;
    img.style.filter = 'brightness(0)';
    img.onclick = () => img.style.filter = '';
    card.appendChild(img);
  }

  // Audio reverse
  if (p.type === 'audio') {
    fetch(p.src)
      .then(r => r.arrayBuffer())
      .then(buf => {
        const ac = new AudioContext();
        ac.decodeAudioData(buf, decoded => {
          for (let c=0; c<decoded.numberOfChannels; c++)
            decoded.getChannelData(c).reverse();
          const src = ac.createBufferSource();
          src.buffer = decoded;
          src.connect(ac.destination);
          src.start();
        });
      });
  }

  // Blend‑pussel: fyra klick för att avslöja
  if (p.type === 'blend') {
    const hint = document.createElement('div');
    hint.textContent = '🔳 Klicka 4 gånger';
    hint.style.fontSize = '1rem';
    hint.style.margin = '0.5rem 0';
    card.appendChild(hint);
    let clicks = 0;
    hint.onclick = () => {
      if (++clicks === 4) hint.textContent = 'yxa';
    };
  }

  // QR‑pussel
  if (p.type === 'qr') {
    const div = document.createElement('div');
    div.id = 'qrcode';
    card.appendChild(div);
    new QRCode(div, { text: p.answer, width: 150, height: 150 });
  }

  // Input + Skicka
  const inp = document.createElement('input');
  inp.id = 'ans';
  inp.placeholder = 'Svar här';
  const btn = document.createElement('button');
  btn.textContent = 'Skicka';
  card.append(inp, btn);

  btn.onclick = () => {
    const ans = inp.value.trim().toLowerCase();
    if (ans === p.answer) {
      audioC.play();
      if (i+1 < puzzles.length) showPuzzle(i+1);
      else finish();
    } else {
      audioW.play();
      alert('Fel – försök igen!');
    }
  };
}

function finish() {
  clearInterval(timerId);
  app.innerHTML = `
    <div class="card">
      <h2>Grattis!</h2>
      <p>Slutlösenordet är: <strong>KRAMP123</strong></p>
    </div>`;
}
