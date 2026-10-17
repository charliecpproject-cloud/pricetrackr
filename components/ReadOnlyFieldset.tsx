import type { ReactNode } from "react";

// Demo mode: for visitors without an account, turns off every input and
// button inside. For logged-in users the children are rendered unchanged.
export default function ReadOnlyFieldset({
  readOnly,
  children,
}: {
  readOnly: boolean;
  children: ReactNode;
}) {
  if (!readOnly) return <>{children}</>;
  return (
    <fieldset disabled className="m-0 min-w-0 border-0 p-0 opacity-60">
      {children}
    </fieldset>
  );
}