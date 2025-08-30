import type { Message } from 'ai';
import { generateId } from './fileUtils';
import { detectProjectCommands, createCommandsMessage, escapeBoltTags } from './projectCommands';

export const createChatFromFolder = async (
  files: File[],
  binaryFiles: string[],
  folderName: string,
): Promise<Message[]> => {
  // Optimization 1: Limit file content size (maximum 100KB per file)
  const MAX_CONTENT_SIZE = 100 * 1024; // 100KB

  const fileArtifacts = await Promise.all(
    files.map(async (file) => {
      return new Promise<{ content: string; path: string; truncated?: boolean }>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          let content = reader.result as string;
          const relativePath = file.webkitRelativePath.split('/').slice(1).join('/');

          // Optimization 2: Truncate large files
          let truncated = false;
          if (content.length > MAX_CONTENT_SIZE) {
            const lines = content.split('\n');
            let truncatedContent = '';
            let currentSize = 0;

            for (const line of lines) {
              if (currentSize + line.length > MAX_CONTENT_SIZE) {
                truncatedContent += `\n\n[... ${lines.length - truncatedContent.split('\n').length} more lines truncated due to size limit ...]`;
                truncated = true;
                break;
              }
              truncatedContent += line + '\n';
              currentSize += line.length;
            }
            content = truncatedContent;
          }

          resolve({
            content,
            path: relativePath,
            truncated,
          });
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }),
  );

  const commands = await detectProjectCommands(fileArtifacts);
  const commandsMessage = createCommandsMessage(commands);

  const binaryFilesMessage =
    binaryFiles.length > 0
      ? `\n\nSkipped ${binaryFiles.length} binary files:\n${binaryFiles.map((f) => `- ${f}`).join('\n')}`
      : '';

  // Optimization 3: Create compact file list instead of huge artifact
  const fileSummary = fileArtifacts.map((file, index) => {
    const sizeInfo = file.truncated ? ' (truncated)' : '';
    return `${index + 1}. ${file.path}${sizeInfo}`;
  }).join('\n');

  const filesMessage: Message = {
    role: 'assistant',
    content: `I've imported the "${folderName}" folder with ${fileArtifacts.length} files.${binaryFilesMessage}

## 📁 Imported Files Summary:
${fileSummary}

## 💡 Recommendations:
- Use the file browser to explore specific files
- Large files have been truncated for performance
- Focus on key files for your task

<boltArtifact id="imported-files" title="Project Structure" type="bundled" >
<boltAction type="file" filePath="PROJECT_STRUCTURE.md">
# ${folderName} - Project Structure

This project contains ${fileArtifacts.length} files:
${fileArtifacts.map(f => `- ${f.path}`).join('\n')}

${binaryFiles.length > 0 ? `\nBinary files skipped: ${binaryFiles.length}` : ''}
</boltAction>
</boltArtifact>`,
    id: generateId(),
    createdAt: new Date(),
  };

  const userMessage: Message = {
    role: 'user',
    id: generateId(),
    content: `Import the "${folderName}" folder`,
    createdAt: new Date(),
  };

  const messages = [userMessage, filesMessage];

  if (commandsMessage) {
    messages.push({
      role: 'user',
      id: generateId(),
      content: 'Setup the codebase and Start the application',
    });
    messages.push(commandsMessage);
  }

  return messages;
};
