const $ = (id) => document.getElementById(id);
const messages = $("messages");
const statusEl = $("status");
const micButton = $("micButton");

function addMessage(text, who = "assistant") {
  const item = document.createElement("div");
  item.className = `message ${who}`;
  const avatar = document.createElement("span");
  avatar.textContent = who === "assistant" ? "J" : "Вы";
  const p = document.createElement("p");
  p.textContent = text;
  item.append(avatar, p);
  messages.append(item);
  messages.scrollTop = messages.scrollHeight;
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ru-RU";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

function reply(text, voice = true) {
  addMessage(text);
  if (voice) speak(text);
}

function runCommand(raw) {
  const command = raw.trim();
  if (!command) return;
  addMessage(command, "user");
  const q = command.toLowerCase().replace(/[!?.,]/g, "");

  if (q.includes("помощ") || q === "команды") {
    reply("Я умею сообщать время и дату, открывать YouTube, Google и Wikipedia, искать информацию в интернете и сохранять заметки. Например: «найди рецепт блинов» или «запомни купить молоко».");
  } else if (q.includes("который час") || q === "время") {
    reply("Сейчас " + new Intl.DateTimeFormat("ru-RU", { hour:"2-digit", minute:"2-digit" }).format(new Date()));
  } else if (q.includes("какое сегодня число") || q.includes("какая дата") || q === "дата") {
    reply("Сегодня " + new Intl.DateTimeFormat("ru-RU", { dateStyle:"full" }).format(new Date()));
  } else if (q.includes("открой youtube") || q.includes("открой ютуб")) {
    reply("Открываю YouTube.");
    window.open("https://www.youtube.com", "_blank", "noopener");
  } else if (q.includes("открой google") || q.includes("открой гугл")) {
    reply("Открываю Google.");
    window.open("https://www.google.com", "_blank", "noopener");
  } else if (q.includes("открой wikipedia") || q.includes("открой википедию")) {
    reply("Открываю Wikipedia.");
    window.open("https://ru.wikipedia.org", "_blank", "noopener");
  } else if (q.startsWith("найди ") || q.startsWith("поиск ")) {
    const query = command.replace(/^(найди|поиск)\s+/i, "");
    reply("Ищу в интернете: " + query);
    window.open("https://www.google.com/search?q=" + encodeURIComponent(query), "_blank", "noopener");
  } else if (q.startsWith("запомни ")) {
    const note = command.replace(/^запомни\s+/i, "");
    const notes = JSON.parse(localStorage.getItem("jarvis-notes") || "[]");
    notes.push({ text: note, date: new Date().toISOString() });
    localStorage.setItem("jarvis-notes", JSON.stringify(notes));
    reply("Сохранил заметку: " + note);
  } else if (q.includes("мои заметки") || q.includes("покажи заметки")) {
    const notes = JSON.parse(localStorage.getItem("jarvis-notes") || "[]");
    reply(notes.length ? "Твои заметки: " + notes.map((n, i) => `${i + 1}. ${n.text}`).join("; ") : "Пока заметок нет.");
  } else if (q.includes("привет")) {
    reply("Приветствую. Все системы в норме. Чем займёмся?");
  } else {
    reply("Пока я не знаю такую команду. Напиши «помощь», чтобы увидеть список доступных команд.", false);
  }
}

$("commandForm").addEventListener("submit", (event) => {
  event.preventDefault();
  runCommand($("commandInput").value);
  $("commandInput").value = "";
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "ru-RU";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => {
    statusEl.textContent = "СЛУШАЮ...";
    micButton.classList.add("listening");
  };
  recognition.onend = () => {
    statusEl.textContent = "СИСТЕМА ГОТОВА";
    micButton.classList.remove("listening");
  };
  recognition.onerror = () => reply("Не удалось распознать речь. Проверь разрешение на микрофон или введи команду текстом.", false);
  recognition.onresult = (event) => runCommand(event.results[0][0].transcript);
  micButton.addEventListener("click", () => recognition.start());
} else {
  micButton.addEventListener("click", () => reply("Голосовой ввод не поддерживается этим браузером. Используй текстовое поле."));
  statusEl.textContent = "ТЕКСТОВЫЙ РЕЖИМ";
}
