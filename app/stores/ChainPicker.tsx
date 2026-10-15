"use client";

import { useRouter } from "next/navigation";
import { controlCls } from "@/components/FormParts";

export default function ChainPicker({
  chains,
  selectedId,
}: {
  chains: { id: string; name: string }[];
  selectedId: string;
}) {
  const router = useRouter();

  return (
    <select
      aria-label="チェーン"
      value={selectedId}
      onChange={(e) =>
        router.push(e.target.value ? `/stores?chain=${e.target.value}` : "/stores")
      }
      className={controlCls}
    >
      <option value="">チェーンを選択</option>
      {chains.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}