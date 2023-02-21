package fcr

import (
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
	"net/http"
	"os"
	"time"
)

//
// Ping Pong Server
//

var (
	// pongWait is how long we will await a pong response from client
	pongWait = 3 * time.Second
	// pingInterval has to be less than pongWait, We cant multiply by 0.9 to get 90% of time
	// Because that can make decimals, so instead *9 / 10 to get 90%
	// The reason why it has to be less than PingRequency is becuase otherwise it will send a new Ping before getting response
	pingInterval = (pongWait * 9) / 10
)

// serveWs handles websocket requests from the peer.
func (webserver *WebServer) serveWs(w http.ResponseWriter, r *http.Request) {
	var err error

	if webserver.ws, err = webserver.upgrader.Upgrade(w, r, nil); err != nil {
		log.Println(err)
		return
	}

	// send the pings, read the pongs
	go webserver.readMessages()
	go webserver.writeMessages()
}

// writeMessages is a process that listens for new messages to output to the Client
func (webserver *WebServer) writeMessages() {
	// Create a ticker that triggers a ping at given interval
	ticker := time.NewTicker(pingInterval)
	defer func() {
		ticker.Stop()
		// Graceful close if this triggers a closing
		webserver.TerminateApplication()
	}()

	for {
		select {
		case <-ticker.C:
			// Send the Ping
			if err := webserver.ws.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
				log.Warnf("browser disconnected (%s)", err)
				return // return to break this goroutine trigger cleanup
			}
		}

	}
}

// readMessages will start the client to read messages
func (webserver *WebServer) readMessages() {
	defer func() {
		// Graceful Close the Connection once this
		// function is done
	}()

	// Configure Wait time for Pong response, use Current time + pongWait
	// This has to be done here to set the first initial timer.
	if err := webserver.ws.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
		log.Warnf("webserver readMessage error (%s)", err)
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
			// If Connection is closed, we will Receive an error
			// We only want to log Strange errors, but simple Disconnection
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Warnf("error reading message: %+v", err)
			}
			break // Break the loop to close conn & Cleanup
		}
	}
}

// pongHandler is used to handle PongMessages for the Client
func (webserver *WebServer) pongHandler(pongMsg string) error {
	// Current time + Pong Wait time
	log.Infof("browser connected (pong received)")
	return webserver.ws.SetReadDeadline(time.Now().Add(5000))
}

func (webserver *WebServer) TerminateApplication() {
	log.Info("shutting down application")
	os.Exit(0)
}
