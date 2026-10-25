"use client";

import { useRouter } from "next/navigation";
import { controlCls } from "@/components/FormParts";
import { groupByCategory, parseCategory } from "@/lib/stores/category";

export default function ChainPicker({
  chains,
  selectedId,
}: {
  chains: { id: string; name: string; category: string | null }[];
  selectedId: string;
}) {
  const router = useRouter();
  const groups = groupByCategory(
    chains.map((c) => ({ ...c, category: parseCategory(c.category) })),
  );

  return (
    <select
      aria-label="チェーン"
      value={selectedId}
      onChange={(e) =>
        router.push(
          e.target.value ? `/stores?chain=${e.target.value}` : "/stores",
        )
      }
      className={controlCls}
    >
      <option value="">チェーンを選択</option>
      {groups.map((g) => (
        <optgroup key={g.key} label={g.label}>
          {g.items.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
