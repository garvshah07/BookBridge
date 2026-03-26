from flask import Flask, request, send_file
import io
import os

print("🚀 Flask starting...")

app = Flask(__name__)

# ✅ Fix for Coqui license
os.environ["COQUI_TOS_AGREED"] = "1"

# ❗ Lazy load model (VERY IMPORTANT)
tts = None

def load_model():
    global tts
    if tts is None:
        print("🔄 Loading TTS model...")
        from TTS.api import TTS
        tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")

# ✅ Health route (Render needs this)
@app.route("/")
def home():
    return {"status": "running"}

# ✅ TTS route
@app.route("/tts", methods=["POST"])
def tts_api():
    load_model()

    data = request.json
    text = data.get("text", "")

    wav = tts.tts(text=text)

    buffer = io.BytesIO()
    import soundfile as sf
    sf.write(buffer, wav, 22050, format="WAV")
    buffer.seek(0)

    return send_file(buffer, mimetype="audio/wav")


# ✅ Force port binding (backup for Render)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)