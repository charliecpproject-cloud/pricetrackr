// A small round choice (radio) used in filter panels: the same look as the chips on 価格確認.
export default function RadioChip({
  name,
  value,
  label,
  checked,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="flex h-10 cursor-pointer items-center justify-center rounded-xl border border-line bg-panel px-3 text-sm text-stone-600 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:font-bold has-[:checked]:text-teal-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={checked}
        className="sr-only"
      />
      {label}
    </label>
  );
}
