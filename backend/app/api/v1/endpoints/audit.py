from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.audit_log import AuditLogResponse
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/logs", response_model=List[AuditLogResponse], summary="Query tamper-evident audit logs")
def get_audit_logs(
    resource_type: Optional[str] = None,
    action_type: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
) -> List[AuditLogResponse]:
    """Retrieves immutable audit trail of accesses to sensitive medical data, actions, and resolutions."""
    logs = AuditService.list_logs(db, limit=limit, resource_type=resource_type, action_type=action_type)
    return [AuditLogResponse.model_validate(l) for l in logs]
