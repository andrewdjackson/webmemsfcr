import os
import sys

#
# add the app folder to the system path so the application classes and modules can be found
#
basedir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(basedir)
sys.path.append(basedir + "/app")

from flask import Flask, render_template, request, redirect, url_for, send_from_directory, session, flash, make_response, jsonify
from flask_wtf.csrf import CSRFProtect, CSRFError

app = Flask(__name__)
app.secret_key = b'wevmemsfcr'
#csrf = CSRFProtect(app)

@app.errorhandler(CSRFError)
def csrf_error(e):
    return e.description, 400

@app.route('/', methods=['GET'])
def render_index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
