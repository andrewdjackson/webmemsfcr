package fcr

import (
	"time"
)

func (r *MEMSReader) mems19wakeup() bool {
	r.initialiseKLine()
	return r.initialiseMems19()
}

// mems 1.9 specific initialisation
// in serious need of refactoring!!
func (r *MEMSReader) initialiseMems19() bool {
	ecu19SpecificInitCommand := []byte{0x7C}
	ecu19WokeResponse := []byte{0x55, 0x76, 0x83}
	ecu19SpecificInitResponse := []byte{ecu19SpecificInitCommand[0], 0xE9} // includes our echo

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

func (r *MEMSReader) initialiseKLine() {
	// clear the k-line
	r.clearKLine()

	// record the starting time
	start := time.Now()

	// send start bit
	r.sendStartBit(start)

	// send the wake-up byte
	r.sendWakeUpByte(start)

	// send the stop bit
	r.sendStopBit(start)
}

func (r *MEMSReader) sendStopBit(start time.Time) {
	if err := r.serialPort.SetBreak(false); err == nil {
		sleepUntil(start, 200+(8*200)+200)
	}
}

func (r *MEMSReader) sendWakeUpByte(start time.Time) {
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
}

func (r *MEMSReader) sendStartBit(start time.Time) {
	if err := r.serialPort.SetBreak(true); err == nil {
		sleepUntil(start, 200)
	}
}

func (r *MEMSReader) clearKLine() {
	if err := r.serialPort.SetBreak(false); err == nil {
		time.Sleep(2000 * time.Millisecond)
	}
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
