#!/usr/bin/env python

# Manipulate sys.path to be able to import rivescript from this local git
# repository.
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from flask import Flask, request, Response, jsonify, render_template, send_from_directory
import json
from rivescript import RiveScript
import requests

# Set up the RiveScript bot. This loads the replies from `/eg/brain` of the
# git repository.
bot = RiveScript()
bot.load_directory(
    os.path.join(os.path.dirname(__file__), ".", "brain")
)
bot.sort_replies()

app = Flask(__name__)

@app.route('/tftest/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')


@app.route('/tftest/<string:page_name>/')
def static_page(page_name):
    return render_template('%s.html' % page_name)

@app.route("/tftest/reply", methods=["POST"])
def reply():
    """Fetch a reply from RiveScript.

    Parameters (JSON):
    * username
    * message
    * vars
    """
    params = request.json
    if not params:
        return jsonify({
            "status": "error",
            "error": "Request must be of the application/json type!",
        })

    username = params.get("username")
    message  = params.get("message")
    uservars = params.get("vars", dict())

    # Make sure the required params are present.
    if username is None or message is None:
        return jsonify({
            "status": "error",
            "error": "username and message are required keys",
        })

    # Copy and user vars from the post into RiveScript.
    if type(uservars) is dict:
        for key, value in uservars.items():
            bot.set_uservar(username, key, value)

    # Get a reply from the bot.
    reply = bot.reply(username, message)

    # Get all the user's vars back out of the bot to include in the response.
    uservars = bot.get_uservars(username)

    # Send the response.
    return jsonify({
        "status": "ok",
        "reply": reply,
        "vars": uservars,
    })


@app.route("/tftest/tenor",methods=["POST"])
def giphy():
    params = request.json
    if not params:
        return jsonify({
            "status": "error",
            "error": "Request must be of the application/json type!",
        })

    query  = params.get("query")

    # Make sure the required params are present.
    if query is None:
        return jsonify({
            "status": "error",
            "error": "query are required keys",
        })

    # Form URL Giphy.
    url = 'https://api.tenor.com/v1/search/?'
    key = '&k=M59QNHFYGEQQ'
    fullurl = url+key+'&q='+query
    print(fullurl)
    r = requests.get(fullurl)

    if r.status_code == 200:
        return r.text
    else:
        return jsonify({})

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
