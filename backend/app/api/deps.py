from fastapi import Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.business import Business
from app.auth import get_current_user

def get_active_business(
    x_business_id: Optional[str] = Header(None),
    business_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Optional[Business]:
    # Extract explicit business identifier if provided
    biz_id = business_id
    if biz_id is None and x_business_id:
        try:
            biz_id = int(x_business_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid x-business-id header format.")

    if biz_id is not None:
        biz = db.query(Business).filter(Business.id == biz_id).first()
        if not biz:
            raise HTTPException(status_code=404, detail="Requested business was not found.")
        if biz.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You do not have permission to access this business."
            )
        return biz

    # Default to the most recently created business belonging exclusively to current user
    biz = db.query(Business).filter(Business.user_id == current_user.id).order_by(Business.id.desc()).first()
    return biz
