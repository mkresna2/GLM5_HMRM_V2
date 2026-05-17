from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Tuple
from datetime import date, datetime
import uuid

class BaseResponse(BaseModel):
    trace_id: str = Field(default_factory=lambda: f"trace_{uuid.uuid4().hex[:8]}")
    service_version: str = "2.0.0"

class RoomInventory(BaseModel):
    STD: int
    DLX: int
    STE: int

class RealTimeSignals(BaseModel):
    search_intensity_index: float = 1.0
    conversion_probability: float = 0.1
    competitor_price_index: float = 1.0
    cancellation_velocity_index: float = 1.0
    pickup_pace_index: float = 1.0
    geo_demand_spike_index: float = 1.0

class PricingEvaluateRequest(BaseModel):
    property_id: str
    arrival_date: date
    los: int = 1
    currency: str = "USD"
    room_inventory: Dict[str, int]
    otb: Dict[str, int]
    real_time_signals: RealTimeSignals
    mode: str = "hybrid"  # ml_only, hybrid, full_mc
    risk_aversion_lambda: float = 0.25

class PricingEvaluateResponse(BaseResponse):
    recommended_prices: Dict[str, float]
    expected_net_revenue: float
    revenue_variance: float
    confidence_interval: Tuple[float, float]
    optimization_mode_used: str
    computation_time_ms: int
