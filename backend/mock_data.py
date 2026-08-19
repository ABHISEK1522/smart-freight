import uuid

DISTANCE_MATRIX = {
    ("Bhubaneswar", "Kolkata"): 440,
    ("Kolkata", "Bhubaneswar"): 440,
    ("Cuttack", "Kolkata"): 415,
    ("Kolkata", "Cuttack"): 415,
    ("Puri", "Bhubaneswar"): 60,
    ("Bhubaneswar", "Puri"): 60,
    ("Bhubaneswar", "Cuttack"): 25,
    ("Cuttack", "Bhubaneswar"): 25,
    ("Puri", "Kolkata"): 500,
    ("Kolkata", "Puri"): 500,
    ("Berhampur", "Kolkata"): 610,
    ("Kolkata", "Berhampur"): 610,
    ("Bhubaneswar", "Berhampur"): 170,
    ("Berhampur", "Bhubaneswar"): 170,
    ("Rourkela", "Bhubaneswar"): 330,
    ("Bhubaneswar", "Rourkela"): 330,
}

ROUTE_RELIABILITY = {
    ("Bhubaneswar", "Kolkata"): 0.7,
    ("Kolkata", "Bhubaneswar"): 0.7,
    ("Cuttack", "Kolkata"): 0.75,
    ("Kolkata", "Cuttack"): 0.75,
    ("Puri", "Bhubaneswar"): 0.95,
    ("Bhubaneswar", "Puri"): 0.95,
    ("Bhubaneswar", "Cuttack"): 0.95,
    ("Cuttack", "Bhubaneswar"): 0.95,
    ("Puri", "Kolkata"): 0.65,
    ("Kolkata", "Puri"): 0.65,
    ("Berhampur", "Kolkata"): 0.65,
    ("Kolkata", "Berhampur"): 0.65,
    ("Bhubaneswar", "Berhampur"): 0.9,
    ("Berhampur", "Bhubaneswar"): 0.9,
    ("Rourkela", "Bhubaneswar"): 0.85,
    ("Bhubaneswar", "Rourkela"): 0.85,
}

PERISHABILITY_INDEX = {
    "Tomatoes": 0.5,
    "Mangoes": 0.6,
    "Fresh Milk": 0.9,
    "Paneer": 0.8,
    "Vaccines": 1.0,
    "Frozen Fish": 0.95,
    "Onions": 0.2,
    "Green Chillies": 0.4,
    "Bananas": 0.5,
    "Flowers": 0.7,
    "Frozen Peas": 0.8,
    "Medicines": 0.7
}

def generate_id():
    return str(uuid.uuid4())

MOCK_SHIPMENTS = [
    {
        "id": generate_id(),
        "product": "Tomatoes",
        "weight": 200,
        "pickup": "Bhubaneswar",
        "destination": "Kolkata",
        "deadline": "2026-08-18T00:00:00Z",
        "temp_min": 10.0,
        "temp_max": 15.0,
        "status": "Planned"
    },
    {
        "id": generate_id(),
        "product": "Mangoes",
        "weight": 300,
        "pickup": "Cuttack",
        "destination": "Kolkata",
        "deadline": "2026-08-17T00:00:00Z",
        "temp_min": 8.0,
        "temp_max": 12.0,
        "status": "Planned"
    },
    {
        "id": generate_id(),
        "product": "Fresh Milk",
        "weight": 150,
        "pickup": "Puri",
        "destination": "Bhubaneswar",
        "deadline": "2026-08-16T00:00:00Z",
        "temp_min": 2.0,
        "temp_max": 4.0,
        "status": "Planned"
    },
    {
        "id": generate_id(),
        "product": "Paneer",
        "weight": 100,
        "pickup": "Bhubaneswar",
        "destination": "Cuttack",
        "deadline": "2026-08-17T00:00:00Z",
        "temp_min": 2.0,
        "temp_max": 6.0,
        "status": "Planned"
    },
    {
        "id": generate_id(),
        "product": "Vaccines",
        "weight": 50,
        "pickup": "Kolkata",
        "destination": "Bhubaneswar",
        "deadline": "2026-08-19T00:00:00Z",
        "temp_min": 2.0,
        "temp_max": 8.0,
        "status": "Planned"
    },
    {
        "id": generate_id(),
        "product": "Frozen Fish",
        "weight": 400,
        "pickup": "Puri",
        "destination": "Kolkata",
        "deadline": "2026-08-18T00:00:00Z",
        "temp_min": -18.0,
        "temp_max": -12.0,
        "status": "Planned"
    },
    {
        "id": generate_id(),
        "product": "Onions",
        "weight": 500,
        "pickup": "Berhampur",
        "destination": "Kolkata",
        "deadline": "2026-08-20T00:00:00Z",
        "temp_min": 20.0,
        "temp_max": 30.0,
        "status": "Planned"
    },
    {
        "id": generate_id(),
        "product": "Green Chillies",
        "weight": 150,
        "pickup": "Bhubaneswar",
        "destination": "Kolkata",
        "deadline": "2026-08-17T00:00:00Z",
        "temp_min": 7.0,
        "temp_max": 10.0,
        "status": "Planned"
    },
    {
        "id": generate_id(),
        "product": "Bananas",
        "weight": 250,
        "pickup": "Cuttack",
        "destination": "Bhubaneswar",
        "deadline": "2026-08-18T00:00:00Z",
        "temp_min": 13.0,
        "temp_max": 15.0,
        "status": "Planned"
    },
    {
        "id": generate_id(),
        "product": "Flowers",
        "weight": 80,
        "pickup": "Rourkela",
        "destination": "Bhubaneswar",
        "deadline": "2026-08-17T00:00:00Z",
        "temp_min": 2.0,
        "temp_max": 5.0,
        "status": "Planned"
    },
    {
        "id": generate_id(),
        "product": "Frozen Peas",
        "weight": 200,
        "pickup": "Kolkata",
        "destination": "Cuttack",
        "deadline": "2026-08-19T00:00:00Z",
        "temp_min": -15.0,
        "temp_max": -10.0,
        "status": "Planned"
    },
    {
        "id": generate_id(),
        "product": "Medicines",
        "weight": 100,
        "pickup": "Bhubaneswar",
        "destination": "Berhampur",
        "deadline": "2026-08-18T00:00:00Z",
        "temp_min": 15.0,
        "temp_max": 25.0,
        "status": "Planned"
    }
]
