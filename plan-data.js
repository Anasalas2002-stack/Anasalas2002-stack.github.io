// ═══════════════════════════════════════════════════════
// PLAN DE ENTRENAMIENTO COMPLETO — ANA SALAS
// 26 semanas · Push/Pull/Legs · Énfasis glúteos
// ═══════════════════════════════════════════════════════

const PLAN_START_DATE = localStorage.getItem('planStartDate') || null;

// Fase según semana
function getFase(week) {
  if (week <= 8) return 1;
  if (week <= 17) return 2;
  return 3;
}

// Calcular peso sugerido para un ejercicio dado semana y fase
// progression: { f1: [start, end], f2: [start, end], f3: [start, end] }
function getSuggestedWeight(progression, week) {
  const fase = getFase(week);
  const key = `f${fase}`;
  if (!progression || !progression[key]) return null;
  const [start, end] = progression[key];
  let weeksInFase, weekInFase;
  if (fase === 1) { weeksInFase = 8; weekInFase = week - 1; }
  else if (fase === 2) { weeksInFase = 9; weekInFase = week - 9; }
  else { weeksInFase = 9; weekInFase = week - 18; }
  const ratio = weeksInFase > 1 ? weekInFase / (weeksInFase - 1) : 0;
  return Math.round((start + (end - start) * ratio) * 2) / 2;
}

// Ajuste por fase del ciclo menstrual
const CYCLE_ADJUSTMENTS = {
  menstruation: { factor: 0.88, label: 'Menstruación', color: '#e57373', tip: 'Reduce 10-12% si hay malestar. Técnica sobre peso.' },
  follicular:   { factor: 1.05, label: 'Fase folicular', color: '#81c784', tip: '¡Semana de subir peso! Tu mejor momento del mes.' },
  ovulation:    { factor: 1.08, label: 'Ovulación', color: '#64b5f6', tip: 'Pico de fuerza. Intenta tus máximos históricos.' },
  luteal_early: { factor: 1.00, label: 'Lútea temprana', color: '#ffb74d', tip: 'Mantén la carga de la semana anterior.' },
  luteal_late:  { factor: 0.90, label: 'Lútea tardía / SPM', color: '#f06292', tip: 'Baja 10%. Más descanso. Es fisiológico, no debilidad.' },
};

// Videos de YouTube por ejercicio
const EXERCISE_VIDEOS = {
  'hip-thrust':        'ePlOAFPxDI8',
  'rdl':               'hCDzSR6Tg0I',
  'curl-femoral':      'ELOCsoDSmrg',
  'kickback-cable':    'lg5_Y3-mqVk',
  'buenos-dias':       'YA-h4MspVDM',
  'sentadilla-smith':  'Yd7Y2nBDr4Y',
  'prensa-pies-altos': 'IZxyjW7MPJQ',
  'abductora':         'fGlVQST8Cqc',
  'extension-cuad':    'YyvSfVjQeL0',
  'press-banca':       'vthMCtgVtFw',
  'press-hombro':      'qEwKCR5JCog',
  'pec-deck':          'KxBtdz74Z3s',
  'elev-laterales':    'XPPfnSEATH4',
  'pushdown':          'vB5OHsJ3EME',
  'press-militar':     'F3QY5vMz_6I',
  'fondos':            'dX_nXpEijRQ',
  'jalon':             'CAwf7n6Luuc',
  'remo-maquina':      'GZbfZ033f74',
  'remo-mancuerna':    'roCP8-muFSA',
  'curl-biceps':       'ykJmrZ5v0Oo',
  'dominadas':         'eGo4IYlbE5g',
  'face-pull':         'rep-qVOkqgk',
  'plancha':           'ASdvSqZREc4',
  'split-squat':       'e8R3L8Bvs_I',
  'sentadilla-sumo':   'Y7ougNSbHXc',
  'hack-squat':        'rShXDmGiUks',
  'pantorrillas':      'JbyjNymZsfQ',
};

// ═══════════════════════════════════════════════════════
// RUTINAS POR DÍA
// ═══════════════════════════════════════════════════════

const WORKOUTS = {
  // Lunes — Glúteos + Pierna Pull
  1: {
    name: 'Glúteos + Pierna Pull',
    emoji: '🍑',
    color: '#c62828',
    lightColor: '#ffebee',
    duration: '~65 min',
    cardio: null,
    focus: 'Glúteo mayor · Isquiotibiales · RDL',
    exercises: [
      {
        id: 'hip-thrust-warmup', name: 'Activación: Puente de glúteo',
        equipment: 'Suelo / colchoneta', videoId: 'hip-thrust',
        sets: '2', reps: '15', tempo: '2-2-1', rest: '—',
        isGlute: false, isWarmup: true,
        progression: null, weightLabel: 'Sin peso',
        notes: 'Calentamiento obligatorio. 2 seg apretando el glúteo en la cima.',
      },
      {
        id: 'rdl', name: 'Peso muerto rumano (RDL)',
        equipment: 'Barra olímpica + discos', videoId: 'rdl',
        sets: '3→4', reps: '12–15', tempo: '3-0-2', rest: '90 seg',
        isGlute: true,
        progression: { f1: [20, 30], f2: [35, 50], f3: [55, 70] },
        notes: 'EL ejercicio. Cadera atrás, espalda recta. Bajar hasta sentir el jalón del isquio.',
      },
      {
        id: 'curl-femoral', name: 'Curl femoral tumbado',
        equipment: 'Máquina curl femoral tumbado', videoId: 'curl-femoral',
        sets: '3', reps: '12–15', tempo: '2-0-3', rest: '90 seg',
        isGlute: true,
        progression: { f1: [15, 25], f2: [25, 40], f3: [40, 55] },
        notes: '3 seg bajando = excéntrico intenso. No dejar caer el peso.',
      },
      {
        id: 'kickback-cable', name: 'Kickback en cable con tobillera',
        equipment: 'Polea baja + tobillera', videoId: 'kickback-cable',
        sets: '3', reps: '15 c/lado', tempo: '2-2-2', rest: '75 seg',
        isGlute: true,
        progression: { f1: [5, 10], f2: [10, 18], f3: [18, 25] },
        notes: 'Rodilla 90°, empujar talón al techo. 2 seg de pausa en extensión máxima.',
      },
      {
        id: 'buenos-dias', name: 'Buenos días (Good Morning)',
        equipment: 'Barra en trapecios', videoId: 'buenos-dias',
        sets: '3', reps: '12–15', tempo: '3-0-2', rest: '90 seg',
        isGlute: false,
        progression: { f1: [10, 20], f2: [20, 30], f3: [30, 45] },
        notes: 'Bisagra de cadera pura. Espalda recta. Sentir el estiramiento del isquio.',
      },
      {
        id: 'curl-femoral-sentado', name: 'Curl femoral sentado',
        equipment: 'Máquina curl sentado', videoId: 'curl-femoral',
        sets: '3', reps: '12–15', tempo: '2-0-3', rest: '75 seg',
        isGlute: false,
        progression: { f1: [10, 20], f2: [20, 35], f3: [35, 50] },
        notes: 'Mayor estiramiento del isquio en posición sentada. 3 seg bajando siempre.',
      },
    ],
  },

  // Martes — Upper Push
  2: {
    name: 'Upper Push',
    emoji: '💪',
    color: '#1565c0',
    lightColor: '#e3f2fd',
    duration: '~55 min + 20 cardio',
    cardio: { type: 'LISS', duration: 20, desc: 'Caminadora inclinación 7%, 5.5 km/h' },
    focus: 'Pecho · Hombros · Tríceps',
    exercises: [
      {
        id: 'press-maquina', name: 'Press de pecho en máquina',
        equipment: 'Máquina de pecho', videoId: 'press-banca',
        sets: '3', reps: '12–15', tempo: '2-1-2', rest: '90 seg',
        isGlute: false,
        progression: { f1: [20, 35], f2: [35, 55], f3: [55, 70] },
        notes: 'Codos a 45° del torso. Bajar hasta sentir el pecho. Empezar en máquina para aprender el patrón.',
      },
      {
        id: 'press-hombro', name: 'Press de hombro en máquina',
        equipment: 'Máquina de hombro', videoId: 'press-hombro',
        sets: '3', reps: '12–15', tempo: '2-0-2', rest: '90 seg',
        isGlute: false,
        progression: { f1: [10, 20], f2: [20, 35], f3: [35, 50] },
        notes: 'Espalda apoyada en respaldo. No arquear lumbar. Bajar hasta codos a 90°.',
      },
      {
        id: 'pec-deck', name: 'Apertura de pecho (Pec-deck)',
        equipment: 'Pec-deck / máquina fly', videoId: 'pec-deck',
        sets: '3', reps: '12–15', tempo: '3-1-2', rest: '75 seg',
        isGlute: false,
        progression: { f1: [15, 25], f2: [25, 40], f3: [40, 55] },
        notes: 'Codo levemente doblado y fijo. 3 seg bajando sintiendo el pecho.',
      },
      {
        id: 'elev-laterales', name: 'Elevaciones laterales',
        equipment: 'Mancuernas', videoId: 'elev-laterales',
        sets: '3', reps: '12–15', tempo: '2-1-3', rest: '75 seg',
        isGlute: false,
        progression: { f1: [4, 6], f2: [6, 10], f3: [10, 14] },
        notes: 'Codo a 10-15° de flexión. Subir solo hasta hombro. 3 seg bajando siempre.',
      },
      {
        id: 'pushdown', name: 'Extensión tríceps en cable',
        equipment: 'Polea alta + barra recta', videoId: 'pushdown',
        sets: '3', reps: '12–15', tempo: '2-1-2', rest: '75 seg',
        isGlute: false,
        progression: { f1: [10, 18], f2: [18, 28], f3: [28, 38] },
        notes: 'Codos pegados al cuerpo y fijos. Extensión completa. Bajar lento.',
      },
    ],
  },

  // Miércoles — Descanso
  3: null,

  // Jueves — Upper Pull
  4: {
    name: 'Upper Pull',
    emoji: '🎯',
    color: '#2e7d32',
    lightColor: '#e8f5e9',
    duration: '~55 min + 20 cardio',
    cardio: { type: 'LISS', duration: 20, desc: 'Elíptica o caminadora inclinación' },
    focus: 'Espalda · Bíceps · Core',
    exercises: [
      {
        id: 'jalon', name: 'Jalón al pecho agarre ancho',
        equipment: 'Polea alta + barra', videoId: 'jalon',
        sets: '3', reps: '12–15', tempo: '2-1-3', rest: '90 seg',
        isGlute: false,
        progression: { f1: [20, 35], f2: [35, 55], f3: [55, 70] },
        notes: 'Barra al pecho. Codos hacia abajo y atrás. 3 seg subiendo = excéntrico. El dorsal jala, no las manos.',
      },
      {
        id: 'remo-maquina', name: 'Remo en máquina sentado',
        equipment: 'Máquina remo', videoId: 'remo-maquina',
        sets: '3', reps: '12–15', tempo: '2-2-2', rest: '90 seg',
        isGlute: false,
        progression: { f1: [20, 35], f2: [35, 55], f3: [55, 70] },
        notes: 'Pecho apoyado. 2 seg sosteniendo. Codos hacia las caderas, no hacia los lados.',
      },
      {
        id: 'remo-mancuerna', name: 'Remo 1 brazo con mancuerna',
        equipment: 'Banco plano + mancuerna', videoId: 'remo-mancuerna',
        sets: '3', reps: '12 c/lado', tempo: '2-1-3', rest: '90 seg',
        isGlute: false,
        progression: { f1: [8, 14], f2: [14, 22], f3: [22, 30] },
        notes: 'Rodilla y mano en el banco. Codo al techo. 3 seg bajando = excéntrico intenso.',
      },
      {
        id: 'curl-biceps', name: 'Curl de bíceps con barra EZ',
        equipment: 'Barra EZ', videoId: 'curl-biceps',
        sets: '3', reps: '12–15', tempo: '2-0-2', rest: '75 seg',
        isGlute: false,
        progression: { f1: [10, 18], f2: [18, 28], f3: [28, 38] },
        notes: 'Codos pegados al cuerpo y fijos. No balancear el torso. Supinar al subir.',
      },
      {
        id: 'dominadas', name: 'Dominadas asistidas',
        equipment: 'Máquina asistida', videoId: 'dominadas',
        sets: '3', reps: '8–10', tempo: '3-0-2', rest: '90 seg',
        isGlute: false,
        progression: { f1: [35, 20], f2: [20, 5], f3: [5, 0] },
        weightLabel: 'Asistencia:',
        notes: 'Reducir asistencia progresivamente. Meta: dominadas sin asistencia en fase 3.',
      },
      {
        id: 'plancha', name: 'Plancha isométrica',
        equipment: 'Suelo / colchoneta', videoId: 'plancha',
        sets: '3', reps: '30–40 seg', tempo: '—', rest: '45 seg',
        isGlute: false,
        progression: null, weightLabel: 'Peso corporal',
        notes: 'Cadera alineada. Core activo. No dejar caer ni subir la cadera.',
      },
    ],
  },

  // Viernes — Glúteos + Pierna Push
  5: {
    name: 'Glúteos + Pierna Push',
    emoji: '🍑',
    color: '#c62828',
    lightColor: '#ffebee',
    duration: '~65 min',
    cardio: null,
    focus: 'Hip Thrust · Sentadilla · Glúteo medio',
    exercises: [
      {
        id: 'abductora-warmup', name: 'Activación: Abductora de cadera',
        equipment: 'Máquina abductora', videoId: 'abductora',
        sets: '2', reps: '20', tempo: '1-1-2', rest: '—',
        isGlute: false, isWarmup: true,
        progression: null, weightLabel: '10–15 kg',
        notes: 'Calentamiento. Activa el glúteo medio antes del trabajo principal.',
      },
      {
        id: 'hip-thrust', name: 'Hip Thrust con barra',
        equipment: 'Banco + barra olímpica + pad', videoId: 'hip-thrust',
        sets: '3→4', reps: '12–15', tempo: '2-2-1', rest: '90 seg',
        isGlute: true, isPrimary: true,
        progression: { f1: [20, 40], f2: [45, 70], f3: [75, 100] },
        notes: '⭐ EL EJERCICIO MÁS IMPORTANTE. Espalda alta en banco. Pad en caderas. 2 seg apretando en la cima.',
      },
      {
        id: 'sentadilla-smith', name: 'Sentadilla en Smith Machine',
        equipment: 'Smith Machine', videoId: 'sentadilla-smith',
        sets: '3', reps: '12–15', tempo: '3-1-2', rest: '90 seg',
        isGlute: true,
        progression: { f1: [20, 35], f2: [40, 55], f3: [60, 80] },
        notes: 'Pies ligeramente adelantados. Rodillas hacia afuera. Bajar hasta paralelo o más.',
      },
      {
        id: 'prensa-pies-altos', name: 'Prensa pies altos (Leg Press)',
        equipment: 'Leg Press', videoId: 'prensa-pies-altos',
        sets: '3', reps: '12–15', tempo: '3-1-2', rest: '90 seg',
        isGlute: true,
        progression: { f1: [40, 70], f2: [80, 110], f3: [120, 160] },
        notes: 'Pies en la parte ALTA de la plataforma = más glúteo. No bloquear rodillas.',
      },
      {
        id: 'abductora', name: 'Máquina abductora sentada',
        equipment: 'Máquina abductora', videoId: 'abductora',
        sets: '3', reps: '15–20', tempo: '2-1-3', rest: '75 seg',
        isGlute: true,
        progression: { f1: [20, 35], f2: [40, 55], f3: [60, 80] },
        notes: 'Glúteo medio. 3 seg cerrando lento. Contrae en la apertura máxima.',
      },
      {
        id: 'extension-cuad', name: 'Extensión de cuádriceps',
        equipment: 'Máquina extensora', videoId: 'extension-cuad',
        sets: '3', reps: '15', tempo: '2-1-3', rest: '60 seg',
        isGlute: false,
        progression: { f1: [15, 25], f2: [25, 40], f3: [40, 55] },
        notes: 'Pie en flexión dorsal. Contrae el cuádriceps en la cima. 3 seg bajando.',
      },
    ],
  },

  // Sábado — Pierna Completa
  6: {
    name: 'Pierna Completa',
    emoji: '🦵',
    color: '#4a148c',
    lightColor: '#f3e5f5',
    duration: '~65 min + 15 HIIT',
    cardio: { type: 'HIIT', duration: 15, desc: 'Bicicleta estática: 30 seg sprint + 90 seg recuperación × 8 rondas' },
    focus: 'Volumen alto · Todos los músculos del tren inferior',
    exercises: [
      {
        id: 'prensa-sabado', name: 'Prensa pies altos',
        equipment: 'Leg Press', videoId: 'prensa-pies-altos',
        sets: '3', reps: '12–15', tempo: '3-1-2', rest: '90 seg',
        isGlute: true,
        progression: { f1: [40, 70], f2: [80, 110], f3: [120, 160] },
        notes: 'Pies altos. Glúteo activado en todo el rango. No bloquear rodillas arriba.',
      },
      {
        id: 'split-squat', name: 'Split squat búlgaro',
        equipment: 'Banco + mancuernas', videoId: 'split-squat',
        sets: '3', reps: '10 c/lado', tempo: '3-1-2', rest: '90 seg',
        isGlute: true,
        progression: { f1: [6, 10], f2: [12, 18], f3: [20, 28] },
        notes: 'Pie trasero en banco. El ejercicio unilateral más completo para glúteo.',
      },
      {
        id: 'sentadilla-sumo', name: 'Sentadilla sumo con barra',
        equipment: 'Barra libre o Smith', videoId: 'sentadilla-sumo',
        sets: '3', reps: '12–15', tempo: '3-1-2', rest: '90 seg',
        isGlute: true,
        progression: { f1: [20, 35], f2: [40, 55], f3: [60, 80] },
        notes: 'Pies muy abiertos, puntas a 45°. Glúteo medio y aductores.',
      },
      {
        id: 'curl-femoral-sabado', name: 'Curl femoral sentado',
        equipment: 'Máquina curl sentado', videoId: 'curl-femoral',
        sets: '3', reps: '12–15', tempo: '2-0-3', rest: '75 seg',
        isGlute: false,
        progression: { f1: [10, 20], f2: [20, 35], f3: [35, 50] },
        notes: 'Mayor estiramiento del isquio en posición sentada. 3 seg bajando.',
      },
      {
        id: 'pantorrillas', name: 'Elevación de pantorrillas',
        equipment: 'Máquina pantorrillas de pie', videoId: 'pantorrillas',
        sets: '4', reps: '15–20', tempo: '1-1-3', rest: '45 seg',
        isGlute: false,
        progression: { f1: [20, 40], f2: [40, 65], f3: [65, 90] },
        notes: '3 seg bajando. Rango completo. No rebotar el peso en ninguna fase.',
      },
    ],
  },

  // Domingo — Descanso
  0: null,
};

// Días de la semana → workout
// 0=domingo, 1=lunes, ..., 6=sábado
const DAY_WORKOUT_MAP = {
  0: null,  // domingo
  1: WORKOUTS[1],
  2: WORKOUTS[2],
  3: WORKOUTS[3], // miércoles descanso
  4: WORKOUTS[4],
  5: WORKOUTS[5],
  6: WORKOUTS[6],
};

// Mensajes motivacionales
const MOTIVATIONAL_MESSAGES = [
  "💪 ¡Hoy es día de glúteos! Cada rep te acerca a tu meta. Tú puedes.",
  "🔥 El cuerpo logra lo que la mente cree. ¡A entrenar!",
  "🍑 Los glúteos no se construyen en el sofá. ¡Vamos, Ana!",
  "⚡ Un entrenamiento más. Una versión mejor de ti.",
  "🎯 Disciplina es elegirte a ti misma todos los días.",
  "💎 El progreso, no la perfección. ¡Hoy entrenas!",
  "🌟 Tu futura versión te agradecerá que entrenes hoy.",
  "🔑 Constancia es la clave. ¡Hoy sumas otra sesión!",
  "🏆 No es sobre motivación, es sobre compromiso. ¡Vamos!",
  "✨ Cada entrenamiento es un regalo que te haces a ti misma.",
];
