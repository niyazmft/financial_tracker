import os
import re

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find <Button tags, allowing multiple lines until >
    buttons = re.finditer(r'<Button[^>]*>', content)
    for match in buttons:
        b = match.group(0)
        has_icon = 'icon=' in b
        has_label = 'label=' in b
        has_aria_label = 'aria-label=' in b
        has_v_bind_aria_label = ':aria-label=' in b

        if has_icon and not has_label and not has_aria_label and not has_v_bind_aria_label:
            print(f"File: {filepath}\nLine: {content.count(chr(10), 0, match.start()) + 1}\nButton: {b}\n")

for root, dirs, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.vue'):
            check_file(os.path.join(root, file))
