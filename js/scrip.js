// ---- Datos (formato JSON) ----
const QUESTIONS = [
  { "question": "¿Qué componente enfría el motor?", "options": ["Alternador", "Radiador", "Carburador", "Embrague"], "answer": 1 },
  { "question": "¿Qué pedal se usa para cambiar de marcha en un carro manual?", "options": ["Embrague", "Freno", "Acelerador", "Freno de mano"], "answer": 0 },
  { "question": "¿Qué mide el tacómetro?", "options": ["La velocidad", "La temperatura", "Las revoluciones del motor (RPM)", "El nivel de combustible"], "answer": 2 },
  { "question": "¿Qué líquido lubrica las piezas internas del motor?", "options": ["Refrigerante", "Líquido de frenos", "Agua", "Aceite"], "answer": 3 },
  { "question": "¿Qué pieza recarga la batería mientras el motor funciona?", "options": ["Alternador", "Bujía", "Radiador", "Silenciador"], "answer": 0 },
  { "question": "¿Qué significan las siglas ABS?", "options": ["Aceleración básica segura", "Sistema antibloqueo de frenos", "Amortiguador de baja suspensión", "Alineación y balanceo seguro"], "answer": 1 },
  { "question": "¿Qué combustible usa un motor diésel?", "options": ["Gasolina", "Gas natural", "Diésel (ACPM)", "Etanol puro"], "answer": 2 },
  { "question": "¿Cuántos tiempos tiene el ciclo de un motor de gasolina convencional?", "options": ["2", "3", "6", "4"], "answer": 3 },
  { "question": "¿Qué indica la luz roja con forma de aceitera en el tablero?", "options": ["Baja presión de aceite", "Llantas desinfladas", "Puerta abierta", "Tanque lleno"], "answer": 0 },
  { "question": "¿Cuál es la función del catalizador?", "options": ["Aumentar la potencia", "Reducir los gases contaminantes del escape", "Enfriar el aceite", "Cargar la batería"], "answer": 1 }
];
const TIME_PER_QUESTION = 60;
const LETTERS = ["A", "B", "C", "D"];

// ---- Estado ----
const State = { index: 0, score: 0, results: [], locked: false, timeLeft: TIME_PER_QUESTION, interval: null, nextTimeout: null };

// ---- Utilidades de interfaz ----
const $ = id => document.getElementById(id);
const UI = {
  show(section) {
    ["intro", "quiz", "results"].forEach(s => $(s).hidden = s !== section);
  },
  renderQuestion() {
    const q = QUESTIONS[State.index];
    $("progress").textContent = `Pregunta ${State.index + 1} de ${QUESTIONS.length}`;
    $("score").textContent = `Puntaje: ${State.score}`;
    $("timer").textContent = `Tiempo: ${State.timeLeft}s`;
    $("question").textContent = q.question;
    $("feedback").textContent = "";
    $("next").hidden = true;
    const box = $("options");
    box.replaceChildren();
    q.options.forEach((text, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = `${LETTERS[i]}. ${text}`;
      b.onclick = () => Quiz.choose(i);
      box.appendChild(b);
    });
    $("question").focus?.();
  },
  markAnswers(chosen) {
    const q = QUESTIONS[State.index];
    [...$("options").children].forEach((b, i) => {
      b.disabled = true;
      if (i === q.answer) { b.classList.add("correct"); if (i !== chosen) b.textContent += "  ✓ Correcta"; }
      if (i === chosen && i !== q.answer) { b.classList.add("wrong"); b.textContent += "  ✗ Incorrecta"; }
    });
    $("score").textContent = `Puntaje: ${State.score}`;
  },
  renderResults() {
    $("finalScore").textContent = `Puntaje final: ${State.score} (aciertos: ${State.results.filter(r => r.status === "ok").length} de ${QUESTIONS.length})`;
    const list = $("review");
    list.replaceChildren();
    QUESTIONS.forEach((q, i) => {
      const r = State.results[i];
      const li = document.createElement("li");
      const label = { ok: "✓ Correcta", bad: "✗ Incorrecta", timeout: "✗ Tiempo agotado (-1)" }[r.status];
      const mine = r.chosen === null ? "Sin respuesta" : q.options[r.chosen];
      li.innerHTML = "<strong></strong><br><span></span><br><span></span>";
      li.children[0].textContent = q.question;
      li.children[2].textContent = `Su respuesta: ${mine}`;
      li.children[4].textContent = `Correcta: ${q.options[q.answer]}`;
      li.children[2].className = r.status === "ok" ? "ok" : "bad";
      li.children[2].textContent += ` — ${label}`;
      list.appendChild(li);
    });
  }
};

// ---- Lógica del quiz ----
const Quiz = {
  start() {
    Object.assign(State, { index: 0, score: 0, results: [] });
    UI.show("quiz");
    this.load();
  },
  load() {
    clearTimeout(State.nextTimeout);
    State.locked = false;
    State.timeLeft = TIME_PER_QUESTION;
    UI.renderQuestion();
    clearInterval(State.interval);
    State.interval = setInterval(() => this.tick(), 1000);
  },
  tick() {
    State.timeLeft--;
    $("timer").textContent = `Tiempo: ${State.timeLeft}s`;
    if (State.timeLeft <= 0) this.timeout();
  },
  choose(i) {
    if (State.locked) return;
    State.locked = true;
    clearInterval(State.interval);
    const ok = i === QUESTIONS[State.index].answer;
    if (ok) State.score++;
    State.results.push({ chosen: i, status: ok ? "ok" : "bad" });
    UI.markAnswers(i);
    $("feedback").textContent = ok ? "¡Correcto! +1 punto" : "Incorrecto. La respuesta correcta está marcada en verde.";
    const last = State.index === QUESTIONS.length - 1;
    $("next").textContent = last ? "Ver resultados" : "Siguiente";
    $("next").hidden = false;
    $("next").focus();
  },
  timeout() {
    if (State.locked) return;
    State.locked = true;
    clearInterval(State.interval);
    State.score--;
    State.results.push({ chosen: null, status: "timeout" });
    UI.markAnswers(null);
    $("feedback").textContent = "Tiempo agotado: -1 punto. Pasando a la siguiente...";
    State.nextTimeout = setTimeout(() => this.next(), 2500);
  },
  next() {
    State.index++;
    if (State.index >= QUESTIONS.length) this.finish(); else this.load();
  },
  finish() {
    clearInterval(State.interval);
    UI.renderResults();
    UI.show("results");
  }
};

// ---- Eventos ----
$("start").onclick = () => Quiz.start();
$("next").onclick = () => Quiz.next();
$("restart").onclick = () => Quiz.start();