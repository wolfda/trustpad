#!/bin/sh
# Starts a dev appengine server on port 8080
# Before running this script, python appengine SDK needs to be installed first. See https://cloud.google.com/appengine/downloads

rm -rf appengine-root
mkdir appengine-root
ln -s $PWD/config/app.yaml appengine-root/
ln -s $PWD/public/* appengine-root/
dev_appserver.py appengine-root
