from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time, json, re
import requests
import os
from dotenv import load_dotenv

from collections import Counter


load_dotenv()

import sys

# 🧠 Take user input (from CLI arg or interactive)
if len(sys.argv) > 1:
    user_query = sys.argv[1]
else:
    user_query = input("Enter product to analyze: ")

# 🤖 Use LLM to normalize query

def get_search_query(user_query):
    prompt = f"""
Convert the following user intent into a short Amazon search keyword.

User Input: {user_query}

Return only a concise search phrase.
"""

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost",
                "X-Title": "AI Project"
            },
            json={
                "model": "openai/gpt-3.5-turbo",
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
        )

        data = response.json()

        if "choices" in data:
            return data["choices"][0]["message"]["content"].strip()

    except Exception as e:
        print("Query LLM failed, using raw input")

    return user_query


search_query = get_search_query(user_query)
print("\n🔍 Searching for:", search_query)

# Encode query for URL
encoded_query = search_query.replace(" ", "+")

# Selenium headless options
options = Options()
options.add_argument("--headless=new")
options.add_argument("--disable-gpu")
options.add_argument("--window-size=1920,1080")
# Optional: reduce automation detection
options.add_argument("--disable-blink-features=AutomationControlled")

driver = webdriver.Chrome(options=options)
driver.get(f"https://www.amazon.in/s?k={encoded_query}")

wait = WebDriverWait(driver, 10)

data = []

for page in range(1, 2):  # scrape first 3 pages
    print(f"Scraping page {page}...")
    driver.get(f"https://www.amazon.in/s?k={encoded_query}&page={page}")
    time.sleep(3)

    products = wait.until(EC.presence_of_all_elements_located(
        (By.XPATH, "//div[@data-component-type='s-search-result']")
    ))

    for product in products:
        time.sleep(0.5)

        # 🏷 Title
        try:
            title = product.find_element(By.TAG_NAME, "h2").text
        except:
            title = "N/A"

        # 💰 Price
        try:
            price = product.find_element(By.CLASS_NAME, "a-price-whole").text
        except:
            price = "0"

        print(f"Processing: {title[:60]}")

        # ❗ Filter bad data
        if price == "0" or title == "N/A":
            continue

        # ⭐ Rating
        try:
            rating = product.find_element(By.XPATH, ".//span[@class='a-icon-alt']").text
        except:
            rating = "N/A"

        # 📝 Reviews count
        try:
            reviews = product.find_element(
                By.XPATH, ".//span[@class='a-size-base s-underline-text']"
            ).text
        except:
            reviews = "0"

        # 🛒 Bought info (Multiple XPATHs for robustness)
        bought = "N/A"
        bought_selectors = [
            ".//span[contains(text(),'bought in past month')]",
            ".//span[contains(@class, 'social-proofing-faceout-title-text')]",
            ".//span[contains(text(),'purchased')]"
        ]
        for selector in bought_selectors:
            try:
                bought = product.find_element(By.XPATH, selector).text
                if bought: break
            except: continue

        # 🖼 Image
        try:
            image = product.find_element(By.TAG_NAME, "img").get_attribute("src")
        except:
            image = "N/A"

        # 🔢 Clean reviews
        cleaned_reviews = re.sub(r"[^\d]", "", reviews)
        reviews_num = int(cleaned_reviews) if cleaned_reviews else 0

        # 🔥 Sales estimation
        estimated_sales = 0
        if "bought" in bought.lower():
            num_match = re.search(r"(\d+K?)\+", bought)
            if num_match:
                num_str = num_match.group(1).replace("K", "000")
                estimated_sales = int(num_str)
        elif reviews_num > 0:
            estimated_sales = int(reviews_num * 10) # Fallback conservative estimate

        # 🎨 Color detection — expanded for leather/fashion/lifestyle products
        color_map = {
            "black":  ["black", "midnight", "ebony", "jet black"],
            "brown":  ["brown", "tan", "camel", "coffee", "chestnut", "cognac",
                       "tobacco", "chocolate", "walnut", "khaki", "mocha",
                       "umber", "sienna", "russet", "oak", "tawny"],
            "blue":   ["blue", "navy", "cobalt", "sapphire", "indigo", "teal"],
            "red":    ["red", "crimson", "maroon", "burgundy", "wine", "scarlet", "cherry"],
            "green":  ["green", "mint", "olive", "forest", "sage", "emerald", "hunter"],
            "white":  ["white", "cream", "ivory", "off-white", "snow"],
            "pink":   ["pink", "rose", "blush", "magenta", "fuchsia", "coral"],
            "silver": ["silver", "grey", "gray", "slate", "charcoal", "ash"],
            "golden": ["gold", "golden", "champagne", "brass", "copper", "bronze"],
            "yellow": ["yellow", "mustard", "lemon", "amber"],
            "orange": ["orange", "rust", "saffron", "terracotta"],
            "purple": ["purple", "violet", "lavender", "plum", "mauve"],
        }
        detected_color = "unknown"
        title_lower = title.lower()
        for main_color, variants in color_map.items():
            if any(v in title_lower for v in variants):
                detected_color = main_color
                break

        # 🔥 REAL REVIEW SCRAPING & SENTIMENT
        reviews_list = []
        pos_count = 0
        neg_count = 0

        # 🔗 Get product URL
        product_url = "N/A"
        try:
            product_url = product.find_element(By.TAG_NAME, "a").get_attribute("href")
        except:
            pass

        if len(data) < 5: # Increase to top 5 products
            try:
                link = product_url
                if link == "N/A": raise Exception("No link found")
                driver.execute_script("window.open(arguments[0]);", link)
                driver.switch_to.window(driver.window_handles[1])
                time.sleep(3)

                # Robust review selector
                review_elements = driver.find_elements(By.CSS_SELECTOR, "[data-hook='review-body'], .reviewText")
                
                for r in review_elements[:8]:
                    text = r.text.strip()
                    if text:
                        reviews_list.append(text)
                        lower_text = text.lower()
                        # Positive sentiment keywords
                        pos_words = [
                            "good", "great", "excellent", "nice", "perfect", "love",
                            "amazing", "awesome", "superb", "fantastic", "happy",
                            "satisfied", "recommend", "quality", "best", "worth",
                            "genuine", "value", "sturdy", "durable", "beautiful"
                        ]
                        # Negative sentiment keywords
                        neg_words = [
                            "bad", "poor", "worst", "broken", "waste", "fake", "cheap",
                            "terrible", "horrible", "disappoint", "defect", "damage",
                            "return", "refund", "not good", "not worth", "pathetic",
                            "useless", "flimsy", "fell apart", "stopped working",
                            "peeling", "cracked", "smells", "smell", "overpriced",
                            "misleading", "duplicate", "copy", "not genuine",
                            "not original", "don't buy", "avoid", "fraud"
                        ]
                        if any(w in lower_text for w in pos_words):
                            pos_count += 1
                        if any(w in lower_text for w in neg_words):
                            neg_count += 1

                driver.close()
                driver.switch_to.window(driver.window_handles[0])
            except Exception as e:
                print(f"Review scraping failed for one product: {e}")

        # 🧠 Clean keywords
        words = title.lower().split()
        stop_words = ["with", "and", "for", "the", "cover", "case"]
        keywords = [w for w in words if len(w) > 3 and w not in stop_words][:3]

        product_data = {
            "title": title,
            "price": price,
            "rating": rating,
            "reviews_count": reviews_num,
            "bought_last_month": bought,
            "estimated_sales": estimated_sales,
            "image": image,
            "color": detected_color,
            "positive_reviews": pos_count,
            "negative_reviews": neg_count,
            "keywords": keywords,
            "reviews": reviews_list,
            "product_url": product_url
        }
        data.append(product_data)

# 📊 MARKET ANALYSIS (GLOBAL INSIGHTS)

color_sales = {}
price_sales = []

for item in data:
    color = item["color"]
    sales = item["estimated_sales"]
    price = int(re.sub(r"[^\d]", "", item["price"])) if item["price"] != "0" else 0

    # ignore unknown colors
    if color != "unknown":
        if color not in color_sales:
            color_sales[color] = 0
        color_sales[color] += sales

    # collect prices weighted by sales
    if price > 0:
        price_sales.append((price, sales))

# 🎨 Best color
best_color = max(color_sales, key=color_sales.get) if color_sales else "unknown"

# 💰 Weighted average price
total_weighted_price = sum(price * sales for price, sales in price_sales)
total_sales = sum(sales for _, sales in price_sales)

if total_sales > 0:
    recommended_price = int(total_weighted_price / total_sales)
else:
    # Fallback: Simple average of all prices if no sales data
    all_prices = [p for p, _ in price_sales]
    recommended_price = int(sum(all_prices) / len(all_prices)) if all_prices else 0

# 📊 SENTIMENT AGGREGATION
total_positive = sum(p.get("positive_reviews", 0) for p in data)
total_negative = sum(p.get("negative_reviews", 0) for p in data)

all_keywords = []
for p in data:
    all_keywords.extend(p.get("keywords", []))

stop_words = ["with", "and", "for", "the", "amazon", "india"]
filtered_keywords = [w for w in all_keywords if w not in stop_words]
top_keywords = [w for w, _ in Counter(filtered_keywords).most_common(5)]

# 📦 Summary for API
summary = {
    "color_sales": color_sales,
    "recommended_price": recommended_price,
    "sentiment": {
        "positive": total_positive,
        "negative": total_negative,
        "keywords": top_keywords
    }
}

with open("summary.json", "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=4)

# 🏆 Final recommendation
recommendation = {
    "best_color_to_sell": best_color,
    "recommended_price": recommended_price
}

print("\n🎯 MARKET INSIGHT:")
print(recommendation)

# 🤖 LLM REASONING LAYER
def get_llm_recommendation(color_sales, recommended_price, sample_products):
    prompt = f"""
    You are an expert e-commerce analyst.
    
    Market Data:
    Color Sales: {color_sales}
    Average Price: {recommended_price}
    
    Sample Product Reviews:
    {sample_products}
    
    Tasks:
    1. Suggest best color to sell
    2. Suggest optimal price range
    3. Give short reason
    
    Return JSON only:
    {{
      "color": "",
      "price_range": "",
      "reason": ""
    }}
    """

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost",
                "X-Title": "AI Seller Intel"
            },
            json={
                "model": "openai/gpt-3.5-turbo",
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
        )

        data = response.json()
        if "choices" in data:
            result = data["choices"][0]["message"]["content"].strip()
            # Find the JSON block if the model added text
            json_start = result.find('{')
            json_end = result.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                return result[json_start:json_end]
            return result
        return json.dumps({"color": "unknown", "price_range": str(recommended_price), "reason": "AI error"})

    except Exception as e:
        return json.dumps({"color": "unknown", "price_range": str(recommended_price), "reason": f"Error: {str(e)}"})

# 🤖 Get AI reasoning
llm_output = get_llm_recommendation(color_sales, recommended_price, data[:3])

# Ensure valid JSON output
try:
    json.loads(llm_output)
except:
    llm_output = json.dumps({"color": best_color, "price_range": str(recommended_price), "reason": "Market analysis complete."})

print("\n🤖 AI RECOMMENDATION:")
print(llm_output)

with open("llm_recommendation.json", "w", encoding="utf-8") as f:
    f.write(llm_output)

# Save recommendation separately
with open("recommendation.json", "w", encoding="utf-8") as f:
    json.dump(recommendation, f, indent=4)

# Save JSON
with open("products.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print("✅ Clean data saved!")

# Note: removed input() so subprocess doesn't block
driver.quit()