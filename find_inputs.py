import os
import re

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Search for input tags
    inputs = re.finditer(r'<InputText[^>]*>|<InputNumber[^>]*>|<Textarea[^>]*>', content)
    for match in inputs:
        inp = match.group(0)
        # simplistic check if there is an id and if there's a label for it
        # Actually in Vue often forms are laid out sequentially or nested.
        print(f"File: {filepath}\nLine: {content.count(chr(10), 0, match.start()) + 1}\nInput: {inp}\n")

for root, dirs, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.vue'):
            check_file(os.path.join(root, file))
