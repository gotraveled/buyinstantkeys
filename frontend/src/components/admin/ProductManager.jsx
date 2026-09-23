import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, PencilSimple, Trash, X, ArrowLeft, Eye, EyeSlash, Star } from "@phosphor-icons/react";

const BRANDS = ["Norton", "Webroot", "McAfee"];
const BOX_VARIANTS = ["gold", "amber", "black", "green", "red", "purple"];

const INP = "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 disabled:bg-neutral-100";

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const emptyVariant = () => ({ id: "", devices: 1, years: 1, label: "", price: "", original_price: "" });

const emptyProduct = () => ({
  slug: "", name: "", tagline: "", description: "", category: "",
  brand: "Norton", box_variant: "gold", image_url: "", badge: "",
  featuresText: "", variants: [emptyVariant()], is_featured: false, is_active: true,
});

const toForm = (p) => ({
  ...p,
  badge: p.badge || "",
  image_url: p.image_url || "",
  box_variant: p.box_variant || "gold",
  featuresText: (p.features || []).join("\n"),
  variants: (p.variants && p.variants.length ? p.variants : [emptyVariant()]).map((v) => ({
    id: v.id || "",
    devices: v.devices ?? 1,
    years: v.years ?? 1,
    label: v.label || "",
    price: v.price ?? "",
    original_price: v.original_price ?? "",
  })),
});

export default function ProductManager({ products, onChange }) {
  const [editing, setEditing] = useState(null); // null = list, object = form
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const startNew = () => { setIsNew(true); setEditing(emptyProduct()); };
  const startEdit = (p) => { setIsNew(false); setEditing(toForm(p)); };
  const cancel = () => { setEditing(null); setIsNew(false); };

  const set = (k, v) => setEditing((e) => ({ ...e, [k]: v }));
  const setVariant = (i, k, v) =>
    setEditing((e) => ({ ...e, variants: e.variants.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)) }));
  const addVariant = () => setEditing((e) => ({ ...e, variants: [...e.variants, emptyVariant()] }));
  const removeVariant = (i) =>
    setEditing((e) => ({ ...e, variants: e.variants.filter((_, idx) => idx !== i) }));

  const toggleActive = async (p) => {
    try {
      await api.patch(`/admin/products/${p.id}`, { is_active: !p.is_active });
      toast.success(p.is_active ? "Product hidden" : "Product activated");
      onChange && onChange();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to update product");
    }
  };

  const toggleFeatured = async (p) => {
    try {
      await api.patch(`/admin/products/${p.id}`, { is_featured: !p.is_featured });
      toast.success(p.is_featured ? "Removed from featured" : "Marked as featured");
      onChange && onChange();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to update product");
    }
  };

  const doDelete = async (p) => {
    try {
      await api.delete(`/admin/products/${p.id}`);
      toast.success("Product deleted");
      setConfirmDelete(null);
      onChange && onChange();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to delete product");
    }
  };

  const save = async () => {
    if (!editing.name.trim() || !editing.slug.trim() || !editing.category.trim()) {
      toast.error("Name, slug and category are required.");
      return;
    }
    const variants = editing.variants
      .filter((v) => v.label.trim() !== "")
      .map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        devices: Number(v.devices) || 1,
        years: Number(v.years) || 1,
        label: v.label.trim(),
        price: Number(v.price) || 0,
        original_price: v.original_price === "" ? null : Number(v.original_price),
      }));
    if (variants.length === 0) {
      toast.error("Add at least one variant with a label and price.");
      return;
    }
    const payload = {
      slug: editing.slug.trim(),
      name: editing.name.trim(),
      tagline: editing.tagline.trim(),
      description: editing.description.trim(),
      category: editing.category.trim(),
      brand: editing.brand,
      box_variant: editing.box_variant,
      image_url: editing.image_url.trim(),
      badge: editing.badge.trim() || null,
      features: editing.featuresText.split("\n").map((s) => s.trim()).filter(Boolean),
      variants,
      is_featured: !!editing.is_featured,
      is_active: !!editing.is_active,
    };
    setSaving(true);
    try {
      if (isNew) {
        await api.post("/admin/products", payload);
        toast.success("Product created");
      } else {
        await api.patch(`/admin/products/${editing.id}`, payload);
        toast.success("Product updated");
      }
      cancel();
      onChange && onChange();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  if (confirmDelete) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
          <h3 className="font-display text-lg font-semibold">Delete product?</h3>
          <p className="mt-2 text-sm text-neutral-600">
            This will permanently remove <span className="font-semibold">{confirmDelete.name}</span> ({confirmDelete.slug}). This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setConfirmDelete(null)} className="btn-outline">Cancel</button>
            <button onClick={() => doDelete(confirmDelete)} className="btn-danger bg-red-600 text-white hover:bg-red-700">Delete</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- FORM VIEW ----------
  if (editing) {
    return (
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 p-4">
          <button onClick={cancel} className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-600 hover:text-neutral-900">
            <ArrowLeft size={16} weight="bold" /> Back to products
          </button>
          <div className="font-display font-semibold">{isNew ? "Add product" : `Edit: ${editing.name}`}</div>
        </div>

        <div className="grid gap-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name *">
              <input
                value={editing.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setEditing((x) => ({ ...x, name, slug: isNew ? slugify(name) : x.slug }));
                }}
                className={INP} placeholder="Norton 360 Deluxe"
              />
            </Field>
            <Field label="Slug *">
              <input value={editing.slug} onChange={(e) => set("slug", slugify(e.target.value))} className={`${INP} font-mono`} placeholder="norton-360-deluxe" disabled={!isNew} />
            </Field>
          </div>

          <Field label="Tagline">
            <input value={editing.tagline} onChange={(e) => set("tagline", e.target.value)} className={INP} placeholder="Short one-line summary" />
          </Field>

          <Field label="Description">
            <textarea value={editing.description} onChange={(e) => set("description", e.target.value)} rows={3} className={INP} placeholder="Full product description" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Category *">
              <input value={editing.category} onChange={(e) => set("category", e.target.value)} className={INP} placeholder="Antivirus" />
            </Field>
            <Field label="Brand">
              <select value={editing.brand} onChange={(e) => set("brand", e.target.value)} className={INP}>
                {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Box style">
              <select value={editing.box_variant} onChange={(e) => set("box_variant", e.target.value)} className={INP}>
                {BOX_VARIANTS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Badge (optional)">
              <input value={editing.badge} onChange={(e) => set("badge", e.target.value)} className={INP} placeholder="e.g. Bestseller" />
            </Field>
            <Field label="Image URL (optional)">
              <input value={editing.image_url} onChange={(e) => set("image_url", e.target.value)} className={INP} placeholder="/images/products/slug.svg" />
            </Field>
          </div>

          <Field label="Features (one per line)">
            <textarea value={editing.featuresText} onChange={(e) => set("featuresText", e.target.value)} rows={4} className={INP} placeholder={"Real-time protection\nSecure VPN\nPassword Manager"} />
          </Field>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">Variants / plans *</div>
              <button onClick={addVariant} className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-700 hover:text-neutral-900">
                <Plus size={14} weight="bold" /> Add variant
              </button>
            </div>
            <div className="mt-2 space-y-2">
              <div className="hidden grid-cols-12 gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 sm:grid">
                <div className="col-span-4">Label</div><div className="col-span-2">Devices</div><div className="col-span-2">Years</div><div className="col-span-2">Price $</div><div className="col-span-2">Retail $</div>
              </div>
              {editing.variants.map((v, i) => (
                <div key={i} className="grid grid-cols-12 items-center gap-2">
                  <input value={v.label} onChange={(e) => setVariant(i, "label", e.target.value)} placeholder="3 Devices / 1 Year" className={`${INP} col-span-12 sm:col-span-4`} />
                  <input type="number" min="1" value={v.devices} onChange={(e) => setVariant(i, "devices", e.target.value)} className={`${INP} col-span-4 sm:col-span-2`} />
                  <input type="number" min="1" value={v.years} onChange={(e) => setVariant(i, "years", e.target.value)} className={`${INP} col-span-4 sm:col-span-2`} />
                  <input type="number" step="0.01" min="0" value={v.price} onChange={(e) => setVariant(i, "price", e.target.value)} placeholder="0.00" className={`${INP} col-span-4 sm:col-span-2`} />
                  <input type="number" step="0.01" min="0" value={v.original_price} onChange={(e) => setVariant(i, "original_price", e.target.value)} placeholder="0.00" className={`${INP} col-span-10 sm:col-span-2`} />
                  <button onClick={() => removeVariant(i)} className="col-span-2 justify-self-end text-neutral-400 hover:text-red-600 sm:col-span-12 sm:justify-self-start" title="Remove variant">
                    <X size={16} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={editing.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="h-4 w-4" /> Featured product
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={editing.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4" /> Active (visible in store)
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-neutral-200 p-4">
          <button onClick={cancel} className="btn-outline">Cancel</button>
          <button onClick={save} disabled={saving} data-testid="product-save-btn" className="btn-primary">
            {saving ? "Saving..." : isNew ? "Create product" : "Save changes"}
          </button>
        </div>
      </div>
    );
  }

  // ---------- LIST VIEW ----------
  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-neutral-600">{products.length} product{products.length !== 1 ? "s" : ""}</div>
        <button onClick={startNew} data-testid="product-add-btn" className="btn-primary">
          <Plus size={16} weight="bold" /> Add product
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Brand</th>
              <th className="p-4">Category</th>
              <th className="p-4">Variants</th>
              <th className="p-4">Price</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {products.map((p) => {
              const prices = (p.variants || []).map((v) => v.price);
              const min = prices.length ? Math.min(...prices) : 0;
              const max = prices.length ? Math.max(...prices) : 0;
              return (
                <tr key={p.id} data-testid={`admin-product-${p.slug}`} className={!p.is_active ? "opacity-60" : ""}>
                  <td className="p-4">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-neutral-500">{p.slug}</div>
                  </td>
                  <td className="p-4">{p.brand}</td>
                  <td className="p-4">{p.category}</td>
                  <td className="p-4">{(p.variants || []).length}</td>
                  <td className="p-4">${min.toFixed(2)}{max > min ? `–$${max.toFixed(2)}` : ""}</td>
                  <td className="p-4">
                    {p.is_active
                      ? <span className="badge-trust">Active</span>
                      : <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">Hidden</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(p)} data-testid={`product-edit-${p.slug}`} title="Edit" className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900">
                        <PencilSimple size={16} weight="duotone" />
                      </button>
                      <button onClick={() => toggleActive(p)} data-testid={`product-toggle-${p.slug}`} title={p.is_active ? "Hide" : "Show"} className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900">
                        {p.is_active ? <EyeSlash size={16} weight="duotone" /> : <Eye size={16} weight="duotone" />}
                      </button>
                      <button onClick={() => toggleFeatured(p)} data-testid={`product-feature-${p.slug}`} title={p.is_featured ? "Unfeature" : "Feature"} className={`rounded-md p-2 ${p.is_featured ? "text-yellow-500 hover:bg-yellow-50" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"}`}>
                        <Star size={16} weight={p.is_featured ? "fill" : "duotone"} />
                      </button>
                      <button onClick={() => setConfirmDelete(p)} data-testid={`product-delete-${p.slug}`} title="Delete" className="rounded-md p-2 text-neutral-600 hover:bg-red-50 hover:text-red-600">
                        <Trash size={16} weight="duotone" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr><td colSpan={7} className="p-10 text-center text-neutral-500">No products yet. Click "Add product" to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
