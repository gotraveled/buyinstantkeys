import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { LockKey, ShieldCheck } from "@phosphor-icons/react";

export default function AdminLogin() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post("/admin/login", form);
      localStorage.setItem("bik_admin_token", r.data.token);
      localStorage.setItem("bik_admin_email", r.data.email);
      toast.success("Signed in");
      nav("/admin");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-md rounded-xl border border-neutral-200 bg-white p-8">
        <div className="flex items-center gap-2">
          <ShieldCheck size={22} weight="duotone" />
          <div className="font-display font-semibold">Admin panel</div>
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-600">Enter your admin credentials to manage orders and products.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Email</label>
            <input data-testid="admin-login-email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-300 px-4 py-3 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Password</label>
            <input data-testid="admin-login-password" required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-300 px-4 py-3 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400" />
          </div>
          <button data-testid="admin-login-submit" type="submit" disabled={loading} className="btn-primary w-full">
            <LockKey size={18} weight="duotone" /> {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
