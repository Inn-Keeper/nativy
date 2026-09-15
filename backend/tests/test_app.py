from fastapi.testclient import TestClient

from app.main import app


def test_health_contract():
    with TestClient(app) as client:
        response = client.get('/health')
    assert response.status_code == 200
    assert response.json() == {'status': 'ok'}


def test_cors_allows_local_frontend_but_not_unknown_origins():
    with TestClient(app) as client:
        allowed = client.get('/health', headers={'Origin': 'http://localhost:5173'})
        denied = client.get('/health', headers={'Origin': 'https://untrusted.example'})
    assert allowed.headers['access-control-allow-origin'] == 'http://localhost:5173'
    assert 'access-control-allow-origin' not in denied.headers
