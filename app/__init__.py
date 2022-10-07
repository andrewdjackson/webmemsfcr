import os
import sys
import json
import pathlib
#
# add the app folder to the system path so the application classes and modules can be found
#
basedir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(basedir)
sys.path.append(basedir + "/app")

from flask import Flask, render_template, request, redirect, url_for, send_from_directory, session, flash, make_response, jsonify
from flask_wtf.csrf import CSRFProtect, CSRFError

app = Flask(__name__)
app.secret_key = b'webmemsfcr'
#csrf = CSRFProtect(app)

template_data_folder = './static/templates'

@app.errorhandler(CSRFError)
def csrf_error(e):
    return e.description, 400

@app.route('/', methods=['GET'])
def render_index():
    data = load_template_data()
    return render_template('index.jinja2', data=data)


def load_template_data():
    data = {}
    files = get_template_data_filelist()

    for file in files:
        with open(f'{template_data_folder}/{file}') as f:
             data[file] = json.load(f)

    return data

def get_template_data_filelist():
    files = []
    pathlist = pathlib.Path(template_data_folder).rglob('*.json')
    for path in pathlist:
        files.append(path.name)

    return files

if __name__ == '__main__':
    app.run(debug=True)
