import React from "react";
import FollowupWorkspace from "./components/FollowupWorkspace";
export default function MyFollowups() {
  return (
    <div className="py-6">
      <FollowupWorkspace mine />
    </div>
  );
}
