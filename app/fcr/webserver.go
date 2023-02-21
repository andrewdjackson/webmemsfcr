package fcr

import (
	"fmt"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

type RelativePaths struct {
	Webroot string
	ExePath string
}

// WebServer the web interface
type WebServer struct {
	// multiplex router interface
	router *mux.Router
	// websocket interface
	ws       *websocket.Conn
	upgrader websocket.Upgrader
	Conn     *websocket.Conn
	// HTTPPort used by the HTTP Server instance
	HTTPPort int
	// ServerRunning indicates where the server is active
	ServerRunning bool
	// ECU represents the serial connection to the ECU
	ecuReader ECUReader
	ecuStatus ECUStatus
}

// NewWebServer creates a new web interface
func NewWebServer() *WebServer {
	webserver := &WebServer{}
	webserver.HTTPPort = 0
	webserver.ServerRunning = false

	webserver.upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	return webserver
}

// returns the path to the web files relative the operating system
func (webserver *WebServer) getRelativePaths() RelativePaths {
	paths := RelativePaths{}

	// determine the path to find the local html files
	// based on the current executable path
	exepath := GetAppFolder()
	paths.ExePath, _ = filepath.Abs(exepath)

	// use default browser on Windows until I can get the Webview to work
	if runtime.GOOS == "darwin" {
		// get the executable path on MacOS
		exepath, _ = os.Executable()
		paths.ExePath, _ = filepath.Abs(filepath.Dir(exepath))

		// MacOS use .app Resources
		if strings.Contains(paths.ExePath, "MacOS") {
			// packaged app
			paths.Webroot = strings.Replace(paths.ExePath, "MacOS", "Resources", -1)
		} else {
			// running a local or dev version
			paths.Webroot = fmt.Sprintf("%s/Resources", paths.ExePath)
		}
	} else if runtime.GOOS == "linux" {
		// linux path
		// get the executable path
		paths.Webroot = fmt.Sprintf("%s/resources", paths.ExePath)
	} else {
		// windows use the exe subdirectory
		paths.Webroot = fmt.Sprintf("%s\\resources", paths.ExePath)
	}

	paths.Webroot = filepath.ToSlash(paths.Webroot)

	log.Infof("path to the local html files (%s) on (%s)", paths.Webroot, runtime.GOOS)

	return paths
}

func (webserver *WebServer) newRouter() *mux.Router {
	paths := webserver.getRelativePaths()

	// set a router and a handler to accept messages over the websocket

	r := mux.NewRouter()

	// Create a file server which serves files out of the "static" directory.
	// Note that the path given to the http.Dir function is relative to the project
	// directory root.
	fileServer := http.FileServer(http.Dir(paths.Webroot))

	r.HandleFunc("/ws", webserver.serveWs)
	r.HandleFunc("/connect", webserver.apiECUConnect).Methods(http.MethodPost)
	r.HandleFunc("/disconnect", webserver.apiECUDisconnect).Methods(http.MethodPost)
	r.HandleFunc("/command", webserver.apiECUSendCommand).Methods(http.MethodPost)
	r.HandleFunc("/ports", webserver.apiECUGetAvailableSerialPorts).Methods(http.MethodGet)
	r.PathPrefix("/").Handler(fileServer)

	return r
}

// RunHTTPServer run the server
func (webserver *WebServer) RunHTTPServer(port string) {
	// Declare a new router
	webserver.router = webserver.newRouter()
	serverPort := fmt.Sprintf(":%s", port)

	// We can then pass our router (after declaring all our routes) to this method
	// (where previously, we were leaving the second argument as nil)
	listener, err := net.Listen("tcp", serverPort)

	if err != nil {
		log.Errorf("error starting web interface (%s)", err)
	}

	webserver.HTTPPort = listener.Addr().(*net.TCPAddr).Port

	log.Infof("MemsFCR server started at http://127.0.0.1:%d", webserver.HTTPPort)
	webserver.ServerRunning = true

	err = http.Serve(listener, webserver.router)

	if err != nil {
		log.Errorf("error starting web interface (%s)", err)
	}
}
