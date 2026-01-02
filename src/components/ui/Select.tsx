export function Select({ label }: { label: string }) {
  return (
    <div>
      <label className="text-xs text-gray-600">{label}</label>
      <select className="w-full border rounded-md px-3 py-2 mt-1 text-sm">
        <option>Select an option</option>
      </select>
    </div>
  );
}
