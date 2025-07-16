import { beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadBackupFile, downloadFile } from '@/utils/fileDownloader.ts';

// DOM API mocks
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();
const mockCreateElement = vi.fn();

describe('fileDownloader', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock DOM APIs
    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    vi.stubGlobal(
      'Blob',
      vi.fn().mockImplementation((content, options) => ({
        content,
        options,
      }))
    );

    const mockAElement = {
      href: '',
      download: '',
      click: mockClick,
    };

    mockCreateElement.mockReturnValue(mockAElement);
    vi.stubGlobal('document', {
      createElement: mockCreateElement,
    });

    mockCreateObjectURL.mockReturnValue('mock-object-url');
  });

  describe('downloadBackupFile', () => {
    it('should create blob with correct content and type', () => {
      const backupData = '{"test": "data"}';

      downloadBackupFile(backupData);

      expect(global.Blob).toHaveBeenCalledWith([backupData], {
        type: 'application/json',
      });
    });

    it('should create download link with correct filename', () => {
      const backupData = '{"test": "data"}';
      const mockDate = new Date('2023-01-01T00:00:00Z');
      vi.setSystemTime(mockDate);

      downloadBackupFile(backupData);

      expect(mockCreateElement).toHaveBeenCalledWith('a');

      const mockAElement = mockCreateElement.mock.results[0].value;
      expect(mockAElement.href).toBe('mock-object-url');
      expect(mockAElement.download).toBe('bookmark-backup-2023-01-01.json');
    });

    it('should trigger download and cleanup', () => {
      const backupData = '{"test": "data"}';

      downloadBackupFile(backupData);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-object-url');
    });
  });

  describe('downloadFile', () => {
    it('should create blob with custom content and type', () => {
      const content = 'test content';
      const fileName = 'test.txt';
      const mimeType = 'text/plain';

      downloadFile(content, fileName, mimeType);

      expect(global.Blob).toHaveBeenCalledWith([content], { type: mimeType });
    });

    it('should use default mime type when not provided', () => {
      const content = 'test content';
      const fileName = 'test.txt';

      downloadFile(content, fileName);

      expect(global.Blob).toHaveBeenCalledWith([content], {
        type: 'text/plain',
      });
    });

    it('should create download link with custom filename', () => {
      const content = 'test content';
      const fileName = 'custom-file.txt';

      downloadFile(content, fileName);

      expect(mockCreateElement).toHaveBeenCalledWith('a');

      const mockAElement = mockCreateElement.mock.results[0].value;
      expect(mockAElement.href).toBe('mock-object-url');
      expect(mockAElement.download).toBe(fileName);
    });

    it('should trigger download and cleanup', () => {
      const content = 'test content';
      const fileName = 'test.txt';

      downloadFile(content, fileName);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-object-url');
    });
  });
});
