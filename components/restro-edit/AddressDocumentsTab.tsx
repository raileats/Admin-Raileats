import React from "react";

type Props = { local: any; updateField: (k:string,v:any)=>void; stationDisplay: string; };

export default function AddressDocumentsTab({ local, updateField, stationDisplay }: Props) {
  return (
    <div>
      <h3 style={{ textAlign: "center", marginTop: 0 }}>Address & Documents</h3>
      <div style={{ maxWidth: 1200, margin: "8px auto" }}>
        <p>Placeholder — add address fields & document upload UI here.</p>
      </div>
    </div>
  );
}
