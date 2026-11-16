import io
import re
import pandas as pd
from decimal import Decimal
from datetime import datetime, date
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.audit_log import AuditLog
from app.engine.transaction_engine import to_decimal

class IngestionService:
    """
    Deterministic Smart Financial Data Ingestion.
    Parses and categorizes bank statements, Tally CSVs, and standard templates.
    Validates dates, monetary amounts, and detects duplicate records.
    """

    SUPPORTED_DATE_FORMATS = [
        "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y",
        "%d/%m/%y", "%d-%m-%y", "%Y/%m/%d"
    ]

    # Deterministic Classification Rules
    KEYWORD_CLASSIFICATION = {
        "SALARY": ("OUTFLOW", "PAYROLL"),
        "PAYROLL": ("OUTFLOW", "PAYROLL"),
        "STAFF": ("OUTFLOW", "PAYROLL"),
        "WAGES": ("OUTFLOW", "PAYROLL"),
        "RENT": ("OUTFLOW", "RENT"),
        "LEASE": ("OUTFLOW", "RENT"),
        "ELECTRICITY": ("OUTFLOW", "UTILITIES"),
        "POWER": ("OUTFLOW", "UTILITIES"),
        "WATER": ("OUTFLOW", "UTILITIES"),
        "INTERNET": ("OUTFLOW", "UTILITIES"),
        "TELEPHONE": ("OUTFLOW", "UTILITIES"),
        "BILL": ("OUTFLOW", "EXPENSE"),
        "SUPPLIER": ("OUTFLOW", "SUPPLIER_PAYMENT"),
        "PURCHASE": ("OUTFLOW", "SUPPLIER_PAYMENT"),
        "VENDOR": ("OUTFLOW", "SUPPLIER_PAYMENT"),
        "FREIGHT": ("OUTFLOW", "EXPENSE"),
        "TRANSPORT": ("OUTFLOW", "EXPENSE"),
        "CUSTOMER": ("INFLOW", "CUSTOMER_COLLECTION"),
        "SALES": ("INFLOW", "CUSTOMER_COLLECTION"),
        "COLLECTION": ("INFLOW", "CUSTOMER_COLLECTION"),
        "RECEIPT": ("INFLOW", "INCOME"),
        "INTEREST": ("INFLOW", "INCOME"),
        "REFUND": ("INFLOW", "INCOME")
    }

    @classmethod
    def parse_date_safely(cls, val: Any) -> Optional[date]:
        if val is None or pd.isna(val):
            return None
        val_str = str(val).strip()
        for fmt in cls.SUPPORTED_DATE_FORMATS:
            try:
                return datetime.strptime(val_str, fmt).date()
            except ValueError:
                continue
        # Fallback to dateutil/pandas if standard fails
        try:
            return pd.to_datetime(val_str, dayfirst=True).date()
        except Exception:
            return None

    @classmethod
    def parse_amount_safely(cls, val: Any) -> Decimal:
        if val is None or pd.isna(val):
            return Decimal('0.00')
        val_str = str(val).strip().replace(',', '').replace('₹', '').replace('Rs.', '').replace(' ', '')
        try:
            return to_decimal(val_str)
        except Exception:
            return Decimal('0.00')

    @classmethod
    def infer_category(cls, description: str, direction: str) -> str:
        desc_upper = description.upper()
        for kw, (dir_expected, tx_type) in cls.KEYWORD_CLASSIFICATION.items():
            if kw in desc_upper and (direction == dir_expected or direction == ""):
                return tx_type
        return "CUSTOMER_COLLECTION" if direction == "INFLOW" else "EXPENSE"

    @classmethod
    def parse_and_preview_csv(
        cls,
        csv_content: bytes,
        db: Session,
        business_id: int
    ) -> Dict[str, Any]:
        """
        Parses CSV, performs duplicate checking against existing records in DB,
        validates lines, and prepares an interactive preview for the user.
        """
        try:
            df = pd.read_csv(io.BytesIO(csv_content), dtype=str)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to parse CSV file: {str(e)}",
                "total_rows": 0,
                "valid_rows": 0,
                "items": []
            }

        # Normalize column headers
        col_map = {col: col.strip().lower().replace(" ", "_") for col in df.columns}
        df.rename(columns=col_map, inplace=True)

        # Detect column schema
        # Common schemas:
        # Standard: date, description, amount, direction, type, reference
        # Bank Statement: date, narration/description, withdrawal/debit, deposit/credit, ref_no
        # Tally Export: voucher_date, particulars, debit_amount, credit_amount, voucher_no

        existing_txs = db.query(Transaction).filter(Transaction.business_id == business_id).all()
        existing_signatures = set()
        for t in existing_txs:
            # Signature: (date, amount, ref or desc[:20])
            sig = (t.transaction_date, t.amount, t.reference_number or t.description[:20].lower())
            existing_signatures.add(sig)

        parsed_items: List[Dict[str, Any]] = []
        errors: List[str] = []

        for idx, row in df.iterrows():
            row_num = idx + 2 # 1-based index + header
            
            # Find date column
            date_val = None
            for d_col in ['date', 'txn_date', 'transaction_date', 'voucher_date', 'value_date']:
                if d_col in row and pd.notna(row[d_col]):
                    date_val = cls.parse_date_safely(row[d_col])
                    if date_val:
                        break

            if not date_val:
                errors.append(f"Row {row_num}: Missing or invalid transaction date.")
                continue

            # Find description column
            desc = ""
            for desc_col in ['description', 'narration', 'particulars', 'details', 'remarks']:
                if desc_col in row and pd.notna(row[desc_col]):
                    desc = str(row[desc_col]).strip()
                    break
            if not desc:
                desc = "Bank Transaction"

            # Find amount and direction
            amount = Decimal('0.00')
            direction = "INFLOW"

            # Check if separate debit/credit columns exist
            has_debit_credit = False
            for deb_col in ['debit', 'withdrawal', 'dr', 'debit_amount']:
                if deb_col in row and pd.notna(row[deb_col]) and str(row[deb_col]).strip():
                    val = cls.parse_amount_safely(row[deb_col])
                    if val > Decimal('0.00'):
                        amount = val
                        direction = "OUTFLOW"
                        has_debit_credit = True
                        break

            if not has_debit_credit:
                for cred_col in ['credit', 'deposit', 'cr', 'credit_amount']:
                    if cred_col in row and pd.notna(row[cred_col]) and str(row[cred_col]).strip():
                        val = cls.parse_amount_safely(row[cred_col])
                        if val > Decimal('0.00'):
                            amount = val
                            direction = "INFLOW"
                            has_debit_credit = True
                            break

            if not has_debit_credit:
                # Look for single 'amount' and optional 'direction' / 'type'
                for amt_col in ['amount', 'txn_amount', 'total']:
                    if amt_col in row and pd.notna(row[amt_col]):
                        amount = cls.parse_amount_safely(row[amt_col])
                        break
                
                # Direction column
                for dir_col in ['direction', 'type', 'd_c']:
                    if dir_col in row and pd.notna(row[dir_col]):
                        d_val = str(row[dir_col]).upper().strip()
                        if 'OUT' in d_val or 'DR' in d_val or 'DEBIT' in d_val or '-' in str(row.get('amount', '')):
                            direction = "OUTFLOW"
                        elif 'IN' in d_val or 'CR' in d_val or 'CREDIT' in d_val:
                            direction = "INFLOW"
                        break

            if amount <= Decimal('0.00'):
                errors.append(f"Row {row_num}: Zero or invalid monetary amount.")
                continue

            # Reference number
            ref = ""
            for ref_col in ['reference', 'ref_no', 'utr', 'cheque_no', 'voucher_no', 'reference_number']:
                if ref_col in row and pd.notna(row[ref_col]):
                    ref = str(row[ref_col]).strip()
                    break

            inferred_type = cls.infer_category(desc, direction)

            # Duplicate check
            sig = (date_val, amount, ref or desc[:20].lower())
            is_dup = sig in existing_signatures

            parsed_items.append({
                "row_number": row_num,
                "transaction_date": date_val.isoformat(),
                "formatted_date": date_val.strftime("%d/%m/%Y"),
                "amount": amount,
                "direction": direction,
                "transaction_type": inferred_type,
                "description": desc,
                "reference_number": ref or f"IMP-{row_num}",
                "payment_mode": "Bank Transfer",
                "is_duplicate": is_dup,
                "selected": not is_dup # default select non-duplicates
            })

        return {
            "success": True,
            "total_rows": len(df),
            "valid_rows": len(parsed_items),
            "duplicate_count": sum(1 for item in parsed_items if item["is_duplicate"]),
            "errors": errors,
            "items": parsed_items
        }

    @classmethod
    def commit_imported_transactions(
        cls,
        items: List[Dict[str, Any]],
        db: Session,
        business_id: int
    ) -> Dict[str, Any]:
        """
        Commits verified user-corrected import items into the database.
        """
        committed_count = 0
        skipped_count = 0

        for item in items:
            if not item.get("selected", True):
                skipped_count += 1
                continue

            tx_date = cls.parse_date_safely(item["transaction_date"])
            if not tx_date:
                skipped_count += 1
                continue

            amt = to_decimal(item["amount"])
            if amt <= Decimal('0.00'):
                skipped_count += 1
                continue

            tx = Transaction(
                business_id=business_id,
                transaction_date=tx_date,
                amount=amt,
                direction=item.get("direction", "INFLOW"),
                transaction_type=item.get("transaction_type", "OTHER"),
                description=item.get("description", "Imported Transaction"),
                payment_mode=item.get("payment_mode", "Bank Transfer"),
                reference_number=item.get("reference_number"),
                category="Imported",
                is_reconciled=True
            )
            db.add(tx)
            committed_count += 1

        audit = AuditLog(
            business_id=business_id,
            action="CSV_IMPORT",
            entity_type="TRANSACTION",
            details=f"Imported {committed_count} transactions via CSV ingestion."
        )
        db.add(audit)
        db.commit()

        return {
            "committed_count": committed_count,
            "skipped_count": skipped_count,
            "message": f"Successfully imported {committed_count} financial transactions."
        }

    @classmethod
    def generate_sample_csv_template(cls) -> str:
        """Returns standard CSV template with headers and realistic sample rows."""
        return (
            "Date,Description,Amount,Direction,Transaction Type,Reference\n"
            "15/05/2026,Payment received from Sharma Traders,180000.00,INFLOW,CUSTOMER_COLLECTION,UTR99881122\n"
            "18/05/2026,Supplier payment National Agro Foods,250000.00,OUTFLOW,SUPPLIER_PAYMENT,RTGS88776655\n"
            "20/05/2026,Monthly warehouse rent lease,35000.00,OUTFLOW,RENT,NEFT11223344\n"
            "25/05/2026,Staff monthly salary disbursement,85000.00,OUTFLOW,PAYROLL,NEFT55667788\n"
            "28/05/2026,Collection from Verma Distributors,120000.00,INFLOW,CUSTOMER_COLLECTION,UTR33445566\n"
        )
