"use client";
import { useState } from "react";
export default function Ipv6Primer() {
  const [answers, setAnswers] = useState<Record<string, string>>({}),
    [checked, setChecked] = useState(false),
    [reveal, setReveal] = useState(false);
  const questions = [
    {
      id: "identity",
      prompt: "Which has the same address identity as 2001:0db8:0044:0007:0000:0000:0000:000a?",
      choices: ["2001:db8:44:7::a", "2001:db8:44:8::a"],
      correct: "2001:db8:44:7::a",
      hint: "Expand the omitted zero groups and compare all eight groups, not just the final group.",
    },
    {
      id: "link",
      prompt:
        "Cedar uses a manually configured 2001:db8:44:7::/64 on-link route. How does it send to 2001:db8:44:8::b?",
      choices: ["Resolve the destination on the same link", "Use its configured default next hop"],
      correct: "Use its configured default next hop",
      hint: "Compare the first four groups under /64. Address spelling alone does not configure a host's on-link information.",
    },
    {
      id: "proof",
      prompt: "Cedar's router answers a ping to its own address. What has been shown?",
      choices: ["The router forwards all transit traffic", "This probe reached the router and its reply returned"],
      correct: "This probe reached the router and its reply returned",
      hint: "Separate traffic addressed to a device from traffic that must pass through it.",
    },
  ];
  return (
    <details className="stp-primer ipv6-reading" id="ipv6-preparation-v1">
      <summary>Optional preparation · Reading the next address</summary>
      <p>
        IPv6 identifies addresses with 128 bits, written as eight hexadecimal groups. Leading zeros may disappear; one{" "}
        <code>::</code> can replace consecutive zero groups. Different spellings can identify exactly the same address.
      </p>
      <figure className="primer-diagram">
        <figcaption>1 · A /64 boundary in an unrelated example</figcaption>
        <div className="ipv6-groups">
          <span>
            2001 : 0db8 : 0044 : 0007<strong>First 64 bits · prefix</strong>
          </span>
          <span>
            0000 : 0000 : 0000 : 000a<strong>Remaining 64 bits</strong>
          </span>
        </div>
        <p>
          <code>2001:db8:44:7::a</code> is the same identity. /64 is a bit count, not a count of printed characters.
          IPv6 has no broadcast address.
        </p>
      </figure>
      <p>
        An address is like a building&apos;s address, while a route is the delivery instruction. Shortening the written
        address does not move the building. Limits: IPv6 uses bits and configured forwarding rules, not geographical
        distance; a shared textual beginning alone does not automatically configure on-link knowledge.
      </p>
      <figure className="primer-diagram">
        <figcaption>2 · Endpoint versus transit</figcaption>
        <ol className="gre-journey">
          <li>Cedar → router&apos;s own address: local reception</li>
          <li>Cedar → router → Maple: transit between links</li>
          <li>Maple → router → Cedar: independent reply path</li>
        </ol>
        <p>
          In this bounded model, hosts manually configure on-link prefixes and default next hops. IPv6 neighbor
          resolution finds a receiver on the actual link; it is not ARP. Link-local, RA/SLAAC, DAD and ND timers are not
          simulated. Router addresses and transit permission are separate configuration facts.
        </p>
      </figure>
      {questions.map((q) => (
        <fieldset key={q.id}>
          <legend>{q.prompt}</legend>
          {q.choices.map((v) => (
            <label className="choice" key={v}>
              <input
                type="radio"
                name={`ipv6-${q.id}`}
                checked={answers[q.id] === v}
                onChange={() => {
                  setAnswers({ ...answers, [q.id]: v });
                  setChecked(false);
                }}
              />
              {v}
            </label>
          ))}
          {checked && <p>{answers[q.id] === q.correct ? "Correct distinction." : q.hint}</p>}
        </fieldset>
      ))}
      <button
        type="button"
        className="secondary"
        disabled={questions.some((q) => !answers[q.id])}
        onClick={() => setChecked(true)}
      >
        Check IPv6 reasoning
      </button>
      {checked && (
        <p role="status">
          {questions.every((q) => answers[q.id] === q.correct)
            ? "All three distinctions are correct. Try explaining the return path in your own words."
            : "Revisit the highlighted distinctions, then retry."}
        </p>
      )}
      <button type="button" className="text-button" onClick={() => setReveal(true)}>
        Reveal preparation reasoning
      </button>
      {reveal && (
        <p>
          Removing leading zeros and compressing three zero groups gives 2001:db8:44:7::a. The manually configured /64
          route covers fourth group 7, not 8, so the remote destination uses the default next hop. A router-local echo
          demonstrates that one request/reply exchange, not transit permission or every remote return path.
        </p>
      )}
      <p className="muted">
        Public conceptual practice; no saved Academy completion or mastery claim. Existing IPv4 lessons are unchanged.
      </p>
    </details>
  );
}
