import logging
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv


app = Flask(__name__)
CORS(app)  

# Load environment variables from a local .env file if present (useful for local dev)
load_dotenv()


api_key = os.getenv("GEMINI_API_KEY")


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("petstore-ai")

if api_key:
    genai.configure(api_key=api_key)
else:
    # logging (unlike print) never crashes the process on consoles that cannot encode the text
    logger.warning("GEMINI_API_KEY ortam değişkeni tanımlı değil; AI uç noktaları 500 döndürecek. "
                   "Ortam değişkenini ayarlayın veya .env dosyasında tanımlayın.")
# Allow overriding the model via env; default to a widely-available stable model
model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash") 

def sanitize_text(text: str) -> str:
	"""Temizlik: Olası başlık/giriş cümlesini (örn. 'İşte ...:') kaldır ve düz metin döndür."""
	if not text:
		return text
	# Satırlara böl, boş satırları ayıkla
	lines = [line.strip() for line in text.strip().splitlines() if line.strip()]
	if not lines:
		return ""
	first_line = lines[0]
	lower_first = first_line.lower()
	# 'İşte' ile başlayan veya ':' ile biten bariz giriş satırını kaldır
	if lower_first.startswith("işte") or first_line.endswith(":") or "tanıtım yazısı" in lower_first:
		lines = lines[1:] if len(lines) > 1 else []
	clean = " ".join(lines).strip()
	return clean

def clean_field(value, max_length: int = 100) -> str:
    """Accepts only non-empty strings, trims them and caps the length sent to the model."""
    if not isinstance(value, str):
        return ""
    return value.strip()[:max_length]


@app.route('/', methods=['GET'])
def health_check():
    """
    API'nin çalışıp çalışmadığını kontrol eden endpoint.
    """
    return jsonify({"status": "API çalışıyor", "endpoints": ["/generate-description", "/recommend-pet"]})

@app.route('/generate-description', methods=['POST'])
def generate_description():
    """
    Verilen hayvan bilgilerine göre tanıtım metni üretir.
    Zorunlu alan: 'type'. Opsiyonel: 'name' (hayvanın adı), 'breed' (cinsi).
    """
    data = request.get_json(silent=True) or {}
    pet_type = clean_field(data.get("type"))
    if not pet_type:
        return jsonify({"error": "Eksik alan: 'type' gereklidir."}), 400

    details = [f"Tür: {pet_type}"]
    name = clean_field(data.get("name"))
    breed = clean_field(data.get("breed"))
    if name:
        details.append(f"Adı: {name}")
    if breed:
        details.append(f"Cins: {breed}")

    prompt = (
        f"Bir evcil hayvan için sıcak ve ilgi çekici bir sahiplendirme ilanı tanıtım metni yaz. "
        f"Sadece metni yaz; başlık, giriş cümlesi veya 'İşte...' gibi kalıp ifadeler ekleme. "
        f"Herhangi bir sembol kullanma. En fazla 50 kelime. "
        f"{', '.join(details)}."
    )
    try:
        if not api_key:
            return jsonify({"error": "Sunucu yapılandırma hatası: GEMINI_API_KEY tanımlı değil."}), 500

        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)

        text = getattr(response, "text", None)
        if not text:
            # Fallback: bazı sürümlerde yanıt metni farklı yapıda olabilir
            try:
                text = response.candidates[0].content.parts[0].text  # type: ignore[attr-defined]
            except Exception:
                text = None

        if not text:
            return jsonify({"error": "AI servisten boş yanıt döndü."}), 502

        text = sanitize_text(text)
        return jsonify({"description": text})
    except Exception:
        app.logger.exception("/generate-description hata")
        return jsonify({"error": "Açıklama üretilemedi. Lütfen daha sonra tekrar deneyin."}), 500

@app.route('/recommend-pet', methods=['POST'])
def recommend_pet():
    """
    Kullanıcının yaşam tarzına göre evcil hayvan önerir.
    Gerekli alan: 'preferences'.
    """
    data = request.get_json(silent=True) or {}
    preferences = clean_field(data.get("preferences"), max_length=500)
    if not preferences:
        return jsonify({"error": "Eksik alan: 'preferences' gereklidir."}), 400

    prompt = (
        f"Kullanıcının yaşam tarzı ve tercihleri: {preferences}. "
        f"Bu bilgilere göre en uygun evcil hayvan türlerini öner ve nedenlerini açıkla. Sadece metni yaz Herhangi bir sembol olmasın. (maximum 50 kelime)."
    )
    try:
        if not api_key:
            return jsonify({"error": "Sunucu yapılandırma hatası: GEMINI_API_KEY tanımlı değil."}), 500

        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)

        text = getattr(response, "text", None)
        if not text:
            try:
                text = response.candidates[0].content.parts[0].text  # type: ignore[attr-defined]
            except Exception:
                text = None

        if not text:
            return jsonify({"error": "AI servisten boş yanıt döndü."}), 502

        return jsonify({"recommendation": text})
    except Exception:
        app.logger.exception("/recommend-pet hata")
        return jsonify({"error": "Öneri üretilemedi. Lütfen daha sonra tekrar deneyin."}), 500


if __name__ == '__main__':
    # Never expose the Werkzeug debugger on the network: debug and host come from env.
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    host = os.getenv("FLASK_HOST", "127.0.0.1")
    app.run(debug=debug, host=host, port=int(os.getenv("PORT", "5000")))

application = app
