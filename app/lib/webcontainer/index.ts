import { WebContainer } from '@webcontainer/api';
import { WORK_DIR_NAME } from '~/utils/constants';
import { cleanStackTrace } from '~/utils/stacktrace';

interface WebContainerContext {
  loaded: boolean;
}

export const webcontainerContext: WebContainerContext = import.meta.hot?.data.webcontainerContext ?? {
  loaded: false,
};

if (import.meta.hot) {
  import.meta.hot.data.webcontainerContext = webcontainerContext;
}

// Optimization 1: Lazy initialization of WebContainer
let webcontainerPromise: Promise<WebContainer> | null = null;
let isInitializing = false;

export const getWebContainer = (): Promise<WebContainer> => {
  if (webcontainerPromise) {
    return webcontainerPromise;
  }

  if (isInitializing) {
    // If initialization is already in progress, return a promise that will resolve later
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (webcontainerPromise) {
          clearInterval(checkInterval);
          webcontainerPromise.then(resolve).catch(reject);
        }
      }, 100);
    });
  }

  isInitializing = true;

  webcontainerPromise = (async () => {
    try {
      console.log('🚀 Initializing WebContainer...');
      const container = await WebContainer.boot({
        coep: 'credentialless',
        workdirName: WORK_DIR_NAME,
        forwardPreviewErrors: true,
      });

      webcontainerContext.loaded = true;
      console.log('✅ WebContainer initialized successfully');

      const { workbenchStore } = await import('~/lib/stores/workbench');

      try {
        const response = await fetch('/inspector-script.js');
        const inspectorScript = await response.text();
        await container.setPreviewScript(inspectorScript);
      } catch (error) {
        console.warn('⚠️ Failed to load inspector script:', error);
        // Don't throw error, continue working
      }

      // Listen for preview errors with throttling
      let lastErrorTime = 0;
      container.on('preview-message', (message) => {
        const now = Date.now();
        // Throttle errors to prevent spam
        if (now - lastErrorTime < 1000) return;
        lastErrorTime = now;

        console.log('WebContainer preview message:', message);

        if (message.type === 'PREVIEW_UNCAUGHT_EXCEPTION' || message.type === 'PREVIEW_UNHANDLED_REJECTION') {
          const isPromise = message.type === 'PREVIEW_UNHANDLED_REJECTION';
          const title = isPromise ? 'Unhandled Promise Rejection' : 'Uncaught Exception';
          workbenchStore.actionAlert.set({
            type: 'preview',
            title,
            description: 'message' in message ? message.message : 'Unknown error',
            content: `Error occurred at ${message.pathname}${message.search}${message.hash}\nPort: ${message.port}\n\nStack trace:\n${cleanStackTrace(message.stack || '')}`,
            source: 'preview',
          });
        }
      });

      return container;
    } catch (error) {
      console.error('❌ WebContainer initialization failed:', error);
      isInitializing = false;
      webcontainerPromise = null;
      throw error;
    } finally {
      isInitializing = false;
    }
  })();

  return webcontainerPromise;
};

export let webcontainer: Promise<WebContainer> = new Promise(() => {
  // noop for ssr
});

if (!import.meta.env.SSR) {
  webcontainer = getWebContainer();

  if (import.meta.hot) {
    import.meta.hot.data.webcontainer = webcontainer;
  }
}
