import http.server
import socketserver
import json
import time
import os
import urllib.parse

PORT = 8000
DB_FILE = 'local_db.json'

def load_db():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_db(db):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

class MockAPIHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/create':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Generate a slug based on timestamp
                timestamp = int(time.time() * 1000)
                def base36encode(number):
                    alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
                    base36 = ''
                    while number:
                        number, i = divmod(number, 36)
                        base36 = alphabet[i] + base36
                    return base36 or alphabet[0]
                
                slug_suffix = base36encode(timestamp)
                slug = f"event-{slug_suffix}"
                
                # Add metadata
                data['slug'] = slug
                data['createdAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                
                # Save to local db
                db = load_db()
                db[slug] = data
                save_db(db)
                
                # Send response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                response_data = {'slug': slug}
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
                print(f"Created new event with slug: {slug}")
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
                print(f"Error creating event: {e}")
        else:
            self.send_error(501, "Unsupported method ('POST')")

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        # Handle API config reads
        if path.startswith('/api/config/'):
            slug = path.split('/')[-1]
            db = load_db()
            if slug in db:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(db[slug]).encode('utf-8'))
                print(f"Served config for slug: {slug}")
            else:
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Not found'}).encode('utf-8'))
                print(f"Config not found for slug: {slug}")
        else:
            # Handle edge routing: if path doesn't have an extension and isn't root, serve payment.html
            if path != '/' and path != '/index.html' and '.' not in path:
                # Rewrite to payment.html
                print(f"Edge Routing: Rewriting {path} to /payment.html")
                self.path = '/payment.html'
            
            return super().do_GET()

if __name__ == '__main__':
    # Fix for Address already in use
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MockAPIHandler) as httpd:
        print(f"Serving HTTP on port {PORT} with Mock API enabled...")
        print("To stop the server, press CTRL+C")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
