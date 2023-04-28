package fcr

import (
	"fmt"
	"github.com/distributed/sers"
	log "github.com/sirupsen/logrus"
	"time"
)

type MEMSReader struct {
	connected  bool
	port       string
	serialPort sers.SerialPort
}

func NewMEMSReader(connection string) *MEMSReader {
	log.Infof("created mems ecu ecuReader")

	r := &MEMSReader{}
	r.port = fixPort(connection)
	return r
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

func (r *MEMSReader) mems19wakeup() bool {
	ecu19SpecificInitCommand := []byte{0x7C}
	ecu19WokeResponse := []byte{0x55, 0x76, 0x83}
	ecu19SpecificInitResponse := []byte{ecu19SpecificInitCommand[0], 0xE9} // includes our echo

	// clear the k-line
	if err := r.serialPort.SetBreak(false); err == nil {
		time.Sleep(2000 * time.Millisecond)
	}

	// record the starting time
	start := time.Now()

	// send start bit
	if err := r.serialPort.SetBreak(true); err == nil {
		sleepUntil(start, 200)
	}

	// send the wake-up byte
	ecuAddress := 0x16
	for i := 0; i < 8; i++ {
		bit := (ecuAddress >> i) & 1
		if bit > 0 {
			if err := r.serialPort.SetBreak(false); err == nil {
				// worked
			}
		} else {
			if err := r.serialPort.SetBreak(true); err == nil {
				// worked
			}
		}

		sleepUntil(start, 200+((i+1)*200))
	}

	// send the stop bit
	if err := r.serialPort.SetBreak(false); err == nil {
		sleepUntil(start, 200+(8*200)+200)
	}

	// mems 1.9 specific initialisation
	// in serious need of refactoring!!

	buffer := make([]byte, 0)

	readLoops := 0
	readLoopsLimit := 200

	for readLoops < readLoopsLimit {
		readLoops++
		if readLoops > 1 {
			time.Sleep(10 * time.Millisecond)
		}

		rb := make([]byte, 128)
		n, _ := r.serialPort.Read(rb[:])
		rb = rb[0:n] // chop down to actual data size
		buffer = append(buffer, rb...)
		if n > 0 {
			readLoops = 0 // reset timeout
		}

		// clear leading zeros (from our wake-up)
		for len(buffer) > 0 && buffer[0] == 0x00 {
			buffer = buffer[1:]
		}

		if len(buffer) == 0 {
			// no data, back round to read again
			continue
		}

		if slicesEqual(buffer, ecu19WokeResponse) {
			// received expected response from the ECU (init stage 1)
			buffer = nil
			time.Sleep(50 * time.Millisecond)

			// invert (xor) byte 2 (x83) and send back to ecu
			// 0x83, 1000 0011 -> 0x7C 0111 1100)
			n, _ = r.serialPort.Write(ecu19SpecificInitCommand)

			// back round to read again
			continue
		}

		if slicesEqual(buffer, ecu19SpecificInitResponse) {
			// received response from init command
			buffer = nil
			// proceed to perform the standard init
			// ecu1xLoop(sp, true)
			// don't know why it doesn't just drop out of the loop here and goes back round to read again??
			continue
		}

		if readLoops >= readLoopsLimit {
			// if we try too many times then we timed out
			// another fugly bit of code
			return false
		}
	}

	return true
}

func slicesEqual(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	for i, v := range a {
		if v != b[i] {
			return false
		}
	}
	return true
}
func sleepUntil(start time.Time, plus int) {
	target := start.Add(time.Duration(plus) * time.Millisecond)
	sleepMs := target.Sub(time.Now()).Milliseconds()
	if sleepMs < 0 {
		return
	}
	time.Sleep(time.Duration(sleepMs) * time.Millisecond)
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
