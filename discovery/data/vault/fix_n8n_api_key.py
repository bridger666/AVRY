#!/usr/bin/env python3
"""
Fix n8n workflow HTTP Request nodes to include correct API key header for VPS Bridge.

This script:
1. Fetches the "Zeroclaw Universal Skill Handler v2" workflow from n8n
2. Updates all HTTP Request nodes to include x-api-key header
3. Ensures URLs use host.docker.internal:3003
4. Pushes the updated workflow back to n8n
"""

import requests
import json
import sys

# Configuration
N8N_BASE_URL = "http://43.156.108.96:5678"
N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMWM4MzRmNS00YWRkLTQ3OTEtOWVkNS1iYjljYzFjZThkOWUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDIyMTAwMDUtNDNkNi00Zjc4LWJhNDgtNWQ4ODdlOTkxNmVmIiwiaWF0IjoxNzc3MDkzMjY0fQ.OU8jSc5ANhOrn-ytRoBqnGce6lAPJVmLOQXD2BW0tqc"

WORKFLOW_NAME = "Zeroclaw Universal Skill Handler v2"
VPS_BRIDGE_API_KEY = "supersecret-xyz123456789"
VPS_BRIDGE_BASE_URL = "http://host.docker.internal:3003"

# Headers for n8n API
headers = {
    "Content-Type": "application/json",
    "X-N8N-API-KEY": N8N_API_KEY
}


def get_workflows():
    """Fetch all workflows from n8n"""
    print(f"Fetching workflows from {N8N_BASE_URL}/api/v1/workflows...")
    response = requests.get(f"{N8N_BASE_URL}/api/v1/workflows", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch workflows: {response.status_code}")
        print(f"Response: {response.text}")
        sys.exit(1)
    
    return response.json()


def find_workflow_by_name(workflows, name):
    """Find workflow by name"""
    for workflow in workflows:
        if workflow.get('name') == name:
            return workflow
    return None


def update_http_request_nodes(workflow):
    """Update all HTTP Request nodes with correct API key header"""
    nodes = workflow.get('nodes', [])
    updated_count = 0
    
    print(f"\nProcessing {len(nodes)} nodes...")
    
    for node in nodes:
        if node.get('type') == 'n8n-nodes-base.httpRequest':
            node_name = node.get('name', 'Unknown')
            print(f"\n📝 Found HTTP Request node: {node_name}")
            
            # Get node parameters
            parameters = node.get('parameters', {})
            
            # Update URL to use host.docker.internal:3003
            url = parameters.get('url', '')
            if '127.0.0.1:3003' in url:
                old_url = url
                url = url.replace('127.0.0.1:3003', VPS_BRIDGE_BASE_URL)
                parameters['url'] = url
                print(f"  ✅ Updated URL: {old_url} → {url}")
            elif VPS_BRIDGE_BASE_URL in url:
                print(f"  ✅ URL already correct: {url}")
            else:
                print(f"  ℹ️  URL: {url}")
            
            # Update headers
            header_parameters = parameters.get('headerParameters', {})
            
            # Check if x-api-key header exists
            api_key_found = False
            for i, header in enumerate(header_parameters.get('parameters', [])):
                if header.get('name', '').lower() == 'x-api-key':
                    old_value = header.get('value', '')
                    header['value'] = VPS_BRIDGE_API_KEY
                    api_key_found = True
                    print(f"  ✅ Updated x-api-key header: {old_value} → {VPS_BRIDGE_API_KEY}")
                    break
            
            # If x-api-key header doesn't exist, add it
            if not api_key_found:
                if 'parameters' not in header_parameters:
                    header_parameters['parameters'] = []
                
                header_parameters['parameters'].append({
                    'name': 'x-api-key',
                    'value': VPS_BRIDGE_API_KEY
                })
                parameters['headerParameters'] = header_parameters
                print(f"  ✅ Added x-api-key header: {VPS_BRIDGE_API_KEY}")
            
            # Update node parameters
            node['parameters'] = parameters
            updated_count += 1
    
    return updated_count


def update_workflow(workflow):
    """Push updated workflow back to n8n"""
    workflow_id = workflow.get('id')
    print(f"\n📤 Updating workflow {workflow_id}...")
    
    # Remove fields that shouldn't be sent in update
    workflow_data = {
        'name': workflow.get('name'),
        'nodes': workflow.get('nodes'),
        'connections': workflow.get('connections'),
        'settings': workflow.get('settings'),
        'staticData': workflow.get('staticData', None),
        'tags': workflow.get('tags', []),
        'pinData': workflow.get('pinData', {}),
        'versionId': workflow.get('versionId')
    }
    
    response = requests.patch(
        f"{N8N_BASE_URL}/api/v1/workflows/{workflow_id}",
        headers=headers,
        json=workflow_data
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to update workflow: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    print(f"✅ Workflow updated successfully!")
    return True


def activate_workflow(workflow_id):
    """Activate the workflow"""
    print(f"\n🔄 Activating workflow {workflow_id}...")
    
    response = requests.patch(
        f"{N8N_BASE_URL}/api/v1/workflows/{workflow_id}",
        headers=headers,
        json={'active': True}
    )
    
    if response.status_code != 200:
        print(f"⚠️  Failed to activate workflow: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    print(f"✅ Workflow activated!")
    return True


def main():
    print("=" * 60)
    print("n8n Workflow API Key Fix Script")
    print("=" * 60)
    
    # Fetch workflows
    workflows = get_workflows()
    print(f"✅ Found {len(workflows)} workflows")
    
    # Find target workflow
    workflow = find_workflow_by_name(workflows, WORKFLOW_NAME)
    if not workflow:
        print(f"\n❌ Workflow '{WORKFLOW_NAME}' not found!")
        print("\nAvailable workflows:")
        for w in workflows:
            print(f"  - {w.get('name')} (ID: {w.get('id')})")
        sys.exit(1)
    
    print(f"✅ Found workflow: {WORKFLOW_NAME} (ID: {workflow.get('id')})")
    
    # Update HTTP Request nodes
    updated_count = update_http_request_nodes(workflow)
    
    if updated_count == 0:
        print("\n⚠️  No HTTP Request nodes found or updated")
        sys.exit(0)
    
    print(f"\n✅ Updated {updated_count} HTTP Request node(s)")
    
    # Update workflow
    if not update_workflow(workflow):
        sys.exit(1)
    
    # Activate workflow
    if not activate_workflow(workflow.get('id')):
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✅ All done! Workflow updated and activated.")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Test the webhook with:")
    print("   curl -X POST 'http://43.156.108.96:5678/webhook/zeroclaw-skill-router-V2' \\")
    print("     -H 'Content-Type: application/json' \\")
    print("     -d '{\"skill\": \"deep_diagnostic\", \"context\": {...}}'")
    print("\n2. Check n8n UI at http://43.156.108.96:5678")
    print("3. Verify workflow executions are successful")


if __name__ == "__main__":
    main()