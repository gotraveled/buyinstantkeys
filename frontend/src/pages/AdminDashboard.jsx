import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { SignOut, Package, Envelope, CurrencyDollar, ShieldCheck, Clock, CheckCircle } from "@phosphor-icons/react";

export default function AdminDashboard() {
  const nav = useNavigate();
  const [tab, setTab] = useState("orders");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("bik_admin_token") : null;
  const adminEmail = typeof window !== "undefined" ? localStorage.getItem("bik_admin_email") : null;

  const load = useCallback(async () => {
    try {
      const [s, o, p] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/orders", { params: filter ? { status: filter } : {} }),
        api.get("/admin/products"),
      ]);
      setStats(s.data); setOrders(o.data); setProducts(p.data);
    } catch (e) {
      if (e?.response?.status === 401) {
        localStorage.removeItem("bik_admin_token");
        nav("/admin/login");
      }
    }
  }, [filter, nav]);

  useEffect(() => {
    if (!token) { nav("/admin/login"); return; }
    load();
     
  }, [token, load, nav]);

  const logout = () => {
    localStorage.removeItem("bik_admin_token");
    localStorage.removeItem("bik_admin_email");
    nav("/admin/login");
  };

  const StatCard = ({ icon, label, value, testId }) => (
    <div data-testid={testId} className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-900 text-[#FCE029]">{icon}</div>
      <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Admin</div>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Store dashboard</h1>
          <div className="mt-1 text-sm text-neutral-500">Signed in as {adminEmail}</div>
        </div>
        <button onClick={logout} data-testid="admin-logout-btn" className="btn-outline"><SignOut size={18} weight="duotone" /> Sign out</button>
      </div>

      {stats && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={<CurrencyDollar size={18} weight="duotone" />} label="Revenue" value={`$${stats.revenue.toFixed(2)}`} testId="stat-revenue" />
          <StatCard icon={<Package size={18} weight="duotone" />} label="Orders" value={stats.total_orders} testId="stat-total-orders" />
          <StatCard icon={<Clock size={18} weight="duotone" />} label="Awaiting delivery" value={stats.paid} testId="stat-paid" />
          <StatCard icon={<CheckCircle size={18} weight="duotone" />} label="Delivered" value={stats.delivered} testId="stat-delivered" />
          <StatCard icon={<ShieldCheck size={18} weight="duotone" />} label="Products" value={stats.products} testId="stat-products" />
        </div>
      )}

      <div className="mt-10 flex gap-1 border-b border-neutral-200">
        {[
          { k: "orders", label: "Orders" },
          { k: "products", label: "Products" },
        ].map((t) => (
          <button
            key={t.k}
            data-testid={`admin-tab-${t.k}`}
            onClick={() => setTab(t.k)}
            className={`px-4 py-2 text-sm font-semibold ${tab === t.k ? "border-b-2 border-neutral-900 text-neutral-900" : "text-neutral-500 hover:text-neutral-900"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {["", "pending", "paid", "delivered", "cancelled"].map((s) => (
              <button
                key={s || "all"}
                data-testid={`admin-filter-${s || "all"}`}
                onClick={() => setFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${filter === s ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900"}`}
              >
                {s || "All"}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {orders.map((o) => <OrderRow key={o.id} order={o} onChange={load} />)}
            {orders.length === 0 && (
              <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-neutral-500">No orders yet.</div>
            )}
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600">
              <tr><th className="p-4">Product</th><th className="p-4">Category</th><th className="p-4">Variants</th><th className="p-4">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {products.map((p) => (
                <tr key={p.id} data-testid={`admin-product-${p.slug}`}>
                  <td className="p-4"><div className="font-semibold">{p.name}</div><div className="text-xs text-neutral-500">{p.slug}</div></td>
                  <td className="p-4">{p.category}</td>
                  <td className="p-4">{p.variants.length}</td>
                  <td className="p-4">{p.is_active ? <span className="badge-trust">Active</span> : <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">Hidden</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, onChange }) {
  const [open, setOpen] = useState(false);
  const [keys, setKeys] = useState(order.items.map((it) => it.license_key || ""));
  const [note, setNote] = useState(order.admin_notes || "");
  const [saving, setSaving] = useState(false);

  const statusColor = {
    pending: "bg-neutral-100 text-neutral-700",
    paid: "bg-yellow-100 text-yellow-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
  }[order.status] || "bg-neutral-100";

  const deliver = async () => {
    if (keys.some((k) => !k.trim())) {
      toast.error("Please enter a license key for every item.");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/admin/orders/${order.id}/deliver`, {
        keys: keys.map((k) => ({ license_key: k.trim() })),
        admin_note: note.trim() || null,
      });
      toast.success("Keys delivered — email sent");
      setOpen(false);
      onChange && onChange();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to deliver");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white" data-testid={`admin-order-${order.order_number}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="font-mono text-sm font-semibold">{order.order_number}</div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor}`}>{order.status}</span>
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            {order.customer_name} · {order.customer_email} · ${order.total.toFixed(2)} · {new Date(order.created_at).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order.status === "paid" && (
            <button onClick={() => setOpen(!open)} data-testid={`admin-deliver-toggle-${order.order_number}`} className="btn-primary">
              <Envelope size={16} weight="duotone" /> Deliver keys
            </button>
          )}
          {order.status === "delivered" && (
            <button onClick={() => setOpen(!open)} className="btn-outline">View keys</button>
          )}
        </div>
      </div>
      {open && (
        <div className="border-t border-neutral-200 bg-neutral-50 p-4">
          {order.items.map((it, i) => (
            <div key={i} className="mb-3">
              <div className="text-sm font-semibold">{it.product_name} <span className="text-neutral-500">— {it.variant_label} × {it.quantity}</span></div>
              <input
                data-testid={`admin-key-input-${order.order_number}-${i}`}
                value={keys[i]}
                onChange={(e) => setKeys(keys.map((k, idx) => idx === i ? e.target.value : k))}
                placeholder="Paste license key here"
                disabled={order.status === "delivered"}
                className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 disabled:bg-neutral-100"
              />
            </div>
          ))}
          {order.status !== "delivered" && (
            <>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note (optional)" rows={2} className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400" />
              <div className="mt-3">
                <button onClick={deliver} disabled={saving} data-testid={`admin-deliver-btn-${order.order_number}`} className="btn-primary">
                  {saving ? "Sending..." : "Send keys via email"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
