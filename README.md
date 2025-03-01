# WEB-CHAT-CALL-bla.gg

**bla.gg** is a fun and lightweight chat platform that lets you connect with friends without the bloat! 🚀 Think Skype, but way cooler and built for privacy-conscious users. We've created it using simple but powerful tools like **Vanilla JavaScript**, **HyperScript**, **WebRTC**, and **GUN.js** to keep things fast and decentralized.

✨ **Amazing Features That Actually Work:**
- 🔒 End-to-end encrypted messaging - your secrets are safe with us!
- 📱 Install it as a PWA on any device - works even when offline
- 🎥 Crystal-clear video calls directly between browsers
- 🤝 No central servers needed - everything is peer-to-peer
- 🔐 Create an account in seconds, data stays on your device
- 💬 Real-time messaging that just works
- 🌐 Optional self-hosted servers if you want them
- 🎨 Clean, minimal interface that gets out of your way
- ⚡ Lightning fast and lightweight

🔜 **Coming Soon:**
- 📞 Make and receive calls to/from regular phone numbers worldwide
- 📱 Get your own dedicated phone number in 100+ countries
- 💼 Business features like custom greeting messages and call forwarding
- 🔄 Seamless call transfer between devices
- 📧 Voicemail-to-email transcription
- 🌐 International toll-free numbers
- 👥 Virtual phone system for teams
- 🤖 AI-powered call screening and spam blocking
- 📊 Advanced call analytics and reporting

Built with privacy and security as top priorities, bla.gg gives you all the features you need for modern communication while keeping your data under your control. No tracking, no ads, just pure peer-to-peer goodness! 

## Quick Start

The project includes a Makefile to simplify common operations:

```bash
# Start the frontend server with custom headers (silences Chrome ad warnings)
make frontend

# Start a Cloudflare tunnel to expose your local server with HTTPS
make tunnel

# Start both the frontend server and Cloudflare tunnel
make all

# Stop all running services
make stop

# Start the backend services with Docker Compose
make backend
```

## TODO
- Fix Kamailio SIP Server integration: Currently, the Kamailio service is disabled in docker-compose.yml due to image availability issues. Need to find a reliable public Docker image for Kamailio or create a custom one.

## Features and Architecture Overview

- **Decentralized User Accounts & Messaging:** Users create identities that are stored in a **GUN** distributed graph database, rather than on a central server. This data syncs directly between user devices using GUN's peer-to-peer mesh (leveraging WebRTC under the hood [(Building a Decentralized Chat App using GUN.js)](https://dev.to/envoy_/building-a-decentralized-chat-app-using-gunjs-and-svelte-29h6#:~:text=Unlike%20a%20centralized%20database%20that,Merkle%20trees)). User login and data (like contacts and chat history) are handled client-side, with GUN's **SEA** module providing secure user authentication and encryption [(Building a Decentralized Chat App using GUN.js)](https://dev.to/envoy_/building-a-decentralized-chat-app-using-gunjs-and-svelte-29h6#:~:text=and%20,different%20technique%20to%20link%20peers).
- **Peer-to-Peer Audio/Video Calls:** bla.gg uses **WebRTC** for real-time voice and video communication. Two users can initiate a call directly from their browsers; the app uses a signaling mechanism (implemented via GUN) to coordinate the call setup, then streams media P2P. WebRTC's ICE protocol is used to traverse NATs with the help of **STUN** servers (to discover public IPs) and fallback to **TURN** servers if direct P2P cannot be established. Media streams are encrypted via DTLS-SRTP by default [(Is there any setting to enable for WebRTC encryption (DTLS, SRTP) - How to implement? - OpenVidu)](https://openvidu.discourse.group/t/is-there-any-setting-to-enable-for-webrtc-encryption-dtls-srtp/811#:~:text=WebRTC%20is%20always%20encrypted,currently%20in%20an%20HTTPS%20page) for security.
- **Progressive Web App (PWA):** The frontend is a static web app that can be served on any web host or CDN. It's designed as a PWA, so users can **install** it to their home screen. A Service Worker provides offline caching of assets and background capabilities (like push notifications for incoming calls or messages). Even if the user is offline, they can open bla.gg to view cached chats or write messages that will sync once a connection is re-established.
- **Optional Backend Services (Dockerized):** While the app is fully functional without central servers, we provide an optional Docker-based backend stack for convenience and advanced features:
    - **GUN Relay Peer:** A Node.js server running GUN in relay mode to help bootstrap and relay data between peers (especially useful if some peers are offline at times or behind tough firewalls).
    - **TURN/STUN Server (coturn):** A TURN server (with STUN) for reliable connectivity. This relay helps route WebRTC media if direct P2P fails (ensuring calls still work even in restrictive networks).
    - **WebRTC-to-SIP Bridge:** An optional service using **Kamailio + Janus** or **Asterisk**  to bridge calls between WebRTC clients and the traditional SIP/phone network. This means you could, for example, call a phone number or join a SIP conference from bla.gg. (Janus, an open-source WebRTC server, can act as a WebRTC-to-SIP gateway, and Kamailio can serve as the SIP router/registrar.) All these backend components are configured to run in a single Docker Compose deployment for easy self-hosting.
 
### Repository Structure

The project is organized for clarity and minimalism. Most of the app logic lives on the client side in a few JavaScript files, and there are configuration files for optional servers and testing. Below is an outline of the repository structure:

```plaintext
bla.gg/
├── Makefile                  # Commands for common operations
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── webrtc.js
│   ├── gun.js
│   ├── style.css
│   ├── manifest.webmanifest
│   ├── server.py             # Custom HTTP server with headers to silence Chrome warnings
│   └── sw.js
├── backend/
│   ├── docker-compose.yml
│   ├── gun-relay.dockerfile
│   ├── turnserver.conf
│   ├── janus/
│   │    └── janus.cfg (example Janus config for SIP plugin)
│   └── kamailio/
│        └── kamailio.cfg (example Kamailio config)
└── tests/
    ├── webrtc.test.js
    ├── messaging.test.js
    └── ui.test.js
```

- **frontend/**: All static frontend files for the PWA.
- **backend/**: Docker setup for optional servers (GUN relay, TURN, and WebRTC-SIP gateway). Configuration files and Dockerfiles are included for customization.
- **tests/**: Automated test scripts for connectivity and UI.

Next, we delve into each part of the implementation in detail.

## Frontend Implementation (Vanilla JS PWA)

The frontend is built without heavy frameworks – just plain JavaScript, a tiny DOM builder library (HyperScript), and the GUN and WebRTC APIs. The UI is intentionally simple and uncluttered, focusing on core functionality.

### HTML and Basic UI Structure

The `index.html` sets up the basic page structure, loads necessary scripts, and provides a container for our app UI. It also links the PWA manifest and triggers registration of the service worker:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>bla.gg – P2P Chat</title>
  <link rel="manifest" href="manifest.webmanifest" />
  <meta name="theme-color" content="#317EFB"/>
  <!-- Startr.Style CSS for basic layout -->
  <link rel="stylesheet" href="https://startr.style/style.css">
</head>
<body>
  <div id="app"></div>

  <!-- Include GUN (for decentralized DB) -->
  <script src="https://cdn.jsdelivr.net/npm/gun/gun.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gun/sea.js"></script> <!-- security module -->
  <!-- Include HyperScript library for UI creation -->
  <script src="https://unpkg.com/hyperscript"></script>
  <!-- Our application scripts -->
  <script src="app.js"></script>
</body>
</html>
```

A few notes on the above setup:

- We load **GUN.js** from a CDN for convenience (including the `sea.js` module for user auth and encryption). This allows using `Gun()` globally in our scripts.
- We include a HyperScript script. This library provides the `h()` function to create DOM elements in a declarative way. (HyperScript helps us keep the UI dynamic while still using vanilla JS – it's basically a tiny helper to create elements like `h('div.container', { onclick: handler }, "Text")` instead of manual `document.createElement` calls.)
- The app's main code is in `app.js`, which runs after GUN and HyperScript are available.
- We have a `<div id="app"></div>` which our script will use as the mounting point for the UI components.

The `style.css` is Startr Style's minimal styling framework. Startr.Style accelerates and standardizes web design through custom property helpers and utilities, all seamlessly integrated within the style attribute. This innovative approach streamlines styling, making it faster and more consistent across projects. By embedding the power of customization directly where it's needed, Startr.Style ensures a lean, efficient workflow without sacrificing flexibility or control.

### Custom HTTP Server

The project includes a custom HTTP server (`server.py`) that adds specific headers to silence Chrome's advertising-related warnings. This server is used instead of the standard Python HTTP server and can be started using the Makefile command `make frontend`.

