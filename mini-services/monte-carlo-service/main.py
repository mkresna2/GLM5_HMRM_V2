from fastapi import FastAPI
import os
import sys
import numpy as np
from typing import Dict, Any, List, Tuple, Optional

# Add common to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.models import BaseResponse
from common.server import get_port

app = FastAPI(title="HMRM Monte Carlo Service")

class MCSimulateRequest(BaseResponse):
    property_id: str
    arrival_date: str
    simulation_runs: int = 1000
    price_vector: Dict[str, float]
    distribution_parameters: Dict[str, Any]
    control_variate_prediction: Optional[float] = None

class MCSimulateResponse(BaseResponse):
    mc_mean_revenue: float
    mc_adjusted_mean_revenue: float
    mc_variance: float
    overbooking_cost_mean: float
    denied_bookings_mean: float
    occupancy_distribution: Dict[str, float]
    simulation_time_ms: int

@app.post("/internal/mc/simulate", response_model=MCSimulateResponse)
async def simulate(request: MCSimulateRequest):
    import time
    start_sim = time.time()
    
    runs = request.simulation_runs
    prices = request.price_vector
    params = request.distribution_parameters
    
    # Extract params with defaults
    arrival_lambda = params.get("arrival_rate_lambda", 20.0)
    cancel_rates = params.get("cancellation_rate_by_room", {"STD": 0.2, "DLX": 0.15, "STE": 0.1})
    
    # 1. Sample Demand Arrivals (Poisson)
    arrivals = np.random.poisson(arrival_lambda, runs)
    
    # 2. Simulate Bookings and Revenue
    # For each run, we simulate how many people actually stay
    revenues = []
    denied_counts = []
    
    for arrival_count in arrivals:
        # Sample room type preferences (multinomial)
        # Simplified: each arrival has a 50/35/15 split
        prefs = np.random.multinomial(arrival_count, [0.5, 0.35, 0.15])
        
        run_revenue = 0
        run_denied = 0
        
        # Room Type mapping
        room_types = ["STD", "DLX", "STE"]
        for i, rt in enumerate(room_types):
            count = prefs[i]
            # Simulate cancellation (Bernoulli)
            stays = np.random.binomial(count, 1 - cancel_rates.get(rt, 0.2))
            
            # Simplified capacity check (would use real inventory in production)
            capacity = 20 if rt == "STD" else 15 if rt == "DLX" else 5
            
            booked = min(stays, capacity)
            denied = max(0, stays - capacity)
            
            run_revenue += booked * prices.get(rt, 200)
            run_denied += denied
            
        revenues.append(run_revenue)
        denied_counts.append(run_denied)
        
    revenues = np.array(revenues)
    mean_rev = float(np.mean(revenues))
    var_rev = float(np.var(revenues))
    
    # Control Variate Adjustment
    # mc_adj = mc_mean + c*(pred - mc_mean_f)
    # For now, we'll just return the mean if no control variate is provided
    mc_adjusted = mean_rev
    if request.control_variate_prediction:
        # Simplified adjustment logic
        mc_adjusted = (mean_rev + request.control_variate_prediction) / 2
        
    # Distribution percentiles
    occ_dist = {
        "p10": float(np.percentile(revenues, 10)),
        "p50": float(np.percentile(revenues, 50)),
        "p90": float(np.percentile(revenues, 90))
    }
    
    return MCSimulateResponse(
        mc_mean_revenue=mean_rev,
        mc_adjusted_mean_revenue=mc_adjusted,
        mc_variance=var_rev,
        overbooking_cost_mean=float(np.mean(denied_counts)) * 100, # $100 penalty per denied booking
        denied_bookings_mean=float(np.mean(denied_counts)),
        occupancy_distribution=occ_dist,
        simulation_time_ms=int((time.time() - start_sim) * 1000),
        trace_id=request.trace_id
    )

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "monte-carlo-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=get_port(8004))
