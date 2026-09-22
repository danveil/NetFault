"use client";
import { useEffect, useRef, useState } from "react";
import { academy, references } from "@/lib/academy/content";
import type { Lesson } from "@/lib/academy/schema";
import {
  ACADEMY_KEY,
  emptyProgress,
  loadProgress,
  recordFor,
  saveProgress,
  updateProgress,
  type LearningProgress,
  type ProgressAction,
} from "@/lib/academy/progress";
import { academyAvailableOffline } from "@/lib/academy/offline";
import { labs } from "@/lib/catalog";
import type { ScenarioId } from "@/lib/schema";
import ExerciseCard from "./exercise";
import LessonDiagram from "./diagram";
import InterfaceTable from "./interface-table";
import RevisionHistory from "./history";

export default function AcademyView({
  onLab,
  initialReferences = false,
}: {
  onLab: (id: ScenarioId) => void;
  initialReferences?: boolean;
}) {
  const [page, setPage] = useState(initialReferences ? "references" : "home");
  const [progress, setProgress] = useState<LearningProgress>(emptyProgress);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [cached, setCached] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const lesson = academy.lessons.find((l) => l.id === page);
  const learningModule = academy.modules.find((m) => m.id === page);
  const current = lesson ? recordFor(progress, lesson) : undefined;
  const recent = [...progress.records]
    .sort((a, b) => b.lastViewedAt - a.lastViewedAt)
    .map((r) => academy.lessons.find((l) => l.id === r.lessonId))
    .find(Boolean);
  useEffect(() => {
    async function restore() {
      try {
        setProgress(loadProgress(localStorage));
      } catch {
        setError(
          "Academy storage is unavailable or damaged. Existing data was preserved. Export raw Academy data for recovery; new work can remain in memory only.",
        );
      }
      setReady(true);
    }
    void restore();
    const refresh = () => {
      void academyAvailableOffline()
        .then(setCached)
        .catch(() => setCached(false));
    };
    refresh();
    const timer = setInterval(refresh, 4000);
    navigator.serviceWorker?.addEventListener("controllerchange", refresh);
    const sync = (event: StorageEvent) => {
      if (event.key === ACADEMY_KEY) void restore();
    };
    window.addEventListener("storage", sync);
    return () => {
      clearInterval(timer);
      navigator.serviceWorker?.removeEventListener("controllerchange", refresh);
      window.removeEventListener("storage", sync);
    };
  }, []);
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [page]);
  function go(next: string) {
    moved.current = true;
    setPage(next);
  }
  function save(target: Lesson, action: ProgressAction) {
    try {
      // After a failure keep subsequent work in memory, without claiming persistence or overwriting damaged data.
      if (error) setProgress(updateProgress(progress, target, action));
      else setProgress(saveProgress(localStorage, target, action));
    } catch {
      setError(
        "Academy progress could not be saved: storage may be damaged, full or at its retention limit. Existing data was preserved. Export raw data and this session before closing. New work is in memory only.",
      );
      try {
        setProgress(updateProgress(progress, target, action));
      } catch {
        setError(
          "Academy retention limit reached. This action was not recorded. Export your learning history before any manual recovery; existing data was preserved.",
        );
      }
    }
  }
  function openLesson(target: Lesson) {
    save(target, { type: "view" });
    go(target.id);
  }
  function exportData(raw: boolean) {
    try {
      const data = raw ? (localStorage.getItem(ACADEMY_KEY) ?? "null") : JSON.stringify(progress, null, 2);
      const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = raw ? "netfault-academy-raw.json" : "netfault-academy-progress.json";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("The browser blocked export. Existing Academy data was not erased.");
    }
  }
  function status(target: Lesson) {
    const record = recordFor(progress, target);
    if (!record) return "Not started";
    const completed = target.exercises.filter((e) =>
      record.submissions.some((s) => s.exerciseId === e.id && s.exerciseRevision === e.revision && s.correct),
    ).length;
    return `${record.readAt ? "Read" : "Opened"} · ${record.submissions.length ? "Practiced" : "Not practiced"} · ${completed}/${target.exercises.length} exercises completed`;
  }
  return (
    <div className="academy">
      <div className="academy-toolbar">
        <button className="text-button" onClick={() => go("home")}>
          Academy home
        </button>
        <button className="text-button" onClick={() => go("references")}>
          Field guide
        </button>
        <span className="tag" role="status">
          {cached ? "Available offline · Academy" : "Not yet cached · Academy"}
        </span>
      </div>
      <div className="page-heading">
        <div className="eyebrow">LEARN NETWORKING / ACADEMY</div>
        <h1 ref={heading} tabIndex={-1}>
          {lesson?.title ??
            learningModule?.title ??
            (page === "references" ? "Your Field Guides" : "Understand. Practice. Investigate.")}
        </h1>
        <p>
          {lesson
            ? `Lesson revision ${lesson.revision} · Public learning practice`
            : "Build understanding at your own pace. Your learning record stays on this browser."}
        </p>
      </div>
      {error && (
        <div className="academy-error" role="alert">
          {error}
        </div>
      )}
      {!ready ? (
        <p>Loading your learning record…</p>
      ) : (
        <>
          {page === "home" && (
            <>
              {recent && (
                <div className="panel academy-resume">
                  <span className="eyebrow">CONTINUE LEARNING</span>
                  <h2>{recent.title}</h2>
                  <p>{status(recent)}</p>
                  <button className="primary" onClick={() => openLesson(recent)}>
                    Continue lesson
                  </button>
                </div>
              )}
              <div className="section-heading">
                <h2>Your modules</h2>
                <span>
                  {academy.modules.length} available modules · {academy.lessons.length} lessons
                </span>
              </div>
              {academy.modules.map((item) => (
                <article className="panel academy-module" key={item.id}>
                  <span className="tag">Networking foundations</span>
                  <h2>{item.title}</h2>
                  <p>{item.overview}</p>
                  <p>
                    {item.orderedLessonIds.length} lessons ·{" "}
                    {
                      item.orderedLessonIds.filter(
                        (id) =>
                          recordFor(
                            progress,
                            academy.lessons.find((l) => l.id === id)!,
                          )?.readAt,
                      ).length
                    }{" "}
                    marked read
                  </p>
                  <button className="primary" onClick={() => go(item.id)}>
                    Explore module
                  </button>
                </article>
              ))}
              <div className="quiet-card">
                <h3>Apply your understanding</h3>
                <p>
                  Practice observation and diagnosis in an existing lab. Links open mode selection; they do not start an
                  attempt.
                </p>
                <button className="secondary" onClick={() => onLab("gateway-01")}>
                  LAB 002 · {labs.find((l) => l.id === "gateway-01")!.title}
                </button>
              </div>
            </>
          )}
          {learningModule && (
            <>
              <p>{learningModule.overview}</p>
              <div className="academy-lesson-list">
                {learningModule.orderedLessonIds.map((id, index) => {
                  const item = academy.lessons.find((l) => l.id === id)!;
                  return (
                    <article className="panel" key={item.id}>
                      <span className="eyebrow">LESSON {String(index + 1).padStart(2, "0")}</span>
                      <h2>{item.title}</h2>
                      <p>{item.objectives.join(" ")}</p>
                      <p className="muted">{status(item)}</p>
                      <button className="secondary" onClick={() => openLesson(item)}>
                        Open lesson {index + 1}
                      </button>
                    </article>
                  );
                })}
              </div>
            </>
          )}
          {lesson && (
            <>
              <button className="text-button" onClick={() => go(lesson.moduleId)}>
                Back to module
              </button>
              {progress.records.some((r) => r.lessonId === lesson.id && r.lessonRevision !== lesson.revision) && (
                <p className="academy-feedback">
                  An updated lesson is available. Earlier revision records remain in your learning history; this is
                  revision {lesson.revision}. Your old drafts are preserved, not converted. Start fresh below and review
                  earlier work in Learning history & storage.
                </p>
              )}
              <div className="panel academy-objectives">
                <h2>What you will learn</h2>
                <ul>
                  {lesson.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
                <p>
                  Recommended preparation (never required):{" "}
                  {lesson.prerequisiteLessonIds.length ? "" : "No prior lesson needed."}
                </p>
                {lesson.prerequisiteLessonIds.map((id) => {
                  const prerequisite = academy.lessons.find((l) => l.id === id)!;
                  return (
                    <button className="text-button" key={id} onClick={() => openLesson(prerequisite)}>
                      {prerequisite.title}
                    </button>
                  );
                })}
                <p className="muted">
                  {status(lesson)}. Activity and exercise completion are not a measure of mastery.
                </p>
              </div>
              {lesson.sections.map((section) => (
                <section key={section.kind} className="academy-section">
                  <h2>{section.title}</h2>
                  {section.body.split("\n\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                  {section.diagram && <LessonDiagram diagram={section.diagram} />}
                  {section.interfaceTable && <InterfaceTable table={section.interfaceTable} />}
                  {section.code && <pre>{section.code}</pre>}
                  {(section.kind === "guided" || section.kind === "independent") &&
                    lesson.exercises
                      .filter((e) => e.stage === section.kind)
                      .map((exercise) => (
                        <ExerciseCard
                          key={`${lesson.id}@${lesson.revision}:${exercise.id}@${exercise.revision}`}
                          exercise={exercise}
                          progress={current}
                          onSave={(action) => save(lesson, action)}
                        />
                      ))}
                </section>
              ))}
              {lesson.companion && (
                <details className="panel academy-companion">
                  <summary>{lesson.companion.title}</summary>
                  <p>{lesson.companion.introduction}</p>
                  <InterfaceTable table={lesson.companion.interfaceTable} />
                  <ol>
                    {lesson.companion.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </details>
              )}
              <div className="academy-actions">
                <button className="secondary" onClick={() => save(lesson, { type: "read" })}>
                  {current?.readAt ? "Lesson marked read" : "Mark lesson read"}
                </button>
                <button className="secondary" onClick={() => go(lesson.moduleId)}>
                  Choose another lesson
                </button>
              </div>
              <section className="quiet-card">
                <h2>Take the next step in a lab</h2>
                <p>
                  Inspect the incident yourself. No attempt begins until you choose a mode and start it. Assessment
                  requires internet; practice requires its separately downloaded pack for offline use.
                </p>
                {lesson.relatedLabs.map((link) => {
                  const lab = labs.find((l) => l.id === link.scenarioId)!;
                  return (
                    <button className="secondary" key={link.scenarioId} onClick={() => onLab(lab.id)}>
                      LAB {lab.number} · {lab.title}
                    </button>
                  );
                })}
              </section>
              <details className="panel academy-sources">
                <summary>References and scope</summary>
                <p>
                  Original teaching explanations and interactive paper exercises. No new simulator capabilities are
                  introduced. Public practice answers are inspectable in the application files; hiding a solution is a
                  learning aid, not an exam security boundary.
                </p>
                <p>Sources require internet.</p>
                <ul>
                  {lesson.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </>
          )}
          {page === "references" && (
            <>
              <p>
                All four original guides, preserved as reference material. Their guided and independent tasks are paper
                prompts, without automatic Academy grading.
              </p>
              {references.map((guide) => (
                <details className="panel lesson" key={guide.id}>
                  <summary>{guide.title}</summary>
                  <div className="lesson-body">
                    <h3>The simple version</h3>
                    <p>{guide.simple}</p>
                    <h3>An analogy, with limits</h3>
                    <p>{guide.analogy}</p>
                    <h3>Under the hood</h3>
                    <p>{guide.technical}</p>
                    <h3>Worked example</h3>
                    <pre>{guide.example}</pre>
                    <h3>Connect it to a symptom</h3>
                    <p>{guide.symptom}</p>
                    <h3>Guided practice</h3>
                    <p>{guide.guided}</p>
                    <h3>Try it independently</h3>
                    <p>{guide.exercise}</p>
                  </div>
                </details>
              ))}
              <div className="quiet-card">
                <h3>Built on documented protocol behavior</h3>
                <p>
                  Original guide references:{" "}
                  <a href="https://www.rfc-editor.org/rfc/rfc2328#section-8.2" target="_blank" rel="noreferrer">
                    RFC 2328
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13699-29.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Cisco’s OSPF troubleshooting guidance
                  </a>
                  . NetFault is a simplified simulator, not an IOS emulator or an official Universiti Malaya product.
                  External references require internet.
                </p>
              </div>
            </>
          )}
          <details className="academy-records">
            <summary>Learning history & storage</summary>
            <p>
              Read is self-reported. Practiced means an answer was submitted. Completed means all fields in that
              exercise were answered correctly, possibly after help. No mastery score is inferred.
            </p>
            <p>
              Up to 100 lesson revision records, 500 submissions and 100 requested reveals per revision. At capacity,
              saving stops with an export message; old records are never silently evicted. Use one active learning tab.
              No cross-device sync.
            </p>
            {progress.records.map((r) => (
              <RevisionHistory key={`${r.lessonId}@${r.lessonRevision}`} record={r} />
            ))}
          </details>
          <div className="academy-actions">
            <button className="secondary" onClick={() => exportData(false)}>
              Export Academy progress
            </button>
            <button className="text-button" onClick={() => exportData(true)}>
              Export raw Academy data
            </button>
          </div>
          <p className="muted" role="status">
            {error ? "Session changes are not saved to this browser." : "Academy progress saves on this browser."}{" "}
            {cached
              ? "Public lessons and exercises are cached for offline use."
              : "Offline reading requires a completed production cache on localhost or trusted HTTPS, followed by an online reload."}{" "}
            External references and lab assessments require internet.
          </p>
        </>
      )}
    </div>
  );
}
