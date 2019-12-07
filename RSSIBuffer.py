

incompleteSamples = {}

def addRSSI(id, gwid, rssi):
    if id in incompleteSamples:
        incompleteSamples[id][gwid-1] = rssi
        if (incompleteSamples[id][0] and incompleteSamples[id][1] and incompleteSamples[id][2]):
            completeSample = incompleteSamples[id]
            incompleteSamples[id] = [0,0,0]
            return completeSample
        else:
            return False
    else:
        incompleteSamples[id] = [0,0,0]
        incompleteSamples[id][gwid-1]=rssi
        return False

print("imported")