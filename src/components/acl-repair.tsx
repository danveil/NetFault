"use client";
import { useState } from "react";
import type { Attempt, RepairAction } from "@/lib/schema";
import { repairDescription } from "@/lib/repair-trial";
export default function AclRepair({
  attempt,
  disabled,
  onApply,
  onInspect,
}: {
  attempt: Attempt;
  disabled: boolean;
  onApply: (change: RepairAction) => void;
  onInspect: () => void;
}) {
  const [device, setDevice] = useState(""),
    [acl, setAcl] = useState(""),
    [sequence, setSequence] = useState(""),
    [next, setNext] = useState("");
  const valid = (value: string) => /^[1-9]\d{0,2}$/.test(value);
  return (
    <fieldset className="repair-trial">
      <legend>Test a configuration change</legend>
      <p>
        Preserve initial evidence. Move an existing entry to an unused sequence; smaller sequences are evaluated first.
        This changes order only, preserving both the rule and its interface attachment. Apply explicitly, then return to
        Inspect.
      </p>
      <label htmlFor="acl-router">Router to configure</label>
      <select id="acl-router" value={device} onChange={(e) => setDevice(e.target.value)}>
        <option value="">Choose a router</option>
        <option>R1</option>
        <option>R2</option>
      </select>
      <label htmlFor="acl-name">ACL name to configure</label>
      <input
        id="acl-name"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        value={acl}
        maxLength={32}
        onChange={(e) => setAcl(e.target.value)}
        placeholder="From your observations"
      />
      <label htmlFor="acl-from">Existing entry sequence</label>
      <input
        id="acl-from"
        inputMode="numeric"
        maxLength={3}
        value={sequence}
        onChange={(e) => setSequence(e.target.value)}
      />
      <label htmlFor="acl-to">New entry sequence</label>
      <input id="acl-to" inputMode="numeric" maxLength={3} value={next} onChange={(e) => setNext(e.target.value)} />
      <p className="muted">
        {device && acl && sequence && next
          ? `Proposed change: ${device}, ACL ${acl}, sequence ${sequence} → ${next}. Rule action and source match remain unchanged.`
          : "Choose a router, an observed ACL and entry, then an unused sequence (1–999 in this model)."}
      </p>
      <button
        type="button"
        className="secondary"
        disabled={disabled || !device || !/^[A-Za-z][A-Za-z0-9_-]{0,31}$/.test(acl) || !valid(sequence) || !valid(next)}
        onClick={() =>
          onApply({ kind: "acl-sequence", device, acl, sequence: Number(sequence), newSequence: Number(next) })
        }
      >
        Apply configuration change
      </button>
      <button type="button" className="text-button" onClick={onInspect}>
        Inspect and verify current state
      </button>
      <p role="status">
        {attempt.repairs?.length
          ? `Current configuration version ${attempt.repairs.length}. Select fresh outputs from this version before final submission.`
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
        At most 10 actual changes and 100 commands. Reapplying the current sequence creates no new version. To undo a
        change, move the entry back to its previous unused sequence.
      </p>
    </fieldset>
  );
}
