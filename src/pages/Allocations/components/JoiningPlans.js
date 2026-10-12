import React from "react";
import FollowupWorkspace from "./FollowupWorkspace";
export default function JoiningPlans({ cycle, onChanged }) {
  return <FollowupWorkspace cycleId={cycle.id} onChanged={onChanged} />;
}
