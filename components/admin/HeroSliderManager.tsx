"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type HeroSliderRow = {
  id: number;
  title: string | null;
  image_url: string;
  sort_order: number | null;
  active: boolean | null;
  created_at?: string | null;
};

type AlertState = {
  type: "success" | "danger" | "info";
  message: string;
};

const emptyForm = {
  title: "",
  sort_order: 1,
  active: true,
};

export default function HeroSliderManager() {
  const [sliders, setSliders] = useState<HeroSliderRow[]>([]);
  const [editing, setEditing] = useState<HeroSliderRow | null>(null);
  const [title, setTitle] = useState(emptyForm.title);
  const [sortOrder, setSortOrder] = useState<number>(emptyForm.sort_order);
  const [active, setActive] = useState<boolean>(emptyForm.active);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const isEditing = Boolean(editing);

  const sortedSliders = useMemo(() => {
    return [...sliders].sort((a, b) => {
      const orderA = Number(a.sort_order ?? 999999);
      const orderB = Number(b.sort_order ?? 999999);
      if (orderA !== orderB) return orderA - orderB;
      return Number(a.id) - Number(b.id);
    });
  }, [sliders]);

  const showAlert = useCallback((type: AlertState["type"], message: string) => {
    setAlert({ type, message });
    window.setTimeout(() => {
      setAlert((current) => (current?.message === message ? null : current));
    }, 4500);
  }, []);

  const resetForm = useCallback(() => {
    setEditing(null);
    setTitle(emptyForm.title);
    setSortOrder(emptyForm.sort_order);
    setActive(emptyForm.active);
    setImageFile(null);
    setPreviewUrl("");
  }, []);

  const fetchSliders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/hero-slider", {
        method: "GET",
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Unable to load hero sliders");
      }

      setSliders(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      showAlert("danger", error instanceof Error ? error.message : "Unable to load hero sliders");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchSliders();
  }, [fetchSliders]);

  useEffect(() => {
    if (!imageFile) return;

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    if (!file && editing?.image_url) {
      setPreviewUrl(editing.image_url);
    }
  };

  const startEdit = (slider: HeroSliderRow) => {
    setEditing(slider);
    setTitle(slider.title ?? "");
    setSortOrder(Number(slider.sort_order ?? 1));
    setActive(Boolean(slider.active));
    setImageFile(null);
    setPreviewUrl(slider.image_url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveSlider = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      if (!isEditing && !imageFile) {
        throw new Error("Please select an image before saving.");
      }

      const formData = new FormData();
      if (editing?.id) formData.append("id", String(editing.id));
      formData.append("title", title.trim());
      formData.append("sort_order", String(Number.isFinite(sortOrder) ? sortOrder : 1));
      formData.append("active", active ? "true" : "false");
      if (imageFile) formData.append("image", imageFile);

      const response = await fetch("/api/admin/hero-slider", {
        method: isEditing ? "PUT" : "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Unable to save hero slider");
      }

      showAlert("success", isEditing ? "Hero slider updated successfully." : "Hero slider created successfully.");
      resetForm();
      await fetchSliders();
    } catch (error) {
      showAlert("danger", error instanceof Error ? error.message : "Unable to save hero slider");
    } finally {
      setSaving(false);
    }
  };

  const deleteSlider = async (slider: HeroSliderRow) => {
    const confirmed = window.confirm(`Delete "${slider.title || "this slider"}"?`);
    if (!confirmed) return;

    setDeletingId(slider.id);
    setAlert(null);

    try {
      const response = await fetch("/api/admin/hero-slider", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slider.id }),
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Unable to delete hero slider");
      }

      if (editing?.id === slider.id) resetForm();
      showAlert("success", "Hero slider deleted successfully.");
      await fetchSliders();
    } catch (error) {
      showAlert("danger", error instanceof Error ? error.message : "Unable to delete hero slider");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="row g-4">
      <div className="col-12 col-xl-4">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 pt-4 px-4">
            <h2 className="h5 fw-bold mb-1">{isEditing ? "Edit Slider" : "Add New Slider"}</h2>
            <p className="text-muted small mb-0">
              Recommended image size: 1600 x 900 px.
            </p>
          </div>

          <div className="card-body p-4">
            {alert && (
              <div className={`alert alert-${alert.type} py-2`} role="alert">
                {alert.message}
              </div>
            )}

            <form onSubmit={saveSlider}>
              <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="hero-slider-title">
                  Title
                </label>
                <input
                  id="hero-slider-title"
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Fresh meals for your train journey"
                  maxLength={120}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="hero-slider-sort-order">
                  Sort Order
                </label>
                <input
                  id="hero-slider-sort-order"
                  type="number"
                  className="form-control"
                  value={sortOrder}
                  min={1}
                  onChange={(event) => setSortOrder(Number(event.target.value || 1))}
                />
              </div>

              <div className="form-check form-switch mb-3">
                <input
                  id="hero-slider-active"
                  className="form-check-input"
                  type="checkbox"
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                />
                <label className="form-check-label fw-semibold" htmlFor="hero-slider-active">
                  Active
                </label>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="hero-slider-image">
                  Image {isEditing ? "(optional)" : ""}
                </label>
                <input
                  id="hero-slider-image"
                  type="file"
                  className="form-control"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={onImageChange}
                />
                <div className="form-text">
                  Upload JPG, PNG or WebP. New image replaces the current image while editing.
                </div>
              </div>

              {previewUrl && (
                <div className="mb-3">
                  <div className="ratio ratio-16x9 rounded overflow-hidden border bg-light">
                    <Image
                      src={previewUrl}
                      alt={title || "Hero slider preview"}
                      title={title || "Hero slider preview"}
                      fill
                      sizes="(max-width: 1200px) 100vw, 420px"
                      className="object-fit-cover"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              <div className="d-flex flex-wrap gap-2">
                <button type="submit" className="btn btn-warning fw-semibold" disabled={saving}>
                  {saving ? "Saving..." : isEditing ? "Update Slider" : "Save Slider"}
                </button>
                {isEditing && (
                  <button type="button" className="btn btn-outline-secondary" onClick={resetForm} disabled={saving}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="col-12 col-xl-8">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 pt-4 px-4 d-flex align-items-center justify-content-between gap-3">
            <div>
              <h2 className="h5 fw-bold mb-1">All Hero Sliders</h2>
              <p className="text-muted small mb-0">Ordered by sort order.</p>
            </div>
            <button type="button" className="btn btn-outline-dark btn-sm" onClick={fetchSliders} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="p-4 text-center text-muted">Loading hero sliders...</div>
            ) : sortedSliders.length === 0 ? (
              <div className="p-4 text-center text-muted">No hero sliders found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Image</th>
                      <th>Title</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSliders.map((slider) => (
                      <tr key={slider.id}>
                        <td className="ps-4" style={{ width: 180 }}>
                          <div className="ratio ratio-16x9 rounded overflow-hidden border bg-light">
                            <Image
                              src={slider.image_url}
                              alt={slider.title || "RailEats hero slider"}
                              title={slider.title || "RailEats hero slider"}
                              fill
                              sizes="180px"
                              className="object-fit-cover"
                              unoptimized
                            />
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold">{slider.title || "Untitled slider"}</div>
                          <div className="text-muted small text-break">{slider.image_url}</div>
                        </td>
                        <td>{slider.sort_order ?? 1}</td>
                        <td>
                          <span className={`badge ${slider.active ? "bg-success" : "bg-secondary"}`}>
                            {slider.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-inline-flex gap-2">
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => startEdit(slider)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteSlider(slider)}
                              disabled={deletingId === slider.id}
                            >
                              {deletingId === slider.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
