// Replace your existing handleSave with this:
async function handleSave(updatedFields: any): Promise<SaveResult> {
  try {
    const res = await fetch(`/api/restros/${restroCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields),
    });

    if (!res.ok) {
      // read server error text if possible
      const txt = await res.text().catch(() => "patch_failed");
      return { ok: false, error: txt };
    }

    // parse JSON (may be { ok: true, data } or raw row depending on your API)
    const json = await res.json().catch(() => null);

    // return the success branch with literal `ok: true`
    return { ok: true, row: json };
  } catch (err) {
    // return the failure branch with literal `ok: false`
    return { ok: false, error: err };
  }
}
