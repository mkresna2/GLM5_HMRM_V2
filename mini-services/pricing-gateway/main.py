from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx
import time
import os
import sys
from typing import Dict, Any

# Add common to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.models import PricingEvaluateRequest, PricingEvaluateResponse
from common.server import get_port

app = FastAPI(title="HMRM Pricing Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs from environment or defaults
HMRM_ENGINE_URL = os.getenv("HMRM_ENGINE_URL", "http://localhost:8002")

@app.post("/internal/pricing/evaluate", response_model=PricingEvaluateResponse)
async def evaluate_pricing(request: PricingEvaluateRequest):
    start_time = time.time()
    
    async with httpx.AsyncClient() as client:
        try:
            # Forward request to HMRM Engine
            response = await client.post(
                f"{HMRM_ENGINE_URL}/internal/pricing/evaluate",
                json=request.model_dump(mode='json'),
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"HMRM Engine error: {response.text}"
                )
            
            data = response.json()
            return data
            
        except httpx.RequestError as exc:
            # Fallback logic could go here
            raise HTTPException(
                status_code=503, 
                detail=f"HMRM Engine unavailable: {str(exc)}"
            )

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "pricing-gateway"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=get_port(8001))
