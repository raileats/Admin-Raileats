"use client";

import React from "react";
import UI from "@/components/AdminUI";
import AdminSection from "@/components/AdminSection";

const { AdminForm } = UI;

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
};

export default function ContactsTab({ local = {}, updateField }: Props) {
  return (
    <AdminForm>
      {/* ================= EMAILS ================= */}
      <AdminSection title="Emails (max 2)">
        <div className="grid grid-cols-3 gap-4 text-sm">
          {/* Email 1 */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Name 1
            </label>
            <input
              value={local.EmailName1 || ""}
              onChange={(e) =>
                updateField("EmailName1", e.target.value)
              }
              className="w-full p-2 border rounded"
              placeholder="Name 1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">
              Email 1
            </label>
            <input
              value={local.Email1 || ""}
              onChange={(e) =>
                updateField("Email1", e.target.value)
              }
              className="w-full p-2 border rounded"
              placeholder="email@example.com"
            />
          </div>

          <div className="flex items-end gap-2">
            <label className="text-xs font-semibold text-gray-600">
              Status
            </label>
            <input
              type="checkbox"
              checked={local.Email1Active || false}
              onChange={(e) =>
                updateField("Email1Active", e.target.checked)
              }
              className="h-5 w-5"
            />
          </div>

          {/* Email 2 */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Name 2
            </label>
            <input
              value={local.EmailName2 || ""}
              onChange={(e) =>
                updateField("EmailName2", e.target.value)
              }
              className="w-full p-2 border rounded"
              placeholder="Name 2"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">
              Email 2
            </label>
            <input
              value={local.Email2 || ""}
              onChange={(e) =>
                updateField("Email2", e.target.value)
              }
              className="w-full p-2 border rounded"
              placeholder="email@example.com"
            />
          </div>

          <div className="flex items-end gap-2">
            <label className="text-xs font-semibold text-gray-600">
              Status
            </label>
            <input
              type="checkbox"
              checked={local.Email2Active || false}
              onChange={(e) =>
                updateField("Email2Active", e.target.checked)
              }
              className="h-5 w-5"
            />
          </div>
        </div>
      </AdminSection>

      {/* ================= WHATSAPP ================= */}
      <AdminSection title="WhatsApp Numbers (max 3)">
        <div className="grid grid-cols-3 gap-4 text-sm">
          {/* WhatsApp 1 */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Name 1
            </label>
            <input
              value={local.WhatsappName1 || ""}
              onChange={(e) =>
                updateField("WhatsappName1", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">
              Mobile 1
            </label>
            <input
              value={local.Whatsapp1 || ""}
              onChange={(e) =>
                updateField("Whatsapp1", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex items-end gap-2">
            <label className="text-xs font-semibold text-gray-600">
              Status
            </label>
            <input
              type="checkbox"
              checked={local.Whatsapp1Active || false}
              onChange={(e) =>
                updateField("Whatsapp1Active", e.target.checked)
              }
              className="h-5 w-5"
            />
          </div>

          {/* WhatsApp 2 */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Name 2
            </label>
            <input
              value={local.WhatsappName2 || ""}
              onChange={(e) =>
                updateField("WhatsappName2", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">
              Mobile 2
            </label>
            <input
              value={local.Whatsapp2 || ""}
              onChange={(e) =>
                updateField("Whatsapp2", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex items-end gap-2">
            <label className="text-xs font-semibold text-gray-600">
              Status
            </label>
            <input
              type="checkbox"
              checked={local.Whatsapp2Active || false}
              onChange={(e) =>
                updateField("Whatsapp2Active", e.target.checked)
              }
              className="h-5 w-5"
            />
          </div>

          {/* WhatsApp 3 */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Name 3
            </label>
            <input
              value={local.WhatsappName3 || ""}
              onChange={(e) =>
                updateField("WhatsappName3", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">
              Mobile 3
            </label>
            <input
              value={local.Whatsapp3 || ""}
              onChange={(e) =>
                updateField("Whatsapp3", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex items-end gap-2">
            <label className="text-xs font-semibold text-gray-600">
              Status
            </label>
            <input
              type="checkbox"
              checked={local.Whatsapp3Active || false}
              onChange={(e) =>
                updateField("Whatsapp3Active", e.target.checked)
              }
              className="h-5 w-5"
            />
          </div>
        </div>
      </AdminSection>
    </AdminForm>
  );
}
