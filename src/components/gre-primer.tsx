"use client";
import { useState } from "react";
export default function GrePrimer() {
  const [layer, setLayer] = useState(""),
    [proof, setProof] = useState(""),
    [checked, setChecked] = useState(false),
    [reveal, setReveal] = useState(false);
  return (
    <details className="stp-primer" id="gre-preparation-v1">
      <summary>Optional preparation · Two layers, one journey</summary>
      <p>
        GRE carries an inner IP packet across a routed IPv4 underlay. Tunnel0 is a logical interface. GRE alone does not
        encrypt traffic.
      </p>
      <figure className="primer-diagram">
        <figcaption>1 · Unrelated Cedar and Maple sites</figcaption>
        <div className="gre-primer-logical">
          Cedar Tunnel0 ⇢ ⇢ ⇢ Maple Tunnel0
          <br />
          <small>Logical overlay · 10.88.99.1/30 ↔ 10.88.99.2/30</small>
        </div>
        <div className="gre-primer-physical">
          Cedar — Transport — Maple
          <br />
          <small>Physical underlay · endpoint sources 192.0.2.5 and 198.51.100.10</small>
        </div>
        <p>
          Solid means physical transport; dashed means logical carriage over it. The far endpoint&apos;s physical source
          is the outer destination. Tunnel addresses are inner identities, not Ethernet neighbors.
        </p>
      </figure>
      <p>
        An envelope inside another envelope is a useful analogy: the outer destination and the inner recipient have
        different jobs. Its limits: real GRE uses headers, not people, and implies neither confidentiality nor a
        negotiated session or guaranteed delivery.
      </p>
      <figure className="primer-diagram">
        <figcaption>2 · Logical packet journey</figcaption>
        <ol className="gre-journey">
          <li>Inner packet selects Tunnel0</li>
          <li>Outer source/destination wrap the inner identity</li>
          <li>Ordinary routes carry it through transport</li>
          <li>Actual far receiver matches its tunnel configuration</li>
          <li>Inner forwarding resumes; reply needs its own routes</li>
        </ol>
        <p>
          Local up/up tests local conditions. It does not prove step four or five. A tunnel does not create an underlay
          or overlay route.
        </p>
      </figure>
      <fieldset>
        <legend>Which layer owns Cedar&apos;s 192.0.2.5 source?</legend>
        {[
          ["outer", "Physical underlay endpoint"],
          ["inner", "Inner logical interface"],
        ].map(([id, label]) => (
          <label className="choice" key={id}>
            <input
              type="radio"
              name="gre-layer"
              checked={layer === id}
              onChange={() => {
                setLayer(id);
                setChecked(false);
              }}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Which is stronger evidence of end-to-end service?</legend>
        {[
          ["state", "Tunnel0 is locally up/up"],
          ["exchange", "Successful inner exchanges in both directions"],
        ].map(([id, label]) => (
          <label className="choice" key={id}>
            <input
              type="radio"
              name="gre-proof"
              checked={proof === id}
              onChange={() => {
                setProof(id);
                setChecked(false);
              }}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <button type="button" className="secondary" disabled={!layer || !proof} onClick={() => setChecked(true)}>
        Check layered reasoning
      </button>
      {checked && (
        <p role="status">
          {layer === "outer" && proof === "exchange"
            ? "Both distinctions are correct. Explain the independent route and receiver checks in your own words."
            : "Revisit the address's job and what each observation actually proves. You can retry."}
        </p>
      )}
      <button type="button" className="text-button" onClick={() => setReveal(true)}>
        Reveal preparation reasoning
      </button>
      {reveal && (
        <p>
          Cedar&apos;s 192.0.2.5 is an outer source, while 10.88.99.1 belongs to logical Tunnel0. Successful inner
          exchanges demonstrate more than local state: they depend on both routing layers, actual receiver matching and
          independent replies. No encryption is implied.
        </p>
      )}
    </details>
  );
}
