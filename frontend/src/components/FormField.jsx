export function TextField({
  label,
  required = false,
  value,
  onChange,
  type = "text",
  disabled = false,
  placeholder = "",
  name,
}) {
  return (
    <div className="relative mt-2">
      <label className="absolute -top-2 left-3 bg-[#f5f6f8] px-1 text-[13px] text-gray-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full rounded-2xl px-4 pt-4 pb-3 text-[15px] ${
          disabled ? "bg-gray-100 text-gray-500" : "bg-white"
        }`}
      />
    </div>
  );
}

export function SelectField({ label, required = false, value, onClick, placeholder = "Select" }) {
  return (
    <div className="relative mt-2">
      <label className="absolute -top-2 left-3 bg-[#f5f6f8] px-1 text-[13px] text-gray-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between rounded-2xl bg-white px-4 pt-4 pb-3 text-left shadow-md"
      >
        <span className={value ? "text-[17px] text-gray-900" : "text-[17px] text-gray-900"}>
          {value || placeholder}
        </span>
        <span className="text-gray-400 text-xl leading-none">&rsaquo;</span>
      </button>
    </div>
  );
}
