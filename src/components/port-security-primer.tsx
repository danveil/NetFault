"use client";
import { useState } from "react";
export default function PortSecurityPrimer() {
  const [choice, setChoice] = useState(""),
    [checked, setChecked] = useState(false),
    [revealed, setRevealed] = useState(false);
  return (
    <details className="stp-primer">
      <summary>Optional preparation · Carrier and admission</summary>
      <p>
        A connected port has physical carrier. Its access VLAN identifies a Layer 2 forwarding domain. A full static
        secure-address slot independently checks the source MAC in each arriving frame.
      </p>
      <figure className="primer-diagram">
        <figcaption>Unrelated workshop · VLAN 30</figcaption>
        <p>Notebook Q → connected access port → source check → VLAN forwarding</p>
        <p>
          Registered: <code>0200.0030.00c1</code> · Maximum: 1 · Protect
        </p>
        <p>
          A router starts a new Ethernet segment using its own egress MAC. Switches preserve the source MAC inside a
          segment.
        </p>
      </figure>
      <p>
        Protect can discard an unregistered source while the interface stays up. One static address fills this
        maximum-one model; no dynamic or sticky learning is simulated. A MAC is copyable, so matching is not strong
        authentication. Admission does not create VLAN membership, gateway resolution or routes.
      </p>
      <fieldset>
        <legend>A connected port receives source 0200.0030.00d2. What follows?</legend>
        {[
          ["carrier", "Carrier proves the source is admitted."],
          ["policy", "Compare source against the full registered slot; carrier and VLAN alone are insufficient."],
          ["route", "The switch creates a route for the new source."],
        ].map(([id, label]) => (
          <label className="choice" key={id}>
            <input
              type="radio"
              name="admission-primer"
              value={id}
              checked={choice === id}
              onChange={() => {
                setChoice(id);
                setChecked(false);
              }}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <button type="button" className="secondary" disabled={!choice} onClick={() => setChecked(true)}>
        Check admission reasoning
      </button>
      {checked && (
        <p role="status">
          {choice === "policy"
            ? "That separates physical availability from configured admission. Next consider whether ordinary VLAN and routing prerequisites also hold."
            : "Revisit what each layer proves. A connected cable or source identity does not install an IP route; inspect the configured admission rule."}
        </p>
      )}
      <p>
        Independent check: if the source is registered but remote ping fails, which independent prerequisites still need
        investigation?
      </p>
      <button type="button" className="text-button" onClick={() => setRevealed(true)}>
        Reveal preparation reasoning
      </button>
      {revealed && (
        <p>
          The unregistered source is outside the full static slot and is discarded without shutdown in protect mode. A
          matching source still needs correct VLAN, addressing, resolution and routes in both directions. No external
          attack or device test has been performed.
        </p>
      )}
    </details>
  );
}
