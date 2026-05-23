// ═══════════════════════════════════════════════════════
// ANA GYM APP — Main Application Logic
// ═══════════════════════════════════════════════════════

// ── State ────────────────────────────────────────────
const STATE = {
  currentTab: 'today',
  planStartDate: null,
  currentWeek: 1,
  travelMode: false,
  travelStart: null,
  pausedWeek: null,
  cyclePhase: localStorage.getItem('cyclePhase') || 'follicular',
  notifTime: localStorage.getItem('notifTime') || '07:30',
  notifsEnabled: false,
  completedToday: JSON.parse(localStorage.getItem('completedToday') || '{}'),
  weights: JSON.parse(localStorage.getItem('weights') || '{}'),
  completedDays: JSON.parse(localStorage.getItem('completedDays') || '{}'),
  metrics: JSON.parse(localStorage.getItem('metrics') || '{}'),
  openVideos: {},
};

// ── Helpers ──────────────────────────────────────────
function save(key, val) { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); }

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function todayDow() { return new Date().getDay(); } // 0=Sun

function getFaseName(w) {
  if (w <= 8) return 'Fase 1 · Adaptación';
  if (w <= 17) return 'Fase 2 · Hipertrofia';
  return 'Fase 3 · Intensidad avanzada';
}

function getDayName(dow) {
  return ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][dow];
}
function getDayShort(dow) { return ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][dow]; }
function getMonthDay(date) {
  const d = new Date(date + 'T12:00:00');
  return `${d.getDate()} ${['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()]}`;
}

function computeWeek() {
  if (!STATE.planStartDate) return 1;
  const start = new Date(STATE.planStartDate + 'T00:00:00');
  const now = new Date();
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 7));
  let week = Math.max(1, Math.min(26, diff + 1));
  if (STATE.travelMode && STATE.pausedWeek) week = STATE.pausedWeek;
  return week;
}

function getCycleAdj() {
  return CYCLE_ADJUSTMENTS[STATE.cyclePhase] || CYCLE_ADJUSTMENTS.follicular;
}

function getWeightKey(exId, week) { return `${exId}_w${week}`; }

function getWeight(exId, week, progression) {
  const key = getWeightKey(exId, week);
  if (STATE.weights[key] !== undefined) return STATE.weights[key];
  if (!progression) return null;
  return getSuggestedWeight(progression, week);
}

function setWeight(exId, week, val) {
  const key = getWeightKey(exId, week);
  STATE.weights[key] = val;
  save('weights', STATE.weights);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Tab Navigation ───────────────────────────────────
function showTab(name, btn) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
  btn.classList.add('active');
  STATE.currentTab = name;
  renderTab(name);
}

function renderTab(name) {
  if (name === 'today') renderToday();
  else if (name === 'week') renderWeek();
  else if (name === 'progress') renderProgress();
  else if (name === 'profile') renderProfile();
}

// ══════════════════════════════════════════════════════
// SCREEN: HOY
// ══════════════════════════════════════════════════════
function renderToday() {
  const el = document.getElementById('screen-today');
  const dow = todayDow();
  const workout = DAY_WORKOUT_MAP[dow];
  const week = STATE.currentWeek;
  const fase = getFaseName(week);
  const dateStr = today();

  if (!workout) {
    el.innerHTML = `
      <div class="screen-header">
        <h1>${getDayName(dow)}</h1>
        <p>${fase} · Semana ${week}</p>
      </div>
      <div class="rest-screen">
        <div class="rest-emoji">😴</div>
        <div>
          <h2 style="font-family:var(--font-display);font-size:22px;font-weight:700">Día de descanso</h2>
          <p style="color:var(--text2);margin-top:8px;font-size:14px">El descanso es parte del plan.<br>Hoy tu cuerpo se recupera y crece.</p>
        </div>
        ${dow === 3 ? `<div class="cardio-card" style="width:100%;margin:0;text-align:left">
          <div class="cardio-title">🚶 Descanso activo (opcional)</div>
          <div class="cardio-desc">Caminata 20–30 min al aire libre o movilidad. Solo si el cuerpo lo pide.</div>
        </div>` : ''}
        <button class="btn btn-secondary" onclick="showTab('week',document.querySelectorAll('.tab')[1])">Ver semana completa</button>
      </div>`;
    return;
  }

  const adj = getCycleAdj();
  const done = STATE.completedDays[dateStr];
  const completedCount = Object.keys(STATE.completedToday).filter(k => k.startsWith(dateStr + '_') && STATE.completedToday[k]).length;
  const totalExercises = workout.exercises.filter(e => !e.isWarmup).length;

  el.innerHTML = `
    <div class="screen-header">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div class="today-day-label">${getDayName(dow)} · Semana ${week}</div>
          <h1 class="today-title">${workout.emoji} ${workout.name}</h1>
          <div class="today-subtitle">${workout.focus}</div>
        </div>
        <div style="text-align:right">
          <div class="pill ${done ? 'pill-green' : 'pill-gray'}">${done ? '✓ Completado' : workout.duration}</div>
        </div>
      </div>
    </div>

    <div class="today-stats">
      <div class="stat-box">
        <strong>${completedCount}/${totalExercises}</strong>
        <small>Ejercicios</small>
      </div>
      <div class="stat-box">
        <strong style="color:${adj.color}">${Math.round((adj.factor - 1) * 100) > 0 ? '+' : ''}${Math.round((adj.factor - 1) * 100)}%</strong>
        <small>Ciclo</small>
      </div>
      <div class="stat-box">
        <strong>S${week}</strong>
        <small>${getFaseName(week).split(' ')[0]} ${getFaseName(week).split(' ')[1]}</small>
      </div>
    </div>

    ${adj.factor !== 1 ? `
    <div style="margin:0 16px 12px;background:rgba(${adj.factor>1?'67,160,71':'229,57,53'},.1);border:1px solid rgba(${adj.factor>1?'67,160,71':'229,57,53'},.3);border-radius:12px;padding:12px 14px">
      <div style="font-size:12px;font-weight:600;color:${adj.color};margin-bottom:2px">${adj.label}</div>
      <div style="font-size:12px;color:var(--text2)">${adj.tip}</div>
    </div>` : ''}

    ${STATE.travelMode ? `<div class="pause-badge" style="margin:0 16px 12px">✈️ Plan pausado por viaje · Reanuda en semana ${STATE.pausedWeek}</div>` : ''}

    <div class="section-label">Ejercicios</div>
    ${workout.exercises.map(ex => renderExerciseCard(ex, week, dateStr, adj)).join('')}

    ${workout.cardio ? `
    <div class="section-label">Cardio post-sesión</div>
    <div class="cardio-card">
      <div class="cardio-title">🏃 ${workout.cardio.type} · ${workout.cardio.duration} min</div>
      <div class="cardio-desc">${workout.cardio.desc}</div>
    </div>` : ''}

    <div style="padding:8px 16px 4px">
      <button class="btn btn-primary btn-full" onclick="markDayComplete('${dateStr}')">
        ${done ? '✓ Sesión registrada' : '✅ Marcar sesión como completada'}
      </button>
    </div>
  `;
}

function renderExerciseCard(ex, week, dateStr, adj) {
  const doneKey = `${dateStr}_${ex.id}`;
  const isDone = STATE.completedToday[doneKey];
  const rawWeight = getWeight(ex.id, week, ex.progression);
  const adjWeight = rawWeight !== null && ex.progression ? Math.round(rawWeight * adj.factor * 2) / 2 : rawWeight;
  const videoOpen = STATE.openVideos[ex.id];

  const weightDisplay = ex.weightLabel
    ? ex.weightLabel
    : adjWeight !== null
      ? `${adjWeight} kg${adj.factor !== 1 && ex.progression ? ` <span style="font-size:13px;color:var(--text3)">(base: ${rawWeight} kg)</span>` : ''}`
      : '—';

  return `
  <div class="ex-card ${ex.isGlute ? 'glute' : ''} ${isDone ? 'completed' : ''}" id="excard-${ex.id}">
    <div class="ex-card-header" onclick="toggleExCard('${ex.id}')">
      <div class="ex-check ${isDone ? 'done' : ''}" onclick="event.stopPropagation();toggleExDone('${doneKey}','${ex.id}')">
        ${isDone ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
      </div>
      <div class="ex-info">
        <div class="ex-name">${ex.isGlute ? '🍑 ' : ''}${ex.name}</div>
        <div class="ex-equip">${ex.equipment}</div>
        <div class="ex-meta">
          <span class="pill pill-gray">${ex.sets} series</span>
          <span class="pill pill-gray">${ex.reps} reps</span>
          ${ex.tempo !== '—' ? `<span class="pill pill-gray">${ex.tempo}</span>` : ''}
          ${ex.rest !== '—' ? `<span class="pill pill-gray">⏱ ${ex.rest}</span>` : ''}
          ${ex.isWarmup ? '<span class="pill pill-gold">Calentamiento</span>' : ''}
        </div>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text3);flex-shrink:0;transform:rotate(${STATE.openCards && STATE.openCards[ex.id] ? 180 : 0}deg);transition:.2s"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    <div class="ex-body" id="exbody-${ex.id}" style="display:${STATE.openCards && STATE.openCards[ex.id] ? 'block' : 'none'}">
      <div class="ex-weight-row">
        <label>${ex.weightLabel ? ex.weightLabel : 'Peso sugerido:'}</label>
        ${ex.progression ? `
        <div style="flex:1">
          <div class="weight-display">${weightDisplay}</div>
        </div>
        <div class="weight-adj">
          <button class="weight-btn" onclick="adjustWeight('${ex.id}',${week},-0.5)">−</button>
          <input class="weight-input" type="number" step="0.5" value="${adjWeight || ''}"
            onchange="setWeight('${ex.id}',${week},parseFloat(this.value))"
            onclick="event.stopPropagation()" placeholder="kg">
          <button class="weight-btn" onclick="adjustWeight('${ex.id}',${week},0.5)">+</button>
        </div>` : `<div class="weight-display">${weightDisplay}</div>`}
      </div>
      <div class="ex-notes">${ex.notes}</div>
      ${EXERCISE_VIDEOS[ex.videoId] ? `
      <a href="https://www.youtube.com/watch?v=${EXERCISE_VIDEOS[ex.videoId]}" target="_blank" rel="noopener"
         style="display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:8px 14px;background:rgba(255,0,0,0.12);border:1px solid rgba(255,0,0,0.25);border-radius:8px;color:#ff4444;font-size:13px;font-weight:600;text-decoration:none;cursor:pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
        Ver ejercicio en YouTube
      </a>
      ` : ''}
    </div>
  </div>`;
}

// Track which cards are open
if (!window._openCards) window._openCards = {};
STATE.openCards = window._openCards;

function toggleExCard(id) {
  STATE.openCards[id] = !STATE.openCards[id];
  renderToday();
  // scroll to card
  setTimeout(() => {
    const el = document.getElementById(`excard-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 50);
}

function toggleVideo(id) {
  STATE.openVideos[id] = !STATE.openVideos[id];
  renderToday();
}

function toggleExDone(doneKey, exId) {
  STATE.completedToday[doneKey] = !STATE.completedToday[doneKey];
  if (STATE.completedToday[doneKey]) {
    showToast('💪 ¡Ejercicio completado!');
    STATE.openCards[exId] = false;
  }
  save('completedToday', STATE.completedToday);
  renderToday();
}

function adjustWeight(exId, week, delta) {
  const current = getWeight(exId, week, null) || 0;
  const newVal = Math.max(0, Math.round((current + delta) * 2) / 2);
  setWeight(exId, week, newVal);
  renderToday();
}

function markDayComplete(dateStr) {
  STATE.completedDays[dateStr] = true;
  save('completedDays', STATE.completedDays);
  showToast('🎉 ¡Sesión registrada! Excelente trabajo.');
  renderToday();
}

// ══════════════════════════════════════════════════════
// SCREEN: SEMANA
// ══════════════════════════════════════════════════════
function renderWeek() {
  const el = document.getElementById('screen-week');
  const week = STATE.currentWeek;
  const todayDowVal = todayDow();
  const todayStr = today();

  // Get this week's dates
  const now = new Date();
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - todayDowVal + i);
    const dow = i; // 0=Sun
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    weekDays.push({ dow, dateStr, d });
  }

  const completedThisWeek = weekDays.filter(wd => STATE.completedDays[wd.dateStr] && DAY_WORKOUT_MAP[wd.dow]).length;
  const workoutDays = weekDays.filter(wd => DAY_WORKOUT_MAP[wd.dow]).length;

  el.innerHTML = `
    <div class="screen-header">
      <h1>Esta semana</h1>
      <p>Semana ${week} · ${getFaseName(week)} · ${completedThisWeek}/${workoutDays} sesiones</p>
    </div>

    <div style="padding:0 16px 16px">
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:13px;color:var(--text2)">Progreso semanal</span>
          <span style="font-weight:600">${completedThisWeek}/${workoutDays}</span>
        </div>
        <div style="height:6px;background:var(--bg4);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${workoutDays ? (completedThisWeek/workoutDays*100) : 0}%;background:linear-gradient(90deg,var(--red),var(--gold));border-radius:3px;transition:width .6s"></div>
        </div>
      </div>
    </div>

    <div class="week-grid">
      ${weekDays.map(({ dow, dateStr, d }) => {
        const workout = DAY_WORKOUT_MAP[dow];
        const isToday = dateStr === todayStr;
        const isDone = STATE.completedDays[dateStr];
        const isRest = !workout;
        return `
        <div class="week-day ${isToday ? 'today' : ''} ${isRest ? 'rest-day' : ''} ${isDone ? 'done-day' : ''}"
             onclick="${!isRest ? `showDayDetail('${dateStr}',${dow})` : ''}">
          <div class="day-dot ${isToday ? 'today-dot' : ''}">
            <span style="font-size:10px;opacity:.7">${getDayShort(dow)}</span>
            <strong>${d.getDate()}</strong>
          </div>
          <div class="week-day-info">
            <div class="week-day-name">${workout ? workout.emoji + ' ' + workout.name : 'Descanso'}</div>
            <div class="week-day-sub">${workout ? workout.focus : dow === 3 ? 'Descanso activo opcional' : 'Recuperación'}</div>
          </div>
          <div class="week-done-badge">${isDone ? '✅' : isRest ? '—' : '○'}</div>
        </div>`;
      }).join('')}
    </div>
  `;
}

function showDayDetail(dateStr, dow) {
  // Navigate to today tab and scroll there
  showTab('today', document.querySelectorAll('.tab')[0]);
}

// ══════════════════════════════════════════════════════
// SCREEN: PROGRESO
// ══════════════════════════════════════════════════════
function renderProgress() {
  const el = document.getElementById('screen-progress');
  const week = STATE.currentWeek;
  const totalWeeks = 26;
  const pct = Math.round((week / totalWeeks) * 100);
  const m = STATE.metrics;

  el.innerHTML = `
    <div class="screen-header">
      <h1>Progreso</h1>
      <p>Semana ${week} de 26 · ${pct}% completado</p>
    </div>

    <div class="phase-bar">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-weight:600;font-size:14px">${getFaseName(week)}</span>
        <span class="pill pill-red">S${week}/26</span>
      </div>
      <div class="phase-track"><div class="phase-fill" style="width:${pct}%"></div></div>
      <div class="phase-labels">
        <span>F1: S1–8</span><span>F2: S9–17</span><span>F3: S18–26</span>
      </div>
    </div>

    <div class="section-label">Métricas corporales</div>
    <div style="margin:0 16px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:16px">
      <p style="font-size:12px;color:var(--text2);margin-bottom:12px">Actualiza cada 4 semanas, mismo día y hora</p>
      ${[
        ['Peso corporal', 'peso', 'kg', '48'],
        ['% Grasa corporal', 'grasa', '%', '21.9'],
        ['Masa muscular', 'musculo', 'kg', '35.6'],
        ['Perímetro glúteo', 'gluteo', 'cm', ''],
        ['Perímetro muslo', 'muslo', 'cm', ''],
        ['Bíceps contraído', 'biceps', 'cm', ''],
      ].map(([label, key, unit, placeholder]) => `
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:13px;color:var(--text2)">${label}</span>
            <span style="font-size:11px;color:var(--text3)">${unit}</span>
          </div>
          <input class="metric-input" type="number" step="0.1" placeholder="${placeholder || '—'}"
            value="${m[key] || ''}"
            onchange="saveMetric('${key}',this.value)" style="font-size:15px">
        </div>
      `).join('')}
      <button class="btn btn-secondary btn-full btn-sm" onclick="saveAllMetrics()">💾 Guardar métricas</button>
    </div>

    <div class="section-label">Récords de pesos clave</div>
    <div style="margin:0 16px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:16px">
      ${[
        ['hip-thrust', '🍑 Hip Thrust', { f1:[20,40], f2:[45,70], f3:[75,100] }],
        ['rdl', '🍑 Peso muerto RDL', { f1:[20,30], f2:[35,50], f3:[55,70] }],
        ['sentadilla-smith', 'Sentadilla Smith', { f1:[20,35], f2:[40,55], f3:[60,80] }],
        ['jalon', 'Jalón al pecho', { f1:[20,35], f2:[35,55], f3:[55,70] }],
        ['press-maquina', 'Press de pecho', { f1:[20,35], f2:[35,55], f3:[55,70] }],
      ].map(([id, name, prog]) => {
        const suggested = getSuggestedWeight(prog, week);
        const actual = STATE.weights[getWeightKey(id, week)];
        return `
        <div class="p-row">
          <span class="p-label">${name}</span>
          <div style="text-align:right">
            <div style="font-weight:600">${actual || suggested || '—'} kg</div>
            <div style="font-size:11px;color:var(--text3)">Meta S${week}: ${suggested} kg</div>
          </div>
        </div>`;
      }).join('')}
    </div>

    <div class="section-label">Sesiones completadas</div>
    <div style="margin:0 16px 16px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-family:var(--font-display);font-size:36px">${Object.values(STATE.completedDays).filter(Boolean).length}</div>
          <div style="color:var(--text2);font-size:13px">sesiones totales</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:var(--font-display);font-size:36px;color:var(--green)">${Math.round(Object.values(STATE.completedDays).filter(Boolean).length / Math.max(week,1) * 5)}/5</div>
          <div style="color:var(--text2);font-size:13px">promedio semanal</div>
        </div>
      </div>
    </div>
  `;
}

function saveMetric(key, val) {
  STATE.metrics[key] = parseFloat(val);
  save('metrics', STATE.metrics);
}
function saveAllMetrics() {
  save('metrics', STATE.metrics);
  showToast('📏 Métricas guardadas');
}

// ══════════════════════════════════════════════════════
// SCREEN: PERFIL
// ══════════════════════════════════════════════════════
function renderProfile() {
  const el = document.getElementById('screen-profile');
  const adj = getCycleAdj();
  const week = STATE.currentWeek;

  el.innerHTML = `
    <div class="screen-header">
      <h1>Perfil</h1>
      <p>Ciclo · Viajes · Recordatorios</p>
    </div>

    <!-- Ciclo Menstrual -->
    <div class="section-label">Fase del ciclo (Flo)</div>
    <div style="margin:0 16px 4px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:16px">
      <p style="font-size:12px;color:var(--text2);margin-bottom:12px">Selecciona tu fase actual para ajustar los pesos sugeridos</p>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${Object.entries(CYCLE_ADJUSTMENTS).map(([key, data]) => `
          <div class="cycle-phase" style="background:${key === STATE.cyclePhase ? data.color + '22' : 'var(--bg4)'};color:${data.color};border-color:${key === STATE.cyclePhase ? data.color : 'transparent'}"
               onclick="setCyclePhase('${key}')">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div class="cycle-phase-name">${data.label}</div>
              <div style="font-size:12px;font-weight:700">${data.factor >= 1 ? '+' : ''}${Math.round((data.factor-1)*100)}%</div>
            </div>
            ${key === STATE.cyclePhase ? `<div class="cycle-phase-tip">${data.tip}</div>` : ''}
          </div>`).join('')}
      </div>
    </div>

    <div class="cycle-adj">
      <strong style="color:${adj.color}">${Math.round(adj.factor*100)}%</strong>
      del peso base en todos los ejercicios de hoy
    </div>

    <!-- Modo Viaje -->
    <div class="section-label">Modo viaje ✈️</div>
    <div class="card">
      <div class="travel-header">
        <div class="travel-icon">✈️</div>
        <div>
          <div style="font-weight:600">Pausar el plan</div>
          <div style="font-size:12px;color:var(--text2)">El contador de semanas se congela</div>
        </div>
      </div>
      ${STATE.travelMode ? `
        <div class="pause-badge">Plan pausado · Semana ${STATE.pausedWeek} congelada</div>
        <p style="font-size:13px;color:var(--text2);margin-bottom:12px">Cuando regreses, el plan retoma exactamente donde lo dejaste.</p>
        <button class="btn btn-primary btn-full" onclick="endTravel()">🏠 Regresé — Reanudar plan</button>
      ` : `
        <p style="font-size:13px;color:var(--text2);margin-bottom:12px">Menos de 1 semana sin entrenar no rompe la adaptación. El plan se congela y retomas exactamente donde ibas.</p>
        <button class="btn btn-outline btn-full" onclick="startTravel()">✈️ Salir de viaje — Pausar plan</button>
      `}
    </div>

    <!-- Recordatorios -->
    <div class="section-label">Recordatorios 🔔</div>
    <div class="card">
      <div class="notif-setup">
        <div style="font-weight:600;margin-bottom:4px">Recordatorio diario de entrenamiento</div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:10px">Recibirás un mensaje motivacional con la rutina del día</div>
        <div class="notif-time">
          <input type="time" id="notifTime" value="${STATE.notifTime}"
            onchange="STATE.notifTime=this.value;save('notifTime',this.value)">
          <button class="btn btn-primary btn-sm" onclick="requestNotifications()">
            ${STATE.notifsEnabled ? '✓ Activo' : 'Activar'}
          </button>
        </div>
      </div>
      ${STATE.notifsEnabled ? `
        <div style="margin-top:12px;font-size:13px;color:var(--green)">✓ Recordatorios activados para las ${STATE.notifTime}</div>
        <button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="sendTestNotif()">Probar notificación</button>
      ` : `
        <div style="margin-top:10px;font-size:12px;color:var(--text3)">Requiere iOS 16.4+ con la app instalada en pantalla de inicio</div>
      `}
    </div>

    <!-- Calendario -->
    <div class="section-label">Calendario 📅</div>
    <div class="card">
      <div style="font-weight:600;margin-bottom:6px">Añadir al calendario</div>
      <p style="font-size:13px;color:var(--text2);margin-bottom:12px">Descarga el evento de hoy para añadirlo a tu calendario del iPhone</p>
      <button class="btn btn-secondary btn-full" onclick="downloadCalendarEvent()">📅 Descargar evento de hoy (.ics)</button>
    </div>

    <!-- Info del plan -->
    <div class="section-label">Plan actual</div>
    <div class="card">
      ${[
        ['Semana actual', `${week} de 26`],
        ['Fase', getFaseName(week)],
        ['Inicio del plan', STATE.planStartDate ? getMonthDay(STATE.planStartDate) : '—'],
        ['Ciclo menstrual', adj.label],
        ['Ajuste de peso', `${Math.round(adj.factor*100)}%`],
        ['Modo viaje', STATE.travelMode ? '✈️ Activo' : '—'],
      ].map(([l,v]) => `<div class="p-row"><span class="p-label">${l}</span><span class="p-value">${v}</span></div>`).join('')}
    </div>

    <div style="height:20px"></div>
  `;
}

function setCyclePhase(phase) {
  STATE.cyclePhase = phase;
  save('cyclePhase', phase);
  renderProfile();
  showToast(`Fase actualizada: ${CYCLE_ADJUSTMENTS[phase].label}`);
}

function startTravel() {
  STATE.travelMode = true;
  STATE.pausedWeek = STATE.currentWeek;
  STATE.travelStart = today();
  save('travelMode', 'true');
  save('pausedWeek', STATE.pausedWeek);
  save('travelStart', STATE.travelStart);
  showToast('✈️ Plan pausado. ¡Buen viaje!');
  renderProfile();
}

function endTravel() {
  STATE.travelMode = false;
  save('travelMode', 'false');
  showToast('🏠 Bienvenida de vuelta. El plan continúa en semana ' + STATE.pausedWeek);
  renderProfile();
}

// ── Notifications ────────────────────────────────────
async function requestNotifications() {
  if (!('Notification' in window)) {
    showToast('Tu navegador no soporta notificaciones');
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    STATE.notifsEnabled = true;
    save('notifsEnabled', 'true');
    scheduleNotification();
    showToast('🔔 Recordatorios activados');
    renderProfile();
  } else {
    showToast('Permiso denegado. Actívalo en Ajustes > Safari');
  }
}

function scheduleNotification() {
  // Schedule daily local notification via service worker
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const [h, m] = STATE.notifTime.split(':').map(Number);
    const now = new Date();
    const next = new Date();
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = next - now;

    // Store in localStorage for SW to check
    save('nextNotifTime', next.toISOString());

    // Send message to SW
    setTimeout(() => {
      const dow = todayDow();
      const workout = DAY_WORKOUT_MAP[dow];
      const msg = workout
        ? MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]
        : '😴 Hoy es día de descanso. ¡Tu cuerpo crece descansando!';
      const body = workout ? `${workout.emoji} ${workout.name} — ${workout.focus}` : msg;

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SCHEDULE_NOTIF',
          title: msg.split(' ').slice(0,4).join(' '),
          body,
          delay,
        });
      }
    }, 100);
  }
}

function sendTestNotif() {
  const dow = todayDow();
  const workout = DAY_WORKOUT_MAP[dow];
  const msg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
  new Notification('💪 Mi Mejor Versión', {
    body: workout ? `${workout.emoji} Hoy: ${workout.name} — ${workout.focus}` : msg,
    icon: '/icon-192.png',
  });
  showToast('Notificación enviada ✓');
}

// ── Calendar export ──────────────────────────────────
function downloadCalendarEvent() {
  const dow = todayDow();
  const workout = DAY_WORKOUT_MAP[dow];
  if (!workout) { showToast('Hoy es día de descanso'); return; }

  const [h, m] = STATE.notifTime.split(':').map(Number);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  const end = new Date(start.getTime() + 70 * 60000);

  const pad = n => String(n).padStart(2,'0');
  const fmt = d => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${workout.emoji} ${workout.name} — Mi Mejor Versión`,
    `DESCRIPTION:${workout.focus}\\nSemana ${STATE.currentWeek} · ${getFaseName(STATE.currentWeek)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Reminder', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `entrenamiento-${today()}.ics`;
  a.click();
  showToast('📅 Evento descargado');
}

// ── Onboarding ───────────────────────────────────────
function checkOnboarding() {
  const stored = localStorage.getItem('planStartDate');
  if (!stored) {
    const ob = document.getElementById('onboarding');
    ob.style.display = 'flex';
    const inp = document.getElementById('startDateInput');
    inp.value = today();
    inp.max = today();
  } else {
    STATE.planStartDate = stored;
    STATE.currentWeek = computeWeek();
  }

  // Restore travel mode
  if (localStorage.getItem('travelMode') === 'true') {
    STATE.travelMode = true;
    STATE.pausedWeek = parseInt(localStorage.getItem('pausedWeek') || '1');
  }
  STATE.notifsEnabled = localStorage.getItem('notifsEnabled') === 'true';
}

function finishOnboarding() {
  const inp = document.getElementById('startDateInput');
  const val = inp.value || today();
  STATE.planStartDate = val;
  STATE.currentWeek = computeWeek();
  save('planStartDate', val);
  document.getElementById('onboarding').style.display = 'none';
  renderToday();
  showToast('🚀 ¡Plan iniciado! Semana ' + STATE.currentWeek);
  setTimeout(() => {
    showToast('💡 Instala la app en Safari: Compartir → Añadir a pantalla de inicio');
  }, 3000);
}

// ── Service Worker ───────────────────────────────────
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      console.log('SW registered');
    }).catch(console.error);
  }
}

// ── Message from SW for scheduled notifs ─────────────
// Enhanced SW message handler
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data && e.data.type === 'NOTIF_CLICK') {
      showTab('today', document.querySelectorAll('.tab')[0]);
    }
  });
}

// ── Init ─────────────────────────────────────────────
function init() {
  registerSW();
  checkOnboarding();
  if (STATE.planStartDate) {
    STATE.currentWeek = computeWeek();
    renderToday();
  }

  // Reset completedToday if it's a new day
  const lastDay = localStorage.getItem('lastActiveDay');
  const todayVal = today();
  if (lastDay !== todayVal) {
    // Don't clear — keep history but reset open state
    window._openCards = {};
    STATE.openCards = window._openCards;
    localStorage.setItem('lastActiveDay', todayVal);
  }
}

init();
