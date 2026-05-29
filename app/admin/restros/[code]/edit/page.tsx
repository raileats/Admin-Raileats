// ... existing code ...

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      padding: "24px 16px",
      display: "flex",
      justifyContent: "center"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "1100px",
      }}>
        {/* Header/Breadcrumb area (optional, helps consistency) */}
        <div style={{ marginBottom: "20px" }}>
          <button 
            onClick={() => router.back()}
            style={{ 
              background: "none", 
              border: "none", 
              cursor: "pointer", 
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 500
            }}
          >
            ← Back to Restaurants
          </button>
        </div>

        {/* Form Card Wrapper */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          border: "1px solid #e2e8f0"
        }}>
          <RestroEditModal
            key={`${restro.RestroCode}-${restro.updated_at ?? restro.LastModified ?? modalVersion}`}
            restro={{
              ...restro,
              ExtraTabs: [
                {
                  key: "Restro User & Password",
                  label: "Restro User & Password",
                  component: (
                    <RestroUserPasswordTab
                      form={restro}
                      setForm={setRestro}
                    />
                  ),
                },
              ],
            }}
            initialTab="Basic Information"
            onClose={() => router.back()}
            onSave={async (payload: any) => {
              try {
                const res = await fetch(
                  `/api/restros/${encodeURIComponent(String(restro.RestroCode))}`,
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      "Cache-Control": "no-store",
                    },
                    body: JSON.stringify(payload),
                  }
                );

                const json = await res.json().catch(() => null);

                if (!res.ok) {
                  throw new Error(json?.error || "Save failed");
                }

                const freshRestro = await loadRestro({ silent: true });
                setModalVersion((current) => current + 1);

                return {
                  ok: true,
                  row: freshRestro,
                };
              } catch (e: any) {
                console.error("Save error:", e);
                return {
                  ok: false,
                  error: e?.message || "Save failed",
                };
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
