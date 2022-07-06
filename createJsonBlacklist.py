import json



textFile = open("serverlist.txt", "r")

validUrls = []

#print(textFile.read())
for textLine in textFile:
    if(textLine.find("*") == -1):
        #print(textLine)
        textLine = textLine.rstrip("\n")
        validUrls.append(textLine)
textFile.close()

jsonString = json.dumps(validUrls)

blacklistFile = open("blacklist.json", "w")
blacklistFile.write(jsonString)
blacklistFile.close()

#print(os.path.exists("myfile.txt"))
