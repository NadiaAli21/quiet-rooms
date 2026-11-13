// --- 1. Cozy Identity & Social Battery Mood Engine ---
const ADJECTIVES = ["Quiet", "Misty", "Velvet", "Soft", "Lunar", "Paper", "Mossy", "Calm"];
const NOUNS = ["Fox", "Owl", "Fern", "Tea", "Cloud", "Finch", "Book", "Lantern"];
const AVATARS = ["🦊", "🦉", "🌿", "🍵", "🌙", "📚", "🕯️", "☁️"];

let avatarIdx = 0;
const aliasInput = document.getElementById("alias-input");
const avatarBtn = document.getElementById("avatar-btn");

document.getElementById("reroll-alias").addEventListener("click", () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  aliasInput.value = `${adj}${noun}`;
  renderRoommates();
});

avatarBtn.addEventListener("click", () => {
  avatarIdx = (avatarIdx + 1) % AVATARS.length;
  avatarBtn.textContent = AVATARS[avatarIdx];
  renderRoommates();
});

aliasInput.addEventListener("input", () => renderRoommates());

// Status Tags
let currentStatus = "Deep Focus";
document.querySelectorAll(".tag").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tag").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentStatus = btn.dataset.status;
    renderRoommates();
  });
});

// Social Battery Slider -> Mood-Adaptive Theme
const batterySlider = document.getElementById("battery-slider");
const batteryLabel = document.getElementById("battery-label");
const moodHint = document.getElementById("mood-hint");

batterySlider.addEventListener("input", (e) => {
  const val = Number(e.target.value);
  const html = document.documentElement;

  if (val <= 30) {
    html.dataset.mood = "low";
    batteryLabel.textContent = `${val}% · Deep Silence`;
    moodHint.textContent = "Dimmed midnight palette. Zero notifications, pure solitude.";
  } else if (val <= 70) {
    html.dataset.mood = "gentle";
    batteryLabel.textContent = `${val}% · Gentle Company`;
    moodHint.textContent = "Balanced sage palette. Whisper chat unlocks during breaks.";
  } else {
    html.dataset.mood = "warm";
    batteryLabel.textContent = `${val}% · Open to Break Chat`;
    moodHint.textContent = "Warm amber palette. Ready for light 5-minute break check-ins.";
  }
});

// --- 2. Room Switcher ---
const ROOM_TITLES = {
  library: "Midnight Rain Library · Quiet Focus",
  tea: "Warm Tea Corner · Slow & Cozy",
  desk: "Quiet Coding Desk · Deep Flow",
};

document.querySelectorAll(".room-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".room-pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    document.getElementById("room-vibe-title").textContent = ROOM_TITLES[pill.dataset.room];
  });
});

// --- 3. Procedural Web Audio Ambient Soundboard ---
let audioCtx = null;
const activeNodes = {};

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function createNoiseBuffer(type) {
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = buffer.getChannelData(0);
  let lastOut = 0.0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    if (type === "hum") {
      // Brown noise approximation
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.2;
    } else if (type === "hearth") {
      // Soft crackle + warm low pass
      output[i] = Math.random() > 0.996 ? (Math.random() * 2 - 1) * 0.8 : white * 0.08;
    } else {
      // Rain pink-ish noise
      output[i] = white * 0.35;
    }
  }
  return buffer;
}

function setSoundVolume(sound, percent) {
  const vol = percent / 100;
  if (vol === 0) {
    if (activeNodes[sound]) {
      activeNodes[sound].gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.08);
    }
    return;
  }

  initAudio();

  if (!activeNodes[sound]) {
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    gain.connect(audioCtx.destination);

    if (sound === "pad") {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.value = 174.61; // F3 soothing drone
      osc2.frequency.value = 261.63; // C4 fifth
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 380;
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      osc1.start();
      osc2.start();
    } else {
      const source = audioCtx.createBufferSource();
      source.buffer = createNoiseBuffer(sound);
      source.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = sound === "rain" ? 1100 : sound === "hearth" ? 750 : 260;

      source.connect(filter);
      filter.connect(gain);
      source.start();
    }

    activeNodes[sound] = { gain };
  }

  const maxGain = sound === "pad" ? 0.12 : 0.28;
  activeNodes[sound].gain.gain.setTargetAtTime(vol * maxGain, audioCtx.currentTime, 0.1);
}

document.querySelectorAll(".sound-slider").forEach((slider) => {
  slider.addEventListener("input", (e) => {
    const sound = e.target.dataset.sound;
    const val = Number(e.target.value);
    document.getElementById(`val-${sound}`).textContent = `${val}%`;
    setSoundVolume(sound, val);
  });
});

document.getElementById("mute-all-btn").addEventListener("click", () => {
  document.querySelectorAll(".sound-slider").forEach((slider) => {
    slider.value = 0;
    const sound = slider.dataset.sound;
    document.getElementById(`val-${sound}`).textContent = "0%";
    setSoundVolume(sound, 0);
  });
});

// --- 4. Gentle Flow Timer & Singing Bowl Chime ---
let totalSeconds = 25 * 60;
let remainingSeconds = totalSeconds;
let timerInterval = null;
let isBreakMode = false;

const readout = document.getElementById("timer-readout");
const phaseEl = document.getElementById("timer-phase");
const startPauseBtn = document.getElementById("start-pause-btn");
const ringProgress = document.getElementById("ring-progress");
const CIRCUMFERENCE = 2 * Math.PI * 102;

function playGentleChime() {
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(528, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.5);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 2.5);
}

function updateTimerUI() {
  const mins = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const secs = String(remainingSeconds % 60).padStart(2, "0");
  readout.textContent = `${mins}:${secs}`;

  const progress = (totalSeconds - remainingSeconds) / totalSeconds;
  ringProgress.style.strokeDashoffset = CIRCUMFERENCE * progress;
}

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    startPauseBtn.textContent = "Start Quiet Session";

    document.querySelectorAll(".preset-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const mins = Number(btn.dataset.mins);
    isBreakMode = mins === 10;
    phaseEl.textContent = isBreakMode ? "Rest & Recharge" : "Focus Session";
    totalSeconds = mins * 60;
    remainingSeconds = totalSeconds;
    updateTimerUI();
    setChatUnlocked(isBreakMode);
  });
});

startPauseBtn.addEventListener("click", () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    startPauseBtn.textContent = "Resume Session";
  } else {
    startPauseBtn.textContent = "Pause";
    timerInterval = setInterval(() => {
      if (remainingSeconds > 0) {
        remainingSeconds--;
        updateTimerUI();
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        startPauseBtn.textContent = "Start Quiet Session";
        playGentleChime();
        setChatUnlocked(true);
      }
    }, 1000);
  }
});

document.getElementById("reset-timer-btn").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
  remainingSeconds = totalSeconds;
  startPauseBtn.textContent = "Start Quiet Session";
  updateTimerUI();
});

// --- 5. Auto-Saving Private Scratchpad ---
const scratchpad = document.getElementById("scratchpad");
const saveIndicator = document.getElementById("save-indicator");
scratchpad.value = localStorage.getItem("quiet_rooms_notes") || "";

scratchpad.addEventListener("input", () => {
  saveIndicator.textContent = "Saving...";
  localStorage.setItem("quiet_rooms_notes", scratchpad.value);
  setTimeout(() => {
    saveIndicator.textContent = "Saved";
  }, 350);
});

// --- 6. Passive Roommates & Break Whisper Chat ---
const simulatedPeers = [
  { id: 1, name: "MistyOwl", avatar: "🦉", status: "Debugging Python", glows: 3, glowed: false },
  { id: 2, name: "PaperFern", avatar: "🌿", status: "UI Wireframing", glows: 5, glowed: false },
  { id: 3, name: "LunarTea", avatar: "🍵", status: "Reading a novel", glows: 2, glowed: false },
  { id: 4, name: "CloudFinch", avatar: "☁️", status: "Journaling", glows: 4, glowed: false },
];

function renderRoommates() {
  const list = document.getElementById("roommates-list");
  const you = {
    id: 0,
    name: `${aliasInput.value.trim() || "QuietFox"} (You)`,
    avatar: avatarBtn.textContent,
    status: currentStatus,
    isSelf: true,
  };

  const all = [you, ...simulatedPeers];
  document.getElementById("room-count").textContent = all.length;

  list.innerHTML = all
    .map(
      (person) => `
      <li class="roommate-item">
        <div class="roommate-left">
          <span>${person.avatar}</span>
          <div class="roommate-meta">
            <span class="roommate-name">${person.name}</span>
            <span class="roommate-status">${person.status}</span>
          </div>
        </div>
        ${
          person.isSelf
            ? `<span class="subtle-tip">Present</span>`
            : `<button class="glow-btn ${person.glowed ? "glowed" : ""}" onclick="toggleGlow(${person.id})">✦ ${person.glows}</button>`
        }
      </li>
    `
    )
    .join("");
}

window.toggleGlow = function (id) {
  const peer = simulatedPeers.find((p) => p.id === id);
  if (!peer) return;
  peer.glowed = !peer.glowed;
  peer.glows += peer.glowed ? 1 : -1;
  renderRoommates();
};

// Whisper Chat Controls
const chatBadge = document.getElementById("chat-lock-badge");
const whisperFeed = document.getElementById("whisper-feed");
const whisperInput = document.getElementById("whisper-input");
const whisperSend = document.getElementById("whisper-send");
let chatPreviewOpen = false;

function setChatUnlocked(unlocked) {
  chatPreviewOpen = unlocked;
  whisperInput.disabled = !unlocked;
  whisperSend.disabled = !unlocked;

  if (unlocked) {
    chatBadge.textContent = "Break window open";
    chatBadge.classList.add("unlocked");
    whisperInput.placeholder = "Share a quiet win or tea refill...";
    if (whisperFeed.querySelector(".whisper-empty")) {
      whisperFeed.innerHTML = `
        <div class="whisper-msg"><strong>MistyOwl:</strong> Finally fixed that CSS alignment bug.</div>
        <div class="whisper-msg"><strong>LunarTea:</strong> Refilling my chamomile tea, hope everyone's focus went well.</div>
      `;
    }
  } else {
    chatBadge.textContent = "Locked during focus";
    chatBadge.classList.remove("unlocked");
    whisperInput.placeholder = "Break chat is resting...";
    whisperFeed.innerHTML = `
      <div class="whisper-empty">
        Chat rests while the focus timer runs so everyone can stay in flow. Switch to a Break or toggle preview below.
      </div>
    `;
  }
}

document.getElementById("toggle-break-preview").addEventListener("click", () => {
  setChatUnlocked(!chatPreviewOpen);
});

document.getElementById("whisper-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = whisperInput.value.trim();
  if (!text) return;

  const msg = document.createElement("div");
  msg.className = "whisper-msg";
  msg.innerHTML = `<strong>${aliasInput.value.trim() || "QuietFox"}:</strong> ${text}`;
  whisperFeed.appendChild(msg);
  whisperFeed.scrollTop = whisperFeed.scrollHeight;
  whisperInput.value = "";
});

// Initial render
renderRoommates();
updateTimerUI();