import exercises from './exercises.json';
import { PracticeControls } from './PracticeControls';

// One exercise proves the complete practice loop before adding navigation.
const exercise = exercises[0];

export function PracticeScreen() {
  return (
    <main id="practice">
      <p className="eyebrow">A little practice. A little closer.</p>
      <h1 lang={exercise.language}>{exercise.sv}</h1>
      <p className="translation">{exercise.en}</p>
      <p className="instruction">Listen first. Then speak, at your own pace.</p>
      <PracticeControls referenceUrl={exercise.audio} />
    </main>
  );
}
