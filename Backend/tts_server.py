from flask import Flask, request, send_file
from TTS.api import TTS
import os
import uuid

app = Flask(__name__)

# Load model once
tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")

@app.route("/tts", methods=["POST"])
def generate_tts():
    data = request.json
    text = data.get("text")
    lang = data.get("lang", "en")

    if not text:
        return {"error": "Text required"}, 400

    file_name = f"{uuid.uuid4()}.wav"
    file_path = os.path.join("/tmp", file_name)

    tts.tts_to_file(
        text=text,
        file_path=file_path,
        language=lang
    )

    return send_file(file_path, mimetype="audio/wav")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # 🔥 IMPORTANT
    app.run(host="0.0.0.0", port=port)