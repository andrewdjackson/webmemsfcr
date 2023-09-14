package fcr

import (
	"fmt"
	"github.com/mitchellh/go-homedir"
	log "github.com/sirupsen/logrus"
	"github.com/tarm/serial"
	"path/filepath"
	"time"
)

type LoopbackReader struct {
	connected  bool
	port       string
	ecuId      string
	ecuSerial  string
	serialPort *serial.Port
}

func NewLoopbackReader(connection string) *LoopbackReader {
	log.Infof("created loopback ecu ecuReader")

	r := &LoopbackReader{}

	if connection == "" || connection == "loopback" {
		r.port = r.getVirtualPort()
		r.ecuId = "99XXXXXX"
		r.ecuSerial = "LOOPBACK"
	} else {
		r.port = fixPort(connection)
	}

	return r
}

func (r *LoopbackReader) SetVersion(version string) error {
	return nil
}

func (r *LoopbackReader) Connect() (bool, error) {
	r.connected = false

	if err := r.connectToSerialPort(r.port); err != nil {
		log.Errorf("error opening serial (%s) status : (%+v)", r.port, err)
		// connect failure if we cannot open the serialPort
		return false, err
	}

	// connected, no errors
	r.connected = true

	return r.connected, nil
}

func (r *LoopbackReader) SendAndReceive(command []byte, expectedResponseSize int) ([]byte, error) {
	var response []byte
	var err error

	if r.serialPort != nil {
		if r.connected {
			r.writeSerial(command)
			response, err = r.readSerial(command, expectedResponseSize)
		} else {
			err = fmt.Errorf("ecu is not connected, unable to send %X", command)
			log.Errorf("%s", err)
		}
	} else {
		err = fmt.Errorf("serial connnection not initialised, unable to send %X", command)
		log.Errorf("%s", err)
	}

	return response, err
}

func (r *LoopbackReader) Disconnect() error {
	var err error

	// don't try and close an uninitialised serial serialPort
	// the serial library throws and ugly fatal if that happens
	if r.serialPort != nil {
		if r.connected {
			if err = r.serialPort.Flush(); err != nil {
				log.Warnf("error flushing serial serialPort (%+v)", err)
			}

			if err = r.serialPort.Close(); err != nil {
				log.Warnf("error closing serial serialPort (%+v)", err)
			} else {
				log.Infof("serial port closed successully")
			}
		}
	}

	r.connected = false
	return err
}

func (r *LoopbackReader) connectToSerialPort(port string) error {
	var err error

	log.Infof("attempting to open serial serialPort %s", port)

	// connect to the ecu, timeout if we don't get data after a couple of seconds
	c := &serial.Config{Name: port, Baud: 9600, ReadTimeout: time.Millisecond * 500}

	if r.serialPort, err = serial.OpenPort(c); err != nil {
		log.Errorf("error opening serial port (%s)", err)
	}

	return err
}

// readSerial read from MEMS
// read 1 byte at a time until we have all the expected bytes
func (r *LoopbackReader) readSerial(command []byte, expectedResponseSize int) ([]byte, error) {
	var bytesRead int
	var err error

	size := expectedResponseSize

	// serial read buffer
	b := make([]byte, size)

	//  receivedBytes frame buffer
	receivedBytes := make([]byte, 0)

	if r.serialPort != nil {
		// read all the expected bytes before returning the receivedBytes
		for count := 0; count < size; {
			// wait for a response from MEMS
			bytesRead, err = r.serialPort.Read(b)

			if bytesRead == 0 {
				err = fmt.Errorf("0 bytes received, serial port read error (%s)", err)
				log.Errorf("%s", err)
				return receivedBytes, err
				// drop out of loop, send back a 0x00 byte array response
				// this prevents the loop getting blocked on a read error
				//count = size
				//receivedBytes = append(receivedBytes, b...)
			} else {
				// append the read bytes to the receivedBytes frame
				receivedBytes = append(receivedBytes, b[:bytesRead]...)
			}

			// increment by the number of bytes read
			count = count + bytesRead
			if count > size {
				err = fmt.Errorf("received dataframe size mismatch, received %d, expected %d", count, size)
				log.Errorf("%s", err)
			}
		}
	}

	log.Infof("received %X from ecu, %d bytes", receivedBytes, bytesRead)

	if err == nil {
		err = r.commandMatchesResponse(command, receivedBytes)
	}

	return receivedBytes, err
}

func (r *LoopbackReader) commandMatchesResponse(command []byte, receivedBytes []byte) error {
	var err error

	if command[0] != receivedBytes[0] {
		err = fmt.Errorf("expecting command echo of %X, received %X", command[0], receivedBytes[0])
		log.Errorf("%s", err)
	}

	return err
}

// writeSerial write to MEMS
func (r *LoopbackReader) writeSerial(data []byte) {
	if r.serialPort != nil {
		bytesWritten, err := r.serialPort.Write(data)

		if err != nil {
			log.Errorf("error sending %X to the ecu (%s)", data, err)
		}

		if bytesWritten > 0 {
			log.Infof("sent %X to ecu", data)
		}
	}
}

func (r *LoopbackReader) getVirtualPort() string {
	homefolder, _ := homedir.Dir()
	return filepath.ToSlash(homefolder + "/ttyecu")
}
