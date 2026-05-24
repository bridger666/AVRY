import os
import json
import shutil
from datetime import datetime

# Paths
REPO_ROOT = r'c:\Users\user\Documents\Software-Developer\Freelancer\aivery'
OUTPUT_ROOT = r'C:\Users\user\Documents\Software-Developer\Freelancer\avry-discovery'
# Use the persisted graph as source
GRAPH_DATA_PATH = os.path.join(OUTPUT_ROOT, 'data', 'graph.json') 

VAULT_DIR = os.path.join(OUTPUT_ROOT, 'data', 'vault')
DATA_DIR = os.path.join(OUTPUT_ROOT, 'data')

def get_rationale_map(graph_data):
    rmap = {}
    for node in graph_data.get('nodes', []):
        if node.get('file_type') == 'rationale':
            file = node.get('source_file')
            if not file: continue
            if file not in rmap: rmap[file] = []
            rmap[file].append({
                'line': int(node.get('source_location', 'L0').replace('L', '')),
                'text': node.get('label', '')
            })
    return rmap

def inject_comments(file_path, rationales):
    if not os.path.exists(file_path): return ""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except: return ""

    sorted_rat = sorted(rationales, key=lambda x: x['line'], reverse=True)
    ext = os.path.splitext(file_path)[1]
    comment_sym = "#" if ext in ['.py', '.sh', '.yaml', '.yml'] else "//"
    
    for r in sorted_rat:
        idx = min(r['line'] - 1, len(lines))
        if idx < 0: idx = 0
        lines.insert(idx, f"\n{comment_sym} ARCHITECTURE INSIGHT: {r['text']}\n")
    return "".join(lines)

def build_tree(nodes):
    root = {"name": "AVRY Root", "children": []}
    tree_map = {"root": root}
    for n in nodes:
        path_str = n.get('source_file') or n.get('label')
        if not path_str or '.' not in path_str: continue
        parts = path_str.replace('\\', '/').split('/')
        current_path = "root"
        current_node = root
        for i, part in enumerate(parts):
            current_path += "/" + part
            if current_path not in tree_map:
                new_node = {"name": part, "children": []}
                tree_map[current_path] = new_node
                current_node["children"].append(new_node)
            current_node = tree_map[current_path]
            if i == len(parts) - 1:
                current_node["id"] = n.get("id")
                current_node["category"] = n.get("category")
    return root

def build():
    print("Loading existing graph data...")
    if not os.path.exists(GRAPH_DATA_PATH):
        print("Error: graph.json source not found.")
        return

    with open(GRAPH_DATA_PATH, 'r') as f:
        graph_data = json.load(f)
    
    rationale_map = get_rationale_map(graph_data)
    processed_nodes = []
    tests_list = []
    docs_list = []
    
    print("Verifying repository files and injecting logic...")
    for root, dirs, files in os.walk(REPO_ROOT):
        if any(x in root for x in ['node_modules', '.git', '__pycache__', 'avry-discovery']):
            continue
            
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, REPO_ROOT).replace('\\', '/')
            
            # Skip large binaries for the vault
            if file.endswith(('.png', '.jpg', '.zip', '.exe')): continue

            # 1. Inject Logic into Vault
            rationales = rationale_map.get(rel_path, [])
            injected_code = inject_comments(full_path, rationales)
            vault_path = os.path.join(VAULT_DIR, rel_path)
            os.makedirs(os.path.dirname(vault_path), exist_ok=True)
            with open(vault_path, 'w', encoding='utf-8') as f:
                f.write(injected_code)

            # 2. Extract REAL metadata
            lower_rel = rel_path.lower()
            
            # Tests Discovery
            if 'tests/' in lower_rel or '__tests__' in lower_rel:
                tests_list.append({
                    "name": rel_path,
                    "description": rationales[0]['text'] if rationales else "Automated system test module.",
                    "timestamp": datetime.fromtimestamp(os.path.getmtime(full_path)).strftime('%Y-%m-%d %H:%M:%S')
                })
            
            # Documentation & Categorization
            if file.endswith(('.md', '.txt', '.pdf', '.sh')):
                category = "Documentation"
                if "analysis" in lower_rel: category = "Analysis"
                elif "vps" in lower_rel or "bridge" in lower_rel: category = "Infrastructure"
                elif "guide" in lower_rel or "how-to" in lower_rel: category = "Guides"
                elif "legal" in lower_rel or "license" in lower_rel: category = "Legal"
                elif "report" in lower_rel: category = "Reports"
                
                docs_list.append({
                    "name": file,
                    "path": rel_path,
                    "category": category
                })

    # 3. Finalize Graph & Tree
    for node in graph_data['nodes']:
        if node.get('file_type') == 'rationale': continue
        processed_nodes.append(node)

    tree = build_tree(processed_nodes)

    # 4. Save Static Data
    print("Persisting final architecture data...")
    with open(os.path.join(DATA_DIR, 'tests.json'), 'w') as f: json.dump(tests_list, f, indent=4)
    with open(os.path.join(DATA_DIR, 'docs.json'), 'w') as f: json.dump(docs_list, f, indent=4)
    with open(os.path.join(DATA_DIR, 'graph.json'), 'w') as f:
        json.dump({
            "nodes": processed_nodes, 
            "links": graph_data.get('links', []),
            "tree": tree
        }, f, indent=4)
    print("Build complete!")

if __name__ == "__main__":
    build()
