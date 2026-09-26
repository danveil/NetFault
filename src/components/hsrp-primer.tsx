"use client";
import { useState } from "react";
export default function HsrpPrimer() {
  const [evidence, setEvidence] = useState(""),
    [prediction, setPrediction] = useState(""),
    [reveal, setReveal] = useState(false);
  return (
    <details className="stp-primer">
      <summary>Optional preparation · One gateway identity</summary>
      <section>
        <h3>A gateway with a backup</h3>
        <p>
          A single physical default gateway can be a single point of failure. HSRP presents a shared virtual IPv4
          address and MAC: one router is Active and another is Standby. Hosts keep the virtual address as their gateway.
        </p>
        <figure>
          <div
            className="hsrp-concept"
            role="img"
            aria-label="One logical gateway identity served by either member Juniper or Maple. It is not an extra physical router."
          >
            <span>Host gateway identity</span>
            <span>↙ ownership ↘</span>
            <span>Juniper · Maple</span>
          </div>
          <figcaption>A logical identity shared by routers; their physical addresses stay distinct.</figcaption>
        </figure>
        <p>
          Like one service-desk number with a primary worker and backup. The analogy explains identity, not packet
          rewriting: the Active router still needs a route, and replies need a return path.
        </p>
      </section>
      <section>
        <h3>Preference and proof</h3>
        <p>
          HSRP priority defaults to 100. Higher priority helps choose the preferred Active. Preemption permits a
          higher-priority member to take over from an incumbent. This simulator uses settled state with both members
          preempt enabled and unequal priorities; it does not model timers, failure history, equal-priority incumbency
          or tracking.
        </p>
        <fieldset>
          <legend>Which observation identifies the serving member?</legend>
          {["Both member role views", "A successful gateway ping"].map((x) => (
            <label key={x}>
              <input type="radio" name="hsrp-guide" checked={evidence === x} onChange={() => setEvidence(x)} />
              {x}
            </label>
          ))}
        </fieldset>
        {evidence && (
          <p role="status">
            {evidence.startsWith("Both")
              ? "Yes. Compare complementary roles against the design; pair them with configuration and delivery checks."
              : "A shared gateway may respond through either member. Look for an observation that distinguishes ownership."}
          </p>
        )}
        <fieldset>
          <legend>
            Different example: group 42, Juniper priority 170, Maple priority 210; both preempt enabled and eligible.
            Which is Active in settled state?
          </legend>
          {["Juniper", "Maple"].map((x) => (
            <label key={x}>
              <input
                type="radio"
                name="hsrp-independent"
                checked={prediction === x}
                onChange={() => setPrediction(x)}
              />
              {x}
            </label>
          ))}
        </fieldset>
        {prediction && (
          <p role="status">
            {prediction === "Maple"
              ? "Correct. Use the priority relationship under the stated preemption conditions."
              : "Compare the two priorities under the stated conditions. Router names do not determine roles."}
          </p>
        )}
        <button type="button" className="text-button" onClick={() => setReveal(true)}>
          Show preparation reasoning
        </button>
        {reveal && (
          <p>
            Maple&apos;s 210 exceeds Juniper&apos;s 170, so Maple is Active and Juniper Standby in this settled model.
            The shared identity stays unchanged. Neither role selection nor a working ping proves failover timing, full
            path resilience or mastery.
          </p>
        )}
      </section>
    </details>
  );
}
