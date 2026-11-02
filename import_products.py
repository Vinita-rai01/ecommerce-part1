
import json
import sqlite3
from urllib.request import Request, urlopen

from app.database import get_connection, initialise_database

API_URL = "https://dummyjson.com/products?limit=100"


def fetch_products():
    print("Fetching products from DummyJSON...")

    request = Request(
        API_URL,
        headers={"User-Agent": "Ecommerce-Assignment/1.0"}
    )

    with urlopen(request, timeout=30) as response:
        data = json.loads(response.read().decode("utf-8"))

    products = data.get("products", [])

    if not products:
        raise ValueError("No products received from API.")

    print(f"Received {len(products)} products.")
    return products


def import_products():
    initialise_database()
    products = fetch_products()

    records = []

    for product in products:
        name = product.get("title", "").strip()
        description = product.get("description", "").strip()
        price = float(product.get("price", 0))
        image_url = product.get("thumbnail") or ""
        category = product.get("category", "general")
        stock = max(0, int(product.get("stock", 0)))

        if not name or not image_url or price < 0:
            continue

        records.append((
            name,
            description,
            price,
            image_url,
            category,
            stock
        ))

    with get_connection() as connection:
        connection.execute("DELETE FROM products")

        connection.executemany(
            """
            INSERT INTO products
            (name, description, price, image_url, category, stock)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            records
        )

    print(f"Successfully imported {len(records)} products!")

    with get_connection() as connection:
        count = connection.execute(
            "SELECT COUNT(*) FROM products"
        ).fetchone()[0]

    print(f"Products currently stored in SQLite: {count}")


if __name__ == "__main__":
    try:
        import_products()
    except Exception as error:
        print(f"Import failed: {error}")
