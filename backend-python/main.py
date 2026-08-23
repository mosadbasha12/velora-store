from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Velora Analytics Service", version="0.1.0")

class SalesSummary(BaseModel):
    revenue: float
    orders: int
    customers: int
    conversion_rate: float

@app.get("/health")
def health():
    return {"status": "ok", "service": "velora-analytics"}

@app.get("/analytics/summary", response_model=SalesSummary)
def summary():
    return SalesSummary(revenue=24780.0, orders=1482, customers=892, conversion_rate=2.45)

class Product(BaseModel):
    id: int
    name: str
    category: str
    price: float

@app.post("/recommendations/similar")
def similar_products(product: Product, catalog: List[Product]):
    """Content-based recommendation: category affinity first, then price proximity."""
    candidates = [p for p in catalog if p.id != product.id]
    ranked = sorted(candidates, key=lambda p: (
        1 if p.category.lower() == product.category.lower() else 0,
        -abs(p.price - product.price)
    ), reverse=True)
    return {"product_id": product.id, "recommendations": ranked[:3]}
