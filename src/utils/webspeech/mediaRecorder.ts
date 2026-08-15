'use client';

const preferredAudioMimeTypes = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

function getPreferredAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return preferredAudioMimeTypes.find((mimeType) =>
    MediaRecorder.isTypeSupported(mimeType),
  );
}

export class MediaRecorderHandler {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  start(stream: MediaStream) {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error('No microphone audio track is available.');
    }

    // Record audio only. The previous implementation recorded the camera stream,
    // loaded FFmpeg from a third-party CDN, converted it to WAV, then uploaded it
    // under an MP3 filename. OpenAI accepts WebM/MP4/OGG directly, so keep the
    // browser-native audio container and remove that fragile conversion step.
    const audioOnlyStream = new MediaStream(audioTracks);
    const mimeType = getPreferredAudioMimeType();
    this.mediaRecorder = mimeType
      ? new MediaRecorder(audioOnlyStream, { mimeType })
      : new MediaRecorder(audioOnlyStream);
    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
    console.log('MediaRecorder started', this.mediaRecorder.mimeType);
  }

  async stop(): Promise<Blob | undefined> {
    const recorder = this.mediaRecorder;
    if (!recorder || recorder.state !== 'recording') {
      return undefined;
    }

    return new Promise<Blob | undefined>((resolve) => {
      recorder.onstop = () => {
        const chunkMimeType = this.audioChunks.find((chunk) => chunk.type)?.type;
        const mimeType = recorder.mimeType || chunkMimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });

        this.audioChunks = [];
        this.mediaRecorder = null;

        if (audioBlob.size === 0) {
          console.error('MediaRecorder produced an empty audio blob');
          resolve(undefined);
          return;
        }

        console.log('MediaRecorder stopped', {
          mimeType: audioBlob.type,
          size: audioBlob.size,
        });
        resolve(audioBlob);
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.audioChunks = [];
        this.mediaRecorder = null;
        resolve(undefined);
      };

      recorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
