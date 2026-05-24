#!/usr/bin/env python3
"""
Update n8n workflow HTTP Request nodes with correct API key header
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('vps-bridge/.env')

N8N_BASE_URL = os.getenv('N8N_BASE_URL', 'http://43.156.108.96:5678')
N8N_API_KEY = os.getenv('N8N_API_KEY_1', '')

# Workflow ID for Zeroclaw Universal Skill Handler v2
WORKFLOW_ID = 'Tu5VrBcDwUtRChdh'

# API key to add to HTTP Request nodes
API_KEY_HEADER = 'X-API-Key'
API_KEY_VALUE = 'supersecret-xyz123456789'

def get_workflow():
    """Fetch workflow from n8n"""
    url = f"{N8N_BASE_URL}/api/v1/workflows/{WORKFLOW_ID}"
    headers = {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Failed to fetch workflow: {response.status_code}")
        print(response.text)
        return None

def update_http_request_nodes(workflow):
    """Update all HTTP Request nodes with API key header"""
    nodes = workflow.get('nodes', [])
    updated_count = 0
    
    for node in nodes:
        if node.get('type') == 'n8n-nodes-base.httpRequest':
            node_name = node.get('name', 'Unknown')
            parameters = node.get('parameters', {})
            
            # Initialize headerParameters if it doesn't exist
            if 'headerParameters' not in parameters:
                parameters['headerParameters'] = {'parameters': []}
            
            # Check if X-API-Key header already exists
            header_params = parameters['headerParameters']['parameters']
            api_key_exists = False
            
            for header in header_params:
                if header.get('name') == API_KEY_HEADER:
                    header['value'] = API_KEY_VALUE
                    api_key_exists = True
                    print(f"✅ Updated existing API key in node: {node_name}")
                    break
            
            # Add X-API-Key header if it doesn't exist
            if not api_key_exists:
                header_params.append({
                    'name': API_KEY_HEADER,
                    'value': API_KEY_VALUE
                })
                print(f"✅ Added API key to node: {node_name}")
            
            updated_count += 1
    
    return updated_count

def save_workflow(workflow):
    """Save updated workflow to n8n"""
    url = f"{N8N_BASE_URL}/api/v1/workflows/{WORKFLOW_ID}"
    headers = {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
    }
    
    response = requests.patch(url, headers=headers, json=workflow)
    if response.status_code == 200:
        print(f"✅ Workflow saved successfully")
        return True
    else:
        print(f"❌ Failed to save workflow: {response.status_code}")
        print(response.text)
        return False

def main():
    print("=" * 60)
    print("Updating n8n workflow with API key header")
    print("=" * 60)
    print(f"N8N Base URL: {N8N_BASE_URL}")
    print(f"Workflow ID: {WORKFLOW_ID}")
    print(f"API Key Header: {API_KEY_HEADER}")
    print(f"API Key Value: {API_KEY_VALUE}")
    print()
    
    # Fetch workflow
    print("Fetching workflow from n8n...")
    workflow = get_workflow()
    if not workflow:
        return
    
    print(f"✅ Workflow fetched: {workflow.get('name', 'Unknown')}")
    print(f"   Total nodes: {len(workflow.get('nodes', []))}")
    print()
    
    # Update HTTP Request nodes
    print("Updating HTTP Request nodes...")
    updated_count = update_http_request_nodes(workflow)
    print(f"✅ Updated {updated_count} HTTP Request node(s)")
    print()
    
    # Save workflow
    print("Saving workflow to n8n...")
    if save_workflow(workflow):
        print()
        print("=" * 60)
        print("✅ SUCCESS: Workflow updated with API key header")
        print("=" * 60)
    else:
        print()
        print("=" * 60)
        print("❌ FAILED: Could not save workflow")
        print("=" * 60)

if __name__ == '__main__':
    main()