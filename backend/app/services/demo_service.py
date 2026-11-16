from decimal import Decimal
from datetime import date, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.business import Business
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.transaction import Transaction
from app.models.invoice import Invoice
from app.models.invoice_payment import InvoicePayment
from app.models.audit_log import AuditLog
from app.engine.transaction_engine import TransactionEngine, to_decimal

class DemoService:
    """
    Seeds and manages the fictional 'Sharma & Co.' wholesale distribution dataset.
    Features:
    - 6 realistic customers with distinct payment track records (on-time, chronic delay, partial, new).
    - 4 suppliers with realistic payment schedules.
    - Over 60 historical transactions reconciled with opening balance.
    - Pending receivables and payables designed to illustrate a realistic liquidity buffer dip.
    - Clean isolation: Can be loaded or reset without touching real business accounts.
    """

    @classmethod
    def load_demo_data(cls, db: Session, user_id: int) -> Business:
        # Check if a demo business already exists for this user
        existing_demo = db.query(Business).filter(
            Business.user_id == user_id,
            Business.is_demo == True
        ).first()

        if existing_demo:
            cls.reset_demo_data(db, existing_demo.id)
            demo_biz = existing_demo
        else:
            demo_biz = Business(
                user_id=user_id,
                name="Sharma & Co.",
                business_type="Wholesale Distribution (FMCG & Provisions)",
                currency="INR",
                opening_cash_balance=Decimal('350000.00'),
                opening_balance_date=date.today() - timedelta(days=60),
                minimum_reserve=Decimal('150000.00'),
                is_demo=True
            )
            db.add(demo_biz)
            db.commit()
            db.refresh(demo_biz)

        today = date.today()

        # 1. Customers
        customers_data = [
            {"name": "Sharma Traders", "email": "contact@sharmatraders.in", "phone": "+91 98201 11223", "terms": 30},
            {"name": "Gupta Enterprises", "email": "accounts@guptaenterprises.com", "phone": "+91 98310 22334", "terms": 30},
            {"name": "Verma Distributors", "email": "verma.dist@gmail.com", "phone": "+91 98402 33445", "terms": 45},
            {"name": "Rajasthan Wholesale Mart", "email": "ops@rajmart.co.in", "phone": "+91 98111 44556", "terms": 30},
            {"name": "Om Enterprises", "email": "om.billing@rediffmail.com", "phone": "+91 98660 55667", "terms": 30},
            {"name": "Sunrise Retailers", "email": "sunrise.retail@outlook.com", "phone": "+91 98990 66778", "terms": 15},
        ]
        cust_map = {}
        for c in customers_data:
            cust = Customer(
                business_id=demo_biz.id,
                name=c["name"],
                contact_email=c["email"],
                contact_phone=c["phone"],
                payment_terms_days=c["terms"]
            )
            db.add(cust)
            db.flush()
            cust_map[c["name"]] = cust

        # 2. Suppliers
        suppliers_data = [
            {"name": "National Agro Foods", "cat": "Grains & Pulses", "email": "sales@nationalagro.in", "phone": "+91 99100 11001", "terms": 30},
            {"name": "Bharat Packaging Solutions", "cat": "Packaging Materials", "email": "orders@bharatpack.com", "phone": "+91 99200 22002", "terms": 30},
            {"name": "Krishna Logistics & Freight", "cat": "Transport & Freight", "email": "dispatch@krishnalogistics.in", "phone": "+91 99300 33003", "terms": 15},
            {"name": "Metro Warehousing Corp", "cat": "Storage Facilities", "email": "billing@metrowarehousing.com", "phone": "+91 99400 44004", "terms": 30},
        ]
        sup_map = {}
        for s in suppliers_data:
            sup = Supplier(
                business_id=demo_biz.id,
                name=s["name"],
                category=s["cat"],
                contact_email=s["email"],
                contact_phone=s["phone"],
                payment_terms_days=s["terms"]
            )
            db.add(sup)
            db.flush()
            sup_map[s["name"]] = sup

        # 3. Historical Invoices & Reconciled Payments
        # Sharma Traders: Reliable prompt payer (low risk, 0-2 days delay)
        # Verma Distributors: Moderate risk (10-15 days late consistently)
        # Rajasthan Wholesale Mart: High risk (frequent late payments 25-35 days, overdue invoice)
        # Gupta Enterprises: Mixed payer, mostly on-time
        # Sunrise Retailers: Fast small retailer
        # Om Enterprises: Newer customer with pending large invoice

        invoices_plan = [
            # Historical settled invoices
            {
                "customer": "Sharma Traders",
                "inv_num": "INV-2026-001",
                "issue": today - timedelta(days=55),
                "due": today - timedelta(days=25),
                "total": Decimal('180000.00'),
                "paid": Decimal('180000.00'),
                "payment_date": today - timedelta(days=24), # 1 day early
                "type": "RECEIVABLE"
            },
            {
                "customer": "Sharma Traders",
                "inv_num": "INV-2026-006",
                "issue": today - timedelta(days=35),
                "due": today - timedelta(days=5),
                "total": Decimal('220000.00'),
                "paid": Decimal('220000.00'),
                "payment_date": today - timedelta(days=5), # On due date
                "type": "RECEIVABLE"
            },
            {
                "customer": "Gupta Enterprises",
                "inv_num": "INV-2026-002",
                "issue": today - timedelta(days=50),
                "due": today - timedelta(days=20),
                "total": Decimal('140000.00'),
                "paid": Decimal('140000.00'),
                "payment_date": today - timedelta(days=16), # 4 days late
                "type": "RECEIVABLE"
            },
            {
                "customer": "Verma Distributors",
                "inv_num": "INV-2026-003",
                "issue": today - timedelta(days=58),
                "due": today - timedelta(days=13),
                "total": Decimal('250000.00'),
                "paid": Decimal('250000.00'),
                "payment_date": today - timedelta(days=1), # 12 days late
                "type": "RECEIVABLE"
            },
            {
                "customer": "Rajasthan Wholesale Mart",
                "inv_num": "INV-2026-004",
                "issue": today - timedelta(days=52),
                "due": today - timedelta(days=22),
                "total": Decimal('310000.00'),
                "paid": Decimal('310000.00'),
                "payment_date": today - timedelta(days=2), # 20 days late
                "type": "RECEIVABLE"
            },
            {
                "customer": "Sunrise Retailers",
                "inv_num": "INV-2026-005",
                "issue": today - timedelta(days=40),
                "due": today - timedelta(days=25),
                "total": Decimal('65000.00'),
                "paid": Decimal('65000.00'),
                "payment_date": today - timedelta(days=24), # 1 day late
                "type": "RECEIVABLE"
            },
            {
                "customer": "Sunrise Retailers",
                "inv_num": "INV-2026-015",
                "issue": today - timedelta(days=56),
                "due": today - timedelta(days=41),
                "total": Decimal('75000.00'),
                "paid": Decimal('75000.00'),
                "payment_date": today - timedelta(days=41), # On due date
                "type": "RECEIVABLE"
            },
            {
                "customer": "Gupta Enterprises",
                "inv_num": "INV-2026-007",
                "issue": today - timedelta(days=60),
                "due": today - timedelta(days=30),
                "total": Decimal('120000.00'),
                "paid": Decimal('120000.00'),
                "payment_date": today - timedelta(days=29), # 1 day early
                "type": "RECEIVABLE"
            },
            {
                "customer": "Verma Distributors",
                "inv_num": "INV-2026-008",
                "issue": today - timedelta(days=59),
                "due": today - timedelta(days=14),
                "total": Decimal('180000.00'),
                "paid": Decimal('180000.00'),
                "payment_date": today - timedelta(days=1), # 13 days late
                "type": "RECEIVABLE"
            },
            {
                "customer": "Rajasthan Wholesale Mart",
                "inv_num": "INV-2026-009",
                "issue": today - timedelta(days=60),
                "due": today - timedelta(days=30),
                "total": Decimal('240000.00'),
                "paid": Decimal('240000.00'),
                "payment_date": today - timedelta(days=2), # 28 days late
                "type": "RECEIVABLE"
            },

            # PENDING / UPCOMING CUSTOMER INVOICES
            {
                "customer": "Sharma Traders",
                "inv_num": "INV-2026-010",
                "issue": today - timedelta(days=10),
                "due": today + timedelta(days=6), # Due in 6 days
                "total": Decimal('195000.00'),
                "paid": Decimal('0.00'),
                "type": "RECEIVABLE"
            },
            {
                "customer": "Gupta Enterprises",
                "inv_num": "INV-2026-011",
                "issue": today - timedelta(days=8),
                "due": today + timedelta(days=12), # Due in 12 days
                "total": Decimal('160000.00'),
                "paid": Decimal('0.00'),
                "type": "RECEIVABLE"
            },
            {
                "customer": "Verma Distributors",
                "inv_num": "INV-2026-012",
                "issue": today - timedelta(days=20),
                "due": today + timedelta(days=15), # Due in 15 days
                "total": Decimal('280000.00'),
                "paid": Decimal('50000.00'), # Partially paid
                "payment_date": today - timedelta(days=3),
                "type": "RECEIVABLE"
            },
            {
                "customer": "Rajasthan Wholesale Mart",
                "inv_num": "INV-2026-013",
                "issue": today - timedelta(days=38),
                "due": today - timedelta(days=8), # OVERDUE by 8 days!
                "total": Decimal('340000.00'),
                "paid": Decimal('0.00'),
                "type": "RECEIVABLE"
            },
            {
                "customer": "Om Enterprises",
                "inv_num": "INV-2026-014",
                "issue": today - timedelta(days=5),
                "due": today + timedelta(days=22), # Due in 22 days
                "total": Decimal('175000.00'),
                "paid": Decimal('0.00'),
                "type": "RECEIVABLE"
            },

            # SUPPLIER BILLS (Historical Settled)
            {
                "supplier": "National Agro Foods",
                "inv_num": "BILL-AGRO-101",
                "issue": today - timedelta(days=55),
                "due": today - timedelta(days=25),
                "total": Decimal('280000.00'),
                "paid": Decimal('280000.00'),
                "payment_date": today - timedelta(days=25),
                "type": "PAYABLE"
            },
            {
                "supplier": "Bharat Packaging Solutions",
                "inv_num": "BILL-PACK-201",
                "issue": today - timedelta(days=48),
                "due": today - timedelta(days=18),
                "total": Decimal('62000.00'),
                "paid": Decimal('62000.00'),
                "payment_date": today - timedelta(days=18),
                "type": "PAYABLE"
            },
            {
                "supplier": "Krishna Logistics & Freight",
                "inv_num": "BILL-LOG-301",
                "issue": today - timedelta(days=35),
                "due": today - timedelta(days=20),
                "total": Decimal('48000.00'),
                "paid": Decimal('48000.00'),
                "payment_date": today - timedelta(days=20),
                "type": "PAYABLE"
            },

            # UPCOMING SUPPLIER OBLIGATIONS (Next 30 days)
            {
                "supplier": "National Agro Foods",
                "inv_num": "BILL-AGRO-102",
                "issue": today - timedelta(days=15),
                "due": today + timedelta(days=8), # Heavy grain bill due Day 8!
                "total": Decimal('310000.00'),
                "paid": Decimal('0.00'),
                "type": "PAYABLE"
            },
            {
                "supplier": "Bharat Packaging Solutions",
                "inv_num": "BILL-PACK-202",
                "issue": today - timedelta(days=12),
                "due": today + timedelta(days=14),
                "total": Decimal('55000.00'),
                "paid": Decimal('0.00'),
                "type": "PAYABLE"
            },
            {
                "supplier": "Krishna Logistics & Freight",
                "inv_num": "BILL-LOG-302",
                "issue": today - timedelta(days=5),
                "due": today + timedelta(days=10),
                "total": Decimal('42000.00'),
                "paid": Decimal('0.00'),
                "type": "PAYABLE"
            },
            {
                "supplier": "Metro Warehousing Corp",
                "inv_num": "BILL-WH-401",
                "issue": today - timedelta(days=10),
                "due": today + timedelta(days=18),
                "total": Decimal('65000.00'),
                "paid": Decimal('0.00'),
                "type": "PAYABLE"
            }
        ]

        # Save Invoices and record historical transactions
        for item in invoices_plan:
            is_rec = item["type"] == "RECEIVABLE"
            cust = cust_map.get(item.get("customer")) if is_rec else None
            sup = sup_map.get(item.get("supplier")) if not is_rec else None

            inv = Invoice(
                business_id=demo_biz.id,
                customer_id=cust.id if cust else None,
                supplier_id=sup.id if sup else None,
                invoice_type=item["type"],
                invoice_number=item["inv_num"],
                issue_date=item["issue"],
                due_date=item["due"],
                total_amount=item["total"],
                paid_amount=item["paid"],
                status="PAID" if item["paid"] >= item["total"] else ("PARTIALLY_PAID" if item["paid"] > 0 else ("OVERDUE" if item["due"] < today else "UNPAID"))
            )
            db.add(inv)
            db.flush()

            # If there was a payment recorded, add corresponding Transaction and InvoicePayment
            if item["paid"] > Decimal('0.00') and "payment_date" in item:
                tx_dir = "INFLOW" if is_rec else "OUTFLOW"
                tx_type = "CUSTOMER_COLLECTION" if is_rec else "SUPPLIER_PAYMENT"
                desc = f"Collection for {item['inv_num']} from {item['customer']}" if is_rec else f"Payment for {item['inv_num']} to {item['supplier']}"

                tx = Transaction(
                    business_id=demo_biz.id,
                    transaction_date=item["payment_date"],
                    amount=item["paid"],
                    direction=tx_dir,
                    transaction_type=tx_type,
                    customer_id=cust.id if cust else None,
                    supplier_id=sup.id if sup else None,
                    description=desc,
                    payment_mode="Bank Transfer (RTGS/NEFT)",
                    reference_number=f"UTR-{item['inv_num'][-6:]}",
                    category="Trade Operations",
                    is_reconciled=True
                )
                db.add(tx)
                db.flush()

                pay_rec = InvoicePayment(
                    invoice_id=inv.id,
                    transaction_id=tx.id,
                    payment_date=item["payment_date"],
                    amount=item["paid"],
                    notes="Settlement recorded via bank"
                )
                db.add(pay_rec)

        # 4. Recurring Overhead Transactions (Salaries, Rent, Power)
        # 2 months of salaries and rent to provide authentic operating history
        overheads = [
            # Month -1 overheads
            {"date": today - timedelta(days=50), "amount": Decimal('75000.00'), "type": "PAYROLL", "desc": "Staff Salaries (5 Warehouse + 2 Accounts staff)"},
            {"date": today - timedelta(days=48), "amount": Decimal('35000.00'), "type": "RENT", "desc": "Warehouse & Central Depot Lease"},
            {"date": today - timedelta(days=45), "amount": Decimal('14500.00'), "type": "UTILITIES", "desc": "Commercial Electricity & Cold Storage Power"},
            
            # Month 0 overheads
            {"date": today - timedelta(days=20), "amount": Decimal('75000.00'), "type": "PAYROLL", "desc": "Staff Salaries (5 Warehouse + 2 Accounts staff)"},
            {"date": today - timedelta(days=18), "amount": Decimal('35000.00'), "type": "RENT", "desc": "Warehouse & Central Depot Lease"},
            {"date": today - timedelta(days=15), "amount": Decimal('16200.00'), "type": "UTILITIES", "desc": "Commercial Electricity & Cold Storage Power"},
            {"date": today - timedelta(days=7), "amount": Decimal('8500.00'), "type": "EXPENSE", "desc": "Packaging supplies and petty cash replenishment"}
        ]

        for oh in overheads:
            tx_oh = Transaction(
                business_id=demo_biz.id,
                transaction_date=oh["date"],
                amount=oh["amount"],
                direction="OUTFLOW",
                transaction_type=oh["type"],
                description=oh["desc"],
                payment_mode="Bank Transfer",
                reference_number=f"NEFT-OH-{oh['date'].strftime('%m%d')}",
                category="Overhead & Operating Expenses",
                is_reconciled=True
            )
            db.add(tx_oh)

        # Audit log entry
        audit = AuditLog(
            business_id=demo_biz.id,
            action="LOAD_DEMO_DATA",
            entity_type="BUSINESS",
            entity_id=demo_biz.id,
            details="Loaded Sharma & Co. realistic wholesale demo dataset."
        )
        db.add(audit)
        db.commit()

        return demo_biz

    @classmethod
    def reset_demo_data(cls, db: Session, business_id: int):
        """Cleans out demo transactions, invoices, and parties, retaining real user accounts."""
        biz = db.query(Business).filter(Business.id == business_id, Business.is_demo == True).first()
        if not biz:
            return

        db.query(InvoicePayment).filter(InvoicePayment.invoice.has(business_id=biz.id)).delete(synchronize_session=False)
        db.query(Invoice).filter(Invoice.business_id == biz.id).delete(synchronize_session=False)
        db.query(Transaction).filter(Transaction.business_id == biz.id).delete(synchronize_session=False)
        db.query(Customer).filter(Customer.business_id == biz.id).delete(synchronize_session=False)
        db.query(Supplier).filter(Supplier.business_id == biz.id).delete(synchronize_session=False)
        db.query(AuditLog).filter(AuditLog.business_id == biz.id).delete(synchronize_session=False)
        db.commit()
