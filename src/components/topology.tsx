"use client";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
  type Edge,
  type EdgeProps,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import { Monitor, Router, Network } from "lucide-react";
import "@xyflow/react/dist/style.css";
import { useSyncExternalStore } from "react";
import type { PublicLab } from "@/lib/catalog";
const subscribe = (callback: () => void) => {
  const media = window.matchMedia("(max-width:680px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};
type DeviceNode = Node<
  {
    label: string;
    kind: string;
    role: string;
    active: boolean;
    incoming: Position;
    outgoing: Position;
    logical?: boolean;
    mobile?: boolean;
  },
  "device"
>;
function NetworkDevice({ data }: NodeProps<DeviceNode>) {
  const Icon = data.kind === "pc" ? Monitor : data.kind === "switch" ? Network : Router;
  return (
    <div className={`network-device ${data.active ? "active" : ""}`}>
      <Handle type="target" position={data.incoming} />
      <Icon size={25} />
      <strong>{data.label}</strong>
      <span>{data.role}</span>
      <Handle type="source" position={data.outgoing} />
      {data.logical && (
        <>
          <Handle id="logical-out" type="source" position={data.mobile ? Position.Right : Position.Top} />
          <Handle id="logical-in" type="target" position={data.mobile ? Position.Right : Position.Top} />
        </>
      )}
    </div>
  );
}
const nodeTypes = { device: NetworkDevice };
function PhysicalEdge({ id, sourceX, sourceY, targetX, targetY, label, data, style }: EdgeProps) {
  const offset = Number(data?.offset ?? 0),
    dx = targetX - sourceX,
    dy = targetY - sourceY,
    length = Math.hypot(dx, dy) || 1;
  const x = (sourceX + targetX) / 2 - (dy / length) * offset,
    y = (sourceY + targetY) / 2 + (dx / length) * offset;
  return (
    <>
      <BaseEdge id={id} path={`M ${sourceX},${sourceY} Q ${x},${y} ${targetX},${targetY}`} style={style} />
      <EdgeLabelRenderer>
        <span
          className="physical-link-label"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${(sourceX + 2 * x + targetX) / 4}px,${(sourceY + 2 * y + targetY) / 4}px)`,
          }}
        >
          {label}
        </span>
      </EdgeLabelRenderer>
    </>
  );
}
function LogicalEdge({ id, sourceX, sourceY, targetX, targetY, data, label }: EdgeProps) {
  const mobile = !!data?.mobile;
  const x = mobile ? Math.max(sourceX, targetX) + 100 : (sourceX + targetX) / 2;
  const y = mobile ? (sourceY + targetY) / 2 : Math.min(sourceY, targetY) - 100;
  const path = mobile
    ? `M ${sourceX},${sourceY} C ${x},${sourceY} ${x},${targetY} ${targetX},${targetY}`
    : `M ${sourceX},${sourceY} C ${sourceX},${y} ${targetX},${y} ${targetX},${targetY}`;
  return (
    <>
      <BaseEdge id={id} path={path} style={{ stroke: "#a5b9d0", strokeWidth: 2, strokeDasharray: "7 6" }} />
      <EdgeLabelRenderer>
        <span
          className="physical-link-label"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${mobile ? sourceX + 75 : x}px,${mobile ? y : sourceY - 75}px)`,
          }}
        >
          {label}
        </span>
      </EdgeLabelRenderer>
    </>
  );
}
const edgeTypes = { physical: PhysicalEdge, logical: LogicalEdge };
export default function Topology({
  lab,
  selected,
  onSelect,
  compact = false,
}: {
  lab: PublicLab;
  selected: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  const mobile = useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(max-width:680px)").matches,
    () => false,
  );
  const stp = lab.id === "stp-01";
  const hsrp = lab.id === "hsrp-01";
  const logical = "logicalLinks" in lab;
  const positions = logical
    ? lab.devices.map((_, i) => (mobile ? [0, i * 180] : [i * 220, 110]))
    : hsrp
      ? mobile
        ? [
            [115, 0],
            [115, 160],
            [0, 345],
            [230, 345],
            [115, 550],
            [115, 720],
          ]
        : [
            [0, 145],
            [220, 145],
            [440, 0],
            [440, 290],
            [680, 145],
            [900, 145],
          ]
      : stp
        ? mobile
          ? [
              [0, 0],
              [0, 155],
              [230, 270],
              [0, 385],
              [0, 540],
            ]
          : [
              [0, 0],
              [0, 170],
              [210, 340],
              [420, 170],
              [420, 0],
            ]
        : mobile
          ? [
              [0, 0],
              [235, 0],
              [235, 180],
              [0, 180],
              [0, 360],
            ]
          : [
              [0, 0],
              [225, 0],
              [450, 0],
              [450, 195],
              [225, 195],
            ];
  const incoming = mobile
    ? [Position.Left, Position.Left, Position.Top, Position.Right, Position.Top]
    : [Position.Left, Position.Left, Position.Left, Position.Top, Position.Right];
  const outgoing = mobile
    ? [Position.Right, Position.Bottom, Position.Left, Position.Bottom, Position.Right]
    : [Position.Right, Position.Right, Position.Bottom, Position.Left, Position.Left];
  const nodes: Node[] = lab.devices.map((d, i) => ({
    id: d.id,
    type: "device",
    position: { x: positions[i][0], y: positions[i][1] },
    data: {
      label: d.id,
      kind: d.kind,
      role: d.role,
      active: selected === d.id,
      logical,
      mobile,
      incoming: logical
        ? mobile
          ? Position.Top
          : Position.Left
        : hsrp
          ? mobile
            ? Position.Top
            : Position.Left
          : stp && !mobile
            ? [Position.Top, Position.Top, Position.Top, Position.Left, Position.Bottom][i]
            : incoming[i],
      outgoing: logical
        ? mobile
          ? Position.Bottom
          : Position.Right
        : hsrp
          ? mobile
            ? Position.Bottom
            : Position.Right
          : stp && !mobile
            ? [Position.Bottom, Position.Right, Position.Right, Position.Top, Position.Top][i]
            : outgoing[i],
    },
    ariaLabel: `Inspect ${d.id}`,
  }));
  const edges: Edge[] =
    "physicalLinks" in lab
      ? lab.physicalLinks.map((link, index) => ({
          id: `p${index}`,
          source: link.source,
          target: link.target,
          label: link.label,
          type: "physical",
          data: { offset: link.offset * 2 },
          style: { stroke: "#536a80", strokeWidth: 2 },
        }))
      : lab.subnets.map((subnet, i) => ({
          id: `e${i}`,
          source: lab.devices[i].id,
          target: lab.devices[i + 1].id,
          label: subnet,
          type: "straight",
          style: { stroke: "#536a80", strokeWidth: 2 },
          labelStyle: { fill: "#b0bdcc", fontSize: 12 },
          labelBgStyle: { fill: "#101923" },
          labelBgPadding: [5, 7] as [number, number],
        }));
  if (logical) {
    nodes.push({
      id: "logical-gutter",
      position: mobile ? { x: 270, y: 310 } : { x: 500, y: 0 },
      data: { label: "" },
      style: { width: 1, height: 1, opacity: 0 },
      selectable: false,
      focusable: false,
      draggable: false,
    });
    for (const link of lab.logicalLinks)
      edges.push({
        id: `logical-${link.source}-${link.target}`,
        source: link.source,
        target: link.target,
        sourceHandle: "logical-out",
        targetHandle: "logical-in",
        type: "logical",
        label: link.label,
        data: { mobile },
      });
  }
  return (
    <>
      <div
        className={`${compact ? "topology compact" : "topology"}${logical ? " topology-gre" : hsrp ? " topology-hsrp" : stp ? " topology-stp" : "physicalLinks" in lab ? " topology-bundle" : ""}${lab.id === "acl-01" ? " topology-policy" : ["port-security-01", "nat-static-01"].includes(lab.id) ? " topology-desk" : ""}`}
        aria-label="Interactive network topology"
      >
        <ReactFlow
          key={`${lab.id}-${mobile ? "mobile" : "wide"}`}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={(_, node) => {
            if (lab.devices.some((d) => d.id === node.id)) onSelect(node.id);
          }}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          fitView
          fitViewOptions={{ padding: logical ? 0.1 : 0.17 }}
          minZoom={0.25}
          maxZoom={1.6}
          colorMode="dark"
          zoomOnScroll={false}
          preventScrolling={false}
        >
          <Background color="#2c3a4d" gap={22} />
          <Controls position="bottom-right" showInteractive={false} />
        </ReactFlow>
      </div>
      {logical && (
        <p className="topology-text">
          Solid physical path: PC-A — R1 — T1 — R2 — PC-B. Dashed Tunnel0: intended logical path between R1 and R2,
          carried over the physical transport. It is not a cable or proof of delivery. Tap a device or use the device
          selector.
        </p>
      )}
      {stp && (
        <p className="topology-text">
          Physical cabling: PC-A Ethernet0 — SW1 Gi0/3; SW1 Gi0/1 — SW2 Gi0/1; SW1 Gi0/2 — SW3 Gi0/1; SW2 Gi0/2 — SW3
          Gi0/2; SW3 Gi0/3 — PC-B Ethernet0. All switch links use access VLAN 10. Lines show cables, not forwarding
          state. Inspect each switch for the current tree.
        </p>
      )}
      {lab.id === "nat-static-01" && (
        <p className="topology-text">
          Physical path: PC-A Ethernet0 — R1 Gi0/0; R1 Gi0/1 — R2 Gi0/0; R2 Gi0/1 — PC-B Ethernet0. External
          representation is an address view, not a separate physical host. Tap a device or use the device selector.
        </p>
      )}
      {lab.id === "port-security-01" && (
        <p className="topology-text">
          Physical path: PC-A Ethernet0 — SW1 FastEthernet0/1; SW1 FastEthernet0/24 — R1 Gi0/0; R1 Gi0/1 — PC-B
          Ethernet0. The two switch ports use access VLAN 10. Lines show cabling, not proof of forwarding. Tap a device
          or use the device selector to investigate.
        </p>
      )}
      {hsrp && (
        <p className="topology-text">
          PC-A — SW1 connects both R1 and R2 on VLAN 10. Each router has its own routed uplink to R3, then PC-B. Shared
          gateway: 172.28.10.1 (logical identity, not an extra device). Physical member addresses: R1 172.28.10.2; R2
          172.28.10.3. Lines show cables, not Active/Standby roles. Tap a device or use the device selector to
          investigate.
        </p>
      )}
      {!stp && !hsrp && "physicalLinks" in lab && (
        <p className="topology-text">
          PC-A — SW1 ⇄ SW2 — PC-B. Two physical member links: Gi1/0/1 and Gi1/0/2 on both switches. Lines show cabling,
          not operational bundle status. Inspect each switch for logical state.
        </p>
      )}
    </>
  );
}
