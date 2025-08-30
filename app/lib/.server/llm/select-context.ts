import { generateText, type CoreTool, type GenerateTextResult, type Message } from 'ai';
import ignore from 'ignore';
import type { IProviderSetting } from '~/types/model';
import { IGNORE_PATTERNS, type FileMap } from './constants';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROVIDER_LIST } from '~/utils/constants';
import { createFilesContext, extractCurrentContext, extractPropertiesFromMessage, simplifyBoltActions } from './utils';
import { createScopedLogger } from '~/utils/logger';
import { LLMManager } from '~/lib/modules/llm/manager';

// Common patterns to ignore, similar to .gitignore

const ig = ignore().add(IGNORE_PATTERNS);
const logger = createScopedLogger('select-context');

export async function selectContext(props: {
  messages: Message[];
  env?: Env;
  apiKeys?: Record<string, string>;
  files: FileMap;
  providerSettings?: Record<string, IProviderSetting>;
  promptId?: string;
  contextOptimization?: boolean;
  summary: string;
  onFinish?: (resp: GenerateTextResult<Record<string, CoreTool<any, any>>, never>) => void;
}) {
  const { messages, env: serverEnv, apiKeys, files, providerSettings, summary, onFinish } = props;
  let currentModel = DEFAULT_MODEL;
  let currentProvider = DEFAULT_PROVIDER.name;
  const processedMessages = messages.map((message) => {
    if (message.role === 'user') {
      const { model, provider, content } = extractPropertiesFromMessage(message);
      currentModel = model;
      currentProvider = provider;

      return { ...message, content };
    } else if (message.role == 'assistant') {
      let content = message.content;

      content = simplifyBoltActions(content);

      content = content.replace(/<div class=\\"__boltThought__\\">.*?<\/div>/s, '');
      content = content.replace(/<think>.*?<\/think>/s, '');

      return { ...message, content };
    }

    return message;
  });

  const provider = PROVIDER_LIST.find((p) => p.name === currentProvider) || DEFAULT_PROVIDER;
  const staticModels = LLMManager.getInstance().getStaticModelListFromProvider(provider);
  let modelDetails = staticModels.find((m) => m.name === currentModel);

  if (!modelDetails) {
    const modelsList = [
      ...(provider.staticModels || []),
      ...(await LLMManager.getInstance().getModelListFromProvider(provider, {
        apiKeys,
        providerSettings,
        serverEnv: serverEnv as any,
      })),
    ];

    if (!modelsList.length) {
      throw new Error(`No models found for provider ${provider.name}`);
    }

    modelDetails = modelsList.find((m) => m.name === currentModel);

    if (!modelDetails) {
      // Fallback to first model
      logger.warn(
        `MODEL [${currentModel}] not found in provider [${provider.name}]. Falling back to first model. ${modelsList[0].name}`,
      );
      modelDetails = modelsList[0];
    }
  }

  const { codeContext } = extractCurrentContext(processedMessages);

  let filePaths = getFilePaths(files || {});
  filePaths = filePaths.filter((x) => {
    const relPath = x.replace('/home/project/', '');
    return !ig.ignores(relPath);
  });

  let context = '';
  const currrentFiles: string[] = [];
  const contextFiles: FileMap = {};

  if (codeContext?.type === 'codeContext') {
    const codeContextFiles: string[] = codeContext.files;
    Object.keys(files || {}).forEach((path) => {
      let relativePath = path;

      if (path.startsWith('/home/project/')) {
        relativePath = path.replace('/home/project/', '');
      }

      if (codeContextFiles.includes(relativePath)) {
        contextFiles[relativePath] = files[path];
        currrentFiles.push(relativePath);
      }
    });
    context = createFilesContext(contextFiles);
  }

  const summaryText = `Here is the summary of the chat till now: ${summary}`;

  const extractTextContent = (message: Message) =>
    Array.isArray(message.content)
      ? (message.content.find((item) => item.type === 'text')?.text as string) || ''
      : message.content;

  const lastUserMessage = processedMessages.filter((x) => x.role == 'user').pop();

  if (!lastUserMessage) {
    throw new Error('No user message found');
  }

  // Оптимизация 1: Простая логика выбора файлов без LLM запроса для часто встречающихся сценариев
  const userQuestion = extractTextContent(lastUserMessage).toLowerCase();

  // Быстрый анализ запроса пользователя для определения типа задачи
  const isSetupRequest = userQuestion.includes('setup') || userQuestion.includes('install') || userQuestion.includes('run') || userQuestion.includes('start');
  const isBugFixRequest = userQuestion.includes('fix') || userQuestion.includes('error') || userQuestion.includes('bug') || userQuestion.includes('issue');
  const isFeatureRequest = userQuestion.includes('add') || userQuestion.includes('create') || userQuestion.includes('implement') || userQuestion.includes('feature');

  let selectedFiles: string[] = [];

  if (isSetupRequest) {
    // Для запросов настройки выбираем конфигурационные файлы
    selectedFiles = filePaths.filter(path =>
      path.includes('package.json') ||
      path.includes('package-lock.json') ||
      path.includes('yarn.lock') ||
      path.includes('tsconfig.json') ||
      path.includes('vite.config') ||
      path.includes('webpack.config') ||
      path.includes('dockerfile') ||
      path.includes('.env') ||
      path.includes('readme')
    ).slice(0, 5); // Максимум 5 файлов
  } else if (isBugFixRequest) {
    // Для исправления багов выбираем основные файлы исходного кода
    selectedFiles = filePaths.filter(path =>
      path.includes('.ts') || path.includes('.tsx') || path.includes('.js') || path.includes('.jsx')
    ).slice(0, 5);
  } else if (isFeatureRequest) {
    // Для новых фич выбираем компоненты и основные файлы
    selectedFiles = filePaths.filter(path =>
      (path.includes('.ts') || path.includes('.tsx') || path.includes('.js') || path.includes('.jsx')) &&
      !path.includes('test') && !path.includes('spec')
    ).slice(0, 5);
  }

  // Оптимизация 2: Обработка выбранных файлов
  let includeFiles: string[] = [];
  let excludeFiles: string[] = [];

  if (selectedFiles.length > 0) {
    // Используем предварительно выбранные файлы
    includeFiles = selectedFiles.map(path => path.startsWith('/home/project/') ? path : `/home/project/${path}`);
  } else {
    // Для остальных случаев используем LLM, но с ограниченным контекстом
    const limitedFilePaths = filePaths.slice(0, 20); // Ограничиваем до 20 файлов для анализа

    const resp = await generateText({
      system: `
        You are a software engineer. You have access to the following files:

        AVAILABLE FILES PATHS
        ---
        ${limitedFilePaths.map((path) => `- ${path}`).join('\n')}
        ---

        You have following code loaded in the context buffer that you can refer to:

        CURRENT CONTEXT BUFFER
        ---
        ${context}
        ---

        RESPONSE FORMAT:
        your response should be in following format:
---
<updateContextBuffer>
    <includeFile path="path/to/file"/>
    <excludeFile path="path/to/file"/>
</updateContextBuffer>
---
        * Your should start with <updateContextBuffer> and end with </updateContextBuffer>.
        * You can include multiple <includeFile> and <excludeFile> tags in the response.
        * You should not include any other text in the response.
        * You should not include any file that is not in the list of files above.
        * You should not include any file that is already in the context buffer.
        * If no changes are needed, you can leave the response empty updateContextBuffer tag.
        `,
      prompt: `
        ${summaryText}

        Users Question: ${extractTextContent(lastUserMessage)}

        update the context buffer with the files that are relevant to the task from the list of files above.

        CRITICAL RULES:
        * Only include relevant files in the context buffer.
        * context buffer should not include any file that is not in the list of files above.
        * context buffer is expensive, so only include files that are absolutely necessary.
        * If no changes are needed, you can leave the response empty updateContextBuffer tag.
        * Maximum 3 files can be placed in the context buffer at a time.

        `,
      model: provider.getModelInstance({
        model: currentModel,
        serverEnv,
        apiKeys,
        providerSettings,
      }),
    });

    const response = resp.text;

    // Обрабатываем ответ LLM
    const updateContextBuffer = response.match(/<updateContextBuffer>([\s\S]*?)<\/updateContextBuffer>/);

    if (!updateContextBuffer) {
      throw new Error('Invalid response. Please follow the response format');
    }

    includeFiles = updateContextBuffer[1]
      .match(/<includeFile path="(.*?)"/gm)
      ?.map((x) => x.replace('<includeFile path="', '').replace('"', '')) || [];
    excludeFiles = updateContextBuffer[1]
      .match(/<excludeFile path="(.*?)"/gm)
      ?.map((x) => x.replace('<excludeFile path="', '').replace('"', '')) || [];
  }

  const filteredFiles: FileMap = {};

  // Защита от undefined/null значений
  if (excludeFiles && Array.isArray(excludeFiles)) {
    excludeFiles.forEach((path) => {
      if (path && contextFiles) {
        delete contextFiles[path];
      }
    });
  }

  if (includeFiles && Array.isArray(includeFiles)) {
    includeFiles.forEach((path) => {
      if (!path) return;

      let fullPath = path;

      if (!path.startsWith('/home/project/')) {
        fullPath = `/home/project/${path}`;
      }

      if (!filePaths || !filePaths.includes(fullPath)) {
        logger.error(`File ${path} is not in the list of files above.`);
        return;
      }

      if (currrentFiles && currrentFiles.includes(path)) {
        return;
      }

      if (files && files[fullPath]) {
        filteredFiles[path] = files[fullPath];
      }
    });
  }

  if (onFinish && resp) {
    onFinish(resp);
  }

  const totalFiles = filteredFiles ? Object.keys(filteredFiles).length : 0;
  logger.info(`Total files: ${totalFiles}`);

  if (totalFiles == 0) {
    logger.warn(`Bolt failed to select files - returning empty context`);
    return {};
  }

  return filteredFiles;

  // generateText({
}

export function getFilePaths(files: FileMap) {
  let filePaths = Object.keys(files);
  filePaths = filePaths.filter((x) => {
    const relPath = x.replace('/home/project/', '');
    return !ig.ignores(relPath);
  });

  return filePaths;
}
