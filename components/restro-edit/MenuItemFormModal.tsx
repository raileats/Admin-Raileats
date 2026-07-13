"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type BaseRow = {
  id: number;
  restro_code: string;
  item_code: string;
  item_name: string;
  item_description?: string | null;
  item_category?: string | null;
  item_cuisine?: string | null;
  menu_type?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  restro_price?: number | null;
  base_price?: number | null;
  gst_percent?: number | null;
  selling_price?: number | null;
  status: "ON" | "OFF" | "DELETED";
  created_at?: string | null;
  updated_at?: string | null;
  menu_item_image?: string | null;
};

type MenuImageResult = {
  name: string;
  publicUrl: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  size?: number | null;
};

type Props = {
  open: boolean;
  restroCode: string | number;
  onClose: () => void;
  onSaved: () => void;
  mode?: "create" | "edit";
  initial?: Partial<BaseRow> | null;
  supabase?: SupabaseClient;
};

const CATEGORY_OPTIONS = ["Veg", "Jain", "Non-Veg"] as const;

const CUISINE_OPTIONS = [
  "North Indian",
  "South Indian",
  "Chinese",
  "Multicuisine",
  "Italian",
  "Mughlai",
  "Continental",
  "Bengali",
  "Gujarati",
  "Maharashtrian",
] as const;

const MENU_TYPE_OPTIONS = [
  "Thalis",
  "Combos",
  "Breakfast",
  "Rice And Biryani",
  "Dal and Subzi",
  "Roti Paratha",
  "Pizza and Sandwiches",
  "Fast Food",
  "Burger",
  "Starters and Snacks",
  "Sweets",
  "Beverages",
  "Restro Specials",
  "Bakery",
] as const;

function normalizeTime(value: any) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function fileNameFromValue(value: unknown) {
  const raw = String(value ?? "").trim();

  if (!raw) return "";

  try {
    if (/^https?:\/\//i.test(raw)) {
      const url = new URL(raw);
      return decodeURIComponent(url.pathname.split("/").pop() || "");
    }
  } catch {
    // Existing value will be returned unchanged.
  }

  return raw.split("/").pop() || raw;
}

function getMenuImagePublicUrl(value: unknown) {
  const raw = String(value ?? "").trim();

  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!baseUrl) return "";

  const fileName = fileNameFromValue(raw);

  return `${baseUrl}/storage/v1/object/public/menu_item_image/${encodeURIComponent(
    fileName
  )}`;
}

export default function MenuItemFormModal({
  open,
  restroCode,
  onClose,
  onSaved,
  mode = "create",
  initial = null,
  supabase: sbFromParent,
}: Props) {
  const supabase =
    sbFromParent ??
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

  const [item_name, setItemName] = useState("");
  const [item_description, setItemDescription] = useState("");
  const [item_category, setItemCategory] = useState<string>("");
  const [item_cuisine, setItemCuisine] = useState<string>("");
  const [menu_type, setMenuType] = useState<string>("");
  const [start_time, setStartTime] = useState<string>("");
  const [end_time, setEndTime] = useState<string>("");
  const [restro_price, setRestroPrice] = useState<number | "">("");
  const [base_price, setBasePrice] = useState<number | "">("");
  const [gst_percent, setGstPercent] = useState<number | "">(5);
  const [status, setStatus] = useState<"ON" | "OFF">("ON");

  const [menuImage, setMenuImage] = useState<File | null>(null);
  const [menuImageName, setMenuImageName] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState("");

  const [imageMode, setImageMode] = useState<"upload" | "search">(
    "upload"
  );


  const [imageSearch, setImageSearch] = useState("");
  const [imageResults, setImageResults] = useState<MenuImageResult[]>(
    []
  );
  const [searchingImages, setSearchingImages] = useState(false);
  const [imageSearchDone, setImageSearchDone] = useState(false);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadDefaults() {
      setMenuImage(null);
      setImageMode("upload");
      setImageSearch("");
      setImageResults([]);
      setImageSearchDone(false);
      setErr(null);

      if (mode === "edit" && initial) {
        const currentImageName = fileNameFromValue(
          initial.menu_item_image
        );

        setItemName(initial.item_name ?? "");
        setItemDescription(initial.item_description ?? "");
        setItemCategory(initial.item_category ?? "");
        setItemCuisine(initial.item_cuisine ?? "");
        setMenuType(initial.menu_type ?? "");
        setStartTime(normalizeTime(initial.start_time));
        setEndTime(normalizeTime(initial.end_time));

        setRestroPrice(
          initial.restro_price == null
            ? ""
            : Number(initial.restro_price)
        );

        setBasePrice(
          initial.base_price == null ? "" : Number(initial.base_price)
        );

        setGstPercent(
          initial.gst_percent == null
            ? 5
            : Number(initial.gst_percent)
        );

        setStatus(
          (initial.status as any) === "OFF" ? "OFF" : "ON"
        );

        setMenuImageName(currentImageName);
        setSelectedImageUrl(
          getMenuImagePublicUrl(initial.menu_item_image)
        );

        return;
      }

      setItemName("");
      setItemDescription("");
      setItemCategory("");
      setItemCuisine("");
      setMenuType("");
      setStartTime("");
      setEndTime("");
      setRestroPrice("");
      setBasePrice("");
      setGstPercent(5);
      setStatus("ON");
      setMenuImageName("");
      setSelectedImageUrl("");

      const { data } = await supabase
        .from("RestroMaster")
        .select("open_time, closed_time")
        .eq("RestroCode", Number(restroCode))
        .maybeSingle();

      if (cancelled) return;

      setStartTime(normalizeTime(data?.open_time));
      setEndTime(normalizeTime(data?.closed_time));
    }

    loadDefaults();

    return () => {
      cancelled = true;
    };
  }, [open, mode, initial, restroCode]);

  const selling_price = useMemo(() => {
    const base = Number(base_price || 0);
    const gst = Number(gst_percent || 0);

    if (!base || Number.isNaN(base)) return 0;

    return Math.round(base * (1 + gst / 100) * 100) / 100;
  }, [base_price, gst_percent]);

  const localImagePreview = useMemo(() => {
    if (!menuImage) return "";

    return URL.createObjectURL(menuImage);
  }, [menuImage]);

  useEffect(() => {
    return () => {
      if (localImagePreview) {
        URL.revokeObjectURL(localImagePreview);
      }
    };
  }, [localImagePreview]);

  if (!open) return null;

  function toNumOrEmpty(val: string) {
    const cleaned = val.replace(/[^\d.]/g, "");

    if (cleaned === "") return "";

    const n = Number(cleaned);

    return Number.isFinite(n) ? n : "";
  }

  function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".webp")) {
      alert("Only .webp image allowed");
      e.target.value = "";
      return;
    }

    if (file.size > 50 * 1024) {
      alert("Image size must be maximum 50KB");
      e.target.value = "";
      return;
    }

    setMenuImage(file);

    setMenuImageName(file.name);
    setSelectedImageUrl("");
    setErr(null);
  }

  async function searchExistingImages() {
    try {
      setSearchingImages(true);
      setImageSearchDone(false);
      setErr(null);

      const query = imageSearch.trim();

      const response = await fetch(
        `/api/admin/menu-images?search=${encodeURIComponent(query)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.ok) {
        throw new Error(
          result?.error ||
            `Image search failed (${response.status})`
        );
      }

      setImageResults(
        Array.isArray(result?.rows) ? result.rows : []
      );

      setImageSearchDone(true);
    } catch (e: any) {
      setImageResults([]);
      setImageSearchDone(true);
      setErr(e?.message ?? "Failed to search images");
    } finally {
      setSearchingImages(false);
    }
  }

  function selectExistingImage(image: MenuImageResult) {
    setMenuImage(null);
    setMenuImageName(image.name);
    setSelectedImageUrl(image.publicUrl);
    setErr(null);
  }

  async function uploadMenuImage(file: File) {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch("/api/admin/menu-images", {
      method: "POST",
      body: formData,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result?.ok) {
      throw new Error(
        result?.error || `Image upload failed (${response.status})`
      );
    }

    const uploadedFileName = fileNameFromValue(
      result?.fileName || result?.name || ""
    );

    if (!uploadedFileName) {
      throw new Error(
        "Image uploaded but filename was not returned"
      );
    }

    setMenuImageName(uploadedFileName);

    if (result?.publicUrl) {
      setSelectedImageUrl(result.publicUrl);
    }

    return uploadedFileName;
  }

  async function updateItemImage(
    itemId: number,
    imageFileName: string
  ) {
    const { error: imageUpdateError } = await supabase
      .from("RestroMenuItems")
      .update({
        menu_item_image: imageFileName,
      })
      .eq("id", itemId);

    if (imageUpdateError) {
      throw imageUpdateError;
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setErr(null);

      if (!item_name.trim()) {
        throw new Error("Item Name required");
      }

      const basePayload = {
        item_name: item_name.trim(),
        item_description:
          item_description.trim() || null,
        item_category: item_category || null,
        item_cuisine: item_cuisine || null,
        menu_type: menu_type || null,
        start_time: start_time || null,
        end_time: end_time || null,
        restro_price:
          restro_price === ""
            ? null
            : Number(restro_price),
        base_price:
          base_price === "" ? null : Number(base_price),
        gst_percent:
          gst_percent === ""
            ? 0
            : Number(gst_percent),
        selling_price,
        status,
      };

      if (mode === "edit" && initial?.id) {
        const { error } = await supabase
          .from("RestroMenuItems")
          .update(basePayload as any)
          .eq("id", initial.id);

        if (error) throw error;

        /*
          New local file selected:
          upload through server API, then save returned filename.
        */
        if (menuImage) {
          const uploadedFileName =
            await uploadMenuImage(menuImage);

          await updateItemImage(
            Number(initial.id),
            uploadedFileName
          );
        } else {
          /*
            Existing bucket image selected:
            save that filename.

            If the user did not select/change any image,
            the existing filename stays unchanged.
          */
          const initialImageName = fileNameFromValue(
            initial.menu_item_image
          );

          if (
            menuImageName &&
            menuImageName !== initialImageName
          ) {
            await updateItemImage(
              Number(initial.id),
              menuImageName
            );
          }
        }
      } else {
        const payloadCreate = {
          ...basePayload,
          item_code: null,
        };

        const res = await fetch(
          `/api/restros/${encodeURIComponent(
            String(restroCode)
          )}/menu`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payloadCreate),
          }
        );

        const j = await res.json().catch(() => ({}));

        if (!res.ok || !j?.ok) {
          throw new Error(
            j?.error || `Save failed (${res.status})`
          );
        }

        const createdId =
          j?.data?.id || j?.item?.id || j?.id;

        if (createdId) {
          if (menuImage) {
            const uploadedFileName =
              await uploadMenuImage(menuImage);

            await updateItemImage(
              Number(createdId),
              uploadedFileName
            );
          } else if (menuImageName) {
            await updateItemImage(
              Number(createdId),
              menuImageName
            );
          }
        }
      }

      const currentPath =
        typeof window !== "undefined"
          ? window.location.pathname
          : "";

      if (
        mode === "create" &&
        currentPath.includes("/admin/restros/new")
      ) {
        window.location.replace(
          "/admin/restros/new/restro-user-password"
        );
        return;
      }

      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const smallInput =
    "w-full md:w-40 rounded border px-2 py-1.5";

  const previewUrl =
    localImagePreview || selectedImageUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={() => !saving && onClose()}
        aria-label="Close"
      />

      <div className="relative z-10 max-h-[94vh] w-[980px] max-w-[96vw] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {mode === "edit"
              ? "Edit Item"
              : "Add New Item"}
          </h2>

          <button
            type="button"
            className="rounded-md border px-3 py-1 text-sm"
            onClick={() => !saving && onClose()}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <label className="text-sm">Item Name</label>

            <input
              className="w-full rounded border px-3 py-2"
              value={item_name}
              onChange={(e) =>
                setItemName(e.target.value)
              }
              placeholder="e.g., Veg Mini Thali"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-sm">
              Item Description
            </label>

            <input
              className="w-full rounded border px-3 py-2"
              value={item_description}
              onChange={(e) =>
                setItemDescription(e.target.value)
              }
              placeholder="Short description"
            />
          </div>

          <div>
            <label className="text-sm">
              Item Category
            </label>

            <select
              className="w-full rounded border px-3 py-2"
              value={item_category}
              onChange={(e) =>
                setItemCategory(e.target.value)
              }
            >
              <option value="">Select category</option>

              {CATEGORY_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm">Cuisine</label>

            <select
              className="w-full rounded border px-3 py-2"
              value={item_cuisine}
              onChange={(e) =>
                setItemCuisine(e.target.value)
              }
            >
              <option value="">Select cuisine</option>

              {CUISINE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm">Menu Type</label>

            <select
              className="w-full rounded border px-3 py-2"
              value={menu_type}
              onChange={(e) =>
                setMenuType(e.target.value)
              }
            >
              <option value="">Select menu type</option>

              {MENU_TYPE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 rounded-lg border p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={
                  imageMode === "upload"
                    ? "rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
                    : "rounded-md border px-4 py-2 text-sm"
                }
                onClick={() => setImageMode("upload")}
              >
                Upload New Photo
              </button>

              <button
                type="button"
                className={
                  imageMode === "search"
                    ? "rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
                    : "rounded-md border px-4 py-2 text-sm"
                }
                onClick={() => setImageMode("search")}
              >
                Search Existing Photo
              </button>
            </div>

            {imageMode === "upload" && (
              <div>
                <label className="text-sm">
                  Menu Item Image (.webp max 50KB)
                </label>

                <input
                  type="file"
                  accept=".webp,image/webp"
                  className="w-full rounded border px-3 py-2"
                  onChange={handleImageChange}
                />

                <p className="mt-1 text-xs text-gray-500">
                  Upload the file using the exact name you want in Supabase,
                  for example: Dal Fry.webp, Dal Fry 2.webp, Dal Fry 3.webp
                </p>
              </div>
            )}

            {imageMode === "search" && (
              <div>
                <label className="text-sm">
                  Search Supabase Photo
                </label>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    className="w-full rounded border px-3 py-2"
                    value={imageSearch}
                    onChange={(e) =>
                      setImageSearch(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        searchExistingImages();
                      }
                    }}
                    placeholder="e.g., Dal Fry"
                  />

                  <button
                    type="button"
                    className="rounded-md bg-gray-800 px-5 py-2 text-white disabled:opacity-60"
                    onClick={searchExistingImages}
                    disabled={searchingImages}
                  >
                    {searchingImages
                      ? "Searching..."
                      : "Search"}
                  </button>
                </div>

                {imageSearchDone &&
                  imageResults.length === 0 && (
                    <p className="mt-3 text-sm text-gray-500">
                      No matching photos found.
                    </p>
                  )}

                {imageResults.length > 0 && (
                  <div className="mt-4 grid max-h-72 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
                    {imageResults.map((image) => {
                      const selected =
                        menuImageName === image.name &&
                        !menuImage;

                      return (
                        <button
                          key={image.name}
                          type="button"
                          className={
                            selected
                              ? "overflow-hidden rounded-lg border-2 border-blue-600 bg-blue-50 text-left"
                              : "overflow-hidden rounded-lg border bg-white text-left hover:border-blue-400"
                          }
                          onClick={() =>
                            selectExistingImage(image)
                          }
                        >
                          <img
                            src={image.publicUrl}
                            alt={image.name}
                            className="h-28 w-full object-cover"
                          />

                          <div className="p-2">
                            <p className="break-all text-xs">
                              {image.name}
                            </p>

                            <p className="mt-1 text-xs font-medium text-blue-600">
                              {selected
                                ? "Selected"
                                : "Select"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {(menuImageName || previewUrl) && (
              <div className="mt-4 flex items-center gap-3 rounded-md bg-gray-50 p-3">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Selected menu item"
                    className="h-20 w-20 rounded-md border object-cover"
                  />
                )}

                <div className="min-w-0">
                  <p className="text-xs text-gray-500">
                    Selected photo
                  </p>

                  <p className="break-all text-sm font-medium text-green-700">
                    {menuImage
                      ? menuImage.name
                      : menuImageName}
                  </p>

                  {menuImage && (
                    <p className="mt-1 text-xs text-gray-500">
                      The selected file name will be used in Supabase.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm">
              Item Start Time
            </label>

            <input
              type="time"
              className="w-full rounded border px-3 py-2"
              value={start_time}
              onChange={(e) =>
                setStartTime(e.target.value)
              }
            />
          </div>

          <div>
            <label className="text-sm">
              Item Closed Time
            </label>

            <input
              type="time"
              className="w-full rounded border px-3 py-2"
              value={end_time}
              onChange={(e) =>
                setEndTime(e.target.value)
              }
            />
          </div>

          <div className="md:col-span-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-sm">
                  Restro Price (internal)
                </label>

                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  className={smallInput}
                  value={
                    restro_price === ""
                      ? ""
                      : String(restro_price)
                  }
                  onChange={(e) =>
                    setRestroPrice(
                      toNumOrEmpty(e.target.value)
                    )
                  }
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="text-sm">
                  Base Price
                </label>

                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  className={smallInput}
                  value={
                    base_price === ""
                      ? ""
                      : String(base_price)
                  }
                  onChange={(e) =>
                    setBasePrice(
                      toNumOrEmpty(e.target.value)
                    )
                  }
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="text-sm">GST %</label>

                <select
                  className={smallInput}
                  value={String(
                    gst_percent === ""
                      ? ""
                      : gst_percent
                  )}
                  onChange={(e) =>
                    setGstPercent(
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                    )
                  }
                >
                  <option value="5">5</option>
                  <option value="12">12</option>
                  <option value="18">18</option>
                </select>
              </div>

              <div>
                <label className="text-sm">
                  Selling Price (auto)
                </label>

                <input
                  className={
                    smallInput + " bg-gray-50"
                  }
                  value={selling_price}
                  readOnly
                />
              </div>

              <div>
                <label className="text-sm">
                  Status
                </label>

                <select
                  className={smallInput}
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as "ON" | "OFF"
                    )
                  }
                >
                  <option value="ON">On</option>
                  <option value="OFF">Off</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {err && (
          <p className="mt-3 text-sm text-red-600">
            Error: {err}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md border px-4 py-2"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? "Saving…"
              : mode === "edit"
              ? "Update"
              : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
