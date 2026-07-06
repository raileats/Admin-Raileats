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

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 390px) minmax(0, 1fr)",
    gap: 22,
    alignItems: "start",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "22px 24px 12px",
    borderBottom: "1px solid #f1f5f9",
  },
  cardBody: {
    padding: 24,
  },
  title: {
    margin: 0,
    color: "#111827",
    fontSize: 18,
    fontWeight: 900,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: 13,
  },
  label: {
    display: "block",
    color: "#334155",
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    minHeight: 44,
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "10px 12px",
    color: "#0f172a",
    background: "#ffffff",
    fontSize: 14,
    outline: "none",
  },
  helpText: {
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: 12,
    lineHeight: 1.45,
  },
  primaryBtn: {
    minHeight: 42,
    border: 0,
    borderRadius: 12,
    background: "linear-gradient(135deg, #f59e0b, #ff6b00)",
    color: "#ffffff",
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(245, 158, 11, 0.28)",
  },
  secondaryBtn: {
    minHeight: 42,
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    background: "#ffffff",
    color: "#334155",
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  dangerBtn: {
    minHeight: 36,
    border: "1px solid #fecaca",
    borderRadius: 10,
    background: "#fff1f2",
    color: "#b91c1c",
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  editBtn: {
    minHeight: 36,
    border: "1px solid #bfdbfe",
    borderRadius: 10,
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
} as const;

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
    <div style={styles.grid}>
      <style jsx>{`
        @media (max-width: 980px) {
          .hero-slider-admin-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <section style={styles.card} aria-label={isEditing ? "Edit hero slider" : "Add hero slider"}>
        <div style={styles.cardHeader}>
          <h2 style={styles.title}>{isEditing ? "Edit Slider" : "Add New Slider"}</h2>
          <p style={styles.subtitle}>Recommended image size: 1600 x 900 px.</p>
        </div>

        <div style={styles.cardBody}>
          {alert && (
            <div
              role="alert"
              style={{
                marginBottom: 16,
                borderRadius: 12,
                padding: "11px 13px",
                color: alert.type === "success" ? "#166534" : "#991b1b",
                background: alert.type === "success" ? "#dcfce7" : "#fee2e2",
                border: `1px solid ${alert.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {alert.message}
            </div>
          )}

          <form onSubmit={saveSlider}>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label} htmlFor="hero-slider-title">
                Title
              </label>
              <input
                id="hero-slider-title"
                type="text"
                style={styles.input}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Fresh meals for your train journey"
                maxLength={120}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={styles.label} htmlFor="hero-slider-sort-order">
                Sort Order
              </label>
              <input
                id="hero-slider-sort-order"
                type="number"
                style={styles.input}
                value={sortOrder}
                min={1}
                onChange={(event) => setSortOrder(Number(event.target.value || 1))}
              />
            </div>

            <label
              htmlFor="hero-slider-active"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
                color: "#334155",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <input
                id="hero-slider-active"
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                style={{ width: 18, height: 18, accentColor: "#f59e0b" }}
              />
              Active
            </label>

            <div style={{ marginBottom: 16 }}>
              <label style={styles.label} htmlFor="hero-slider-image">
                Image {isEditing ? "(optional)" : ""}
              </label>
              <input
                id="hero-slider-image"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={onImageChange}
                style={{
                  ...styles.input,
                  padding: "8px 10px",
                }}
              />
              <p style={styles.helpText}>
                Upload JPG, PNG or WebP. New image replaces the current image while editing.
              </p>
            </div>

            {previewUrl && (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16 / 9",
                  overflow: "hidden",
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  marginBottom: 16,
                }}
              >
                <Image
                  src={previewUrl}
                  alt={title || "Hero slider preview"}
                  title={title || "Hero slider preview"}
                  fill
                  sizes="(max-width: 980px) 100vw, 390px"
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button type="submit" style={styles.primaryBtn} disabled={saving}>
                {saving ? "Saving..." : isEditing ? "Update Slider" : "Save Slider"}
              </button>
              {isEditing && (
                <button type="button" style={styles.secondaryBtn} onClick={resetForm} disabled={saving}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      <section style={styles.card} aria-label="All hero sliders">
        <div
          style={{
            ...styles.cardHeader,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <h2 style={styles.title}>All Hero Sliders</h2>
            <p style={styles.subtitle}>Ordered by sort order.</p>
          </div>
          <button type="button" style={styles.secondaryBtn} onClick={fetchSliders} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
              Loading hero sliders...
            </div>
          ) : sortedSliders.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
              No hero sliders found.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={tableHeadStyle}>Image</th>
                    <th style={tableHeadStyle}>Title</th>
                    <th style={tableHeadStyle}>Order</th>
                    <th style={tableHeadStyle}>Status</th>
                    <th style={{ ...tableHeadStyle, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSliders.map((slider) => (
                    <tr key={slider.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={tableCellStyle}>
                        <div
                          style={{
                            position: "relative",
                            width: 152,
                            aspectRatio: "16 / 9",
                            overflow: "hidden",
                            borderRadius: 12,
                            border: "1px solid #e2e8f0",
                            background: "#f8fafc",
                          }}
                        >
                          <Image
                            src={slider.image_url}
                            alt={slider.title || "RailEats hero slider"}
                            title={slider.title || "RailEats hero slider"}
                            fill
                            sizes="152px"
                            style={{ objectFit: "cover" }}
                            unoptimized
                          />
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ color: "#111827", fontWeight: 900 }}>
                          {slider.title || "Untitled slider"}
                        </div>
                        <div
                          style={{
                            maxWidth: 320,
                            marginTop: 4,
                            color: "#64748b",
                            fontSize: 12,
                            wordBreak: "break-all",
                          }}
                        >
                          {slider.image_url}
                        </div>
                      </td>
                      <td style={tableCellStyle}>{slider.sort_order ?? 1}</td>
                      <td style={tableCellStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: 999,
                            padding: "5px 10px",
                            color: slider.active ? "#166534" : "#475569",
                            background: slider.active ? "#dcfce7" : "#f1f5f9",
                            fontSize: 12,
                            fontWeight: 900,
                          }}
                        >
                          {slider.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 8 }}>
                          <button type="button" style={styles.editBtn} onClick={() => startEdit(slider)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            style={styles.dangerBtn}
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
      </section>
    </div>
  );
}

const tableHeadStyle = {
  padding: "13px 16px",
  color: "#475569",
  fontSize: 12,
  fontWeight: 900,
  textAlign: "left" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const tableCellStyle = {
  padding: "15px 16px",
  color: "#334155",
  fontSize: 14,
  verticalAlign: "middle" as const,
};
