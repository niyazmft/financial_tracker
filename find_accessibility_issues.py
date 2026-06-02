import os
import re

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find avatars without aria-label or alt if they are interactive
    avatars = re.finditer(r'<Avatar[^>]*cursor-pointer[^>]*>', content)
    for match in avatars:
        av = match.group(0)
        if 'aria-label' not in av and 'alt=' not in av and 'aria-hidden' not in av:
            print(f"File: {filepath}\nLine: {content.count(chr(10), 0, match.start()) + 1}\nMissing ARIA on Avatar: {av}\n")

    # Find standard buttons with icon but no text and no aria-label
    # <button ...> <i class="pi pi-icon" /> </button>
    buttons = re.finditer(r'<button[^>]*>.*?<\/button>', content, re.DOTALL)
    for match in buttons:
        btn = match.group(0)
        if '<i ' in btn and not re.search(r'[a-zA-Z]{2,}', re.sub(r'<[^>]*>', '', btn)) and 'aria-label' not in btn:
             print(f"File: {filepath}\nLine: {content.count(chr(10), 0, match.start()) + 1}\nMissing ARIA on button: {btn.strip()}\n")

for root, dirs, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.vue'):
            check_file(os.path.join(root, file))
