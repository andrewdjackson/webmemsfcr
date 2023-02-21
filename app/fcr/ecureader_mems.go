package fcr

import (
	"fmt"
	"github.com/distributed/sers"
	"github.com/joho/godotenv"
	log "github.com/sirupsen/logrus"
	"os"
	"strconv"
	"time"
)

type MEMSReaderOperationalConfig struct {
	WakeUp              bool
	SerialWaitTime      int64
	SerialMinReadBuffer int64
	SerialReadTimeout   float64
	WakeUpBaudDelay     int64
}

type MEMSReader struct {
	connected  bool
	port       string
	serialPort sers.SerialPort
	config     MEMSReaderOperationalConfig
}

func NewMEMSReader(connection string) *MEMSReader {
	log.Infof("created mems ecu ecuReader")

	r := &MEMSReader{}
	r.loadEnvironment()
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

	if r.config.WakeUp {
		if err := r.wakeUp(); err != nil {
			// wakeup failure if we cannot open the serialPort
			return false, err
		}
	}

	r.flushSerialPort()

	if err := r.initialiseMemsECU(); err != nil {
		log.Errorf("error initialising ecu (%s) status : (%+v)", r.port, err)
		// connect failure if we cannot initialise successfully
		// disconnect from the ecu
		_ = r.Disconnect()
		return false, err
	}

	// connected, no errors
	r.connected = true

	return r.connected, nil
}

func (r *MEMSReader) SendAndReceive(command []byte) ([]byte, error) {
	var response []byte
	var err error

	if r.serialPort != nil {
		if r.connected {
			r.writeSerial(command)
			response, err = r.readSerial(command)
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
			if err = r.serialPort.SetReadParams(int(r.config.SerialMinReadBuffer), r.config.SerialReadTimeout); err != nil {
				log.Errorf("error setting serial port timeouts (%s)", err)
			}
		}
	}

	return err
}

// initialises the connection to the ECU
// The initialisation sequence is as follows:
//
// 1. Send command CA (MEMS_InitCommandA)
// 2. Receive response CA
// 3. Send command 75 (MEMS_InitCommandB)
// 4. Receive response 75
// 5. Send request ECU ID command D0 (MEMS_InitECUID)
// 6. Receive response D0 XX XX XX XX
func (r *MEMSReader) initialiseMemsECU() error {
	log.Infof("initialising ecu")

	r.writeSerial(MEMSInitCommandA)
	if response, err := r.readSerial(MEMSInitCommandA); err != nil {
		// abandon initialisation if error occurred
		log.Errorf("mems initialisation failed command %X (%s)", MEMSInitCommandA, err)
		return err
	} else {
		// if we get the command echoed back we can assume good connection and proceed.
		// This is to work around the issue  in Windows where the serialPort always connects even if it's not available.
		if len(response) == 0 {
			err = fmt.Errorf("0 bytes received, serial serialPort read error, timeout? (%s)", err)
			log.Errorf("%s", err)
			return err
		}

		if response[0] == MEMSInitCommandA[0] {
			r.writeSerial(MEMSInitCommandB)

			if response, err = r.readSerial(MEMSInitCommandB); err != nil {
				// abandon initialisation if error occurred
				log.Errorf("mems initialisation failed command %X (%s)", MEMSInitCommandB, err)
				return err
			}

			r.writeSerial(MEMSHeartbeat)
			if response, err = r.readSerial(MEMSHeartbeat); err != nil {
				// abandon initialisation if error occurred
				log.Errorf("mems initialisation failed command %X (%s)", MEMSHeartbeat, err)
				return err
			}

			r.writeSerial(MEMSInitECUID)
			if response, err = r.readSerial(MEMSInitECUID); err != nil {
				// abandon initialisation if error occurred
				log.Errorf("mems initialisation failed command %X (%s)", MEMSInitECUID, err)
				return err
			} else {
				log.Infof("mems initialisation ECU ID %X successful", response)
			}
		}
	}

	log.Infof("mems initialised")
	return nil
}

// readSerial read from MEMS
// read 1 byte at a time until we have all the expected bytes
func (r *MEMSReader) readSerial(command []byte) ([]byte, error) {
	var bytesRead int
	var err error
	var retry int

	size, err := getResponseSize(command)

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

func (r *MEMSReader) wakeUp() error {
	var err error

	log.Infof("performing serial port 5 baud wake-up")
	// clear the line
	if err = r.serialPort.SetBreak(false); err == nil {
		log.Debugf("setting up ecu wake-up")
		time.Sleep(time.Duration(r.config.WakeUpBaudDelay) * time.Millisecond)
		start := time.Now()

		log.Debugf("sending ecu wake-up data")
		// start bit
		_ = r.serialPort.SetBreak(true)
		r.sleepUntil(start, r.config.WakeUpBaudDelay)

		// send the byte
		ecuAddress := 0x16
		for i := 0; i < 8; i++ {
			bit := (ecuAddress >> i) & 1

			if bit > 0 {
				_ = r.serialPort.SetBreak(false)
			} else {
				_ = r.serialPort.SetBreak(true)
			}

			r.sleepUntil(start, r.config.WakeUpBaudDelay+(int64(i+1)*r.config.WakeUpBaudDelay))

		}

		// stop bit
		log.Debugf("clearing down ecu wake-up")
		_ = r.serialPort.SetBreak(false)
		r.sleepUntil(start, r.config.WakeUpBaudDelay)
	}

	log.Infof("completed serial port 5 baud wake-up")
	return err
}

func (r *MEMSReader) serialWait() {
	if r.config.SerialWaitTime > 0 {
		time.Sleep(time.Duration(r.config.SerialWaitTime) * time.Millisecond)
	}
}

func (r *MEMSReader) sleepUntil(start time.Time, plus int64) {
	target := start.Add(time.Duration(plus) * time.Millisecond)
	sleepMs := target.Sub(time.Now()).Milliseconds()
	if sleepMs < 0 {
		return
	}
	time.Sleep(time.Duration(sleepMs) * time.Millisecond)
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

func (r *MEMSReader) loadEnvironment() {
	var err error

	r.config = MEMSReaderOperationalConfig{
		WakeUp:              false,
		WakeUpBaudDelay:     200,
		SerialWaitTime:      75,
		SerialMinReadBuffer: 0,
		SerialReadTimeout:   0.1,
	}

	if err = godotenv.Load("rosco.env"); err == nil {
		log.Infof("using environment variables")

		if value := os.Getenv("WAKEUP"); value != "" {
			if r.config.WakeUp, err = strconv.ParseBool(value); err == nil {
				log.Infof("ecu wakeup %t", r.config.WakeUp)
			}
		}

		if value := os.Getenv("WAKEUP_BAUD_DELAY"); value != "" {
			if r.config.WakeUpBaudDelay, err = strconv.ParseInt(value, 10, 8); err == nil {
				log.Infof("ecu wakeup baud delay %dms", r.config.WakeUpBaudDelay)
			}
		}

		if value := os.Getenv("SERIAL_WAIT_TIME"); value != "" {
			if r.config.SerialWaitTime, err = strconv.ParseInt(value, 10, 8); err == nil {
				log.Infof("ecu serial wait time %dms", r.config.SerialWaitTime)
			}
		}

		if value := os.Getenv("SERIAL_MIN_READ_BUFFER"); value != "" {
			if r.config.SerialMinReadBuffer, err = strconv.ParseInt(value, 10, 8); err == nil {
				log.Infof("ecu serial min read buffer %d", r.config.SerialMinReadBuffer)
			}
		}

		if value := os.Getenv("SERIAL_READ_TIMEOUT"); value != "" {
			if r.config.SerialReadTimeout, err = strconv.ParseFloat(value, 8); err == nil {
				log.Infof("ecu serial read timeout %f", r.config.SerialReadTimeout)
			}
		}
	}
}
