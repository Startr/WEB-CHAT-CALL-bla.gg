const { WebRTCCall } = window.blagg;

describe('WebRTC Call Tests', () => {
  let call;
  const mockPeerPub = 'test-peer-pub';

  beforeEach(() => {
    call = new WebRTCCall(mockPeerPub);
  });

  afterEach(() => {
    call.endCall();
  });

  test('should create WebRTCCall instance', () => {
    expect(call).toBeInstanceOf(WebRTCCall);
    expect(call.peerPub).toBe(mockPeerPub);
    expect(call.peerConnection).toBeInstanceOf(RTCPeerConnection);
  });

  test('should handle media stream acquisition', async () => {
    const mockStream = new MediaStream();
    global.navigator.mediaDevices.getUserMedia = jest.fn().mockResolvedValue(mockStream);

    const stream = await call.startCall();
    expect(stream).toBe(mockStream);
    expect(call.localStream).toBe(mockStream);
  });

  test('should handle call setup', async () => {
    const mockOffer = { type: 'offer', sdp: 'test-sdp' };
    call.peerConnection.createOffer = jest.fn().mockResolvedValue(mockOffer);

    await call.startCall();
    expect(call.peerConnection.createOffer).toHaveBeenCalled();
    expect(call.peerConnection.setLocalDescription).toHaveBeenCalledWith(mockOffer);
  });

  test('should handle call termination', () => {
    const mockTrack = { stop: jest.fn() };
    call.localStream = new MediaStream();
    call.localStream.getTracks = jest.fn().mockReturnValue([mockTrack]);

    call.endCall();
    expect(mockTrack.stop).toHaveBeenCalled();
    expect(call.peerConnection.close).toHaveBeenCalled();
  });
}); 