import sys
import os

# Add the current directory to path so we can import ai_client
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from ai_client import AIClient
    import requests
except ImportError as e:
    print(f"Error: {e}")
    sys.exit(1)

def test_connectivity():
    print("=== NutriScan AI Connectivity Test ===")
    
    # 1. Check Ollama URL
    print(f"[~] Target: {AIClient.OLLAMA_URL}")
    
    # 2. Test Connection
    print("[~] Testing connection to Ollama...")
    try:
        resp = requests.get("http://localhost:11434/api/tags", timeout=2)
        if resp.status_code == 200:
            print("[+] Connection Successful! Ollama is running.")
            models = resp.json().get('models', [])
            model_names = [m['name'] for m in models]
            print(f"[+] Installed models: {', '.join(model_names)}")
            
            if AIClient.VISION_MODEL not in [m.split(':')[0] for m in model_names]:
                print(f"[!] Warning: '{AIClient.VISION_MODEL}' model not found. Run 'ollama pull {AIClient.VISION_MODEL}'")
            if AIClient.TEXT_MODEL not in [m.split(':')[0] for m in model_names]:
                print(f"[!] Warning: '{AIClient.TEXT_MODEL}' model not found. Run 'ollama pull {AIClient.TEXT_MODEL}'")
        else:
            print(f"[-] Ollama returned status {resp.status_code}")
    except Exception as e:
        print(f"[-] Connection Failed: {e}")
        print("[!] Backend will use HEURISTIC FALLBACKS for now.")

    # 3. Test AIClient Fallback logic
    print("\n[~] Testing AIClient Fallback Logic...")
    insight = AIClient.generate_insight("Apple", 95, 0, 0, 25)
    print(f"[+] Fallback Insight check: {insight[:50]}...")
    
    analysis = AIClient.get_heuristic_food_analysis("Test Food")
    if analysis.get('is_fallback'):
        print("[+] Heuristic Fallback confirmed active.")

    print("\n=== Test Complete ===")

if __name__ == "__main__":
    test_connectivity()
