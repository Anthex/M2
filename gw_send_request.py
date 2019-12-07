import urllib2
import urllib
import sys

url = 'http://192.168.1.61:5000/processRSSI?rssi=' + sys.argv[1] + '&id=' + sys.argv[2] + '&gwid=' + "1"
req = urllib2.Request(url)

#send request
code = type = 0

try:
   handler = urllib2.urlopen(req)
   code = handler.getcode()
except:
   print("error")
   code = -1

if code == 200:
   print("Requete envoyee avec succes.")
elif code == 401:
   print("Erreur d'authentification")
else:
   print("Erreur d'envoi de la requete. Code " + str(code))