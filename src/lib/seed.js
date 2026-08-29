export const DEFAULT_PREFS = {
  unit: 'lb', // 'lb' | 'kg'
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
