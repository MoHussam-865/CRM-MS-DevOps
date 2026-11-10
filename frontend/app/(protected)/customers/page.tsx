"use client";

import { useState, useEffect } from "react";
import { getApiClient } from "@/src/lib/api";
import type { Customer, CustomerStatus, Company } from "@/src/types";
import Modal from "@/src/components/Modal";

const STATUS_OPTIONS: CustomerStatus[] = ["Lead", "Customer", "Inactive"];
const STATUS_COLORS: Record<CustomerStatus, string> = {
  Lead: "bg-yellow-100 text-yellow-700", Customer: "bg-green-100 text-green-700", Inactive: "bg-zinc-100 text-zinc-600",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    company_id: 0, name: "", email: "", phone: "", position: "", status: "Lead" as CustomerStatus,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getApiClient().get<Customer[]>("/api/customers"),
      getApiClient().get<Company[]>("/api/companies"),
    ]).then(([custRes, compRes]) => {
      if (cancelled) return;
      if (custRes.data) setCustomers(custRes.data);
      if (compRes.data) setCompanies(compRes.data);
    }).catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function reload() {
    Promise.all([
      getApiClient().get<Customer[]>("/api/customers"),
      getApiClient().get<Company[]>("/api/companies"),
    ]).then(([custRes, compRes]) => {
      if (custRes.data) setCustomers(custRes.data);
      if (compRes.data) setCompanies(compRes.data);
    }).catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  function openAdd() {
    setEditing(null);
    setForm({ company_id: companies[0]?.id ?? 0, name: "", email: "", phone: "", position: "", status: "Lead" });
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ company_id: c.company_id, name: c.name, email: c.email, phone: c.phone, position: c.position, status: c.status });
    setModalOpen(true);
  }
async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await getApiClient().put<Customer>("/api/customers/" + editing.id, form);
      } else {
        await getApiClient().post<Customer>("/api/customers", form);
      }
      setModalOpen(false);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this customer?")) return;
    try {
      await getApiClient().del("/api/customers/" + id);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function companyName(id: number) {
    return companies.find((c) => c.id === id)?.name ?? "Company #" + id;
  }

  if (loading) {
    return (<div><h1 className="text-2xl font-bold text-zinc-900">Customers</h1><p className="mt-4 text-zinc-500">Loading...</p></div>);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Customers</h1>
        <button onClick={openAdd} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">+ Add Customer</button>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
      {customers.length === 0 ? (
        <p className="text-zinc-500">No customers yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr><th className="px-4 py-3 font-medium text-zinc-600">Name</th><th className="px-4 py-3 font-medium text-zinc-600">Company</th><th className="px-4 py-3 font-medium text-zinc-600">Email</th><th className="px-4 py-3 font-medium text-zinc-600">Phone</th><th className="px-4 py-3 font-medium text-zinc-600">Position</th><th className="px-4 py-3 font-medium text-zinc-600">Status</th><th className="px-4 py-3 font-medium text-zinc-600">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">{c.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{companyName(c.company_id)}</td>
                  <td className="px-4 py-3 text-zinc-600">{c.email}</td>
                  <td className="px-4 py-3 text-zinc-600">{c.phone}</td>
                  <td className="px-4 py-3 text-zinc-600">{c.position}</td>
                  <td className="px-4 py-3"><span className={"inline-block rounded-full px-2 py-0.5 text-xs font-medium " + STATUS_COLORS[c.status]}>{c.status}</span></td>
                  <td className="space-x-2 px-4 py-3">
                    <button onClick={() => openEdit(c)} className="rounded px-2 py-1 text-sm text-blue-600 hover:bg-blue-50">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
<Modal open={modalOpen} title={editing ? "Edit Customer" : "Add Customer"} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div><label className="mb-1 block text-sm font-medium text-zinc-700">Company</label>
            <select value={form.company_id} onChange={(e) => setForm({ ...form, company_id: Number(e.target.value) })} className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value={0} disabled>Select a company</option>
              {companies.map((comp) => (<option key={comp.id} value={comp.id}>{comp.name}</option>))}
            </select></div>
          <div><label className="mb-1 block text-sm font-medium text-zinc-700">Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-sm font-medium text-zinc-700">Phone</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-sm font-medium text-zinc-700">Position</label>
            <input type="text" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-sm font-medium text-zinc-700">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CustomerStatus })} className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select></div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim() || form.company_id === 0} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}