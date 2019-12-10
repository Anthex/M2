pip3 install flask requests geojson geopy sqlalchemy numpy

export FLASK_ENV = development
export FLASK_APP = app.py

cat schema.sql | sqlite3
cat user_schema | sqlite3