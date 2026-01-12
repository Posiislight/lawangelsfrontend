import os

base_dir = os.path.dirname(os.path.abspath(__file__))
flashcards_dir = os.path.join(base_dir, 'flashcards')
flk1_dir = os.path.join(flashcards_dir, 'flk1')

print(f"Base: {base_dir}")
print(f"Flashcards Dir: {flashcards_dir}")
print(f"Exists: {os.path.exists(flashcards_dir)}")
if os.path.exists(flashcards_dir):
    print("Files in root:")
    print(os.listdir(flashcards_dir))

print(f"FLK1 Dir: {flk1_dir}")
print(f"Exists: {os.path.exists(flk1_dir)}")
if os.path.exists(flk1_dir):
    print("Files in flk1:")
    print(os.listdir(flk1_dir))
