"use client";

import React from "react";

type DeleteObservationButtonProps = {
  id: string;
  packageId: string;
  action: (formData: FormData) => Promise<void>;
  disabled?: boolean;
};

export default function DeleteObservationButton({
  id,
  packageId,
  action,
  disabled = false,
}: DeleteObservationButtonProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm("この価格を削除しますか？この操作は元に戻せません。")) {
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
        disabled={disabled}
        className="h-11 px-2 bg-transparent border-0 text-red-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      >
        削除
      </button>
    </form>
  );
}
