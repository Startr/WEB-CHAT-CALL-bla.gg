from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class CustomHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add headers to silence Chrome's advertising warnings
        self.send_header("Permissions-Policy", 
            "attribution-reporting=(), "
            "run-ad-auction=(), "
            "join-ad-interest-group=(), "
            "private-state-token-redemption=(), "
            "private-state-token-issuance=(), "
            "browsing-topics=()"
        )
        super().end_headers()

if __name__ == '__main__':
    port = 8000
    server_address = ('', port)
    httpd = HTTPServer(server_address, CustomHTTPRequestHandler)
    print(f"Serving HTTP on port {port} (http://localhost:{port}/) ...")
    httpd.serve_forever() 