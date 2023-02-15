EXECUTABLE=memsfcr
APPNAME=MemsFCR
DISTPATH=.
RESOURCESPATH=./Resources
DARWINDISTPATH=.
EXEPATH=$(DARWINDISTPATH)/$(EXECUTABLE)
MIN_DEPLOYMENT_TARGET=-mmacosx-version-min=11.6.7

DEVID="Developer ID Application: Andrew Jackson (MD9E767XF5)"
LOCAL_DISTID="Developer ID Application: Andrew Jackson (MD9E767XF5)"
LOCAL_INSTID="Developer ID Installer: Andrew Jackson (MD9E767XF5)"
STORE_DISTID="3rd Party Mac Developer Application: Andrew Jackson (MD9E767XF5)"
STORE_INSTID="3rd Party Mac Developer Installer: Andrew Jackson (MD9E767XF5)"

.PHONY: clean

package: package_local_app notarize_local_package
build: build_darwin
local: build_darwin sign_app_local package_local_app notarize_local_package
sign: sign_app_local
#store: build_darwin create_darwin_app sign_app_store upload_app_to_store

build_darwin:
	 /usr/local/bin/python3 -m nuitka --include-data-dir=../app/static=static --include-data-dir=../app/templates=templates --macos-disable-console --macos-create-app-bundle --standalone --macos-app-icon=../app/static/images/icon.icns ../app/memsfcr.py

sign_app_local:
	# sign with the app
	codesign --force  --deep --verify --verbose=4 -s $(DEVID) --timestamp --options runtime "$(DARWINDISTPATH)/$(APPNAME).app/Contents/MacOS/$(EXECUTABLE)" "$(DARWINDISTPATH)/$(APPNAME).app"
	# build and sign installer PKG
	#productbuild --component $(DARWINDISTPATH)/$(APPNAME).app /Applications --sign $(LOCAL_INSTID) --product $(DARWINDISTPATH)/$(APPNAME).app/Contents/Info.plist $(DARWINDISTPATH)/$(APPNAME).pkg
	# sign the PKG with the entitlements
	#codesign --force  --deep --verify --verbose=4 -s $(LOCAL_DISTID) --timestamp --entitlements "$(DARWINDISTPATH)/$(APPNAME).app/Contents/entitlements.plist" --options runtime "$(DARWINDISTPATH)/$(APPNAME).app/Contents/MacOS/$(EXECUTABLE)" "$(DARWINDISTPATH)/$(APPNAME).pkg"

sign_app_store:
	# sign with the app
	codesign --force  --deep --verify --verbose=4 -s $(STORE_DISTID) --timestamp --entitlements "$(DARWINDISTPATH)/$(APPNAME).app/Contents/entitlements.plist" --options runtime "$(DARWINDISTPATH)/$(APPNAME).app/Contents/MacOS/$(EXECUTABLE)" "$(DARWINDISTPATH)/$(APPNAME).app"
	# build and sign the installer PKG
	productbuild --component $(DARWINDISTPATH)/$(APPNAME).app /Applications --sign $(STORE_INSTID) --product $(DARWINDISTPATH)/$(APPNAME).app/Contents/Info.plist $(DARWINDISTPATH)/$(APPNAME).pkg
	# sign the PKG with the entitlements
	codesign --force  --deep --verify --verbose=4 -s $(STORE_DISTID) --timestamp --entitlements "$(DARWINDISTPATH)/$(APPNAME).app/Contents/entitlements.plist" --options runtime "$(DARWINDISTPATH)/$(APPNAME).app/Contents/MacOS/$(EXECUTABLE)" "$(DARWINDISTPATH)/$(APPNAME).pkg"


package_local_app:
	rm -f $(DARWINDISTPATH)/$(APPNAME).dmg
	# create a DMG for local distributions
	appdmg $(DISTPATH)/dmgspec.json $(DARWINDISTPATH)/$(APPNAME).dmg

notarize_local_package:
	# notarize the DMG
	xcrun notarytool submit $(DARWINDISTPATH)/$(APPNAME).dmg --wait --keychain-profile "APPLEDEV"
	#xcrun altool --notarize-app -f $(DARWINDISTPATH)/$(APPNAME).dmg --primary-bundle-id "com.github.andrewdjackson.memsfcr" -u $(APPLEDEVUSR) -p $(APPLEDEVPWD)

	# notarize the PKG
	xcrun notarytool submit $(DARWINDISTPATH)/$(APPNAME).pkg --wait --keychain-profile "APPLEDEV"
	#xcrun altool --notarize-app -f $(DARWINDISTPATH)/$(APPNAME).pkg --primary-bundle-id "com.github.andrewdjackson.memsfcr" -u $(APPLEDEVUSR) -p $(APPLEDEVPWD)

	#
	# if successful staple the app for offline installation
	xcrun stapler staple $(DARWINDISTPATH)/$(APPNAME).app & xcrun stapler staple $(DARWINDISTPATH)/$(APPNAME).pkg & xcrun stapler staple $(DARWINDISTPATH)/$(APPNAME).dmg

upload_app_to_store:
	xcrun altool --upload-app -f $(DARWINDISTPATH)/$(APPNAME).pkg --primary-bundle-id "com.github.andrewdjackson.memsfcr" -u $(APPLEDEVUSR) -p $(APPLEDEVPWD)


clean: ## Remove previous build
	rm -fr $(DISTPATH)/$(APPNAME).app
	rm -fr $(DISTPATH)/$(APPNAME).build
	rm -fr $(DISTPATH)/$(APPNAME).dist
	rm -fr $(DISTPATH)/Resources
	rm -f $(DISTPATH)/Info.plist
	rm -f $(DISTPATH)/$(APPNAME)
	rm -fr $(DISTPATH)/$(APPNAME).dmg
	rm -fr $(DISTPATH)/$(APPNAME).pkg


help: ## Display available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
