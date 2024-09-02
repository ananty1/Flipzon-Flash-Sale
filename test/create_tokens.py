import csv

def generate_tokens(filename='tokens.csv', num_tokens=3000):
    with open(filename, 'w', newline='') as file:
        writer = csv.writer(file)
        for i in range(1, num_tokens + 1):
            token = f'token_{i}'  # Generate sequential tokens
            writer.writerow([token])

# Usage
generate_tokens()
