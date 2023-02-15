cd app
python -m nuitka --include-data-dir=static=static --include-data-dir=templates=templates --disable-console --onefile --windows-icon-from-ico=static/images/icon.png memsfcr.py
