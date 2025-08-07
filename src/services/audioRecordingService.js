import audioConversionService from './audioConversionService.js';

class AudioRecordingService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.segmentTimer = null;
    this.segmentIndex = 0;
    this.onSegmentComplete = null;
    this.isRecording = false;
    this.mode = 'oneTime';
  }

  async initialize() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Initialize audio conversion service
      await audioConversionService.initialize();
      
      console.log('Audio recording service initialized');
    } catch (error) {
      console.error('Failed to initialize audio recording:', error);
      throw new Error('Failed to access microphone. Please grant microphone permissions.');
    }
  }

  startRecording(mode, onSegmentComplete) {
    if (!this.stream) {
      throw new Error('Audio recording service not initialized');
    }

    this.mode = mode;
    this.onSegmentComplete = onSegmentComplete;
    this.segmentIndex = 0;
    this.audioChunks = [];

    console.log(`Starting audio recording in ${mode} mode`);

    // Try to use WAV format first, fall back to WebM if needed
    let mimeType = 'audio/wav';
    if (!MediaRecorder.isTypeSupported('audio/wav')) {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=pcm')) {
        mimeType = 'audio/webm;codecs=pcm';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else {
        mimeType = ''; // Let browser choose
      }
    }

    console.log(`Using MIME type: ${mimeType || 'browser default'}`);

    // Use MediaRecorder for reliable audio capture
    const options = mimeType ? { mimeType } : {};
    this.mediaRecorder = new MediaRecorder(this.stream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      if (this.audioChunks.length > 0) {
        this.processAudioSegment();
      }
    };

    // Start recording with timeslices for regular data chunks
    this.mediaRecorder.start(1000); // Get data every 1 second
    this.isRecording = true;

    // For continuous mode, create segments every 10 seconds
    if (mode === 'continuous') {
      this.startSegmentTimer();
    }
  }

  startSegmentTimer() {
    this.segmentTimer = setInterval(() => {
      if (this.isRecording && this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.createSegment();
      }
    }, 10000); // 10 seconds for more frequent segments
  }

  createSegment() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      // Stop current recording to trigger data processing
      this.mediaRecorder.stop();
      
      // Start a new recording after a brief delay
      setTimeout(() => {
        if (this.isRecording) {
          this.mediaRecorder = new MediaRecorder(this.stream, {
            mimeType: 'audio/webm;codecs=opus'
          });

          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              this.audioChunks.push(event.data);
            }
          };

          this.mediaRecorder.onstop = () => {
            if (this.audioChunks.length > 0) {
              this.processAudioSegment();
            }
          };

          this.mediaRecorder.start(1000);
        }
      }, 100);
    }
  }

  async processAudioSegment() {
    if (this.audioChunks.length === 0) {
      console.log('No audio chunks to process');
      return;
    }

    console.log(`Processing audio segment ${this.segmentIndex} with ${this.audioChunks.length} chunks`);
    
    try {
      // Create blob from collected chunks - use the actual recorded type
      const recordedBlob = new Blob(this.audioChunks, { 
        type: this.mediaRecorder.mimeType || 'audio/webm' 
      });
      
      if (recordedBlob.size === 0) {
        console.warn('Recorded blob has zero size!');
        return;
      }

      console.log(`Recorded blob type: ${recordedBlob.type}, size: ${recordedBlob.size} bytes`);
      
      let finalBlob;
      
      // If we already have WAV, use it directly
      if (recordedBlob.type.includes('audio/wav')) {
        console.log('Using WAV blob directly');
        finalBlob = recordedBlob;
      } else {
        // Try to convert to WAV
        try {
          finalBlob = await audioConversionService.convertWebMToWav(recordedBlob);
          console.log(`Audio converted to WAV: ${finalBlob.size} bytes`);
        } catch (conversionError) {
          console.warn('WAV conversion failed, using original blob:', conversionError.message);
          // Fall back to using the original blob
          finalBlob = recordedBlob;
        }
      }
      
      if (this.onSegmentComplete) {
        await this.onSegmentComplete(finalBlob, this.segmentIndex);
      }

      this.segmentIndex++;
      
      // Clear audio chunks for next segment
      this.audioChunks = [];

      // For one-time mode, stop after first segment
      if (this.mode === 'oneTime') {
        this.stopRecording();
      }
    } catch (error) {
      console.error('Error processing audio segment:', error);
    }
  }

  stopRecording() {
    this.isRecording = false;

    if (this.segmentTimer) {
      clearInterval(this.segmentTimer);
      this.segmentTimer = null;
    }

    // Stop MediaRecorder if it's still recording
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    console.log('Recording stopped');
  }

  cleanup() {
    this.stopRecording();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    // Clean up audio conversion service
    audioConversionService.cleanup();
    
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.onSegmentComplete = null;
    
    console.log('Audio recording service cleaned up');
  }
}

const audioRecordingService = new AudioRecordingService();
export default audioRecordingService;
