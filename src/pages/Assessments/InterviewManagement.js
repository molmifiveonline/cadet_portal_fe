import React from 'react';
import CadetManagement from '../CadetManagement';

const InterviewManagement = () => {
  return (
    <CadetManagement
      pageTitle='Interview Management'
      initialStatus='Interview'
      showAssessmentScore={true}
    />
  );
};

export default InterviewManagement;
