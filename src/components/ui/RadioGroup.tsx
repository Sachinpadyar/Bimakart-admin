export function RadioGroup() {
  return (
    <div>
      <p className="text-xs text-gray-600 mb-2">Payment Option*</p>
      <div className="flex gap-4 text-sm">
        <label>
          <input type="radio" name="pay" /> Monthly
        </label>
        <label>
          <input type="radio" name="pay" /> Quarterly
        </label>
        <label>
          <input type="radio" name="pay" /> Yearly
        </label>
      </div>
    </div>
  );
}
