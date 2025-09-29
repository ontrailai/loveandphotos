#!/usr/bin/env python3

import re

def process_sql_file():
    with open('/Users/ryanwatson/loveandphotos/photographers-insert.sql', 'r') as file:
        content = file.read()
    
    # Replace NULL location values with 'Location Not Specified'
    # Pattern: find lines with NULL followed by NULL on consecutive lines that represent location_city and location_state
    pattern = r'(\d+,\s*\n\s*)NULL,(\s*\n\s*)NULL,(\s*\n\s*true,)'
    replacement = r"\1'Location Not Specified',\2'Location Not Specified',\3"
    
    processed_content = re.sub(pattern, replacement, content)
    
    # Count how many replacements were made
    null_count = content.count('NULL,\n  NULL,\n  true,')
    replacement_count = processed_content.count("'Location Not Specified',\n  'Location Not Specified',\n  true,")
    
    print(f"Original NULL location pairs: {null_count}")
    print(f"Processed location pairs: {replacement_count}")
    
    # Write the processed content
    with open('/Users/ryanwatson/loveandphotos/photographers-insert-processed.sql', 'w') as file:
        file.write(processed_content)
    
    print("Processing complete!")

if __name__ == "__main__":
    process_sql_file()