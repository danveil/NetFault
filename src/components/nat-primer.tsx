"use client";
import { useState } from "react";
export default function NatPrimer() {
  const [choice, setChoice] = useState(""),
    [route, setRoute] = useState(""),
    [checked, setChecked] = useState(false),
    [reveal, setReveal] = useState(false);
  return (
    <details className="stp-primer" id="static-nat-preparation-v1">
      <summary>Optional preparation · One host, two address views</summary>
      <p>
        A static mapping gives one inside host a permanent external representation. Its NIC stays private. Inside and
        outside are interface roles at the boundary, not synonyms for trusted and untrusted.
      </p>
      <figure className="primer-diagram">
        <figcaption>Unrelated workshop: Station Q</figcaption>
        <div className="nat-address-card">
          <strong>Inside local · host NIC</strong>
          <code>10.77.0.20</code>
        </div>
        <p>Inside interface → boundary → outside interface</p>
        <div className="nat-address-card">
          <strong>Inside global · external representation</strong>
          <code>203.0.113.70</code>
        </div>
        <p>
          Outbound: source local → global. Inbound: destination global → local. The outside destination stays unchanged;
          its outside-local and outside-global views are equal here.
        </p>
      </figure>
      <p>
        Think of a mailroom changing an external label back to a desk number. The analogy has limits: translation is not
        encryption, authentication or a road. Independent routes and local delivery still matter. Static one-to-one
        translation is not PAT or a temporary session.
      </p>
      <fieldset>
        <legend>An outside host initiates a request to the static global address. What changes at the boundary?</legend>
        {[
          ["destination", "The destination becomes the inside local address."],
          ["nic", "The inside host changes its NIC address."],
          ["session", "It must wait for an inside-created session."],
        ].map(([id, label]) => (
          <label className="choice" key={id}>
            <input
              type="radio"
              name="nat-preparation-direction"
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
      <fieldset>
        <legend>Independent check: the static pair is correct but a required route is missing.</legend>
        {[
          ["route", "Inspect and restore the independent route."],
          ["mapping", "The mapping creates that route automatically."],
        ].map(([id, label]) => (
          <label className="choice" key={id}>
            <input
              type="radio"
              name="nat-preparation-route"
              checked={route === id}
              onChange={() => {
                setRoute(id);
                setChecked(false);
              }}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <button type="button" className="secondary" disabled={!choice || !route} onClick={() => setChecked(true)}>
        Check translation reasoning
      </button>
      {checked && (
        <p role="status">
          {choice === "destination" && route === "route"
            ? "You separated packet identity from endpoint configuration and independent forwarding prerequisites."
            : "Revisit the address seen on each side and the purpose of a route. A permanent mapping is not dynamic session allocation or a change to the NIC."}
        </p>
      )}
      <button type="button" className="text-button" onClick={() => setReveal(true)}>
        Reveal preparation reasoning
      </button>
      {reveal && (
        <p>
          Outside initiation to 203.0.113.70 becomes a request to 10.77.0.20 before inside routing. Its reply takes the
          reverse source representation. The NIC stays 10.77.0.20; no mapping creates missing routes. These are model
          concepts, not a completed device practical.
        </p>
      )}
    </details>
  );
}
