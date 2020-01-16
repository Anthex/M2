pip3 install flask requests geojson geopy sqlalchemy numpy Flask-Assets jsmin cssmin

export FLASK_ENV = development
export FLASK_APP = app.py

cat db/schema.sql | sqlite3
cat db/user_schema.sql | sqlite3
cat db/fingerprint_schema.sql | sqlite3