#!/bin/sh
# Deploy the master branch live on appengine.
# Before running this script, python appengine SDK needs to be installed first. See https://cloud.google.com/appengine/downloads

appcfg.py update appengine-root/
