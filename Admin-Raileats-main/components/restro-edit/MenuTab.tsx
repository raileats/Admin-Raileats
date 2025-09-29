import React from "react";
type Props = { local:any; updateField:(k:string,v:any)=>void; stationDisplay:string; };
export default function MenuTab({ local }: Props) {
  return (
    <div>
      <h3 style={{ textAlign: "center", marginTop: 0 }}>Menu</h3>
      <div style={{ maxWidth: 1200, margin: "8px auto" }}>
        <p>Placeholder — add menu management UI here.</p>
      </div>
    </div>
  );
}
