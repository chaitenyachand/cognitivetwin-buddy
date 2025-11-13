import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  ILocalAudioTrack,
  ICameraVideoTrack 
} from "agora-rtc-sdk-ng";

export interface AgoraConfig {
  appId: string;
  token: string;
  channelName: string;
  uid: number;
}

export class AgoraVoiceClient {
  private client: IAgoraRTCClient;
  private localAudioTrack: ILocalAudioTrack | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  }

  async join(config: AgoraConfig): Promise<void> {
    try {
      await this.client.join(
        config.appId,
        config.channelName,
        config.token,
        config.uid
      );

      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: {
          sampleRate: 48000,
          stereo: false,
          bitrate: 128,
        },
        AEC: true, // Acoustic Echo Cancellation
        ANS: true, // Automatic Noise Suppression
        AGC: true, // Automatic Gain Control
      });

      await this.client.publish([this.localAudioTrack]);
      this.isConnected = true;

      console.log('Agora: Successfully joined channel', config.channelName);
    } catch (error) {
      console.error('Agora: Failed to join channel', error);
      throw error;
    }
  }

  async leave(): Promise<void> {
    if (this.localAudioTrack) {
      this.localAudioTrack.stop();
      this.localAudioTrack.close();
      this.localAudioTrack = null;
    }

    if (this.isConnected) {
      await this.client.leave();
      this.isConnected = false;
      console.log('Agora: Left channel');
    }
  }

  onUserPublished(
    callback: (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => void
  ): void {
    this.client.on("user-published", callback);
  }

  onUserUnpublished(
    callback: (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => void
  ): void {
    this.client.on("user-unpublished", callback);
  }

  async subscribeAudio(user: IAgoraRTCRemoteUser): Promise<void> {
    await this.client.subscribe(user, "audio");
    const remoteAudioTrack = user.audioTrack;
    if (remoteAudioTrack) {
      remoteAudioTrack.play();
    }
  }

  getVolumeLevel(): number {
    return this.localAudioTrack?.getVolumeLevel() || 0;
  }

  setVolume(volume: number): void {
    if (this.localAudioTrack) {
      this.localAudioTrack.setVolume(volume);
    }
  }

  muteAudio(): void {
    if (this.localAudioTrack) {
      this.localAudioTrack.setEnabled(false);
    }
  }

  unmuteAudio(): void {
    if (this.localAudioTrack) {
      this.localAudioTrack.setEnabled(true);
    }
  }
}
