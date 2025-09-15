#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

PORT = 8000

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="/home/user/webapp", **kwargs)
    
    def log_message(self, format, *args):
        sys.stdout.write(f"{self.log_date_time_string()} - {format % args}\n")
        sys.stdout.flush()

if __name__ == "__main__":
    os.chdir("/home/user/webapp")
    with socketserver.TCPServer(("0.0.0.0", PORT), CustomHandler) as httpd:
        print(f"Server running on port {PORT}")
        sys.stdout.flush()
        httpd.serve_forever()