import http.server
import socketserver
import webbrowser
import os

PORT = 9001
DIRECTORY = "graphify-out"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

print(f"Starting server at http://localhost:{PORT}")
print("Opening Architecture Explorer...")

webbrowser.open(f"http://localhost:{PORT}/standalone_explorer.html")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
