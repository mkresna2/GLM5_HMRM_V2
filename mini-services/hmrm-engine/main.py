from fastapi import FastAPI, HTTPException
import httpx
import os
import sys
import time
from typing import Dict, Any, List

# Add common to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.models import PricingEvaluateRequest, PricingEvaluateResponse
from common.server import get_port

app = FastAPI(title="HMRM Engine")

# Service URLs
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8003")
MC_SERVICE_URL = os.getenv("MC_SERVICE_URL", "http://localhost:8004")
OPTIMIZATION_SERVICE_URL = os.getenv("OPTIMIZATION_SERVICE_URL", "http://localhost:8009")

@app.post("/internal/pricing/evaluate", response_model=PricingEvaluateResponse)
async def evaluate(request: PricingEvaluateRequest):
    start_time = time.time()
    
    # 1. Determine Optimal Price Vector (Initial guess or optimization)
    # We call the optimization service to get the "sweet spot"
    async with httpx.AsyncClient() as client:
        opt_response = await client.post(
            f"{OPTIMIZATION_SERVICE_URL}/internal/optimizer/solve",
            json={
                "property_id": request.property_id,
                "arrival_date": str(request.arrival_date),
                "current_prices": {"STD": 220, "DLX": 275, "STE": 420},
                "constraints": {
                    "min_price": {"STD": 150, "DLX": 200, "STE": 300},
                    "max_price": {"STD": 350, "DLX": 450, "STE": 700}
                },
                "risk_aversion_lambda": request.risk_aversion_lambda,
                "trace_id": f"trace_{request.property_id}_{int(time.time())}"
            }
        )
        opt_data = opt_response.json()
        price_vector = opt_data["optimal_prices"]
        
        # 2. Call ML Inference Service (Surrogate)
        ml_response = await client.post(
            f"{ML_SERVICE_URL}/internal/ml/predict",
            json={
                "property_id": request.property_id,
                "arrival_date": str(request.arrival_date),
                "features": request.real_time_signals.model_dump(),
                "price_vector": price_vector,
                "trace_id": opt_data["trace_id"]
            }
        )
        ml_data = ml_response.json()
        
        # 3. Call Monte Carlo Service (Simulation)
        # Only run MC if mode is hybrid or full_mc
        mc_data = None
        if request.mode in ["hybrid", "full_mc"]:
            mc_response = await client.post(
                f"{MC_SERVICE_URL}/internal/mc/simulate",
                json={
                    "property_id": request.property_id,
                    "arrival_date": str(request.arrival_date),
                    "simulation_runs": 1000 if request.mode == "hybrid" else 5000,
                    "price_vector": price_vector,
                    "distribution_parameters": {
                        "arrival_rate_lambda": 15.0 * request.real_time_signals.search_intensity_index,
                        "cancellation_rate_by_room": {"STD": 0.2, "DLX": 0.15, "STE": 0.1}
                    },
                    "control_variate_prediction": ml_data["expected_net_revenue"],
                    "trace_id": ml_data["trace_id"]
                }
            )
            mc_data = mc_response.json()
            
        # 4. Combine Results
        final_revenue = mc_data["mc_adjusted_mean_revenue"] if mc_data else ml_data["expected_net_revenue"]
        final_variance = mc_data["mc_variance"] if mc_data else ml_data["prediction_variance_proxy"]
        
        computation_time_ms = int((time.time() - start_time) * 1000)
        
        return PricingEvaluateResponse(
            recommended_prices=price_vector,
            expected_net_revenue=final_revenue,
            revenue_variance=final_variance,
            confidence_interval=(
                mc_data["occupancy_distribution"]["p10"] if mc_data else final_revenue * 0.9,
                mc_data["occupancy_distribution"]["p90"] if mc_data else final_revenue * 1.1
            ),
            optimization_mode_used="ML_CONTROL_VARIATE" if mc_data else "ML_ONLY",
            computation_time_ms=computation_time_ms,
            trace_id=ml_data["trace_id"]
        )

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "hmrm-engine"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=get_port(8002))
