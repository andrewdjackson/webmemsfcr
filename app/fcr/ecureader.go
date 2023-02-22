package fcr

import (
	log "github.com/sirupsen/logrus"
	"strings"
)

type ECUStatus struct {
	Connected bool `json:"Connected"`
}

type ECUReader interface {
	Connect() (connected bool, err error)
	SendAndReceive(command []byte, expectedResponseSize int) (response []byte, err error)
	Disconnect() (err error)
}

// ECU Reader factory
func NewECUReader(connection string) ECUReader {
	// determine the type of ecuReader from the connection string
	isMemsReader := useMemsReader(connection)
	isLoopback := useLoopbackReader(connection)

	// clean up the port, remove prefixes and convert /tty. to /cu.
	connection = fixPort(connection)

	if isLoopback {
		return NewLoopbackReader(connection)
	}

	if isMemsReader {
		return NewMEMSReader(connection)
	}

	// default mems ecuReader
	return NewMEMSReader(connection)
}

func useMemsReader(connection string) bool {
	// override if the connection prefix explicitly specifies ecuReader
	return strings.HasPrefix(connection, "mems:")
}

func useLoopbackReader(connection string) bool {
	// if the connection string contains ttyecu as the serial port then
	// this is a loopback connection
	validReader := strings.Contains(connection, "ttyecu")

	// override if the connection prefix explicitly specifies ecuReader
	override := strings.HasPrefix(connection, "loopback:")

	return validReader || override
}

func fixPort(port string) string {
	// remove the prefixes
	port = strings.Replace(port, "mems:", "", 1)
	port = strings.Replace(port, "loopback:", "", 1)
	port = strings.Replace(port, "file:", "", 1)

	if strings.Contains(port, "/dev/tty.") {
		// convert tty to cu
		port = strings.Replace(port, "/tty.", "/cu.", 1)
		log.Infof("fixed tty port to %s", port)
	}

	return port
}
