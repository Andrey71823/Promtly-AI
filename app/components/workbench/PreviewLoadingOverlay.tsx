import { memo } from 'react';

export interface PreviewLoadingOverlayProps {
  isVisible: boolean;
  message: string;
  type: 'idle' | 'generating' | 'building' | 'starting' | 'ready' | 'error';
}

// Import updated messages from the store
import { LOADING_MESSAGES } from '~/lib/stores/previewLoading';

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-bolt-elements-textPrimary"></div>
);

const ErrorIcon = () => (
  <div className="text-red-500">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  </div>
);

export const PreviewLoadingOverlay = memo(({ isVisible, message, type }: PreviewLoadingOverlayProps) => {
  if (!isVisible) {
    return null;
  }

  const displayMessage = message || LOADING_MESSAGES[type] || LOADING_MESSAGES.generating;

  return (
    <div 
      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary"
      style={{
        background: 'var(--bolt-elements-background-depth-1)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div className="flex flex-col items-center gap-4 max-w-md mx-auto p-6 text-center">
        {/* Icon/Spinner */}
        <div className="flex items-center justify-center">
          {type === 'error' ? <ErrorIcon /> : <LoadingSpinner />}
        </div>
        
        {/* Message */}
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-xl font-semibold text-bolt-elements-textPrimary mb-1">
              {type === 'error' ? '⏳ Please wait' :
               type === 'ready' ? '✅ Ready!' :
               '⏳ Loading Your App'}
            </p>
            <p className="text-sm text-bolt-elements-textSecondary leading-relaxed max-w-sm">
              {displayMessage}
            </p>
          </div>

          {/* Project Control Options */}
          {(type === 'building' || type === 'starting') && (
            <div className="bg-bolt-elements-background-depth-2 rounded-lg p-3 mt-4">
              <p className="text-xs font-medium text-bolt-elements-textPrimary mb-2">
                💡 Project Controls:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-bolt-elements-textSecondary">
                  <span>🔄</span>
                  <span>Auto-restart enabled</span>
                </div>
                <div className="flex items-center gap-1 text-bolt-elements-textSecondary">
                  <span>🚀</span>
                  <span>Dev server running</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress indicator for non-error states */}
        {type !== 'error' && (
          <div className="w-full max-w-xs">
            <div className="bg-bolt-elements-background-depth-3 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-bolt-elements-textPrimary h-full rounded-full animate-pulse"
                style={{
                  width: type === 'generating' ? '30%' : type === 'building' ? '60%' : '90%',
                  transition: 'width 2s ease-in-out'
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-bolt-elements-textTertiary mt-2">
              <span>Preparing...</span>
              <span>
                {type === 'generating' ? '30%' : type === 'building' ? '60%' : '90%'}
              </span>
            </div>
          </div>
        )}

        {/* Additional info for error state */}
        {type === 'error' && (
          <div className="text-xs text-bolt-elements-textTertiary">
            <p>Waiting for the terminal to finish running commands. This is normal.</p>
          </div>
        )}
      </div>
    </div>
  );
});

PreviewLoadingOverlay.displayName = 'PreviewLoadingOverlay';