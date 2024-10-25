'use client';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export class MediaRecorderHandler {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private onStopCallback: (audioBlob: Blob) => void;
  private ffmpeg: FFmpeg;

  constructor(onStopCallback: (audioBlob: Blob) => void) {
    this.onStopCallback = onStopCallback;
    this.ffmpeg = new FFmpeg();
  }

  async convertAudioFormat(
    audioBlob: Blob,
    setLoadingFFmpeg: (loading: boolean) => void,
  ) {
    setLoadingFFmpeg(true); // Set loading state
    if (!this.ffmpeg.loaded) {
      await this.ffmpeg.load(); // Load FFmpeg if not already loaded
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

    this.mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioChunks = []; // Reset for the next recording
      const convertedAudioBlob = await this.convertAudioFormat(
        audioBlob,
        () => {},
      ); // Convert audio before transcribing
      if (convertedAudioBlob) {
        this.onStopCallback(convertedAudioBlob); // Call the callback with the audio blob
      } else {
        console.error('Converted audio blob is undefined');
      }
    };

    this.mediaRecorder.start();
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  isRecording() {
    return this.mediaRecorder && this.mediaRecorder.state === 'recording';
  }
}
