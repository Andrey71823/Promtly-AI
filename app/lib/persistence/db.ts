import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { ChatHistoryItem } from './useChatHistory';
import type { Snapshot } from './types'; // Import Snapshot type

export interface IChatMetadata {
  gitUrl: string;
  gitBranch?: string;
  netlifySiteId?: string;
}

const logger = createScopedLogger('ChatHistory');

// this is used at the top level and never rejects
let cachedDbPromise: Promise<IDBDatabase | undefined> | undefined;

function isClosingOrInvalidStateError(error: unknown): boolean {
  const message = (error as any)?.message || '';
  const name = (error as any)?.name || '';
  return /closing/i.test(message) || name === 'InvalidStateError' || name === 'TransactionInactiveError';
}

async function ensureOpen(db: IDBDatabase | undefined): Promise<IDBDatabase | undefined> {
  if (!db) {
    return openDatabase();
  }

  try {
    // Try a lightweight readonly transaction to validate connection state
    db.transaction('chats', 'readonly');
    return db;
  } catch (error) {
    if (isClosingOrInvalidStateError(error)) {
      return openDatabase();
    }
    throw error;
  }
}

export async function openDatabase(): Promise<IDBDatabase | undefined> {
  if (typeof indexedDB === 'undefined') {
    console.error('indexedDB is not available in this environment.');
    return undefined;
  }

  if (!cachedDbPromise) {
    cachedDbPromise = new Promise((resolve) => {
      const request = indexedDB.open('boltHistory', 2);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('chats')) {
            const store = db.createObjectStore('chats', { keyPath: 'id' });
            store.createIndex('id', 'id', { unique: true });
            store.createIndex('urlId', 'urlId', { unique: true });
          }
        }

        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('snapshots')) {
            db.createObjectStore('snapshots', { keyPath: 'chatId' });
          }
        }
      };

      request.onsuccess = (event: Event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // If an upgrade happens in another tab, close our connection gracefully
        db.onversionchange = () => {
          try {
            db.close();
          } catch {}
          cachedDbPromise = undefined;
        };
        resolve(db);
      };

      request.onblocked = () => {
        // Another tab is holding the DB open during an upgrade; degrade gracefully
        resolve(undefined);
      };

      request.onerror = (event: Event) => {
        resolve(undefined);
        logger.error((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  return cachedDbPromise;
}

export async function getAll(db: IDBDatabase): Promise<ChatHistoryItem[]> {
  const usableDb = await ensureOpen(db);
  if (!usableDb) return [];
  return new Promise((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = usableDb.transaction('chats', 'readonly');
    } catch (error) {
      if (isClosingOrInvalidStateError(error)) {
        openDatabase().then((fresh) => {
          if (!fresh) return resolve([]);
          const tx = fresh.transaction('chats', 'readonly');
          const store = tx.objectStore('chats');
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result as ChatHistoryItem[]);
          request.onerror = () => reject(request.error);
        });
        return;
      }
      return reject(error as any);
    }

    const store = transaction.objectStore('chats');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as ChatHistoryItem[]);
    request.onerror = () => reject(request.error);
  });
}

export async function setMessages(
  db: IDBDatabase,
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string,
  timestamp?: string,
  metadata?: IChatMetadata,
): Promise<void> {
  const usableDb = await ensureOpen(db);
  if (!usableDb) return;
  return new Promise((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = usableDb.transaction('chats', 'readwrite');
    } catch (error) {
      if (isClosingOrInvalidStateError(error)) {
        openDatabase().then((fresh) => {
          if (!fresh) return resolve();
          const tx = fresh.transaction('chats', 'readwrite');
          const store = tx.objectStore('chats');
          if (timestamp && isNaN(Date.parse(timestamp))) {
            reject(new Error('Invalid timestamp'));
            return;
          }
          const request = store.put({ id, messages, urlId, description, timestamp: timestamp ?? new Date().toISOString(), metadata });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        return;
      }
      return reject(error as any);
    }

    const store = transaction.objectStore('chats');

    if (timestamp && isNaN(Date.parse(timestamp))) {
      reject(new Error('Invalid timestamp'));
      return;
    }

    const request = store.put({ id, messages, urlId, description, timestamp: timestamp ?? new Date().toISOString(), metadata });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getMessages(db: IDBDatabase, id: string): Promise<ChatHistoryItem> {
  return (await getMessagesById(db, id)) || (await getMessagesByUrlId(db, id));
}

export async function getMessagesByUrlId(db: IDBDatabase, id: string): Promise<ChatHistoryItem> {
  const usableDb = await ensureOpen(db);
  if (!usableDb) return undefined as any;
  return new Promise((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = usableDb.transaction('chats', 'readonly');
    } catch (error) {
      if (isClosingOrInvalidStateError(error)) {
        openDatabase().then((fresh) => {
          if (!fresh) return resolve(undefined as any);
          const tx = fresh.transaction('chats', 'readonly');
          const store = tx.objectStore('chats');
          const index = store.index('urlId');
          const request = index.get(id);
          request.onsuccess = () => resolve(request.result as ChatHistoryItem);
          request.onerror = () => reject(request.error);
        });
        return;
      }
      return reject(error as any);
    }

    const store = transaction.objectStore('chats');
    const index = store.index('urlId');
    const request = index.get(id);
    request.onsuccess = () => resolve(request.result as ChatHistoryItem);
    request.onerror = () => reject(request.error);
  });
}

export async function getMessagesById(db: IDBDatabase, id: string): Promise<ChatHistoryItem> {
  const usableDb = await ensureOpen(db);
  if (!usableDb) return undefined as any;
  return new Promise((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = usableDb.transaction('chats', 'readonly');
    } catch (error) {
      if (isClosingOrInvalidStateError(error)) {
        openDatabase().then((fresh) => {
          if (!fresh) return resolve(undefined as any);
          const tx = fresh.transaction('chats', 'readonly');
          const store = tx.objectStore('chats');
          const request = store.get(id);
          request.onsuccess = () => resolve(request.result as ChatHistoryItem);
          request.onerror = () => reject(request.error);
        });
        return;
      }
      return reject(error as any);
    }

    const store = transaction.objectStore('chats');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result as ChatHistoryItem);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteById(db: IDBDatabase, id: string): Promise<void> {
  const usableDb = await ensureOpen(db);
  if (!usableDb) return;
  return new Promise((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = usableDb.transaction(['chats', 'snapshots'], 'readwrite'); // Add snapshots store to transaction
    } catch (error) {
      if (isClosingOrInvalidStateError(error)) {
        openDatabase().then((fresh) => {
          if (!fresh) return resolve();
          const tx = fresh.transaction(['chats', 'snapshots'], 'readwrite');
          const chatStore = tx.objectStore('chats');
          const snapshotStore = tx.objectStore('snapshots');
          const deleteChatRequest = chatStore.delete(id);
          const deleteSnapshotRequest = snapshotStore.delete(id);
          let chatDeleted = false;
          let snapshotDeleted = false;
          const checkCompletion = () => {
            if (chatDeleted && snapshotDeleted) {
              resolve(undefined);
            }
          };
          deleteChatRequest.onsuccess = () => { chatDeleted = true; checkCompletion(); };
          deleteChatRequest.onerror = () => reject(deleteChatRequest.error);
          deleteSnapshotRequest.onsuccess = () => { snapshotDeleted = true; checkCompletion(); };
          deleteSnapshotRequest.onerror = (event) => {
            if ((event.target as IDBRequest).error?.name === 'NotFoundError') { snapshotDeleted = true; checkCompletion(); }
            else { reject(deleteSnapshotRequest.error); }
          };
        });
        return;
      }
      return reject(error as any);
    }
    const chatStore = transaction.objectStore('chats');
    const snapshotStore = transaction.objectStore('snapshots');

    const deleteChatRequest = chatStore.delete(id);
    const deleteSnapshotRequest = snapshotStore.delete(id); // Also delete snapshot

    let chatDeleted = false;
    let snapshotDeleted = false;

    const checkCompletion = () => {
      if (chatDeleted && snapshotDeleted) {
        resolve(undefined);
      }
    };

    deleteChatRequest.onsuccess = () => {
      chatDeleted = true;
      checkCompletion();
    };
    deleteChatRequest.onerror = () => reject(deleteChatRequest.error);

    deleteSnapshotRequest.onsuccess = () => {
      snapshotDeleted = true;
      checkCompletion();
    };

    deleteSnapshotRequest.onerror = (event) => {
      if ((event.target as IDBRequest).error?.name === 'NotFoundError') {
        snapshotDeleted = true;
        checkCompletion();
      } else {
        reject(deleteSnapshotRequest.error);
      }
    };

    transaction.oncomplete = () => {
      // This might resolve before checkCompletion if one operation finishes much faster
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getNextId(db: IDBDatabase): Promise<string> {
  const usableDb = await ensureOpen(db);
  if (!usableDb) return '1';
  return new Promise((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = usableDb.transaction('chats', 'readonly');
    } catch (error) {
      if (isClosingOrInvalidStateError(error)) {
        openDatabase().then((fresh) => {
          if (!fresh) return resolve('1');
          const tx = fresh.transaction('chats', 'readonly');
          const store = tx.objectStore('chats');
          const request = store.getAllKeys();
          request.onsuccess = () => {
            const highestId = (request.result as any[]).reduce((cur, acc) => Math.max(+cur, +acc), 0);
            resolve(String(+highestId + 1));
          };
          request.onerror = () => reject(request.error);
        });
        return;
      }
      return reject(error as any);
    }
    const store = transaction.objectStore('chats');
    const request = store.getAllKeys();

    request.onsuccess = () => {
      const highestId = (request.result as any[]).reduce((cur, acc) => Math.max(+cur, +acc), 0);
      resolve(String(+highestId + 1));
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getUrlId(db: IDBDatabase, id: string): Promise<string> {
  const idList = await getUrlIds(db);

  if (!idList.includes(id)) {
    return id;
  } else {
    let i = 2;

    while (idList.includes(`${id}-${i}`)) {
      i++;
    }

    return `${id}-${i}`;
  }
}

async function getUrlIds(db: IDBDatabase): Promise<string[]> {
  const usableDb = await ensureOpen(db);
  if (!usableDb) return [];
  return new Promise((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = usableDb.transaction('chats', 'readonly');
    } catch (error) {
      if (isClosingOrInvalidStateError(error)) {
        openDatabase().then((fresh) => {
          if (!fresh) return resolve([]);
          const tx = fresh.transaction('chats', 'readonly');
          const store = tx.objectStore('chats');
          const idList: string[] = [];
          const request = store.openCursor();
          request.onsuccess = (event: Event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              idList.push(cursor.value.urlId);
              cursor.continue();
            } else {
              resolve(idList);
            }
          };
          request.onerror = () => { reject(request.error); };
        });
        return;
      }
      return reject(error as any);
    }
    const store = transaction.objectStore('chats');
    const idList: string[] = [];

    const request = store.openCursor();

    request.onsuccess = (event: Event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor) {
        idList.push(cursor.value.urlId);
        cursor.continue();
      } else {
        resolve(idList);
      }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function forkChat(db: IDBDatabase, chatId: string, messageId: string): Promise<string> {
  const chat = await getMessages(db, chatId);

  if (!chat) {
    throw new Error('Chat not found');
  }

  // Find the index of the message to fork at
  const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);

  if (messageIndex === -1) {
    throw new Error('Message not found');
  }

  // Get messages up to and including the selected message
  const messages = chat.messages.slice(0, messageIndex + 1);

  return createChatFromMessages(db, chat.description ? `${chat.description} (fork)` : 'Forked chat', messages);
}

export async function duplicateChat(db: IDBDatabase, id: string): Promise<string> {
  const chat = await getMessages(db, id);

  if (!chat) {
    throw new Error('Chat not found');
  }

  return createChatFromMessages(db, `${chat.description || 'Chat'} (copy)`, chat.messages);
}

export async function createChatFromMessages(
  db: IDBDatabase,
  description: string,
  messages: Message[],
  metadata?: IChatMetadata,
): Promise<string> {
  const newId = await getNextId(db);
  const newUrlId = await getUrlId(db, newId); // Get a new urlId for the duplicated chat

  await setMessages(
    db,
    newId,
    messages,
    newUrlId, // Use the new urlId
    description,
    undefined, // Use the current timestamp
    metadata,
  );

  return newUrlId; // Return the urlId instead of id for navigation
}

export async function updateChatDescription(db: IDBDatabase, id: string, description: string): Promise<void> {
  const chat = await getMessages(db, id);

  if (!chat) {
    throw new Error('Chat not found');
  }

  if (!description.trim()) {
    throw new Error('Description cannot be empty');
  }

  await setMessages(db, id, chat.messages, chat.urlId, description, chat.timestamp, chat.metadata);
}

export async function updateChatMetadata(
  db: IDBDatabase,
  id: string,
  metadata: IChatMetadata | undefined,
): Promise<void> {
  const chat = await getMessages(db, id);

  if (!chat) {
    throw new Error('Chat not found');
  }

  await setMessages(db, id, chat.messages, chat.urlId, chat.description, chat.timestamp, metadata);
}

export async function getSnapshot(db: IDBDatabase, chatId: string): Promise<Snapshot | undefined> {
  const usableDb = await ensureOpen(db);
  if (!usableDb) return undefined;
  return new Promise((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = usableDb.transaction('snapshots', 'readonly');
    } catch (error) {
      if (isClosingOrInvalidStateError(error)) {
        openDatabase().then((fresh) => {
          if (!fresh) return resolve(undefined);
          const tx = fresh.transaction('snapshots', 'readonly');
          const store = tx.objectStore('snapshots');
          const request = store.get(chatId);
          request.onsuccess = () => resolve(request.result?.snapshot as Snapshot | undefined);
          request.onerror = () => reject(request.error);
        });
        return;
      }
      return reject(error as any);
    }
    const store = transaction.objectStore('snapshots');
    const request = store.get(chatId);

    request.onsuccess = () => resolve(request.result?.snapshot as Snapshot | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function setSnapshot(db: IDBDatabase, chatId: string, snapshot: Snapshot): Promise<void> {
  const usableDb = await ensureOpen(db);
  if (!usableDb) return;
  return new Promise((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = usableDb.transaction('snapshots', 'readwrite');
    } catch (error) {
      if (isClosingOrInvalidStateError(error)) {
        openDatabase().then((fresh) => {
          if (!fresh) return resolve();
          const tx = fresh.transaction('snapshots', 'readwrite');
          const store = tx.objectStore('snapshots');
          const request = store.put({ chatId, snapshot });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        return;
      }
      return reject(error as any);
    }
    const store = transaction.objectStore('snapshots');
    const request = store.put({ chatId, snapshot });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSnapshot(db: IDBDatabase, chatId: string): Promise<void> {
  const usableDb = await ensureOpen(db);
  if (!usableDb) return;
  return new Promise((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = usableDb.transaction('snapshots', 'readwrite');
    } catch (error) {
      if (isClosingOrInvalidStateError(error)) {
        openDatabase().then((fresh) => {
          if (!fresh) return resolve();
          const tx = fresh.transaction('snapshots', 'readwrite');
          const store = tx.objectStore('snapshots');
          const request = store.delete(chatId);
          request.onsuccess = () => resolve();
          request.onerror = (event) => {
            if ((event.target as IDBRequest).error?.name === 'NotFoundError') { resolve(); }
            else { reject(request.error); }
          };
        });
        return;
      }
      return reject(error as any);
    }
    const store = transaction.objectStore('snapshots');
    const request = store.delete(chatId);

    request.onsuccess = () => resolve();

    request.onerror = (event) => {
      if ((event.target as IDBRequest).error?.name === 'NotFoundError') {
        resolve();
      } else {
        reject(request.error);
      }
    };
  });
}
