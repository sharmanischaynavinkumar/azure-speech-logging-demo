import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export const initializeSpeechService = async (config) => {
  try {
    const speechConfig = sdk.SpeechConfig.fromSubscription(config.subscriptionKey, config.region);
    speechConfig.speechRecognitionLanguage = config.language;

    // For now, let's use the default microphone input but ensure we're using the same microphone
    // The Azure Speech SDK and MediaRecorder will both access the same physical microphone
    // This ensures they get the same audio, just processed differently
    console.log('Using default microphone input for speech recognition (same source as recording)');
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    console.log('Speech service initialized successfully');
    return recognizer;
  } catch (error) {
    console.error('Failed to initialize speech service:', error);
    throw new Error('Failed to initialize Azure Speech Service. Please check your credentials.');
  }
};

export const startTranscription = async (recognizer, mode, callbacks) => {
  return new Promise((resolve, reject) => {
    const { onRecognizing, onRecognized, onError, onSessionStopped } = callbacks;

    recognizer.recognizing = (s, e) => {
      if (onRecognizing && e.result.text) {
        onRecognizing(e.result.text);
      }
    };

    recognizer.recognized = (s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        if (onRecognized && e.result.text) {
          onRecognized(e.result.text);
        }
      } else if (e.result.reason === sdk.ResultReason.NoMatch) {
        console.log('No speech could be recognized.');
      }
    };

    recognizer.canceled = (s, e) => {
      console.log(`Recognition canceled: ${e.reason}`);
      if (e.reason === sdk.CancellationReason.Error) {
        const errorMessage = `Recognition error: ${e.errorDetails}`;
        console.error(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
        reject(new Error(errorMessage));
      }
    };

    recognizer.sessionStopped = (s, e) => {
      console.log('Session stopped.');
      if (onSessionStopped) {
        onSessionStopped();
      }
    };

    try {
      if (mode === 'continuous') {
        recognizer.startContinuousRecognitionAsync(
          () => {
            console.log('Continuous recognition started');
            resolve();
          },
          (err) => {
            console.error('Failed to start continuous recognition:', err);
            if (onError) {
              onError(err);
            }
            reject(new Error(err));
          }
        );
      } else {
        recognizer.recognizeOnceAsync(
          (result) => {
            if (result.reason === sdk.ResultReason.RecognizedSpeech) {
              if (onRecognized) {
                onRecognized(result.text);
              }
            } else if (result.reason === sdk.ResultReason.NoMatch) {
              console.log('No speech could be recognized.');
            }
            resolve();
          },
          (err) => {
            console.error('Recognition failed:', err);
            if (onError) {
              onError(err);
            }
            reject(new Error(err));
          }
        );
      }
    } catch (error) {
      console.error('Failed to start transcription:', error);
      if (onError) {
        onError(error.message);
      }
      reject(error);
    }
  });
};

export const stopTranscription = async (recognizer) => {
  return new Promise((resolve, reject) => {
    if (recognizer) {
      recognizer.stopContinuousRecognitionAsync(
        () => {
          console.log('Transcription stopped successfully');
          resolve();
        },
        (err) => {
          console.error('Failed to stop transcription:', err);
          reject(new Error(err));
        }
      );
    } else {
      resolve();
    }
  });
};
