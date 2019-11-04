from flask import Flask, render_template, request
import requests
import database
import trilateration
import RSSIBuffer
from flask.logging import create_logger
from werkzeug.datastructures import ImmutableMultiDict
import random

app = Flask(__name__,static_url_path='/static')
log = create_logger(app)
database.generateTMJson()
database.generateGWJson()


app.config.update(
     ENV = "development"
)

if __name__ == "__main__":
     app.run(debug=True,host='0.0.0.0')

def readJSON(name):
     return app.open_resource('static/'+name+'.geojson').read().decode('UTF-8')

@app.route("/")
def dashboard():
     #app.logger.info(GWs)

     database.generateTMJson()
     return render_template('dashboard.html', css_url="static/style.css", mapscript_url="static/map.js")

#update record TM GeoJSON
@app.route("/update")
def update():
     database.generateTMJson()
     return ""

#return geoJSON file containing the latest position for all terminals
@app.route("/getTerminalPositions")
def getTerminalPositions():
     return app.send_static_file("TM.geojson")

#return geoJSON file containing the GW positions
@app.route("/getGatewayPositions",methods=['GET'])
def getGatewayPositions():
     return app.send_static_file("GW.geojson")

#incoming : 3 RSSIs + ID, output : WSG coordinates + ID (stored in db)
#check request with regex
@app.route("/processSample", methods=['POST', 'GET'])
def processRS():
     #get GW positions
     GWLocations = database.getGWLocations()
     #compute distances
     #distances = trilateration.computeDistances([int(request.args.get("d1")),int(request.args.get("d3")),int(request.args.get("d3"))])
     distances = trilateration.computeDistances([random.randint(-100, 0),random.randint(-100, 0),random.randint(-100, 0)])
     #trilateration
     TMCoordinates = trilateration.computeCoordinates(GWLocations, distances)
     #store in DB
     log.info("TMCoordinates")
     database.storeNewTMLocation(int(request.args.get("id")), TMCoordinates)
     return str(TMCoordinates)

@app.route("/beep")
def sendBeepRequest():
     return False

@app.route("/history")
def generateHistory():
     database.generateTMHistory(int(request.args.get("id")))
     return app.send_static_file("history.geojson")

@app.route("/history_path")
def generateHistoryPath():
     database.generateTMHistoryPath(int(request.args.get("id")))
     return app.send_static_file("history_path.geojson")

#args : GW ID, RSSI value
@app.route("/processRSSI")
def processRSSI():
     rssi = int(request.args.get("rssi"))
     return ""

@app.route("/updateGWLocations", methods=['POST'])
def updateGWLocations():
     newInfo = request.get_json()
     newInfo_array = []
     for k in newInfo:
          newInfo_array.append(((k["l"]["lat"]), (k["l"]["lng"])))
     database.updateGWLocations(newInfo_array)
     database.generateGWJson()
     return ""

#debug : disable cache
@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r