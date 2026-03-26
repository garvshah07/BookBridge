from flask import Flask, request, send_file
from TTS.api import TTS
import os
import uuid

app = Flask(__name__)

# 🔥 DO NOT LOAD MODEL HERE
tts = None

def get_tts():
    global tts
    if tts is None:
        print("Loading TTS model...")
        tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")
        print("TTS model loaded ✅")
    return tts


@app.route("/")
def home():
    return {"status": "running"}  # 🔥 health check for Render


@app.route("/tts", methods=["POST"])
def generate_tts():
    data = request.json
    text = data.get("text")
    lang = data.get("lang", "en")

    if not text:
        return {"error": "Text required"}, 400

    # 🔥 load model ONLY when needed
    tts_model = get_tts()

    file_name = f"{uuid.uuid4()}.wav"
    file_path = os.path.join("/tmp", file_name)

    tts_model.tts_to_file(
        text=text,
        file_path=file_path,
        language=lang
    )

    return send_file(file_path, mimetype="audio/wav")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting server on port {port}...")
    app.run(host="0.0.0.0", port=port)