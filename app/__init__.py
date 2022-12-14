import os
import sys
import json

#
# add the app folder to the system path so the application classes and modules can be found
#
basedir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(basedir)
sys.path.append(basedir + "/app")

from analysis import Analysis
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, session, flash, make_response, jsonify
from flask_wtf.csrf import CSRFProtect, CSRFError

app = Flask(__name__)
app.secret_key = b'webmemsfcr'
#csrf = CSRFProtect(app)

template_data_folder = os.path.join(basedir, 'static/template_data')

@app.errorhandler(CSRFError)
def csrf_error(e):
    return e.description, 400

@app.errorhandler(404)
def not_found(error):
    return render_template('error.html'), 404

@app.errorhandler(500)
def not_found(error):
    return render_template('error.html'), 500

@app.route('/', methods=['GET'])
def render_index():
    data = load_template_data()
    if len(data) > 0:
        return render_template('index.jinja2', data=data)
    else:
        return render_template('error.html')

#
# perform analysis on the log file
#
@app.route('/analysis', methods=['POST'])
def analysis():
    dataframes = request.json
    analysis = Analysis(dataframes['dataframes'])
    data = load_template_data()
    print(analysis.faults.faults)
    return render_template('analysis.jinja2', faults=analysis.faults.faults, data=data)

def load_template_data():
    data = {}
    files = get_template_data_filelist()

    for file in files:
        filepath = os.path.join(template_data_folder, file)
        with open(f'{filepath}') as f:
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

# returns true or false if the specified fault is active
@app.context_processor
def isActiveFault():
    def _isActiveFault(fault, faults):
        for f in faults:
            if f["metric"] == fault and f["index"] is not None:
                return True

        return False

    return dict(isActiveFault=_isActiveFault)

@app.context_processor
def faultCount():
    def _faultCount(faults):
        count = 0

        for f in faults:
            if f["index"] is not None and f["type"] == "alert":
                count += 1

        return count

    return dict(faultCount=_faultCount)

if __name__ == '__main__':
    app.run(debug=True)
