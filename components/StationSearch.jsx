<div>
  <label className="block text-sm">Station (Code - Name) *</label>
  <StationSearch
    value={basic.stationObj}
    onChange={(s) => {
      setBasic(b => ({
        ...b,
        stationId: s ? s.StationId : "",
        stationObj: s ? s : null
      }));
    }}
  />
</div>
