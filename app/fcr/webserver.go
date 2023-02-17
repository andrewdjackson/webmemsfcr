package fcr

import (
	"fmt"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
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
	httpDir  string
	paths    RelativePaths
	ws       *websocket.Conn
	upgrader websocket.Upgrader
	Conn     *websocket.Conn
	// HTTPPort used by the HTTP Server instance
	HTTPPort int
	// ServerRunning indicates where the server is active
	ServerRunning bool
	// waiting for a response from the ECU
	waitingForECUResponse bool
	// headless mode, supress quit on no browser heartbeat
	headless bool
}

const (
	indexTemplate    = "index.template.html"
	indexData        = "index.template.json"
	templateWildcard = "*.template.html"
)

// NewWebServer creates a new web interface
func NewWebServer() *WebServer {
	webserver := &WebServer{}
	webserver.HTTPPort = 0
	webserver.httpDir = ""
	webserver.ServerRunning = false
	webserver.paths = RelativePaths{}

	webserver.upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	return webserver
}

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
	webserver.paths = webserver.getRelativePaths()
	webserver.httpDir = webserver.paths.Webroot

	// set a router and a handler to accept messages over the websocket

	r := mux.NewRouter()

	// Create a file server which serves files out of the "static" directory.
	// Note that the path given to the http.Dir function is relative to the project
	// directory root.
	fileServer := http.FileServer(http.Dir(webserver.httpDir))

	r.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		webserver.serveWs(w, r)
	})

	r.PathPrefix("/").Handler(fileServer)

	return r
}

// serveWs handles websocket requests from the peer.
func (webserver *WebServer) serveWs(w http.ResponseWriter, r *http.Request) {
	var err error

	if webserver.ws, err = webserver.upgrader.Upgrade(w, r, nil); err != nil {
		log.Println(err)
		return
	}
}

// pongHandler is used to handle PongMessages for the Client
func (webserver *WebServer) pongHandler(pongMsg string) error {
	// Current time + Pong Wait time
	log.Println("pong")
	return webserver.ws.SetReadDeadline(time.Now().Add(5000))
}

func (webserver *WebServer) listen() {
	// Configure Wait time for Pong response, use Current time + pongWait
	// This has to be done here to set the first initial timer.
	if err := webserver.ws.SetReadDeadline(time.Now().Add(5000)); err != nil {
		log.Println(err)
		return
	}
	// Configure how to handle Pong responses
	webserver.ws.SetPongHandler(webserver.pongHandler)

	// Loop Forever
	for {
		// ReadMessage is used to read the next message in queue
		// in the connection
		_, _, err := webserver.ws.ReadMessage()

		if err != nil {
			// If Connection is closed, we will Recieve an error here
			// We only want to log Strange errors, but simple Disconnection
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error reading message: %v", err)
			}
			break // Break the loop to close conn & Cleanup
		}
	}
}

// RunHTTPServer run the server
func (webserver *WebServer) RunHTTPServer(port string) {
	// Declare a new router
	webserver.router = webserver.newRouter()
	serverport := fmt.Sprintf(":%s", port)

	// We can then pass our router (after declaring all our routes) to this method
	// (where previously, we were leaving the second argument as nil)
	listener, err := net.Listen("tcp", serverport)

	if err != nil {
		log.Errorf("error starting web interface (%s)", err)
	}

	webserver.HTTPPort = listener.Addr().(*net.TCPAddr).Port

	log.Infof("started http server on port %d", webserver.HTTPPort)
	webserver.ServerRunning = true

	err = http.Serve(listener, webserver.router)
	go webserver.listen()

	if err != nil {
		log.Errorf("error starting web interface (%s)", err)
	}
}
