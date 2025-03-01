// Main application class
class BlaggApp {
  constructor() {
    this.currentUser = null;
    this.activeCall = null;
    
    // Verify that required components are available
    this.checkDependencies();
    
    // Listen for incoming calls
    window.blagg.gun.on('calls', (data, key) => {
      if (data && data.offer && key.includes(window.blagg.user.is?.pub)) {
        this.handleIncomingCall(key.split('/')[0], data.offer);
      }
    });

    // Listen for remote stream
    window.addEventListener('blagg:remotestream', (e) => {
      const video = document.getElementById('remoteVideo');
      video.srcObject = e.detail.stream;
    });

    // Expose methods to window for _hyperscript to access
    // These methods are called directly from HTML elements via _hyperscript attributes
    // Example: <button _="on click call app.handleLogin()">Login</button>
    window.app = {
      handleLogin: this.handleLogin.bind(this),
      handleSignup: this.handleSignup.bind(this),
      handleSendMessage: this.handleSendMessage.bind(this),
      handleStartCall: this.handleStartCall.bind(this),
      handleEndCall: this.handleEndCall.bind(this),
      toggleMute: this.toggleMute.bind(this),
      toggleVideo: this.toggleVideo.bind(this),
      loadMoreMessages: this.loadMoreMessages.bind(this),
      checkUsernameAvailability: this.checkUsernameAvailability.bind(this)
    };
    
    console.log('BlaggApp initialized successfully');
  }
  
  // Check that all required dependencies and components are available
  checkDependencies() {
    console.log('Checking dependencies...');
    
    // Check for GUN DB
    if (!window.Gun) {
      console.error('GUN library not loaded!');
    } else {
      console.log('GUN library loaded successfully');
    }
    
    // Check for SEA (GUN's encryption)
    if (!window.SEA) {
      console.error('SEA encryption module not loaded!');
    } else {
      console.log('SEA encryption module loaded successfully');
    }
    
    // Check for blagg namespace
    if (!window.blagg) {
      console.error('blagg namespace not initialized!');
    } else {
      console.log('blagg namespace initialized with:', Object.keys(window.blagg));
      
      // Check blagg components
      if (!window.blagg.gun) console.error('blagg.gun not available');
      if (!window.blagg.user) console.error('blagg.user not available');
      if (!window.blagg.auth) console.error('blagg.auth not available');
      if (!window.blagg.messages) console.error('blagg.messages not available');
      
      // Check auth methods
      if (window.blagg.auth) {
        if (typeof window.blagg.auth.signup !== 'function') console.error('blagg.auth.signup not a function');
        if (typeof window.blagg.auth.login !== 'function') console.error('blagg.auth.login not a function');
      }
    }
    
    // Check for _hyperscript
    if (!window._hyperscript) {
      console.error('_hyperscript library not loaded!');
    } else {
      console.log('_hyperscript library loaded successfully');
    }
    
    console.log('Dependency check complete');
  }

  // Handle user login
  // Called from _hyperscript in the login form: <form _="on submit call app.handleLogin()">
  async handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username.trim() || !password.trim()) {
      alert('Please enter both username and password');
      return;
    }

    try {
      console.log(`Attempting to log in as: ${username}`);
      await window.blagg.auth.login(username, password);
      this.currentUser = window.blagg.user.is;
      console.log('Login successful:', this.currentUser);
      this.updateUIForLoggedInUser();
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed: ' + (err.message || 'Unknown error occurred'));
    }
  }

  // Handle user signup
  // Called from _hyperscript in the signup button: <button _="on click call app.handleSignup()">
  async handleSignup() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username.trim() || !password.trim()) {
      alert('Please enter both username and password');
      return;
    }

    try {
      console.log('Attempting to sign up user:', username);
      
      // First check if user already exists
      const exists = await window.blagg.auth.checkUser(username);
      if (exists) {
        // Update the status message in the UI
        const statusEl = document.getElementById('usernameStatus');
        if (statusEl) {
          statusEl.textContent = 'Username already taken. Please choose another.';
          statusEl.classList.remove('available');
          statusEl.classList.add('unavailable');
          
          // Focus the username input for better UX
          document.getElementById('username').focus();
        }
        
        throw new Error('Username already taken. Please choose another.');
      }
      
      // Make sure password is strong enough
      if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }
      
      const result = await window.blagg.auth.signup(username, password);
      console.log('Signup result:', result);
      
      if (result && result.err) {
        throw new Error(result.err);
      }
      
      alert('Signup successful! Now logging in...');
      await this.handleLogin(); // Log in after signup
    } catch (err) {
      console.error('Signup error:', err);
      
      // Provide more detailed error messages based on common issues
      let errorMessage = 'Unknown error occurred';
      if (err && err.message) {
        errorMessage = err.message;
      } else if (err && typeof err === 'string') {
        errorMessage = err;
      } else if (err && err.err) {
        errorMessage = err.err;
      }
      
      // Handle common GUN errors
      if (errorMessage.includes('already exists')) {
        errorMessage = 'Username already taken. Please choose another.';
      } else if (errorMessage.includes('password')) {
        errorMessage = 'Password is not valid. Please try another.';
      }
      
      alert('Signup failed: ' + errorMessage);
    }
  }

  // Update UI for logged-in user
  updateUIForLoggedInUser() {
    const authContainer = document.getElementById('auth');
    const chatContainer = document.getElementById('chat');
    
    authContainer.classList.add('fade-out');
    setTimeout(() => {
      authContainer.style.display = 'none';
      chatContainer.style.display = 'block';
      setTimeout(() => {
        chatContainer.classList.add('fade-in');
      }, 10);
    }, 300);
    
    document.getElementById('userStatus').textContent = 
      `Logged in as: ${this.currentUser.alias} (${this.currentUser.pub})`;
  }

  // Handle sending a message
  // Called from _hyperscript in the message input and send button
  async handleSendMessage() {
    const input = document.getElementById('messageInput');
    const peerPub = document.getElementById('peerPub').value;
    const message = input.value;

    if (!message.trim()) return; // Don't send empty messages
    if (!peerPub.trim()) {
      alert('Please enter a peer public key');
      return;
    }

    try {
      await window.blagg.messages.send(peerPub, message);
      this.appendMessage('You', message);
      input.value = '';
    } catch (err) {
      console.error('Send message error:', err);
      alert('Failed to send message: ' + (err.message || 'Unknown error occurred'));
    }
  }

  // Handle starting a call
  // Called from _hyperscript in the start call button: <button _="on click call app.handleStartCall()">
  async handleStartCall() {
    const peerPub = document.getElementById('peerPub').value;
    
    if (!peerPub.trim()) {
      alert('Please enter a peer public key');
      return;
    }
    
    try {
      this.activeCall = new window.blagg.WebRTCCall(peerPub);
      const stream = await this.activeCall.startCall();
      
      // Animate the transition
      const chatContainer = document.getElementById('chat');
      const callContainer = document.getElementById('call');
      
      chatContainer.classList.add('fade-out');
      setTimeout(() => {
        document.getElementById('localVideo').srcObject = stream;
        callContainer.style.display = 'block';
        setTimeout(() => {
          callContainer.classList.add('fade-in');
        }, 10);
      }, 300);
    } catch (err) {
      console.error('Start call error:', err);
      alert('Failed to start call: ' + (err.message || 'Unknown error occurred'));
    }
  }

  // Handle incoming call
  async handleIncomingCall(peerPub, offer) {
    if (confirm(`Incoming call from ${peerPub}. Accept?`)) {
      try {
        this.activeCall = new window.blagg.WebRTCCall(peerPub);
        const stream = await this.activeCall.answerCall(offer);
        
        // Animate the transition
        const chatContainer = document.getElementById('chat');
        const callContainer = document.getElementById('call');
        
        chatContainer.classList.add('fade-out');
        setTimeout(() => {
          document.getElementById('localVideo').srcObject = stream;
          callContainer.style.display = 'block';
          setTimeout(() => {
            callContainer.classList.add('fade-in');
          }, 10);
        }, 300);
      } catch (err) {
        console.error('Answer call error:', err);
        alert('Failed to answer call: ' + (err.message || 'Unknown error occurred'));
      }
    }
  }

  // Handle ending a call
  // Called from _hyperscript in the end call button: <button _="on click call app.handleEndCall()">
  handleEndCall() {
    if (this.activeCall) {
      this.activeCall.endCall();
      this.activeCall = null;
      
      // Animate the transition
      const chatContainer = document.getElementById('chat');
      const callContainer = document.getElementById('call');
      
      callContainer.classList.add('fade-out');
      setTimeout(() => {
        document.getElementById('localVideo').srcObject = null;
        document.getElementById('remoteVideo').srcObject = null;
        callContainer.style.display = 'none';
        chatContainer.style.display = 'block';
        setTimeout(() => {
          chatContainer.classList.add('fade-in');
        }, 10);
      }, 300);
    }
  }

  // Toggle mute for local audio
  // Called from _hyperscript in the mute button: <button _="on click call app.toggleMute(...)">
  toggleMute(mute) {
    if (this.activeCall && this.activeCall.localStream) {
      const audioTracks = this.activeCall.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !mute;
      });
    }
  }

  // Toggle video for local video
  // Called from _hyperscript in the video toggle button: <button _="on click call app.toggleVideo(...)">
  toggleVideo(turnOff) {
    if (this.activeCall && this.activeCall.localStream) {
      const videoTracks = this.activeCall.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !turnOff;
      });
    }
  }

  // Append message to chat
  appendMessage(sender, text) {
    const messages = document.getElementById('messages');
    const msg = document.createElement('div');
    msg.className = 'message';
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
    
    // Add _hyperscript for message interactions
    msg.setAttribute('_', `
      on click toggle .highlighted on me
      on dblclick
        if event.shiftKey
          remove me
        end
      end
    `);
    
    _hyperscript.processNode(msg);
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  // Load more messages (placeholder for pagination)
  // Called from _hyperscript in the messages container: <div _="on scroll call app.loadMoreMessages()">
  loadMoreMessages() {
    // This would be implemented to load older messages
    console.log('Loading more messages...');
  }

  // Check if a username is available
  // Called from _hyperscript in the username input: <input _="on keyup debounced at 500ms call app.checkUsernameAvailability(my value)">
  async checkUsernameAvailability(username) {
    if (!username || username.trim() === '') return;
    
    const statusEl = document.getElementById('usernameStatus');
    if (!statusEl) return;
    
    try {
      const exists = await window.blagg.auth.checkUser(username);
      
      if (exists) {
        statusEl.textContent = 'Username already taken';
        statusEl.classList.remove('available');
        statusEl.classList.add('unavailable');
        return false;
      } else {
        statusEl.textContent = 'Username available';
        statusEl.classList.remove('unavailable');
        statusEl.classList.add('available');
        return true;
      }
    } catch (err) {
      console.error('Error checking username:', err);
      statusEl.textContent = 'Error checking availability';
      statusEl.classList.remove('available');
      statusEl.classList.add('unavailable');
      return false;
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new BlaggApp();
}); 