"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

interface Electrician {
  _id: string;
  name: string;
  phone: string;
  skills: string[];
  active: boolean;
}

// skillsText stays raw while typing; it is split into a list only when saving
const blank = () => ({ name: "", phone: "", skillsText: "", active: true });
const fromSkillsStr = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const toPayload = (f: ReturnType<typeof blank>) => ({
  name: f.name, phone: f.phone, active: f.active, skills: fromSkillsStr(f.skillsText),
});

async function saveOrAlert(res: Response, action: string) {
  if (res.ok) return res.json();
  const err = (await res.json().catch(() => ({}))) as { error?: string };
  alert(`Could not ${action}: ${err.error || res.statusText}`);
  return null;
}

export default function AdminElectriciansPage() {
  const [list, setList] = useState<Electrician[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank());
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(blank());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/electricians")
      .then((r) => r.json())
      .then(setList)
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/electricians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });
      const created = await saveOrAlert(res, "add electrician");
      if (!created) return;
      setList((prev) => [...prev, created]);
      setForm(blank());
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/electricians/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(editForm)),
      });
      const updated = await saveOrAlert(res, "save electrician");
      if (!updated) return;
      setList((prev) => prev.map((e) => (e._id === editId ? updated : e)));
      setEditId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this electrician?")) return;
    const res = await fetch(`/api/electricians/${id}`, { method: "DELETE" });
    if (!(await saveOrAlert(res, "remove electrician"))) return;
    setList((prev) => prev.filter((e) => e._id !== id));
  };

  const startEdit = (e: Electrician) => {
    setEditId(e._id);
    setEditForm({ name: e.name, phone: e.phone, skillsText: e.skills.join(", "), active: e.active });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Electricians</h1>
        <button
          type="button"
          onClick={() => { setAdding(true); setForm(blank()); }}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" /> Add
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold">New Electrician</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Phone *</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                placeholder="+91 ..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">Skills (comma separated)</label>
              <input
                value={form.skillsText}
                onChange={(e) => setForm({ ...form, skillsText: e.target.value })}
                className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                placeholder="Wiring, Fan repair, AC..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleAdd}
              className="flex items-center gap-1.5 rounded bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              <Check className="size-3.5" /> Save
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="flex items-center gap-1.5 rounded bg-muted px-4 py-1.5 text-xs font-medium"
            >
              <X className="size-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading...</div>
      ) : list.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">No electricians added yet.</div>
      ) : (
        <div className="space-y-2">
          {list.map((elec) => (
            <div key={elec._id} className="rounded-lg border border-border p-3">
              {editId === elec._id ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Name</label>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Phone</label>
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-muted-foreground">Skills</label>
                      <input
                        value={editForm.skillsText}
                        onChange={(e) => setEditForm({ ...editForm, skillsText: e.target.value })}
                        className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.active}
                        onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                      />
                      Active
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1.5 rounded bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                    >
                      <Check className="size-3.5" /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="flex items-center gap-1.5 rounded bg-muted px-4 py-1.5 text-xs font-medium"
                    >
                      <X className="size-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm">{elec.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        elec.active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                      }`}>
                        {elec.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{elec.phone}</p>
                    {elec.skills.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {elec.skills.map((s) => (
                          <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(elec)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(elec._id)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
