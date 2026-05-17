from fastapi import FastAPI
import os
import sys
import numpy as np
from scipy.optimize import minimize
from typing import Dict, Any, List, Optional

# Add common to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.models import BaseResponse
from common.server import get_port

app = FastAPI(title="HMRM Optimization Service")

class OptimizeRequest(BaseResponse):
    property_id: str
    arrival_date: str
    current_prices: Dict[str, float]
    constraints: Dict[str, Any]
    risk_aversion_lambda: float = 0.25

class OptimizeResponse(BaseResponse):
    optimal_prices: Dict[str, float]
    objective_value: float
    solver_status: str

@app.post("/internal/optimizer/solve", response_model=OptimizeResponse)
async def solve(request: OptimizeRequest):
    # This service solves for the price vector that maximizes:
    # E[Revenue] - lambda * Var(Revenue)
    
    current_prices = request.current_prices
    room_types = list(current_prices.keys())
    x0 = np.array([current_prices[rt] for rt in room_types])
    
    # Constraints
    bounds = []
    for rt in room_types:
        min_p = request.constraints.get("min_price", {}).get(rt, 100)
        max_p = request.constraints.get("max_price", {}).get(rt, 1000)
        bounds.append((min_p, max_p))
        
    # Mock Objective Function (in reality, this would call the ML/MC services)
    def objective(x):
        # x is the price vector
        # Simplified quadratic objective for demonstration
        # Maximize Revenue roughly means Prices around some sweet spot
        revenue = -np.sum((x - 250)**2) + 50000 
        variance = np.sum(x**2) * 0.01
        return -(revenue - request.risk_aversion_lambda * variance)
    
    res = minimize(objective, x0, bounds=bounds, method='SLSQP')
    
    optimal_prices = {rt: float(res.x[i]) for i, rt in enumerate(room_types)}
    
    return OptimizeResponse(
        optimal_prices=optimal_prices,
        objective_value=-float(res.fun),
        solver_status="optimal" if res.success else "failed",
        trace_id=request.trace_id
    )

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "optimization-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=get_port(8009))
