"use client";
import { ReactFlow, Background, Controls, Handle, Position, type NodeProps, type Node } from "@xyflow/react";
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
  { label: string; kind: string; role: string; active: boolean; incoming: Position; outgoing: Position },
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
    </div>
  );
}
const nodeTypes = { device: NetworkDevice };
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
  const positions = mobile
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
  const nodes: DeviceNode[] = lab.devices.map((d, i) => ({
    id: d.id,
    type: "device",
    position: { x: positions[i][0], y: positions[i][1] },
    data: {
      label: d.id,
      kind: d.kind,
      role: d.role,
      active: selected === d.id,
      incoming: incoming[i],
      outgoing: outgoing[i],
    },
    ariaLabel: `Inspect ${d.id}`,
  }));
  const edges = lab.subnets.map((subnet, i) => ({
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
  return (
    <div className={compact ? "topology compact" : "topology"} aria-label="Interactive network topology">
      <ReactFlow
        key={`${lab.id}-${mobile ? "mobile" : "wide"}`}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelect(node.id)}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesFocusable={false}
        fitView
        fitViewOptions={{ padding: 0.17 }}
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
  );
}
