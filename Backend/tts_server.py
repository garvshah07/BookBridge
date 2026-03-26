from flask import Flask, request, send_file
import io
from gtts import gTTS

print("🚀 Flask starting...")

app = Flask(__name__)

# ✅ Health route (Render needs this)
@app.route("/")
def home():
    return {"status": "running"}


# ✅ Text-to-Speech API (gTTS - lightweight)
@app.route("/tts", methods=["POST"])
def tts_api():
    try:
        data = request.json

        text = data.get("text", "")
        selected_language = data.get("language", "English")

        if not text:
            return {"error": "No text provided"}, 400

        # 🌍 Language mapping
        lang_map = {
            "English": "en",
            "Hindi": "hi",
            "Gujarati": "gu"
        }

        lang = lang_map.get(selected_language, "en")

        # ✅ Generate speech
        tts = gTTS(text=text, lang=lang)

        buffer = io.BytesIO()
        tts.write_to_fp(buffer)
        buffer.seek(0)

        return send_file(buffer, mimetype="audio/mp3")

    except Exception as e:
        print("❌ ERROR:", str(e))
        return {"error": str(e)}, 500


# ✅ Force port binding (important for Render)
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)