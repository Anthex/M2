from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.sql import func
import geojson

DBNAME='objects.db'

engine = create_engine('sqlite:///'+DBNAME,connect_args={'check_same_thread': False})
base = declarative_base()
Session = sessionmaker(bind=engine)
session = Session()

class GW(base):
    __tablename__ = "GW"
    ID = Column(Integer, primary_key=True, autoincrement=True)
    position = Column(Integer, ForeignKey("position.ID"))

class TM(base):
    __tablename__ = "TM"
    ID = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(String)

class TM_record(base):
    __tablename__ = "TM_record"
    ID = Column(Integer, primary_key=True, autoincrement=True)
    position = Column(Integer, ForeignKey("position.ID"))
    TM_ID = Column(Integer, ForeignKey("TM.ID"))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class position(base):
    __tablename__ = "position"
    ID = Column(Integer, primary_key=True, autoincrement=True)
    Latitude = Column(Float)
    Longitude = Column(Float)


#returns WGS locations of GWs as [(GW1lat, GW1lon), (GW2lat, GW2lon), (GW3lat, GW3lon)]
def getGWLocations():
    output = []
    GWs = session.query(GW).all()
    for g in GWs:
        loc = session.query(position).filter(position.ID == g.position).all()[0]
        output.append((loc.Latitude, loc.Longitude))
    return output

#builds the geoJSON file containing the info about the GWs
def generateGWJson():
    GWs = session.query(GW).all()
    Coordinates = []
    for k in GWs:
        pos = session.query(position).filter(position.ID == k.ID).all()[0]
        Coordinates.append((pos.Longitude,pos.Latitude, k.ID))
    newJSON = '{"type":"FeatureCollection","features":['
    for c in Coordinates:
        newJSON += f'{{"type":"Feature","properties":{{"id":{c[2]}}},"geometry":{{"type":"Point","coordinates":[{c[0]},{c[1]}]}}}}'
        if c != Coordinates[-1]:
            newJSON += ','
    newJSON += ']}'
    newFile = open("static/GW.geojson", "w+")
    newFile.write(newJSON)
    return True

#builds the geoJSON file containing the info about the TMs
def generateTMJson():
    TMs = session.query(TM).all()
    Coordinates = []
    for k in TMs:
        lastRecord = session.query(TM_record).filter(TM_record.TM_ID == k.ID).all()[-1]
        pos = session.query(position).filter(position.ID == lastRecord.position).all()[0]
        Coordinates.append((pos.Longitude,pos.Latitude, k.ID, lastRecord.timestamp,k.Name))
    newJSON = '{"type":"FeatureCollection","features":['
    for c in Coordinates:
        newJSON += f'{{"type":"Feature","properties":{{"id":{c[2]}, "timestamp":"{c[3]}", "name":"{c[4]}"}},"geometry":{{"type":"Point","coordinates":[{c[0]},{c[1]}]}}}}'
        if c != Coordinates[-1]:
            newJSON += ','
    newJSON += ']}'
    newFile = open("static/TM.geojson", "w+")
    newFile.write(newJSON)
    return True

def generateTMHistory(id, nbRecords=20):
    history = session.query(TM_record).filter(TM_record.TM_ID == id).all()[-nbRecords:]
    newJSON = '{"type":"FeatureCollection","features":['
    for record in history:
        currentPos = session.query(position).filter(position.ID == record.position).all()[0]
        newJSON += f'{{"type":"Feature","properties":{{"id":{id},"record_id":{record.ID},"timestamp":"{record.timestamp}"}},"geometry":{{"type":"Point","coordinates":[{currentPos.Longitude},{currentPos.Latitude}]}}}}'
        if record != history[-1]:
            newJSON += ','
    newJSON += ']}'
    newFile = open("static/history.geojson", "w+")
    newFile.write(newJSON)
    return True

def generateTMHistoryPath(id,nbRecords=20):
    history = session.query(TM_record).filter(TM_record.TM_ID == id).all()[-nbRecords:]
    newJSON = '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":['
    for record in history:
        currentPos = session.query(position).filter(position.ID == record.position).all()[0]
        newJSON += f'[{currentPos.Longitude},{currentPos.Latitude}]'
        if record != history[-1]:
            newJSON += ','
    newJSON += ']}}]}'
    newFile = open("static/history_path.geojson", "w+")
    newFile.write(newJSON)
    return True

#adds latest computed position to db
def storeNewTMLocation(id, coord):
    newPos = position(Latitude=coord[0], Longitude=coord[1])
    session.add(newPos)
    session.commit()
    newRecord = TM_record(TM_ID = id, position = newPos.ID)
    session.add(newPos)
    session.add(newRecord)
    session.commit()

def updateGWLocations(newLocs):
    GWas = session.query(GW).all()
    for k in GWas:
        currentLocation = session.query(position).filter(position.ID == k.position).all()[0]
        currentLocation.Latitude = newLocs[k.ID - 1][0]
        currentLocation.Longitude = newLocs[k.ID - 1][1]
    session.commit()

def changeName(id, newName):
    tmToChange = session.query(TM).filter(TM.ID == id).all()[0]
    if tmToChange and len(newName) > 0:
        tmToChange.Name = newName
        session.commit()
        return True
    return False