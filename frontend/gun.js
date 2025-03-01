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
    return new Promise((resolve, reject) => {
      user.create(username, password, (ack) => {
        if (ack.err) reject(ack.err);
        else resolve(ack);
      });
    });
  },

  // Login existing user
  async login(username, password) {
    return new Promise((resolve, reject) => {
      user.auth(username, password, (ack) => {
        if (ack.err) reject(ack.err);
        else resolve(ack);
      });
    });
  },

  // Logout current user
  logout() {
    user.leave();
  }
};

// Message handling
const messages = {
  // Send encrypted message to a peer
  async send(peerPub, message) {
    if (!user.is) throw new Error('User not authenticated');
    const enc = await SEA.encrypt(message, await SEA.secret(peerPub, user._.sea));
    gun.get(`messages/${peerPub}`).set({ msg: enc, time: Date.now() });
  },

  // Listen for new messages
  subscribe(peerPub, callback) {
    if (!user.is) throw new Error('User not authenticated');
    gun.get(`messages/${peerPub}`).on(async (data) => {
      if (!data) return;
      const msg = await SEA.decrypt(
        data.msg,
        await SEA.secret(peerPub, user._.sea)
      );
      callback(msg, data.time);
    });
  }
};

// Export the API
window.blagg = { gun, user, auth, messages }; 