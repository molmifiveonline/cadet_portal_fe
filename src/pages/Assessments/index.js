import React from 'react';
import CadetManagement from '../CadetManagement';

const AssessmentManagement = () => {
  // We reuse the CadetManagement logic but we might filter it differently
  // In this case, we'll just show the same management view
  return (
    <CadetManagement
      pageTitle='Assessment Management'
      showShortlistedOnlyDefault={true}
    />
  );
};

export default AssessmentManagement;
