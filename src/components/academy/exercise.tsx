import { useState } from "react";
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
  const [errors, setErrors] = useState<string[]>([]);
  const answers = progress?.drafts[exerciseKey(exercise)] ?? {};
  const submissions =
    progress?.submissions.filter((s) => s.exerciseId === exercise.id && s.exerciseRevision === exercise.revision) ?? [];
  const last = submissions.at(-1);
  const revealed = progress?.reveals.some(
    (r) => r.exerciseId === exercise.id && r.exerciseRevision === exercise.revision,
  );
  return (
    <article className="panel academy-exercise" aria-label={exercise.prompt}>
      <h3>{exercise.prompt}</h3>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const result = gradeExercise(exercise, answers);
          setErrors(result.valid ? [] : result.errors);
          if (result.valid) onSave({ type: "submit", exercise, answers });
        }}
      >
        <div className="academy-fields">
          {exercise.fields.map((field) => {
            const controlId = `${exercise.id}-${field.id}`;
            const change = (value: string) =>
              onSave({ type: "draft", exercise, answers: { ...answers, [field.id]: value } });
            return (
              <div key={field.id}>
                <label htmlFor={controlId}>{field.label}</label>
                {field.kind === "choice" ? (
                  <select id={controlId} value={answers[field.id] ?? ""} onChange={(e) => change(e.target.value)}>
                    <option value="">Choose an answer</option>
                    {field.choices.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={controlId}
                    inputMode={field.kind === "number" ? "numeric" : "decimal"}
                    autoComplete="off"
                    maxLength={50}
                    value={answers[field.id] ?? ""}
                    onChange={(e) => change(e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
        {!!errors.length && (
          <div role="alert">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
        <div className="academy-actions">
          <button className="primary" type="submit">
            {last ? "Submit another answer" : "Check answers"}
          </button>
          <button className="secondary" type="button" onClick={() => onSave({ type: "reveal", exercise })}>
            Show detailed solution
          </button>
        </div>
      </form>
      {last && (
        <div className="academy-feedback" role="status">
          <h4>{last.correct ? "Correct — exercise completed" : "Keep practicing"}</h4>
          <p>
            {last.unaided
              ? "Submitted before feedback or a requested solution."
              : "Practice after feedback or solution review; not recorded as unaided."}
          </p>
          {last.feedback.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}
      {(last || revealed) && (
        <section className="academy-solution" aria-label="Detailed solution">
          <h4>07 / Detailed solution</h4>
          {revealed && (
            <p className="muted">Solution explicitly requested. Opening it does not complete the exercise.</p>
          )}
          <ol>
            {exercise.solution.steps.map((step) => (
              <li key={step}>{step}</li>
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
              <pre>{JSON.stringify(submission.answers, null, 2)}</pre>
            </div>
          ))}
        </details>
      )}
    </article>
  );
}
