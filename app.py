from flask import Flask, render_template, request
import requests
import database
import trilateration
import RSSIBuffer
from flask.logging import create_logger
from werkzeug.datastructures import ImmutableMultiDict
import random
import urllib

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
     return render_template('dashboard.html', css_mobile_url="static/css_mobile.css", css_url="static/style.css", mapscript_url="static/map.js", heat_url="static/leaflet-heat.js")

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

#incoming : 3 RSSIs + ID, output : WGS coordinates + ID (stored in db)
#check request with regex
@app.route("/processSample", methods=['POST', 'GET'])
def processRS():
     #get GW positions
     GWLocations = database.getGWLocations()
     #compute distances
     distances = trilateration.computeDistancesFriis([float(request.args.get("d1")),float(request.args.get("d2")),float(request.args.get("d3"))])
     log.info([float(request.args.get("d1")),float(request.args.get("d2")),float(request.args.get("d3"))])
     log.info(trilateration.computeDistances([float(request.args.get("d1")),float(request.args.get("d2")),float(request.args.get("d3"))]))
     log.info(trilateration.computeDistancesFriis([float(request.args.get("d1")),float(request.args.get("d2")),float(request.args.get("d3"))]))
     #distances = trilateration.computeDistances([random.randint(-100, 0),random.randint(-100, 0),random.randint(-100, 0)])
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

#args : GW ID, RSSI value, TM id
@app.route("/processRSSI", methods=['POST', 'GET'])
def processRSSI():
     rssi = float(request.args.get("rssi"))
     id = int(request.args.get("id"))
     gwid = int(request.args.get("gwid"))
     result = RSSIBuffer.addRSSI(id, gwid, rssi)
     log.info(RSSIBuffer.incompleteSamples)
     if result:
          requests.post("http://localhost:5000/processSample?id="+str(id)+"&d1="+str(result[0])+"&d2="+str(result[1])+"&d3="+str(result[2]))
          return "new sample processed"
     return "no complete samples"

@app.route("/updateGWLocations", methods=['POST', 'GET'])
def updateGWLocations():
     newInfo = request.get_json()
     newInfo_array = []
     for k in newInfo:
          newInfo_array.append(((k["l"]["lat"]), (k["l"]["lng"])))
     database.updateGWLocations(newInfo_array)
     database.generateGWJson()
     return ("success", 200)

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