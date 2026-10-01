import React, { Suspense } from "react";
import { Modal } from "./AllocationPrimitives";

const DeferredDialog = ({ children, onClose }) => (
  <Suspense
    fallback={
      <Modal title="Loading dialog" onClose={onClose}>
        <p role="status" className="py-6 text-center text-sm text-slate-500">
          Loading, please wait…
        </p>
      </Modal>
    }
  >
    {children}
  </Suspense>
);

export default DeferredDialog;
