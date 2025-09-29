import React from "react";
type Props = { local:any; updateField:(k:string,v:any)=>void; stationDisplay:string; };
export default function BankTab({ local }: Props) {
  return (
    <div>
      <h3 style={{ textAlign: "center", marginTop: 0 }}>Bank</h3>
      <div style={{ maxWidth: 1200, margin: "8px auto" }}>
        <p>Placeholder — add bank account fields here.</p>
      </div>
    </div>
  );
}
