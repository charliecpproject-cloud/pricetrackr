"use client";

import { startTransition, useOptimistic } from "react";
import { Heart } from "lucide-react";
import { setFavorite } from "@/app/check/favoriteActions";
import type { FavoriteLevel } from "@/lib/prices/favorites";

// A heart that adds or removes a favorite 容量. It changes at once and is saved in the background;
// if saving fails it goes back. "related" (another size of the same variation is a favorite)
// shows a faded outline heart; tapping it makes this size a favorite too.
export default function FavoriteButton({
  packageId,
  level,
}: {
  packageId: string;
  level: FavoriteLevel;
}) {
  const [favorite, setFavoriteOptimistic] = useOptimistic(level === "favorite");

  const toggle = () => {
    const next = !favorite;
    startTransition(async () => {
      setFavoriteOptimistic(next);
      const result = await setFavorite(packageId, next);
      if (result.error) console.error(result.error);
    });
  };

  const tone = favorite
    ? "text-rose-600"
    : level === "related"
      ? "text-rose-600 opacity-60"
      : "text-stone-400";
  const label = favorite ? "お気に入りを解除" : "お気に入りに追加";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favorite}
      aria-label={label}
      title={
        !favorite && level === "related" ? "同じバリエーションの別の容量がお気に入りです" : label
      }
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-90 ${tone}`}
    >
      <Heart className={`h-5 w-5 ${favorite ? "fill-current" : ""}`} />
    </button>
  );
}