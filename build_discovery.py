import os
import json
import shutil
from datetime import datetime

# Paths
REPO_ROOT = r'c:\Users\user\Documents\Software-Developer\Freelancer\aivery'
OUTPUT_ROOT = r'C:\Users\user\Documents\Software-Developer\Freelancer\avry-discovery'
GRAPH_DATA_PATH = os.path.join(REPO_ROOT, 'discovery', 'data', 'graph.json')
SCHEMA_PATH = os.path.join(REPO_ROOT, 'discovery', 'data', 'schema_info.json')

VAULT_DIR = os.path.join(OUTPUT_ROOT, 'data', 'vault')
DATA_DIR = os.path.join(OUTPUT_ROOT, 'data')

# Knowledge Base for deeper architectural synthesis
KNOWLEDGE_BASE = {
    "auth": "Critical Security Layer. Manages identity verification, JWT issuing, and access control for all platform modules.",
    "payments": "Financial Orchestrator. Handles subscription tiers, billing cycles, and secure gateway handshakes.",
    "vps": "Infrastructure Bridge. Acts as the primary conduit between the cloud console and remote VPS instances.",
    "agents": "AI Brain Engine. Defines the behavioral logic, goal-seeking paths, and execution state of automated agents.",
    "blueprints": "Neural Template Registry. Stores the foundational structures for all AI-generated solutions.",
    "diagnostic": "Business Intelligence Probe. Analyzes user input to calculate AI readiness and implementation scores.",
    "console": "Primary Operations Hub. The central visual and functional cockpit for managing the entire system.",
    "workflows": "Procedural Automator. Coordinates multi-step logic flows across frontend and backend layers.",
    "database": "Persistent Data Core. High-integrity storage for system state, user profiles, and operational logs.",
    "api": "System Interconnect. Defines the formal protocols and endpoints for cross-module communication."
}

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
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
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

def build():
    print("Loading graph data...")
    with open(GRAPH_DATA_PATH, 'r') as f:
        graph_data = json.load(f)
    
    schema_info = {}
    if os.path.exists(SCHEMA_PATH):
        with open(SCHEMA_PATH, 'r') as f:
            schema_info = json.load(f)

    rationale_map = get_rationale_map(graph_data)
    
    processed_nodes = []
    tests_list = []
    reports_list = []
    vps_list = []
    docs_list = []
    
    print("Mirroring repository with AI injections...")
    for root, dirs, files in os.walk(REPO_ROOT):
        if any(x in root for x in ['node_modules', '.git', '__pycache__', 'graphify-out', 'avry-discovery']):
            continue
            
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, REPO_ROOT).replace('\\', '/')
            
            vault_path = os.path.join(VAULT_DIR, rel_path)
            os.makedirs(os.path.dirname(vault_path), exist_ok=True)
            
            rationales = rationale_map.get(rel_path, [])
            injected_code = inject_comments(full_path, rationales)
            with open(vault_path, 'w', encoding='utf-8') as f:
                f.write(injected_code)

            low_rel = rel_path.lower()
            if rel_path.startswith('tests/') or '__tests__' in low_rel:
                tests_list.append({
                    "name": rel_path,
                    "description": rationales[0]['text'] if rationales else "System validation test.",
                    "result_path": f"results/{file}.log",
                    "timestamp": datetime.fromtimestamp(os.path.getmtime(full_path)).strftime('%Y-%m-%d %H:%M:%S')
                })
            
            if low_rel.endswith('.md'):
                doc_item = {"name": file, "path": rel_path}
                if 'vps' in low_rel: vps_list.append(doc_item)
                elif 'report' in low_rel or 'analysis' in low_rel: reports_list.append(doc_item)
                else: docs_list.append(doc_item)

    # Architectural Synthesis
    for node in graph_data['nodes']:
        if node.get('file_type') == 'rationale': continue
        
        filePath = (node.get('source_file') or "").replace('\\', '/')
        label = node.get('label') or ""
        low_path = filePath.lower()
        
        # 1. Lens Categorization
        node['category'] = 'File' # Default
        if filePath.endswith('.html') or 'pages/' in filePath or '/app/' in filePath:
            node['category'] = 'Feature' # Pages
            if 'page.tsx' in filePath or '.html' in filePath:
                node['label'] = f"Page: {filePath}"
        elif 'services/' in low_path or 'backend/' in low_path:
            node['category'] = 'Service'
        elif 'workflow' in low_path or 'logic/' in low_path:
            node['category'] = 'Flow'
        elif 'api/' in low_path or 'routes/' in low_path:
            node['category'] = 'API'
        
        # 2. Schema Intelligence
        cleanLabel = label.replace('.', '').replace('()', '').strip()
        if cleanLabel in schema_info:
            node['schema'] = schema_info[cleanLabel]
            node['category'] = 'DB Table'
            node['layer'] = 'DB'

        # 3. Purpose & Importance Narrative
        node_rationales = rationale_map.get(filePath, [])
        importance = "Standard"
        summary = "Core project file."
        
        # Fallback to Knowledge Base for architectural context
        for key, desc in KNOWLEDGE_BASE.items():
            if key in low_path:
                importance = "High"
                summary = desc
                break

        if node_rationales:
            summary = node_rationales[0]['text']
            detailed = "\n".join([f"• {r['text']}" for r in node_rationales])
        else:
            detailed = f"Architectural logic located in {os.path.dirname(filePath)}."

        node['functionDesc'] = f"Importance: {importance} | Purpose: {summary}"
        node['detailedLogic'] = f"This file handles the logic for {label}. It is essential for the system's stability and coordinates with related files in the {os.path.basename(os.path.dirname(filePath))} directory.\n\nKey Insights:\n{detailed}"

        processed_nodes.append(node)

    # Final Data Export
    for name, data in [('tests.json', tests_list), ('reports.json', reports_list), 
                       ('vps.json', vps_list), ('docs.json', docs_list)]:
        with open(os.path.join(DATA_DIR, name), 'w') as f:
            json.dump(data, f, indent=4)
            
    with open(os.path.join(DATA_DIR, 'graph.json'), 'w') as f:
        json.dump({"nodes": processed_nodes, "links": graph_data['links'], "tree": graph_data.get('tree')}, f, indent=4)

    print("Build complete!")

if __name__ == "__main__":
    build()
