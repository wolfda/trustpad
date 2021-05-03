#!/bin/sh
# Deploy the master branch live on appengine.
# Before running this script, python appengine SDK needs to be installed first. See https://cloud.google.com/appengine/downloads

gcloud config set project trust-pad
gcloud app deploy appengine-root/app.yaml
