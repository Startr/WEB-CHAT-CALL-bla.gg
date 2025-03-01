// Main application class
class BlaggApp {
  constructor() {
    this.currentUser = null;
    this.activeCall = null;
    this.setupUI();
    this.setupEventListeners();
  }

  // Create and mount UI components
  setupUI() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="container">
        <header>
          <h1>bla.gg</h1>
          <div id="userStatus"></div>
        </header>
        
        <div id="auth" class="auth-container">
          <form id="authForm">
            <input type="text" id="username" placeholder="Username" autocomplete="username">
            <input type="password" id="password" placeholder="Password" autocomplete="current-password">
            <button type="submit" id="loginBtn">Login</button>
            <button type="button" id="signupBtn">Sign Up</button>
          </form>
        </div>

        <div id="chat" class="chat-container" style="display: none;">
          <div class="contacts">
            <input type="text" id="peerPub" placeholder="Peer's Public Key">
            <button id="startCallBtn">Start Call</button>
          </div>
          
          <div class="messages" id="messages"></div>
          
          <div class="message-input">
            <input type="text" id="messageInput" placeholder="Type a message...">
            <button id="sendBtn">Send</button>
          </div>
        </div>

        <div id="call" class="call-container" style="display: none;">
          <video id="localVideo" autoplay muted></video>
          <video id="remoteVideo" autoplay></video>
          <button id="endCallBtn">End Call</button>
        </div>
      </div>
    `;
  }

  // Set up event listeners for UI interactions
  setupEventListeners() {
    // Auth events
    document.getElementById('loginBtn').onclick = () => this.handleLogin();
    document.getElementById('signupBtn').onclick = () => this.handleSignup();

    // Chat events
    document.getElementById('sendBtn').onclick = () => this.handleSendMessage();
    document.getElementById('startCallBtn').onclick = () => this.handleStartCall();
    document.getElementById('endCallBtn').onclick = () => this.handleEndCall();

    // Listen for incoming calls
    window.blagg.gun.on('calls', (data, key) => {
      if (data && data.offer && key.includes(window.blagg.user.is.pub)) {
        this.handleIncomingCall(key.split('/')[0], data.offer);
      }
    });

    // Listen for remote stream
    window.addEventListener('blagg:remotestream', (e) => {
      const video = document.getElementById('remoteVideo');
      video.srcObject = e.detail.stream;
    });
  }

  // Handle user login
  async handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      await window.blagg.auth.login(username, password);
      this.currentUser = window.blagg.user.is;
      this.updateUIForLoggedInUser();
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  }

  // Handle user signup
  async handleSignup() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      await window.blagg.auth.signup(username, password);
      await this.handleLogin(); // Log in after signup
    } catch (err) {
      alert('Signup failed: ' + err.message);
    }
  }

  // Update UI for logged-in user
  updateUIForLoggedInUser() {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('chat').style.display = 'block';
    document.getElementById('userStatus').textContent = 
      `Logged in as: ${this.currentUser.alias} (${this.currentUser.pub})`;
  }

  // Handle sending a message
  async handleSendMessage() {
    const input = document.getElementById('messageInput');
    const peerPub = document.getElementById('peerPub').value;

    try {
      await window.blagg.messages.send(peerPub, input.value);
      input.value = '';
      this.appendMessage('You', input.value);
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    }
  }

  // Handle starting a call
  async handleStartCall() {
    const peerPub = document.getElementById('peerPub').value;
    
    try {
      this.activeCall = new window.blagg.WebRTCCall(peerPub);
      const stream = await this.activeCall.startCall();
      
      document.getElementById('call').style.display = 'block';
      document.getElementById('localVideo').srcObject = stream;
    } catch (err) {
      alert('Failed to start call: ' + err.message);
    }
  }

  // Handle incoming call
  async handleIncomingCall(peerPub, offer) {
    if (confirm(`Incoming call from ${peerPub}. Accept?`)) {
      try {
        this.activeCall = new window.blagg.WebRTCCall(peerPub);
        const stream = await this.activeCall.answerCall(offer);
        
        document.getElementById('call').style.display = 'block';
        document.getElementById('localVideo').srcObject = stream;
      } catch (err) {
        alert('Failed to answer call: ' + err.message);
      }
    }
  }

  // Handle ending a call
  handleEndCall() {
    if (this.activeCall) {
      this.activeCall.endCall();
      this.activeCall = null;
      document.getElementById('call').style.display = 'none';
      document.getElementById('localVideo').srcObject = null;
      document.getElementById('remoteVideo').srcObject = null;
    }
  }

  // Append message to chat
  appendMessage(sender, text) {
    const messages = document.getElementById('messages');
    const msg = document.createElement('div');
    msg.className = 'message';
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BlaggApp();
}); 