import re
import secrets
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from .config import settings
from .db import Base, SessionLocal, engine, get_db
from .models import ActivityLog, Coupon, Order, User, VisitRequest
from .security import admin_user, current_user, decode, hash_password, tokens_for, verify_password
from .seed import DEMO_USERS, seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(title="Lakshmi Agency API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)

PHONE = re.compile(r"^[6-9]\d{9}$")
DEMO_OTP = "1234"  # demo only: a real SMS gateway would replace this


def public(u: User) -> dict:
    return {"id": u.id, "name": u.name, "email": u.email or f"{u.phone}@mobile", "phone": u.phone, "role": u.role,
            "gender": u.gender, "address": u.address}


def session(u: User) -> dict:
    return {**tokens_for(u), "user": public(u)}


class AddressIn(BaseModel):
    line1: str = Field(min_length=3, max_length=200)
    district: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    pincode: str = Field(pattern=r"^\d{6}$")


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    gender: str | None = Field(default=None, pattern="^(male|female|other)$")
    address: AddressIn | None = None


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
    return {"service": "Lakshmi Agency API", "status": "running", "docs": "/docs", "health": "/api/health"}


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
    u = User(name=body.name.strip(), email=email, password_hash=hash_password(body.password),
              gender=body.gender, address=body.address.model_dump() if body.address else None)
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
    gender: str | None = Field(default=None, pattern="^(male|female|other)$")
    address: AddressIn | None = None


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
    if body.gender:
        user.gender = body.gender
    if body.address:
        user.address = body.address.model_dump()
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

CATALOG_PATH = Path(__file__).parent / "data" / "catalog.json"
CATALOG = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def save_catalog():
    """Demo persistence: write the in-memory catalog back to disk so admin edits survive a restart."""
    CATALOG_PATH.write_text(json.dumps(CATALOG, indent=2, ensure_ascii=False), encoding="utf-8")


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


# ---------- Admin: product & inventory management ----------
def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "product"


def find_product(slug: str) -> dict:
    for p in CATALOG["products"]:
        if p["slug"] == slug:
            return p
    raise HTTPException(404, "Product not found")


class VariantIn(BaseModel):
    sku: str
    pack: str
    price: int = Field(gt=0)
    mrp: int = Field(gt=0)
    stock: int = Field(ge=0)


class ProductIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    category: str
    brand: str
    productType: str | None = None
    formulation: str | None = None
    activeIngredient: str | None = None
    crops: list[str] = []
    pests: list[str] = []
    description: str | None = None
    image: str | None = None  # optional: data URL or hosted image URL
    variants: list[VariantIn] = Field(min_length=1)


class ProductPatch(BaseModel):
    name: str | None = None
    category: str | None = None
    brand: str | None = None
    productType: str | None = None
    formulation: str | None = None
    activeIngredient: str | None = None
    crops: list[str] | None = None
    pests: list[str] | None = None
    description: str | None = None
    image: str | None = None


class StockIn(BaseModel):
    stock: int = Field(ge=0)


def log_action(db: Session, actor: User, action: str, detail: str):
    db.add(ActivityLog(actor_id=actor.id, actor_name=actor.name, action=action, detail=detail))
    db.commit()


def log_out(l: ActivityLog) -> dict:
    return {"id": l.id, "actor": l.actor_name, "action": l.action, "detail": l.detail, "at": l.created_at.isoformat()}


@app.get("/api/admin/products")
def admin_products(_: User = Depends(admin_user)):
    return CATALOG["products"]


@app.post("/api/admin/products", status_code=201)
def admin_create_product(body: ProductIn, admin: User = Depends(admin_user), db: Session = Depends(get_db)):
    next_id = max((p["id"] for p in CATALOG["products"]), default=0) + 1
    slug = base_slug = slugify(body.name)
    n = 1
    existing = {p["slug"] for p in CATALOG["products"]}
    while slug in existing:
        n += 1
        slug = f"{base_slug}-{n}"
    product = {
        "id": next_id, "slug": slug, "name": body.name.strip(), "category": body.category, "brand": body.brand,
        "productType": body.productType or "", "formulation": body.formulation or "",
        "activeIngredient": body.activeIngredient or "", "crops": body.crops, "pests": body.pests,
        "rating": 0, "reviews": 0, "sold": 0, "featured": False, "isNew": True,
        "variants": [{**v.model_dump(), "id": (max((vv["id"] for p in CATALOG["products"] for vv in p["variants"]), default=0) + i + 1)}
                     for i, v in enumerate(body.variants)],
        "description": body.description or "",
        "image": body.image or "",
    }
    CATALOG["products"].append(product)
    save_catalog()
    log_action(db, admin, "product_create", f"Added product \"{product['name']}\" ({product['slug']})")
    return product


@app.patch("/api/admin/products/{slug}")
def admin_update_product(slug: str, body: ProductPatch, admin: User = Depends(admin_user), db: Session = Depends(get_db)):
    p = find_product(slug)
    changed = body.model_dump(exclude_unset=True)
    for k, v in changed.items():
        p[k] = v
    save_catalog()
    log_action(db, admin, "product_update", f"Updated product \"{p['name']}\" ({slug}): {', '.join(changed)}")
    return p


@app.delete("/api/admin/products/{slug}", status_code=204)
def admin_delete_product(slug: str, admin: User = Depends(admin_user), db: Session = Depends(get_db)):
    p = find_product(slug)
    CATALOG["products"].remove(p)
    save_catalog()
    log_action(db, admin, "product_delete", f"Deleted product \"{p['name']}\" ({slug})")


@app.patch("/api/admin/products/{slug}/variants/{sku}/stock")
def admin_update_stock(slug: str, sku: str, body: StockIn, admin: User = Depends(admin_user), db: Session = Depends(get_db)):
    p = find_product(slug)
    for v in p["variants"]:
        if v["sku"] == sku:
            old = v["stock"]
            v["stock"] = body.stock
            save_catalog()
            log_action(db, admin, "stock_update", f"Stock for {sku} ({p['name']}) changed {old} → {body.stock}")
            return p
    raise HTTPException(404, "Variant not found")


# ---------- Admin: users, roles & activity log ----------
ROLES = ["customer", "admin", "inventory_manager", "sales_manager", "support_agent", "warehouse_staff", "supplier"]


def user_out(u: User) -> dict:
    return {"id": u.id, "name": u.name, "email": u.email, "phone": u.phone, "role": u.role, "created_at": u.created_at.isoformat()}


@app.get("/api/admin/users")
def admin_users(_: User = Depends(admin_user), db: Session = Depends(get_db)):
    return [user_out(u) for u in db.query(User).order_by(User.created_at.desc()).all()]


class RoleIn(BaseModel):
    role: str


@app.patch("/api/admin/users/{user_id}/role")
def admin_set_role(user_id: int, body: RoleIn, admin: User = Depends(admin_user), db: Session = Depends(get_db)):
    if body.role not in ROLES:
        raise HTTPException(422, f"Role must be one of: {', '.join(ROLES)}")
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(404, "User not found")
    if target.id == admin.id and body.role != "admin":
        raise HTTPException(400, "You can't remove your own admin access")
    old = target.role
    target.role = body.role
    db.commit()
    log_action(db, admin, "role_change", f"Changed {target.name}'s role: {old} → {body.role}")
    return user_out(target)


@app.get("/api/admin/logs")
def admin_logs(_: User = Depends(admin_user), db: Session = Depends(get_db)):
    rows = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(200).all()
    return [log_out(l) for l in rows]


# ---------- Admin: coupons ----------
def coupon_out(c: Coupon) -> dict:
    return {"id": c.id, "code": c.code, "kind": c.kind, "value": c.value, "min_order": c.min_order,
            "active": c.active, "expires_at": c.expires_at.isoformat() if c.expires_at else None}


class CouponIn(BaseModel):
    code: str = Field(min_length=3, max_length=30)
    kind: str = Field(pattern="^(percent|flat)$")
    value: int = Field(gt=0)
    min_order: int = Field(ge=0, default=0)
    expires_at: str | None = None


class CouponPatch(BaseModel):
    active: bool | None = None
    value: int | None = None
    min_order: int | None = None
    expires_at: str | None = None


@app.get("/api/catalog/coupons")
def public_coupons(db: Session = Depends(get_db)):
    """Active coupons, for the checkout page to show/apply. No auth needed."""
    rows = db.query(Coupon).filter_by(active=True).order_by(Coupon.created_at.desc()).all()
    return [coupon_out(c) for c in rows]


@app.get("/api/admin/coupons")
def admin_coupons(_: User = Depends(admin_user), db: Session = Depends(get_db)):
    return [coupon_out(c) for c in db.query(Coupon).order_by(Coupon.created_at.desc()).all()]


@app.post("/api/admin/coupons", status_code=201)
def admin_create_coupon(body: CouponIn, admin: User = Depends(admin_user), db: Session = Depends(get_db)):
    code = body.code.strip().upper()
    if db.query(Coupon).filter_by(code=code).first():
        raise HTTPException(409, "A coupon with this code already exists")
    c = Coupon(code=code, kind=body.kind, value=body.value, min_order=body.min_order,
               expires_at=datetime.fromisoformat(body.expires_at) if body.expires_at else None)
    db.add(c)
    db.commit()
    log_action(db, admin, "coupon_create", f"Created coupon {code} ({body.kind} {body.value})")
    return coupon_out(c)


@app.patch("/api/admin/coupons/{coupon_id}")
def admin_update_coupon(coupon_id: int, body: CouponPatch, admin: User = Depends(admin_user), db: Session = Depends(get_db)):
    c = db.get(Coupon, coupon_id)
    if not c:
        raise HTTPException(404, "Coupon not found")
    changed = body.model_dump(exclude_unset=True)
    for k, v in changed.items():
        setattr(c, k, datetime.fromisoformat(v) if k == "expires_at" and v else v)
    db.commit()
    log_action(db, admin, "coupon_update", f"Updated coupon {c.code}: {', '.join(changed)}")
    return coupon_out(c)


@app.delete("/api/admin/coupons/{coupon_id}", status_code=204)
def admin_delete_coupon(coupon_id: int, admin: User = Depends(admin_user), db: Session = Depends(get_db)):
    c = db.get(Coupon, coupon_id)
    if not c:
        raise HTTPException(404, "Coupon not found")
    db.delete(c)
    db.commit()
    log_action(db, admin, "coupon_delete", f"Deleted coupon {c.code}")


# ---------- Farm visit requests ----------
def visit_out(v: VisitRequest) -> dict:
    return {"id": v.id, "name": v.name, "phone": v.phone, "crop": v.crop, "address": v.address,
            "note": v.note, "status": v.status, "created_at": v.created_at.isoformat()}


class VisitRequestIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str
    crop: str = Field(min_length=1, max_length=60)
    address: str = Field(min_length=5, max_length=300)
    note: str = Field(default="", max_length=500)


class VisitStatusIn(BaseModel):
    status: str = Field(pattern="^(new|contacted|scheduled|done)$")


@app.post("/api/visit-requests", status_code=201)
def create_visit_request(body: VisitRequestIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not PHONE.match(body.phone):
        raise HTTPException(422, "Enter a valid 10-digit mobile number")
    v = VisitRequest(user_id=user.id, name=body.name.strip(), phone=body.phone, crop=body.crop, address=body.address.strip(), note=body.note.strip())
    db.add(v)
    db.commit()
    return visit_out(v)


@app.get("/api/visit-requests")
def my_visit_requests(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.query(VisitRequest).filter_by(user_id=user.id).order_by(VisitRequest.created_at.desc()).all()
    return [visit_out(v) for v in rows]


@app.get("/api/admin/visit-requests")
def admin_visit_requests(_: User = Depends(admin_user), db: Session = Depends(get_db)):
    rows = db.query(VisitRequest).order_by(VisitRequest.created_at.desc()).all()
    return [visit_out(v) for v in rows]


@app.patch("/api/admin/visit-requests/{req_id}")
def admin_update_visit_request(req_id: int, body: VisitStatusIn, admin: User = Depends(admin_user), db: Session = Depends(get_db)):
    v = db.get(VisitRequest, req_id)
    if not v:
        raise HTTPException(404, "Request not found")
    v.status = body.status
    db.commit()
    log_action(db, admin, "visit_status", f"Marked {v.name}'s farm visit request as {body.status}")
    return visit_out(v)
