import { lessonRevision } from "@/lib/academy/content";
import { exerciseKey, type LessonProgress } from "@/lib/academy/progress";

export default function RevisionHistory({ record }: { record: LessonProgress }) {
  const lesson = lessonRevision(record.lessonId, record.lessonRevision);
  return (
    <details className="revision-record">
      <summary>
        {lesson?.title ?? record.lessonId} · revision {record.lessonRevision}
      </summary>
      <p>
        {record.readAt ? "Read" : "Opened"} · {record.submissions.length} submissions · {record.reveals.length}{" "}
        requested solutions · {record.submissions.filter((s) => s.unaided && s.correct).length} correct submissions
        before help
      </p>
      <p>
        Started {new Date(record.startedAt).toLocaleString()}. Saved answers and feedback below belong to this revision.
        They are never applied to updated exercises.
      </p>
      {lesson?.exercises.map((exercise) => {
        const draft = record.drafts[exerciseKey(exercise)];
        const submissions = record.submissions.filter(
          (s) => s.exerciseId === exercise.id && s.exerciseRevision === exercise.revision,
        );
        return (
          <div className="revision-exercise" key={exercise.id}>
            <h4>
              {exercise.prompt} · exercise revision {exercise.revision}
            </h4>
            {draft && (
              <>
                <p>Saved draft (not regraded)</p>
                <dl>
                  {exercise.fields.map((field) => (
                    <div key={field.id}>
                      <dt>{field.label}</dt>
                      <dd>{draft[field.id] ?? "Not answered"}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
            {submissions.map((submission, index) => (
              <details key={index}>
                <summary>
                  Submission {index + 1} · {submission.correct ? "Correct" : "Needs review"} ·{" "}
                  {submission.unaided ? "Before help" : "After help"}
                </summary>
                <dl>
                  {exercise.fields.map((field) => (
                    <div key={field.id}>
                      <dt>{field.label}</dt>
                      <dd>{submission.answers[field.id] ?? "Not answered"}</dd>
                    </div>
                  ))}
                </dl>
                {submission.feedback.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </details>
            ))}
            {record.reveals.some((r) => r.exerciseId === exercise.id && r.exerciseRevision === exercise.revision) && (
              <p>Detailed solution explicitly requested in this revision.</p>
            )}
          </div>
        );
      })}
      {!lesson && (
        <p>This content revision is not bundled. Its raw record remains available through Export Academy progress.</p>
      )}
    </details>
  );
}
