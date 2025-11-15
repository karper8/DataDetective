from flask import Flask, request, jsonify, session, redirect, url_for, send_from_directory, render_template_string
from flask_cors import CORS
from pymongo import MongoClient
import certifi
import os
from datetime import datetime, timezone, timedelta
from dateutil import tz
from dotenv import load_dotenv

load_dotenv()

# ------------------- INITIAL SETUP ------------------- #

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set in environment")

client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

app.secret_key = "supersecretkey123"

db = client["data_detective"]
sub_col = db["submissions"]

ADMIN_USER = "admin@123"
ADMIN_PASS = "HelloWorld!"

# ------------------- PARTICIPANT ENDPOINTS ------------------- #

@app.route("/start", methods=["POST"])
def start():
    data = request.get_json()
    team = data.get("team")
    start_time = data.get('timestamp')

    if not team:
        return jsonify({"error": "Team name required"}), 400

    existing = sub_col.find_one({"team": team})
    if existing:
        return jsonify({"message": "Welcome back, resuming your session."}), 200

    sub_col.insert_one({
        "team": team,
        "start_time": start_time,
        "level1": {},
        "level2": {},
        "level3": {},
        "final": {}
    })

    return jsonify({"message": f"Session started for {team}"}), 200


@app.route("/submit-level", methods=["POST"])
def submit_level():
    data = request.get_json()
    team = data.get("team")
    level = data.get("level")
    answer = data.get("answer")
    attempts = data.get("attempts", 1)
    timestamp = data.get("timestamp")

    if not all([team, level, answer]):
        return jsonify({"error": "Missing data"}), 400

    IST = timezone(timedelta(hours=5, minutes=30))
    ts = datetime.fromisoformat(timestamp.replace("Z", "+00:00")).astimezone(IST)

    sub_col.update_one(
        {"team": team},
        {"$set": {
            f"level{level}": {
                "answer": answer,
                "attempts": attempts,
                "timestamp": ts
            }
        }}
    )

    return jsonify({"message": f"Level {level} recorded"}), 200


@app.route("/submit-final", methods=["POST"])
def submit_final():
    data = request.get_json()
    team = data.get("team")
    a1 = data.get("answer1")
    a2 = data.get("answer2")
    attempts = data.get("attempts", 1)
    timestamp = data.get("timestamp")

    if not all([team, a1, a2]):
        return jsonify({"error": "Missing data"}), 400

    sub_col.update_one(
        {"team": team},
        {"$set": {
            "final": {
                "answer1": a1,
                "answer2": a2,
                "attempts": attempts,
                "timestamp": timestamp
            },
            "completed": True
        }}
    )

    return jsonify({"message": "Final answers recorded"}), 200


# ------------------- ADMIN LOGIN ------------------- #

login_html = """
<!DOCTYPE html>
<html>
<head>
  <title>Admin Login</title>
  <style>
    body { font-family: Arial; background:#0e0e0e; color:#eee; text-align:center; padding-top:100px; }
    input { margin:10px; padding:8px; width:200px; }
    button { padding:8px 20px; }
  </style>
</head>
<body>
  <h2>Admin Login</h2>
  <form method="POST" action="/admin/login">
    <input type="text" name="username" placeholder="Username" required><br>
    <input type="password" name="password" placeholder="Password" required><br>
    <button type="submit">Login</button>
  </form>
</body>
</html>
"""

@app.route("/admin", methods=["GET"])
def admin_login_page():
    if session.get("logged_in"):
        return redirect(url_for("results_page"))
    return render_template_string(login_html)


@app.route("/admin/login", methods=["POST"])
def admin_login():
    if request.is_json:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
    else:
        username = request.form.get("username")
        password = request.form.get("password")

    if username == ADMIN_USER and password == ADMIN_PASS:
        session["logged_in"] = True
        return jsonify({"success": True, "message": "Login successful"}), 200
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401


# ------------------- RESULTS ------------------- #

@app.route("/results", methods=["GET"])
def get_results():
    IST = timezone(timedelta(hours=5, minutes=30))

    def to_ist_dt(value):
        if not value:
            return None
        if isinstance(value, str):
            try:
                dt = datetime.fromisoformat(value)
            except:
                return None
        elif isinstance(value, datetime):
            dt = value
        else:
            return None

        if dt.tzinfo is None:
            return dt.replace(tzinfo=IST)
        return dt.astimezone(IST)

    def format_delta(delta):
        if not delta:
            return "-"
        total_seconds = int(delta.total_seconds())
        hours, rem = divmod(total_seconds, 3600)
        minutes, seconds = divmod(rem, 60)
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        return f"{minutes}m {seconds}s"

    teams = list(sub_col.find({}, {"_id": 0}))
    results = []

    for team in teams:
        start_raw = team.get("start_time")
        final_obj = team.get("final", {})
        final_raw = final_obj.get("timestamp")

        start_ist = to_ist_dt(start_raw)
        final_ist = to_ist_dt(final_raw)

        delta = (final_ist - start_ist) if start_ist and final_ist else None
        total_time = format_delta(delta)

        def level_info(lvl):
            d = team.get(f"level{lvl}", {})
            ts = to_ist_dt(d.get("timestamp"))
            ts_str = ts.strftime("%Y-%m-%d %H:%M:%S") if ts else "-"
            return {
                "status": "Yes" if d.get("answer") else "-",
                "attempts": d.get("attempts", "-"),
                "timestamp": ts_str
            }

        results.append({
            "team": team.get("team", "-"),
            "start_time": start_raw,
            "level1": level_info(1),
            "level2": level_info(2),
            "level3": level_info(3),
            "final": final_obj,
            "total_time": total_time
        })

    return jsonify(results), 200


# ------------------- DOWNLOAD DATASET ------------------- #

@app.route("/download/<level>")
def download_dataset(level):
    dataset_folder = "datasets"
    file_map = {
        "1": "access_logs(Level 1).csv",
        "2": "transaction_logs(Level 2).csv",
        "3": "shipment_data(Level 3).csv"
    }
    filename = file_map.get(level)
    if not filename:
        return jsonify({"error": "Invalid level"}), 404

    return send_from_directory(dataset_folder, filename, as_attachment=True)


# ------------------- MAIN ------------------- #

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
