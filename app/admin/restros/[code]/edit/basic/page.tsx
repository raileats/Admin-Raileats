// app/admin/restros/new/basic/page.tsx
import React from "react";
import BasicInfoClient from "@/components/tabs/BasicInfoClient";

export default function NewRestroBasicPage() {
  /**
   * ADD NEW RESTRO FLOW
   * - initialData = null → blank form
   * - BasicInfoClient me Save par
   *   POST /api/restros call hoga
   * - Backend new RestroCode generate karega
   * - Save ke baad EDIT mode me redirect hoga
   */

  return (
    <BasicInfoClient
      initialData={null}          // 🔥 BLANK FORM
      isNew={true}                // 🔥 ADD MODE FLAG
      imagePrefix={process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? ""}
    />
  );
}
