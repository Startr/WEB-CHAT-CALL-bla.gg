// WebRTC configuration
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { 
      urls: 'turn:localhost:3478',
      username: 'blagg',
      credential: 'blagg'
    }
  ],
  janusServer: 'http://localhost:8080/janus'  // Updated Janus server port
};

class WebRTCCall {
  constructor(peerPub) {
    this.peerConnection = new RTCPeerConnection(rtcConfig);
    this.peerPub = peerPub;
    this.localStream = null;
    this.remoteStream = null;
    this.setupPeerConnectionHandlers();
  }

  // Set up event handlers for the peer connection
  setupPeerConnectionHandlers() {
    // Handle ICE candidates
    this.peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        // Send candidate to peer via GUN
        window.blagg.gun.get(`calls/${this.peerPub}/ice`).set(candidate);
      }
    };

    // Handle incoming tracks
    this.peerConnection.ontrack = ({ streams: [stream] }) => {
      this.remoteStream = stream;
      // Notify UI of new remote stream
      window.dispatchEvent(new CustomEvent('blagg:remotestream', { 
        detail: { stream, peerPub: this.peerPub }
      }));
    };
  }

  // Start a call
  async startCall() {
    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Create and send offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Send offer via GUN
      window.blagg.gun.get(`calls/${this.peerPub}/offer`).set(offer);

      // Listen for answer
      window.blagg.gun.get(`calls/${this.peerPub}/answer`).on(async (answer) => {
        if (answer && !this.peerConnection.currentRemoteDescription) {
          await this.peerConnection.setRemoteDescription(answer);
        }
      });

      return this.localStream;
    } catch (err) {
      console.error('Error starting call:', err);
      throw err;
    }
  }

  // Answer an incoming call
  async answerCall(offer) {
    try {
      // Set remote description from offer
      await this.peerConnection.setRemoteDescription(offer);

      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Create and send answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Send answer via GUN
      window.blagg.gun.get(`calls/${this.peerPub}/answer`).set(answer);

      return this.localStream;
    } catch (err) {
      console.error('Error answering call:', err);
      throw err;
    }
  }

  // End the call
  endCall() {
    // Stop all tracks
    this.localStream?.getTracks().forEach(track => track.stop());
    this.remoteStream?.getTracks().forEach(track => track.stop());

    // Close peer connection
    this.peerConnection.close();

    // Clean up GUN data
    window.blagg.gun.get(`calls/${this.peerPub}`).put(null);
  }
}

// Export WebRTC functionality
window.blagg = window.blagg || {};
window.blagg.WebRTCCall = WebRTCCall; 