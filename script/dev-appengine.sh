rm -rf appengine-root
mkdir appengine-root
ln -s $PWD/config/app.yaml appengine-root/
ln -s $PWD/public/* appengine-root/
dev_appserver.py appengine-root
