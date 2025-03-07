# Welcome to bla.gg! 👋

Hey there! This is the frontend part of bla.gg, our friendly P2P chat application. Since we're using cool modern features like WebRTC for video calls, we need to serve the app over HTTPS when it's not running locally. Don't worry though - we've made it super easy to set this up using Cloudflare Tunnel! 🚇

## Serving with Cloudflare Tunnel

### Prerequisites

Install the `cloudflared` CLI tool:
```bash
# macOS
brew install cloudflared

# Linux
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Windows (using scoop)
scoop install cloudflared
```

### Quick Start

1. **Start a local web server with custom headers**
   
   We've included a custom Python HTTP server (`server.py`) that adds specific headers to silence Chrome's advertising-related warnings. Use this instead of the standard Python HTTP server:
   
   ```bash
   # Using our custom server
   python3 server.py
   
   # Or from the project root using the Makefile
   make frontend
   ```
   
   Alternatively, you can use other servers:
   ```bash
   # Using Python's built-in server (without custom headers)
   python -m http.server 8000

   # Or using Node's http-server
   npx http-server -p 8000

   # Or using PHP's built-in server
   php -S localhost:8000
   ```

2. **Start a quick tunnel**
   ```bash
   cloudflared tunnel --url http://localhost:8000
   
   # Or from the project root using the Makefile
   make tunnel
   ```

Your frontend will now be available at a randomly generated `*.trycloudflare.com` URL with a valid HTTPS certificate. The URL will be displayed in your terminal.

### Environment Configuration

Update the following files with your tunnel's domain:

1. In `webrtc.js`, update the Janus server URL:
   ```javascript
   janusServer: 'https://<your-tunnel-url>/janus'
   ```

2. In `gun.js`, update the relay peer:
   ```javascript
   peers: ['https://<your-tunnel-url>/gun']
   ```

## Security Considerations

- Cloudflare Tunnel provides end-to-end encryption between your local server and Cloudflare's edge
- All WebRTC media streams are automatically encrypted using DTLS-SRTP
- The GUN database uses SEA (Security, Encryption, Authorization) for end-to-end encryption
- CORS is properly configured in the backend services to only accept requests from your domain
- Quick tunnels are ephemeral and will get a new URL each time you restart the tunnel

## Troubleshooting

1. **WebRTC Connection Issues**
   - Ensure your TURN server is properly configured and accessible
   - Check browser console for ICE connection errors
   - Verify your firewall allows WebRTC traffic

2. **Tunnel Issues**
   - If the tunnel fails to start, try a different port
   - Make sure your local server is running before starting the tunnel
   - Check if the port is already in use by another application

3. **Browser Security Errors**
   - Ensure all assets are served over HTTPS
   - Check for mixed content warnings in browser console
   - Verify all WebRTC and WebSocket connections use secure protocols
   - If you see Chrome advertising warnings, use our custom server (`server.py`) which adds the necessary headers to silence these warnings

4. **Chrome Advertising Warnings**
   - Our custom server (`server.py`) adds the necessary `Permissions-Policy` headers to silence Chrome's advertising-related warnings
   - If you're using a different server and seeing these warnings, you'll need to configure it to add the appropriate headers

Note: For persistent URLs and additional features, you can optionally create a Cloudflare account and use named tunnels instead of quick tunnels. 