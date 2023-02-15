#
# This provides a local desktop app version of webmemsfcr compiled using python -m nuitka memsfcr.py
#

import datetime
import webbrowser
from flask import Flask, jsonify
import socket

app = Flask(__name__)
app.secret_key = b'webmemsfcr'

#
# use web socket to determine when the browser app has been closed so that
# the server can be terminated
#
@app.route('/keep-alive', methods=['GET'])
def keep_alive():
    alive = {'keep-alive':datetime.datetime.utcnow()}
    return jsonify(alive)

def get_free_port():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(('localhost', 0))
    port = sock.getsockname()[1]
    sock.close()
    return port
#
# import the route logic
#
import routes

port = get_free_port()

# open the default web browser and navigate the flash server URL
webbrowser.open(f'http://127.0.0.1:{port}', new=2)

app.run(port=port)
