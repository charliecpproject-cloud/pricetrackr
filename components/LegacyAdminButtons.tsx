"use client";

import { useToastedActionState } from "@/lib/toast/useToastedActionState";
import {
  archiveLegacyPackage,
  moveLegacyPackage,
} from "@/app/check/legacyActions";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function LegacyAdminButtons({
  packageId,
  label,
  entries,
}: {
  packageId: string;
  label: string;
  entries: number;
}) {
  const [moveState, moveAction, moving] = useToastedActionState(
    moveLegacyPackage,
    initialState,
  );
  const [archiveState, archiveAction, archiving] = useToastedActionState(
    archiveLegacyPackage,
    initialState,
  );
  const error = moveState.error ?? archiveState.error;

  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="flex flex-wrap gap-2">
        <form
          action={moveAction}
          onSubmit={(e) => {
            if (
              !window.confirm(
                `この容量（${label}）の価格の記録${entries}件を、新しい商品に移しますか？\n移した価格は、最新価格や最安の比較に含まれるようになります。`,
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="package_id" value={packageId} />
          <button
            type="submit"
            disabled={moving || archiving}
            className="h-10 rounded-xl border border-line bg-panel px-4 text-sm font-medium text-teal-700 disabled:opacity-50"
          >
            新しい商品に移す
          </button>
        </form>
        <form
          action={archiveAction}
          onSubmit={(e) => {
            if (
              !window.confirm(
                `この容量（${label}）の旧価格をアーカイブしますか？\n画面には表示されなくなりますが、価格の記録は削除されません。`,
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="package_id" value={packageId} />
          <button
            type="submit"
            disabled={moving || archiving}
            className="h-10 rounded-xl border border-line bg-panel px-4 text-sm font-medium text-red-600 disabled:opacity-50"
          >
            アーカイブ
          </button>
        </form>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
