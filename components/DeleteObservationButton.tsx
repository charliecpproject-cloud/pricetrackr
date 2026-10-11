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
    if (!window.confirm("Delete this price entry? This cannot be undone.")) {
      e.preventDefault();
    }
  };

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      style={{ minHeight: "44px", display: "inline-block" }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="packageId" value={packageId} />
      <button
        type="submit"
        style={{
          minHeight: "44px",
          padding: "0 8px",
          background: "none",
          border: "none",
          color: "#e00",
          cursor: "pointer",
        }}
      >
        Delete
      </button>
    </form>
  );
}
