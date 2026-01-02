export function Input({ label }: { label: string }) {
  return (
    <div>
      <label className="text-xs text-gray-600">{label}</label>
      <input className="w-full border rounded-md px-3 py-2 mt-1 text-sm" />
    </div>
  );
}
