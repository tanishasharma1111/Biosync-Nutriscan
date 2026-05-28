import os
import json

class SkinClassifier:
    def __init__(self, model_path):
        import torch
        import torch.nn as nn
        from torchvision import models, transforms
        
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.class_names = ['akiec', 'bcc', 'bkl', 'df', 'mel', 'nv', 'vasc']
        self.concern_map = {
            'akiec': 'Pre-cancerous Sun Damage (Akiec)',
            'bcc': 'Potential Basal Cell Carcinoma',
            'bkl': 'Benign Skin Lesion / Aging',
            'df': 'Dermatofibroma (Benign Spot)',
            'mel': 'High Risk: Potential Melanoma',
            'nv': 'Common Mole (Nevus)',
            'vasc': 'Vascular Lesion / Redness'
        }
        
        self.model = self._load_model(model_path)
        self.model.eval()
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

    def _load_model(self, model_path):
        import torch
        import torch.nn as nn
        from torchvision import models
        
        # Initialize EfficientNet B0 base
        model = models.efficientnet_b0(weights=None)
        # Modify classifier to match 7 classes
        num_ftrs = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(num_ftrs, len(self.class_names))
        
        if not os.path.exists(model_path):
            print(f"Warning: Model path {model_path} not found. Using uninitialized model.")
            return model.to(self.device)

        try:
            checkpoint = torch.load(model_path, map_location=self.device, weights_only=True)
            state_dict = checkpoint.get('model_state', checkpoint)
            
            # Remove 'backbone.' prefix if present
            new_state_dict = {}
            for k, v in state_dict.items():
                name = k.replace('backbone.', '')
                new_state_dict[name] = v
            
            model.load_state_dict(new_state_dict, strict=False)
            print(f"Loaded model from {model_path}")
            
            if 'class_names' in checkpoint:
                self.class_names = checkpoint['class_names']
                
        except Exception as e:
            print(f"Error loading model weights: {e}")
            
        return model.to(self.device)

    def predict(self, image_path):
        import torch
        from PIL import Image
        
        if not os.path.exists(image_path):
            return "error", 0.0, "File not found"
            
        try:
            img = Image.open(image_path).convert('RGB')
            img_tensor = self.transform(img).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                outputs = self.model(img_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
                
            confidence, index = torch.max(probabilities, 0)
            class_id = self.class_names[index]
            concern = self.concern_map.get(class_id, class_id)
            
            return class_id, confidence.item(), concern
        except Exception as e:
            print(f"Prediction error: {e}")
            return "error", 0.0, str(e)

# Singleton instance for the app
_classifier = None

def predict_skin_concern(image_path):
    global _classifier
    if _classifier is None:
        print("Initializing Skin ML Model (this may take a few seconds on first run)...")
        model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'checkpoint_best.pth')
        _classifier = SkinClassifier(model_path)
    
    return _classifier.predict(image_path)

