#
# This provides a local desktop app version of webmemsfcr compiled using 'python -m nuitka memsfcr.py'
#
import os
import signal
import time
import webbrowser
from flask import Flask, jsonify
import socket
from flask_socketio import SocketIO

app = Flask(__name__)
app.secret_key = b'webmemsfcr'
socketio = SocketIO(app)
connected = False
#
# use web socket to determine when the browser app has been closed so that
# the server can be terminated
#

@socketio.on('connect')
def connect(auth):
    global connected
    print('Browser connected')
    connected = True

@socketio.on('disconnect')
def disconnect():
    global connected
    connected = False
    print('Browser disconnected')
    time.sleep(5)
    if not connected:
        terminate()

#
# You can't easily get at the server socket used by Flask, as it's hidden in the internals of the standard library
# Create an ephemeral port and then close the socket that creates it, we know this port if free for Flask
#
def get_free_port():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(('localhost', 0))
    free_port = sock.getsockname()[1]
    sock.close()
    return free_port

def terminate():
    print('Terminating Application')
    os.kill(os.getpid(), signal.SIGTERM)

# import the route logic, this import must appear after the Flask app has been instantiated
import routes

# get a free port to use for Flask
port = get_free_port()

# open the default web browser and navigate the flash server URL
webbrowser.open(f'http://127.0.0.1:{port}', new=2)

# run the application
socketio.run(app=app, port=port)
