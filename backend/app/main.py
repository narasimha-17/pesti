import re
import secrets
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from .config import settings
from .db import Base, SessionLocal, engine, get_db
from .models import Order, User
from .security import admin_user, current_user, decode, hash_password, tokens_for, verify_password
from .seed import DEMO_USERS, seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(title="AgriMart API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)

PHONE = re.compile(r"^[6-9]\d{9}$")
DEMO_OTP = "1234"  # demo only: a real SMS gateway would replace this


def public(u: User) -> dict:
    return {"id": u.id, "name": u.name, "email": u.email or f"{u.phone}@mobile", "phone": u.phone, "role": u.role}


def session(u: User) -> dict:
    return {**tokens_for(u), "user": public(u)}


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class OtpIn(BaseModel):
    phone: str
    code: str | None = None
    name: str | None = None


class RefreshIn(BaseModel):
    refresh_token: str


@app.get("/")
def root():
    return {"service": "AgriMart API", "status": "running", "docs": "/docs", "health": "/api/health"}


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/auth/demo-accounts")
def demo_accounts():
    """Lets the login page show the demo credentials. Remove for production."""
    return [{"role": u["role"], "email": u["email"], "password": u["password"], "phone": u["phone"]} for u in DEMO_USERS]


@app.post("/api/auth/register", status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.query(User).filter_by(email=email).first():
        raise HTTPException(409, "An account with this email already exists")
    u = User(name=body.name.strip(), email=email, password_hash=hash_password(body.password))
    db.add(u)
    db.commit()
    return session(u)


@app.post("/api/auth/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    u = db.query(User).filter_by(email=body.email.lower()).first()
    if not u or not verify_password(body.password, u.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return session(u)


@app.post("/api/auth/otp")
def otp(body: OtpIn, db: Session = Depends(get_db)):
    """Two-step mobile login: without a code it 'sends' an OTP, with a code it verifies it (demo code 1234)."""
    if not PHONE.match(body.phone):
        raise HTTPException(422, "Enter a valid 10-digit mobile number")
    if body.code is None:
        return {"sent": True, "hint": f"Demo code: {DEMO_OTP}"}
    if not secrets.compare_digest(body.code, DEMO_OTP):
        raise HTTPException(401, "Wrong code")
    u = db.query(User).filter_by(phone=body.phone).first()
    if not u:
        u = User(name=(body.name or "Farmer").strip() or "Farmer", phone=body.phone)
        db.add(u)
        db.commit()
    return session(u)


@app.post("/api/auth/refresh")
def refresh(body: RefreshIn, db: Session = Depends(get_db)):
    u = db.get(User, decode(body.refresh_token, "refresh"))
    if not u:
        raise HTTPException(401, "User not found")
    return session(u)


@app.get("/api/auth/me")
def me(user: User = Depends(current_user)):
    return public(user)


class ProfileIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str | None = None


class PasswordIn(BaseModel):
    current_password: str | None = None
    new_password: str = Field(min_length=8, max_length=72)


@app.patch("/api/auth/profile")
def update_profile(body: ProfileIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if body.phone:
        if not PHONE.match(body.phone):
            raise HTTPException(422, "Enter a valid 10-digit mobile number")
        taken = db.query(User).filter(User.phone == body.phone, User.id != user.id).first()
        if taken:
            raise HTTPException(409, "That mobile number is already used by another account")
        user.phone = body.phone
    user.name = body.name.strip()
    db.commit()
    return public(user)


@app.post("/api/auth/password")
def change_password(body: PasswordIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if user.password_hash and not verify_password(body.current_password or "", user.password_hash):
        raise HTTPException(401, "Current password is incorrect")
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"ok": True}


def order_out(o: Order) -> dict:
    return {"number": o.number, "date": o.created_at.date().isoformat(), "status": o.status, "total": o.total, "items": o.items, "address": o.address}


class OrderIn(BaseModel):
    items: list[dict] = Field(min_length=1)
    address: dict
    total: int = Field(gt=0)


@app.get("/api/orders")
def my_orders(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.query(Order).filter_by(user_id=user.id).order_by(Order.created_at.desc()).all()
    return [order_out(o) for o in rows]


@app.post("/api/orders", status_code=201)
def place_order(body: OrderIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    o = Order(number=f"AGM-{secrets.token_hex(4).upper()}", user_id=user.id, total=body.total, items=body.items, address=body.address)
    db.add(o)
    db.commit()
    return order_out(o)


@app.get("/api/admin/orders")
def all_orders(_: User = Depends(admin_user), db: Session = Depends(get_db)):
    return [{**order_out(o), "customer": o.user.name} for o in db.query(Order).order_by(Order.created_at.desc()).all()]


# ---------- Catalogue (loaded once from app/data/catalog.json) ----------
import json
from pathlib import Path

CATALOG = json.loads((Path(__file__).parent / "data" / "catalog.json").read_text(encoding="utf-8"))


def _min_price(p: dict) -> int:
    return min(v["price"] for v in p["variants"])


@app.get("/api/catalog/{name}")
def catalog_list(name: str):
    if name not in ("categories", "crops", "brands", "testimonials", "articles", "banners", "pests"):
        raise HTTPException(404, "Unknown collection")
    return CATALOG[name]


@app.get("/api/catalog/products/search")
def product_search(category: str | None = None, crop: str | None = None, brands: str | None = None, q: str | None = None,
                   min: int | None = None, max: int | None = None, rating: float | None = None, in_stock: bool = False,
                   flag: str | None = None, sort: str | None = None):
    brand_set = set(brands.split(",")) if brands else set()
    out = []
    for p in CATALOG["products"]:
        price = _min_price(p)
        hay = f"{p['name']} {p['brand']} {p['activeIngredient']} {p['category']} {' '.join(p['crops'])}".lower()
        if category and p["category"] != category: continue
        if crop and crop not in p["crops"]: continue
        if brand_set and p["brand"] not in brand_set: continue
        if q and q.lower().strip() not in hay: continue
        if min and price < min: continue
        if max and price > max: continue
        if rating and p["rating"] < rating: continue
        if in_stock and not any(v["stock"] > 0 for v in p["variants"]): continue
        if flag == "featured" and not p.get("featured"): continue
        if flag == "new" and not p.get("isNew"): continue
        out.append(p)
    disc = lambda p: max((v["mrp"] - v["price"]) / v["mrp"] for v in p["variants"])
    keys = {"price_asc": lambda p: _min_price(p), "price_desc": lambda p: -_min_price(p), "rating": lambda p: -p["rating"],
            "popular": lambda p: -p["sold"], "discount": lambda p: -disc(p)}
    if sort in keys: out.sort(key=keys[sort])
    elif flag == "best": out.sort(key=lambda p: -p["sold"])
    return out


@app.get("/api/catalog/products/{slug}")
def product_detail(slug: str):
    for p in CATALOG["products"]:
        if p["slug"] == slug:
            return p
    raise HTTPException(404, "Product not found")
