#https://gis.stackexchange.com/questions/66/trilateration-using-3-latitude-longitude-points-and-3-Distances[0]nces

from math import cos, sin, radians, degrees, asin, atan2, pow, sqrt
import numpy 
from geopy import distance


earthR = 6371

#computes the distance according to Sadowski's model
#input : tuple of 3 RSSIs
def computeDistances(RSSI, n=7, C=25):
    output = []
    for Pr in RSSI:
        output.append(pow(10.0,((C-Pr)/(10.0*n))))
    return output

def computeCoordinates(GWCoordinates, Distances):
    minLat = min(GWCoordinates[0][0],GWCoordinates[1][0],GWCoordinates[2][0]) -.0001
    minLon = min(GWCoordinates[0][1],GWCoordinates[1][1],GWCoordinates[2][1]) -.0001
    maxLat = max(GWCoordinates[0][0],GWCoordinates[1][0],GWCoordinates[2][0]) +.0001
    maxLon = max(GWCoordinates[0][1],GWCoordinates[1][1],GWCoordinates[2][1]) +.0001

    minDist = 999
    minCoord = (0,0)

    for k in numpy.arange(minLat, maxLat, .0001):
        for i in numpy.arange(minLon, maxLon, .0001):
            #avgdist = sqrt(pow(Distances[0] - getDistance(GWCoordinates[0],(k,i)),2) + pow(Distances[1] - getDistance(GWCoordinates[1],(k,i)), 2)  + pow(Distances[2] - getDistance(GWCoordinates[2],(k,i)), 2))
            avgdist = abs(Distances[0]-getDistance(GWCoordinates[0], (k,i))) + abs(Distances[1]-getDistance(GWCoordinates[1], (k,i))) + abs(Distances[2]-getDistance(GWCoordinates[2], (k,i)))
            if  avgdist < minDist:
                minDist = avgdist
                minCoord = (k,i)
    return minCoord


def getDistance(coord1, coord2):
    d = distance.distance(coord1, coord2).m
    return d