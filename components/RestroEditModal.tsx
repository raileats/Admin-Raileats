async function handleSave() {
  setNotification(null);
  setError(null);

  const validationErrorsNow = collectValidationErrors(local);
  if (validationErrorsNow.length) {
    setNotification({
      type: "error",
      text: `Validation failed:\n• ${validationErrorsNow.join("\n• ")}`,
    });
    return;
  }

  if (!primaryContactValid) {
    setNotification({
      type: "error",
      text: "Please provide a valid Email 1 or a 10-digit Mobile 1 before saving.",
    });
    return;
  }

  setSavingInternal(true);

  try {
    const allowed = [
      "EmailAddressName1",
      "EmailsforOrdersReceiving1",
      "EmailsforOrdersStatus1",
      "EmailAddressName2",
      "EmailsforOrdersReceiving2",
      "EmailsforOrdersStatus2",
      "WhatsappMobileNumberName1",
      "WhatsappMobileNumberforOrderDetails1",
      "WhatsappMobileNumberStatus1",
      "WhatsappMobileNumberName2",
      "WhatsappMobileNumberforOrderDetails2",
      "WhatsappMobileNumberStatus2",
      "WhatsappMobileNumberName3",
      "WhatsappMobileNumberforOrderDetails3",
      "WhatsappMobileNumberStatus3",
    ];

    const payload: any = {};

    for (const k of allowed) {
      let v = local[k];

      if (typeof v === "string") v = v.trim();

      if (
        k.toLowerCase().includes("whatsapp") &&
        k.toLowerCase().includes("orderdetails")
      ) {
        v = String(v ?? "").replace(/\D/g, "").slice(0, 10);
      }

      payload[k] = v ?? null;
    }

    // 🔥🔥🔥 SUPABASE PATCH CALL (MAIN FIX)
    const result = await defaultPatch(payload);

    if (!result?.ok) {
      throw new Error(result?.error || "Contacts update failed");
    }

    setNotification({
      type: "success",
      text: "Contacts saved successfully ✅",
    });

    setActiveTab("Station Settings");

    setTimeout(() => {
      if ((router as any).refresh) router.refresh();
    }, 500);
  } catch (err: any) {
    console.error("Contacts save error:", err);
    setNotification({
      type: "error",
      text: err?.message || "Save failed",
    });
  } finally {
    setSavingInternal(false);
  }
}
