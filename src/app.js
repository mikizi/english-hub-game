const STORAGE_KEYS = {
  legacyWords: "eduWords_v2",
  wordLists: "eduWordLists_v1",
  settings: "eduSettings_v2"
};

const DATA_VERSION = "pwa-2";
const WORD_LISTS_URL = `data/word-lists.json?v=${DATA_VERSION}`;

const fallbackWordLists = [
  {
    id: "weather-test",
    name: "מבחן מזג אוויר ועונות",
    description: "רשימת המילים המקורית לתרגול כתיבה, בחירה מהירה ומשחק זיכרון.",
    words: [
      { en: "hot", he: "חם", icon: "🔥", mustSpell: true },
      { en: "cold", he: "קר", icon: "❄️", mustSpell: true },
      { en: "warm", he: "חמים", icon: "🌤️", mustSpell: true },
      { en: "snow", he: "שלג", icon: "☃️", mustSpell: true },
      { en: "old", he: "זקן / ישן", icon: "👴", mustSpell: true },
      { en: "nose", he: "אף", icon: "👃", mustSpell: false },
      { en: "winter", he: "חורף", icon: "🌨️", mustSpell: false },
      { en: "spring", he: "אביב", icon: "🌸", mustSpell: false },
      { en: "summer", he: "קיץ", icon: "☀️", mustSpell: false },
      { en: "autumn", he: "סתיו", icon: "🍂", mustSpell: false }
    ]
  },
  {
    id: "spelling-test",
    name: "מילים שחובה לאיית",
    description: "רשימה קצרה שמכילה רק מילים שמסומנות כחובה להכתבה.",
    words: [
      { en: "hot", he: "חם", icon: "🔥", mustSpell: true },
      { en: "cold", he: "קר", icon: "❄️", mustSpell: true },
      { en: "warm", he: "חמים", icon: "🌤️", mustSpell: true },
      { en: "snow", he: "שלג", icon: "☃️", mustSpell: true },
      { en: "old", he: "זקן / ישן", icon: "👴", mustSpell: true }
    ]
  }
];

const defaultSettings = {
  showIcons: true,
  showGhost: true,
  defaultListId: "weather-test",
  selectedListId: "weather-test"
};

let wordLists = [];
let appSettings = normalizeSettings(readJson(STORAGE_KEYS.settings, defaultSettings));

const state = {
  currentMode: "home",
  activeList: [],
  currentIdx: 0,
  score: 0,
  memoryFlipped: [],
  memoryMatched: 0
};

const elements = {
  globalScore: document.getElementById("global-score"),
  globalProgress: document.getElementById("global-progress"),
  progressPercent: document.getElementById("progress-percent"),
  playerIndicatorText: document.getElementById("player-indicator-text"),
  playerIndicatorIcon: document.getElementById("player-indicator-icon"),
  wordListSelect: document.getElementById("word-list-select"),
  wordListDescription: document.getElementById("word-list-description"),
  wordListReference: document.getElementById("word-list-reference"),
  adminWordList: document.getElementById("admin-word-list"),
  addWordForm: document.getElementById("add-word-form"),
  addEn: document.getElementById("add-en"),
  addHe: document.getElementById("add-he"),
  addIcon: document.getElementById("add-icon"),
  addMustSpell: document.getElementById("add-mustSpell"),
  settingsShowIcons: document.getElementById("settings-show-icons"),
  settingsShowGhost: document.getElementById("settings-show-ghost"),
  settingsDefaultList: document.getElementById("settings-default-list"),
  adminActiveListName: document.getElementById("admin-active-list-name"),
  adminActiveListCount: document.getElementById("admin-active-list-count"),
  spellIcon: document.getElementById("spell-icon"),
  spellHe: document.getElementById("spell-he"),
  spellInput: document.getElementById("spell-input"),
  spellGhost: document.getElementById("spell-ghost"),
  quizIcon: document.getElementById("quiz-icon"),
  quizEn: document.getElementById("quiz-en"),
  quizOptions: document.getElementById("quiz-options"),
  memoryProgress: document.getElementById("memory-progress"),
  memoryGrid: document.getElementById("memory-grid"),
  speakCurrentWord: document.getElementById("speak-current-word")
};

document.addEventListener("click", (event) => {
  const screenButton = event.target.closest("[data-screen]");
  if (screenButton) {
    showScreen(screenButton.dataset.screen);
    return;
  }

  const modeButton = event.target.closest("[data-mode]");
  if (modeButton) {
    startMode(modeButton.dataset.mode);
  }
});

document.addEventListener("change", (event) => {
  const setting = event.target.dataset.setting;
  if (setting) {
    appSettings[setting] = event.target.checked;
    saveSettings();
    updateAdminUI();
    return;
  }

  if (event.target === elements.wordListSelect) {
    selectWordList(event.target.value);
    return;
  }

  if (event.target === elements.settingsDefaultList) {
    appSettings.defaultListId = event.target.value;
    selectWordList(event.target.value);
  }
});

elements.addWordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addNewWord();
});

elements.spellInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;

  const typedWord = event.target.value.trim().toLowerCase();
  const correctWord = state.activeList[state.currentIdx].en.toLowerCase();

  if (typedWord === correctWord) {
    state.score += 100;
    state.currentIdx += 1;
    updateScore();
    event.target.classList.add("border-[#1db954]");
    setTimeout(() => {
      event.target.classList.remove("border-[#1db954]");
      loadSpelling();
    }, 400);
    return;
  }

  event.target.classList.add("border-red-500", "shake");
  setTimeout(() => event.target.classList.remove("border-red-500", "shake"), 500);
});

elements.speakCurrentWord.addEventListener("click", speakCurrentWord);

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function normalizeSettings(settings) {
  return { ...defaultSettings, ...settings };
}

function saveWordLists() {
  localStorage.setItem(STORAGE_KEYS.wordLists, JSON.stringify(wordLists));
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(appSettings));
}

async function loadWordLists() {
  let bundledLists;

  try {
    const response = await fetch(WORD_LISTS_URL);
    if (!response.ok) throw new Error("Could not load word lists");
    const data = await response.json();
    bundledLists = await hydrateWordLists(readWordListIndex(data));
  } catch {
    bundledLists = sanitizeWordLists(fallbackWordLists);
  }

  const savedLists = readJson(STORAGE_KEYS.wordLists, null);
  if (Array.isArray(savedLists) && savedLists.length > 0) {
    wordLists = mergeWordLists(bundledLists, sanitizeWordLists(savedLists));
    saveWordLists();
    return;
  }

  wordLists = bundledLists;
  migrateLegacyWords();
}

function readWordListIndex(data) {
  if (Array.isArray(data?.lists)) return data.lists;

  if (data?.tests && typeof data.tests === "object") {
    return Object.entries(data.tests).map(([id, test]) => ({ id, ...test }));
  }

  return fallbackWordLists;
}

async function hydrateWordLists(lists) {
  const sanitizedLists = sanitizeWordLists(lists);

  return Promise.all(
    sanitizedLists.map(async (list) => {
      if (list.words.length > 0 || !list.wordsUrl) return list;

      try {
        const response = await fetch(withDataVersion(list.wordsUrl));
        if (!response.ok) throw new Error("Could not load test words");
        const data = await response.json();
        list.words = sanitizeWords(data.words || data);
        list.wordCount = list.words.length;
      } catch {
        list.words = [];
      }

      return list;
    })
  );
}

function withDataVersion(url) {
  return `${url}${url.includes("?") ? "&" : "?"}v=${DATA_VERSION}`;
}

function sanitizeWordLists(lists) {
  return (Array.isArray(lists) ? lists : fallbackWordLists)
    .filter((list) => list && list.id && list.name)
    .map((list) => {
      const words = sanitizeWords(list.words);

      return {
        id: String(list.id),
        name: String(list.name),
        description: String(list.description || ""),
        reference: sanitizeReference(list.reference),
        wordCount: Number(list.wordCount) || words.length,
        wordsUrl: String(list.wordsUrl || ""),
        words
      };
    });
}

function sanitizeWords(words) {
  return (Array.isArray(words) ? words : [])
    .filter((word) => word && word.en && word.he)
    .map((word) => ({
      en: String(word.en).trim(),
      he: String(word.he).trim(),
      icon: String(word.icon || "").trim(),
      mustSpell: Boolean(word.mustSpell)
    }));
}

function sanitizeReference(reference) {
  if (!reference || !reference.url) return null;

  return {
    label: String(reference.label || "חומר עזר"),
    url: String(reference.url)
  };
}

function mergeWordLists(bundledLists, savedLists) {
  const listsById = new Map();
  bundledLists.forEach((list) => listsById.set(list.id, list));
  savedLists.forEach((list) => {
    const bundledList = listsById.get(list.id);
    listsById.set(list.id, {
      ...bundledList,
      ...list,
      reference: list.reference || bundledList?.reference || null
    });
  });
  return [...listsById.values()];
}

function migrateLegacyWords() {
  const legacyWords = readJson(STORAGE_KEYS.legacyWords, null);
  if (!Array.isArray(legacyWords) || legacyWords.length === 0) return;

  const legacyListExists = wordLists.some((list) => list.id === "my-saved-words");
  if (legacyListExists) return;

  wordLists.push({
    id: "my-saved-words",
    name: "המילים שלי",
    description: "רשימה שנוצרה מהמילים שנשמרו בגרסה הקודמת של האפליקציה.",
    words: legacyWords
  });
  saveWordLists();
}

function syncSelectedList() {
  if (wordLists.length === 0) {
    wordLists = sanitizeWordLists(fallbackWordLists);
  }

  const defaultExists = wordLists.some((list) => list.id === appSettings.defaultListId);

  if (!defaultExists) {
    appSettings.defaultListId = wordLists[0].id;
  }

  appSettings.selectedListId = appSettings.defaultListId;

  saveSettings();
}

function getCurrentList() {
  return wordLists.find((list) => list.id === appSettings.selectedListId) || wordLists[0];
}

function getWords() {
  return getCurrentList().words;
}

function selectWordList(listId) {
  if (!wordLists.some((list) => list.id === listId)) return;

  appSettings.selectedListId = listId;
  saveSettings();
  renderListControls();
  updateAdminUI();
  updateProgress(0, `נבחרה רשימה: ${getCurrentList().name}`, "📚");
}

function renderListControls() {
  const currentList = getCurrentList();

  renderSelectOptions(elements.wordListSelect, appSettings.selectedListId);
  renderSelectOptions(elements.settingsDefaultList, appSettings.defaultListId);
  elements.wordListDescription.textContent = currentList.description || `${currentList.words.length} מילים לתרגול`;
  renderReferenceLink(currentList);
}

function renderReferenceLink(list) {
  if (!list.reference) {
    elements.wordListReference.classList.add("hidden");
    elements.wordListReference.removeAttribute("href");
    return;
  }

  elements.wordListReference.href = list.reference.url;
  elements.wordListReference.textContent = `פתח ${list.reference.label}`;
  elements.wordListReference.classList.remove("hidden");
}

function renderSelectOptions(select, selectedValue) {
  select.innerHTML = "";
  wordLists.forEach((list) => {
    const option = document.createElement("option");
    option.value = list.id;
    option.textContent = `${list.name} (${list.words.length})`;
    option.selected = list.id === selectedValue;
    select.appendChild(option);
  });
}

function showScreen(id) {
  state.currentMode = id;
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.add("hidden"));
  document.getElementById(`screen-${id}`).classList.remove("hidden");
  window.scrollTo(0, 0);

  if (id === "home") {
    updateProgress(0, `מוכן לתרגול: ${getCurrentList().name}`, "⭐");
  }

  if (id === "admin") {
    updateAdminUI();
  }
}

function updateAdminUI() {
  const currentList = getCurrentList();
  const words = getWords();

  elements.settingsShowIcons.checked = appSettings.showIcons;
  elements.settingsShowGhost.checked = appSettings.showGhost;
  elements.adminActiveListName.textContent = currentList.name;
  elements.adminActiveListCount.textContent = `${words.length} מילים ברשימה`;
  renderListControls();
  elements.adminWordList.innerHTML = "";

  words.forEach((word, index) => {
    const card = document.createElement("article");
    card.className = "spotify-card p-6 rounded-3xl flex justify-between items-center";
    card.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="text-3xl">${word.icon || "📝"}</div>
        <div>
          <p class="font-black text-lg uppercase leading-none mb-1">${word.en}</p>
          <p class="text-gray-500 font-bold">${word.he}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        ${word.mustSpell ? '<span class="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded-lg font-black">Spelling</span>' : ""}
        <button type="button" class="delete-word w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all" aria-label="מחק מילה">✕</button>
      </div>
    `;
    card.querySelector(".delete-word").addEventListener("click", () => deleteWord(index));
    elements.adminWordList.appendChild(card);
  });
}

function addNewWord() {
  const en = elements.addEn.value.trim();
  const he = elements.addHe.value.trim();
  const icon = elements.addIcon.value.trim();
  const mustSpell = elements.addMustSpell.checked;

  if (!en || !he) return;

  getWords().push({ en, he, icon, mustSpell });
  saveWordLists();
  updateAdminUI();
  elements.addWordForm.reset();
  elements.addEn.focus();
}

function deleteWord(index) {
  getWords().splice(index, 1);
  saveWordLists();
  updateAdminUI();
}

function startMode(mode) {
  const words = getWords();

  state.currentIdx = 0;
  state.memoryMatched = 0;
  state.memoryFlipped = [];

  if (mode === "spelling") {
    state.activeList = words.filter((word) => word.mustSpell);
    if (state.activeList.length === 0) {
      alert("צריך להוסיף מילים להכתבה בניהול!");
      return;
    }
    showScreen("spelling");
    loadSpelling();
  }

  if (mode === "quiz") {
    state.activeList = [...words].sort(() => Math.random() - 0.5);
    if (state.activeList.length === 0) {
      alert("צריך לבחור רשימה עם מילים!");
      return;
    }
    showScreen("quiz");
    loadQuiz();
  }

  if (mode === "memory") {
    state.activeList = [...words].sort(() => Math.random() - 0.5).slice(0, 8);
    if (state.activeList.length === 0) {
      alert("צריך לבחור רשימה עם מילים!");
      return;
    }
    showScreen("memory");
    initMemory();
  }
}

function loadSpelling() {
  if (state.currentIdx >= state.activeList.length) {
    finishGame();
    return;
  }

  const word = state.activeList[state.currentIdx];
  elements.spellHe.textContent = word.he;
  elements.spellIcon.textContent = appSettings.showIcons ? word.icon || "" : "";
  elements.spellGhost.textContent = appSettings.showGhost ? word.en : "";
  elements.spellInput.value = "";
  elements.spellInput.focus();

  updateProgress(
    (state.currentIdx / state.activeList.length) * 100,
    `מתרגלים כתיבה: ${word.en}`,
    appSettings.showIcons ? word.icon || "✍️" : "✍️"
  );
  speak(word.en);
}

function loadQuiz() {
  if (state.currentIdx >= state.activeList.length) {
    finishGame();
    return;
  }

  const words = getWords();
  const currentWord = state.activeList[state.currentIdx];
  elements.quizEn.textContent = currentWord.en;
  elements.quizIcon.textContent = appSettings.showIcons ? currentWord.icon || "❓" : "❓";

  updateProgress((state.currentIdx / state.activeList.length) * 100, `מה הפירוש של ${currentWord.en}?`, "❓");
  speak(currentWord.en);

  const options = [currentWord.he];
  const otherAnswers = words.filter((word) => word.he !== currentWord.he).map((word) => word.he);

  while (options.length < 4 && otherAnswers.length > 0) {
    const randomIndex = Math.floor(Math.random() * otherAnswers.length);
    options.push(otherAnswers.splice(randomIndex, 1)[0]);
  }

  elements.quizOptions.innerHTML = "";
  options
    .sort(() => Math.random() - 0.5)
    .forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "spotify-card p-6 md:p-8 rounded-3xl text-2xl md:text-3xl font-black hover:bg-[#1db954] hover:text-black transition-all border-none shadow-xl";
      button.textContent = option;
      button.addEventListener("click", () => handleQuizAnswer(button, option, currentWord));
      elements.quizOptions.appendChild(button);
    });
}

function handleQuizAnswer(button, selectedOption, currentWord) {
  if (selectedOption === currentWord.he) {
    state.score += 50;
    state.currentIdx += 1;
    updateScore();
    loadQuiz();
    return;
  }

  button.classList.add("bg-red-500/20", "text-red-500");
  button.disabled = true;
}

function initMemory() {
  const cards = state.activeList.flatMap((word, index) => [
    { id: index, text: word.en, type: "en", icon: word.icon },
    { id: index, text: word.he, type: "he", icon: word.icon }
  ]);

  elements.memoryProgress.textContent = `מצאת 0 מתוך ${state.activeList.length} זוגות`;
  elements.memoryGrid.innerHTML = "";

  cards
    .sort(() => Math.random() - 0.5)
    .forEach((cardData) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "card-container group";
      card.innerHTML = `
        <span class="card-inner">
          <span class="card-front">?</span>
          <span class="card-back">
            <span class="text-2xl mb-2">${appSettings.showIcons ? cardData.icon || "" : ""}</span>
            <span class="text-lg font-black uppercase text-center">${cardData.text}</span>
          </span>
        </span>
      `;
      card.addEventListener("click", () => flipMemoryCard(card, cardData));
      elements.memoryGrid.appendChild(card);
    });
}

function flipMemoryCard(card, cardData) {
  if (
    state.memoryFlipped.length >= 2 ||
    card.classList.contains("flipped") ||
    card.classList.contains("matched")
  ) {
    return;
  }

  card.classList.add("flipped");
  if (cardData.type === "en") speak(cardData.text);
  state.memoryFlipped.push({ el: card, data: cardData });

  if (state.memoryFlipped.length === 2) {
    checkMemoryMatch();
  }
}

function checkMemoryMatch() {
  const [firstCard, secondCard] = state.memoryFlipped;

  if (firstCard.data.id === secondCard.data.id) {
    state.memoryMatched += 1;
    state.score += 150;
    updateScore();
    firstCard.el.classList.add("matched");
    secondCard.el.classList.add("matched");
    state.memoryFlipped = [];
    elements.memoryProgress.textContent = `מצאת ${state.memoryMatched} מתוך ${state.activeList.length} זוגות`;
    updateProgress((state.memoryMatched / state.activeList.length) * 100, "משחק זיכרון פעיל", "🃏");

    if (state.memoryMatched === state.activeList.length) {
      setTimeout(finishGame, 1000);
    }
    return;
  }

  setTimeout(() => {
    firstCard.el.classList.remove("flipped");
    secondCard.el.classList.remove("flipped");
    state.memoryFlipped = [];
  }, 1000);
}

function speak(text) {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const message = new SpeechSynthesisUtterance(text);
  message.lang = "en-US";
  message.rate = 0.8;
  window.speechSynthesis.speak(message);
}

function speakCurrentWord() {
  if (state.activeList[state.currentIdx]) {
    speak(state.activeList[state.currentIdx].en);
  }
}

function updateScore() {
  elements.globalScore.textContent = state.score;
}

function updateProgress(percent, text, icon) {
  elements.globalProgress.style.width = `${percent}%`;
  elements.progressPercent.textContent = `${Math.round(percent)}%`;
  elements.playerIndicatorText.textContent = text;
  elements.playerIndicatorIcon.textContent = icon;
}

function finishGame() {
  showScreen("home");
  updateProgress(100, "סיימת בהצלחה!", "🏆");
  speak("Excellent job! You are a champion!");
}

async function initApp() {
  await loadWordLists();
  syncSelectedList();
  renderListControls();
  updateAdminUI();
  showScreen("home");
}

initApp();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // The app still works if PWA registration is unavailable.
    });
  });
}
