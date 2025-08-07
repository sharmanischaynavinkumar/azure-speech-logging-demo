# Azure Speech Service Transcription Logging Demo

A React application that integrates with Azure Speech Service for real-time transcription and Azure Storage for saving audio segments and transcripts.

## Features

- **Azure Speech Service Integration**: Connect using your subscription key and region
- **Real-time Transcription**: Support for both one-time and continuous transcription modes
- **Audio Segmentation**: Automatically segments continuous audio into manageable chunks (10-second intervals)
- **Azure Storage Integration**: Saves audio files (.wav) and transcripts (.json) to Azure Blob Storage
- **WebM to WAV Conversion**: Automatically converts recorded WebM audio to WAV format before uploading
- **Environment Variable Support**: Configure credentials via .env file with fallback to manual input
- **Session Management**: Organizes files by session with unique session IDs
- **Real-time Status Display**: Shows current recording status, session info, and segment count
- **Multi-language Support**: Supports multiple languages for transcription

## Prerequisites

- Node.js (v14 or higher)
- Azure Speech Service subscription
- Azure Storage account with Blob Storage
- Modern web browser with microphone access

## Setup

### Environment Configuration (Optional)

You can configure the application using environment variables to avoid entering your keys manually each time:

1. **Copy the example environment file**

   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file with your Azure credentials**

   ```bash
   # Azure Speech Service Configuration
   REACT_APP_AZURE_SPEECH_KEY=your_speech_service_key_here
   REACT_APP_AZURE_SPEECH_REGION=your_region_here

   # Azure Storage Configuration
   REACT_APP_AZURE_STORAGE_SAS_URL=your_storage_sas_url_here
   REACT_APP_AZURE_STORAGE_CONTAINER=speech-logs

   # Default Language
   REACT_APP_DEFAULT_LANGUAGE=en-US
   ```

3. **Restart the application** to load the environment variables

**Note**: If environment variables are not set, you can still manually enter the configuration in the web interface. Fields loaded from `.env` will show a green "(from .env)" indicator.

### Option 1: Using Dev Container (Recommended)

The easiest way to get started is using the provided dev container with custom Dockerfile:

1. **Prerequisites**

   - [Docker](https://www.docker.com/products/docker-desktop)
   - [VS Code](https://code.visualstudio.com/)
   - [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. **Open in Dev Container**

   - Clone the repository
   - Open the project folder in VS Code
   - When prompted, click "Reopen in Container"
   - Wait for the container to build (npm dependencies are installed during build process)

3. **Start the application**
   ```bash
   npm start
   ```

**Features of the dev container:**

- Custom Dockerfile that pre-installs dependencies in `/workspaces/node_modules`
- `NODE_PATH` environment variable set for optimal module resolution
- All VS Code extensions and settings pre-configured
- Faster startup since dependencies are built into the container image

### Option 2: Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd azure-speech-logging-demo
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Configuration

### Azure Speech Service

- **Subscription Key**: Your Azure Speech Service subscription key
- **Region**: The Azure region where your Speech Service is deployed (e.g., `eastus`, `westus2`)
- **Language**: Select the language for transcription (default: English US)

### Azure Storage

- **SAS URL**: A complete SAS URL for your Azure Storage container with read, write, and create permissions
- **Container Name**: The container where files will be stored (default: 'speech-logs')

## Usage

### Audio Recording and Conversion

The application uses the browser's MediaRecorder API to capture audio in WebM format, then automatically converts it to WAV format using the Web Audio API before uploading to Azure Storage. This ensures compatibility and consistent audio format across all saved files.

### One-time Transcription

1. Configure Azure Speech Service settings
2. Select "One-time Transcription" mode
3. Click "Start One-time Transcription"
4. Speak into your microphone
5. View the transcription result

### Continuous Transcription

1. Configure both Azure Speech Service and Azure Storage settings
2. Select "Continuous Transcription" mode
3. Click "Start Continuous Transcription"
4. Speak continuously - the app will automatically segment audio every 10 seconds
5. Audio segments (converted to WAV) and transcripts are automatically saved to Azure Storage
6. Use "Stop Transcription" to end the session and save a session summary

## File Structure

```
src/
├── components/
│   ├── SpeechConfig.js           # Azure Speech Service configuration
│   ├── SpeechConfig.css          # Styles for SpeechConfig component
│   ├── LoggingStatus.js          # Display logging status and session info
│   ├── LoggingStatus.css         # Styles for LoggingStatus component
│   ├── TranscriptionControls.js  # Transcription mode and controls
│   ├── TranscriptionControls.css # Styles for TranscriptionControls component
│   ├── TranscriptionDisplay.js   # Display transcription results
│   └── TranscriptionDisplay.css  # Styles for TranscriptionDisplay component
├── services/
│   ├── speechService.js          # Azure Speech Service integration
│   ├── storageService.js         # Azure Storage integration
│   ├── audioRecordingService.js  # Audio recording and segmentation
│   └── audioConversionService.js # WebM to WAV audio conversion
├── App.js                        # Main application component
├── App.css                       # Main application styles
├── index.js                      # Application entry point
└── index.css                     # Global styles
```

## Storage Structure

Files are organized in Azure Blob Storage as follows:

```
container/
└── {session-id}/
    ├── audio/
    │   ├── segment-000-{timestamp}.wav
    │   ├── segment-001-{timestamp}.wav
    │   └── ...
    ├── transcripts/
    │   ├── segment-000-{timestamp}.json
    │   ├── segment-001-{timestamp}.json
    │   └── ...
    └── session-summary.json
```

Each transcript JSON file contains:

```json
{
  "timestamp": "2024-01-15T10:30:00.123Z",
  "segmentIndex": 0,
  "transcriptText": "Transcribed text content",
  "audioFileName": "session-id/audio/segment-000-timestamp.wav",
  "sessionId": "session-2024-01-15T10-30-00-123Z"
}
```

Session summary contains:

```json
{
  "sessionId": "session-2024-01-15T10-30-00-123Z",
  "mode": "continuous",
  "language": "en-US",
  "startTime": "2024-01-15T10:30:00.123Z",
  "segments": [...],
  "totalSegments": 5
}
```

## Technologies Used

- **React** with JavaScript (ES6+)
- **Azure Speech SDK** for speech recognition
- **Azure Storage Blob SDK** for file uploads
- **Web Audio API** for audio format conversion
- **MediaRecorder API** for audio recording

## Security Considerations

### Environment Variables

- **Never commit your `.env` file** to version control - it's already included in `.gitignore`
- Use environment variables only for development and testing
- For production deployments, use secure secret management solutions

### Azure Credentials

- **Speech Service Key**: Keep your subscription key secure and rotate it regularly
- **Storage SAS URL**: Use SAS URLs with minimal required permissions and set appropriate expiration times
- **Container Access**: Ensure your storage container has appropriate access policies

### Best Practices

- Use separate Azure resources for development, testing, and production
- Monitor your Azure resource usage and set up billing alerts
- Regularly review and rotate your access keys
- Consider using Azure Active Directory authentication for production scenarios

## Troubleshooting

### Microphone Access

- Ensure your browser has microphone permissions
- Check that no other applications are using the microphone
- Try refreshing the page if permissions were recently granted

### Azure Speech Service

- Verify your subscription key and region are correct
- Ensure your Speech Service resource is active
- Check network connectivity

### Azure Storage

- Verify your SAS URL has the required permissions (read, write, create)
- Ensure the container exists
- Check that the SAS URL hasn't expired

## License

This project is licensed under the MIT License - see the LICENSE file for details.
