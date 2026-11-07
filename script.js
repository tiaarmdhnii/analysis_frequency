// Frekuensi baku bahasa Inggris
const ENGLISH_FREQ = {
  E: 12.7,
  T: 9.1,
  A: 8.2,
  O: 7.5,
  I: 7.0,
  N: 6.7,
  S: 6.3,
  H: 6.1,
  R: 6.0,
  D: 4.3,
  L: 4.0,
  C: 2.8,
  U: 2.8,
  M: 2.4,
  W: 2.4,
  F: 2.2,
  G: 2.0,
  Y: 2.0,
  P: 1.9,
  B: 1.5,
  V: 1.0,
  K: 0.8,
  J: 0.15,
  X: 0.15,
  Q: 0.1,
  Z: 0.07,
};
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const ENG_ORDER = [...ALPHA].sort((a, b) => ENGLISH_FREQ[b] - ENGLISH_FREQ[a]);

// Teks asli (plaintext). Sandinya dibuat otomatis oleh program.
const PLAIN =
  "The Caesar cipher is one of the simplest and most widely known encryption techniques. " +
  "It is a type of substitution cipher in which each letter in the plaintext is replaced by a letter some fixed number of positions down the alphabet. " +
  "For example, with a left shift of three, D would be replaced by A, E would become B, and so on. " +
  "The method is named after Julius Caesar, who used it in his private correspondence to protect messages of military significance. " +
  "Is this method secure enough for modern communication? Indeed, it is utterly insecure by today's standards, as the entire key space consists of only twenty five possible shifts. " +
  "Due to this small key space, an attacker can easily brute force these types of ciphers by trying each possible shift until a readable plaintext emerges. " +
  "Still, it serves as a fundamental concept in learning cryptography and can be extended into more complex systems, such as the Vigenere cipher, which uses a more dynamic derivative of letter shifting methods. " +
  "Frequency analysis is the most powerful vehicle to exploit the weakness of this type of monoalphabetic substitution cipher. " +
  "Even though the original letters are mapped into different symbols, the relative proportion of each letter remains unchanged. " +
  "For example, in the English language, the letter E is always the most prevalent due to its frequent usage in common words like the, and, there, and many others. " +
  "By counting the characters, an analyst can compare the percentage of each letter against the standard distribution of English text. " +
  "When the most common letter in the message is matched with E, the next one with T, and the rest in order, many words begin to look familiar. " +
  "The remaining errors can then be fixed by hand, using short words such as the, and, of, to and in as helpful clues. " +
  "This process is a good reminder that information security depends on more than hiding the method. " +
  "A strong system must stay safe even when an enemy knows exactly how it works, and only the secret key remains unknown.";

// Kunci substitusi acak: huruf asli A..Z -> huruf sandi
const SUB_KEY = "QWERTYUIOPASDFGHJKLZXCVBNM";

function enkripsi(plain, fn) {
  return plain.replace(/[a-z]/gi, (ch) => {
    const up = ch.toUpperCase();
    const e = fn(up);
    return ch === up ? e : e.toLowerCase();
  });
}

let sortOrig = "BY_PERCENT";
let manualMap = {};
let currentPlain = null; // teks asli untuk sample (kunci jawaban), null jika teks sendiri
ALPHA.forEach((c) => (manualMap[c] = ""));

const txtCipher = document.getElementById("txt-cipher");
const txtPlain = document.getElementById("txt-plain");
const selSample = document.getElementById("selSample");
const statusBox = document.getElementById("status");
const canvas = document.getElementById("freqCanvas");
const ctx = canvas.getContext("2d");

// Grid input Manual Mapping
const mappingGrid = document.getElementById("mappingGrid");
ALPHA.forEach((char) => {
  const item = document.createElement("div");
  item.className = "mapping-item";
  const label = document.createElement("span");
  label.innerText = char;
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 1;
  input.id = `map-${char}`;
  input.addEventListener("input", (e) => onMapChange(char, e.target));
  item.appendChild(label);
  item.appendChild(input);
  mappingGrid.appendChild(item);
});

// Event listener
txtCipher.addEventListener("input", () => {
  // Teks diubah manual -> bukan sample lagi
  currentPlain = null;
  selSample.value = "custom";
  hideStatus();
  updateSemua();
});
selSample.addEventListener("change", () => loadSample(selSample.value));
window.addEventListener("resize", renderCanvas);
document.getElementById("shift").addEventListener("input", (e) => {
  let k = parseInt(e.target.value, 10);
  if (isNaN(k)) return;
  k = ((k % 26) + 26) % 26;
  terapkanCaesar(k);
});

// ---------- Helper ----------
function getCounts() {
  const counts = {};
  for (const ch of txtCipher.value.toUpperCase()) {
    if (ch >= "A" && ch <= "Z") counts[ch] = (counts[ch] || 0) + 1;
  }
  return counts;
}

function sortByCount(counts) {
  return [...ALPHA].sort(
    (a, b) => (counts[b] || 0) - (counts[a] || 0) || a.localeCompare(b),
  );
}

function getTopOrder(counts) {
  return sortOrig === "BY_PERCENT" ? sortByCount(counts) : [...ALPHA];
}

function syncInputs() {
  ALPHA.forEach(
    (c) => (document.getElementById(`map-${c}`).value = manualMap[c]),
  );
}

function updateSemua() {
  renderCanvas();
  dekripsiTeks();
}

function refresh() {
  syncInputs();
  updateSemua();
}

function showStatus(msg, type) {
  statusBox.textContent = msg;
  statusBox.className = `status show ${type}`;
}
function hideStatus() {
  statusBox.className = "status";
}

// ---------- Sample & teks ----------
function loadSample(id) {
  if (id === "1") {
    txtCipher.value = enkripsi(
      PLAIN,
      (u) => ALPHA[(u.charCodeAt(0) - 65 + 7) % 26],
    );
    currentPlain = PLAIN;
  } else if (id === "2") {
    txtCipher.value = enkripsi(PLAIN, (u) => SUB_KEY[u.charCodeAt(0) - 65]);
    currentPlain = PLAIN;
  } else {
    currentPlain = null;
  }
  hideStatus();
  resetMap();
}

function tulisSendiri() {
  selSample.value = "custom";
  currentPlain = null;
  txtCipher.value = "";
  hideStatus();
  resetMap();
  txtCipher.focus();
}

// ---------- Tab ----------
function showTab(name) {
  ["caesar", "random"].forEach((n) => {
    document.getElementById(`tab-${n}`).classList.toggle("active", n === name);
    document
      .getElementById(`panel-${n}`)
      .classList.toggle("active", n === name);
  });
}

// ---------- Sort & mapping ----------
function setSortOrig(mode) {
  sortOrig = mode;
  renderCanvas();
}

// Susun ulang huruf pengganti mengikuti urutan huruf asli yang tampil di grafik
function setSortSub(mode) {
  const order = getTopOrder(getCounts());
  const subs = mode === "BY_PERCENT" ? ENG_ORDER : [...ALPHA];
  order.forEach((c, i) => (manualMap[c] = subs[i]));
  refresh();
}

function onMapChange(char, input) {
  const v = input.value.toUpperCase().replace(/[^A-Z]/g, "");
  manualMap[char] = v;
  input.value = v;
  updateSemua();
}

// Reset = kosongkan semua pemetaan
function resetMap() {
  ALPHA.forEach((c) => (manualMap[c] = ""));
  refresh();
}

// Huruf sandi tersering -> E, berikutnya -> T, A, O, ...
function otomatisAssign() {
  const counts = getCounts();
  sortByCount(counts).forEach((c, i) => (manualMap[c] = ENG_ORDER[i]));
  refresh();
}

function acakMap() {
  const arr = [...ALPHA];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  ALPHA.forEach((c, i) => (manualMap[c] = arr[i]));
  refresh();
}

// Tombol Assign di tab Caesar: terapkan geser yang ada di kolom
function assignCaesar() {
  let k = parseInt(document.getElementById("shift").value, 10);
  if (isNaN(k)) k = 0;
  k = ((k % 26) + 26) % 26;
  document.getElementById("shift").value = k;
  terapkanCaesar(k);
}

// Caesar: huruf sandi digeser mundur sebanyak k
function terapkanCaesar(k) {
  ALPHA.forEach((c, i) => (manualMap[c] = ALPHA[(i - k + 26) % 26]));
  refresh();
}

// ---------- Finished! ----------
function selesai() {
  const cipher = txtCipher.value;
  const hasil = txtPlain.value;
  const total = (cipher.match(/[a-z]/gi) || []).length;
  if (total === 0) {
    showStatus("Pesan masih kosong. Isi atau pilih sample dulu.", "warn");
    return;
  }
  if (currentPlain) {
    let benar = 0;
    for (let i = 0; i < hasil.length; i++) {
      if (
        /[a-z]/i.test(currentPlain[i]) &&
        hasil[i].toUpperCase() === currentPlain[i].toUpperCase()
      )
        benar++;
    }
    const persen = Math.round((benar / total) * 100);
    if (benar === total) {
      showStatus(
        "Selamat! Pesan berhasil dipecahkan: 100% huruf sudah benar.",
        "ok",
      );
    } else {
      showStatus(
        `Belum tepat: ${benar} dari ${total} huruf benar (${persen}%). Perbaiki huruf yang salah lalu coba lagi.`,
        "warn",
      );
    }
  } else {
    const belum = (hasil.match(/_/g) || []).length;
    if (belum === 0) {
      showStatus(
        "Semua huruf sudah dipetakan. Periksa apakah hasilnya terbaca sebagai kalimat yang masuk akal.",
        "info",
      );
    } else {
      showStatus(
        `Masih ada ${belum} huruf yang belum dipetakan (ditandai _). Teks sendiri tidak punya kunci jawaban, jadi periksa hasilnya secara manual.`,
        "warn",
      );
    }
  }
}

// ---------- Dekripsi ----------
function dekripsiTeks() {
  let hasil = "";
  for (const char of txtCipher.value) {
    const upper = char.toUpperCase();
    if (/^[A-Z]$/.test(upper)) {
      const p = manualMap[upper];
      if (p) hasil += char === upper ? p : p.toLowerCase();
      else hasil += "_";
    } else {
      hasil += char;
    }
  }
  txtPlain.value = hasil;
}

// ---------- Grafik ----------
function renderCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);

  const counts = getCounts();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return;

  const urutanTop = getTopOrder(counts);
  const preview = {};
  sortByCount(counts).forEach((c, i) => (preview[c] = ENG_ORDER[i]));
  const marginL = 65;
  const barW = (w - marginL - 140) / 26;
  const midY = h / 2;
  const unit = (midY - 45) / 14.0;

  // Skala sumbu Y
  ctx.font = "10px Arial";
  ctx.fillStyle = "#555";
  ctx.textAlign = "right";
  [12, 10, 8, 6, 4, 2, 0].forEach((val) => {
    ctx.fillText(val + "%", marginL - 10, midY - 25 - val * unit + 3);
    ctx.fillText(val + "%", marginL - 10, midY + 25 + val * unit + 3);
  });

  // Label sumbu "Frequency"
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#555";
  ctx.translate(12, midY - 25 - 6 * unit);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Frequency", 0, 0);
  ctx.restore();
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#555";
  ctx.translate(12, midY + 25 + 6 * unit);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Frequency", 0, 0);
  ctx.restore();

  // Garis sumbu
  ctx.strokeStyle = "#dddddd";
  ctx.beginPath();
  ctx.moveTo(marginL, 10);
  ctx.lineTo(marginL, h - 10);
  ctx.stroke();

  // Label kiri
  ctx.textAlign = "right";
  ctx.font = "bold 11px Arial";
  ctx.fillStyle = "#ff9900";
  ctx.fillText("Original:", marginL - 10, midY - 8);
  ctx.fillStyle = "#00b4d8";
  ctx.fillText("Maps to:", marginL - 10, midY + 16);

  urutanTop.forEach((char, i) => {
    const x0 = marginL + i * barW;
    const cx = x0 + (barW - 3) / 2;
    const pct = ((counts[char] || 0) / total) * 100;
    const real = manualMap[char];
    const mapped = real || preview[char];
    const warna = real ? "#00b4d8" : "#8fd3e8";

    // Batang oranye (pesan asli)
    ctx.fillStyle = "#ff9900";
    ctx.fillRect(x0, midY - 25 - pct * unit, barW - 3, pct * unit);
    ctx.textAlign = "center";
    ctx.font = "bold 11px Arial";
    ctx.fillText(char, cx, midY - 8);

    // Kotak "Maps to" mengikuti pemetaan aktif
    ctx.fillStyle = warna;
    ctx.fillRect(x0 - 1, midY + 4, barW - 1, 16);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px Arial";
    ctx.fillText(mapped || "", cx, midY + 16);

    // Batang biru: frekuensi standar huruf pengganti
    if (mapped) {
      ctx.fillStyle = warna;
      ctx.fillRect(x0, midY + 25, barW - 3, (ENGLISH_FREQ[mapped] || 0) * unit);
    }
  });

  // Legenda
  ctx.textAlign = "left";
  ctx.font = "11px Arial";
  ctx.fillStyle = "#ff9900";
  ctx.fillRect(w - 130, 15, 12, 12);
  ctx.fillStyle = "#333";
  ctx.fillText("Original Message", w - 112, 25);
  ctx.fillStyle = "#00b4d8";
  ctx.fillRect(w - 130, 32, 12, 12);
  ctx.fillStyle = "#333";
  ctx.fillText("Standard English", w - 112, 42);
}

// Awal
loadSample("1");
