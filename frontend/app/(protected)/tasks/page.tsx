"use client";

import { useState, useEffect } from "react";
import { getApiClient } from "@/src/lib/api";
import type { Task, TaskPriority, TaskStatus, Customer } from "@/src/types";
import Modal from "@/src/components/Modal";

const PRIORITY_OPTIONS: TaskPriority[] = ["Low", "Medium", "High"];
const STATUS_OPTIONS: TaskStatus[] = ["Todo", "In Progress", "Done"];
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  Low: "bg-blue-100 text-blue-700", Medium: "bg-yellow-100 text-yellow-700", High: "bg-red-100 text-red-700",
};
const STATUS_COLORS: Record<TaskStatus, string> = {
  Todo: "bg-zinc-100 text-zinc-600", "In Progress": "bg-purple-100 text-purple-700", Done: "bg-green-100 text-green-700",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", priority: "Medium" as TaskPriority,
    status: "Todo" as TaskStatus, due_date: "", customer_id: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getApiClient().get<Task[]>("/api/tasks"),
      getApiClient().get<Customer[]>("/api/customers"),
    ]).then(([taskRes, custRes]) => {
      if (cancelled) return;
      if (taskRes.data) setTasks(taskRes.data);
      if (custRes.data) setCustomers(custRes.data);
    }).catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function load() {
    Promise.all([
      getApiClient().get<Task[]>("/api/tasks"),
      getApiClient().get<Customer[]>("/api/customers"),
    ]).then(([taskRes, custRes]) => {
      if (taskRes.data) setTasks(taskRes.data);
      if (custRes.data) setCustomers(custRes.data);
    }).catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  function openAdd() {
    setEditing(null);
    setForm({ title: "", description: "", priority: "Medium", status: "Todo", due_date: "", customer_id: 0 });
    setModalOpen(true);
  }

  function openEdit(t: Task) {
    setEditing(t);
    setForm({
      title: t.title, description: t.description, priority: t.priority, status: t.status,
      due_date: t.due_date ?? "", customer_id: t.customer_id ?? 0,
    });
    setModalOpen(true);
  }
async function handleSave() {
    setSaving(true);
    try {
      const body = { ...form, due_date: form.due_date || null, customer_id: form.customer_id || null };
      if (editing) {
        await getApiClient().put<Task>("/api/tasks/" + editing.id, body);
      } else {
        await getApiClient().post<Task>("/api/tasks", body);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this task?")) return;
    try {
      await getApiClient().del("/api/tasks/" + id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function customerName(id: number | null) {
    if (!id) return "\u2014";
    return customers.find((c) => c.id === id)?.name ?? "Customer #" + id;
  }

  if (loading) {
    return (<div><h1 className="text-2xl font-bold text-zinc-900">Tasks</h1><p className="mt-4 text-zinc-500">Loading...</p></div>);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Tasks</h1>
        <button onClick={openAdd} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">+ Add Task</button>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
      {tasks.length === 0 ? (
        <p className="text-zinc-500">No tasks yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr><th className="px-4 py-3 font-medium text-zinc-600">Title</th><th className="px-4 py-3 font-medium text-zinc-600">Customer</th><th className="px-4 py-3 font-medium text-zinc-600">Priority</th><th className="px-4 py-3 font-medium text-zinc-600">Status</th><th className="px-4 py-3 font-medium text-zinc-600">Due Date</th><th className="px-4 py-3 font-medium text-zinc-600">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">{t.title}</td>
                  <td className="px-4 py-3 text-zinc-600">{customerName(t.customer_id)}</td>
                  <td className="px-4 py-3"><span className={"inline-block rounded-full px-2 py-0.5 text-xs font-medium " + PRIORITY_COLORS[t.priority]}>{t.priority}</span></td>
                  <td className="px-4 py-3"><span className={"inline-block rounded-full px-2 py-0.5 text-xs font-medium " + STATUS_COLORS[t.status]}>{t.status}</span></td>
                  <td className="px-4 py-3 text-zinc-600">{t.due_date ? new Date(t.due_date).toLocaleDateString() : "\u2014"}</td>
                  <td className="space-x-2 px-4 py-3">
                    <button onClick={() => openEdit(t)} className="rounded px-2 py-1 text-sm text-blue-600 hover:bg-blue-50">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
<Modal open={modalOpen} title={editing ? "Edit Task" : "Add Task"} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div><label className="mb-1 block text-sm font-medium text-zinc-700">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-sm font-medium text-zinc-700">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" rows={3} /></div>
          <div><label className="mb-1 block text-sm font-medium text-zinc-700">Customer</label>
            <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: Number(e.target.value) })} className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value={0}>None</option>
              {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select></div>
          <div className="flex gap-4">
            <div className="flex-1"><label className="mb-1 block text-sm font-medium text-zinc-700">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })} className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {PRIORITY_OPTIONS.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select></div>
            <div className="flex-1"><label className="mb-1 block text-sm font-medium text-zinc-700">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })} className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-zinc-700">Due Date</label>
            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}