import type { z } from "zod";
import type { interfaceTableSchema } from "@/lib/academy/schema";

export default function InterfaceTable({ table }: { table: z.infer<typeof interfaceTableSchema> }) {
  return (
    <div className="academy-address-table" role="region" aria-label={table.title}>
      <h3>{table.title}</h3>
      <ul>
        {table.rows.map((row) => (
          <li key={`${row.device}-${row.port}`}>
            <strong>
              {row.device} · {row.port}
            </strong>
            <code>
              {row.address}/{row.prefix}
            </code>
            <span>{row.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
