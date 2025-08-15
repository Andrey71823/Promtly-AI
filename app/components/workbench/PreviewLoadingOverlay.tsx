import { memo } from 'react';

export interface PreviewLoadingOverlayProps {
  isVisible: boolean;
  message: string;
  type: 'idle' | 'generating' | 'building' | 'starting' | 'ready' | 'error';
}

const LOADING_MESSAGES = {
  idle: "",
  generating: "Code ready! Please wait 1-2 minutes for the result to appear in preview",
  building: "Building project... Please wait for the result in preview", 
  starting: "Server starting... Please wait for the result in preview",
  commands: "After executing commands, please wait a couple of minutes for the result to appear in preview",
  executing: "Commands executing... Please wait for result in preview",
  ready: "Preview is ready!",
  error: "Error loading preview. Please try refreshing or check the terminal for errors."
};

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bolt-elements-textPrimary"></div>
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
        <div className="space-y-2">
          <p className="text-lg font-medium text-bolt-elements-textPrimary">
            {type === 'error' ? 'Preview Error' : 'Loading Preview'}
          </p>
          <p className="text-sm text-bolt-elements-textSecondary leading-relaxed">
            {displayMessage}
          </p>
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
            <p>Try refreshing the preview or check the terminal for error details.</p>
          </div>
        )}
      </div>
    </div>
  );
});

PreviewLoadingOverlay.displayName = 'PreviewLoadingOverlay';