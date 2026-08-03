import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useData } from "../context/DataContext";

function Field({ label, required = false, children }) {
  return (
    <div className="mt-4">
      <label className="block text-gray-500 text-[13px] mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-[14px] text-gray-900 placeholder:text-gray-400";

export default function AddBorrower() {
  const navigate = useNavigate();
  const { addBorrower } = useData();

  const [form, setForm] = useState({
    aadhar: "",
    name: "",
    fatherName: "",
    mobile: "",
    mobile2: "",
    shopWork: "",
    address: "",
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.name || !form.fatherName || !form.mobile || !form.shopWork || !form.address) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      await addBorrower(form);
      navigate("/borrowers");
    } catch (err) {
      alert(err.message || "Unable to save borrower. Please try again.");
    }
  }

  return (
    <div className="app-shell">
      <header className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-200 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="text-primary" aria-label="Go back">
          <ArrowLeft size={26} />
        </button>
        <h1 className="text-2xl font-bold text-primary">Create New Borrower</h1>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-6 bg-gray-50">
        <div className="rounded-2xl bg-white shadow-md p-5 border-none space-y-4">
          <Field label="Aadhar No">
          <input
            value={form.aadhar}
            onChange={(e) => update("aadhar", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Name" required>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Father Name" required>
          <input
            value={form.fatherName}
            onChange={(e) => update("fatherName", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Mobile" required>
          <input
            value={form.mobile}
            onChange={(e) => update("mobile", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Mobile2">
          <input
            value={form.mobile2}
            onChange={(e) => update("mobile2", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Shop / Work" required>
          <input
            value={form.shopWork}
            onChange={(e) => update("shopWork", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Address" required>
          <input
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Door number, street, city"
            className={inputClass}
          />
        </Field>

          <button
            onClick={handleSave}
            className="w-full bg-primary text-white rounded-2xl py-3 font-bold mt-1 shadow-md"
          >
          SAVE BORROWER
          </button>
        </div>
      </main>
    </div>
  );
}
