from pathlib import Path
from typing import List

import joblib
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestRegressor

MODEL_PATH = Path(__file__).resolve().parent.parent / "demand_model.pkl"


class DemandRequest(BaseModel):
    productId: str
    zone: str
    historicalOrders: List[int] = Field(default_factory=list)
    stockLevel: int


class DemandResponse(BaseModel):
    predictedVelocity: float
    riskLevel: str
    forecastRunout: float  # days until stockout


router = APIRouter()


def _load_model() -> RandomForestRegressor:
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    # Minimal bootstrap training so the endpoint works without artifacts
    X = np.array([[0, 10], [5, 20], [10, 40], [20, 80]])
    y = np.array([1, 4, 8, 16])
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    return model


_model = _load_model()


@router.post("/demand", response_model=DemandResponse)
async def predict_demand(payload: DemandRequest):
    if not payload.historicalOrders:
        raise HTTPException(status_code=400, detail="historicalOrders cannot be empty")

    recent_avg = float(np.mean(payload.historicalOrders[-14:]))  # recency-weighted mean
    features = np.array([[recent_avg, payload.stockLevel]])
    velocity = float(_model.predict(features)[0])  # units/day
    forecast_runout = round(payload.stockLevel / velocity, 2) if velocity > 0 else float("inf")
    risk_level = "high" if forecast_runout < 3 else "medium" if forecast_runout < 7 else "low"

    return DemandResponse(
        predictedVelocity=round(velocity, 3),
        riskLevel=risk_level,
        forecastRunout=forecast_runout,
    )
