from fastapi.testclient import TestClient
from app.main import app


def test_catalogue_and_product_details():
    with TestClient(app) as client:
        catalogue = client.get('/api/products')
        assert catalogue.status_code == 200
        assert catalogue.json()['total'] >= 1
        product_id = catalogue.json()['items'][0]['id']
        details = client.get(f'/api/products/{product_id}')
        assert details.status_code == 200
        assert details.json()['id'] == product_id


def test_search_and_validation():
    with TestClient(app) as client:
        assert client.get('/api/products?q=backpack').status_code == 200
        assert client.get('/api/products?min_price=100&max_price=10').status_code == 422
        assert client.get('/api/products/999999').status_code == 404
