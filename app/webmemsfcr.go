package main

import (
	"flag"
	"fmt"
	"github.com/andrewdjackson/webmemsfcr/fcr"
	"github.com/pkg/browser"
	log "github.com/sirupsen/logrus"
	"runtime"
)

var (
	webServer *fcr.WebServer
)

func main() {
	var port string
	var headless bool

	flag.StringVar(&port, "port", "0", "webserver port")
	flag.BoolVar(&headless, "headless", false, "headless server mode")
	flag.Parse()

	// create a channel to notify app to exit
	exit := make(chan int)

	webServer = fcr.NewWebServer()

	// start the web server
	StartWebServer(port)

	// open the browser
	if !headless {
		OpenBrowser()
	}

	// wait for exit on the channel
	for {
		<-exit
	}
}

func StartWebServer(port string) {
	// run the web server as a concurrent process
	go webServer.RunHTTPServer(port)

	// display the web interface, wait for the HTTP Server to start
	for {
		if webServer.ServerRunning {
			break
		}
	}
}

// OpenBrowser opens the browser
func OpenBrowser() {
	url := fmt.Sprintf("http://127.0.0.1:%d/index.html", webServer.HTTPPort)

	var err error

	log.Infof("opening browser (%s)", runtime.GOOS)
	err = browser.OpenURL(url)

	if err != nil {
		log.Errorf("error opening browser (%s)", err)
	}
}
