'use client';
export default function AddOutletModal({ show=false, onClose=()=>{} }) {
  if (!show) return null;
  return (
    <div className="modal-backdrop fade show" style={{zIndex:2000}}>
      <div className="modal d-block" role="dialog" style={{zIndex:2001}} onClick={onClose}>
        <div className="modal-dialog" onClick={e=>e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Outlet</h5>
              <button className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">Placeholder - outlet form removed.</div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
