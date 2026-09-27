"use client";
import { useState } from "react";
import type { Attempt, Diagnosis, RepairAction } from "@/lib/schema";
import { natReasons } from "@/lib/catalog";
import { repairDescription } from "@/lib/repair-trial";
function addresses(attempt: Attempt) {
  return [...new Set(attempt.history.flatMap((o) => o.output.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) ?? []))];
}
function mappings(attempt: Attempt) {
  return [...new Set(attempt.history.flatMap((o) => [...o.output.matchAll(/Mapping ([\w-]+)/g)].map((m) => m[1])))];
}
function Address({
  id,
  label,
  value,
  set,
  attempt,
  editable = false,
}: {
  id: string;
  label: string;
  value: string;
  set: (v: string) => void;
  attempt: Attempt;
  editable?: boolean;
}) {
  return (
    <div className="nat-address-card">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => set(e.target.value)} required={!editable}>
        <option value="">Choose from recorded observations</option>
        {[...new Set([...addresses(attempt), ...(value ? [value] : [])])].map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
      {editable && (
        <details>
          <summary>Enter another IPv4 value</summary>
          <label htmlFor={`${id}-custom`}>Custom {label.toLowerCase()}</label>
          <input
            id={`${id}-custom`}
            inputMode="decimal"
            maxLength={32}
            value={value}
            onChange={(e) => set(e.target.value.trim())}
          />
        </details>
      )}
    </div>
  );
}
export function NatDiagnosis({
  attempt,
  answer,
  onChange,
}: {
  attempt: Attempt;
  answer: Diagnosis;
  onChange: (c: Partial<Diagnosis>) => void;
}) {
  return (
    <>
      <label htmlFor="nat-mapping-answer">Affected mapping</label>
      <select
        id="nat-mapping-answer"
        required
        value={answer.mappingId ?? ""}
        onChange={(e) => onChange({ mappingId: e.target.value })}
      >
        <option value="">Choose from observations</option>
        {mappings(attempt).map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>
      <Address
        id="nat-observed-local"
        label="Initial observed inside local"
        value={answer.observedLocal ?? ""}
        set={(v) => onChange({ observedLocal: v })}
        attempt={attempt}
      />
      <Address
        id="nat-observed-global"
        label="Initial observed inside global"
        value={answer.observedGlobal ?? ""}
        set={(v) => onChange({ observedGlobal: v })}
        attempt={attempt}
      />
      <Address
        id="nat-proposed-local"
        label="Proposed inside local"
        value={answer.insideLocal ?? ""}
        set={(v) => onChange({ insideLocal: v })}
        attempt={attempt}
      />
      <label htmlFor="nat-reason">Why does the correction work?</label>
      <select
        id="nat-reason"
        required
        value={answer.reason ?? ""}
        onChange={(e) => onChange({ reason: e.target.value as Diagnosis["reason"] })}
      >
        <option value="">Choose a mechanism</option>
        {natReasons.map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </>
  );
}
export default function NatRepair({
  attempt,
  disabled,
  onApply,
  onInspect,
}: {
  attempt: Attempt;
  disabled: boolean;
  onApply: (c: RepairAction) => void;
  onInspect: () => void;
}) {
  const [device, setDevice] = useState(""),
    [mappingId, setMapping] = useState(""),
    [insideLocal, setLocal] = useState("");
  const globals = [
    ...new Set(
      attempt.history
        .filter((o) => o.device === device)
        .flatMap((o) =>
          [
            ...o.output.matchAll(/(?:Inside global:\s+|ip nat inside source static \S+ )((?:\d{1,3}\.){3}\d{1,3})/g),
          ].map((m) => m[1]),
        ),
    ),
  ];
  return (
    <fieldset className="repair-trial">
      <legend>Test a configuration change</legend>
      <p>
        Keep original evidence. Replace only the local member of an existing static pair. The global address, roles,
        host identities and routes stay unchanged.
      </p>
      <label htmlFor="nat-device">Router to configure</label>
      <select id="nat-device" value={device} onChange={(e) => setDevice(e.target.value)}>
        <option value="">Choose a router</option>
        <option>R1</option>
        <option>R2</option>
      </select>
      <label htmlFor="nat-mapping">Mapping to configure</label>
      <select id="nat-mapping" value={mappingId} onChange={(e) => setMapping(e.target.value)}>
        <option value="">Choose from observations</option>
        {mappings(attempt).map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>
      <Address
        id="nat-replacement"
        label="Replacement inside local"
        value={insideLocal}
        set={setLocal}
        attempt={attempt}
        editable
      />
      <p className="muted">
        Candidates come from recorded outputs; inclusion does not mean correctness. Inspect the current pair and compare
        host identity.
      </p>
      <details className="nat-address-card">
        <summary>Recorded inside global (unchanged)</summary>
        {globals.length ? globals.map((ip) => <code key={ip}>{ip}</code>) : <p>Inspect the selected router first.</p>}
        <p>The trial preserves this external representation. It does not change the host NIC or any route.</p>
      </details>
      <button
        type="button"
        className="secondary"
        disabled={disabled || !device || !mappingId || !insideLocal}
        onClick={() => onApply({ kind: "nat-static-local", device, mappingId, insideLocal })}
      >
        Apply configuration change
      </button>
      <button type="button" className="text-button" onClick={onInspect}>
        Inspect and verify current state
      </button>
      <p role="status">
        {attempt.repairs?.length
          ? `Current configuration version ${attempt.repairs.length}. Gather fresh evidence from this version.`
          : "Initial configuration. No change recorded."}
      </p>
      {!!attempt.repairs?.length && (
        <ol>
          {attempt.repairs.map((r, n) => (
            <li key={n}>
              Version {n + 1}: {repairDescription(r)}
            </li>
          ))}
        </ol>
      )}
      <p className="muted">
        At most 10 actual changes and 100 commands. An effective no-op creates no new version. This atomic trial models
        no IOS editing interval or dynamic session state.
      </p>
    </fieldset>
  );
}
