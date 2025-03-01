describe('UI Tests', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    app = new window.app;
  });

  test('should initialize app with auth form', () => {
    expect(document.getElementById('auth')).toBeTruthy();
    expect(document.getElementById('username')).toBeTruthy();
    expect(document.getElementById('password')).toBeTruthy();
    expect(document.getElementById('loginBtn')).toBeTruthy();
    expect(document.getElementById('signupBtn')).toBeTruthy();
  });

  test('should hide auth and show chat after login', async () => {
    const mockUser = {
      alias: 'testuser',
      pub: 'test-pub-key'
    };

    // Mock successful login
    window.blagg.auth.login = jest.fn().mockResolvedValue(true);
    window.blagg.user.is = mockUser;

    await app.handleLogin();

    expect(document.getElementById('auth').style.display).toBe('none');
    expect(document.getElementById('chat').style.display).toBe('block');
    expect(document.getElementById('userStatus').textContent)
      .toContain(mockUser.alias);
  });

  test('should show alert on login failure', async () => {
    const errorMessage = 'Invalid credentials';
    window.blagg.auth.login = jest.fn().mockRejectedValue(new Error(errorMessage));
    global.alert = jest.fn();

    await app.handleLogin();

    expect(global.alert).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
  });

  test('should append messages to chat', () => {
    const sender = 'Alice';
    const message = 'Hello, World!';

    app.appendMessage(sender, message);

    const messages = document.getElementById('messages');
    const lastMessage = messages.lastChild;

    expect(lastMessage.textContent).toContain(sender);
    expect(lastMessage.textContent).toContain(message);
  });

  test('should show call container when starting call', async () => {
    const mockStream = new MediaStream();
    window.blagg.WebRTCCall = jest.fn().mockImplementation(() => ({
      startCall: jest.fn().mockResolvedValue(mockStream)
    }));

    await app.handleStartCall();

    expect(document.getElementById('call').style.display).toBe('block');
    expect(document.getElementById('localVideo').srcObject).toBe(mockStream);
  });

  test('should clean up call UI when ending call', () => {
    app.activeCall = {
      endCall: jest.fn()
    };

    app.handleEndCall();

    expect(app.activeCall.endCall).toHaveBeenCalled();
    expect(app.activeCall).toBeNull();
    expect(document.getElementById('call').style.display).toBe('none');
    expect(document.getElementById('localVideo').srcObject).toBeNull();
    expect(document.getElementById('remoteVideo').srcObject).toBeNull();
  });
}); 