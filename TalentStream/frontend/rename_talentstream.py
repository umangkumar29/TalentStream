import os

frontend_src_dir = r"d:\TalentStream\TalentStream\frontend\src"
frontend_dir = r"d:\TalentStream\TalentStream\frontend"

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content.replace("Aether", "TalentStream").replace("aether", "talentstream")
        
        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated content in {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

# Update contents of all relevant files
for root, dirs, files in os.walk(frontend_dir):
    if "node_modules" in root or ".git" in root:
        continue
    for file in files:
        if file.endswith((".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".json")):
            replace_in_file(os.path.join(root, file))

# Rename files
for root, dirs, files in os.walk(frontend_dir, topdown=False):
    if "node_modules" in root or ".git" in root:
        continue
    for file in files:
        if "Aether" in file or "aether" in file:
            new_name = file.replace("Aether", "TalentStream").replace("aether", "talentstream")
            old_path = os.path.join(root, file)
            new_path = os.path.join(root, new_name)
            os.rename(old_path, new_path)
            print(f"Renamed {old_path} -> {new_path}")

# Rename directories
for root, dirs, files in os.walk(frontend_dir, topdown=False):
    if "node_modules" in root or ".git" in root:
        continue
    for dir_name in dirs:
        if "Aether" in dir_name or "aether" in dir_name:
            new_name = dir_name.replace("Aether", "TalentStream").replace("aether", "talentstream")
            old_path = os.path.join(root, dir_name)
            new_path = os.path.join(root, new_name)
            os.rename(old_path, new_path)
            print(f"Renamed dir {old_path} -> {new_path}")

print("Refactoring complete.")
