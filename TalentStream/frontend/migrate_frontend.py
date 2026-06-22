import os
import shutil
import re

FRONTEND_DIR = os.path.abspath(r"d:\TalentStream\TalentStream\frontend")
SRC_DIR = os.path.join(FRONTEND_DIR, "src")
APP_DIR = os.path.join(SRC_DIR, "app")

# Existing folders to migrate
MAPPINGS = {
    # Pages to Components
    "pages/LoginPage.tsx": "app/components/login/LoginPage.tsx",
    "pages/PMCreateJob.tsx": "app/components/test-plan/PMCreateJob.tsx",
    "pages/PMDashboard.tsx": "app/components/dashboard/PMDashboard.tsx", 
    "pages/PMMatches.tsx": "app/components/priority-preview/PMMatches.tsx",

    # Components to Components
    "components/Header.tsx": "app/components/shared/Header.tsx",
    "components/Sidebar.tsx": "app/components/shared/Sidebar.tsx",
    "components/icons.tsx": "app/components/shared/icons.tsx",
    "components/ThemeToggle.tsx": "app/components/shared/ThemeToggle.tsx",
    "components/ProtectedRoute.tsx": "app/guards/ProtectedRoute.tsx",
    "components/UploadResumes.tsx": "app/components/scan/UploadResumes.tsx",
    "components/UploadResume.jsx": "app/components/scan/UploadResume.jsx",
    "components/JobMatches.tsx": "app/components/priority-preview/JobMatches.tsx",
    "components/MatchJob.jsx": "app/components/priority-preview/MatchJob.jsx",
    "components/VPDashboard.tsx": "app/components/dashboard/VPDashboard.tsx",

    # Core logic
    "auth/AuthProvider.tsx": "app/services/auth/AuthProvider.tsx",
    "auth/keycloak.ts": "app/services/auth/keycloak.ts",
    "context/ThemeContext.tsx": "app/services/context/ThemeContext.tsx",
    "context/LayoutContext.tsx": "app/services/context/LayoutContext.tsx",
    "context/AuthContext.tsx": "app/services/context/AuthContext.tsx",
    "graphql/queries.ts": "app/api/graphql/queries.ts",
    "apollo.ts": "app/api/apollo.ts",
    "config/roles.ts": "app/constants/roles.ts",
}

IMPORT_REPLACEMENTS = {
    "./auth/AuthProvider": "@/app/services/auth/AuthProvider",
    "./context/ThemeContext": "@/app/services/context/ThemeContext",
    "./apollo": "@/app/api/apollo",
    "./config/roles": "@/app/constants/roles",
    "./components/Header": "@/app/components/shared/Header",
    "./components/ProtectedRoute": "@/app/guards/ProtectedRoute",
    "./pages/LoginPage": "@/app/components/login/LoginPage",
    "./components/UploadResumes": "@/app/components/scan/UploadResumes",
    "./components/VPDashboard": "@/app/components/dashboard/VPDashboard",
    "./pages/PMDashboard": "@/app/components/dashboard/PMDashboard",
    "./pages/PMCreateJob": "@/app/components/test-plan/PMCreateJob.tsx",
    "./pages/PMMatches": "@/app/components/priority-preview/PMMatches",
    "../components/": "@/app/components/",
    "../pages/": "@/app/components/",
}

def migrate():
    print("Starting frontend migration...")
    
    for old_rel, new_rel in MAPPINGS.items():
        old_path = os.path.join(SRC_DIR, os.path.normpath(old_rel))
        new_path = os.path.join(SRC_DIR, os.path.normpath(new_rel))
        
        if os.path.exists(old_path):
            os.makedirs(os.path.dirname(new_path), exist_ok=True)
            shutil.copy2(old_path, new_path)
            print(f"Copied: {old_rel} -> {new_rel}")
        else:
            print(f"Skipped (Not Found): {old_rel}")

    # Update Imports in all TS/TSX files
    print("\nUpdating imports to use @/ alias style...")
    for root, dirs, files in os.walk(SRC_DIR):
        for f in files:
            if f.endswith((".ts", ".tsx", ".jsx")):
                filepath = os.path.join(root, f)
                with open(filepath, "r", encoding="utf-8") as fp:
                    content = fp.read()
                
                # Apply replacements
                for old_imp, new_imp in IMPORT_REPLACEMENTS.items():
                    content = content.replace(f"'{old_imp}'", f"'{new_imp}'")
                    content = content.replace(f"\"{old_imp}\"", f"\"{new_imp}\"")
                
                # Heuristic for relative paths going up
                content = re.sub(r"from\s+['\"]\.(\.\/)+auth\/", "from '@/app/services/auth/", content)
                content = re.sub(r"from\s+['\"]\.(\.\/)+context\/", "from '@/app/services/context/", content)
                content = re.sub(r"from\s+['\"]\.(\.\/)+components\/", "from '@/app/components/", content)
                content = re.sub(r"from\s+['\"]\.(\.\/)+pages\/", "from '@/app/components/", content)
                
                with open(filepath, "w", encoding="utf-8") as fp:
                    fp.write(content)

    print("\nFrontend migration complete.")

if __name__ == "__main__":
    migrate()
