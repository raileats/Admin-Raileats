{/* ================= ADDRESS ================= */}
<div
  style={{
    background: "#f0f9ff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  }}
>
  {/* Header */}
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    }}
  >
    <h4 style={{ margin: 0 }}>Address</h4>
    <button
      type="button"
      onClick={saveAddress}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      Save Address
    </button>
  </div>

  {/* Full Address */}
  <textarea
    value={addr}
    onChange={(e) => setAddr(e.target.value)}
    placeholder="Full Restaurant Address"
    style={{
      width: "100%",
      minHeight: 60,
      padding: 10,
      borderRadius: 6,
      border: "1px solid #ddd",
      marginBottom: 12,
    }}
  />

  {/* Column Headings */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr 1fr",
      gap: 10,
      fontSize: 13,
      fontWeight: 600,
      color: "#555",
      marginBottom: 4,
    }}
  >
    <div>City / Village</div>
    <div>State</div>
    <div>District</div>
    <div>Pin Code</div>
    <div>Latitude</div>
    <div>Longitude</div>
  </div>

  {/* Inputs */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr 1fr",
      gap: 10,
    }}
  >
    <input
      value={city}
      onChange={(e) => setCity(e.target.value)}
      className="p-2 border rounded"
    />
    <input
      value={state}
      onChange={(e) => setState(e.target.value)}
      className="p-2 border rounded"
    />
    <input
      value={district}
      onChange={(e) => setDistrict(e.target.value)}
      className="p-2 border rounded"
    />
    <input
      value={pin}
      onChange={(e) => setPin(e.target.value)}
      className="p-2 border rounded"
    />
    <input
      value={lat}
      onChange={(e) => setLat(e.target.value)}
      className="p-2 border rounded"
    />
    <input
      value={lng}
      onChange={(e) => setLng(e.target.value)}
      className="p-2 border rounded"
    />
  </div>
</div>
