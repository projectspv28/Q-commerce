from fastapi import FastAPI

from services.demand_predictor import router as demand_router
from services.ppi_predictor import router as ppi_router

app = FastAPI(title="Whistle AI Service", version="1.0.0")
app.include_router(demand_router, prefix="/ml", tags=["demand"])
app.include_router(ppi_router, prefix="/ml", tags=["ppi"])


@app.get("/health")
async def health():
    return {"status": "ok"}
