# 🚀 Running the TalentStream AI Platform

Follow these steps to initialize the **80% Widescreen Identity Hub** on your local machine.

---

## 1. Environment Configuration

### Backend Setup (`/backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
PROJECT_NAME="TalentStream AI"
DATABASE_URL="sqlite:///./talentstream.db"
AUTH_ENABLED=True

# Local JWT Matrix (HS256)
JWT_SECRET_KEY="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
JWT_ALGORITHM="HS256"

# Keycloak (Optional SSO Matrix)
KEYCLOAK_URL="http://localhost:8180"
KEYCLOAK_REALM="talentstream"
KEYCLOAK_CLIENT_ID="talentstream-backend"
```

### Frontend Setup (`/frontend/.env`)
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_BASE_URL="http://localhost:8000/api/v1"
VITE_AUTH_ENABLED=false # Set to true to enable Keycloak redirect
```

---

## 2. Initialize the Backend Logic Cluster

1.  **Activate Virtual Environment**:
    ```powershell
    cd backend
    python -m venv venv
    .\venv\Scripts\activate
    ```
2.  **Install Essential Matrix**:
    ```powershell
    pip install -r requirements.txt
    ```
3.  **Seed Local Protocol (First Admin)**:
    Run this python script to initialize your `talentstream.db` and create the first **System Admin**:
    ```python
    from app.db.database import engine, SessionLocal
    from app.db.models import Base, User, UserRole
    from app.core.auth import hash_password

    # Force Schema Creation
    Base.metadata.create_all(bind=engine)

    # Seed Admin Matrix
    db = SessionLocal()
    admin = User(
        username="admin", 
        email="admin@talentstream.ai", 
        name="System Admin", 
        role=UserRole.Admin,
        hashed_password=hash_password("admin123")
    )
    db.add(admin)
    db.commit()
    print("🚀 Admin Protocol Initialized: admin / admin123")
    ```
4.  **Launch Backend Hub**:
    ```powershell
    uvicorn app.main:app --reload --port 8000
    ```

---

## 3. Execute the High-Density Frontend

1.  **Install Node Modules**:
    ```powershell
    cd frontend
    npm install
    ```
2.  **Activate Widescreen Portal**:
    ```powershell
    npm run dev
    ```

---

## 4. Accessing the Matrix

1.  **Navigate to**: `http://localhost:5173`.
2.  **Identity Link**: Toggle to **"Identity Matrix"** (Local Auth) on the login screen.
    *   **Username**: `admin`
    *   **Secret**: `admin123`
3.  **Optimization**: Ensure your display is set to at least 1920x1080 to experience the **80% horizontal workspace** fully.

---

## ⚡ Troubleshooting Link
*   **Vector Matrix Error (404)**: Ensure [ProtectedRoute.tsx](file:///s:/WORK/RMG/TalentStream/frontend/src/components/ProtectedRoute.tsx) points to the new [AuthProvider.tsx](file:///s:/WORK/RMG/TalentStream/frontend/src/auth/AuthProvider.tsx).
*   **Link Severed (500)**: Verify that the `uvicorn` server is active on `port 8000`.
*   **Non-Uniformity**: Check [design-tokens.css](file:///s:/WORK/RMG/TalentStream/frontend/src/styles/design-tokens.css) if fonts appear inconsistent across modules.
