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


if not api_key:
    print("HATA: GEMINI_API_KEY ortam değişkeni tanımlı değil. Lütfen ortam değişkenini ayarlayın veya .env dosyasında tanımlayın.")

genai.configure(api_key=api_key)
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
    Gerekli alanlar: 'type', 'breed'.
    """
    data = request.get_json()
    required_fields = ["type", "breed"]
    
    
    if not data or not all(field in data for field in required_fields):
        
        return jsonify({"error": "Eksik alanlar: 'type', 'breed' gereklidir."}), 400

    prompt = (
        f"Bir evcil hayvan için sıcak ve ilgi çekici bir tanıtım metni yaz. "
        f"Sadece metni yaz; başlık, giriş cümlesi veya 'İşte...' gibi kalıp ifadeler ekleme. "
        f"Herhangi bir sembol kullanma. En fazla 50 kelime. "
        f"Tür: {data['type']}, Cins: {data['breed']}."
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
    except Exception as e:
        print(f"/generate-description hata: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/recommend-pet', methods=['POST'])
def recommend_pet():
    """
    Kullanıcının yaşam tarzına göre evcil hayvan önerir.
    Gerekli alan: 'preferences'.
    """
    data = request.get_json()
  
    if not data or "preferences" not in data:
        return jsonify({"error": "Eksik alan: 'preferences' gereklidir."}), 400

    prompt = (
        f"Kullanıcının yaşam tarzı ve tercihleri: {data['preferences']}. "
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
    except Exception as e:
        print(f"/recommend-pet hata: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

application = app
