
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .database import get_connection, initialise_database

BASE_DIR = Path(__file__).resolve().parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialise_database()
    yield


app = FastAPI(
    title="Everyday Store API",
    description="Full-stack e-commerce product catalogue API.",
    version="1.1.0",
    lifespan=lifespan,
)

app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "static"),
    name="static"
)


@app.get("/", include_in_schema=False)
def home():
    return FileResponse(BASE_DIR / "static" / "index.html")


@app.get("/api/health", tags=["System"])
def health():
    return {
        "status": "ok",
        "service": "Everyday Store API"
    }


@app.get("/api/categories", tags=["Products"])
def get_categories():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT DISTINCT category FROM products ORDER BY category"
        ).fetchall()

    return [row["category"] for row in rows]


@app.get("/api/products", tags=["Products"])
def get_products(
    q: Optional[str] = Query(
        default=None,
        max_length=100,
        description="Search product names and descriptions"
    ),
    category: Optional[str] = Query(
        default=None,
        max_length=50
    ),
    min_price: Optional[float] = Query(
        default=None,
        ge=0
    ),
    max_price: Optional[float] = Query(
        default=None,
        ge=0
    ),
    limit: int = Query(
        default=12,
        ge=1,
        le=100
    ),
    offset: int = Query(
        default=0,
        ge=0
    ),
    sort_by: str = Query(
        default="id",
        pattern="^(id|name|price)$"
    ),
    order: str = Query(
        default="asc",
        pattern="^(asc|desc)$"
    ),
):
    # Validate price range
    if (
        min_price is not None
        and max_price is not None
        and min_price > max_price
    ):
        raise HTTPException(
            status_code=422,
            detail="min_price cannot be greater than max_price"
        )

    conditions = []
    parameters = []

    # Search
    if q and q.strip():
        conditions.append(
            "(name LIKE ? OR description LIKE ?)"
        )
        term = f"%{q.strip()}%"
        parameters.extend([term, term])

    # Category filter
    if category and category.strip():
        conditions.append("category = ?")
        parameters.append(category.strip())

    # Minimum price
    if min_price is not None:
        conditions.append("price >= ?")
        parameters.append(min_price)

    # Maximum price
    if max_price is not None:
        conditions.append("price <= ?")
        parameters.append(max_price)

    where_clause = (
        " WHERE " + " AND ".join(conditions)
        if conditions else ""
    )

    # Sorting fields are restricted by Query validation
    sort_column = {
        "id": "id",
        "name": "name",
        "price": "price"
    }[sort_by]

    sort_order = order.upper()

    with get_connection() as connection:

        # Total matching products
        total = connection.execute(
            "SELECT COUNT(*) FROM products" + where_clause,
            parameters
        ).fetchone()[0]

        # Retrieve paginated products
        rows = connection.execute(
            f"""
            SELECT
                id,
                name,
                description,
                price,
                image_url,
                category,
                stock
            FROM products
            {where_clause}
            ORDER BY {sort_column} {sort_order}
            LIMIT ? OFFSET ?
            """,
            [*parameters, limit, offset]
        ).fetchall()

    return {
        "items": [dict(row) for row in rows],
        "total": total,
        "limit": limit,
        "offset": offset,
        "sort_by": sort_by,
        "order": order
    }


@app.get("/api/products/{product_id}", tags=["Products"])
def get_product(product_id: int):

    if product_id < 1:
        raise HTTPException(
            status_code=422,
            detail="Product ID must be a positive integer"
        )

    with get_connection() as connection:
        product = connection.execute(
            """
            SELECT
                id,
                name,
                description,
                price,
                image_url,
                category,
                stock
            FROM products
            WHERE id = ?
            """,
            (product_id,)
        ).fetchone()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return dict(product)
