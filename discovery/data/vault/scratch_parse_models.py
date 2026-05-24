import os
import re
import json

MODELS_DIR = r"c:\Users\user\Documents\Software-Developer\Freelancer\aivery\app\models"
OUTPUT_FILE = r"c:\Users\user\Documents\Software-Developer\Freelancer\aivery\graphify-out\schema_info.json"

def parse_models():
    schema_info = {}
    
    for filename in os.listdir(MODELS_DIR):
        if filename.endswith(".py") and filename != "__init__.py":
            filepath = os.path.join(MODELS_DIR, filename)
            with open(filepath, "r") as f:
                content = f.read()
                
            # Find all classes inheriting from BaseModel
            classes = re.finditer(r"class\s+(\w+)\(BaseModel\):", content)
            
            for cls_match in classes:
                cls_name = cls_match.group(1)
                # Simple extraction of fields: variable_name: type_hint
                # This matches "field_name: type" or "field_name: type = default"
                start_pos = cls_match.end()
                # Find the end of the class (next class or EOF)
                next_cls = re.search(r"class\s+\w+", content[start_pos:])
                end_pos = start_pos + next_cls.start() if next_cls else len(content)
                class_body = content[start_pos:end_pos]
                
                fields = []
                for field_match in re.finditer(r"^\s{4}(\w+):\s*([^=\n#]+)", class_body, re.MULTILINE):
                    f_name = field_match.group(1)
                    f_type = field_match.group(2).strip()
                    fields.append({"name": f_name, "type": f_type})
                
                if fields:
                    schema_info[cls_name] = {
                        "file": filename,
                        "fields": fields
                    }
                    
    with open(OUTPUT_FILE, "w") as f:
        json.dump(schema_info, f, indent=4)
    print(f"Schema info saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    parse_models()
