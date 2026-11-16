import io
import csv
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional, List
from decimal import Decimal

from app.database import get_db
from app.models.business import Business
from app.models.transaction import Transaction
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.audit_log import AuditLog
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse, TransactionCommitRequest
from app.api.deps import get_active_business
from app.services.ingestion_service import IngestionService
from app.engine.transaction_engine import to_decimal

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    search: Optional[str] = None,
    transaction_type: Optional[str] = None,
    direction: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        return []

    query = db.query(Transaction).filter(Transaction.business_id == business.id)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Transaction.description.ilike(search_filter)) |
            (Transaction.reference_number.ilike(search_filter))
        )
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)
    if direction:
        query = query.filter(Transaction.direction == direction)
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)

    txs = query.order_by(Transaction.transaction_date.desc(), Transaction.id.desc()).offset(offset).limit(limit).all()

    # Enrich customer and supplier names
    response_items = []
    for t in txs:
        cust_name = t.customer.name if t.customer else None
        sup_name = t.supplier.name if t.supplier else None
        
        response_items.append(TransactionResponse(
            id=t.id,
            business_id=t.business_id,
            transaction_date=t.transaction_date,
            amount=t.amount,
            direction=t.direction,
            transaction_type=t.transaction_type,
            customer_id=t.customer_id,
            customer_name=cust_name,
            supplier_id=t.supplier_id,
            supplier_name=sup_name,
            description=t.description,
            payment_mode=t.payment_mode,
            reference_number=t.reference_number,
            category=t.category,
            is_reconciled=t.is_reconciled,
            created_at=t.created_at
        ))
    return response_items

@router.post("", response_model=TransactionResponse)
def create_transaction(
    tx_in: TransactionCreate,
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        raise HTTPException(status_code=400, detail="No active business found.")

    amt = to_decimal(tx_in.amount)
    if amt <= Decimal('0.00'):
        raise HTTPException(status_code=400, detail="Transaction amount must be strictly greater than zero.")

    # Deduplication check
    if tx_in.reference_number:
        dup = db.query(Transaction).filter(
            Transaction.business_id == business.id,
            Transaction.reference_number == tx_in.reference_number
        ).first()
        if dup:
            raise HTTPException(
                status_code=400,
                detail=f"A transaction with reference number '{tx_in.reference_number}' already exists."
            )

    tx = Transaction(
        business_id=business.id,
        transaction_date=tx_in.transaction_date,
        amount=amt,
        direction=tx_in.direction,
        transaction_type=tx_in.transaction_type,
        customer_id=tx_in.customer_id,
        supplier_id=tx_in.supplier_id,
        description=tx_in.description,
        payment_mode=tx_in.payment_mode or "Bank Transfer",
        reference_number=tx_in.reference_number,
        category=tx_in.category,
        is_reconciled=True
    )
    db.add(tx)
    db.flush()

    # Audit log
    audit = AuditLog(
        business_id=business.id,
        action="CREATE",
        entity_type="TRANSACTION",
        entity_id=tx.id,
        details=f"Created {tx.direction} transaction of ₹ {tx.amount:,.2f} ({tx.transaction_type})."
    )
    db.add(audit)
    db.commit()
    db.refresh(tx)

    return TransactionResponse(
        id=tx.id,
        business_id=tx.business_id,
        transaction_date=tx.transaction_date,
        amount=tx.amount,
        direction=tx.direction,
        transaction_type=tx.transaction_type,
        customer_id=tx.customer_id,
        customer_name=tx.customer.name if tx.customer else None,
        supplier_id=tx.supplier_id,
        supplier_name=tx.supplier.name if tx.supplier else None,
        description=tx.description,
        payment_mode=tx.payment_mode,
        reference_number=tx.reference_number,
        category=tx.category,
        is_reconciled=tx.is_reconciled,
        created_at=tx.created_at
    )

@router.put("/{id}", response_model=TransactionResponse)
def update_transaction(
    id: int,
    tx_in: TransactionUpdate,
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        raise HTTPException(status_code=400, detail="No active business found.")

    tx = db.query(Transaction).filter(Transaction.id == id, Transaction.business_id == business.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    if tx_in.transaction_date is not None:
        tx.transaction_date = tx_in.transaction_date
    if tx_in.amount is not None:
        amt = to_decimal(tx_in.amount)
        if amt <= Decimal('0.00'):
            raise HTTPException(status_code=400, detail="Transaction amount must be strictly positive.")
        tx.amount = amt
    if tx_in.direction is not None:
        tx.direction = tx_in.direction
    if tx_in.transaction_type is not None:
        tx.transaction_type = tx_in.transaction_type
    if tx_in.customer_id is not None:
        tx.customer_id = tx_in.customer_id
    if tx_in.supplier_id is not None:
        tx.supplier_id = tx_in.supplier_id
    if tx_in.description is not None:
        tx.description = tx_in.description
    if tx_in.payment_mode is not None:
        tx.payment_mode = tx_in.payment_mode
    if tx_in.reference_number is not None:
        tx.reference_number = tx_in.reference_number
    if tx_in.category is not None:
        tx.category = tx_in.category

    audit = AuditLog(
        business_id=business.id,
        action="UPDATE",
        entity_type="TRANSACTION",
        entity_id=tx.id,
        details=f"Updated transaction details for ID {tx.id}."
    )
    db.add(audit)
    db.commit()
    db.refresh(tx)

    return TransactionResponse(
        id=tx.id,
        business_id=tx.business_id,
        transaction_date=tx.transaction_date,
        amount=tx.amount,
        direction=tx.direction,
        transaction_type=tx.transaction_type,
        customer_id=tx.customer_id,
        customer_name=tx.customer.name if tx.customer else None,
        supplier_id=tx.supplier_id,
        supplier_name=tx.supplier.name if tx.supplier else None,
        description=tx.description,
        payment_mode=tx.payment_mode,
        reference_number=tx.reference_number,
        category=tx.category,
        is_reconciled=tx.is_reconciled,
        created_at=tx.created_at
    )

@router.delete("/{id}")
def delete_transaction(
    id: int,
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        raise HTTPException(status_code=400, detail="No active business found.")

    tx = db.query(Transaction).filter(Transaction.id == id, Transaction.business_id == business.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    audit = AuditLog(
        business_id=business.id,
        action="DELETE",
        entity_type="TRANSACTION",
        entity_id=tx.id,
        details=f"Deleted {tx.direction} transaction ID {tx.id} of ₹ {tx.amount:,.2f}."
    )
    db.add(audit)
    db.delete(tx)
    db.commit()

    return {"message": "Transaction deleted successfully."}

MAX_CSV_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 Megabytes

def validate_csv_upload_metadata(filename: Optional[str], size: int) -> None:
    if not filename or not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only standard .csv files are supported.")
    if size > MAX_CSV_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum supported CSV upload size is 5 MB."
        )

@router.post("/upload")
async def upload_csv_preview(
    file: UploadFile = File(...),
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        raise HTTPException(status_code=400, detail="No active business found.")

    content = await file.read()
    validate_csv_upload_metadata(file.filename, len(content))

    try:
        preview_result = IngestionService.parse_and_preview_csv(
            csv_content=content,
            db=db,
            business_id=business.id
        )
        return preview_result
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Unable to decode file. Please ensure the CSV is UTF-8 encoded.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV file: {str(e)}")

@router.post("/commit-import")
def commit_imported_transactions(
    req: TransactionCommitRequest,
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        raise HTTPException(status_code=400, detail="No active business found.")

    items_dict = [item.dict() for item in req.items]
    result = IngestionService.commit_imported_transactions(
        items=items_dict,
        db=db,
        business_id=business.id
    )
    return result

@router.get("/sample-csv")
def download_sample_csv():
    csv_str = IngestionService.generate_sample_csv_template()
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=guardian_sample_transactions.csv"}
    )

@router.get("/export")
def export_transactions_csv(
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        raise HTTPException(status_code=400, detail="No active business found.")

    txs = db.query(Transaction).filter(Transaction.business_id == business.id).order_by(Transaction.transaction_date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Date", "Description", "Amount", "Direction", "Transaction Type", "Payment Mode", "Reference Number", "Category"])

    for t in txs:
        writer.writerow([
            t.id,
            t.transaction_date.strftime("%d/%m/%Y"),
            t.description,
            f"{t.amount:.2f}",
            t.direction,
            t.transaction_type,
            t.payment_mode or "",
            t.reference_number or "",
            t.category or ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=transactions_{business.name.replace(' ', '_')}.csv"}
    )
