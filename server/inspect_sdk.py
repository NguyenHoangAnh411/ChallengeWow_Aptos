# inspect_sdk.py
import os
import pkgutil
import sys

try:
    import aptos_sdk
    print("--- Found library: aptos_sdk ---")
except ImportError:
    print("--- ERROR: Could not find 'aptos_sdk' library. ---")
    print("Please ensure it is installed by running: python -m pip install aptos-sdk")
    sys.exit()

# Find the installation path of the library
package_path = os.path.dirname(aptos_sdk.__file__)
print(f"Library 'aptos_sdk' is installed at: {package_path}\n")

print("--- Discovering modules inside 'aptos_sdk' ---")
found = False
# Walk through the package to find all modules
for _, module_name, _ in pkgutil.walk_packages([package_path], prefix='aptos_sdk.'):
    print(f"Scanning module: {module_name}")

    # Try to import the module and inspect its contents for 'RestClient'
    try:
        module = __import__(module_name, fromlist=['*'])
        if 'RestClient' in dir(module):
            print(f"\n>>> SUCCESS: Found 'RestClient' in module '{module_name}' <<<")
            print(f"--> The correct import line is: from {module_name} import RestClient\n")
            found = True
    except Exception:
        # Ignore modules that can't be imported
        pass

if not found:
    print("\n--- RESULT: Could not automatically find 'RestClient'. ---")
    print("This might indicate a problem with the library installation.")