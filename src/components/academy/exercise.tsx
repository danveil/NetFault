import { useEffect, useRef, useState } from "react";
import type { Exercise } from "@/lib/academy/schema";
import { exerciseKey, type LessonProgress, type ProgressAction } from "@/lib/academy/progress";
import { gradeExercise } from "@/lib/academy/grading";

export default function ExerciseCard({
  exercise,
  progress,
  onSave,
}: {
  exercise: Exercise;
  progress?: LessonProgress;
  onSave: (action: ProgressAction) => void;
}) {
  const answers = progress?.drafts[exerciseKey(exercise)] ?? {};
  const [step, setStep] = useState(() => {
    const first = exercise.fields.findIndex((field) => !answers[field.id]);
    return first < 0 ? exercise.fields.length : first;
  });
  const [errors, setErrors] = useState<string[]>([]);
  const legend = useRef<HTMLLegendElement>(null),
    feedback = useRef<HTMLDivElement>(null),
    review = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const submissions =
    progress?.submissions.filter((s) => s.exerciseId === exercise.id && s.exerciseRevision === exercise.revision) ?? [];
  const last = submissions.at(-1);
  const revealed = progress?.reveals.some(
    (r) => r.exerciseId === exercise.id && r.exerciseRevision === exercise.revision,
  );
  const field = exercise.fields[step];
  const unchanged = !!last && exercise.fields.every((item) => last.answers[item.id] === answers[item.id]);
  const complete = exercise.fields.every((item) => !!answers[item.id]);
  useEffect(() => {
    if (moved.current) (legend.current ?? review.current)?.focus();
  }, [step]);
  function move(next: number) {
    moved.current = true;
    setErrors([]);
    setStep(next);
  }
  return (
    <article className="panel academy-exercise" aria-label={exercise.prompt}>
      <span className="eyebrow">{exercise.stage === "guided" ? "GUIDED PRACTICE" : "YOUR TURN"} · TAP TO REASON</span>
      <h3>{exercise.prompt}</h3>
      <p className="muted">Choose one answer per step. You can review and change every choice before checking.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (unchanged || step < exercise.fields.length) return;
          const result = gradeExercise(exercise, answers);
          setErrors(result.valid ? [] : result.errors);
          if (result.valid) {
            onSave({ type: "submit", exercise, answers });
            requestAnimationFrame(() => feedback.current?.focus());
          }
        }}
      >
        <div
          className="exercise-meter"
          aria-label={`${Object.keys(answers).length} of ${exercise.fields.length} answers selected`}
        >
          {exercise.fields.map((item, index) => (
            <span key={item.id} className={answers[item.id] ? "answered" : ""} aria-hidden="true">
              {index + 1}
            </span>
          ))}
        </div>
        {field ? (
          <fieldset className="tap-question">
            <legend ref={legend} tabIndex={-1}>
              <small>
                STEP {step + 1} OF {exercise.fields.length}
              </small>
              {field.label}
            </legend>
            {field.kind === "choice" ? (
              <div className="answer-cards">
                {field.choices.map((value) => (
                  <label key={value} className={`answer-card ${answers[field.id] === value ? "chosen" : ""}`}>
                    <input
                      type="radio"
                      name={`${exercise.id}-${field.id}`}
                      value={value}
                      checked={answers[field.id] === value}
                      onChange={() => {
                        setErrors([]);
                        onSave({ type: "draft", exercise, answers: { ...answers, [field.id]: value } });
                      }}
                    />
                    <span>{value}</span>
                    <span className="selection-mark" aria-hidden="true">
                      {answers[field.id] === value ? "✓" : ""}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <label>
                {field.label}
                <input
                  value={answers[field.id] ?? ""}
                  onChange={(event) =>
                    onSave({ type: "draft", exercise, answers: { ...answers, [field.id]: event.target.value } })
                  }
                />
              </label>
            )}
            <div className="step-actions">
              <button className="secondary" type="button" disabled={step === 0} onClick={() => move(step - 1)}>
                Previous
              </button>
              <button className="primary" type="button" disabled={!answers[field.id]} onClick={() => move(step + 1)}>
                {step === exercise.fields.length - 1 ? "Review choices" : "Next step"}
              </button>
            </div>
          </fieldset>
        ) : (
          <div className="answer-review">
            <h4 ref={review} tabIndex={-1}>
              Review your reasoning
            </h4>
            <ol>
              {exercise.fields.map((item, index) => (
                <li key={item.id}>
                  <div>
                    <span>{item.label}</span>
                    <strong>{answers[item.id] ?? "Not answered"}</strong>
                  </div>
                  <button
                    className="text-button"
                    type="button"
                    aria-label={`Change ${item.label}`}
                    onClick={() => move(index)}
                  >
                    Change
                  </button>
                </li>
              ))}
            </ol>
            <button className="primary" type="submit" disabled={!complete || unchanged}>
              {last ? "Check revised answers" : "Check answers"}
            </button>
            {unchanged && <p className="muted">These choices are already recorded. Change an answer to try again.</p>}
          </div>
        )}
        {!!errors.length && (
          <div role="alert">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
      </form>
      {last && (
        <div ref={feedback} tabIndex={-1} className="academy-feedback" role="status">
          <h4>{last.correct ? "Correct — exercise completed" : "Keep practicing"}</h4>
          <p>
            {last.unaided
              ? "Submitted before feedback or a requested solution."
              : "Practice after feedback or solution review; not recorded as unaided."}
          </p>
          {last.feedback.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {!unchanged && (
            <p className="muted">Feedback above is for your last submission. Check your revised choices when ready.</p>
          )}
          {!last.correct && (
            <button className="secondary" type="button" onClick={() => move(0)}>
              Review and retry
            </button>
          )}
        </div>
      )}
      <div className="academy-actions">
        <button className="secondary" type="button" onClick={() => onSave({ type: "reveal", exercise })}>
          Show detailed solution
        </button>
      </div>
      {(revealed || (exercise.solutionPolicy === "after-submit-or-request" && last)) && (
        <section className="academy-solution" aria-label="Detailed solution">
          <h4>07 / Detailed solution</h4>
          {revealed && (
            <p className="muted">Solution explicitly requested. Opening it does not complete the exercise.</p>
          )}
          <ol>
            {exercise.solution.steps.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          <p>
            <strong>Common mistake:</strong> {exercise.solution.commonMistake}
          </p>
        </section>
      )}
      {!!submissions.length && (
        <details>
          <summary>Answer history ({submissions.length})</summary>
          {submissions.map((submission, index) => (
            <div key={index}>
              <p>
                {new Date(submission.at).toLocaleString()} · {submission.correct ? "Correct" : "Needs review"} ·{" "}
                {submission.unaided ? "Before help" : "After help"}
              </p>
              <dl>
                {exercise.fields.map((item) => (
                  <div key={item.id}>
                    <dt>{item.label}</dt>
                    <dd>{submission.answers[item.id]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </details>
      )}
    </article>
  );
}
