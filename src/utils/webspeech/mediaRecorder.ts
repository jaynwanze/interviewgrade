'use client';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export class MediaRecorderHandler {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private ffmpeg: FFmpeg;

  constructor() {
    this.ffmpeg = new FFmpeg();
    this.initializeFFmpeg();
  }

  private async initializeFFmpeg() {
    await this.ffmpeg.load({
      coreURL: await toBlobURL(
        'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
        'text/javascript',
      ),
      wasmURL: await toBlobURL(
        'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
        'application/wasm',
      ),
    });
  }

  async convertAudioFormat(
    audioBlob: Blob,
    setLoadingFFmpeg: (loading: boolean) => void,
  ) {
    setLoadingFFmpeg(true); // Set loading state
    if (!this.ffmpeg.loaded) {
      try {
        await this.ffmpeg.load({
          coreURL: await toBlobURL(
            'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
            'text/javascript',
          ),
          wasmURL: await toBlobURL(
            'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
            'application/wasm',
          ),
        });
      } catch (error) {
        console.error(
          'Error loading FFmpeg now using backup audio converter:',
          error,
        );
        setLoadingFFmpeg(false); // Reset loading state
        return null;
      }
    }
    try {
      // Write the audio blob to the virtual file system
      await this.ffmpeg.writeFile('audio.webm', await fetchFile(audioBlob));

      // Convert the audio file to WAV format
      await this.ffmpeg.exec(['-i', 'audio.webm', 'audio.wav']);

      // Read the converted file from the virtual file system
      const data = await this.ffmpeg.readFile('audio.wav');

      // Create a new Blob for the WAV file
      const wavBlob = new Blob([data], { type: 'audio/wav' });
      return wavBlob; // Return the converted audio blob
    } catch (error) {
      console.error('Error converting audio format:', error);
    } finally {
      this.ffmpeg.terminate(); // Clean up and terminate the ffmpeg instance
      setLoadingFFmpeg(false); // Reset loading state
    }
  }

  start(stream: MediaStream) {
    this.mediaRecorder = new MediaRecorder(stream);

    this.mediaRecorder.ondataavailable = (event) => {
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.start();
    console.log('MediaRecorder started');
  }

  async stop(
    setLoadingFFmpeg: (loading: boolean) => void,
  ): Promise<Blob | undefined> {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      return new Promise<Blob | undefined>((resolve) => {
        this.mediaRecorder!.onstop = async () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          this.audioChunks = []; // Reset for the next recording
          console.log('MediaRecorder stopped, processing audio blob');

          const convertedAudioBlob = await this.convertAudioFormat(
            audioBlob,
            setLoadingFFmpeg,
          );
          if (convertedAudioBlob) {
            resolve(convertedAudioBlob); // Return the converted audio blob
          } else {
            console.error('Converted audio blob is undefined');
            resolve(undefined);
          }
        };
        this.mediaRecorder!.stop();
      });
    }
    return undefined;
  }

  isRecording(): boolean {
    return this.mediaRecorder
      ? this.mediaRecorder.state === 'recording'
      : false;
  }
}
