"""Demo data. Safe to run repeatedly."""
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from .models import Coupon, Order, User
from .security import hash_password

DEMO_USERS = [
    dict(name="Ramesh Reddy", email="farmer@agrimart.demo", phone="9876543210", password="Farmer@123", role="customer"),
    dict(name="Lakshmi Devi", email="lakshmi@agrimart.demo", phone="9123456780", password="Farmer@123", role="customer"),
    dict(name="Store Admin", email="admin@agrimart.demo", phone="9000000000", password="Admin@123", role="admin"),
]


def seed(db: Session) -> None:
    for u in DEMO_USERS:
        if db.query(User).filter_by(email=u["email"]).first():
            continue
        db.add(User(name=u["name"], email=u["email"], phone=u["phone"], role=u["role"], password_hash=hash_password(u["password"])))
    db.commit()
    ramesh = db.query(User).filter_by(email="farmer@agrimart.demo").one()
    if not ramesh.orders:
        now = datetime.now(timezone.utc)
        addr = {"district": "Guntur", "state": "Andhra Pradesh", "pincode": "522001"}
        db.add_all([
            Order(number="AGM-260918-001", user_id=ramesh.id, status="delivered", total=1240, created_at=now - timedelta(days=3),
                  items=[{"name": "DAP 18:46:0", "pack": "50 kg", "qty": 1, "price": 1240}], address=addr),
            Order(number="AGM-260921-007", user_id=ramesh.id, status="shipped", total=3299, created_at=now,
                  items=[{"name": "Coragen Insecticide", "pack": "150 ml", "qty": 1, "price": 2150},
                         {"name": "Neem Oil 10000 PPM", "pack": "1 L", "qty": 1, "price": 890}], address=addr),
        ])
        db.commit()
    if not db.query(Coupon).first():
        db.add_all([
            Coupon(code="KISAN10", kind="percent", value=10, min_order=500),
            Coupon(code="WELCOME100", kind="flat", value=100, min_order=999),
        ])
        db.commit()
