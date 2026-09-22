import type { Diagram } from "@/lib/academy/schema";
import { subnet } from "@/lib/academy/grading";
import { matchesAuthoredWildcard } from "@/lib/academy/wildcard";

const binary = (number: number) => number.toString(2).padStart(8, "0");
export default function LessonDiagram({ diagram }: { diagram: Diagram }) {
  let title: string;
  let visual: React.ReactNode;
  if (diagram.kind === "ospf-match") {
    title = "A network statement selects local interfaces";
    visual = (
      <>
        <p>
          <code>
            network {diagram.selector} {diagram.wildcard} area 0
          </code>
        </p>
        <p>Wildcard: 0 = compare this bit · 1 = ignore this bit</p>
        <ul className="ospf-match-list">
          {diagram.interfaces.rows.map((row) => (
            <li key={`${row.device}-${row.port}`}>
              <strong>
                {row.device} · {row.port}
              </strong>
              <code>
                {row.address}/{row.prefix}
              </code>
              <span>
                {matchesAuthoredWildcard(row.address, diagram.selector, diagram.wildcard)
                  ? "Matches → activate in area 0"
                  : "Does not match this statement"}
              </span>
              <small>{row.role}</small>
            </li>
          ))}
        </ul>
      </>
    );
  } else if (diagram.kind === "ospf-evidence") {
    title = "From configuration to tested reachability";
    visual = (
      <ol className="diagram-flow ospf-evidence-flow">
        <li>
          <small>1 · CONFIGURATION + INTERFACE</small>
          <strong>Did the intended local ports participate?</strong>
          <span>
            show running-config / show ip protocols → activation and passive policy. show ip interface brief → address
            and up/up. show ip ospf interface → actual area and point-to-point type.
          </span>
        </li>
        <li>
          <small>2 · NEIGHBOR</small>
          <strong>Did both transit peers form adjacency?</strong>
          <span>
            show ip ospf neighbor on each router → expected peer ID and FULL state. This is not a host reachability
            test.
          </span>
        </li>
        <li>
          <small>3 · LEARNED ROUTE</small>
          <strong>Is each remote LAN installed?</strong>
          <span>
            show ip route on each router → O prefix and transit next hop for the other LAN. One side’s table cannot
            establish the other side’s route.
          </span>
        </li>
        <li>
          <small>4 · HOST TESTS</small>
          <strong>Do request and reply paths work?</strong>
          <span>
            Check host address/mask/gateway; ping East from West and West from East. Record both sources and
            destinations. Success applies to these ICMP probes.
          </span>
        </li>
      </ol>
    );
  } else if (diagram.kind === "octets") {
    title = "Four octets make one IPv4 address";
    visual = (
      <>
        <div className="octet-strip">
          {diagram.address.split(".").map((value, index) => (
            <div className="diagram-cell" key={index}>
              <small>OCTET {index + 1}</small>
              <strong>{value}</strong>
              <code>{binary(Number(value))}</code>
              <span>8 bits</span>
            </div>
          ))}
        </div>
        <div className="diagram-equation">
          8 + 8 + 8 + 8 = <strong>32 bits</strong>
        </div>
        <p>Read octets 1 → 4. Each binary position is one bit, even when its value is zero.</p>
      </>
    );
  } else if (diagram.kind === "mask") {
    title = `Keep the prefix bits with /${diagram.prefix}`;
    const networkBits = diagram.prefix - 24,
      last = Number(diagram.address.split(".").at(-1));
    const mask = (255 << (8 - networkBits)) & 255;
    const result = subnet(diagram.address, diagram.prefix);
    visual = (
      <>
        <p>
          <strong>
            {diagram.address}/{diagram.prefix}
          </strong>
          <br />
          Mask: 255.255.255.{mask}
        </p>
        <p className="diagram-prefix">First 24 bits: {diagram.address.split(".").slice(0, 3).join(".")} · all kept</p>
        <div className="bit-table" aria-label="Final octet bitwise AND">
          <div className="bit-row">
            <span>Bit role</span>
            {Array.from({ length: 8 }, (_, index) => (
              <small key={index}>{index < networkBits ? "N" : "H"}</small>
            ))}
          </div>
          {[
            ["Address", last],
            ["Mask", mask],
            ["AND", last & mask],
          ].map(([label, value]) => (
            <div className="bit-row" key={label}>
              <span>{label}</span>
              {binary(Number(value))
                .split("")
                .map((bit, index) => (
                  <b className={index < networkBits ? "network-bit" : "host-bit"} key={index}>
                    {bit}
                  </b>
                ))}
            </div>
          ))}
        </div>
        <p>
          N = network bit · H = host bit
          <br />1 AND 1 = 1; every other pair gives 0.
        </p>
        <div className="diagram-equation">
          Network = <strong>{result.network}</strong>
        </div>
      </>
    );
  } else if (diagram.kind === "range") {
    title = `Inside ${subnet(diagram.address, diagram.prefix).network}/${diagram.prefix}`;
    const range = subnet(diagram.address, diagram.prefix);
    visual = (
      <>
        <ol className="diagram-flow range-flow">
          <li>
            <small>NETWORK · HOST BITS ALL 0</small>
            <strong>{range.network}</strong>
            <span>Names the subnet; not a host address here.</span>
          </li>
          <li className="usable-range">
            <small>USABLE HOSTS · {range.hosts} ADDRESSES</small>
            <strong>
              {range.first} – {range.last}
            </strong>
            <span>Example host {diagram.address} is inside this interval.</span>
          </li>
          <li>
            <small>BROADCAST · HOST BITS ALL 1</small>
            <strong>{range.broadcast}</strong>
            <span>Subnet-directed broadcast; not a unicast host here.</span>
          </li>
        </ol>
        <p>/31 and /32 use different rules and are outside this host-range example.</p>
      </>
    );
  } else if (diagram.kind === "delivery") {
    title = "One host, two next-hop decisions";
    visual = (
      <>
        <div className="diagram-origin">
          <small>SOURCE PC-A</small>
          <strong>192.168.10.10/24</strong>
          <span>Compare destination & mask → 192.168.10.0?</span>
        </div>
        <div className="delivery-branches">
          <div className="diagram-cell">
            <small>↓ SAME NETWORK · LOCAL</small>
            <strong>192.168.10.55</strong>
            <p>Next-hop IP: the peer itself</p>
            <div className="packet-label">
              IP destination
              <br />
              <b>192.168.10.55</b>
            </div>
            <div className="frame-label">
              Frame destination
              <br />
              <b>Local peer’s MAC</b>
            </div>
          </div>
          <div className="diagram-cell">
            <small>↓ DIFFERENT NETWORK · REMOTE</small>
            <strong>192.168.20.10</strong>
            <p>Next-hop IP: gateway 192.168.10.1</p>
            <div className="packet-label">
              IP destination
              <br />
              <b>192.168.20.10</b>
            </div>
            <div className="frame-label">
              Frame destination
              <br />
              <b>Gateway’s MAC</b>
            </div>
          </div>
        </div>
        <p>Local classification is a routing decision, not proof of a working cable, VLAN or destination.</p>
      </>
    );
  } else {
    title = "ARP finds the next handoff";
    visual = (
      <ol className="diagram-flow arp-flow">
        <li>
          <small>1 · REQUEST / LOCAL BROADCAST</small>
          <strong>PC-A → local Ethernet network</strong>
          <span>“Who has 192.168.10.1?” The chosen next hop is the gateway.</span>
        </li>
        <li>
          <small>2 · REPLY / BACK TO PC-A</small>
          <strong>Gateway → PC-A</strong>
          <span>“192.168.10.1 is at 02-aa-bb-cc-dd-01.” This example MAC identifies its local interface.</span>
        </li>
        <li>
          <small>3 · SEND THE DATA FRAME</small>
          <strong>PC-A → gateway’s MAC</strong>
          <span>
            Ethernet destination: 02-aa-bb-cc-dd-01
            <br />
            IP destination: 192.168.20.10 (still PC-B)
          </span>
        </li>
      </ol>
    );
  }
  return (
    <figure className={`lesson-diagram diagram-${diagram.kind}`} aria-label={title}>
      <figcaption>
        <span className="eyebrow">SEE THE RELATIONSHIP</span>
        <h3>{title}</h3>
      </figcaption>
      {visual}
      <p className="diagram-caption">{diagram.caption}</p>
    </figure>
  );
}
