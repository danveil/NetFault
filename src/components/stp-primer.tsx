"use client";
import { useState } from "react";
export default function StpPrimer() {
  const [guided, setGuided] = useState(""),
    [independent, setIndependent] = useState(""),
    [reveal, setReveal] = useState(false);
  return (
    <details className="stp-primer">
      <summary>Optional preparation · A switching tree</summary>
      <section>
        <h3>1 · Keep the spare roads</h3>
        <p>
          Redundant Ethernet cables can circulate frames, causing duplicate traffic and unstable MAC learning. STP
          selects a loop-free data tree while keeping spare cables connected. Think of retained roads with selected
          entrances closed. Unlike drivers following signs, switches compare control information; a blocked port can
          still participate in that control.
        </p>
      </section>
      <section>
        <h3>2 · Choose a reference and paths</h3>
        <p>
          The lowest bridge ID wins: compare base priority plus the VLAN ID, then numeric bridge MAC. Each non-root
          switch chooses its lowest-cost path toward the root. On each segment, the bridge with the better root path is
          designated; redundant alternate ports block data. Role and physical carrier are different observations.
        </p>
        <figure>
          <svg
            viewBox="0 0 360 170"
            role="img"
            aria-label="Example triangle in VLAN 30. A and C connect directly to root B; the A to C cable remains a redundant path."
          >
            <path d="M60 130 L180 35 L300 130" stroke="currentColor" strokeWidth="3" fill="none" />
            <path d="M60 130 L300 130" stroke="currentColor" strokeWidth="2" strokeDasharray="6 5" />
            <g fill="var(--bg, #101923)" stroke="currentColor">
              <circle cx="60" cy="130" r="22" />
              <circle cx="180" cy="35" r="22" />
              <circle cx="300" cy="130" r="22" />
            </g>
            <g fill="currentColor" textAnchor="middle">
              <text x="60" y="135">
                A
              </text>
              <text x="180" y="40">
                B
              </text>
              <text x="300" y="135">
                C
              </text>
            </g>
          </svg>
          <figcaption>
            Different example: VLAN 30, A/B/C priorities 16384/8192/32768, equal link costs 4. B is root. A and C use
            direct root ports; A wins designation on A–C and C blocks that cable for data.
          </figcaption>
        </figure>
      </section>
      <section>
        <h3>3 · Prove the design, not only delivery</h3>
        <p>
          A ping may work under multiple valid trees. Compare the observed root and roles with the approved design, then
          inspect them again after a change. Cost is a selection metric, not measured latency. NetFault calculates
          settled state; it does not simulate BPDUs, timers, storms or full RSTP.
        </p>
        <fieldset>
          <legend>Guided prediction: which evidence proves the selected tree?</legend>
          {["Root and port-role observations", "One successful ping"].map((x) => (
            <label key={x}>
              <input type="radio" name="stp-guide" checked={guided === x} onChange={() => setGuided(x)} />
              {x}
            </label>
          ))}
        </fieldset>
        {guided && (
          <p role="status">
            {guided.startsWith("Root")
              ? "Yes. Relate those roles to the physical cables and intended root."
              : "Delivery can succeed along different trees. Look for evidence that distinguishes their paths."}
          </p>
        )}
        <fieldset>
          <legend>
            Independent prediction: A changes to base priority 4096; B and C stay unchanged. Which bridge becomes root?
          </legend>
          {["A", "B", "C"].map((x) => (
            <label key={x}>
              <input
                type="radio"
                name="stp-independent"
                checked={independent === x}
                onChange={() => setIndependent(x)}
              />
              {x}
            </label>
          ))}
        </fieldset>
        {independent && (
          <p role="status">
            {independent === "A"
              ? "Correct: compare the current priorities before considering a MAC tie."
              : "The previous root is not permanently locked. Recompare the current bridge IDs; lower priority wins."}
          </p>
        )}
        <button type="button" className="text-button" onClick={() => setReveal(true)}>
          Show preparation reasoning
        </button>
        {reveal && (
          <p>
            A wins because 4096 is below B’s 8192 and C’s 32768. Adding the same VLAN ID leaves that order unchanged.
            With equal direct costs, B and C then use their links toward A. These preparation checks are not a lab score
            or a mastery assessment.
          </p>
        )}
      </section>
    </details>
  );
}
