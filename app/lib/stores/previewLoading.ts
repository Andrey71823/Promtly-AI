import { atom } from 'nanostores';

export type LoadingState = 'idle' | 'generating' | 'building' | 'starting' | 'ready' | 'error';

export interface PreviewLoadingInfo {
  state: LoadingState;
  message?: string;
  timestamp: number;
}

// Global loading state for preview
export const previewLoadingState = atom<PreviewLoadingInfo>({
  state: 'idle',
  message: undefined,
  timestamp: Date.now()
});

// Message templates for different states
export const LOADING_MESSAGES = {
  idle: "",
  generating: "Code ready! Please wait 1-2 minutes for the result to appear in preview",
  building: "Building project... Please wait for the result in preview",
  starting: "Server starting... Please wait for the result in preview", 
  commands: "After executing commands, please wait a couple of minutes for the result to appear in preview",
  executing: "Commands executing... Please wait for result in preview",
  error: "Error loading preview. Please try refreshing or check the terminal for errors.",
  ready: "Preview is ready!"
};

export class PreviewLoadingManager {
  private static instance: PreviewLoadingManager;
  private loadingTimeout: NodeJS.Timeout | null = null;
  private readonly LOADING_TIMEOUT = 120000; // 2 minutes

  static getInstance(): PreviewLoadingManager {
    if (!PreviewLoadingManager.instance) {
      PreviewLoadingManager.instance = new PreviewLoadingManager();
    }
    return PreviewLoadingManager.instance;
  }

  /**
   * Set the loading state with optional custom message
   */
  setLoadingState(state: LoadingState, customMessage?: string) {
    const message = customMessage || LOADING_MESSAGES[state];
    
    previewLoadingState.set({
      state,
      message,
      timestamp: Date.now()
    });

    // Set timeout for stuck loading states
    if (state === 'building' || state === 'starting') {
      this.setLoadingTimeout();
    } else if (state === 'ready' || state === 'error') {
      this.clearLoadingTimeout();
    }

    console.log(`[PreviewLoading] State changed to: ${state}`, message);
  }

  /**
   * Clear loading state and set to ready
   */
  clearLoadingState() {
    this.setLoadingState('ready');
  }

  /**
   * Set error state with optional error message
   */
  setErrorState(errorMessage?: string) {
    this.setLoadingState('error', errorMessage || LOADING_MESSAGES.error);
  }

  /**
   * Check if currently in a loading state
   */
  isLoading(): boolean {
    const current = previewLoadingState.get();
    return ['generating', 'building', 'starting'].includes(current.state);
  }

  /**
   * Get current loading state
   */
  getCurrentState(): PreviewLoadingInfo {
    return previewLoadingState.get();
  }

  /**
   * Set timeout for loading states to prevent infinite loading
   */
  private setLoadingTimeout() {
    this.clearLoadingTimeout();
    
    this.loadingTimeout = setTimeout(() => {
      const current = previewLoadingState.get();
      if (this.isLoading()) {
        console.warn('[PreviewLoading] Loading timeout reached, setting error state');
        this.setErrorState('Loading timeout. Please try refreshing the preview or check the terminal for errors.');
      }
    }, this.LOADING_TIMEOUT);
  }

  /**
   * Clear loading timeout
   */
  private clearLoadingTimeout() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
  }

  /**
   * Monitor terminal output for specific commands and patterns
   */
  monitorTerminalOutput(output: string) {
    const lowerOutput = output.toLowerCase();
    
    // Detect npm install or similar dependency installation
    if (lowerOutput.includes('npm install') || lowerOutput.includes('yarn install') || lowerOutput.includes('pnpm install')) {
      this.setLoadingState('building', LOADING_MESSAGES.executing);
    }
    
    // Detect dev server commands
    if (lowerOutput.includes('npm run dev') || lowerOutput.includes('npm start') || lowerOutput.includes('yarn dev') || lowerOutput.includes('pnpm dev')) {
      this.setLoadingState('starting', LOADING_MESSAGES.starting);
    }
    
    // Detect server startup success messages
    if (lowerOutput.includes('server running') || 
        lowerOutput.includes('local:') || 
        lowerOutput.includes('localhost:') ||
        lowerOutput.includes('ready in') ||
        lowerOutput.includes('compiled successfully')) {
      // Delay clearing to allow iframe to load
      setTimeout(() => {
        this.clearLoadingState();
      }, 1000);
    }
    
    // Detect error messages
    if (lowerOutput.includes('error:') || 
        lowerOutput.includes('failed') ||
        lowerOutput.includes('cannot resolve') ||
        lowerOutput.includes('module not found')) {
      this.setErrorState('Build error detected. Check terminal for details.');
    }
  }

  /**
   * Monitor WebContainer events
   */
  monitorWebContainerEvents(eventType: string, data?: any) {
    switch (eventType) {
      case 'server-ready':
        // Small delay to ensure iframe has time to load
        setTimeout(() => {
          this.clearLoadingState();
        }, 500);
        break;
        
      case 'port-open':
        this.setLoadingState('starting');
        break;
        
      case 'port-close':
        // Don't automatically set error, might be intentional restart
        break;
        
      case 'error':
        this.setErrorState(data?.message || 'WebContainer error occurred');
        break;
    }
  }

  /**
   * Monitor iframe loading events
   */
  monitorIframeEvents(eventType: 'load' | 'error', iframe?: HTMLIFrameElement) {
    switch (eventType) {
      case 'load':
        // Verify iframe actually has content before clearing
        setTimeout(() => {
          if (iframe && this.isIframeContentLoaded(iframe)) {
            this.clearLoadingState();
          }
        }, 500);
        break;
        
      case 'error':
        this.setErrorState('Failed to load preview content');
        break;
    }
  }

  /**
   * Check if iframe has actual content (not just blank page)
   */
  private isIframeContentLoaded(iframe: HTMLIFrameElement): boolean {
    try {
      // Basic check - if iframe has a src and is not about:blank
      return !!(iframe.src && iframe.src !== 'about:blank' && iframe.src.length > 0);
    } catch (error) {
      // Cross-origin restrictions might prevent access
      return true; // Assume loaded if we can't check
    }
  }

  /**
   * Reset to idle state
   */
  reset() {
    this.clearLoadingTimeout();
    previewLoadingState.set({
      state: 'idle',
      message: undefined,
      timestamp: Date.now()
    });
  }
}

// Export singleton instance
export const previewLoadingManager = PreviewLoadingManager.getInstance();