const {
  transcribeAudio,
  extractSubtitles,
  parseVTT,
  detectLanguage,
  getEstimatedCost,
  TRANSCRIPTION_ERROR_CODES
} = require('../services/transcriptionService');

// Mock child_process.spawn
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));
const { spawn } = require('child_process');

// Mock fs
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => ''),
  readdirSync: jest.fn(() => []),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
}));
const fs = require('fs');

// Mock cacheService
jest.mock('../services/cacheService', () => ({
  getCachedTranscription: jest.fn(() => null),
  setCachedTranscription: jest.fn(),
  generateAudioHash: jest.fn((path) => `hash-${path}`),
  generateUrlHash: jest.fn((url, lang) => `hash-${url}-${lang}`),
}));

// Mock costTracker
jest.mock('../services/costTracker', () => ({
  trackCost: jest.fn(),
}));

describe('transcriptionService', () => {
  let mockProcess;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ advanceTimers: true });

    // Default mock process
    mockProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
    };
    spawn.mockReturnValue(mockProcess);
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('parseVTT', () => {
    test('parses standard VTT content', () => {
      const vtt = `WEBVTT
Kind: captions
Language: en

00:00:01.000 --> 00:00:04.000
Welcome to today's recipe

00:00:04.000 --> 00:00:07.000
We're making chocolate chip cookies

00:00:07.000 --> 00:00:10.000
You'll need two cups of flour`;

      const result = parseVTT(vtt);
      expect(result).toContain("Welcome to today's recipe");
      expect(result).toContain('chocolate chip cookies');
      expect(result).toContain('two cups of flour');
      expect(result).not.toContain('WEBVTT');
      expect(result).not.toContain('-->');
    });

    test('deduplicates repeated lines from auto-generated captions', () => {
      const vtt = `WEBVTT

00:00:01.000 --> 00:00:03.000
Hello everyone

00:00:02.000 --> 00:00:04.000
Hello everyone

00:00:03.000 --> 00:00:06.000
Today we're cooking pasta`;

      const result = parseVTT(vtt);
      const lines = result.split('\n').filter(l => l.trim());
      const helloCount = lines.filter(l => l === 'Hello everyone').length;
      expect(helloCount).toBe(1);
    });

    test('strips VTT formatting tags', () => {
      const vtt = `WEBVTT

00:00:01.000 --> 00:00:04.000
<c>Add the <b>flour</b> and sugar</c>`;

      const result = parseVTT(vtt);
      expect(result).toBe('Add the flour and sugar');
    });

    test('handles empty input', () => {
      expect(parseVTT('')).toBe('');
      expect(parseVTT(null)).toBe('');
      expect(parseVTT(undefined)).toBe('');
    });

    test('handles VTT with numeric cue identifiers', () => {
      const vtt = `WEBVTT

1
00:00:01.000 --> 00:00:04.000
First line

2
00:00:04.000 --> 00:00:07.000
Second line`;

      const result = parseVTT(vtt);
      expect(result).toContain('First line');
      expect(result).toContain('Second line');
    });

    test('handles HTML entities', () => {
      const vtt = `WEBVTT

00:00:01.000 --> 00:00:04.000
Salt &amp; pepper`;

      const result = parseVTT(vtt);
      expect(result).toBe('Salt & pepper');
    });

    test('skips NOTE blocks', () => {
      const vtt = `WEBVTT

NOTE This is a comment

00:00:01.000 --> 00:00:04.000
Actual content`;

      const result = parseVTT(vtt);
      expect(result).toBe('Actual content');
      expect(result).not.toContain('NOTE');
    });
  });

  describe('extractSubtitles', () => {
    test('extracts subtitles successfully', async () => {
      const vttContent = `WEBVTT

00:00:01.000 --> 00:00:04.000
Mix the flour and butter`;

      // Mock spawn to simulate successful yt-dlp execution
      spawn.mockImplementation(() => {
        const proc = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
        };

        // Simulate process close with VTT file created
        setTimeout(() => {
          const closeHandler = proc.on.mock.calls.find(c => c[0] === 'close')[1];
          closeHandler(0);
        }, 10);

        return proc;
      });

      // Mock file discovery
      fs.readdirSync.mockReturnValue(['test-id.en.vtt']);
      fs.readFileSync.mockReturnValue(vttContent);

      jest.useRealTimers();
      const result = await extractSubtitles('https://www.youtube.com/watch?v=test', 'en');

      expect(result.text).toContain('Mix the flour and butter');
      expect(result.language).toBe('en');
    });

    test('handles yt-dlp not installed', async () => {
      spawn.mockImplementation(() => {
        const proc = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
        };

        setTimeout(() => {
          const errorHandler = proc.on.mock.calls.find(c => c[0] === 'error')[1];
          errorHandler({ code: 'ENOENT' });
        }, 10);

        return proc;
      });

      jest.useRealTimers();
      await expect(
        extractSubtitles('https://www.youtube.com/watch?v=test', 'en')
      ).rejects.toEqual(
        expect.objectContaining({
          code: TRANSCRIPTION_ERROR_CODES.YT_DLP_NOT_FOUND
        })
      );
    });

    test('handles no subtitles available', async () => {
      // existsSync: true for temp dir, false for VTT files
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath.endsWith('.vtt')) return false;
        return true; // temp dir exists
      });
      fs.readdirSync.mockReturnValue([]); // No VTT files in dir scan

      spawn.mockImplementation(() => {
        const proc = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
        };

        setTimeout(() => {
          const closeHandler = proc.on.mock.calls.find(c => c[0] === 'close')[1];
          closeHandler(0);
        }, 10);

        return proc;
      });

      jest.useRealTimers();
      await expect(
        extractSubtitles('https://www.youtube.com/watch?v=nosubs', 'en')
      ).rejects.toEqual(
        expect.objectContaining({
          code: TRANSCRIPTION_ERROR_CODES.SUBTITLES_NOT_AVAILABLE
        })
      );
    });
  });

  describe('transcribeAudio (main entry point)', () => {
    test('returns cached result when available', async () => {
      const { getCachedTranscription } = require('../services/cacheService');
      getCachedTranscription.mockResolvedValueOnce({
        text: 'Cached transcript',
        language: 'en',
        cost: 0,
        confidence: 0.92,
        timestamp: '2026-01-01T00:00:00.000Z'
      });

      jest.useRealTimers();
      const result = await transcribeAudio(
        'https://www.youtube.com/watch?v=cached',
        'cache-key',
        'en',
        5
      );

      expect(result.text).toBe('Cached transcript');
      expect(result.cached).toBe(true);
    });

    test('getEstimatedCost returns 0 (free with yt-dlp)', () => {
      expect(getEstimatedCost(5)).toBeCloseTo(0, 4);
      expect(getEstimatedCost(60)).toBeCloseTo(0, 4);
    });
  });

  describe('confidence calculation', () => {
    test('returns high confidence for normal text', async () => {
      const { getCachedTranscription } = require('../services/cacheService');
      getCachedTranscription.mockResolvedValueOnce(null);

      // Mock successful subtitle extraction
      spawn.mockImplementation(() => {
        const proc = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
        };
        setTimeout(() => {
          const closeHandler = proc.on.mock.calls.find(c => c[0] === 'close')[1];
          closeHandler(0);
        }, 10);
        return proc;
      });

      const longText = `WEBVTT

00:00:01.000 --> 00:00:04.000
This is a detailed recipe transcript with plenty of content for confidence scoring`;

      fs.readdirSync.mockReturnValue(['test.en.vtt']);
      fs.readFileSync.mockReturnValue(longText);

      jest.useRealTimers();
      const result = await transcribeAudio(
        'https://www.youtube.com/watch?v=conf',
        'conf-key',
        'en',
        5
      );

      expect(result.confidence).toBeGreaterThanOrEqual(0.82);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });
  });

  describe('error codes', () => {
    test('exports all expected error codes', () => {
      expect(TRANSCRIPTION_ERROR_CODES.INVALID_URL).toBe('INVALID_URL');
      expect(TRANSCRIPTION_ERROR_CODES.SUBTITLES_NOT_AVAILABLE).toBe('SUBTITLES_NOT_AVAILABLE');
      expect(TRANSCRIPTION_ERROR_CODES.TRANSCRIPTION_FAILED).toBe('TRANSCRIPTION_FAILED');
      expect(TRANSCRIPTION_ERROR_CODES.TIMEOUT).toBe('TIMEOUT');
      expect(TRANSCRIPTION_ERROR_CODES.PROCESS_ERROR).toBe('PROCESS_ERROR');
      expect(TRANSCRIPTION_ERROR_CODES.YT_DLP_NOT_FOUND).toBe('YT_DLP_NOT_FOUND');
    });
  });
});
