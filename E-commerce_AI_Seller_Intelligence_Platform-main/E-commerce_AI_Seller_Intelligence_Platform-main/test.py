import requests
from bs4 import BeautifulSoup

url = "https://www.amazon.in/dp/B0B8XNPQPN"

headers = {
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept-Language": "en-IN,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive"
}

response = requests.get(url, headers=headers)

soup = BeautifulSoup(response.content, "html.parser")

title = soup.find(id="productTitle")
price = soup.find("span", {"class": "a-price-whole"})

print("Title:", title.text.strip() if title else "Not found")
print("Price:", price.text.strip() if price else "Not found")