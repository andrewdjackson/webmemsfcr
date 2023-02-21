package fcr

import (
	log "github.com/sirupsen/logrus"
	"go.bug.st/serial.v1"
)

// enumerate the available serial ports,  this won't enumerate virtual ports
func (webserver *WebServer) getSerialPorts() []string {
	var err error
	var ports []string

	if ports, err = serial.GetPortsList(); err != nil {
		log.Error("error enumerating serial ports (%+v)", err)
	}

	return ports
}
