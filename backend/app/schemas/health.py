from datetime import datetime
from pydantic import BaseModel, Field


class SystemHealthStatus(BaseModel):
    status: str = Field(default="healthy", description="Overall health state")
    timestamp: datetime = Field(description="Server timestamp (UTC)")
    version: str = Field(description="Software version")
    database: str = Field(description="Underlying database driver name")
    active_simulators: int = Field(default=0, description="Count of actively generating virtual sensor loops")
    disclaimer: str = Field(
        default="ResQCare AI is a software prototype for research and monitoring simulation. Not an FDA/CE certified medical device.",
        description="Mandatory clinical safety disclaimer"
    )

