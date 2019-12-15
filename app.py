from flask import Flask, render_template, request
import requests
import database
import authentication
import trilateration
import RSSIBuffer
from flask.logging import create_logger
from werkzeug.datastructures import ImmutableMultiDict
import random
import urllib

from flask_assets import Environment, Bundle

app = Flask(__name__,static_url_path='/static')
log = create_logger(app)
database.generateTMJson()
database.generateGWJson()

assets = Environment(app)
assets.url = app.static_url_path
scss = Bundle('style/style.scss', filters='pyscss, cssmin', output='style/all.css')
assets.register('scss_all', scss)

js = Bundle('scripts/map.js', filters='jsmin', output='scripts/min/main.js')
assets.register('js_map', js)

app.config.update(
     ENV = "development"
)

if __name__ == "__main__":
     app.run(debug=True,host='0.0.0.0')     


def readJSON(name):
     return app.open_resource('static/geojson'+name+'.geojson').read().decode('UTF-8')

@app.route("/")
def dashboard():
     #app.logger.info(GWs)

     database.generateTMJson()
     return render_template('dashboard.html')

#update record TM GeoJSON
@app.route("/update")
def update():
     database.generateTMJson()
     return ""

#return geoJSON file containing the latest position for all terminals
@app.route("/getTerminalPositions")
def getTerminalPositions():
     database.generateTMJson()
     return app.send_static_file("geojson/TM.geojson")

#return geoJSON file containing the GW positions
@app.route("/getGatewayPositions",methods=['GET'])
def getGatewayPositions():
     return app.send_static_file("geojson/GW.geojson")

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
     return app.send_static_file("geojson/history.geojson")

@app.route("/history_path")
def generateHistoryPath():
     database.generateTMHistoryPath(int(request.args.get("id")))
     return app.send_static_file("geojson/history_path.geojson")

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
     username = request.args.get("username")
     token = request.args.get("token")
     request_validity = authentication.checkToken(username, token)
     if request_validity == 0:
          AC = authentication.getAccessStructure(username)
          if not AC:
               return ("Error when checking for access structure", 500)
          else:
               if not AC['can_edit_features']:
                    return ("User is not authorized to edit features", 401)
               else:
                    newInfo = request.get_json()
                    newInfo_array = []
                    for k in newInfo:
                         newInfo_array.append(((k["l"]["lat"]), (k["l"]["lng"])))
                    result = database.updateGWLocations(newInfo_array)
                    database.generateGWJson()
                    if result:
                         return ("success", 200)
                    else:
                         return ("error when updating GW locations", 500)
     elif request_validity == 1:
          return("Invalid Token", 400)
     elif request_validity == 2:
          return("Invalid user", 400)
     else:
          return("Server error", 500)

@app.route("/updateName", methods=['POST', 'GET'])
def updateName():
     id = int(request.args.get("id"))
     name = request.args.get("newName")
     username = request.args.get("username")
     token = request.args.get("token")
     request_validity = authentication.checkToken(username, token)
     if request_validity == 0:
          AC = authentication.getAccessStructure(username)
          if not AC:
               return ("Error when checking for access structure", 500)
          else:
               if not AC['can_edit_features']:
                    return ("User is not authorized to edit features", 401)
               else:
                    if id and len(name) > 0:
                         result = database.changeName(id, name)
                         return ("success", 200)
                    return ("error", 500)
                    if result:
                         return ("success", 200)
                    else:
                         return ("error when changing name", 500)
     elif request_validity == 1:
          return("Invalid Token", 400)
     elif request_validity == 2:
          return("Invalid user", 400)
     else:
          return("Server error", 500)


@app.route("/login")
def returnLoginForm():
     return render_template('login_signup.html')

@app.route("/adminPanel")
def renderAdmin():
     username = request.args.get("username")
     token = request.args.get("token")
     if not authentication.checkToken(username, token) and authentication.getAccessStructure(username)["is_admin"]:
          return render_template('admin.html')
     else:
          return ("Not authorized", 401)

@app.route("/authenticate")
def check_authentication():
     username = request.args.get("username")
     password_hash = request.args.get("password_hash")
     result = authentication.authenticate(username, password_hash)
     if result == 0:
          newTok = authentication.generateToken(username);
          if newTok == -1:
               return("Error when generating token", 500)
          else:
               return(newTok, 200)
     elif result == 1:
          return("Wrong password", 400)
     elif result == -1:
          return("User does not exist",401)

@app.route("/getPermissions")
def getPermissions():
     username = request.args.get("username")
     token = request.args.get("token")
     if username:
          return authentication.getPermissions(username, token)
     else:
          return ("Could not identify user", 401)

@app.route("/requestNewPermissions", methods=['POST'])
def requestNewPermissions():
     username = request.args.get("username")
     token = request.args.get("token")
     admin = int(request.args.get("admin") == "true")
     edit = int(request.args.get("edit") == "true")
     beep = int(request.args.get("beep") == "true")
     result = authentication.requestPermissions(username, token, admin, edit, beep)

     if result == 0:
          return ("OK", 200)
     elif result == -1:
          return ("Server error", 500)
     elif result == 1:
          return ("Invalid token", 401)
     elif result == 2:
          return ("user not found", 400)
     else:
          return ("Unknown error", 500)

@app.route("/register", methods = ['POST'])
def registerNewUser():
     username = request.args.get("username")
     pass_hash = request.args.get("pass_hash")
     newTok = authentication.generateToken(username, pass_hash)

     result = authentication.register(username, pass_hash)
     if result:
          return (newTok, 200)
     else:
          return("Server error", 500)

@app.route("/getPermissionsPending")
def getPermissionsPending():
     username = request.args.get("username")
     result = authentication.getPending(username)
     if result == -1:
          return ("Server error", 500)
     elif result == 1:
          return("1", 200)
     else:
          return("0", 200)

@app.route("/getPendingUsersNumber")
def getNotificationsNumber():
     return authentication.getPendingUsersNumber()

@app.route("/getUsers.json")
def generateUsersList():
     return authentication.generateUsersJSON()

#debug : disable cache
@app.after_request
def add_header(r):
     r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
     r.headers["Pragma"] = "no-cache"
     r.headers["Expires"] = "0"
     r.headers['Cache-Control'] = 'public, max-age=0'
     return r

