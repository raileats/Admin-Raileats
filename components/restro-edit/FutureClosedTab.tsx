import React from "react";
type Props = { local:any; updateField:(k:string,v:any)=>void; stationDisplay:string; };
export default function FutureClosedTab({ local }: Props) {
  return (
    <div>
      <h3 style={{ textAlign: "center", marginTop: 0 }}>Future Closed</h3>
      <div style={{ maxWidth: 1200, margin: "8px auto" }}>
        <p>Placeholder — schedule future closed dates here.</p>
      </div>
    </div>
  );
}
