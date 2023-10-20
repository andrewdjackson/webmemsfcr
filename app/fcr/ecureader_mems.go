package fcr

import (
	"fmt"
	"github.com/distributed/sers"
	log "github.com/sirupsen/logrus"
	"time"
)

type MEMSReader struct {
	connected   bool
	port        string
	serialPort  sers.SerialPort
	memsVersion string
}

func NewMEMSReader(connection string) *MEMSReader {
	r := &MEMSReader{}
	r.memsVersion = MEMS1_6
	r.port = fixPort(connection)

	log.Infof("created mems ecu ecuReader (%+v)", r)

	return r
}

func (r *MEMSReader) SetVersion(version string) error {
	var err error

	if version == MEMS1_6 || version == MEMS1_9 {
		r.memsVersion = version
	} else {
		err = fmt.Errorf("unknown MEMS version %s", version)
	}

	return err
}

func (r *MEMSReader) Connect() (bool, error) {
	r.connected = false

	if err := r.connectToSerialPort(r.port); err != nil {
		log.Errorf("error opening serial (%s) status : (%+v)", r.port, err)
		// connect failure if we cannot open the serialPort
		return false, err
	}

	r.flushSerialPort()

	// connected, no errors
	r.connected = true

	if r.memsVersion == MEMS1_9 && r.connected {
		// need to do an additional kline wake-up on connection	for MEMS 1.9
		r.connected = r.mems19wakeup()
	}

	return r.connected, nil
}

func (r *MEMSReader) SendAndReceive(command []byte, expectedResponseSize int) ([]byte, error) {
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

func (r *MEMSReader) Disconnect() error {
	var err error

	// don't try and close an uninitialised serial serialPort
	// the serial library throws and ugly fatal if that happens
	if r.serialPort != nil {
		if r.connected {
			r.flushSerialPort()

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

func (r *MEMSReader) connectToSerialPort(port string) error {
	var err error

	log.Infof("attempting to open serial serialPort %s", port)

	// connect to the ecu
	if r.serialPort, err = sers.Open(port); err != nil {
		log.Errorf("error opening serial port (%s)", err)
	} else {
		if err = r.serialPort.SetMode(9600, 8, sers.N, 1, sers.NO_HANDSHAKE); err != nil {
			log.Errorf("error configuring serial port (%s)", err)
		} else {
			if err = r.serialPort.SetReadParams(0, 0.1); err != nil {
				log.Errorf("error setting serial port timeouts (%s)", err)
			}
		}
	}

	return err
}

// readSerial read from MEMS
// read 1 byte at a time until we have all the expected bytes
func (r *MEMSReader) readSerial(command []byte, expectedResponseSize int) ([]byte, error) {
	var bytesRead int
	var err error
	var retry int

	size := expectedResponseSize

	// serial read buffer
	b := make([]byte, size)

	//  receivedBytes frame buffer
	receivedBytes := make([]byte, 0)

	if r.serialPort != nil {
		// read all the expected bytes before returning the receivedBytes
		retry = 0
		// wait for data
		r.serialWait()

		for count := 0; count < size; {
			// wait for a response from MEMS
			bytesRead, err = r.serialPort.Read(b)

			if bytesRead == 0 {
				// wait for data and retry
				r.serialWait()
				retry++

				if retry >= 5 {
					// drop out of loop, send back a 0x00 byte array response
					// this prevents the loop getting blocked on a read error
					err = fmt.Errorf("0 bytes received, serial port read error after %d retries (%s)", retry, err)
					log.Errorf("(%s)", err)
					return receivedBytes, err
				}
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

func (r *MEMSReader) commandMatchesResponse(command []byte, receivedBytes []byte) error {
	var err error

	if command[0] != receivedBytes[0] {
		err = fmt.Errorf("expecting command echo of %X, received %X", command[0], receivedBytes[0])
		log.Errorf("%s", err)
	}

	return err
}

// writeSerial write to MEMS
func (r *MEMSReader) writeSerial(data []byte) {
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

func (r *MEMSReader) serialWait() {
	time.Sleep(time.Duration(75) * time.Millisecond)
}

func (r *MEMSReader) flushSerialPort() {
	r.serialWait()

	size := 200
	b := make([]byte, size)

	for {
		if bytesRead, err := r.serialPort.Read(b); err == nil {
			log.Infof("flushing serial port, read %d bytes", bytesRead)
		} else {
			log.Infof("serial port flushed")
			break
		}
	}
}
