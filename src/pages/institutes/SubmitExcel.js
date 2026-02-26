import React, { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import api from '../../lib/utils/apiConfig';
import * as xlsx from 'xlsx';
import {
  isDateColumn,
  formatCellValue,
  validateExcelData,
  validateFileType,
  findHeaderRowIndex,
} from './submitExcelValidation';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const SubmitExcel = () => {
  const { user } = useAuth();
  const instituteName = user?.first_name || 'Institute';

  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [cellErrors, setCellErrors] = useState({});
  const [errorCount, setErrorCount] = useState(0);

  // Admin specific state
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [selectedBatchYear, setSelectedBatchYear] = useState('');

  const isAdmin = user?.role === 'SuperAdmin';
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + 1 - i);

  React.useEffect(() => {
    if (isAdmin) {
      const fetchInstitutes = async () => {
        try {
          const response = await api.get('/institutes?limit=1000');
          setInstitutes(response.data.data || []);
        } catch (error) {
          console.error('Error fetching institutes:', error);
        }
      };
      fetchInstitutes();
    }
  }, [isAdmin]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileError = validateFileType(selectedFile);
      if (fileError) {
        toast.error(fileError);
        return;
      }
      setFile(selectedFile);
      parseExcel(selectedFile);
    }
  };

  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = xlsx.read(data, { type: 'array', cellDates: false });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Helper: get the formatted text of a cell exactly as shown in Excel
        const getCellDisplayValue = (sheetRow, colIdx, header) => {
          const cellAddress = xlsx.utils.encode_cell({
            r: sheetRow,
            c: colIdx,
          });
          const cell = worksheet[cellAddress];
          if (!cell) return '';

          // If it's a date column and Excel parsed it as a number (serial date)
          if (header && isDateColumn(header) && typeof cell.v === 'number') {
            const date1904 = workbook.Workbook?.WBProps?.date1904 || false;
            try {
              const dateObj = xlsx.SSF.parse_date_code(cell.v, { date1904 });
              if (dateObj) {
                const day = String(dateObj.d).padStart(2, '0');
                const month = String(dateObj.m).padStart(2, '0');
                const year = dateObj.y;
                return `${day}-${month}-${year}`;
              }
            } catch (err) {
              console.error('Error parsing date', err);
            }
          }
          if (cell.w !== undefined) return cell.w;
          if (cell.v !== undefined) return String(cell.v);
          return '';
        };

        const json = xlsx.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: true,
        });

        // Find header row (assuming it's within the first 20 rows)
        let headerRowIndex = findHeaderRowIndex(json);

        if (headerRowIndex === -1) {
          setValidationError(
            'Could not identify a valid header row. Please make sure your Excel file has standard column headers like Name, Email, Phone.',
          );
          setHeaders([]);
          setPreviewData([]);
          setCellErrors({});
          setErrorCount(0);
          return;
        }

        setValidationError('');
        const extractedHeaders = json[headerRowIndex].map((h) =>
          h ? String(h).trim() : '',
        );
        setHeaders(extractedHeaders);

        // Parse rows using the formatted cell display values
        const rows = [];
        for (let i = headerRowIndex + 1; i < json.length; i++) {
          const rawRow = json[i];
          if (!rawRow || rawRow.length === 0) continue;

          // Check if the row has at least one non-empty cell
          const hasData = rawRow.some((cell) => {
            if (cell === null || cell === undefined || cell === '')
              return false;
            if (typeof cell === 'string' && cell.trim() === '') return false;
            return true;
          });
          if (!hasData) continue;

          const rowObj = {};
          extractedHeaders.forEach((header, index) => {
            if (header) {
              // Use the formatted display value from the worksheet cell
              // This preserves the exact date format shown in Excel
              rowObj[header] = getCellDisplayValue(i, index, header);
            }
          });
          rows.push(rowObj);
        }

        // Validate cells using external validator
        const { errors, errorCount: errCount } = validateExcelData(
          rows,
          extractedHeaders,
        );

        setCellErrors(errors);
        setErrorCount(errCount);
        setPreviewData(rows);

        if (errCount > 0) {
          setValidationError(
            `${errCount} cell(s) have invalid data. Please fix the highlighted cells in your Excel file and re-upload.`,
          );
        }
      } catch (error) {
        console.error('Error parsing Excel file', error);
        setValidationError(
          'Failed to read Excel file. Please check the file format.',
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const clearFile = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setFile(null);
    setPreviewData([]);
    setHeaders([]);
    setValidationError('');
    setShowConfirm(false);
    setCellErrors({});
    setErrorCount(0);
  };

  const startSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    if (errorCount > 0) {
      toast.error('Please fix all validation errors before submitting');
      return;
    }
    if (validationError) {
      toast.error('Please fix file errors before submitting');
      return;
    }
    if (isAdmin && !selectedInstitute) {
      toast.error('Please select an Institute');
      return;
    }
    if (isAdmin && !selectedBatchYear) {
      toast.error('Please select a Batch Year');
      return;
    }
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      const formData = new FormData();

      if (isAdmin) {
        formData.append('instituteId', selectedInstitute);
        formData.append('batch_year', selectedBatchYear);
      }

      formData.append('file', file);

      await api.post('/institutes/submit-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmitted(true);
      toast.success('File submitted successfully');
    } catch (error) {
      console.error('Error submitting file:', error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to submit file',
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className='flex items-center justify-center h-full p-4'>
        <div className='bg-white max-w-md w-full rounded-2xl shadow-sm border border-gray-100 p-8 text-center animate-in zoom-in duration-300'>
          <div className='w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6'>
            <CheckCircle className='w-8 h-8 text-green-500' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Submission Successful!
          </h1>
          <p className='text-gray-500 mb-6'>
            Thank you, {instituteName}. Your Excel file has been successfully
            uploaded and sent for processing.
          </p>
          <Button
            onClick={() => setSubmitted(false)}
            className='bg-[#3a5f9e] hover:bg-[#325186] text-white'
          >
            Upload Another File
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto py-8 px-4'>
      <div className='mb-8'>
        <h2 className='text-2xl font-bold text-slate-900'>Submit Cadet Data</h2>
        <p className='mt-1 text-slate-600'>
          Welcome,{' '}
          <span className='font-medium text-blue-600'>{instituteName}</span>.
          Please upload the requested Excel sheet containing cadet details.
        </p>
      </div>

      <div className='bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden'>
        <div className='p-6 border-b border-gray-100 bg-slate-50'>
          <form onSubmit={startSubmit}>
            {isAdmin && (
              <div className='flex flex-col md:flex-row gap-4 mb-6'>
                <div className='flex-1 space-y-2'>
                  <label className='text-sm font-medium leading-none'>
                    Select Institute <span className='text-red-500'>*</span>
                  </label>
                  <Select
                    value={selectedInstitute}
                    onValueChange={setSelectedInstitute}
                  >
                    <SelectTrigger className='bg-white'>
                      <SelectValue placeholder='Choose an institute' />
                    </SelectTrigger>
                    <SelectContent>
                      {institutes.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id.toString()}>
                          {inst.institute_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex-1 space-y-2'>
                  <label className='text-sm font-medium leading-none'>
                    Batch Year <span className='text-red-500'>*</span>
                  </label>
                  <Select
                    value={selectedBatchYear}
                    onValueChange={setSelectedBatchYear}
                  >
                    <SelectTrigger className='bg-white'>
                      <SelectValue placeholder='Select year' />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className='border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer relative group'>
              <input
                type='file'
                accept='.xlsx,.xls,.csv'
                onChange={handleFileChange}
                className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20'
              />
              <div className='flex flex-col items-center justify-center gap-3'>
                {file ? (
                  <>
                    <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                      <FileText className='w-6 h-6 text-green-600' />
                    </div>
                    <div className='text-center'>
                      <p className='text-sm font-medium text-gray-900 truncate max-w-[200px]'>
                        {file.name}
                      </p>
                      <p className='text-xs text-gray-500 mt-1'>
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <p className='text-xs text-blue-600 font-medium group-hover:underline'>
                      Click to change file
                    </p>
                  </>
                ) : (
                  <>
                    <div className='w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform'>
                      <Upload className='w-6 h-6 text-blue-600' />
                    </div>
                    <div className='text-center'>
                      <p className='text-sm font-medium text-gray-900'>
                        Click to upload or drag and drop
                      </p>
                      <p className='text-xs text-gray-500 mt-1'>
                        Excel files (XLSX, XLS, CSV) only
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {validationError && (
              <div className='mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3'>
                <AlertCircle className='w-5 h-5 mt-0.5 shrink-0' />
                <p className='text-sm'>{validationError}</p>
              </div>
            )}

            <div className='mt-6 flex justify-end gap-3'>
              {file && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={clearFile}
                  className='border-gray-300'
                >
                  Clear File
                </Button>
              )}
              <Button
                type='submit'
                className='bg-[#3a5f9e] hover:bg-[#325186] text-white px-8 shadow-sm'
                disabled={
                  loading || !file || !!validationError || errorCount > 0
                }
              >
                {loading ? (
                  <>
                    <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                    Processing...
                  </>
                ) : (
                  'Review & Submit'
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        {previewData.length > 0 && (
          <div className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Data Preview
              </h3>
              <div className='flex items-center gap-3'>
                {errorCount > 0 && (
                  <span className='px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1'>
                    <AlertCircle className='w-3 h-3' />
                    {errorCount} error{errorCount > 1 ? 's' : ''}
                  </span>
                )}
                <span className='px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full'>
                  {previewData.length} records found
                </span>
              </div>
            </div>

            {errorCount > 0 && (
              <div className='mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-start gap-2'>
                <AlertCircle className='w-4 h-4 mt-0.5 shrink-0' />
                <p className='text-sm'>
                  <strong>
                    {errorCount} cell{errorCount > 1 ? 's have' : ' has'}{' '}
                    invalid data.
                  </strong>{' '}
                  Cells highlighted in{' '}
                  <span className='text-red-600 font-semibold'>red</span>{' '}
                  contain incorrect values (e.g., invalid date format). Please
                  fix these in your Excel file and re-upload.
                </p>
              </div>
            )}

            <div className='overflow-x-auto border border-gray-200 rounded-lg max-h-[500px] overflow-y-auto'>
              <table className='w-full text-sm text-left text-gray-600'>
                <thead className='text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 shadow-sm'>
                  <tr>
                    <th className='px-4 py-3 font-medium bg-gray-50 border-r border-gray-200'>
                      #
                    </th>
                    {headers.map((header, idx) => (
                      <th
                        key={idx}
                        className='px-4 py-3 font-medium bg-gray-50 border-r border-gray-200 whitespace-nowrap'
                      >
                        {header}
                        {isDateColumn(header) && (
                          <span className='ml-1 text-[10px] font-normal text-gray-400 normal-case'>
                            (date)
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 100).map((row, rowIdx) => {
                    const rowHasError = headers.some(
                      (h) => cellErrors[`${rowIdx}-${h}`],
                    );
                    return (
                      <tr
                        key={rowIdx}
                        className={`border-b hover:bg-gray-50 ${
                          rowHasError ? 'bg-red-50/30' : 'bg-white'
                        }`}
                      >
                        <td className='px-4 py-3 font-medium text-gray-900 border-r border-gray-200'>
                          {rowIdx + 1}
                        </td>
                        {headers.map((header, colIdx) => {
                          const errorKey = `${rowIdx}-${header}`;
                          const hasError = !!cellErrors[errorKey];
                          return (
                            <td
                              key={colIdx}
                              className={`px-4 py-3 border-r border-gray-200 whitespace-nowrap truncate max-w-[200px] ${
                                hasError
                                  ? 'bg-red-100 text-red-800 font-medium'
                                  : ''
                              }`}
                              title={
                                hasError
                                  ? `⚠ ${cellErrors[errorKey]}`
                                  : formatCellValue(row[header], header)
                              }
                            >
                              {hasError && (
                                <AlertCircle
                                  className='w-3 h-3 inline-block mr-1 text-red-500'
                                  title={`⚠ ${cellErrors[errorKey]}`}
                                />
                              )}
                              {formatCellValue(row[header], header)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {previewData.length > 100 && (
              <p className='text-sm text-gray-500 mt-2 text-center'>
                Showing first 100 rows preview...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmSubmit}
        title='Confirm Submission'
        message={
          <>
            Are you sure you want to add these{' '}
            <span className='font-semibold text-gray-900'>
              {previewData.length}
            </span>{' '}
            records? This action will submit the data to the server and process
            them.
          </>
        }
        confirmText='Confirm & Add Data'
        isLoading={loading}
      />
    </div>
  );
};

export default SubmitExcel;
