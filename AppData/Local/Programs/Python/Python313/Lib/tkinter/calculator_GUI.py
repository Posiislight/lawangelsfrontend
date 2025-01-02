import tkinter as tk
from tkinter import messagebox

root = tk.Tk()
root.title("Calculator")
root.geometry("400x600")

# Create the display widget
display = tk.Entry(root, font=("Arial", 24), borderwidth=2, relief="solid")
display.grid(row=0, column=0, columnspan=4, padx=20, pady=20, sticky="nsew")

# Define button click function
def button_click(value):
    current_text = display.get()
    display.delete(0, tk.END)
    display.insert(0, current_text + value)

# Define clear and evaluate functions
def clear_display():
    display.delete(0, tk.END)

def evaluate_expression():
    try:
        result = eval(display.get())
        display.delete(0, tk.END)
        display.insert(0, str(result))
    except Exception as e:
        messagebox.showerror("Error", "Invalid Expression")
        clear_display()

# Create buttons
buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '=', '+'
]

row = 1
col = 0

for button in buttons:
    if button == '=':
        tk.Button(root, text=button, font=("Arial", 18), command=evaluate_expression).grid(row=row, column=col, columnspan=2, sticky="nsew")
        col += 1
    else:
        tk.Button(root, text=button, font=("Arial", 18), command=lambda b=button: button_click(b)).grid(row=row, column=col, sticky="nsew")
    
    col += 1
    if col > 3:
        col = 0
        row += 1

tk.Button(root, text='C', font=("Arial", 18), command=clear_display).grid(row=row, column=col, columnspan=2, sticky="nsew")

# Configure grid layout
for i in range(5):
    root.grid_rowconfigure(i, weight=1)
    root.grid_columnconfigure(i, weight=1)

root.mainloop()