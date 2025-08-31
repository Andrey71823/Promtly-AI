import { memo, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import type { BundledLanguage } from 'shiki';
import { createScopedLogger } from '~/utils/logger';
import { rehypePlugins, remarkPlugins, allowedHTMLElements } from '~/utils/markdown';
import { Artifact, openArtifactInWorkbench } from './Artifact';
import { CodeBlock } from './CodeBlock';
import type { Message } from 'ai';
import styles from './Markdown.module.scss';
import ThoughtBox from './ThoughtBox';
import type { ProviderInfo } from '~/types/model';

const logger = createScopedLogger('MarkdownComponent');

interface MarkdownProps {
  children: string;
  html?: boolean;
  limitedMarkdown?: boolean;
  append?: (message: Message) => void;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  model?: string;
  provider?: ProviderInfo;
}

export const Markdown = memo(
  ({ children, html = false, limitedMarkdown = false, append, setChatMode, model, provider }: MarkdownProps) => {
    logger.trace('Render');

    const components = useMemo(() => {
      return {
        div: ({ className, children, node, ...props }) => {
          const dataProps = node?.properties as Record<string, unknown>;

          if (className?.includes('__boltArtifact__')) {
            // Accept both dataMessageId and data-message-id
            const messageId =
              (node?.properties.dataMessageId as string) ||
              (node?.properties['data-message-id'] as string);

            if (!messageId) {
              logger.error(`Invalid message id: ${messageId || 'undefined'}`);
              return <div>⚠️ Error: Invalid artifact message ID</div>;
            }

            return <Artifact messageId={messageId} />;
          }

          if (className?.includes('__boltSelectedElement__')) {
            // Try to get messageId from various sources
            let messageId: string | undefined;

            // First try direct access to properties
            if (node?.properties) {
              messageId = node.properties['data-message-id'] as string ||
                         node.properties.dataMessageId as string;
            }

            // If not found, try attributes
            if (!messageId && node?.attributes) {
              messageId = node.attributes['data-message-id'] as string ||
                         node.attributes.dataMessageId as string;
            }

            // Try direct property access as last resort
            if (!messageId && node) {
              messageId = (node as any)['data-message-id'] ||
                         (node as any).dataMessageId;
            }

            // Get element data
            let elementDataAttr: string | undefined;
            if (node?.properties) {
              elementDataAttr = node.properties['data-element'] as string ||
                               node.properties.dataElement as string;
            }
            if (!elementDataAttr && node?.attributes) {
              elementDataAttr = node.attributes['data-element'] as string ||
                               node.attributes.dataElement as string;
            }

            // Debug logging
            console.log('Inspector Debug:', {
              messageId,
              nodeProps: node?.properties,
              nodeAttrs: node?.attributes,
              elementDataAttr: elementDataAttr?.substring(0, 100)
            });

            // Always generate a valid messageId, even if none was found
            const validMessageId = messageId || `selected-element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            console.log('Inspector: Final messageId:', validMessageId);

            // Parse element data first, then handle messageId
            let elementData: any = null;

            if (elementDataAttr) {
              try {
                elementData = JSON.parse(elementDataAttr);
              } catch (e) {
                console.error('Failed to parse element data:', e);
              }
            }

            // If we still don't have a valid messageId, don't fail - just render the element (like old code)
            if (!validMessageId) {
              console.warn('Inspector: No valid messageId found, rendering without it');
              return (
                <div className="bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor rounded-lg p-3 my-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono bg-bolt-elements-background-depth-2 px-2 py-1 rounded text-bolt-elements-textTer">
                      {elementData?.tagName || 'UNKNOWN'}
                    </span>
                    {elementData?.className && (
                      <span className="text-xs text-bolt-elements-textSecondary">.{elementData.className}</span>
                    )}
                  </div>
                  <code className="block text-sm !text-bolt-elements-textSecondary !bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor p-2 rounded">
                    {elementData?.displayText || 'No content'}
                  </code>
                </div>
              );
            }

            console.log('Valid messageId generated:', validMessageId);

            // Element data is already parsed above

            if (elementDataAttr) {
              try {
                elementData = JSON.parse(elementDataAttr);

                // Validate elementData structure
                if (elementData && typeof elementData === 'object') {
                  elementData = {
                    tagName: elementData.tagName || 'UNKNOWN',
                    displayText: elementData.displayText || 'No content',
                    className: elementData.className || '',
                    styles: elementData.styles || {},
                    id: elementData.id || '',
                  };
                } else {
                  elementData = null;
                }
              } catch (e) {
                console.error('Failed to parse element data:', e);
                return <div>⚠️ Error: Failed to parse element data</div>;
              }
            }

            if (!elementData) {
              return <div>⚠️ Error: No element data available</div>;
            }

            return (
              <div className="bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor rounded-lg p-3 my-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono bg-bolt-elements-background-depth-2 px-2 py-1 rounded text-bolt-elements-textTer">
                    {elementData?.tagName || 'Unknown'}
                  </span>
                  {elementData?.className && (
                    <span className="text-xs text-bolt-elements-textSecondary">.{elementData.className}</span>
                  )}
                  <span className="text-xs text-bolt-elements-textTertiary ml-auto">
                    ID: {validMessageId.slice(-8)}
                  </span>
                </div>
                <code className="block text-sm !text-bolt-elements-textSecondary !bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor p-2 rounded">
                  {elementData?.displayText || 'No content'}
                </code>
              </div>
            );
          }

          if (className?.includes('__boltThought__')) {
            return <ThoughtBox title="Thought process">{children}</ThoughtBox>;
          }

          if (className?.includes('__boltQuickAction__') || dataProps?.dataBoltQuickAction) {
            return <div className="flex items-center gap-2 flex-wrap mt-3.5">{children}</div>;
          }

          return (
            <div className={className} {...props}>
              {children}
            </div>
          );
        },
        pre: (props) => {
          const { children, node, ...rest } = props;

          const [firstChild] = node?.children ?? [];

          if (
            firstChild &&
            firstChild.type === 'element' &&
            firstChild.tagName === 'code' &&
            firstChild.children[0].type === 'text'
          ) {
            const { className, ...rest } = firstChild.properties;
            const [, language = 'plaintext'] = /language-(\w+)/.exec(String(className) || '') ?? [];

            return <CodeBlock code={firstChild.children[0].value} language={language as BundledLanguage} {...rest} />;
          }

          return <pre {...rest}>{children}</pre>;
        },
        button: ({ node, children, ...props }) => {
          const dataProps = node?.properties as Record<string, unknown>;

          if (
            dataProps?.class?.toString().includes('__boltQuickAction__') ||
            dataProps?.dataBoltQuickAction === 'true'
          ) {
            const type = dataProps['data-type'] || dataProps.dataType;
            const message = dataProps['data-message'] || dataProps.dataMessage;
            const path = dataProps['data-path'] || dataProps.dataPath;
            const href = dataProps['data-href'] || dataProps.dataHref;

            const iconClassMap: Record<string, string> = {
              file: 'i-ph:file',
              message: 'i-ph:chats',
              implement: 'i-ph:code',
              link: 'i-ph:link',
            };

            const safeType = typeof type === 'string' ? type : '';
            const iconClass = iconClassMap[safeType] ?? 'i-ph:question';

            return (
              <button
                className="rounded-md justify-center px-3 py-1.5 text-xs bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent opacity-90 hover:opacity-100 flex items-center gap-2 cursor-pointer"
                data-type={type}
                data-message={message}
                data-path={path}
                data-href={href}
                onClick={() => {
                  if (type === 'file') {
                    openArtifactInWorkbench(path);
                  } else if (type === 'message' && append) {
                    append({
                      id: `quick-action-message-${Date.now()}`,
                      content: [
                        {
                          type: 'text',
                          text: `[Model: ${model}]\n\n[Provider: ${provider?.name}]\n\n${message}`,
                        },
                      ] as any,
                      role: 'user',
                    });
                    console.log('Message appended:', message);
                  } else if (type === 'implement' && append && setChatMode) {
                    setChatMode('build');
                    append({
                      id: `quick-action-implement-${Date.now()}`,
                      content: [
                        {
                          type: 'text',
                          text: `[Model: ${model}]\n\n[Provider: ${provider?.name}]\n\n${message}`,
                        },
                      ] as any,
                      role: 'user',
                    });
                  } else if (type === 'link' && typeof href === 'string') {
                    try {
                      const url = new URL(href, window.location.origin);
                      window.open(url.toString(), '_blank', 'noopener,noreferrer');
                    } catch (error) {
                      console.error('Invalid URL:', href, error);
                    }
                  }
                }}
              >
                <div className={`text-lg ${iconClass}`} />
                {children}
              </button>
            );
          }

          return <button {...props}>{children}</button>;
        },
      } satisfies Components;
    }, []);

    return (
      <ReactMarkdown
        allowedElements={allowedHTMLElements}
        className={styles.MarkdownContent}
        components={components}
        remarkPlugins={remarkPlugins(limitedMarkdown)}
        rehypePlugins={rehypePlugins(html)}
      >
        {stripCodeFenceFromArtifact(children)}
      </ReactMarkdown>
    );
  },
);

/**
 * Removes code fence markers (```) surrounding an artifact element while preserving the artifact content.
 * This is necessary because artifacts should not be wrapped in code blocks when rendered for rendering action list.
 *
 * @param content - The markdown content to process
 * @returns The processed content with code fence markers removed around artifacts
 *
 * @example
 * // Removes code fences around artifact
 * const input = "```xml\n<div class='__boltArtifact__'></div>\n```";
 * stripCodeFenceFromArtifact(input);
 * // Returns: "\n<div class='__boltArtifact__'></div>\n"
 *
 * @remarks
 * - Only removes code fences that directly wrap an artifact (marked with __boltArtifact__ class)
 * - Handles code fences with optional language specifications (e.g. ```xml, ```typescript)
 * - Preserves original content if no artifact is found
 * - Safely handles edge cases like empty input or artifacts at start/end of content
 */
export const stripCodeFenceFromArtifact = (content: string) => {
  if (!content || !content.includes('__boltArtifact__')) {
    return content;
  }

  const lines = content.split('\n');
  const artifactLineIndex = lines.findIndex((line) => line.includes('__boltArtifact__'));

  // Return original content if artifact line not found
  if (artifactLineIndex === -1) {
    return content;
  }

  // Check previous line for code fence
  if (artifactLineIndex > 0 && lines[artifactLineIndex - 1]?.trim().match(/^```\w*$/)) {
    lines[artifactLineIndex - 1] = '';
  }

  if (artifactLineIndex < lines.length - 1 && lines[artifactLineIndex + 1]?.trim().match(/^```$/)) {
    lines[artifactLineIndex + 1] = '';
  }

  return lines.join('\n');
};
