import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { jsPDF } from 'jspdf';
import {
  ChevronLeft,
  ChevronRight,
  Eraser,
  FilePlus2,
  Loader2,
  PenLine,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const CANVAS_WIDTH = 1240;
const CANVAS_HEIGHT = 1754;
const MAX_PDF_SIZE = 10 * 1024 * 1024;

const ToolbarButton = ({
  active = false,
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const variantClass =
    variant === 'success'
      ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
      : active
        ? 'border-blue-600 bg-blue-600 text-white'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

  return (
    <button
      type='button'
      className={`inline-flex h-10 whitespace-nowrap items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const InterviewHandwritingEditor = ({
  cadetId,
  cadetName,
  onClose,
  onSaved,
}) => {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const pagesRef = useRef([null]);
  const loadTokenRef = useRef(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [pageVersion, setPageVersion] = useState(0);
  const [tool, setTool] = useState('pen');
  const [strokeSize, setStrokeSize] = useState(6);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [showPageActionConfirmation, setShowPageActionConfirmation] =
    useState(false);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);

  const renderPage = useCallback((pageIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    const token = ++loadTokenRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);

    const pageImage = pagesRef.current[pageIndex];
    if (!pageImage) {
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    const image = new Image();
    image.onload = () => {
      if (loadTokenRef.current !== token || !canvasRef.current) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      setPageLoading(false);
    };
    image.onerror = () => {
      setPageLoading(false);
      toast.error(`Page ${pageIndex + 1} could not be restored`);
    };
    image.src = pageImage;
  }, []);

  useEffect(() => {
    renderPage(currentPage);
  }, [currentPage, pageVersion, renderPage]);

  useEffect(() => {
    const warnBeforeLeaving = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [dirty]);

  const saveCurrentPageSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return pagesRef.current;
    pagesRef.current[currentPage] = canvas.toDataURL('image/png');
    return pagesRef.current;
  }, [currentPage]);

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    };
  };

  const configureStroke = (context, event) => {
    const pressure =
      event.pointerType === 'pen' && event.pressure > 0
        ? 0.55 + event.pressure
        : 1;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#0f172a';
    context.globalCompositeOperation =
      tool === 'eraser' ? 'destination-out' : 'source-over';
    context.lineWidth =
      tool === 'eraser' ? Math.max(18, strokeSize * 4) : strokeSize * pressure;
  };

  const handlePointerDown = (event) => {
    if (pageLoading) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const point = getCanvasPoint(event);

    canvas.setPointerCapture?.(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = point;
    configureStroke(context, event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x + 0.01, point.y + 0.01);
    context.stroke();
    setDirty(true);
  };

  const handlePointerMove = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const context = canvasRef.current.getContext('2d');
    const point = getCanvasPoint(event);
    configureStroke(context, event);
    context.beginPath();
    context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPointRef.current = point;
  };

  const finishStroke = (event) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    canvasRef.current?.releasePointerCapture?.(event.pointerId);
    saveCurrentPageSnapshot();
  };

  const changePage = (nextPage) => {
    if (nextPage < 0 || nextPage >= pagesRef.current.length) return;
    saveCurrentPageSnapshot();
    setCurrentPage(nextPage);
  };

  const addPage = () => {
    saveCurrentPageSnapshot();
    pagesRef.current.push(null);
    setPageCount(pagesRef.current.length);
    setCurrentPage(pagesRef.current.length - 1);
    setDirty(true);
  };

  const deletePage = () => {
    setShowPageActionConfirmation(true);
  };

  const confirmPageAction = () => {
    if (pageCount === 1) {
      pagesRef.current[0] = null;
      setPageVersion((value) => value + 1);
    } else {
      pagesRef.current.splice(currentPage, 1);
      const nextPage = Math.min(currentPage, pagesRef.current.length - 1);
      setPageCount(pagesRef.current.length);
      setCurrentPage(nextPage);
      setPageVersion((value) => value + 1);
    }
    setDirty(true);
    setShowPageActionConfirmation(false);
  };

  const handleClose = () => {
    if (dirty) {
      setShowDiscardConfirmation(true);
      return;
    }
    onClose();
  };

  const confirmDiscardChanges = () => {
    setShowDiscardConfirmation(false);
    onClose();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const pages = [...saveCurrentPageSnapshot()];
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
        putOnlyUsedFonts: true,
      });

      pages.forEach((pageImage, index) => {
        if (index > 0) pdf.addPage('a4', 'portrait');
        if (pageImage) {
          pdf.addImage(pageImage, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        }
      });

      const pdfBlob = pdf.output('blob');
      if (pdfBlob.size > MAX_PDF_SIZE) {
        toast.error(
          'The generated PDF is larger than 10MB. Delete unnecessary pages and try again.',
        );
        return;
      }

      const safeCadetId = String(cadetId).replace(/[^a-zA-Z0-9_-]/g, '-');
      const savedAt = new Date().toISOString().replace(/[:.]/g, '-');
      const file = new File(
        [pdfBlob],
        `handwritten-interview-${safeCadetId}-${savedAt}.pdf`,
        { type: 'application/pdf' },
      );
      const formData = new FormData();
      formData.append('handwritten_sheet', file);

      const response = await api.post(
        `/interviews/${cadetId}/handwritten-sheet`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      setDirty(false);
      toast.success('Handwritten interview notes saved as PDF');
      onSaved(response.data?.data || {});
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to save handwritten interview notes';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className='fixed inset-0 z-[100] flex h-[100dvh] flex-col bg-slate-100'
      role='dialog'
      aria-modal='true'
      aria-label='Handwritten interview notes'
    >
      <ConfirmationModal
        isOpen={showPageActionConfirmation}
        onClose={() => setShowPageActionConfirmation(false)}
        onConfirm={confirmPageAction}
        title={pageCount === 1 ? 'Clear Page?' : 'Delete Page?'}
        message={
          pageCount === 1
            ? 'Clear everything written on this page? This action cannot be undone.'
            : `Delete page ${currentPage + 1}? This action cannot be undone.`
        }
        confirmText={pageCount === 1 ? 'Clear Page' : 'Delete Page'}
        confirmButtonClass='bg-red-600 hover:bg-red-700 shadow-red-600/20'
      />
      <ConfirmationModal
        isOpen={showDiscardConfirmation}
        onClose={() => setShowDiscardConfirmation(false)}
        onConfirm={confirmDiscardChanges}
        title='Discard Unsaved Changes?'
        message='Close the handwriting editor and discard unsaved changes? This action cannot be undone.'
        confirmText='Discard Changes'
        confirmButtonClass='bg-red-600 hover:bg-red-700 shadow-red-600/20'
      />
      <header className='shrink-0 border-b border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-5'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='min-w-0'>
            <h1 className='truncate text-base font-bold text-slate-900 sm:text-lg'>
              Handwritten Interview Notes
            </h1>
            <p className='truncate text-xs text-slate-500 sm:text-sm'>
              {cadetName || cadetId} · Page {currentPage + 1} of {pageCount}
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <ToolbarButton
              onClick={handleSave}
              disabled={saving}
              variant='success'
              className='min-w-[116px]'
            >
              {saving ? (
                <Loader2 className='animate-spin' size={17} />
              ) : (
                <Save size={17} />
              )}
              Save PDF
            </ToolbarButton>
            <ToolbarButton
              onClick={handleClose}
              disabled={saving}
              aria-label='Close handwriting editor'
              className='px-2'
            >
              <X size={19} />
            </ToolbarButton>
          </div>
        </div>

        <div className='mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3'>
          <ToolbarButton
            active={tool === 'pen'}
            onClick={() => setTool('pen')}
          >
            <PenLine size={17} />
            Pen
          </ToolbarButton>
          <ToolbarButton
            active={tool === 'eraser'}
            onClick={() => setTool('eraser')}
          >
            <Eraser size={17} />
            Eraser
          </ToolbarButton>

          <label className='flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600'>
            Size
            <input
              type='range'
              min='2'
              max='24'
              step='1'
              value={strokeSize}
              onChange={(event) => setStrokeSize(Number(event.target.value))}
              className='w-20 accent-blue-600 sm:w-28'
            />
            <span className='w-5 text-right'>{strokeSize}</span>
          </label>

          <div className='mx-1 hidden h-7 w-px bg-slate-200 sm:block' />

          <ToolbarButton
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label='Previous page'
            className='px-2'
          >
            <ChevronLeft size={18} />
          </ToolbarButton>
          <span className='min-w-16 text-center text-sm font-semibold text-slate-600'>
            {currentPage + 1} / {pageCount}
          </span>
          <ToolbarButton
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === pageCount - 1}
            aria-label='Next page'
            className='px-2'
          >
            <ChevronRight size={18} />
          </ToolbarButton>
          <ToolbarButton onClick={addPage}>
            <FilePlus2 size={17} />
            Add Page
          </ToolbarButton>
          <ToolbarButton
            onClick={deletePage}
            className='border-red-200 text-red-600 hover:bg-red-50'
          >
            <Trash2 size={17} />
            {pageCount === 1 ? 'Clear Page' : 'Delete Page'}
          </ToolbarButton>
        </div>
      </header>

      <main className='min-h-0 flex-1 overflow-auto p-3 sm:p-6'>
        <div className='relative mx-auto w-full max-w-[900px]'>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishStroke}
            onPointerCancel={finishStroke}
            onPointerLeave={(event) => {
              if (event.pointerType === 'mouse') finishStroke(event);
            }}
            className={`block h-auto w-full select-none bg-white shadow-xl ring-1 ring-slate-300 ${
              tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'
            }`}
            style={{
              aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
              touchAction: 'none',
            }}
          />
          {pageLoading && (
            <div className='absolute inset-0 flex items-center justify-center bg-white/70'>
              <Loader2 className='animate-spin text-blue-600' size={32} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InterviewHandwritingEditor;
