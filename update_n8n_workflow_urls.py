#!/usr/bin/env python3
"""
Script to update n8n workflow HTTP Request node URLs from 127.0.0.1:3003 to host.docker.internal:3003
This script should be run on the VPS at ubuntu@43.156.108.96
"""

import sqlite3
import json
import sys

def update_workflow_urls(db_path):
    """Update HTTP Request node URLs in n8n workflows"""
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all workflows
    cursor.execute("SELECT id, name, nodes FROM workflow_entity")
    workflows = cursor.fetchall()
    
    updated_count = 0
    
    for workflow_id, workflow_name, nodes_json in workflows:
        if not nodes_json:
            continue
            
        try:
            nodes = json.loads(nodes_json)
            modified = False
            
            # Update each node
            for node in nodes:
                if node.get('type') == '@n8n/n8n-nodes-base.httpRequest':
                    parameters = node.get('parameters', {})
                    url = parameters.get('url')
                    
                    if url and '127.0.0.1:3003' in url:
                        # Replace 127.0.0.1:3003 with host.docker.internal:3003
                        new_url = url.replace('127.0.0.1:3003', 'host.docker.internal:3003')
                        parameters['url'] = new_url
                        modified = True
                        print(f"  Updated node '{node.get('name', 'Unknown')}' in workflow '{workflow_name}'")
                        print(f"    Old URL: {url}")
                        print(f"    New URL: {new_url}")
            
            if modified:
                # Update the workflow in the database
                updated_nodes_json = json.dumps(nodes)
                cursor.execute(
                    "UPDATE workflow_entity SET nodes = ? WHERE id = ?",
                    (updated_nodes_json, workflow_id)
                )
                updated_count += 1
                print(f"✓ Updated workflow: {workflow_name}\n")
                
        except json.JSONDecodeError as e:
            print(f"Error parsing nodes for workflow {workflow_name}: {e}")
            continue
    
    # Commit changes
    conn.commit()
    conn.close()
    
    print(f"\n{'='*60}")
    print(f"Summary: Updated {updated_count} workflows")
    print(f"{'='*60}")
    
    return updated_count

if __name__ == "__main__":
    db_path = "/home/ubuntu/n8n/.n8n/database.sqlite"
    
    print("Updating n8n workflow HTTP Request node URLs...")
    print(f"Database: {db_path}")
    print(f"Replacing: 127.0.0.1:3003 → host.docker.internal:3003")
    print(f"{'='*60}\n")
    
    try:
        update_workflow_urls(db_path)
        print("\n✓ Update completed successfully!")
        print("\nPlease restart n8n to apply changes:")
        print("  cd /home/ubuntu && docker compose restart n8n")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)