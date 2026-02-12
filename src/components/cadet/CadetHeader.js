import React from 'react';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const CadetHeader = ({
  selectedInstitute,
  onInstituteChange,
  institutes,
  onImportClick,
}) => {
  return (
    <div className='flex justify-between items-center mb-8'>
      <h1 className='text-2xl font-semibold text-gray-900'>Cadet Management</h1>
      <div className='flex gap-4'>
        <Select value={selectedInstitute} onValueChange={onInstituteChange}>
          <SelectTrigger className='w-[200px] bg-white'>
            <SelectValue placeholder='Filter by Institute' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Institutes</SelectItem>
            {institutes.map((institute) => (
              <SelectItem key={institute.id} value={institute.id.toString()}>
                {institute.institute_name || institute.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={onImportClick}>+ Import Cadets from Excel</Button>
      </div>
    </div>
  );
};

export default CadetHeader;
