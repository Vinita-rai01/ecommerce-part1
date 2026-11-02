
# Everyday Store — Full-Stack E-Commerce Application

## 1. Project Overview

Everyday Store is a full-stack e-commerce product listing application developed as Part 1 of the Full-Stack E-Commerce Lab Assignment.

The application allows users to browse products, search the catalogue, filter products by category, sort products by price, and view individual product details.

Product information is stored in a relational SQLite database and retrieved through a Python FastAPI backend.

## 2. Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Python 3.12
- FastAPI
- Uvicorn

### Database
- SQLite
- SQL

### External Data Source
- DummyJSON Products API (used to import sample products)

## 3. Application Architecture

The application follows a three-layer architecture:

1. Frontend: Displays products and handles user interactions.
2. Backend: FastAPI provides REST API endpoints and processes requests.
3. Database: SQLite stores product information.

Application data flow:

Frontend → FastAPI Backend → SQLite Database

The backend retrieves product information from SQLite and returns JSON responses to the frontend.

## 4. Project Structure

```text
ecommerce_part1/
│
├── app/
│   ├── main.py
│   ├── database.py
│   └── static/
│       ├── index.html
│       ├── styles.css
│       └── app.js
│
├── sql/
│   ├── schema.sql
│   └── seed.sql
│
├── tests/
│
├── screenshots/
│   ├── product-listing.png
│   └── product-details.png
│
├── import_products.py
├── requirements.txt
├── README.md
└── ecommerce.db
```

## 5. Database Design

The application uses SQLite as its relational database.

### Products Table

| Column | Data Type | Description |
|---|---|---|
| id | INTEGER | Primary key |
| name | TEXT | Product name |
| description | TEXT | Product description |
| price | REAL | Product price |
| image_url | TEXT | Product image URL |
| category | TEXT | Product category |
| stock | INTEGER | Available stock |
| created_at | TEXT | Creation timestamp |

The database schema and initial sample data are provided in the `sql` directory.

## 6. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/health | Check API health |
| GET | /api/categories | Retrieve product categories |
| GET | /api/products | Retrieve product catalogue |
| GET | /api/products/{product_id} | Retrieve individual product |

### Product Catalogue Query Parameters

- `q`: Search product names and descriptions.
- `category`: Filter by category.
- `min_price`: Minimum price.
- `max_price`: Maximum price.
- `limit`: Number of products per request.
- `offset`: Pagination offset.
- `sort_by`: Sort by id, name or price.
- `order`: Ascending or descending.

Example:

```text
/api/products?limit=12&offset=0&sort_by=price&order=asc
```

## 7. Prerequisites

Install the following:

- Python 3.12 or later
- pip
- Git (for repository management)

## 8. Installation and Setup

### Step 1: Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd ecommerce_part1
```

### Step 2: Create a virtual environment

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

On macOS/Linux:

```bash
source .venv/bin/activate
```

### Step 3: Install dependencies

```bash
python -m pip install -r requirements.txt
```

### Step 4: Initialize the database

The application automatically initializes the SQLite database when FastAPI starts.

It executes the schema and inserts the sample data from `sql/seed.sql` if the products table is empty.

### Optional: Import additional products

To import products from DummyJSON:

```bash
python import_products.py
```

An internet connection is required for this optional import.

### Step 5: Start the application

```bash
python -m uvicorn app.main:app --reload
```

## 9. Access the Application

Website:

http://127.0.0.1:8000

API Documentation:

http://127.0.0.1:8000/docs

Product Catalogue:

http://127.0.0.1:8000/api/products

## 10. Screenshots

### Product Listing Page

See `screenshots/product-listing.png`.

### Product Details View

See `screenshots/product-details.png`.

## 11. Features Implemented

- Product catalogue with images.
- Product name, description and price.
- Individual product details view.
- Product search.
- Category filtering.
- Price range filtering through the API.
- Product sorting.
- Server-side pagination.
- SQLite relational database.
- FastAPI REST API.
- Frontend and backend integration.

## 12. Running the Application

After installing dependencies, run:

```bash
python -m uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000 in your browser.

The frontend, backend and database run locally on a single computer.

---

Developed as part of the Full-Stack E-Commerce Lab Assignment — Part 1.

