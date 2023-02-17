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

build-app: build_darwin
build-sign: build_darwin sign_app_local
build-package: build_darwin package_local_app
package: package_local_app notarize_local_package
all: build_darwin sign_app_local package_local_app notarize_local_package
sign: sign_app_local


build_darwin:
	/usr/local/bin/python3 -m nuitka --follow-imports --onefile --include-data-dir=../app/static=static --include-data-dir=../app/templates=templates --macos-disable-console --macos-create-app-bundle --standalone --macos-app-icon=MemsFCR-APP-Icon.png ../app/memsfcr.py
	#/usr/local/bin/python3 setup-py2app.py py2app
	mv memsfcr.app ./$(APPNAME).app
	#cp -f MemsFCR-APP-Info.plist ./$(APPNAME).app/Contents/Info.plist

add_static_files_to_package:
	mkdir "./$(APPNAME).app/Contents/Resources/static"
	cp -fr ./$(APPNAME).app/Contents/MacOS/static/* ./$(APPNAME).app/Contents/Resources/static
	mkdir "./$(APPNAME).app/Contents/Resources/templates"
	cp -fr ./$(APPNAME).app/Contents/MacOS/templates/* ./$(APPNAME).app/Contents/Resources/templates

sign_app_local:
	# sign with the app
	#codesign --force  --deep --verify --verbose=4 -s $(DEVID) --entitlements "$(DARWINDISTPATH)/entitlements.plist" --timestamp --options runtime "$(DARWINDISTPATH)/$(APPNAME).app/Contents/MacOS/$(EXECUTABLE)" "$(DARWINDISTPATH)/$(APPNAME).app"
	codesign -s $(DEVID) -vvv --deep --timestamp --force --entitlements "$(DARWINDISTPATH)/entitlements.plist" -o runtime "$(DARWINDISTPATH)/$(APPNAME).app"

sign_framework:
	find "$(DARWINDISTPATH)/${APPNAME}.app" -iname '*.so' -or -iname '*.dylib' | \
		while read libfile; \
			do codesign --force  --deep --verify --verbose=4 -s $(DEVID) --timestamp --options runtime "${libfile}"; \
		done;

package_local_app:
	-rm -f $(DARWINDISTPATH)/$(APPNAME).dmg

	# create a DMG for local distributions
	appdmg $(DISTPATH)/dmgspec.json $(DARWINDISTPATH)/$(APPNAME).dmg

notarize_local_package:
	# notarize the DMG
	xcrun notarytool submit $(DARWINDISTPATH)/$(APPNAME).dmg --wait --keychain-profile "APPLEDEV"

	# if successful staple the app for offline installation
	xcrun stapler staple $(DARWINDISTPATH)/$(APPNAME).app & xcrun stapler staple $(DARWINDISTPATH)/$(APPNAME).dmg

clean: ## Remove previous build
	rm -fr $(DISTPATH)/$(APPNAME).app
	rm -fr $(DISTPATH)/$(APPNAME).build
	rm -fr $(DISTPATH)/$(APPNAME).onefile-build
	rm -fr $(DISTPATH)/$(APPNAME).dist
	rm -fr $(DISTPATH)/Resources
	rm -f $(DISTPATH)/Info.plist
	rm -f $(DISTPATH)/$(APPNAME)
	rm -fr $(DISTPATH)/$(APPNAME).dmg
	rm -fr $(DISTPATH)/$(APPNAME).pkg
	rm -fr $(DISTPATH)/dist


help: ## Display available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
