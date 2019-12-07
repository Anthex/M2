pip3 install flask requests geojson geopy sqlalchemy

export FLASK_ENV = development
export FLASK_APP = app.py

cat schema.sql | sqlite3