EXECUTABLE=memsfcr
APPNAME=MemsFCR

APP_PATH=app
DIST_PATH=dist
DARWIN_DIST_PATH=dist/darwin
RESOURCES_PATH=app/static
DARWIN_APP_CONTENTS=$(DARWIN_DIST_PATH)/$(APPNAME).app/Contents

EXEPATH=$(DARWIN_DIST_PATH)/$(EXECUTABLE)
MIN_DEPLOYMENT_TARGET=-mmacosx-version-min=11.6.7

DEVID="Developer ID Application: Andrew Jackson (MD9E767XF5)"
LOCAL_DISTID="Developer ID Application: Andrew Jackson (MD9E767XF5)"
LOCAL_INSTID="Developer ID Installer: Andrew Jackson (MD9E767XF5)"
STORE_DISTID="3rd Party Mac Developer Application: Andrew Jackson (MD9E767XF5)"
STORE_INSTID="3rd Party Mac Developer Installer: Andrew Jackson (MD9E767XF5)"

.PHONY: clean

# build go and create a macos app
build: build_go create_darwin_app
# build go and create an unsigned  macos app and dmg package
build-package: build_go create_darwin_app package_local_app
# build go and create a signed macos app and dmg package, and notarize
all: build_go create_darwin_app sign_app_local package_local_app notarize_local_package

build_go:
	cd $(APP_PATH) && env GOOS=darwin GOARCH=amd64 CGO_CFLAGS="$(MIN_DEPLOYMENT_TARGET)" CGO_LDFLAGS="$(MIN_DEPLOYMENT_TARGET)" go build -v -o "../$(DARWIN_DIST_PATH)/$(EXECUTABLE)" -ldflags="-s -w"

create_darwin_app:
	# copy the binary to the distribution folder
	cp -f "$(DARWIN_DIST_PATH)/$(EXECUTABLE)" "$(RESOURCES_PATH)/$(EXECUTABLE)"
	# create the MacOS app
	$(DIST_PATH)/macapp --assets "$(RESOURCES_PATH)" -bin "$(EXECUTABLE)" -icon "$(DIST_PATH)/MemsFCR-APP-Icon.png" -identifier "com.github.andrewdjackson.memsfcr" -name "$(APPNAME)" -o "$(DARWIN_DIST_PATH)"

	# tidy up
	rm -f "$(RESOURCES_PATH)/$(EXECUTABLE)"

	# move static html files into the correct place
	mkdir "$(DARWIN_APP_CONTENTS)/Resources/static"
	mv "$(DARWIN_APP_CONTENTS)/Resources/images" "$(DARWIN_APP_CONTENTS)/Resources/static/images"
	mv "$(DARWIN_APP_CONTENTS)/Resources/scripts" "$(DARWIN_APP_CONTENTS)/Resources/static/scripts"
	mv "$(DARWIN_APP_CONTENTS)/Resources/styles" "$(DARWIN_APP_CONTENTS)/Resources/static/styles"
	mv "$(DARWIN_APP_CONTENTS)/Resources/templates" "$(DARWIN_APP_CONTENTS)/Resources/static/templates"
	mv "$(DARWIN_APP_CONTENTS)/Resources/favicon.ico" "$(DARWIN_APP_CONTENTS)/Resources/static/"

	# copy the info and entitlement plists into the application structure
	cp -f "$(DIST_PATH)/MemsFCR-APP-Info.plist" "$(DARWIN_APP_CONTENTS)/Info.plist"
	cp -f "$(DIST_PATH)/MemsFCR-APP-entitlements.plist" "$(DARWIN_APP_CONTENTS)/entitlements.plist"
	cp -f "$(RESOURCES_PATH)/../index.html" "$(DARWIN_APP_CONTENTS)/Resources/index.html"

sign_app_local:
	# sign with the app
	#codesign --force  --deep --verify --verbose=4 -s $(DEVID) --entitlements "$(DARWINDISTPATH)/MemsFCR-APP-entitlements.plist" --timestamp --options runtime "$(DARWINDISTPATH)/$(APPNAME).app/Contents/MacOS/$(EXECUTABLE)" "$(DARWINDISTPATH)/$(APPNAME).app"
	codesign -s $(DEVID) -vvv --deep --timestamp --force --entitlements "$(DIST_PATH)/MemsFCR-APP-entitlements.plist" -o runtime "$(DARWIN_DIST_PATH)/$(APPNAME).app"

package_local_app:
	-rm -f $(DARWIN_DIST_PATH)/$(APPNAME).dmg

	# create a DMG for local distributions
	appdmg $(DIST_PATH)/dmgspec.json $(DARWIN_DIST_PATH)/$(APPNAME).dmg

notarize_local_package:
	# notarize the DMG
	xcrun notarytool submit $(DARWIN_DIST_PATH)/$(APPNAME).dmg --wait --keychain-profile "APPLEDEV"

	# if successful staple the app for offline installation
	xcrun stapler staple $(DARWIN_DIST_PATH)/$(APPNAME).app & xcrun stapler staple $(DARWIN_DIST_PATH)/$(APPNAME).dmg

clean: ## Remove previous build
	rm -fr $(DIST_PATH)/darwin

help: ## Display available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
