from pathlib import Path

import joblib
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel
from sklearn.ensemble import GradientBoostingRegressor

MODEL_PATH = Path(__file__).resolve().parent.parent / "ppi_model.pkl"


class PpiRequest(BaseModel):
    packagingType: str
    reuseScore: float
    vendorRating: float
    carbonScore: float


class PpiResponse(BaseModel):
    ppiScore: float
    ecoLevel: str
    impactWeight: float


router = APIRouter()


def _encode_packaging(packaging: str) -> float:
    return {
        "reusable": 1.0,
        "recyclable": 0.7,
        "compostable": 0.5,
        "mixed": 0.3,
    }.get(packaging.lower(), 0.2)


def _load_model() -> GradientBoostingRegressor:
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    model = GradientBoostingRegressor(random_state=42)
    X = np.array(
        [
            [1.0, 0.9, 0.9, 0.2],
            [0.7, 0.7, 0.8, 0.4],
            [0.3, 0.4, 0.6, 0.6],
            [0.2, 0.2, 0.4, 0.8],
        ]
    )
    y = np.array([0.92, 0.75, 0.55, 0.35])
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    return model


_model = _load_model()


@router.post("/ppi", response_model=PpiResponse)
async def predict_ppi(payload: PpiRequest):
    features = np.array(
        [
            [
                _encode_packaging(payload.packagingType),
                payload.reuseScore,
                payload.vendorRating,
                payload.carbonScore,
            ]
        ]
    )
    score = float(_model.predict(features)[0])
    eco_level = "green" if score >= 0.8 else "amber" if score >= 0.5 else "red"
    impact_weight = round(max(0.1, 1.0 - payload.carbonScore) * score, 3)
    return PpiResponse(ppiScore=round(score, 3), ecoLevel=eco_level, impactWeight=impact_weight)
