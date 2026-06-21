const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');

function readObject(name) {
  const start = html.indexOf(`const ${name} = {`);
  if (start < 0) throw new Error(`${name} is missing`);
  const bodyStart = html.indexOf('{', start);
  const bodyEnd = html.indexOf('\n};', bodyStart);
  if (bodyEnd < 0) throw new Error(`${name} is not terminated`);
  return Function(`"use strict"; return (${html.slice(bodyStart, bodyEnd + 2)});`)();
}

function normalizeArabic(text) {
  return String(text)
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/\u0671/g, '\u0627')
    .replace(/\s+/g, ' ')
    .trim();
}

const starts = readObject('SURAH_STARTS');
const verses = readObject('FIRST_VERSE');
const basmala = 'بسم الله الرحمن الرحيم';

for (let surah = 1; surah <= 114; surah++) {
  if (!Number.isInteger(starts[surah])) throw new Error(`Missing start page for surah ${surah}`);
  if (!verses[surah]) throw new Error(`Missing first verse for surah ${surah}`);
  if (surah > 1 && starts[surah] < starts[surah - 1]) {
    throw new Error(`Start pages are out of order at surah ${surah}`);
  }
  if (normalizeArabic(verses[surah]).startsWith(basmala)) {
    throw new Error(`Surah ${surah} incorrectly starts with the basmala`);
  }
  const expectedMarker = surah === 1 ? '۝٢' : '۝١';
  if (!verses[surah].endsWith(expectedMarker)) {
    throw new Error(`Surah ${surah} has the wrong first-verse marker`);
  }
}

const expected = {
  83: 'ويل للمطففين ١',
  95: 'والتين والزيتون ١',
};
for (const [surah, text] of Object.entries(expected)) {
  if (normalizeArabic(verses[surah]) !== text) {
    throw new Error(`Surah ${surah} has the wrong first verse`);
  }
}

const startSpan = surah => surah === 114 ? 1 : Math.max(1, starts[surah + 1] - starts[surah]);
if (startSpan(83) >= 3) throw new Error('Al-Mutaffifin must be a compact surah card');

console.log('Quran data audit passed: 114 surahs, first verses, markers, and compact spans.');
