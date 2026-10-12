"use client";

import React from "react";

type DeleteObservationButtonProps = {
  id: string;
  packageId: string;
  action: (formData: FormData) => Promise<void>;
};

export default function DeleteObservationButton({
  id,
  packageId,
  action,
}: DeleteObservationButtonProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (
      !window.confirm(
        "この価格を削除しますか？この操作は元に戻せません。"
      )
    ) {
      e.preventDefault();
    }
  };

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      style={{ minHeight: "44px" }}
      className="inline-block"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="packageId" value={packageId} />
      <button
        type="submit"
        className="h-11 px-2 bg-transparent border-0 text-red-600 cursor-pointer"
      >
        削除
      </button>
    </form>
  );
}
