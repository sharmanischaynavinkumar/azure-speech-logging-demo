import { BlobServiceClient } from '@azure/storage-blob';

// Azure Storage service using SAS token
class StorageService {
  constructor() {
    this.blobServiceClient = null;
    this.containerClient = null;
    this.containerName = null;
    this.isInitialized = false;
  }

  async initialize(sasUrl, containerName = 'speech-logs') {
    try {
      this.containerName = containerName;
      
      if (!sasUrl) {
        throw new Error('Azure Storage SAS URL is required');
      }
      
      // Parse SAS URL to extract account name, container name, and SAS token
      const urlObj = new URL(sasUrl);
      const hostname = urlObj.hostname;
      const pathSegments = urlObj.pathname.split('/').filter(segment => segment);
      
      // Extract account name from hostname (format: accountname.blob.core.windows.net)
      const accountName = hostname.split('.')[0];
      
      // Extract container name from path (first segment after domain)
      const containerNameFromUrl = pathSegments[0] || containerName;
      
      // Extract just the SAS token (query parameters) from the complete URL
      const sasToken = urlObj.search.startsWith('?') ? urlObj.search.substring(1) : urlObj.search;
      
      // Create BlobServiceClient from account and SAS token
      this.blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net?${sasToken}`
      );
      
      // Get container client
      this.containerClient = this.blobServiceClient.getContainerClient(containerNameFromUrl);
      
      this.isInitialized = true;
      console.log(`Storage service initialized for container: ${containerNameFromUrl}`);
    } catch (error) {
      console.error('Failed to initialize storage service:', error);
      throw error;
    }
  }

  async uploadAudioSegment(audioBlob, sessionId, segmentIndex) {
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    // Since we always convert to WAV format in the audio recording service, use .wav extension
    const fileExtension = 'wav';
    const fileName = `${sessionId}/audio/segment-${segmentIndex.toString().padStart(3, '0')}-${timestamp}.${fileExtension}`;
    
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      
      await blockBlobClient.uploadData(audioBlob, {
        blobHTTPHeaders: {
          blobContentType: audioBlob.type
        }
      });
      
      console.log(`Audio uploaded: ${fileName} (${audioBlob.size} bytes)`);
      return fileName;
    } catch (error) {
      console.error('Failed to upload audio segment:', error);
      throw error;
    }
  }

  async uploadTranscriptSegment(transcriptText, sessionId, segmentIndex, audioFileName) {
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${sessionId}/transcripts/segment-${segmentIndex.toString().padStart(3, '0')}-${timestamp}.json`;
    
    const transcriptData = {
      timestamp: new Date().toISOString(),
      segmentIndex,
      transcriptText,
      audioFileName,
      sessionId
    };

    const transcriptJson = JSON.stringify(transcriptData, null, 2);
    
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      
      await blockBlobClient.upload(transcriptJson, transcriptJson.length, {
        blobHTTPHeaders: {
          blobContentType: 'application/json'
        }
      });
      
      console.log(`Transcript uploaded: ${fileName}`);
      return fileName;
    } catch (error) {
      console.error('Failed to upload transcript segment:', error);
      throw error;
    }
  }

  async uploadSessionSummary(sessionData) {
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }

    const fileName = `${sessionData.sessionId}/session-summary.json`;
    const summaryJson = JSON.stringify(sessionData, null, 2);
    
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      
      await blockBlobClient.upload(summaryJson, summaryJson.length, {
        blobHTTPHeaders: {
          blobContentType: 'application/json'
        }
      });
      
      console.log(`Session summary uploaded: ${fileName}`);
      return fileName;
    } catch (error) {
      console.error('Failed to upload session summary:', error);
      throw error;
    }
  }
}

const storageService = new StorageService();
export default storageService;
