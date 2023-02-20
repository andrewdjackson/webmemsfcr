set EXECUTABLE=webmemsfcr
set APPNAME=WebMemsFCR
set DISTPATH=dist
set RESOURCESPATH=resources
set WINDOWSDISTPATH=../dist/windows
set WINDOWS=%WINDOWSDISTPATH%/%EXECUTABLE%.exe

cd app
go build -o %WINDOWS% -ldflags="-H windowsgui -s -w