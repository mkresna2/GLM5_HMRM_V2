from fastapi import FastAPI, HTTPException
import os
import sys
import numpy as np
from typing import Dict, Any
from pydantic import ConfigDict

# Add common to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.models import BaseResponse, RealTimeSignals
from common.server import get_port

app = FastAPI(title="HMRM ML Inference Service")

class MLPredictRequest(BaseResponse):
    property_id: str
    arrival_date: str
    features: RealTimeSignals
    price_vector: Dict[str, float]

class MLPredictResponse(BaseResponse):
    model_config = ConfigDict(protected_namespaces=())

    expected_revenue: float
    expected_net_revenue: float
    expected_occupancy: Dict[str, float]
    elasticity_estimates: Dict[str, float]
    prediction_variance_proxy: float
    model_version: str = "v2.0.0-mock"

@app.post("/internal/ml/predict", response_model=MLPredictResponse)
async def predict(request: MLPredictRequest):
    # In a real implementation, this would load a LightGBM model
    # and use request.features + request.price_vector for inference.
    
    # Mock ML Logic based on Price Elasticity
    # Revenue = Price * Demand
    # Demand = BaseDemand * (1 + Elasticity * (Price/BasePrice - 1))
    
    base_prices = {"STD": 200, "DLX": 250, "STE": 400}
    elasticities = {"STD": -1.8, "DLX": -1.5, "STE": -1.2}
    base_demands = {"STD": 15, "DLX": 10, "STE": 4}
    
    expected_occupancy = {}
    total_revenue = 0
    
    # Adjust base demand by real-time signals
    demand_multiplier = (
        request.features.search_intensity_index * 0.4 +
        request.features.pickup_pace_index * 0.3 +
        request.features.conversion_probability * 3.0
    )
    
    for room_type, price in request.price_vector.items():
        base_p = base_prices.get(room_type, 200)
        base_d = base_demands.get(room_type, 10) * demand_multiplier
        elast = elasticities.get(room_type, -1.5)
        
        # Linear elasticity model
        price_ratio = price / base_p
        demand_effect = 1 + elast * (price_ratio - 1)
        predicted_demand = max(0, base_d * demand_effect)
        
        expected_occupancy[room_type] = predicted_demand
        total_revenue += predicted_demand * price
        
    return MLPredictResponse(
        expected_revenue=total_revenue,
        expected_net_revenue=total_revenue * 0.95, # Assuming 5% average costs
        expected_occupancy=expected_occupancy,
        elasticity_estimates=elasticities,
        prediction_variance_proxy=total_revenue * 0.15,
        trace_id=request.trace_id
    )

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ml-inference-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=get_port(8003))
