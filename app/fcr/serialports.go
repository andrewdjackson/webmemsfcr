package fcr

import (
	log "github.com/sirupsen/logrus"
	"go.bug.st/serial"
	"strings"
)

// enumerate the available serial ports,  this won't enumerate virtual ports
func (webserver *WebServer) getSerialPorts() []string {
	var err error
	var ports []string

	if ports, err = serial.GetPortsList(); err != nil {
		log.Warnf("error enumerating serial ports (%s)", err)
	}

	portList := webserver.dedupPorts(ports)

	return portList
}

func (webserver *WebServer) dedupPorts(ports []string) []string {
	var portList []string

	for _, port := range ports {
		// if the port starts with /dev/tty then search the port list for the /dev/cu equivalent
		// if we find the /dev/cu version then replace the /dev/tty entry
		if strings.HasPrefix(port, "/dev/tty") {
			port = strings.Replace(port, "/dev/tty", "/dev/cu", 1)
		}
		// add it to the list if it's unique
		if !contains(portList, port) {
			portList = append(portList, port)
		}
	}

	return portList
}

// Contains tells whether a contains x.
func contains(a []string, x string) bool {
	for _, n := range a {
		if x == n {
			return true
		}
	}
	return false
}
