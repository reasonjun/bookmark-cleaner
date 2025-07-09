import { vi } from 'vitest';

// Mock 북마크 데이터
export const mockBookmarkTree = [
  {
    id: '0',
    title: 'Root',
    children: [
      {
        id: '1',
        title: 'Bookmarks Bar',
        parentId: '0',
        children: [
          {
            id: '2',
            title: 'Google',
            parentId: '1',
            url: 'https://google.com',
            dateAdded: 1640000000000,
          },
          {
            id: '3',
            title: 'GitHub',
            parentId: '1',
            url: 'https://github.com',
            dateAdded: 1640000001000,
          },
          {
            id: '4',
            title: 'Google',
            parentId: '1',
            url: 'https://google.com',
            dateAdded: 1640000002000,
          },
          {
            id: '5',
            title: 'Empty Folder',
            parentId: '1',
            children: [],
          },
        ],
      },
      {
        id: '6',
        title: 'Other Bookmarks',
        parentId: '0',
        children: [
          {
            id: '7',
            title: 'Error Page',
            parentId: '6',
            url: 'https://nonexistent-site.com',
            dateAdded: 1640000003000,
          },
          {
            id: '8',
            title: 'Another Empty Folder',
            parentId: '6',
            children: [],
          },
        ],
      },
    ],
  },
];

// Chrome API Mock
export const mockChrome = {
  bookmarks: {
    getTree: vi.fn().mockResolvedValue(mockBookmarkTree),
    remove: vi.fn().mockResolvedValue(undefined),
    removeTree: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockImplementation(details =>
      Promise.resolve({
        id: Math.random().toString(),
        title: details.title,
        url: details.url,
        parentId: details.parentId,
      })
    ),
  },
  tabs: {
    create: vi.fn().mockImplementation((options, callback) => {
      const tab = { id: Math.floor(Math.random() * 1000), url: options.url };
      callback?.(tab);
      return Promise.resolve(tab);
    }),
    remove: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockImplementation((tabId, callback) => {
      const tab = {
        id: tabId,
        url: 'https://example.com',
        status: 'complete',
      };
      callback?.(tab);
      return Promise.resolve(tab);
    }),
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    id: 'test-extension-id',
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
  },
  action: {
    onClicked: {
      addListener: vi.fn(),
    },
  },
};

// 글로벌 chrome 객체 설정
export function setupChromeMock() {
  global.chrome = mockChrome as typeof chrome;
}

export function resetChromeMock() {
  vi.clearAllMocks();
}
