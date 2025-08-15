import React, { useState } from 'react';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { MAX_FILES, isBinaryFile, shouldIncludeFile } from '~/utils/fileUtils';
import { createChatFromFolder } from '~/utils/folderImport';
import { logStore } from '~/lib/stores/logs'; // Assuming logStore is imported from this location
import { Button } from '~/components/ui/Button';
import { ImportConfirmDialog } from '~/components/ui/ImportConfirmDialog';
import { classNames } from '~/utils/classNames';

interface ImportFolderButtonProps {
  className?: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export const ImportFolderButton: React.FC<ImportFolderButtonProps> = ({ className, importChat }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingFolderName, setPendingFolderName] = useState('');

  const processFiles = async (files: File[]) => {
    const folderName = files[0]?.webkitRelativePath.split('/')[0] || 'Unknown Folder';
    setIsLoading(true);

    const loadingToast = toast.loading(`Importing ${folderName}...`);

    try {
      const fileChecks = await Promise.all(
        files.map(async (file) => ({
          file,
          isBinary: await isBinaryFile(file),
        })),
      );

      const textFiles = fileChecks.filter((f) => !f.isBinary).map((f) => f.file);
      const binaryFilePaths = fileChecks
        .filter((f) => f.isBinary)
        .map((f) => f.file.webkitRelativePath.split('/').slice(1).join('/'));

      if (textFiles.length === 0) {
        const error = new Error('No text files found');
        logStore.logError('File import failed - no text files', error, { folderName });
        toast.error('No text files found in the selected folder');
        return;
      }

      if (binaryFilePaths.length > 0) {
        logStore.logWarning(`Skipping binary files during import`, {
          folderName,
          binaryCount: binaryFilePaths.length,
        });
        toast.info(`Skipping ${binaryFilePaths.length} binary files`);
      }

      const messages = await createChatFromFolder(textFiles, binaryFilePaths, folderName);

      console.log('💬 Import Folder: Created messages:', messages.length);
      console.log('🔗 Import Folder: importChat function available:', !!importChat);
      
      if (importChat) {
        console.log('🚀 Import Folder: Calling importChat...');
        await importChat(folderName, [...messages]);
        console.log('✅ Import Folder: importChat completed');
      } else {
        console.log('❌ Import Folder: importChat function not available');
      }

      logStore.logSystem('Folder imported successfully', {
        folderName,
        textFileCount: textFiles.length,
        binaryFileCount: binaryFilePaths.length,
      });
      toast.success('Folder imported successfully');
    } catch (error) {
      logStore.logError('Failed to import folder', error, { folderName });
      console.error('Failed to import folder:', error);
      toast.error('Failed to import folder');
    } finally {
      setIsLoading(false);
      toast.dismiss(loadingToast);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔍 Import Folder: File change detected');
    const allFiles = Array.from(e.target.files || []);
    console.log('📁 Import Folder: Total files selected:', allFiles.length);

    const filteredFiles = allFiles.filter((file) => {
      const path = file.webkitRelativePath.split('/').slice(1).join('/');
      const include = shouldIncludeFile(path);
      return include;
    });
    console.log('✅ Import Folder: Filtered files:', filteredFiles.length);

    if (filteredFiles.length === 0) {
      console.log('❌ Import Folder: No valid files found');
      const error = new Error('No valid files found');
      logStore.logError('File import failed - no valid files', error, { folderName: 'Unknown Folder' });
      toast.error('No files found in the selected folder');
      e.target.value = ''; // Reset file input
      return;
    }

    const folderName = filteredFiles[0]?.webkitRelativePath.split('/')[0] || 'Unknown Folder';

    // Check if files exceed limit
    if (filteredFiles.length > MAX_FILES) {
      // Show beautiful confirmation dialog instead of ugly toast
      setPendingFiles(filteredFiles);
      setPendingFolderName(folderName);
      setShowConfirmDialog(true);
      e.target.value = ''; // Reset file input
      return;
    }

    // Process files normally if under limit
    await processFiles(filteredFiles);
    e.target.value = ''; // Reset file input
  };

  const handleConfirmImport = async () => {
    setShowConfirmDialog(false);
    await processFiles(pendingFiles);
    setPendingFiles([]);
    setPendingFolderName('');
  };

  const handleCancelImport = () => {
    setShowConfirmDialog(false);
    setPendingFiles([]);
    setPendingFolderName('');
  };

  return (
    <>
      <input
        type="file"
        id="folder-import"
        className="hidden"
        webkitdirectory=""
        directory=""
        onChange={handleFileChange}
        {...({} as any)}
      />
      <Button
        onClick={() => {
          console.log('🖱️ Import Folder: Button clicked');
          const input = document.getElementById('folder-import');
          console.log('📄 Import Folder: Input element found:', !!input);
          input?.click();
          console.log('🔄 Import Folder: Input click triggered');
        }}
        title="Import Folder"
        variant="default"
        size="lg"
        className={classNames(
          'gap-2 bg-bolt-elements-background-depth-1',
          'text-bolt-elements-textPrimary',
          'hover:bg-bolt-elements-background-depth-2',
          'border border-bolt-elements-borderColor',
          'h-10 px-4 py-2 min-w-[120px] justify-center',
          'transition-all duration-200 ease-in-out',
          className,
        )}
        disabled={isLoading}
      >
        <span className="i-ph:upload-simple w-4 h-4" />
        {isLoading ? 'Importing...' : 'Import Folder'}
      </Button>

      <ImportConfirmDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelImport}
        onConfirm={handleConfirmImport}
        fileCount={pendingFiles.length}
        maxFiles={MAX_FILES}
        folderName={pendingFolderName}
      />
    </>
  );
};
