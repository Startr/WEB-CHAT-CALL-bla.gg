const { messages, auth } = window.blagg;

describe('Messaging Tests', () => {
  const testUser = {
    username: 'testuser',
    password: 'testpass'
  };
  const testPeerPub = 'test-peer-pub';
  const testMessage = 'Hello, World!';

  beforeAll(async () => {
    await auth.signup(testUser.username, testUser.password);
    await auth.login(testUser.username, testUser.password);
  });

  afterAll(() => {
    auth.logout();
  });

  test('should send encrypted message', async () => {
    const sendSpy = jest.spyOn(window.blagg.gun.get('messages'), 'set');
    await messages.send(testPeerPub, testMessage);
    expect(sendSpy).toHaveBeenCalled();
    
    const call = sendSpy.mock.calls[0][0];
    expect(call).toHaveProperty('msg');
    expect(call).toHaveProperty('time');
    expect(typeof call.msg).toBe('string');
    expect(call.msg).not.toBe(testMessage); // Should be encrypted
  });

  test('should receive and decrypt message', (done) => {
    messages.subscribe(testPeerPub, (msg, time) => {
      expect(msg).toBe(testMessage);
      expect(typeof time).toBe('number');
      done();
    });

    // Simulate receiving an encrypted message
    const encryptedMsg = 'encrypted-test-message';
    window.blagg.gun.get(`messages/${testPeerPub}`).set({
      msg: encryptedMsg,
      time: Date.now()
    });
  });

  test('should fail to send message when not authenticated', async () => {
    auth.logout();
    await expect(messages.send(testPeerPub, testMessage))
      .rejects
      .toThrow('User not authenticated');
  });

  test('should fail to subscribe when not authenticated', () => {
    expect(() => messages.subscribe(testPeerPub, () => {}))
      .toThrow('User not authenticated');
  });
}); 