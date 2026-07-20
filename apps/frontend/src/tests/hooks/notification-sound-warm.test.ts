import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { warmAudioContext } from '@/hooks/useNotificationSound';

describe('warmAudioContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('defers AudioContext construction off the calling stack', () => {
    const resume = vi.fn().mockResolvedValue(undefined);
    const AudioContextMock = vi.fn(function AudioContextMock(this: {
      state: string;
      resume: typeof resume;
    }) {
      this.state = 'running';
      this.resume = resume;
    });

    vi.stubGlobal('AudioContext', AudioContextMock);

    warmAudioContext();
    expect(AudioContextMock).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(AudioContextMock).toHaveBeenCalledTimes(1);
  });
});
