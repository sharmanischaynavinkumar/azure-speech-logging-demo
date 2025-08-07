// Audio conversion service to convert WebM to WAV format
class AudioConversionService {
  constructor() {
    this.audioContext = null;
  }

  async initialize() {
    try {
      // Create AudioContext for audio processing
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('Audio conversion service initialized');
    } catch (error) {
      console.error('Failed to initialize audio conversion service:', error);
      throw new Error('Web Audio API not supported in this browser');
    }
  }

  async convertWebMToWav(webmBlob) {
    if (!this.audioContext) {
      throw new Error('Audio conversion service not initialized');
    }

    console.log(`Converting blob (${webmBlob.size} bytes, type: ${webmBlob.type}) to WAV...`);

    try {
      // Convert blob to ArrayBuffer
      const arrayBuffer = await webmBlob.arrayBuffer();
      console.log(`ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);
      
      // Check if the arrayBuffer contains valid audio data
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Empty audio data');
      }

      // Decode the audio data
      let audioBuffer;
      try {
        audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
      } catch (decodeError) {
        console.error('decodeAudioData failed:', decodeError);
        throw new Error(`Unable to decode audio data: ${decodeError.message}`);
      }
      
      console.log(`Decoded audio: ${audioBuffer.duration}s, ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels} channels`);

      // Convert AudioBuffer to WAV format
      const wavArrayBuffer = this.audioBufferToWav(audioBuffer);
      
      // Create WAV blob
      const wavBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
      console.log(`WAV conversion complete: ${wavBlob.size} bytes`);

      return wavBlob;
    } catch (error) {
      console.error('Failed to convert audio to WAV:', error);
      throw new Error(`Audio conversion failed: ${error.message}`);
    }
  }

  audioBufferToWav(audioBuffer) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const bytesPerSample = 2; // 16-bit PCM
    
    // Calculate buffer size
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * bytesPerSample);
    const view = new DataView(arrayBuffer);
    
    // Write WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, arrayBuffer.byteLength - 8, true); // File size - 8
    writeString(8, 'WAVE');

    // FMT sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Sub-chunk size (16 for PCM)
    view.setUint16(20, 1, true); // Audio format (1 for PCM)
    view.setUint16(22, numberOfChannels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true); // Byte rate
    view.setUint16(32, numberOfChannels * bytesPerSample, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample

    // Data sub-chunk
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * bytesPerSample, true); // Data chunk size

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        // Convert from [-1, 1] to 16-bit signed integer
        const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return arrayBuffer;
  }

  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    console.log('Audio conversion service cleaned up');
  }
}

const audioConversionService = new AudioConversionService();
export default audioConversionService;
