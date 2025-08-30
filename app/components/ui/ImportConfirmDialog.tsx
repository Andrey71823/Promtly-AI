import React from 'react';
import { Button } from './Button';

interface ImportConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileCount: number;
  maxFiles: number;
  folderName: string;
}

export const ImportConfirmDialog: React.FC<ImportConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fileCount,
  maxFiles,
  folderName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-bolt-elements-background-depth-2 rounded-xl shadow-2xl border border-bolt-elements-borderColor max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span className="i-ph:warning text-yellow-500 w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">
              Large Project Detected
            </h3>
            <p className="text-sm text-bolt-elements-textSecondary">
              {folderName}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6 space-y-3">
          <p className="text-bolt-elements-textPrimary">
            This folder contains <span className="font-semibold text-bolt-elements-textAccent">{fileCount.toLocaleString()}</span> files.
          </p>
          
          <div className="bg-bolt-elements-background-depth-3 rounded-lg p-4 border border-bolt-elements-borderColor">
            <div className="flex items-start gap-3">
              <span className="i-ph:info text-blue-500 w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-bolt-elements-textSecondary">
                <p className="mb-2">
                  For optimal performance, we recommend projects with fewer than <span className="font-medium">{maxFiles.toLocaleString()}</span> files.
                </p>
                <p>
                  Large projects may experience slower loading times and increased memory usage.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            onClick={onClose}
            variant="secondary"
            size="sm"
            className="px-4"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="default"
            size="sm"
            className="px-4 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-white"
          >
            Import Anyway
          </Button>
        </div>
      </div>
    </div>
  );
};