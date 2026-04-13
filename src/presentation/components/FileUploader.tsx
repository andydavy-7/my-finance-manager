import { useState, useCallback } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  loading?: boolean;
}

const styles = {
  container: {
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  } as React.CSSProperties,
  containerActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff'
  } as React.CSSProperties,
  icon: {
    fontSize: '48px',
    marginBottom: '16px'
  } as React.CSSProperties,
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '8px'
  } as React.CSSProperties,
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '16px'
  } as React.CSSProperties,
  button: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  } as React.CSSProperties,
  input: {
    display: 'none'
  } as React.CSSProperties
};

/**
 * Drag & drop file uploader for CSV files
 */
export function FileUploader({ onFileSelect, loading }: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
    e.target.value = '';
  }, [onFileSelect]);

  const handleClick = () => {
    document.getElementById('file-input')?.click();
  };

  return (
    <div
      style={{
        ...styles.container,
        ...(isDragActive ? styles.containerActive : {})
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div style={styles.icon}>
        {loading ? '...' : '📄'}
      </div>
      <div style={styles.title}>
        {loading ? 'Processing...' : 'Upload Bank Statement'}
      </div>
      <div style={styles.subtitle}>
        Drag & drop your HNB CSV file here, or click to browse
      </div>
      <button
        style={styles.button}
        disabled={loading}
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        {loading ? 'Processing...' : 'Select File'}
      </button>
      <input
        id="file-input"
        type="file"
        accept=".csv"
        style={styles.input}
        onChange={handleFileInput}
      />
    </div>
  );
}
