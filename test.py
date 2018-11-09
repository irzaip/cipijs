import requests
import json
# set the apikey and limit the # coming back
apikey = "M59QNHFYGEQQ"  # test value
lmt = 20

# load the user's anonymous ID from cookies or some other disk storage
# anon_id = <from db/cookies>

# ELSE - first time user, grab and store their the anonymous ID
r = requests.get("https://api.tenor.com/v1/anonid?key=%s" % apikey)

if r.status_code == 200:
    anon_id = json.loads(r.content)["anon_id"]
    # store in db/cookies for re-use later
else:
    anon_id = ""

# partial search
psearch = "domain"

r = requests.get(
    "https://api.tenor.com/v1/search?key=%s&q=%s&anon_id=%s&limit=%s" % (apikey, psearch, anon_id, lmt))

if r.status_code == 200:
    # return the search predictions
    search_term_list = json.loads(r.content)["results"]
    print(search_term_list)
else:
    # handle a possible error
    search_term_list = []#test python
