from __main__ import app

import os
import json
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, session, flash, make_response, jsonify
from flask_wtf.csrf import CSRFProtect, CSRFError

#
# configure paths to the template folders
#
basedir = os.path.abspath(os.path.dirname(__file__))
template_data_folder = os.path.join(basedir, 'static/templates/data')
static_template_folder = os.path.join(basedir, 'static/templates')

#
# when cross site scripting protection is enabled generate a 400 error if an exception is raised
#
@app.errorhandler(CSRFError)
def csrf_error(e):
    return e.description, 400

#
# 404 not found error handler
#
@app.errorhandler(404)
def not_found(error):
    return render_template('../app/error.html'), 404

@app.errorhandler(500)
def not_found(error):
    return render_template('../app/error.html'), 500

#
# serve the favicon from the static path
#
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),'favicon.ico', mimetype='image/vnd.microsoft.icon')

#
# server the index template unless an error occurs retrieving the template data
#
@app.route('/', methods=['GET'])
def render_index():
    data = load_template_data()
    if len(data) > 0:
        return render_template('index-local.jinja2', data=data)
    else:
        return render_template('../app/error.html')

def load_template_data():
    data = {}
    files = get_template_data_filelist()

    for file in files:
        filepath = os.path.join(template_data_folder, file)
        with open(f'{filepath}','r', encoding="utf-8") as f:
            data[file] = json.load(f)

    return data

def get_template_data_filelist():
    files = []

    # iterate directory
    for file in os.listdir(template_data_folder):
        # check only text files
        if file.endswith('.json'):
            files.append(file)

    return files

@app.context_processor
def template():
    def _include_file(file):
        filepath = os.path.join(static_template_folder, file)
        with open(f'{filepath}', 'r', encoding="utf-8") as f:
            return f.read()

    return dict(template=_include_file)
