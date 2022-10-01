import os
import sys
import imp

os.environ["MKL_NUM_THREADS"] = "10"
os.environ["NUMEXPR_NUM_THREADS"] = "10"
os.environ["OMP_NUM_THREADS"] = "10"
os.environ['OPENBLAS_NUM_THREADS'] = '10'

sys.path.insert(0, os.path.dirname(__file__))

wsgi = imp.load_source('wsgi', 'wsgi.py')
application = wsgi.application
