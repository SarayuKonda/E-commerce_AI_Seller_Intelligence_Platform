from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import json
import subprocess
import os
import requests as http_requests
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__, static_folder='frontend', static_url_path='/static')
CORS(app)


# 🌐 Serve frontend
@app.route("/app")
def serve_frontend():
    return send_from_directory('react-frontend', 'index.html')


@app.route("/dashboard", methods=["GET"])
def get_dashboard():
    return jsonify({
        "products": load_json("products.json"),
        "recommendation": load_json("recommendation.json"),
        "ai": load_json("llm_recommendation.json")
    })

# 📦 Load JSON safely
def load_json(file):
    try:
        with open(file, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}


# 🚀 1. Run scraping + analysis
@app.route("/scrape", methods=["POST"])
def scrape():
    try:
        data = request.json or {}
        query = data.get("query")
        if not query:
            return jsonify({"error": "No query provided"}), 400
        print(f"🚀 Starting scrape for: {query}")
        subprocess.run(["python", "reviews.py", query], check=True)
        return jsonify({"message": f"Scraping and analysis completed for '{query}'"})
    except Exception as e:
        print(f"❌ Error during scrape: {str(e)}")
        return jsonify({"error": str(e)}), 500


# 📊 2. Get all products
@app.route("/products", methods=["GET"])
def get_products():
    data = load_json("products.json")
    return jsonify(data)


# 🎯 3. Get rule-based recommendation
@app.route("/recommendation", methods=["GET"])
def get_recommendation():
    data = load_json("recommendation.json")
    return jsonify(data)


@app.route("/ai-recommendation", methods=["GET"])
def get_ai_recommendation():
    try:
        with open("llm_recommendation.json", "r", encoding="utf-8") as f:
            content = f.read()
        data = json.loads(content)
        return jsonify(data)
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON from LLM", "raw": content}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 🤖 4. AI Strategy Chatbot
@app.route("/chat", methods=["POST"])
def chat():
    try:
        body = request.json or {}
        user_message = body.get("message", "")
        history = body.get("history", [])
        region = body.get("region", "India")
        audience = body.get("audience", "General consumers")
        product_query = body.get("product_query", "")

        # Load live market data
        products = load_json("products.json")
        recommendation = load_json("recommendation.json")
        ai_rec = load_json("llm_recommendation.json")
        summary = load_json("summary.json")

        top_products = products[:5] if products else []
        top_titles = [p.get("title", "")[:80] for p in top_products]
        avg_price = recommendation.get("recommended_price", "N/A")
        best_color = recommendation.get("best_color_to_sell", "N/A")
        color_sales = summary.get("color_sales", {})
        top_keywords = summary.get("sentiment", {}).get("keywords", [])
        sample_reviews = []
        for p in top_products[:3]:
            sample_reviews.extend(p.get("reviews", [])[:2])

        system_prompt = f"""You are Solar Intel's AI Business Strategist and Social Media Manager — an expert-level e-commerce consultant specializing in the Indian market.

PRODUCT BEING ANALYZED: "{product_query}"
TARGET REGION: {region}
TARGET AUDIENCE: {audience}

=== REAL MARKET DATA (scraped from Amazon India) ===
Top Competing Products:
{chr(10).join(f'- {t}' for t in top_titles)}

Market Insights:
- Recommended Selling Price: Rs.{avg_price}
- Best Color/Variant: {best_color}
- Color-wise Sales: {json.dumps(color_sales)}
- Top Market Keywords: {', '.join(top_keywords)}
- AI Market Recommendation: {ai_rec.get('reason', 'N/A')}

Sample Customer Reviews:
{chr(10).join(f'"{r[:200]}"' for r in sample_reviews[:4])}
===

YOUR CAPABILITIES:

1. MANUFACTURING & SOURCING STRATEGY
   - Where to source/manufacture in India (IndiaMart, TradeIndia, local clusters)
   - MOQ, margin calculations, quality control, packaging advice

2. PRICING & PROFIT STRATEGY
   - Competitive pricing based on the real Rs.{avg_price} market average
   - Profit margin structure, platform comparison (Amazon FBA vs own website vs WhatsApp)

3. BRAND & MARKETING STRATEGY
   - Brand naming, logo style, USP crafting, positioning vs real competitors above

4. SOCIAL MEDIA MANAGEMENT (tailored to {region} & {audience})
   - Platform strategy for {region}
   - Weekly content calendar with exact post ideas
   - Caption templates in local language (Telugu, Hindi, Tamil) if region-relevant
   - Hashtag strategy for {region}
   - Reel/video content ideas

5. VIDEO & MOCKUP CONTENT PROMPTS
   - Midjourney/DALL-E prompts for product mockup images
   - CapCut template descriptions for product reels
   - YouTube Shorts scripts (30-60 sec)
   - Instagram Reel scripts with hook, body, CTA
   - WhatsApp Status content ideas for Indian audiences

6. LAUNCH STRATEGY
   - Pre-launch checklist, Day 1-30 action plan
   - Amazon listing optimization using: {', '.join(top_keywords)}

LANGUAGE & TONE RULES:
- Telugu states target: naturally mix Telugu phrases (e.g., "meeru try cheyandi!", "chala bagundi!")
- Hindi belt: use Hinglish naturally  
- Always give EXACT numbers, EXACT prompts, EXACT captions
- Format with clear headings and bullets
- Ground all advice in the REAL market data above. Never give generic advice."""

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        response = http_requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost",
                "X-Title": "Solar Intel Chatbot"
            },
            json={
                "model": "openai/gpt-3.5-turbo",
                "messages": messages,
                "max_tokens": 1200,
                "temperature": 0.7
            },
            timeout=30
        )

        data = response.json()
        if "choices" in data:
            reply = data["choices"][0]["message"]["content"].strip()
            return jsonify({"reply": reply})
        else:
            return jsonify({"reply": "Sorry, I could not get a response. Please try again.", "error": str(data)}), 500

    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({"reply": f"Error: {str(e)}"}), 500


# 🏠 Health check
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "AI Seller Backend Running"})


if __name__ == "__main__":
    app.run(debug=True, port=8000)