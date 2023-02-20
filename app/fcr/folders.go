package fcr

import (
	log "github.com/sirupsen/logrus"
	"os"
	"path/filepath"
)

func GetAppFolder() string {
	// get the application binary current directory
	dir, err := os.Getwd()

	if err != nil {
		log.Warnf("error getting app folder %s", err)
	}

	return filepath.FromSlash(dir)
}
