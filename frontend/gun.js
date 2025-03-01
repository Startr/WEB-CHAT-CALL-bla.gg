// Initialize GUN with optional relay peer
const gun = Gun({
  peers: ['http://localhost:8765/gun'] // Default local relay peer
});

// User authentication and data handling
const user = gun.user();

// User management functions
const auth = {
  // Create new user
  async signup(username, password) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    return new Promise((resolve, reject) => {
      user.create(username, password, (ack) => {
        console.log('Signup response:', ack);
        if (ack.err) {
          console.error('GUN signup error:', ack.err);
          reject(new Error(ack.err));
        } else {
          resolve(ack);
        }
      });
    });
  },

  // Login existing user
  async login(username, password) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    return new Promise((resolve, reject) => {
      user.auth(username, password, (ack) => {
        console.log('Login response:', ack);
        if (ack.err) {
          console.error('GUN login error:', ack.err);
          reject(new Error(ack.err));
        } else {
          resolve(ack);
        }
      });
    });
  },

  // Logout current user
  logout() {
    user.leave();
  },
  
  // Check if user exists
  async checkUser(username) {
    return new Promise((resolve) => {
      gun.get(`~@${username}`).once((data) => {
        resolve(!!data);
      });
    });
  }
};

// Message handling
const messages = {
  // Send encrypted message to a peer
  async send(peerPub, message) {
    if (!user.is) throw new Error('User not authenticated');
    try {
      const secret = await SEA.secret(peerPub, user._.sea);
      const enc = await SEA.encrypt(message, secret);
      gun.get(`messages/${peerPub}`).set({ msg: enc, time: Date.now() });
    } catch (err) {
      console.error('Message encryption error:', err);
      throw new Error('Failed to encrypt message: ' + (err.message || 'Unknown error'));
    }
  },

  // Listen for new messages
  subscribe(peerPub, callback) {
    if (!user.is) throw new Error('User not authenticated');
    gun.get(`messages/${peerPub}`).on(async (data) => {
      if (!data) return;
      try {
        const secret = await SEA.secret(peerPub, user._.sea);
        const msg = await SEA.decrypt(data.msg, secret);
        callback(msg, data.time);
      } catch (err) {
        console.error('Message decryption error:', err);
        // Silently fail on decryption errors, but log them
      }
    });
  }
};

// Helper to check if GUN is working
const checkConnection = () => {
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      console.error('GUN connection check timed out');
      resolve(false);
    }, 5000);
    
    gun.get('connection-test').put({ time: Date.now() }, ack => {
      clearTimeout(timeout);
      if (ack.err) {
        console.error('GUN connection error:', ack.err);
        resolve(false);
      } else {
        console.log('GUN connected successfully');
        resolve(true);
      }
    });
  });
};

// Export the API
window.blagg = { gun, user, auth, messages, checkConnection }; 