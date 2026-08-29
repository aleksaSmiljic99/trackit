export const DEFAULT_PREFS = {
  unit: 'lb', // 'lb' | 'kg'
  theme: 'system', // 'system' | 'light' | 'dark'
  showRestTimer: true,
  restSeconds: 90, // 30–240, step 15
}

// Offered as one-tap starters on an empty account. Users edit freely after.
export const STARTER_ROUTINES = [
  {
    name: 'Push A',
    exercises: [
      { name: 'Bench Press', targetSets: 4, targetReps: 5, startWeightLb: 135 },
      { name: 'Overhead Press', targetSets: 3, targetReps: 8, startWeightLb: 75 },
      { name: 'Incline DB Press', targetSets: 3, targetReps: 10, startWeightLb: 45 },
      { name: 'Cable Fly', targetSets: 3, targetReps: 12, startWeightLb: 25 },
    ],
  },
  {
    name: 'Pull A',
    exercises: [
      { name: 'Deadlift', targetSets: 3, targetReps: 5, startWeightLb: 185 },
      { name: 'Barbell Row', targetSets: 4, targetReps: 8, startWeightLb: 95 },
      { name: 'Lat Pulldown', targetSets: 3, targetReps: 10, startWeightLb: 90 },
      { name: 'Barbell Curl', targetSets: 3, targetReps: 12, startWeightLb: 45 },
    ],
  },
  {
    name: 'Legs A',
    exercises: [
      { name: 'Back Squat', targetSets: 4, targetReps: 5, startWeightLb: 135 },
      { name: 'Romanian Deadlift', targetSets: 3, targetReps: 8, startWeightLb: 115 },
      { name: 'Leg Press', targetSets: 3, targetReps: 12, startWeightLb: 180 },
      { name: 'Calf Raise', targetSets: 4, targetReps: 15, startWeightLb: 90 },
    ],
  },
]

export const BLANK_EXERCISE = {
  name: '',
  targetSets: 3,
  targetReps: 8,
  startWeightLb: 45,
}

// ── Exercise library ───────────────────────────────────────────────────────
// Seeded once per account (see src/lib/exercises.js). `load` is 'external' by
// default; 'bodyweight' means the weight field holds the ADDED load ("BW +25").
// `alt` on any row is a list of names it can be swapped for — turned into
// symmetric exercise_substitutions rows at seed time.
const X = (name, muscle, equipment, extra = {}) => ({
  name,
  primaryMuscle: muscle,
  equipment,
  loadMode: extra.load ?? 'external',
  aliases: extra.aliases ?? [],
  alt: extra.alt ?? [],
})

export const SEED_EXERCISES = [
  // Chest
  X('Bench Press', 'chest', 'barbell', {
    aliases: ['bench', 'flat bench', 'barbell bench press'],
    alt: ['Dumbbell Bench Press', 'Machine Chest Press', 'Push-Up', 'Dip'],
  }),
  X('Incline Bench Press', 'chest', 'barbell', {
    aliases: ['incline bench'],
    alt: ['Incline DB Press'],
  }),
  X('Dumbbell Bench Press', 'chest', 'dumbbell', {
    aliases: ['db bench', 'flat db press'],
  }),
  X('Incline DB Press', 'chest', 'dumbbell', {
    aliases: ['incline dumbbell press'],
  }),
  X('Machine Chest Press', 'chest', 'machine'),
  X('Cable Fly', 'chest', 'cable', { aliases: ['cable crossover'], alt: ['Pec Deck'] }),
  X('Pec Deck', 'chest', 'machine', { aliases: ['machine fly'] }),
  X('Push-Up', 'chest', 'bodyweight', { load: 'bodyweight', aliases: ['pushup', 'press up'] }),
  X('Dip', 'chest', 'bodyweight', { load: 'bodyweight', aliases: ['dips', 'chest dip'] }),

  // Shoulders
  X('Overhead Press', 'shoulders', 'barbell', {
    aliases: ['ohp', 'military press', 'standing press', 'shoulder press'],
    alt: ['Seated Dumbbell Press', 'Arnold Press'],
  }),
  X('Seated Dumbbell Press', 'shoulders', 'dumbbell', {
    aliases: ['db shoulder press', 'seated db press'],
  }),
  X('Arnold Press', 'shoulders', 'dumbbell'),
  X('Lateral Raise', 'shoulders', 'dumbbell', {
    aliases: ['side raise', 'db lateral raise'],
    alt: ['Cable Lateral Raise'],
  }),
  X('Cable Lateral Raise', 'shoulders', 'cable'),
  X('Rear Delt Fly', 'shoulders', 'dumbbell', { aliases: ['reverse fly', 'rear delt raise'] }),
  X('Face Pull', 'shoulders', 'cable'),

  // Back
  X('Deadlift', 'hamstrings', 'barbell', {
    aliases: ['conventional deadlift'],
    alt: ['Romanian Deadlift'],
  }),
  X('Romanian Deadlift', 'hamstrings', 'barbell', { aliases: ['rdl'] }),
  X('Barbell Row', 'back', 'barbell', {
    aliases: ['bent over row', 'bb row', 'pendlay row'],
    alt: ['Dumbbell Row', 'Seated Cable Row', 'Chest-Supported Row'],
  }),
  X('Dumbbell Row', 'back', 'dumbbell', { aliases: ['db row', 'one arm row', 'single arm row'] }),
  X('Pull-Up', 'lats', 'bodyweight', {
    load: 'bodyweight',
    aliases: ['pullup', 'pull up'],
    alt: ['Chin-Up', 'Lat Pulldown'],
  }),
  X('Chin-Up', 'lats', 'bodyweight', { load: 'bodyweight', aliases: ['chinup', 'chin up'] }),
  X('Lat Pulldown', 'lats', 'cable', { aliases: ['pulldown'] }),
  X('Seated Cable Row', 'back', 'cable', { aliases: ['cable row'] }),
  X('Chest-Supported Row', 'back', 'machine', { aliases: ['machine row'] }),

  // Legs
  X('Back Squat', 'quads', 'barbell', {
    aliases: ['squat', 'barbell squat'],
    alt: ['Front Squat', 'Leg Press'],
  }),
  X('Front Squat', 'quads', 'barbell'),
  X('Leg Press', 'quads', 'machine'),
  X('Bulgarian Split Squat', 'quads', 'dumbbell', {
    aliases: ['split squat', 'rear foot elevated split squat'],
    alt: ['Walking Lunge'],
  }),
  X('Walking Lunge', 'quads', 'dumbbell', { aliases: ['lunge', 'dumbbell lunge'] }),
  X('Leg Extension', 'quads', 'machine'),
  X('Leg Curl', 'hamstrings', 'machine', {
    aliases: ['lying leg curl', 'seated leg curl', 'hamstring curl'],
  }),
  X('Hip Thrust', 'glutes', 'barbell', { aliases: ['barbell hip thrust'] }),
  X('Calf Raise', 'calves', 'machine', { aliases: ['standing calf raise', 'seated calf raise'] }),

  // Arms
  X('Barbell Curl', 'biceps', 'barbell', {
    aliases: ['bb curl'],
    alt: ['Dumbbell Curl', 'Cable Curl', 'Preacher Curl'],
  }),
  X('Dumbbell Curl', 'biceps', 'dumbbell', { aliases: ['db curl', 'alternating curl'] }),
  X('Hammer Curl', 'biceps', 'dumbbell'),
  X('Preacher Curl', 'biceps', 'ez-bar'),
  X('Cable Curl', 'biceps', 'cable'),
  X('Triceps Pushdown', 'triceps', 'cable', {
    aliases: ['pushdown', 'rope pushdown', 'cable pushdown'],
    alt: ['Overhead Triceps Extension', 'Skull Crusher', 'Close-Grip Bench Press'],
  }),
  X('Overhead Triceps Extension', 'triceps', 'cable', { aliases: ['overhead extension'] }),
  X('Skull Crusher', 'triceps', 'ez-bar', { aliases: ['lying triceps extension'] }),
  X('Close-Grip Bench Press', 'triceps', 'barbell', { aliases: ['cgbp'] }),

  // Core
  X('Plank', 'core', 'bodyweight', { load: 'bodyweight' }),
  X('Hanging Leg Raise', 'core', 'bodyweight', { load: 'bodyweight', aliases: ['leg raise'] }),
  X('Cable Crunch', 'core', 'cable'),
  X('Russian Twist', 'core', 'bodyweight', { load: 'bodyweight' }),
]
