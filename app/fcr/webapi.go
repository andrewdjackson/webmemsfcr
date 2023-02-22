package fcr

import (
	"encoding/hex"
	"encoding/json"
	log "github.com/sirupsen/logrus"
	"io"
	"net/http"
)

type ECUConnectionPort struct {
	Port string `json:"Port"`
}

type AvailablePorts struct {
	Ports []string `json:"Ports"`
}

type ECUCommandResponse struct {
	Command      string `json:"Command"`
	Response     string `json:"Response"`
	ExpectedSize int    `json:"ExpectedSize"`
}

//
// ECU Serial Communications API
//

func (webserver *WebServer) apiECUConnect(w http.ResponseWriter, r *http.Request) {
	defer webserver.handleResponseBodyClose(r)

	// read the serial port from the post body
	var connection ECUConnectionPort
	if err := json.NewDecoder(r.Body).Decode(&connection); err != nil {
		log.Errorf("%+v", err)
	} else {
		webserver.ecuReader = NewECUReader(connection.Port)
		if connected, err := webserver.ecuReader.Connect(); err == nil {
			webserver.ecuStatus.Connected = connected
		}
	}

	if err := json.NewEncoder(w).Encode(webserver.ecuStatus); err != nil {
		log.Warnf("connect error (%+v)", err)
	}
}

func (webserver *WebServer) apiECUDisconnect(w http.ResponseWriter, r *http.Request) {
	defer webserver.handleResponseBodyClose(r)

	if !webserver.ecuStatus.Connected {
		log.Warnf("disconnect - ecu not connected")
	} else {
		if err := webserver.ecuReader.Disconnect(); err == nil {
			webserver.ecuStatus.Connected = false
		}
	}

	if err := json.NewEncoder(w).Encode(webserver.ecuStatus); err != nil {
		log.Warnf("disconnect error (%+v)", err)
	}
}

func (webserver *WebServer) apiECUSendCommand(w http.ResponseWriter, r *http.Request) {
	defer webserver.handleResponseBodyClose(r)

	if !webserver.ecuStatus.Connected {
		w.WriteHeader(http.StatusServiceUnavailable)
		log.Warnf("send command - ecu not connected")
		return
	}

	// read the ecu command from the post body
	var ecuCommandResponse ECUCommandResponse
	if err := json.NewDecoder(r.Body).Decode(&ecuCommandResponse); err != nil {
		log.Errorf("%+v", err)
	} else {
		if command, err := hex.DecodeString(ecuCommandResponse.Command); err == nil {
			if response, err := webserver.ecuReader.SendAndReceive(command, ecuCommandResponse.ExpectedSize); err == nil {
				ecuCommandResponse.Response = hex.EncodeToString(response)

				if err := json.NewEncoder(w).Encode(ecuCommandResponse); err != nil {
					log.Warnf("send command error (%+v)", err)
				}
			}
		} else {
			log.Warnf("send command error (%+v)", err)
		}
	}
}

func (webserver *WebServer) apiECUGetAvailableSerialPorts(w http.ResponseWriter, r *http.Request) {
	defer webserver.handleResponseBodyClose(r)

	ports := webserver.getSerialPorts()

	availablePorts := AvailablePorts{Ports: ports}

	if err := json.NewEncoder(w).Encode(&availablePorts); err != nil {
		// return a error code
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

func (webserver *WebServer) handleResponseBodyClose(r *http.Request) {
	// handle the response body
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			log.Warnf("error closing response body (%+v)", err)
		}
	}(r.Body)
}
