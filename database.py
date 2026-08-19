"""SQLite persistent storage layer for Smart Freight multi-user manifests and fleet assets."""

import json
import sqlite3
import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import auth

DB_PATH = Path(__file__).resolve().parent / "smart_freight.db"
DEFAULT_DEMO_USER_ID = "USR-DEMO-001"


def get_db_connection() -> sqlite3.Connection:
    """Create and return a connection with dictionary-like row access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize users, shipments, and vehicles tables and seed demo data."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            role TEXT DEFAULT 'consumer',
            driver_status TEXT DEFAULT 'Available',
            assigned_vehicle TEXT DEFAULT 'Refrigerated Van (Medium)',
            license_number TEXT DEFAULT 'OD-02-2024-DRV-8821',
            phone TEXT DEFAULT '+91 98765 43210',
            created_at TEXT NOT NULL
        )
        """
    )

    # Add role and driver profile columns to users if missing (schema migration)
    cursor.execute("PRAGMA table_info(users)")
    user_cols = [c["name"] for c in cursor.fetchall()]
    if "role" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'consumer'")
    if "driver_status" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN driver_status TEXT DEFAULT 'Available'")
    if "assigned_vehicle" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN assigned_vehicle TEXT DEFAULT 'Refrigerated Van (Medium)'")
    if "license_number" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN license_number TEXT DEFAULT 'OD-02-2024-DRV-8821'")
    if "phone" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN phone TEXT DEFAULT '+91 98765 43210'")

    # 2. Shipments Table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS shipments (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'USR-DEMO-001',
            driver_id TEXT DEFAULT NULL,
            product_type TEXT NOT NULL,
            weight_kg REAL NOT NULL,
            pickup_location TEXT NOT NULL,
            destination TEXT NOT NULL,
            pickup_date TEXT,
            pickup_time TEXT,
            delivery_date TEXT,
            delivery_time TEXT,
            delivery_priority TEXT DEFAULT 'Standard',
            special_requirement TEXT DEFAULT 'Normal',
            selected_vehicle TEXT,
            route TEXT,
            cost REAL DEFAULT 0.0,
            savings REAL DEFAULT 0.0,
            risk_percentage REAL DEFAULT 0.0,
            eta TEXT,
            status TEXT DEFAULT 'Planned',
            created_at TEXT NOT NULL
        )
        """
    )

    # Add user_id and driver_id columns to shipments if missing (schema migration)
    cursor.execute("PRAGMA table_info(shipments)")
    shipment_cols = [c["name"] for c in cursor.fetchall()]
    if "user_id" not in shipment_cols:
        cursor.execute("ALTER TABLE shipments ADD COLUMN user_id TEXT DEFAULT 'USR-DEMO-001'")
    if "driver_id" not in shipment_cols:
        cursor.execute("ALTER TABLE shipments ADD COLUMN driver_id TEXT DEFAULT NULL")

    # 3. Vehicles Table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS vehicles (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'USR-DEMO-001',
            type TEXT NOT NULL,
            capacity_kg REAL NOT NULL,
            base_cost REAL NOT NULL,
            status TEXT DEFAULT 'Available',
            special_capability TEXT DEFAULT 'Normal',
            is_refrigerated INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
        """
    )

    # Add user_id column to vehicles if missing (schema migration)
    cursor.execute("PRAGMA table_info(vehicles)")
    vehicle_cols = [c["name"] for c in cursor.fetchall()]
    if "user_id" not in vehicle_cols:
        cursor.execute("ALTER TABLE vehicles ADD COLUMN user_id TEXT DEFAULT 'USR-DEMO-001'")

    conn.commit()

    # Seed Default Demo Consumer User if not exists
    cursor.execute("SELECT id FROM users WHERE email = ?", ("demo@smartfreight.io",))
    demo_user = cursor.fetchone()

    if not demo_user:
        salt = auth.generate_salt()
        pwd_hash = auth.hash_password("password123", salt)
        cursor.execute(
            """
            INSERT INTO users (id, name, email, password_hash, salt, role, driver_status, assigned_vehicle, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                DEFAULT_DEMO_USER_ID,
                "Demo Dispatch Admin",
                "demo@smartfreight.io",
                pwd_hash,
                salt,
                "consumer",
                "Available",
                "Refrigerated Van (Medium)",
                datetime.now().isoformat(),
            ),
        )
        conn.commit()

    # Seed Default Demo Driver User if not exists
    cursor.execute("SELECT id FROM users WHERE email = ?", ("driver@smartfreight.io",))
    demo_driver = cursor.fetchone()

    DEFAULT_DEMO_DRIVER_ID = "USR-DRIVER-001"
    if not demo_driver:
        salt_drv = auth.generate_salt()
        pwd_hash_drv = auth.hash_password("password123", salt_drv)
        cursor.execute(
            """
            INSERT INTO users (id, name, email, password_hash, salt, role, driver_status, assigned_vehicle, license_number, phone, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                DEFAULT_DEMO_DRIVER_ID,
                "Rajesh Kumar",
                "driver@smartfreight.io",
                pwd_hash_drv,
                salt_drv,
                "driver",
                "Available",
                "Refrigerated Van (Medium)",
                "OD-02-2024-DRV-8821",
                "+91 98765 43210",
                datetime.now().isoformat(),
            ),
        )
        conn.commit()

    # Seed shipments if empty
    cursor.execute("SELECT COUNT(*) FROM shipments")
    shipment_count = cursor.fetchone()[0]

    if shipment_count == 0:
        seed_shipments = [
            {
                "id": "SF-1001",
                "user_id": DEFAULT_DEMO_USER_ID,
                "product_type": "Fresh Tomatoes",
                "weight_kg": 500.0,
                "pickup_location": "Bhubaneswar",
                "destination": "Kolkata",
                "pickup_date": "2026-08-16",
                "pickup_time": "08:00",
                "delivery_date": "2026-08-18",
                "delivery_time": "18:00",
                "delivery_priority": "Standard",
                "special_requirement": "Refrigerated",
                "selected_vehicle": "Refrigerated Van (Medium)",
                "route": json.dumps(["Bhubaneswar", "Cuttack", "Kolkata"]),
                "cost": 14500.0,
                "savings": 14500.0,
                "risk_percentage": 48.2,
                "eta": "7.2 hrs",
                "status": "Planned",
                "created_at": datetime.now().isoformat(),
            },
            {
                "id": "SF-1002",
                "user_id": DEFAULT_DEMO_USER_ID,
                "product_type": "Chilled Dairy / Milk",
                "weight_kg": 300.0,
                "pickup_location": "Cuttack",
                "destination": "Kolkata",
                "pickup_date": "2026-08-16",
                "pickup_time": "09:00",
                "delivery_date": "2026-08-17",
                "delivery_time": "20:00",
                "delivery_priority": "Express",
                "special_requirement": "Refrigerated",
                "selected_vehicle": "Refrigerated Truck (Heavy)",
                "route": json.dumps(["Cuttack", "Jamshedpur", "Kolkata"]),
                "cost": 18000.0,
                "savings": 18000.0,
                "risk_percentage": 38.5,
                "eta": "7.6 hrs",
                "status": "Picked Up",
                "created_at": datetime.now().isoformat(),
            },
            {
                "id": "SF-1003",
                "user_id": DEFAULT_DEMO_USER_ID,
                "product_type": "Fresh Citrus & Produce",
                "weight_kg": 700.0,
                "pickup_location": "Bhubaneswar",
                "destination": "Cuttack",
                "pickup_date": "2026-08-16",
                "pickup_time": "10:30",
                "delivery_date": "2026-08-16",
                "delivery_time": "16:00",
                "delivery_priority": "Standard",
                "special_requirement": "Normal",
                "selected_vehicle": "Standard Freight Truck",
                "route": json.dumps(["Bhubaneswar", "Cuttack"]),
                "cost": 12000.0,
                "savings": 12000.0,
                "risk_percentage": 22.0,
                "eta": "1.0 hrs",
                "status": "In Transit",
                "created_at": datetime.now().isoformat(),
            },
        ]

        for s in seed_shipments:
            cursor.execute(
                """
                INSERT INTO shipments (
                    id, user_id, product_type, weight_kg, pickup_location, destination,
                    pickup_date, pickup_time, delivery_date, delivery_time,
                    delivery_priority, special_requirement, selected_vehicle,
                    route, cost, savings, risk_percentage, eta, status, created_at
                ) VALUES (
                    :id, :user_id, :product_type, :weight_kg, :pickup_location, :destination,
                    :pickup_date, :pickup_time, :delivery_date, :delivery_time,
                    :delivery_priority, :special_requirement, :selected_vehicle,
                    :route, :cost, :savings, :risk_percentage, :eta, :status, :created_at
                )
                """,
                s,
            )
        conn.commit()

    # Seed vehicles if empty
    cursor.execute("SELECT COUNT(*) FROM vehicles")
    vehicle_count = cursor.fetchone()[0]

    if vehicle_count == 0:
        seed_vehicles = [
            {
                "id": "VH-101",
                "user_id": DEFAULT_DEMO_USER_ID,
                "type": "Refrigerated Truck (Heavy)",
                "capacity_kg": 5000.0,
                "base_cost": 18000.0,
                "status": "Available",
                "special_capability": "Refrigerated / Cold-Chain",
                "is_refrigerated": 1,
                "created_at": datetime.now().isoformat(),
            },
            {
                "id": "VH-102",
                "user_id": DEFAULT_DEMO_USER_ID,
                "type": "Refrigerated Van (Medium)",
                "capacity_kg": 2500.0,
                "base_cost": 14500.0,
                "status": "Available",
                "special_capability": "Refrigerated / Cold-Chain",
                "is_refrigerated": 1,
                "created_at": datetime.now().isoformat(),
            },
            {
                "id": "VH-103",
                "user_id": DEFAULT_DEMO_USER_ID,
                "type": "Standard Freight Truck",
                "capacity_kg": 5000.0,
                "base_cost": 12000.0,
                "status": "Available",
                "special_capability": "Normal / Ambient",
                "is_refrigerated": 0,
                "created_at": datetime.now().isoformat(),
            },
            {
                "id": "VH-104",
                "user_id": DEFAULT_DEMO_USER_ID,
                "type": "Light Delivery Truck",
                "capacity_kg": 1500.0,
                "base_cost": 9500.0,
                "status": "In Transit",
                "special_capability": "Fragile Dampening",
                "is_refrigerated": 0,
                "created_at": datetime.now().isoformat(),
            },
            {
                "id": "VH-105",
                "user_id": DEFAULT_DEMO_USER_ID,
                "type": "Express Heavy Carrier",
                "capacity_kg": 4000.0,
                "base_cost": 16000.0,
                "status": "Maintenance",
                "special_capability": "Heavy Freight",
                "is_refrigerated": 0,
                "created_at": datetime.now().isoformat(),
            },
        ]

        for v in seed_vehicles:
            cursor.execute(
                """
                INSERT INTO vehicles (
                    id, user_id, type, capacity_kg, base_cost, status,
                    special_capability, is_refrigerated, created_at
                ) VALUES (
                    :id, :user_id, :type, :capacity_kg, :base_cost, :status,
                    :special_capability, :is_refrigerated, :created_at
                )
                """,
                v,
            )
        conn.commit()

    conn.close()


def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    """Convert an sqlite3.Row to a clean dictionary with parsed route."""
    d = dict(row)
    if "route" in d and d.get("route"):
        try:
            d["route"] = json.loads(d["route"])
        except Exception:
            pass
    if "is_refrigerated" in d:
        d["is_refrigerated"] = bool(d["is_refrigerated"])
    return d


# ---------------------------------------------------------------------------
# Users Database Operations
# ---------------------------------------------------------------------------


def create_user(
    name: str,
    email: str,
    plain_password: str,
    role: str = "consumer",
    driver_status: str = "Available",
    assigned_vehicle: str = "Refrigerated Van (Medium)",
    license_number: str = "OD-02-2024-DRV-8821",
    phone: str = "+91 98765 43210",
) -> Dict[str, Any]:
    """Create a new user in SQLite with salted PBKDF2 password hash and role."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ?", (email.lower().strip(),))
    if cursor.fetchone():
        conn.close()
        raise ValueError("An account with this email address already exists.")

    user_id = ("DRV-" if role == "driver" else "USR-") + uuid.uuid4().hex[:8].upper()
    salt = auth.generate_salt()
    pwd_hash = auth.hash_password(plain_password, salt)
    created_at = datetime.now().isoformat()

    cursor.execute(
        """
        INSERT INTO users (id, name, email, password_hash, salt, role, driver_status, assigned_vehicle, license_number, phone, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            name.strip(),
            email.lower().strip(),
            pwd_hash,
            salt,
            role,
            driver_status,
            assigned_vehicle,
            license_number,
            phone,
            created_at,
        ),
    )

    # For consumers, clone standard starter vehicles so they can optimize immediately
    if role == "consumer":
        default_starter_fleet = [
            ("VH-" + uuid.uuid4().hex[:4].upper(), user_id, "Refrigerated Truck (Heavy)", 5000.0, 18000.0, "Available", "Refrigerated / Cold-Chain", 1),
            ("VH-" + uuid.uuid4().hex[:4].upper(), user_id, "Refrigerated Van (Medium)", 2500.0, 14500.0, "Available", "Refrigerated / Cold-Chain", 1),
            ("VH-" + uuid.uuid4().hex[:4].upper(), user_id, "Standard Freight Truck", 5000.0, 12000.0, "Available", "Normal / Ambient", 0),
        ]
        for v in default_starter_fleet:
            cursor.execute(
                """
                INSERT INTO vehicles (id, user_id, type, capacity_kg, base_cost, status, special_capability, is_refrigerated, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (*v, created_at),
            )

    conn.commit()

    cursor.execute(
        "SELECT id, name, email, role, driver_status, assigned_vehicle, license_number, phone, created_at FROM users WHERE id = ?",
        (user_id,),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row)


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Retrieve user record including password hash, salt, and role by email."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve safe user profile including role and profile fields by user ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, email, role, driver_status, assigned_vehicle, license_number, phone, created_at FROM users WHERE id = ?",
        (user_id,),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


# ---------------------------------------------------------------------------
# Driver Database Operations
# ---------------------------------------------------------------------------


def get_driver_assigned_shipments(driver_id: str) -> List[Dict[str, Any]]:
    """Retrieve all shipments assigned to a specific driver.
    If none currently assigned, automatically assign the first available shipment for testing/demo."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM shipments WHERE driver_id = ? ORDER BY created_at DESC",
        (driver_id,),
    )
    rows = cursor.fetchall()

    if not rows:
        # Check if any unassigned or demo shipment can be assigned to this driver
        cursor.execute("SELECT id FROM shipments WHERE driver_id IS NULL OR driver_id = '' LIMIT 1")
        avail = cursor.fetchone()
        if avail:
            cursor.execute("UPDATE shipments SET driver_id = ? WHERE id = ?", (driver_id, avail["id"]))
            conn.commit()
            cursor.execute(
                "SELECT * FROM shipments WHERE driver_id = ? ORDER BY created_at DESC",
                (driver_id,),
            )
            rows = cursor.fetchall()

    conn.close()
    return [_row_to_dict(r) for r in rows]


def get_driver_shipment_by_id(shipment_id: str, driver_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a shipment strictly verifying it is assigned to this driver."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM shipments WHERE id = ? AND driver_id = ?",
        (shipment_id, driver_id),
    )
    row = cursor.fetchone()
    conn.close()
    return _row_to_dict(row) if row else None


def update_driver_shipment_status(
    shipment_id: str, driver_id: str, new_status: str
) -> Optional[Dict[str, Any]]:
    """Update shipment status strictly by the assigned driver."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM shipments WHERE id = ? AND driver_id = ?",
        (shipment_id, driver_id),
    )
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return None

    cursor.execute(
        "UPDATE shipments SET status = ? WHERE id = ? AND driver_id = ?",
        (new_status, shipment_id, driver_id),
    )

    # Sync driver duty status based on manifest stage
    if new_status in ("Accepted", "Picked Up", "In Transit", "Arrived"):
        cursor.execute(
            "UPDATE users SET driver_status = 'On Trip' WHERE id = ?",
            (driver_id,),
        )
    elif new_status == "Delivered":
        cursor.execute(
            "UPDATE users SET driver_status = 'Available' WHERE id = ?",
            (driver_id,),
        )

    conn.commit()

    cursor.execute("SELECT * FROM shipments WHERE id = ?", (shipment_id,))
    updated = cursor.fetchone()
    conn.close()
    return _row_to_dict(updated) if updated else None


def update_driver_profile(driver_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update driver availability status or assigned asset specifications."""
    conn = get_db_connection()
    cursor = conn.cursor()

    allowed = ["driver_status", "assigned_vehicle", "phone"]
    set_clauses = []
    values = []

    for k in allowed:
        if k in updates and updates[k] is not None:
            set_clauses.append(f"{k} = ?")
            values.append(updates[k])

    if not set_clauses:
        conn.close()
        return get_user_by_id(driver_id)

    values.append(driver_id)
    sql = f"UPDATE users SET {', '.join(set_clauses)} WHERE id = ?"
    cursor.execute(sql, values)
    conn.commit()
    conn.close()
    return get_user_by_id(driver_id)


# ---------------------------------------------------------------------------
# Shipments Database Operations (Scoped to user_id)
# ---------------------------------------------------------------------------


def create_shipment(data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """Insert a new shipment for the specific user into SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()

    shipment_id = data.get("id") or ("SF-" + uuid.uuid4().hex[:6].upper())
    created_at = data.get("created_at") or datetime.now().isoformat()
    status = data.get("status") or "Planned"

    route_raw = data.get("route")
    route_json = json.dumps(route_raw) if isinstance(route_raw, (list, dict)) else str(route_raw or "")
    delivery_date_val = str(data.get("delivery_date") or data.get("delivery_deadline") or date.today().isoformat())

    cursor.execute(
        """
        INSERT INTO shipments (
            id, user_id, product_type, weight_kg, pickup_location, destination,
            pickup_date, pickup_time, delivery_date, delivery_time,
            delivery_priority, special_requirement, selected_vehicle,
            route, cost, savings, risk_percentage, eta, status, created_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?
        )
        """,
        (
            shipment_id,
            user_id,
            str(data.get("product_type") or "General Cargo"),
            float(data.get("weight_kg") or 500.0),
            str(data.get("pickup_location") or "Bhubaneswar"),
            str(data.get("destination") or "Kolkata"),
            str(data.get("pickup_date") or date.today().isoformat()),
            str(data.get("pickup_time") or "08:00"),
            delivery_date_val,
            str(data.get("delivery_time") or "18:00"),
            str(data.get("delivery_priority") or data.get("priority") or "Standard"),
            str(data.get("special_requirement") or data.get("temperature_requirement") or "Normal"),
            str(data.get("selected_vehicle") or "Refrigerated Van (Medium)"),
            route_json,
            float(data.get("cost") or 0.0),
            float(data.get("savings") or 0.0),
            float(data.get("risk_percentage") or 0.0),
            str(data.get("eta") or "7.2 hrs"),
            status,
            created_at,
        ),
    )
    conn.commit()

    cursor.execute("SELECT * FROM shipments WHERE id = ?", (shipment_id,))
    row = cursor.fetchone()
    conn.close()
    return _row_to_dict(row)


def get_all_shipments(user_id: str) -> List[Dict[str, Any]]:
    """Retrieve all shipments belonging strictly to the authenticated user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM shipments WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


def get_shipment_by_id(shipment_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a single shipment by its ID belonging strictly to user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM shipments WHERE id = ? AND user_id = ?",
        (shipment_id, user_id),
    )
    row = cursor.fetchone()
    conn.close()
    return _row_to_dict(row) if row else None


def update_shipment(shipment_id: str, updates: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
    """Update fields on an existing shipment record belonging to user."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM shipments WHERE id = ? AND user_id = ?",
        (shipment_id, user_id),
    )
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return None

    allowed_fields = [
        "product_type",
        "weight_kg",
        "pickup_location",
        "destination",
        "pickup_date",
        "pickup_time",
        "delivery_date",
        "delivery_time",
        "delivery_priority",
        "special_requirement",
        "selected_vehicle",
        "route",
        "cost",
        "savings",
        "risk_percentage",
        "eta",
        "status",
    ]

    set_clauses = []
    values = []

    for field in allowed_fields:
        if field in updates and updates[field] is not None:
            val = updates[field]
            if field == "route" and isinstance(val, (list, dict)):
                val = json.dumps(val)
            set_clauses.append(f"{field} = ?")
            values.append(val)

    if not set_clauses:
        conn.close()
        return _row_to_dict(existing)

    values.extend([shipment_id, user_id])
    sql = f"UPDATE shipments SET {', '.join(set_clauses)} WHERE id = ? AND user_id = ?"
    cursor.execute(sql, tuple(values))
    conn.commit()

    cursor.execute("SELECT * FROM shipments WHERE id = ?", (shipment_id,))
    updated_row = cursor.fetchone()
    conn.close()
    return _row_to_dict(updated_row)


def delete_shipment(shipment_id: str, user_id: str) -> bool:
    """Delete a shipment belonging to user. Returns True if deleted."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id FROM shipments WHERE id = ? AND user_id = ?",
        (shipment_id, user_id),
    )
    if not cursor.fetchone():
        conn.close()
        return False

    cursor.execute("DELETE FROM shipments WHERE id = ? AND user_id = ?", (shipment_id, user_id))
    conn.commit()
    conn.close()
    return True


# ---------------------------------------------------------------------------
# Vehicles Database Operations (Scoped to user_id)
# ---------------------------------------------------------------------------


def create_vehicle(data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """Insert a new vehicle for the specific user into SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM vehicles WHERE user_id = ?", (user_id,))
    count = cursor.fetchone()[0]
    vehicle_id = data.get("id") or f"VH-{count + 101}"

    created_at = data.get("created_at") or datetime.now().isoformat()
    status_val = data.get("status") or "Available"
    capability = data.get("special_capability") or ("Refrigerated / Cold-Chain" if data.get("is_refrigerated") else "Normal / Ambient")
    is_reefer = 1 if (data.get("is_refrigerated") or "Refrigerated" in capability) else 0

    cursor.execute(
        """
        INSERT INTO vehicles (
            id, user_id, type, capacity_kg, base_cost, status,
            special_capability, is_refrigerated, created_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?
        )
        """,
        (
            vehicle_id,
            user_id,
            str(data.get("type") or "Standard Freight Truck"),
            float(data.get("capacity_kg") or 5000.0),
            float(data.get("base_cost") or 14000.0),
            status_val,
            capability,
            is_reefer,
            created_at,
        ),
    )
    conn.commit()

    cursor.execute("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,))
    row = cursor.fetchone()
    conn.close()
    return _row_to_dict(row)


def get_all_vehicles(user_id: str) -> List[Dict[str, Any]]:
    """Retrieve all vehicles belonging strictly to the user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM vehicles WHERE user_id = ? ORDER BY id ASC",
        (user_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


def get_vehicle_by_id(vehicle_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a single vehicle by ID belonging to the user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM vehicles WHERE id = ? AND user_id = ?",
        (vehicle_id, user_id),
    )
    row = cursor.fetchone()
    conn.close()
    return _row_to_dict(row) if row else None


def update_vehicle(vehicle_id: str, updates: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
    """Update fields of an existing vehicle belonging to user."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM vehicles WHERE id = ? AND user_id = ?",
        (vehicle_id, user_id),
    )
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return None

    allowed_fields = [
        "type",
        "capacity_kg",
        "base_cost",
        "status",
        "special_capability",
        "is_refrigerated",
    ]

    set_clauses = []
    values = []

    for field in allowed_fields:
        if field in updates and updates[field] is not None:
            val = updates[field]
            if field == "is_refrigerated":
                val = 1 if val else 0
            set_clauses.append(f"{field} = ?")
            values.append(val)

    if "special_capability" in updates and "is_refrigerated" not in updates:
        cap = str(updates["special_capability"])
        set_clauses.append("is_refrigerated = ?")
        values.append(1 if "Refrigerated" in cap else 0)

    if not set_clauses:
        conn.close()
        return _row_to_dict(existing)

    values.extend([vehicle_id, user_id])
    sql = f"UPDATE vehicles SET {', '.join(set_clauses)} WHERE id = ? AND user_id = ?"
    cursor.execute(sql, tuple(values))
    conn.commit()

    cursor.execute("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,))
    updated_row = cursor.fetchone()
    conn.close()
    return _row_to_dict(updated_row)


def delete_vehicle(vehicle_id: str, user_id: str) -> bool:
    """Delete a vehicle record belonging to user from SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id FROM vehicles WHERE id = ? AND user_id = ?",
        (vehicle_id, user_id),
    )
    if not cursor.fetchone():
        conn.close()
        return False

    cursor.execute("DELETE FROM vehicles WHERE id = ? AND user_id = ?", (vehicle_id, user_id))
    conn.commit()
    conn.close()
    return True
